'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import Groq from "groq-sdk"
import {
  titanProfiles,
  athleteProfiles,
  getTitanById,
  type TitanProfile,
  type AthleteProfile,
} from "@/lib/titans-db"
import {
  assessFeasibility,
  buildTitanContextForPrompt,
  type FeasibilityInput,
  type ObjectiveType,
} from "@/lib/feasibility"
import { sanitizeDayLabel } from "@/lib/plan-utils"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

type Message = { role: 'user' | 'assistant'; content: string }

/**
 * Extract a structured grit/capacity/time snapshot from the audit conversation.
 * Used to feed the feasibility engine before plan generation.
 */
function extractAuditMetrics(chatHistory: Message[]): {
  gritScore: number
  trainingDaysPerWeek: number
  hoursPerSession: number
  sleepHoursAvg: number
  nutritionCompliance: number
  objectiveKeyword: string
  weeksAvailable: number
} {
  const fullText = chatHistory.map(m => m.content).join(' ').toLowerCase()

  // Grit score heuristic: infer from keywords (not only gym-centric)
  let gritScore = 50
  if (/cedimento|failure|kill|everything|tutto|mamba|goggins|massimo|limite|sofferenza|pain/.test(fullText)) gritScore = 85
  else if (/volume|ripetiz|maniac|kobelike|lavoro|sempre|costanza|disciplina/.test(fullText)) gritScore = 75
  else if (/moderato|pace|rilassato|calmo|steady|sostenibile|tranquillo/.test(fullText)) gritScore = 40

  // Days/week
  const daysMatch = fullText.match(/(\d)\s*(giorni|days|volte|sessions)\s*(a|per|\/)\s*(settimana|week)/)
  const trainingDaysPerWeek = daysMatch ? Math.min(7, parseInt(daysMatch[1])) : 3

  // Session duration heuristic
  const hoursMatch = fullText.match(/(\d+\.?\d*)\s*(ore|hours?|h\b)/)
  const hoursPerSession = hoursMatch ? Math.min(3, parseFloat(hoursMatch[1])) : 1

  // Sleep
  const sleepMatch = fullText.match(/(\d)\s*(ore|hours?)\s*(di\s*)?(sonno|sleep)/)
  const sleepHoursAvg = sleepMatch ? parseInt(sleepMatch[1]) : 7

  // Nutrition compliance keyword heuristic
  let nutritionCompliance = 60
  if (/dieta|nutrition|macro|preciso|ottimizzat|tracct|pesato|grammi/.test(fullText)) nutritionCompliance = 80
  else if (/casual|libero|senza|minimal|ignore|pasticcio/.test(fullText)) nutritionCompliance = 30

  // Objective keyword (last user message about goals)
  const goalMessage = chatHistory.findLast(m => m.role === 'user')?.content.toLowerCase() ?? ''
  const objectiveKeyword = goalMessage.slice(0, 80)

  // Weeks available heuristic
  const weeksMatch = fullText.match(/(\d+)\s*(settimane|weeks)/)
  const weeksAvailable = weeksMatch ? Math.min(52, parseInt(weeksMatch[1])) : 16

  return { gritScore, trainingDaysPerWeek, hoursPerSession, sleepHoursAvg, nutritionCompliance, objectiveKeyword, weeksAvailable }
}

/**
 * Fase 1: AUDIT PSICOFISICO
 * REI agisce come Head Coach per capire Grit, Capacity e Time.
 */
export async function chatPlanWizard(messages: Message[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id }
  })

  const systemPrompt = `Sei l'APEX Performance Synthesizer. Il tuo compito è sottoporre l'atleta a un AUDIT PROFESSIONALE per generare un protocollo d'élite.

PROFILO UTENTE (IMPORTANTE):
- Sesso: ${profile?.biologicalSex ?? 'N/D'}
- Età: ${profile?.ageYears ?? 'N/D'} anni
- Sport Primario: ${profile?.primarySport ?? 'N/D'}
- Livello Esperienza: ${profile?.experienceLevel ?? 'N/D'}
- Routine Quotidiana: ${profile?.dailyRoutine ?? 'N/D'}
- Infortuni: ${profile?.injuriesList?.join(', ') || 'Nessuno'}

IL TUO OBIETTIVO (Audit in 3 aree):
1. **AUDIT MENTALE (GRIT)**: Capisci la determinazione. Se l'utente non fa palestra (es. vuole solo dimagrire o corre), NON fare domande su massimali di panca. Chiedi della sua costanza, della sua capacità di gestire la fatica nel SUO sport o nella vita quotidiana.
2. **AUDIT FISICO (CAPACITY)**: Valuta la tolleranza al carico basandoti sulla sua routine (es. se sta 10 ore al PC, avrà problemi posturali/mobilità).
3. **LOGISTICA (TIME SYNC)**: Capisci quanto tempo reale può dedicare considerando il suo stile di vita sedentario o attivo.

REGOLE DI DIALOGO:
- Sintonizzati sullo SPORT dell'utente. Se l'utente è sedentario e vuole dimagrire, il tuo tono deve essere incoraggiante ma fermo, senza usare gergo da bodybuilding estremo.
- NON dare nulla per scontato (es. accesso in palestra). Chiedi se ha attrezzatura o se si allena a casa.
- Sii tecnico come un head coach olimpico, ma ADATTATO all'interlocutore.
- Termina con ###READY### solo quando hai una mappa chiara di Grit, Capacity e Time.`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  return { response: response.choices[0]?.message?.content ?? '' }
}

/**
 * Fase 2: GENERAZIONE SINTETIZZATA
 * Combina i metodi dei Titani in base all'audit.
 */
export async function generatePlanFromWizard(chatHistory: Message[], planType: 'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY') {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  const latestBiometric = await prisma.biometricLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' }
  })
  const activeInjuries = await prisma.injury.findMany({
    where: { userId, status: { not: 'RESOLVED' } }
  })

  const conversationSummary = chatHistory.map(m => `${m.role === 'user' ? 'ATLETA' : 'COACH'}: ${m.content}`).join('\n')

  const bfPct = latestBiometric?.fatPct ?? profile?.bodyFatPct
  const weightKg = latestBiometric?.weightKg ?? profile?.weightKg
  const leanMass = (weightKg && bfPct) ? Math.round(weightKg * (1 - bfPct / 100) * 10) / 10 : null

  // ── Feasibility Engine ────────────────────────────────────────────────────
  const auditMetrics = extractAuditMetrics(chatHistory)

  // Infer objective type from conversation
  const objText = auditMetrics.objectiveKeyword
  let detectedObjectiveType: ObjectiveType = 'CUSTOM'
  if (/maratona|marathon|corsa|running|10k|5k|gara/.test(objText)) detectedObjectiveType = 'RACE_PREP'
  else if (/forza|squat|deadlift|strength|powerlifting/.test(objText)) detectedObjectiveType = 'STRENGTH'
  else if (/muscolo|ipertrofia|massa|hypertrophy|bodybuilding/.test(objText)) detectedObjectiveType = 'HYPERTROPHY'
  else if (/dimagr|grasso|peso|weight loss|fat|perdita/.test(objText)) detectedObjectiveType = 'WEIGHT_LOSS'
  else if (/calcio|football|soccer|sport/.test(objText)) detectedObjectiveType = 'SPORT_PERFORMANCE'
  else if (/endurance|aerobic|ciclismo|cycling|triathlon/.test(objText)) detectedObjectiveType = 'ENDURANCE'
  else if (/infortun|rehab|dolore|prevenzione/.test(objText)) detectedObjectiveType = 'INJURY_PREVENTION'
  else if (/ricomposi|body recomp/.test(objText)) detectedObjectiveType = 'BODY_RECOMPOSITION'

  // Determine if gym access is likely based on profile and audit
  const hasGymAccess = profile?.equipmentLevel === 'GYM' || 
                       profile?.primarySport === 'PALESTRA' || 
                       /palestra|gym|pesi|macchine/.test(conversationSummary.toLowerCase())

  const feasibilityInput: FeasibilityInput = {
    objectiveType: detectedObjectiveType,
    objectiveDescription: auditMetrics.objectiveKeyword,
    weeksAvailable: auditMetrics.weeksAvailable,
    experienceYears: profile?.trainingYears ?? 0,
    trainingDaysPerWeek: auditMetrics.trainingDaysPerWeek,
    hoursPerSession: auditMetrics.hoursPerSession,
    gritScore: auditMetrics.gritScore,
    ageYears: profile?.ageYears ?? undefined,
    biologicalSex: (profile?.biologicalSex as 'male' | 'female' | 'other' | undefined) ?? undefined,
    bodyFatPct: bfPct ?? undefined,
    weightKg: weightKg ?? undefined,
    activeInjuries: activeInjuries.map(i => i.district ?? '').filter(Boolean),
    sleepHoursAvg: auditMetrics.sleepHoursAvg,
    nutritionCompliance: auditMetrics.nutritionCompliance,
    hasGymAccess,
  }

  const feasibility = assessFeasibility(feasibilityInput)
  const titanContext = buildTitanContextForPrompt(feasibility)

  const systemPrompt = `Sei l'APEX Performance Synthesizer. Analizza l'Audit Psicofisico e genera 3 proposte di protocollo SINTETIZZATE dai metodi dei Titani.

PROFILO ATLETA REALE:
- Sesso: ${profile?.biologicalSex ?? 'N/D'}, Età: ${profile?.ageYears ?? 'N/D'} anni
- Peso: ${weightKg ?? 'N/D'} kg, BF%: ${bfPct ?? 'N/D'}%
- Sport principale: ${profile?.primarySport || 'non specificato'}
- Livello: ${profile?.experienceLevel || 'beginner'}
- Routine: ${profile?.dailyRoutine || 'N/D'}
- Infortuni: ${activeInjuries.map(i => i.district).join(', ') || 'nessuno'}
- Accesso Palestra: ${hasGymAccess ? 'SÌ' : 'NO (Allenamento a casa/outdoor richiesto)'}

CONVERSAZIONE DI AUDIT:
${conversationSummary}

${titanContext}

REGOLE DI SINTESI (Genera 3 opzioni):
1. **COERENZA TOTALE**: Se l'utente non ha accesso alla palestra o il suo sport è il running/sedentario, NON proporre esercizi con bilancieri pesanti. Usa corpo libero, corsa, camminata o esercizi posturali.
2. **VOLUME REALISTICO**: Per un utente sedentario (es. 10h al PC), non proporre piani estenuanti da 6 giorni. Inizia gradualmente (2-3 giorni).
3. **FUSIONE TITANI**: Ogni proposta DEVE dichiarare la sintesi con i nomi reali dei Titani forniti nel contesto sopra.
4. **OBIETTIVI**: Definisci obiettivi (goals) coerenti. Se hai rilevato squilibri (es. "forza bassa quadricipiti"), NON bloccare la generazione, ma inserisci esercizi correttivi nel piano e spiega perché nella "strategy".
5. **VOLUME ESERCIZI OBBLIGATORIO**: ogni giornata "plan" DEVE contenere MINIMO 5 esercizi e MASSIMO 20. MAI meno di 5.
6. **FORMATO RIGIDO**: Restituisci SEMPRE un JSON valido. Se mancano dati per un obiettivo (es. targetValue), usa valori sensati basati sul profilo (es. peso attuale + 2kg).
7. **DAYLABEL OBBLIGATORIO**: Il campo "dayLabel" di ogni giornata DEVE essere ESCLUSIVAMENTE uno di questi valori: "A", "B", "C", "D", "V1", "V2", "OUTDOOR". MAI usare "E", "F", "G" o altri valori. Per 5 giorni usa: A, B, C, D, V1. Per 6 giorni: A, B, C, D, V1, V2. Per 7 giorni: A, B, C, D, V1, V2, OUTDOOR.

Genera ESATTAMENTE questo JSON (tu genera 3 proposte, tutti i giorni, minimo 5 esercizi ciascuno):
{
  "goals": [
    {
      "id": "goal_1",
      "type": "STRENGTH|HYPERTROPHY|ENDURANCE|WEIGHT_LOSS|WEIGHT_GAIN|BODY_RECOMPOSITION|SPORT_PERFORMANCE|RACE_PREP|MOBILITY|INJURY_PREVENTION|CUSTOM",
      "sport": "PALESTRA|SOCCER|RUNNING|WALKING|...",
      "description": "descrizione specifica",
      "targetValue": 75.0,
      "currentValue": 80.0,
      "unit": "kg",
      "targetDate": "2026-06-01",
      "priority": 1
    }
  ],
  "proposals": [
    {
      "id": 1,
      "name": "Nome Sintesi",
      "strategy": "Perché questi Titani? Come aiutano un utente con questa routine specifica?",
      "pros": ["Pro 1", "Pro 2"], "cons": ["Con 1"],
      "isRecommended": true,
      "planType": "${planType}",
      "trainingDays": [1, 3, 5],
      "weeksTotal": 4,
      "mesocycle": {
        "name": "Nome mesociclo",
        "objectives": "Obiettivi sintetizzati",
        "plan": [
          {
            "dayLabel": "A",
            "IMPORTANT_dayLabel_MUST_BE_ONE_OF": ["A","B","C","D","V1","V2","OUTDOOR"],
            "focus": "Focus della giornata",
            "exercises": [
              { "name": "Esercizio", "sets": 3, "repsMin": 8, "repsMax": 12, "targetRir": 2, "restSec": 90, "notes": "Nota tecnica" }
            ]
          }
        ]
      },
      "nutritionPlan": {
        "kcalTarget": 2200,
        "proteinGPerKg": 1.8,
        "carbsGPerKg": 2.5,
        "fatGPerKg": 0.8,
        "strategy": "Strategia nutrizionale"
      }
    }
  ]
}`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    })

    const data = JSON.parse(response.choices[0]?.message?.content || "{}")

    // Validazione minima post-generazione per evitare crash DB
    if (!data.goals || !data.proposals) {
       console.error("AI returned incomplete JSON structure", data)
       return null
    }

    // Salvataggio Obiettivi
    if (data.goals?.length) {
      // Filtra goal senza campi obbligatori
      const validGoals = data.goals.filter((g: any) => g.type && g.description)
      
      if (validGoals.length > 0) {
        await prisma.athleteGoal.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false }
        })
        await prisma.athleteGoal.createMany({
          data: validGoals.map((g: any) => ({
            userId,
            type: g.type,
            sport: g.sport || null,
            description: g.description,
            targetValue: typeof g.targetValue === 'number' ? g.targetValue : null,
            currentValue: typeof g.currentValue === 'number' ? g.currentValue : null,
            unit: g.unit || '',
            targetDate: g.targetDate ? new Date(g.targetDate) : null,
          })),
        })
      }
    }

    // Salvataggio Proposte come mesociclo DRAFT
    if (data.proposals?.length) {
      // Pulisci i dati delle proposte per sicurezza
      const cleanedProposals = data.proposals.map((p: any) => ({
        ...p,
        planType: p.planType || planType,
        trainingDays: Array.isArray(p.trainingDays) ? p.trainingDays : [1, 3, 5],
        // Sanitize dayLabels so AI-generated "E","F","G" etc. never reach the DB
        mesocycle: p.mesocycle ? {
          ...p.mesocycle,
          plan: Array.isArray(p.mesocycle.plan)
            ? p.mesocycle.plan.map((day: any, idx: number) => ({
                ...day,
                dayLabel: sanitizeDayLabel(day.dayLabel, idx),
              }))
            : [],
        } : p.mesocycle,
      }))

      await prisma.mesocycle.updateMany({
        where: { userId, status: 'DRAFT' },
        data: { status: 'ARCHIVED' }
      })
      await prisma.mesocycle.create({
        data: {
          userId,
          name: 'Proposte Strategiche AI',
          startDate: new Date(),
          status: 'DRAFT',
          aiProposals: cleanedProposals,
        }
      })
    }

    // Mark onboarding complete — only after the plan was successfully saved
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    })

    revalidatePath('/plan')
    return { success: true }
  } catch (e: any) {
    console.error('[generatePlanFromWizard]', e)
    return null
  }
}

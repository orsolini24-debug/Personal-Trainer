'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

type Message = { role: 'user' | 'assistant'; content: string }

export async function chatPlanWizard(messages: Message[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id }
  })

  const systemPrompt = `Sei un Performance Planner AI di élite specializzato in pianificazione atletica multisport.
Il tuo compito è raccogliere tutte le informazioni necessarie per costruire un piano personalizzato.

PROFILO ATLETA ATTUALE:
- Sesso: ${profile?.biologicalSex ?? 'non noto'}
- Età: ${profile?.ageYears ?? 'non nota'} anni
- Peso: ${profile?.weightKg ?? 'non noto'} kg
- Sport principali: ${(profile?.mainSports ?? []).join(', ') || 'non specificati'}
- Livello esperienza: ${profile?.experienceLevel ?? 'non noto'}
- Giorni disponibili: ${profile?.availableDays ?? 'non specificati'}/settimana
- Durata sessione: ${profile?.sessionDuration ?? 'non specificata'} min
- Infortuni: ${profile?.injuriesList?.join(', ') || 'nessuno'}

COSA DEVI RACCOGLIERE (in modo conversazionale, non come questionario):
1. OBIETTIVI MULTIPLI: possono essere combinati (es: "voglio dimagrire ma anche migliorare nel calcio e aumentare la forza")
   - Obiettivo fisico (composizione corporea, forza, ipertrofia, resistenza)
   - Obiettivo sportivo (performance in uno o più sport, gare specifiche)
   - Obiettivo di salute (prevenzione infortuni, mobilità, energia)
   - PRIORITÀ tra gli obiettivi

2. SPORT E CALENDARIO GARE:
   - Tutti gli sport praticati, frequenza settimanale di ognuno
   - Gare/eventi in calendario con DATE precise
   - Livello (amatoriale, agonistico, professionistico)

3. TIPO DI PIANO DESIDERATO:
   - Solo allenamento, solo alimentazione, o entrambi

4. METRICHE ATTUALI SE NON NEL PROFILO:
   - 1RM o stima per esercizi base (panca, squat, stacco, OHP)
   - VO2max se noto, FTP se ciclista, pace se runner
   - Peso attuale e obiettivo se body comp è un goal

5. LIMITAZIONI E PREFERENZE:
   - Infortuni attuali o cronici (oltre a quelli nel profilo)
   - Attrezzatura disponibile
   - Preferenze di allenamento

TONO: parla come un coach esperto, non come un robot. Usa un linguaggio diretto e professionale.
Fai domande aperte e follow-up intelligenti basate sulle risposte.
NON fare domande già presenti nel profilo a meno che non siano incomplete.

Quando hai raccolto TUTTE le informazioni necessarie, termina il tuo ultimo messaggio con:
###READY###

NON aggiungere mai ###READY### prima di aver compreso TUTTI i goal, sport, date gare e tipo di piano.`

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

export async function generatePlanFromWizard(chatHistory: Message[], planType: 'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY') {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  const activeInjuries = await prisma.injury.findMany({
    where: { userId, status: { not: 'RESOLVED' } }
  })

  const conversationSummary = chatHistory.map(m => `${m.role === 'user' ? 'ATLETA' : 'COACH'}: ${m.content}`).join('\n')

  const systemPrompt = `Sei un Performance Planner AI. Analizza la conversazione e genera 3 proposte di mesociclo.

PROFILO:
- Sport: ${(profile?.mainSports ?? []).join(', ')}
- Peso: ${profile?.weightKg}kg, Età: ${profile?.ageYears}
- Giorni: ${profile?.availableDays}/sett, Durata: ${profile?.sessionDuration}min
- Infortuni attivi: ${activeInjuries.map(i => i.district).join(', ') || 'nessuno'}
- Tipo piano: ${planType}

CONVERSAZIONE DI INTAKE:
${conversationSummary}

Genera ESATTAMENTE questo JSON (nient'altro):
{
  "goals": [
    {
      "type": "STRENGTH|HYPERTROPHY|ENDURANCE|WEIGHT_LOSS|WEIGHT_GAIN|BODY_RECOMPOSITION|SPORT_PERFORMANCE|RACE_PREP|MOBILITY|INJURY_PREVENTION|NUTRITION_ONLY|TRAINING_ONLY|CUSTOM",
      "sport": "PALESTRA|SOCCER|RUNNING|...(SportType enum o null)",
      "description": "descrizione specifica e misurabile",
      "targetValue": 100.0,
      "currentValue": 80.0,
      "unit": "kg",
      "targetDate": "2026-06-01",
      "priority": 1
    }
  ],
  "proposals": [
    {
      "name": "Nome Strategia (es: Forza + Performance Calcio)",
      "strategy": "Descrizione strategica di 2-3 frasi. Cita metodi di allenamento specifici: periodizzazione (lineare, DUP, blocchi), progressione dei carichi (RIR-based per Mike Israetel, ACWR per Banister), principi di overreaching controllato.",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"],
      "isRecommended": true,
      "planType": "${planType}",
      "trainingDays": [1, 3, 5, 6],
      "weeksTotal": 4,
      "mesocycle": {
        "name": "Nome mesociclo",
        "objectives": "Obiettivi tecnici dettagliati con metodi accademici citati",
        "kpi": { "primaryGoal": "descrizione KPI principale", "secondaryGoals": [] },
        "plan": [
          {
            "dayLabel": "A",
            "focus": "Lower Body — Forza/Ipertrofia",
            "exercises": [
              {
                "name": "Nome Esercizio",
                "sets": 4,
                "repsMin": 4,
                "repsMax": 6,
                "targetRir": 2,
                "restSec": 180,
                "notes": "Nota tecnica specifica, progressione prevista"
              }
            ]
          }
        ]
      },
      "nutritionPlan": {
        "kcalTarget": 2400,
        "proteinGPerKg": 2.0,
        "carbsGPerKg": 3.5,
        "fatGPerKg": 1.0,
        "strategy": "Descrizione strategia nutrizionale con riferimento a metodi (p. es. carb periodization, nutrient timing)"
      }
    }
  ]
}`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.3,
      max_tokens: 4000,
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return { error: 'Parse error' }

    const data = JSON.parse(match[0])

    // Save goals
    if (data.goals?.length) {
      await prisma.athleteGoal.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      })
      await prisma.athleteGoal.createMany({
        data: data.goals.map((g: { type: string; sport: string; description: string; targetValue: number; currentValue: number; unit: string; targetDate: string; priority: number }, i: number) => ({
          userId,
          type: g.type,
          sport: g.sport || null,
          description: g.description,
          targetValue: g.targetValue,
          currentValue: g.currentValue,
          unit: g.unit,
          targetDate: g.targetDate ? new Date(g.targetDate) : null,
          priority: g.priority ?? (i + 1),
          isActive: true,
        }))
      })
    }

    // Create draft mesocycle with proposals
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 28)

    await prisma.mesocycle.create({
      data: {
        userId,
        name: `Piano ${new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`,
        startDate: today,
        endDate,
        status: 'DRAFT',
        aiProposals: data.proposals,
        generatedFor: data.goals,
        planType,
      }
    })

    return { success: true }
  } catch (e) {
    return { error: String(e) }
  }
}

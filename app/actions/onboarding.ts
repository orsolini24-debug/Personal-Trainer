'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Groq from 'groq-sdk'
import { SessionType, SportType } from '@prisma/client'

export interface OnboardingData {
  // Step 1
  biologicalSex: string
  ageYears: number
  weightKg: number
  heightCm: number
  // Step 2
  experienceLevel: string
  trainingYears: number
  strengthRefs: { squat1RM?: number; bench1RM?: number; deadlift1RM?: number; ohp1RM?: number }
  // Step 3
  primaryGoal: string
  secondarySports: string[]
  mainSports: string[]
  sportLevels: Record<string, string>
  targetEvent?: string
  // Step 4
  availableDays: number
  sessionDuration: number
  equipmentLevel: string
  preferredSplit: string
  // Step 5
  injuriesList: string[]
  dietaryRestrictions: string[]
  supplementsUsed: string[]
}

// ── Salva profilo + genera piano ──────────────────────────────────────────────
export async function completeOnboarding(data: OnboardingData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  // 1. Upsert UserProfile
  await prisma.$transaction([
    prisma.userProfile.upsert({
      where: { userId },
      update: {
        biologicalSex: data.biologicalSex,
        ageYears: data.ageYears,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        experienceLevel: data.experienceLevel,
        trainingYears: data.trainingYears,
        strengthRefs: data.strengthRefs,
        primaryGoal: data.primaryGoal,
        mainSports: data.mainSports as SportType[],
        sportLevels: data.sportLevels,
        targetEvent: data.targetEvent ?? null,
        availableDays: data.availableDays,
        sessionDuration: data.sessionDuration,
        equipmentLevel: data.equipmentLevel,
        preferredSplit: data.preferredSplit,
        injuriesList: data.injuriesList,
        onboardingCompleted: true,
      },
      create: {
        userId,
        biologicalSex: data.biologicalSex,
        ageYears: data.ageYears,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        experienceLevel: data.experienceLevel,
        trainingYears: data.trainingYears,
        strengthRefs: data.strengthRefs,
        primaryGoal: data.primaryGoal,
        mainSports: data.mainSports as SportType[],
        sportLevels: data.sportLevels,
        targetEvent: data.targetEvent ?? null,
        availableDays: data.availableDays,
        sessionDuration: data.sessionDuration,
        equipmentLevel: data.equipmentLevel,
        preferredSplit: data.preferredSplit,
        injuriesList: data.injuriesList,
        onboardingCompleted: true,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true }
    })
  ])

  // 2. Crea infortuni come record Injury se presenti
  if (data.injuriesList.length > 0) {
    // Non sovrascrivere infortuni esistenti, crea solo se non ci sono
    const existingCount = await prisma.injury.count({ where: { userId } })
    if (existingCount === 0) {
      await prisma.injury.createMany({
        data: data.injuriesList.map(desc => ({
          userId,
          district: 'CORE' as const, // placeholder — il coach può raffinare
          description: desc,
          startDate: new Date(),
          status: 'ACTIVE' as const,
        })),
      })
    }
  }

  // 3. Genera piano AI
  const planResult = await generateAIPlan(userId, data)
  if ('error' in planResult) {
    // Onboarding completato anche se piano fallisce — mostra errore separato
    revalidatePath('/plan')
    return { success: true, planError: planResult.error }
  }

  revalidatePath('/plan')
  revalidatePath('/dashboard')
  return { success: true, mesocycleId: planResult.mesocycleId }
}

// ── Genera piano periodizzato via AI ─────────────────────────────────────────
export async function generateAIPlan(userId: string, profile: OnboardingData) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

  const TDEE = computeTDEE(profile)

  const prompt = `Sei un preparatore atletico d'élite con 30 anni di esperienza.
Genera un piano di allenamento periodizzato di 4 settimane (Mesociclo 1) per questo atleta.

## Profilo Atleta
- Sesso: ${profile.biologicalSex}, Età: ${profile.ageYears} anni
- Peso: ${profile.weightKg} kg, Altezza: ${profile.heightCm} cm
- Livello: ${profile.experienceLevel} (${profile.trainingYears} anni di allenamento)
- Obiettivo: ${profile.primaryGoal}
- Sport principali (DNA Sportivo): ${profile.mainSports.join(', ') || 'Nessuno'}
- Livelli sportivi: ${JSON.stringify(profile.sportLevels)}
- Sport secondari: ${profile.secondarySports.join(', ') || 'Nessuno'}
- Target/Evento: ${profile.targetEvent || 'Nessuno'}
- Giorni disponibili: ${profile.availableDays}/settimana
- Durata sessione: ${profile.sessionDuration} minuti
- Attrezzatura: ${profile.equipmentLevel}
- Split preferito: ${profile.preferredSplit}
- Infortuni/Limitazioni: ${profile.injuriesList.join('; ') || 'Nessuno'}
- Restrizioni alimentari: ${profile.dietaryRestrictions.join(', ') || 'Nessuna'}
- Supplementi: ${profile.supplementsUsed.join(', ') || 'Nessuno'}
- Forze di riferimento (stima 1RM): Squat=${profile.strengthRefs.squat1RM ?? 'N/D'} kg, Panca=${profile.strengthRefs.bench1RM ?? 'N/D'} kg, Stacco=${profile.strengthRefs.deadlift1RM ?? 'N/D'} kg, Military=${profile.strengthRefs.ohp1RM ?? 'N/D'} kg

## Istruzioni
Rispondi SOLO con un JSON valido. Nessun testo prima o dopo. 
Il piano deve essere COMPLEMENTARE agli sport principali dell'atleta. Se gioca a calcio o padel, non eccedere col volume sulle gambe nei giorni vicini alle partite.
Se l'atleta punta alla performance sportiva, seleziona esercizi funzionali al suo sport DNA.

Schema esatto:
{
  "mesocycle": {
    "name": "...",
    "durationWeeks": 4,
    "objectives": "...",
    "progressionLogic": "...",
    "deloadWeek": "..."
  },
  "plan": {
    "name": "...",
    "sessionTypes": ["A","B","C"],
    "weeklySchedule": { "1": "A", "2": "B", "3": "off", "4": "C", "5": "off", "6": "off", "0": "off" }
  },
  "sessions": [
    {
      "type": "A",
      "focus": "...",
      "exercises": [
        {
          "name": "...",
          "sets": 4,
          "repsMin": 6,
          "repsMax": 10,
          "targetRir": 2,
          "restSec": 180,
          "notes": "..."
        }
      ]
    }
  ],
  "nutrition": {
    "trainingDayKcal": 2500,
    "restDayKcal": 2000,
    "proteinG": 160,
    "carbsTrainingG": 300,
    "carbsRestG": 150,
    "fatG": 70,
    "mealTiming": "...",
    "supplementProtocol": "..."
  },
  "weeklyProgression": {
    "week1": "...",
    "week2": "...",
    "week3": "...",
    "week4": "..."
  }
}`

  let rawJson = ''
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 4000,
      stream: false,
    })
    rawJson = completion.choices[0]?.message?.content ?? ''
  } catch (e) {
    return { error: `Errore AI: ${e}` }
  }

  // Estrai JSON dalla risposta (rimuovi eventuali blocchi markdown)
  const jsonMatch = rawJson.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { error: 'Il modello non ha restituito un JSON valido' }

  let plan: any
  try {
    plan = JSON.parse(jsonMatch[0])
  } catch {
    return { error: 'JSON malformato dal modello' }
  }

  // Salva su DB
  try {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + plan.mesocycle.durationWeeks * 7)

    // Disattiva mesocicli precedenti
    await prisma.mesocycle.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'ARCHIVED' },
    })

    const meso = await prisma.mesocycle.create({
      data: {
        userId,
        name: plan.mesocycle.name,
        startDate,
        endDate,
        objectives: plan.mesocycle.objectives,
        kpi: {
          progressionLogic: plan.mesocycle.progressionLogic,
          deloadWeek: plan.mesocycle.deloadWeek,
          weeklyProgression: plan.weeklyProgression,
          nutrition: plan.nutrition,
        },
        status: 'ACTIVE',
      },
    })

    // Crea WorkoutPlan
    const sessionTypes = (plan.plan.sessionTypes ?? ['A', 'B', 'C']) as string[]
    const schedule = plan.plan.weeklySchedule as Record<string, string>
    const trainingDays = Object.entries(schedule)
      .filter(([, v]) => v !== 'off')
      .map(([k]) => parseInt(k))

    const workoutPlan = await prisma.workoutPlan.create({
      data: {
        userId,
        mesocycleId: meso.id,
        name: plan.plan.name,
        description: plan.mesocycle.objectives,
        goal: profile.primaryGoal,
        weeksTotal: plan.mesocycle.durationWeeks,
        daysPerWeek: profile.availableDays,
        trainingDays,
        source: 'AI_GENERATED',
        isActive: true,
      },
    })

    // Crea PlanDay per ogni sessione
    const planDayMap: Record<string, string> = {} // type → planDayId
    for (let i = 0; i < plan.sessions.length; i++) {
      const s = plan.sessions[i]
      const sessionType = s.type as SessionType

      const planDay = await prisma.planDay.create({
        data: {
          planId: workoutPlan.id,
          dayLabel: sessionType,
          focus: s.focus ?? '',
          orderIndex: i,
        },
      })
      planDayMap[s.type] = planDay.id

      // Crea PlanExercise
      await prisma.planExercise.createMany({
        data: (s.exercises ?? []).map((ex: any, idx: number) => ({
          planDayId: planDay.id,
          name: ex.name,
          orderIndex: idx,
          sets: ex.sets ?? 3,
          repsMin: ex.repsMin ?? 8,
          repsMax: ex.repsMax ?? 12,
          targetRir: ex.targetRir ?? 2,
          restSec: ex.restSec ?? 120,
          notes: ex.notes ?? null,
        })),
      })
    }

    // Crea PlannedSession per 4 settimane
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const plannedData: Array<{
      userId: string; planId: string; planDayId: string
      scheduledDate: Date; status: 'PENDING' | 'SKIPPED'
    }> = []
    const seen = new Set<string>()

    for (let d = 0; d < plan.mesocycle.durationWeeks * 7; d++) {
      const date = new Date(today)
      date.setUTCDate(date.getUTCDate() + d)
      const dow = date.getUTCDay().toString()
      const sType = schedule[dow]
      if (!sType || sType === 'off') continue
      const planDayId = planDayMap[sType]
      if (!planDayId) continue
      const key = date.toISOString().slice(0, 10)
      if (seen.has(key)) continue
      seen.add(key)
      plannedData.push({
        userId,
        planId: workoutPlan.id,
        planDayId,
        scheduledDate: date,
        status: 'PENDING',
      })
    }

    await prisma.plannedSession.createMany({
      data: plannedData,
      skipDuplicates: true,
    })

    // Crea target nutrizionali per 4 settimane
    const nutritionData: Array<{
      userId: string; date: Date; kcalTarget: number
      proteinG: number; carbsG: number; fatG: number; isTrainingDay: boolean
    }> = []
    const trainingDowSet = new Set(trainingDays.map(String))
    for (let d = 0; d < plan.mesocycle.durationWeeks * 7; d++) {
      const date = new Date(today)
      date.setUTCDate(date.getUTCDate() + d)
      const dow = date.getUTCDay().toString()
      const isTraining = trainingDowSet.has(dow)
      nutritionData.push({
        userId,
        date,
        kcalTarget: isTraining ? plan.nutrition.trainingDayKcal : plan.nutrition.restDayKcal,
        proteinG: plan.nutrition.proteinG,
        carbsG: isTraining ? plan.nutrition.carbsTrainingG : plan.nutrition.carbsRestG,
        fatG: plan.nutrition.fatG,
        isTrainingDay: isTraining,
      })
    }
    await prisma.nutritionDay.createMany({ data: nutritionData, skipDuplicates: true })

    return { success: true, mesocycleId: meso.id }
  } catch (e) {
    return { error: `Errore salvataggio DB: ${e}` }
  }
}

// ── TDEE Mifflin-St Jeor ─────────────────────────────────────────────────────
function computeTDEE(p: OnboardingData): number {
  const bmr = p.biologicalSex === 'MALE'
    ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears + 5
    : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears - 161
  // Activity multiplier based on days/week
  const mult = p.availableDays <= 2 ? 1.375 : p.availableDays <= 4 ? 1.55 : 1.725
  return Math.round(bmr * mult)
}

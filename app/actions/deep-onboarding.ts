'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Groq from 'groq-sdk'
import { SportType, MesoStatus, SessionType } from '@prisma/client'
import { titanProfiles, getTitansForObjective } from '@/lib/titans-db'

export interface DeepOnboardingData {
  biologicalSex: string
  ageYears: number
  weightKg: number
  heightCm: number
  bodyFatPct?: number
  leanMassKg?: number
  hasProfessionalData: boolean
  primarySport: SportType
  mainSports: SportType[]
  sportLevels: Record<string, string>
  runningData?: any
  technicalSportData?: any
  experienceLevel: string
  trainingYears: number
  strengthRefs: any
  primaryGoal: string
  isFollowingPlan: boolean
  currentPlanText?: string
  targetEvent?: string
  dietaryType: string
  eatingRoutine: { mealsPerDay: number; snacks: boolean; intermittentFasting: boolean }
  favoriteFoods: string[]
  dislikedFoods: string[]
  allergies: string[]
  dailyRoutine: string
  availableDays: number
  sessionDuration: number
  equipmentLevel: string
  preferredSplit: string
  injuriesList: string[]
}

export async function completeDeepOnboarding(data: DeepOnboardingData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  try {
    const profileData = {
      biologicalSex: data.biologicalSex,
      ageYears: data.ageYears,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      hasProfessionalData: !!data.hasProfessionalData,
      primarySport: data.primarySport,
      mainSports: data.mainSports,
      sportLevels: data.sportLevels || {},
      experienceLevel: data.experienceLevel,
      trainingYears: data.trainingYears,
      strengthRefs: data.strengthRefs || {},
      primaryGoal: data.primaryGoal,
      isFollowingPlan: !!data.isFollowingPlan,
      currentPlanText: data.currentPlanText || "",
      targetEvent: data.targetEvent || "",
      dietaryType: data.dietaryType,
      eatingRoutine: data.eatingRoutine,
      favoriteFoods: data.favoriteFoods || [],
      dislikedFoods: data.dislikedFoods || [],
      allergies: data.allergies || [],
      dailyRoutine: data.dailyRoutine || "",
      availableDays: data.availableDays,
      sessionDuration: data.sessionDuration,
      equipmentLevel: data.equipmentLevel,
      preferredSplit: data.preferredSplit,
      injuriesList: data.injuriesList || [],
      onboardingCompleted: true,
    }

    await prisma.$transaction([
      prisma.userProfile.upsert({
        where: { userId },
        update: profileData,
        create: {
          ...profileData,
          user: { connect: { id: userId } }
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true }
      })
    ])

    revalidatePath('/plan')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    console.error("Deep Onboarding Error:", e)
    return { error: e.message }
  }
}

export async function generateAITripleProposal() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  if (!profile) throw new Error("Profile not found")

  // Select relevant Titans based on objective and sport
  const relevantTitans = getTitansForObjective(profile.primaryGoal || 'fitness')
    .concat(getTitansForObjective(profile.primarySport || 'palestra'))
    .slice(0, 8) // Max 8 to keep prompt size manageable
  
  // Dedup by ID
  const uniqueTitans = Array.from(new Set(relevantTitans.map(t => t.id)))
    .map(id => relevantTitans.find(t => t.id === id))

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

  const prompt = `Sei un preparatore atletico d'élite. Genera 3 proposte di Mesociclo basate su una FUSIONE LOGICA e SINFRETICA delle metodologie dei "Titani" forniti.
  
  LIBRERIA TITANI DISPONIBILE PER QUESTO ATLETA:
  ${JSON.stringify(uniqueTitans.map(t => ({ 
    id: t?.id, 
    name: t?.name, 
    discipline: t?.discipline, 
    principles: t?.methodology.observablePrinciples,
    loadRules: t?.load.rules
  })), null, 2)}

  DATI ATLETA:
  ${JSON.stringify({
    goal: profile.primaryGoal,
    sport: profile.primarySport,
    experience: profile.experienceLevel,
    equipment: profile.equipmentLevel,
    availability: profile.availableDays,
    duration: profile.sessionDuration,
    injuries: profile.injuriesList,
    routine: profile.dailyRoutine
  }, null, 2)}
  
  REGOLE TECNICHE DI GENERAZIONE:
  1. HYBRID FUSION: Non limitarti a 1 o 2 Titani. Se l'atleta è multisport o ha obiettivi complessi (es. Forza + Endurance + Longevità), fondi TUTTE le metodologie necessarie (anche 5 o più) in un'unica visione coerente. 
  2. SINERGIA LOGICA: La fusione deve avere senso fisiologico. Ad esempio, usa la Zona 2 di Attia/San Millán come base, ma integra la forza esplosiva di Bosco o la mobilità di McGill se il profilo lo richiede.
  3. ADATTAMENTO REALE: Rispetta rigorosamente l'attrezzatura e la routine quotidiana dell'atleta.
  4. QUALITÀ ASSOLUTA: La programmazione risultante deve essere la migliore possibile, bilanciata per evitare interferenze negative tra sistemi energetici.
  
  FORMATO JSON RICHIESTO:
  {
    "proposals": [
      {
        "id": 1,
        "name": "Nome Strategia (es. 'Apex Hybrid: Longevità, Forza & Endurance')",
        "titanIds": ["P51", "P18", "P48", "P34", "P06"], // Includi TUTTI i Titani usati per la fusione
        "strategy": "Spiegazione tecnica della sinergia creata tra i diversi Titani",
        "pros": [], "cons": [],
        "isRecommended": true,
        "mesocycle": {
          "name": "...",
          "objectives": "...",
          "plan": [
            { "dayLabel": "A", "focus": "...", "exercises": [{ "name": "...", "sets": 3, "repsMin": 8, "repsMax": 12, "targetRir": 2, "restSec": 90, "notes": "..." }] }
          ]
        },
        "nutritionPlan": {
          "trainingDayKcal": 2000,
          "enduranceDayKcal": 2200,
          "restDayKcal": 1800,
          "macros": { "p": 120, "c": 200, "f": 60 },
          "strategy": "..."
        }
      }
    ]
  }`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    })

    const res = JSON.parse(completion.choices[0].message.content || "{}")
    const draft = await prisma.mesocycle.create({
      data: {
        userId,
        name: "Proposte Strategiche AI",
        startDate: new Date(),
        status: MesoStatus.DRAFT,
        aiProposals: res.proposals
      }
    })

    revalidatePath('/plan')
    return { success: true, draftId: draft.id, proposals: res.proposals }
  } catch (e: any) {
    console.error("Proposal Generation Error:", e)
    return { success: false, error: e.message }
  }
}

export async function selectProposal(mesoId: string, optionId: number) {
  try {
    const meso = await prisma.mesocycle.findUnique({ where: { id: mesoId } })
    if (!meso || !meso.aiProposals) throw new Error("Draft not found")

    const proposals = (meso.aiProposals as any)
    const selected = proposals.find((p: any) => p.id === optionId)
    if (!selected) throw new Error("Option not found")

    await prisma.$transaction(async (tx) => {
      await tx.mesocycle.updateMany({
        where: { userId: meso.userId, status: MesoStatus.ACTIVE },
        data: { status: MesoStatus.ARCHIVED }
      })

      await tx.mesocycle.update({
        where: { id: mesoId },
        data: {
          name: selected.mesocycle.name,
          objectives: selected.mesocycle.objectives,
          status: MesoStatus.ACTIVE,
          chosenOption: optionId
        }
      })

      const workoutPlan = await tx.workoutPlan.create({
        data: {
          userId: meso.userId,
          mesocycleId: mesoId,
          name: selected.mesocycle.name,
          goal: selected.mesocycle.objectives,
          source: 'AI_GENERATED',
          isActive: true,
        }
      })

      for (let i = 0; i < selected.mesocycle.plan.length; i++) {
        const day = selected.mesocycle.plan[i]
        const pDay = await tx.planDay.create({
          data: {
            planId: workoutPlan.id,
            dayLabel: (day.dayLabel || 'A') as SessionType,
            focus: day.focus,
            orderIndex: i,
          }
        })

        await tx.planExercise.createMany({
          data: day.exercises.map((ex: any, idx: number) => ({
            planDayId: pDay.id,
            name: ex.name,
            orderIndex: idx,
            sets: Number(ex.sets) || 3,
            repsMin: Number(ex.repsMin) || 8,
            repsMax: Number(ex.repsMax) || 12,
            targetRir: Number(ex.targetRir) || 2,
            restSec: Number(ex.restSec) || 90,
            notes: ex.notes || "",
          }))
        })
      }

      // Nutrition setup...
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const nutritionData = Array.from({length: 28}, (_, d) => {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() + d);
        return {
          userId: meso.userId,
          date,
          kcalTarget: Number(selected.nutritionPlan.trainingDayKcal) || 2500,
          proteinG: Number(selected.nutritionPlan.macros?.p) || 150,
          carbsG: Number(selected.nutritionPlan.macros?.c) || 250,
          fatG: Number(selected.nutritionPlan.macros?.f) || 70,
          isTrainingDay: d % 2 === 0,
        }
      })
      if (nutritionData.length > 0) {
        await tx.nutritionDay.createMany({ data: nutritionData, skipDuplicates: true }).catch(() => {})
      }
    })

    revalidatePath('/plan')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: (e as Error).message }
  }
}

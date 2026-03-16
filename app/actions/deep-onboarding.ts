'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Groq from 'groq-sdk'
import { SportType, MesoStatus, SessionType } from '@prisma/client'

export interface DeepOnboardingData {
  // Bio & Body Comp
  biologicalSex: string
  ageYears: number
  weightKg: number
  heightCm: number
  bodyFatPct?: number
  leanMassKg?: number
  bodyMeasurements?: { waist?: number; hips?: number; chest?: number; arm?: number; thigh?: number }
  hasProfessionalData: boolean

  // Sport DNA
  primarySport: SportType
  mainSports: SportType[]
  sportLevels: Record<string, string>
  runningData?: { avgPace?: string; maxDistance?: number; pb5k?: string; pb10k?: string }
  technicalSportData?: { level?: string; frequency?: number; specificGoals?: string }

  // Experience
  experienceLevel: string
  trainingYears: number
  strengthRefs: { squat1RM?: number; bench1RM?: number; deadlift1RM?: number; ohp1RM?: number }

  // Status
  primaryGoal: string
  isFollowingPlan: boolean
  currentPlanText?: string
  targetEvent?: string

  // Nutrition
  dietaryType: string
  eatingRoutine: { mealsPerDay: number; snacks: boolean; intermittentFasting: boolean }
  favoriteFoods: string[]
  dislikedFoods: string[]
  allergies: string[]
  dailyRoutine: string

  // Logistics
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
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        biologicalSex: data.biologicalSex,
        ageYears: data.ageYears,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        bodyFatPct: data.bodyFatPct,
        leanMassKg: data.leanMassKg,
        bodyMeasurements: data.bodyMeasurements,
        hasProfessionalData: data.hasProfessionalData,
        primarySport: data.primarySport,
        mainSports: data.mainSports,
        sportLevels: data.sportLevels,
        runningData: data.runningData,
        technicalSportData: data.technicalSportData,
        experienceLevel: data.experienceLevel,
        trainingYears: data.trainingYears,
        strengthRefs: data.strengthRefs,
        primaryGoal: data.primaryGoal,
        isFollowingPlan: data.isFollowingPlan,
        currentPlanText: data.currentPlanText,
        targetEvent: data.targetEvent,
        dietaryType: data.dietaryType,
        eatingRoutine: data.eatingRoutine,
        favoriteFoods: data.favoriteFoods,
        dislikedFoods: data.dislikedFoods,
        allergies: data.allergies,
        dailyRoutine: data.dailyRoutine,
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
        bodyFatPct: data.bodyFatPct,
        leanMassKg: data.leanMassKg,
        bodyMeasurements: data.bodyMeasurements,
        hasProfessionalData: data.hasProfessionalData,
        primarySport: data.primarySport,
        mainSports: data.mainSports,
        sportLevels: data.sportLevels,
        runningData: data.runningData,
        technicalSportData: data.technicalSportData,
        experienceLevel: data.experienceLevel,
        trainingYears: data.trainingYears,
        strengthRefs: data.strengthRefs,
        primaryGoal: data.primaryGoal,
        isFollowingPlan: data.isFollowingPlan,
        currentPlanText: data.currentPlanText,
        targetEvent: data.targetEvent,
        dietaryType: data.dietaryType,
        eatingRoutine: data.eatingRoutine,
        favoriteFoods: data.favoriteFoods,
        dislikedFoods: data.dislikedFoods,
        allergies: data.allergies,
        dailyRoutine: data.dailyRoutine,
        availableDays: data.availableDays,
        sessionDuration: data.sessionDuration,
        equipmentLevel: data.equipmentLevel,
        preferredSplit: data.preferredSplit,
        injuriesList: data.injuriesList,
        onboardingCompleted: true,
      },
    })

    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error("Deep Onboarding Error:", e)
    return { error: `Errore salvataggio profilo: ${e.message}` }
  }
}

export async function generateAITripleProposal() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  if (!profile) throw new Error("Profile not found")

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

  const prompt = `Sei un preparatore atletico e nutrizionista d'élite.
Analizza il profilo profondo dell'atleta e genera 3 proposte strategiche di Mesociclo (4 settimane) e Piano Alimentare.

Dati Atleta:
${JSON.stringify(profile, null, 2)}

Obiettivo: Generare un JSON con 3 proposte diverse:
1. "CONSERVATIVA": Focus su salute articolare, basi tecniche, longevità e sostenibilità.
2. "PERFORMANCE": Focus aggressivo sull'obiettivo primario, carichi pesanti o volumi alti, picco di forma.
3. "IBRIDA (CONSIGLIATA)": Il miglior bilanciamento tra sport primario (DNA) e potenziamento in palestra.

Struttura JSON richiesta:
{
  "proposals": [
    {
      "id": 1,
      "name": "Titolo Strategia",
      "strategy": "Spiegazione approfondita della filosofia (perché questo piano?)",
      "pros": ["Vantaggio 1", "..."],
      "cons": ["Svantaggio 1", "..."],
      "isRecommended": boolean,
      "mesocycle": {
         "name": "Nome del Mesociclo",
         "objectives": "Obiettivi tecnici e atletici",
         "plan": [
            {
              "dayLabel": "A",
              "focus": "Focus della sessione",
              "exercises": [
                { "name": "...", "sets": 3, "repsMin": 8, "repsMax": 12, "targetRir": 2, "restSec": 90, "notes": "..." }
              ]
            }
         ]
      },
      "nutritionPlan": {
         "philosophy": "Approccio nutrizionale (es. High Carb, Cycling, etc.)",
         "trainingDayKcal": number,
         "restDayKcal": number,
         "macros": { "p": number, "c": number, "f": number },
         "tips": "Consigli specifici basati sui cibi preferiti/odiati dell'atleta"
      }
    }
  ]
}

REGOLE:
- Rispondi SOLO col JSON.
- Se l'atleta ha infortuni, adatta gli esercizi.
- Se l'atleta ha uno sport primario (es. Padel), il piano deve migliorare la performance in quello sport.
- Usa i cibi preferiti dell'atleta nei consigli nutrizionali.
`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    })

    const res = JSON.parse(completion.choices[0].message.content || "{}")
    
    // Create draft
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
    console.error("AI Proposal Error:", e)
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
      // 1. Archive current active ones
      await tx.mesocycle.updateMany({
        where: { userId: meso.userId, status: MesoStatus.ACTIVE },
        data: { status: MesoStatus.ARCHIVED }
      })

      // 2. Activate this meso
      await tx.mesocycle.update({
        where: { id: mesoId },
        data: {
          name: selected.mesocycle.name,
          objectives: selected.mesocycle.objectives,
          status: MesoStatus.ACTIVE,
          chosenOption: optionId
        }
      })

      // 3. Create WorkoutPlan
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

      // 4. Create Days and Exercises
      for (let i = 0; i < selected.mesocycle.plan.length; i++) {
        const day = selected.mesocycle.plan[i]
        const pDay = await tx.planDay.create({
          data: {
            planId: workoutPlan.id,
            dayLabel: day.dayLabel as SessionType,
            focus: day.focus,
            orderIndex: i,
          }
        })

        await tx.planExercise.createMany({
          data: day.exercises.map((ex: any, idx: number) => ({
            planDayId: pDay.id,
            name: ex.name,
            orderIndex: idx,
            sets: ex.sets,
            repsMin: ex.repsMin,
            repsMax: ex.repsMax,
            targetRir: ex.targetRir,
            restSec: ex.restSec,
            notes: ex.notes,
          }))
        })
      }

      // 5. Setup Nutrition for 4 weeks based on the selected plan
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const nutritionData: any[] = []
      
      const trainingDaysSet = new Set(selected.mesocycle.plan.map((d: any) => d.dayLabel))

      for (let d = 0; d < 28; d++) {
        const date = new Date(today)
        date.setUTCDate(date.getUTCDate() + d)
        // This logic is simplified - ideally we use the weekly schedule from AI
        // For now, let's assume if it has a label, it's a training day in order
        const isTraining = d % 2 === 0 // Mock logic: every other day
        
        nutritionData.push({
          userId: meso.userId,
          date,
          kcalTarget: isTraining ? selected.nutritionPlan.trainingDayKcal : selected.nutritionPlan.restDayKcal,
          proteinG: selected.nutritionPlan.macros.p,
          carbsG: isTraining ? selected.nutritionPlan.macros.c : (selected.nutritionPlan.macros.c * 0.6),
          fatG: selected.nutritionPlan.macros.f,
          isTrainingDay: isTraining
        })
      }
      
      await tx.nutritionDay.createMany({
        data: nutritionData,
        skipDuplicates: true
      })
    })

    revalidatePath('/plan')
    revalidatePath('/nutrition')
    return { success: true }
  } catch (e: any) {
    console.error("Select Proposal Error:", e)
    return { success: false, error: e.message }
  }
}

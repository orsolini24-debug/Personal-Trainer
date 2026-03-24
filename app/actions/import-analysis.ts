"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import Groq from "groq-sdk"
import { MesoStatus, SessionType } from "@prisma/client"
import { importNutritionPlanFromText, parseNutritionPlanFromText, type NutritionPlanData } from "./import-nutrition"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing"
})

export type SmartImportResult = 
  | { 
      success: true; 
      importedTraining: boolean; 
      importedNutrition: boolean; 
      trainingError: string | null; 
      nutritionError: string | null;
      error?: never;
    }
  | { 
      success: false; 
      error: string; 
      importedTraining?: never; 
      importedNutrition?: never; 
      trainingError?: never; 
      nutritionError?: never;
    };

export async function analyzeAndImportPlanSmart(text: string): Promise<SmartImportResult> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  try {
    // Singola chiamata leggera per rilevare il tipo di contenuto
    const detectPrompt = `Analizza questo testo e rispondi SOLO con JSON:
{"containsTraining": true/false, "containsNutrition": true/false}
- containsTraining = true se ci sono esercizi, serie, ripetizioni, split A/B/C
- containsNutrition = true se ci sono pasti, calorie, macronutrienti, grammature`

    const detection = await groq.chat.completions.create({
      messages: [{ role: "user", content: detectPrompt + "\n\nTesto:\n" + text.slice(0, 1500) }],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 60,
      response_format: { type: "json_object" }
    })

    const rawDetect = detection.choices[0]?.message?.content || "{}"
    console.log("[IMPORT] detection raw:", rawDetect)
    const { containsTraining, containsNutrition } = JSON.parse(rawDetect)
    console.log("[IMPORT] containsTraining:", containsTraining, "containsNutrition:", containsNutrition)

    let trainingRes = null
    let nutritionData: NutritionPlanData | null = null

    if (containsNutrition) {
      nutritionData = await parseNutritionPlanFromText(text)
      console.log("[IMPORT] nutritionData parsed:", !!nutritionData)
    }

    if (containsTraining) {
      // Se abbiamo sia training che nutrition, passiamo nutritionData ad analyzeAndImportPlan
      trainingRes = await analyzeAndImportPlan(text, nutritionData || undefined)
      console.log("[IMPORT] trainingRes:", JSON.stringify(trainingRes))
    } else if (containsNutrition && nutritionData) {
      // Solo nutrizione via smart import -> usiamo la action dedicata che crea NUTRITION_ONLY
      const res = await importNutritionPlanFromText(text)
      return {
        success: true,
        importedTraining: false,
        importedNutrition: !!res.success,
        trainingError: null,
        nutritionError: !res.success ? (res as any).error : null
      }
    }

    return {
      success: true,
      importedTraining: !!(containsTraining && trainingRes?.success),
      importedNutrition: !!(containsNutrition && nutritionData),
      trainingError: trainingRes && !trainingRes.success ? trainingRes.error : null,
      nutritionError: (containsNutrition && !nutritionData) ? "Errore parsing nutrizione" : null
    }
  } catch (error: any) {
    console.error("[IMPORT] Smart import error:", error)
    return { success: false, error: error.message }
  }
}

export async function analyzeAndImportPlan(text: string, nutritionData?: NutritionPlanData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  try {
    const systemPrompt = `Sei un esperto preparatore atletico. Hai ricevuto il testo di un piano di allenamento esistente di un atleta.
Il tuo compito è analizzare il testo, estrarre la struttura e trasformarla in un JSON rigoroso per il database.

STRUTTURA JSON RICHIESTA:
{
  "name": "Nome del Mesociclo (estratto o inventato se manca)",
  "objectives": "Obiettivi del piano",
  "plan": [
    {
      "dayLabel": "A",
      "focus": "Focus della sessione (es. Upper Body)",
      "exercises": [
        { "name": "Nome", "sets": 3, "repsMin": 8, "repsMax": 12, "targetRir": 2, "restSec": 90, "notes": "..." }
      ]
    }
  ]
}

REGOLE:
- Se il testo è disordinato, usa la tua conoscenza per dedurre set/reps/rir logici.
- Genera i giorni di allenamento trovati (A, B, C...).
- Ritorna SOLO il JSON.`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analizza questo piano: ${text}` }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })

    const planData = JSON.parse(completion.choices[0]?.message?.content || "{}")
    console.log("[IMPORT] planData.name:", planData.name, "plan days:", planData.plan?.length)

    // Inizia transazione DB
    const result = await prisma.$transaction(async (tx) => {
      // 1. Archivia precedenti (allenamento e dieta)
      await tx.mesocycle.updateMany({
        where: { userId, status: MesoStatus.ACTIVE },
        data: { status: MesoStatus.ARCHIVED }
      })

      // 2. Crea Meso
      const meso = await tx.mesocycle.create({
        data: {
          userId,
          name: planData.name || nutritionData?.name || "Piano Importato",
          startDate: new Date(),
          objectives: planData.objectives || nutritionData?.strategy,
          status: MesoStatus.ACTIVE,
          planType: nutritionData ? 'FULL' : 'TRAINING_ONLY',
          kpi: nutritionData ? {
            kcalTarget: nutritionData.kcalTarget,
            proteinG: nutritionData.proteinG,
            carbsG: nutritionData.carbsG,
            fatG: nutritionData.fatG,
            meals: nutritionData.meals,
            guidelines: nutritionData.guidelines,
            rawText: nutritionData.rawText,
          } : undefined,
        }
      })

      // Calcola trainingDays di default in base al numero di giornate (A, B, C...)
      const numDays = planData.plan?.length || 3
      let trainingDays = [1, 3, 5] // Default per 3 giorni
      if (numDays === 1) trainingDays = [1]
      else if (numDays === 2) trainingDays = [1, 4]
      else if (numDays === 4) trainingDays = [1, 2, 4, 5]
      else if (numDays === 5) trainingDays = [1, 2, 4, 5, 6]
      else if (numDays >= 6) trainingDays = [1, 2, 3, 4, 5, 6]

      // 3. Crea WorkoutPlan
      const workoutPlan = await tx.workoutPlan.create({
        data: {
          userId,
          mesocycleId: meso.id,
          name: planData.name || nutritionData?.name || "Piano Importato",
          goal: planData.objectives || nutritionData?.strategy,
          source: 'IMPORTED',
          isActive: true,
          trainingDays,
          daysPerWeek: numDays,
        }
      })

      // 4. Crea Giorni ed Esercizi
      if (planData.plan && Array.isArray(planData.plan)) {
        for (let i = 0; i < planData.plan.length; i++) {
          const day = planData.plan[i]
          const pDay = await tx.planDay.create({
            data: {
              planId: workoutPlan.id,
              dayLabel: (day.dayLabel || "A") as SessionType,
              focus: day.focus,
              orderIndex: i,
            }
          })

          if (day.exercises && Array.isArray(day.exercises)) {
            await tx.planExercise.createMany({
              data: day.exercises.map((ex: any, idx: number) => ({
                planDayId: pDay.id,
                name: ex.name,
                orderIndex: idx,
                sets: parseInt(ex.sets) || 3,
                repsMin: parseInt(ex.repsMin) || 8,
                repsMax: parseInt(ex.repsMax) || 12,
                targetRir: parseInt(ex.targetRir) || 2,
                restSec: parseInt(ex.restSec) || 90,
                notes: ex.notes || "",
              }))
            })
          }
        }
      }

      return meso
    })

    // Segna onboarding completato
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true }
    })

    revalidatePath("/plan")
    return { success: true, data: result }
  } catch (error: any) {
    console.error("Import error:", error)
    return { success: false, error: error.message }
  }
}

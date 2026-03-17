"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import Groq from "groq-sdk"
import { MesoStatus, SessionType } from "@prisma/client"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing"
})

export async function analyzeAndImportPlan(text: string) {
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
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    const planData = JSON.parse(completion.choices[0]?.message?.content || "{}")

    // Inizia transazione DB
    const result = await prisma.$transaction(async (tx) => {
      // 1. Archivia precedenti
      await tx.mesocycle.updateMany({
        where: { userId, status: MesoStatus.ACTIVE },
        data: { status: MesoStatus.ARCHIVED }
      })

      // 2. Crea Meso
      const meso = await tx.mesocycle.create({
        data: {
          userId,
          name: planData.name || "Piano Importato",
          startDate: new Date(),
          objectives: planData.objectives,
          status: MesoStatus.ACTIVE,
        }
      })

      // 3. Crea WorkoutPlan
      const workoutPlan = await tx.workoutPlan.create({
        data: {
          userId,
          mesocycleId: meso.id,
          name: planData.name || "Piano Importato",
          goal: planData.objectives,
          source: 'IMPORTED',
          isActive: true,
        }
      })

      // 4. Crea Giorni ed Esercizi
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

      return meso
    })

    revalidatePath("/plan")
    return { success: true, data: result }
  } catch (error: any) {
    console.error("Import error:", error)
    return { success: false, error: error.message }
  }
}

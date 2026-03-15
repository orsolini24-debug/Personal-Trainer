"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing"
})

export async function generateAIPlan() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { user: true }
    })

    if (!profile) throw new Error("Profilo non trovato. Completa l'onboarding.")

    const systemPrompt = `Sei un esperto preparatore atletico (strength & conditioning coach).
Il tuo compito è generare un PIANO DI ALLENAMENTO (Mesociclo di 4 settimane) in formato JSON rigoroso.

Dati Utente:
- Obiettivo: ${profile.primaryGoal}
- Livello: ${profile.experienceLevel} (${profile.trainingYears} anni esperienza)
- Disponibilità: ${profile.availableDays} giorni/settimana
- Durata sessione: ${profile.sessionDuration} min
- Attrezzatura: ${profile.equipmentLevel}
- Infortuni/Limitazioni: ${profile.injuriesList.join(', ') || 'Nessuna'}

REGOLE JSON:
Ritorna SOLO un oggetto JSON con questa struttura esatta:
{
  "name": "Nome del Mesociclo",
  "objectives": "Descrizione obiettivi",
  "plan": [
    {
      "dayLabel": "A",
      "focus": "Descrizione focus (es. Upper Body)",
      "exercises": [
        { "name": "Nome Esercizio", "sets": 3, "repsMin": 8, "repsMax": 12, "targetRir": 2, "restSec": 90, "notes": "note" }
      ]
    }
  ]
}
Genera esattamente ${profile.availableDays} giorni di allenamento (dayLabel: A, B, C...).
Non includere testo prima o dopo il JSON.`

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
    })

    const content = completion.choices[0]?.message?.content || ""
    const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1)
    const planData = JSON.parse(jsonStr)

    // DB TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Mesocycle
      const meso = await tx.mesocycle.create({
        data: {
          userId,
          name: planData.name,
          startDate: new Date(),
          objectives: planData.objectives,
          isActive: true,
        }
      })

      // 2. Create WorkoutPlan
      const workoutPlan = await tx.workoutPlan.create({
        data: {
          userId,
          mesocycleId: meso.id,
          name: planData.name,
          goal: profile.primaryGoal,
          daysPerWeek: profile.availableDays || 3,
          source: 'AI_GENERATED',
        }
      })

      // 3. Create Days and Exercises
      for (let i = 0; i < planData.plan.length; i++) {
        const day = planData.plan[i]
        const pDay = await tx.planDay.create({
          data: {
            planId: workoutPlan.id,
            dayLabel: day.dayLabel,
            focus: day.focus,
            orderIndex: i,
          }
        })

        await tx.planExercise.createMany({
          data: day.exercises.map((ex: any, idx: number) => ({
            planDayId: pDay.id,
            name: ex.name,
            orderIndex: idx,
            sets: ex.sets || 3,
            repsMin: ex.repsMin || 8,
            repsMax: ex.repsMax || 12,
            targetRir: ex.targetRir || 2,
            restSec: ex.restSec || 90,
            notes: ex.notes || "",
          }))
        })
      }

      return meso
    })

    revalidatePath("/plan")
    return { success: true, data: result }
  } catch (error: any) {
    console.error("AI Plan Error:", error)
    return { success: false, error: error.message }
  }
}

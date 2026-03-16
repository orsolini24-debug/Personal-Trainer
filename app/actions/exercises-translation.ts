"use server"

import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"
import { revalidatePath } from "next/cache"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing"
})

export async function translateExercisesBatch(limit: number = 50) {
  try {
    const exercises = await prisma.exerciseDefinition.findMany({
      where: { nameIt: null },
      take: limit
    })

    if (exercises.length === 0) return { success: true, count: 0 }

    const exercisesList = exercises.map(ex => ({ id: ex.id, name: ex.name, desc: ex.description }))

    const prompt = `Sei un esperto personal trainer italiano. Traduci e arricchisci i seguenti esercizi in italiano.
Ritorna un array JSON di oggetti con questa struttura:
{ "id": "id dell'esercizio", "nameIt": "nome in italiano", "descriptionIt": "spiegazione tecnica dettagliata", "movementType": "uno tra PUSH, PULL, SQUAT, HINGE, LUNGE, CARRY, ISOLATION, CORE, OTHER", "tipsIt": "consigli per l'esecuzione" }

Esercizi:
${JSON.stringify(exercisesList)}`

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    })

    const response = JSON.parse(completion.choices[0]?.message?.content || "{}")
    const translatedArray = response.exercises || response.translations || Object.values(response)[0]

    if (!Array.isArray(translatedArray)) {
        console.log("Response is not an array:", response)
        throw new Error("Formato risposta AI non valido")
    }

    let updated = 0
    for (const item of translatedArray) {
      try {
        await prisma.exerciseDefinition.update({
          where: { id: item.id },
          data: {
            nameIt: item.nameIt,
            descriptionIt: item.descriptionIt,
            tipsIt: item.tipsIt,
            movementType: item.movementType as any,
          }
        })
        updated++
      } catch (e) {
        console.error(`Error updating exercise ${item.id}:`, e)
      }
    }

    revalidatePath("/training/library")
    return { success: true, count: updated }
  } catch (error: any) {
    console.error("Translation error:", error)
    return { success: false, error: error.message }
  }
}

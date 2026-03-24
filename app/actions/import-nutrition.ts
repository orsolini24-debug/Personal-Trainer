'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"
import { revalidatePath } from "next/cache"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export interface NutritionPlanData {
  name: string
  kcalTarget: number
  proteinG: number
  carbsG: number
  fatG: number
  strategy: string
  meals: {
    name: string
    timeHint: string
    kcal: number
    foods: string[]
    notes?: string
  }[]
  guidelines: string[]
  rawText: string
}

const EXTRACT_PROMPT = `Sei un nutrizionista esperto. Analizza questo piano alimentare e restituisci SOLO JSON (nient'altro):
{
  "name": "Nome del piano o 'Piano Alimentare Personalizzato'",
  "kcalTarget": 2400,
  "proteinG": 180,
  "carbsG": 280,
  "fatG": 80,
  "strategy": "Descrizione della strategia nutrizionale in 1-2 frasi",
  "meals": [
    {
      "name": "Colazione",
      "timeHint": "07:00",
      "kcal": 500,
      "foods": ["Avena 80g", "Latte 200ml", "Banana 1"],
      "notes": "Eventuale nota"
    }
  ],
  "guidelines": ["Linea guida 1", "Linea guida 2"],
  "rawText": "testo originale estratto"
}`

async function parseWithAI(text: string): Promise<NutritionPlanData | null> {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
    const raw = response.choices[0]?.message?.content ?? ''
    return JSON.parse(raw) as NutritionPlanData
  } catch (error) {
    console.error("parseWithAI error:", error)
    return null
  }
}

async function parseImageWithAI(base64: string, mimeType: string): Promise<NutritionPlanData | null> {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACT_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
    const raw = response.choices[0]?.message?.content ?? ''
    return JSON.parse(raw) as NutritionPlanData
  } catch (error) {
    console.error("parseImageWithAI error:", error)
    return null
  }
}

export async function importNutritionPlanFromText(text: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  const data = await parseWithAI(text)
  if (!data) return { error: 'Impossibile analizzare il piano alimentare. Controlla il testo e riprova.' }

  await saveNutritionPlan(userId, data)
  revalidatePath('/plan')
  return { success: true, data }
}

export async function importNutritionPlanFromImage(base64: string, mimeType: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  const data = await parseImageWithAI(base64, mimeType)
  if (!data) return { error: 'Impossibile leggere il piano dall\'immagine. Prova con un\'immagine più nitida.' }

  await saveNutritionPlan(userId, data)
  revalidatePath('/plan')
  return { success: true, data }
}

async function saveNutritionPlan(userId: string, data: NutritionPlanData) {
  // Deactivate existing nutrition plan
  await prisma.mesocycle.updateMany({
    where: { userId, planType: 'NUTRITION_ONLY', status: 'ACTIVE' },
    data: { status: 'ARCHIVED' }
  })

  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 30)

  await prisma.mesocycle.create({
    data: {
      userId,
      name: data.name,
      startDate: today,
      endDate,
      status: 'ACTIVE',
      planType: 'NUTRITION_ONLY',
      objectives: data.strategy,
      kpi: {
        kcalTarget: data.kcalTarget,
        proteinG: data.proteinG,
        carbsG: data.carbsG,
        fatG: data.fatG,
        meals: data.meals,
        guidelines: data.guidelines,
        rawText: data.rawText,
      },
    }
  })
}

export async function deleteNutritionPlan(mesoId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }

  await prisma.mesocycle.update({
    where: { id: mesoId, userId: session.user.id },
    data: { status: 'ARCHIVED' }
  })
  revalidatePath('/plan')
  return { success: true }
}

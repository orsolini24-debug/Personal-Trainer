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

const EXTRACT_PROMPT = `Sei un nutrizionista esperto. Analizza questo piano alimentare e restituisci SOLO JSON valido (nessun markdown, nessun testo aggiuntivo):
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
  "rawText": "sintesi del piano (max 300 caratteri)"
}`

function safeJsonParse(raw: string): NutritionPlanData | null {
  try {
    // Strip markdown code fences if model added them despite instructions
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    // Validate required numeric fields
    if (typeof parsed.kcalTarget !== 'number' || !Array.isArray(parsed.meals)) {
      console.error('[import-nutrition] Invalid structure — missing kcalTarget or meals:', Object.keys(parsed))
      return null
    }
    // Truncate rawText to prevent DB bloat
    if (typeof parsed.rawText === 'string' && parsed.rawText.length > 500) {
      parsed.rawText = parsed.rawText.slice(0, 500) + '…'
    }
    return parsed as NutritionPlanData
  } catch (e) {
    console.error('[import-nutrition] JSON parse error:', e, '\nRaw:', raw.slice(0, 200))
    return null
  }
}

export async function parseNutritionPlanFromText(text: string): Promise<NutritionPlanData | null> {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: text.slice(0, 8000) } // cap input to avoid token overflow
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })
    const raw = response.choices[0]?.message?.content ?? ''
    return safeJsonParse(raw)
  } catch (error) {
    console.error('[import-nutrition] parseNutritionPlanFromText error:', error)
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
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })
    const raw = response.choices[0]?.message?.content ?? ''
    return safeJsonParse(raw)
  } catch (error) {
    console.error('[import-nutrition] parseImageWithAI error:', error)
    return null
  }
}

export async function importNutritionPlanFromText(text: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  const data = await parseNutritionPlanFromText(text)
  if (!data) return { error: 'Impossibile analizzare il piano alimentare. Controlla il testo e riprova.' }

  try {
    await saveNutritionPlan(userId, data)
    await prisma.user.update({ where: { id: userId }, data: { onboardingCompleted: true } })
    revalidatePath('/plan')
    return { success: true, data }
  } catch (e: any) {
    console.error('[import-nutrition] save error (text):', e)
    return { error: 'Errore nel salvataggio del piano. Riprova.' }
  }
}

export async function importNutritionPlanFromImage(base64: string, mimeType: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  const data = await parseImageWithAI(base64, mimeType)
  if (!data) return { error: "Impossibile leggere il piano dall'immagine. Prova con un'immagine più nitida." }

  try {
    await saveNutritionPlan(userId, data)
    await prisma.user.update({ where: { id: userId }, data: { onboardingCompleted: true } })
    revalidatePath('/plan')
    return { success: true, data }
  } catch (e: any) {
    console.error('[import-nutrition] save error (image):', e)
    return { error: 'Errore nel salvataggio del piano. Riprova.' }
  }
}

async function saveNutritionPlan(userId: string, data: NutritionPlanData) {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 90) // 90-day mesocycle (standard cycle duration)

  // Wrap in a transaction so archiving + creation are atomic
  await prisma.$transaction(async (tx) => {
    await tx.mesocycle.updateMany({
      where: { userId, planType: 'NUTRITION_ONLY', status: 'ACTIVE' },
      data: { status: 'ARCHIVED' }
    })

    await tx.mesocycle.create({
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

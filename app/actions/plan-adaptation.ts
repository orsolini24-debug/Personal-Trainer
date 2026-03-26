"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "missing" })

export async function getPlanInsights(mesoId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const meso = await prisma.mesocycle.findUnique({
    where: { id: mesoId },
    include: {
      sessions: {
        orderBy: { date: 'desc' },
        take: 10,
        include: { exercises: true }
      },
      workoutPlans: {
        include: {
          planDays: {
            include: { planExercises: true }
          }
        }
      },
      user: { include: { profile: true } }
    }
  })

  if (!meso) throw new Error("Mesociclo non trovato")

  // Se non ci sono sessioni reali, evitiamo di chiamare l'IA per non generare feedback allucinati
  if (meso.sessions.length === 0) {
    return {
      expectedObjectives: [
        "Iniziare il piano di allenamento",
        "Calibrare i carichi della prima settimana",
        "Stabilire una routine costante"
      ],
      nextPhasePreview: "In attesa dei primi dati per proiettare l'evoluzione del mesociclo.",
      currentStatus: "Piano caricato con successo. Inizia la tua prima sessione per sbloccare l'analisi del Coach.",
      adjustments: []
    }
  }

  const prompt = `Sei un Head Coach esperto. Analizza l'andamento del mesociclo attuale e fornisci approfondimenti.
  
  ATLETA: ${JSON.stringify(meso.user.profile)}
  MESOCICLO: ${meso.name} - ${meso.objectives}
  ULTIME SESSIONI REALI: ${JSON.stringify(meso.sessions)}
  PIANO PROGRAMMATO: ${JSON.stringify(meso.workoutPlans[0])}

  Fornisci un JSON con:
  1. "expectedObjectives": Array di stringhe con KPI attesi a fine mese.
  2. "nextPhasePreview": Descrizione di cosa faremo nel prossimo mesociclo e perché.
  3. "currentStatus": Analisi del passo (stiamo andando bene? Troppe sessioni saltate? Carichi in crescita?).
  4. "adjustments": Suggerimenti di modifica (es. "Aumenta panca di 2kg", "Aggiungi 1 set di trazioni").
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    })
    return JSON.parse(completion.choices[0].message.content || "{}")
  } catch (e) {
    console.error("Insights Error:", e)
    return null
  }
}

export async function getExerciseAlternative(exerciseName: string, reason: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })

  const prompt = `L'atleta non può fare "${exerciseName}" perché: "${reason}".
  Attrezzatura disponibile: ${profile?.equipmentLevel ?? 'non specificata'}.
  Infortuni: ${JSON.stringify(profile?.injuriesList ?? [])}.

  Suggerisci 3 esercizi alternativi. Rispondi in JSON con:
  { "alternatives": [{ "name": string, "reason": string, "equipment": string }] }
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    })
    return JSON.parse(completion.choices[0].message.content || '{}')
  } catch (e) {
    console.error('Alternative Error:', e)
    return null
  }
}
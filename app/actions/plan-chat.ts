"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"
import { getTitanById } from "@/lib/titans-db"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "missing" })

export async function chatAboutPlan(mesoId: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const meso = await prisma.mesocycle.findUnique({
    where: { id: mesoId },
    include: {
      user: { include: { profile: true } },
      workoutPlans: {
        include: {
          planDays: {
            include: { planExercises: true }
          }
        }
      }
    }
  })

  if (!meso) throw new Error("Mesociclo non trovato")

  // Determina se stiamo parlando di un Draft (proposte) o di un piano Attivo
  const isDraft = meso.status === 'DRAFT'
  const proposals = isDraft ? (meso.aiProposals as any[]) : []
  const activePlan = meso.workoutPlans[0]

  // Estrae i titanIds coinvolti per caricare le metodologie
  let involvedTitans: string[] = []
  if (isDraft) {
    proposals.forEach(p => {
      if (p.titanIds) involvedTitans.push(...p.titanIds)
    })
  } else if (meso.chosenOption !== null && isDraft) {
     // Caso raro ma possibile
  } else if (!isDraft && meso.aiProposals) {
    const selected = (meso.aiProposals as any[]).find(p => p.id === meso.chosenOption)
    if (selected?.titanIds) involvedTitans.push(...selected.titanIds)
  }
  
  // Dedup e carica info Titani
  const titanDetails = Array.from(new Set(involvedTitans))
    .map(id => getTitanById(id))
    .filter(Boolean)

  const systemPrompt = `Sei l'Head Coach AI di Apex Protocol. Stai discutendo il piano di allenamento con l'atleta.
  
  CONTESTO ATLETA:
  ${JSON.stringify(meso.user.profile)}
  
  PIANO ATTUALE:
  ${isDraft ? "L'utente sta scegliendo tra queste 3 proposte AI:" + JSON.stringify(proposals) : "L'utente ha attivato questo piano:" + JSON.stringify(activePlan)}
  
  METODOLOGIE DEI TITANI COINVOLTI:
  ${JSON.stringify(titanDetails.map(t => ({ name: t?.name, principles: t?.methodology.observablePrinciples })))}

  REGOLE DI RISPOSTA:
  1. Autorevolezza: Rispondi come un coach senior, citando i principi dei Titani coinvolti (es. "Secondo la logica di Peter Attia...").
  2. Precisione: Se l'utente chiede modifiche, spiega se sono coerenti con l'obiettivo o se rischiano di compromettere il piano.
  3. Formato: Usa Markdown. Sii conciso ma tecnico.
  4. Lingua: Rispondi in Italiano.
  `

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ]

    const completion = await groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    })

    return { 
      content: completion.choices[0]?.message?.content || "Non sono riuscito a elaborare una risposta.",
      role: 'assistant'
    }
  } catch (e) {
    return { error: "Errore di connessione con l'AI." }
  }
}

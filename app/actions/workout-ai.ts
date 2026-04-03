'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

export interface WorkoutAIMessage {
  role: 'user' | 'assistant'
  content: string
}

interface WorkoutContext {
  exerciseName: string
  currentSet: number
  totalSets: number
  repsMin: number
  repsMax: number
  targetRir: number
  restSec: number
  lastWeight?: number | null
  lastReps?: number | null
}

export async function askWorkoutAI(
  messages: WorkoutAIMessage[],
  context: WorkoutContext,
  imageBase64?: string | null
): Promise<{ reply: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { reply: '', error: 'Non autorizzato' }

  const [profile, activeInjuries] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { experienceLevel: true, weightKg: true, ageYears: true, biologicalSex: true, injuriesList: true, primaryGoal: true, equipmentLevel: true }
    }),
    prisma.injury.findMany({
      where: { userId: session.user.id, status: { not: 'RESOLVED' } },
      select: { district: true }
    })
  ])

  const dynamicSystemPrompt = `Sei il coach AI di Performance Ecosystem — personal trainer esperto, conciso, diretto.
Rispondi sempre in italiano, max 3-4 frasi (più se serve spiegazione tecnica).

PROFILO ATLETA:
- Livello: ${profile?.experienceLevel ?? 'N/D'}
- Peso: ${profile?.weightKg ?? '?'} kg, Età: ${profile?.ageYears ?? '?'} anni
- Obiettivo principale: ${profile?.primaryGoal ?? 'N/D'}
- Attrezzatura: ${profile?.equipmentLevel ?? 'N/D'}
- Infortuni attivi: ${activeInjuries.map(i => i.district).join(', ') || 'nessuno'}

Se l'utente manda una foto, analizza la tecnica e dai feedback specifici.
Se vuole cambiare esercizio, suggerisci alternative compatibili con la sua attrezzatura e i suoi infortuni.
Usa i dati contestuali della sessione per rispondere in modo pertinente.`

  try {
    const contextBlock = `[CONTESTO SESSIONE]
Esercizio: ${context.exerciseName}
Serie: ${context.currentSet}/${context.totalSets} · ${context.repsMin}-${context.repsMax} reps @RIR${context.targetRir} · Recupero: ${context.restSec}s
${context.lastWeight ? `Ultimo carico: ${context.lastWeight}kg × ${context.lastReps ?? '?'} reps` : 'Prima sessione con questo esercizio'}
[FINE CONTESTO]`

    // Build messages for Groq
    const lastUserMessage = messages[messages.length - 1]

    // If image provided, use vision model for this message
    if (imageBase64 && lastUserMessage?.role === 'user') {
      const res = await groq.chat.completions.create({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          { role: 'system', content: dynamicSystemPrompt + '\n\n' + contextBlock },
          ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          {
            role: 'user',
            content: [
              { type: 'text', text: lastUserMessage.content || 'Analizza la mia tecnica in questa foto.' },
              { type: 'image_url', image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 400,
        temperature: 0.6,
      })
      return { reply: res.choices[0]?.message?.content ?? '' }
    }

    // Text-only conversation
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: dynamicSystemPrompt + '\n\n' + contextBlock },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    return { reply: res.choices[0]?.message?.content ?? '' }
  } catch (err) {
    return { reply: '', error: 'Errore AI. Riprova.' }
  }
}

export async function suggestExerciseAlternative(
  exerciseName: string,
  reason: string
): Promise<{ alternatives: string[]; explanation: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { alternatives: [], explanation: '', error: 'Non autorizzato' }

  const [profile, injuries] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { equipmentLevel: true, injuriesList: true, experienceLevel: true }
    }),
    prisma.injury.findMany({
      where: { userId: session.user.id, status: { not: 'RESOLVED' } },
      select: { district: true }
    })
  ])

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Sei un personal trainer esperto. Suggerisci esercizi alternativi.
Rispondi SOLO in formato JSON: {"alternatives": ["Alt 1", "Alt 2", "Alt 3"], "explanation": "Perché questi sostituti..."}`
        },
        {
          role: 'user',
          content: `L'atleta non riesce a fare "${exerciseName}" oggi. Motivo: "${reason || 'non specificato'}".
Attrezzatura disponibile: ${profile?.equipmentLevel ?? 'non specificata'}.
Infortuni attivi: ${injuries.map(i => i.district).join(', ') || 'nessuno'}.
Livello esperienza: ${profile?.experienceLevel ?? 'N/D'}.
Suggerisci 3 esercizi alternativi compatibili con l'attrezzatura disponibile. Risposta in italiano.`
        }
      ],
      max_tokens: 300,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    })

    const json = JSON.parse(res.choices[0]?.message?.content ?? '{}')
    return {
      alternatives: json.alternatives ?? [],
      explanation: json.explanation ?? '',
    }
  } catch {
    return { alternatives: [], explanation: '', error: 'Errore AI' }
  }
}

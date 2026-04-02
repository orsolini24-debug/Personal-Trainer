'use server'

import { auth } from '@/auth'
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

const SYSTEM_PROMPT = `Sei il coach AI di un'app di allenamento premium (Performance Ecosystem).
Sei un personal trainer esperto, conciso, diretto e motivante.
Rispondi sempre in italiano, in modo breve (max 3-4 frasi) a meno che non ti venga chiesta una spiegazione dettagliata.
Se l'utente ti manda una foto, analizza la tecnica di esecuzione e dai feedback specifici.
Se l'utente vuole cambiare esercizio, suggerisci 2-3 alternative valide per lo stesso pattern muscolare.
Usa dati contestuali (nome esercizio, serie, RIR) per rispondere in modo pertinente.`

export async function askWorkoutAI(
  messages: WorkoutAIMessage[],
  context: WorkoutContext,
  imageBase64?: string | null
): Promise<{ reply: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { reply: '', error: 'Non autorizzato' }

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
          { role: 'system', content: SYSTEM_PROMPT + '\n\n' + contextBlock },
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
        { role: 'system', content: SYSTEM_PROMPT + '\n\n' + contextBlock },
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
Suggerisci 3 esercizi alternativi che lavorano gli stessi muscoli. Risposta in italiano.`
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

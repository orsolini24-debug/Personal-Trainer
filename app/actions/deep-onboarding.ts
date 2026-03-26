'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Groq from 'groq-sdk'
import { MesoStatus } from '@prisma/client'
import { titanProfiles, getTitansForObjective } from '@/lib/titans-db'
import { sanitizeDayLabel } from '@/lib/plan-utils'

// ─────────────────────────────────────────────────────────────────────────────
// generateAITripleProposal
// Called by: AIPanButton.tsx (/plan page)
// Reads existing UserProfile, calls Groq, stores 3 proposals as draft Mesocycle.
// ─────────────────────────────────────────────────────────────────────────────
export async function generateAITripleProposal() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  if (!profile) throw new Error('Profile not found')

  // Select relevant Titans based on objective and sport
  const relevantTitans = getTitansForObjective(profile.primaryGoal || 'fitness')
    .concat(getTitansForObjective(profile.primarySport || 'palestra'))
    .slice(0, 8)

  // Dedup by ID
  const uniqueTitans = Array.from(new Set(relevantTitans.map(t => t.id)))
    .map(id => relevantTitans.find(t => t.id === id))

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

  const prompt = `Sei un preparatore atletico d'élite. Genera 3 proposte di Mesociclo basate su una FUSIONE LOGICA e SINFRETICA delle metodologie dei "Titani" forniti.

  LIBRERIA TITANI DISPONIBILE PER QUESTO ATLETA:
  ${JSON.stringify(uniqueTitans.map(t => ({
    id: t?.id,
    name: t?.name,
    discipline: t?.discipline,
    principles: t?.methodology.observablePrinciples,
    loadRules: t?.load.rules
  })), null, 2)}

  DATI ATLETA:
  ${JSON.stringify({
    goal: profile.primaryGoal,
    sport: profile.primarySport,
    experience: profile.experienceLevel,
    equipment: profile.equipmentLevel,
    availability: profile.availableDays,
    duration: profile.sessionDuration,
    injuries: profile.injuriesList,
    routine: profile.dailyRoutine
  }, null, 2)}

  REGOLE TECNICHE DI GENERAZIONE:
  1. HYBRID FUSION: Non limitarti a 1 o 2 Titani. Se l'atleta è multisport o ha obiettivi complessi (es. Forza + Endurance + Longevità), fondi TUTTE le metodologie necessarie in un'unica visione coerente.
  2. SINERGIA LOGICA: La fusione deve avere senso fisiologico.
  3. ADATTAMENTO REALE: Rispetta rigorosamente l'attrezzatura e la routine quotidiana dell'atleta.
  4. QUALITÀ ASSOLUTA: La programmazione risultante deve essere la migliore possibile, bilanciata per evitare interferenze negative tra sistemi energetici.
  5. VOLUME ESERCIZI OBBLIGATORIO: ogni giornata "plan" DEVE contenere MINIMO 5 esercizi e MASSIMO 20.
  6. GIORNI: genera tante giornate quante indica availability (es. 3 disponibilità = 3 giorni: A, B, C).
  7. DAYLABEL OBBLIGATORIO: Il campo "dayLabel" DEVE essere ESCLUSIVAMENTE uno di: "A", "B", "C", "D", "V1", "V2", "OUTDOOR". NON usare "E", "F", "G" o giorni della settimana.

  FORMATO JSON RICHIESTO:
  {
    "proposals": [
      {
        "id": 1,
        "name": "Nome Strategia",
        "titanIds": ["P51", "P18"],
        "strategy": "Spiegazione tecnica della sinergia",
        "pros": ["Pro 1", "Pro 2"], "cons": ["Con 1"],
        "isRecommended": true,
        "mesocycle": {
          "name": "Mesociclo Apex — Settimane 1-4",
          "objectives": "Obiettivi sintetizzati dal profilo atleta",
          "plan": [
            {
              "dayLabel": "A",
              "IMPORTANT_dayLabel_MUST_BE_ONE_OF": ["A","B","C","D","V1","V2","OUTDOOR"],
              "focus": "Forza Bassa — Quadricipiti e Posteriori coscia",
              "exercises": [
                { "name": "Squat al bilanciere", "sets": 4, "repsMin": 4, "repsMax": 6, "targetRir": 2, "restSec": 180, "notes": "Scendi sotto il parallelo" }
              ]
            }
          ]
        },
        "nutritionPlan": {
          "trainingDayKcal": 2200,
          "enduranceDayKcal": 2400,
          "restDayKcal": 1900,
          "macros": { "p": 140, "c": 220, "f": 65 },
          "strategy": "Carboidrati attorno all'allenamento"
        }
      }
    ]
  }`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      max_tokens: 8000,
      temperature: 0.3,
    })

    const res = JSON.parse(completion.choices[0].message.content || '{}')
    const draft = await prisma.mesocycle.create({
      data: {
        userId,
        name: 'Proposte Strategiche AI',
        startDate: new Date(),
        status: MesoStatus.DRAFT,
        aiProposals: res.proposals,
      }
    })

    revalidatePath('/plan')
    return { success: true, draftId: draft.id, proposals: res.proposals }
  } catch (e: any) {
    console.error('Proposal Generation Error:', e)
    return { success: false, error: e.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// selectProposal
// Called by: ProposalSelector.tsx (/plan page)
// Converts a draft Mesocycle's aiProposals JSON → real WorkoutPlan + PlanDay + PlanExercise.
// ─────────────────────────────────────────────────────────────────────────────
export async function selectProposal(mesoId: string, optionId: number) {
  try {
    const meso = await prisma.mesocycle.findUnique({ where: { id: mesoId } })
    if (!meso || !meso.aiProposals) throw new Error('Draft not found')

    const proposals = meso.aiProposals as any[]
    const selected = proposals.find((p: any) => p.id === optionId)
    if (!selected) throw new Error('Option not found')

    await prisma.$transaction(async (tx) => {
      // Archive any currently active mesocycle
      await tx.mesocycle.updateMany({
        where: { userId: meso.userId, status: MesoStatus.ACTIVE },
        data: { status: MesoStatus.ARCHIVED }
      })

      // Activate the chosen draft
      await tx.mesocycle.update({
        where: { id: mesoId },
        data: {
          name: selected.mesocycle.name,
          objectives: selected.mesocycle.objectives,
          status: MesoStatus.ACTIVE,
          chosenOption: optionId,
        }
      })

      // Create the WorkoutPlan
      const workoutPlan = await tx.workoutPlan.create({
        data: {
          userId: meso.userId,
          mesocycleId: mesoId,
          name: selected.mesocycle.name,
          goal: selected.mesocycle.objectives,
          source: 'AI_GENERATED',
          isActive: true,
        }
      })

      // Create PlanDays + PlanExercises
      for (let i = 0; i < selected.mesocycle.plan.length; i++) {
        const day = selected.mesocycle.plan[i]
        const pDay = await tx.planDay.create({
          data: {
            planId: workoutPlan.id,
            dayLabel: sanitizeDayLabel(day.dayLabel, i),
            focus: day.focus,
            orderIndex: i,
          }
        })

        if (Array.isArray(day.exercises) && day.exercises.length > 0) {
          await tx.planExercise.createMany({
            data: day.exercises.map((ex: any, idx: number) => ({
              planDayId: pDay.id,
              name: ex.name,
              orderIndex: idx,
              sets: Number(ex.sets) || 3,
              repsMin: Number(ex.repsMin) || 8,
              repsMax: Number(ex.repsMax) || 12,
              targetRir: Number(ex.targetRir) || 2,
              restSec: Number(ex.restSec) || 90,
              notes: ex.notes || null,
            })),
          })
        }
      }
    })

    revalidatePath('/plan')
    return { success: true }
  } catch (e: any) {
    console.error('selectProposal error:', e)
    return { error: e?.message ?? 'Database error' }
  }
}

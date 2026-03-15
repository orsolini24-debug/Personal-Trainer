'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SessionType, District } from '@prisma/client'

// ── Stress distrettuale per tipo sessione (dal PDF matrice) ──────────────────
const SESSION_STRESS: Record<string, Array<{ district: District; intensity: number }>> = {
  A: [
    { district: 'KNEE',       intensity: 2 },
    { district: 'HAMSTRING',  intensity: 2 },
    { district: 'GLUTE',      intensity: 2 },
    { district: 'LOWER_BACK', intensity: 1 },
    { district: 'CALF',       intensity: 1 },
    { district: 'CORE',       intensity: 1 },
  ],
  B: [
    { district: 'CHEST',      intensity: 2 },
    { district: 'SHOULDER',   intensity: 2 },
    { district: 'TRICEP',     intensity: 2 },
  ],
  C: [
    { district: 'UPPER_BACK', intensity: 2 },
    { district: 'LOWER_BACK', intensity: 2 },
    { district: 'BICEP',      intensity: 1 },
    { district: 'CORE',       intensity: 1 },
  ],
  D: [
    { district: 'QUAD',       intensity: 2 },
    { district: 'KNEE',       intensity: 2 },
    { district: 'GLUTE',      intensity: 1 },
    { district: 'CALF',       intensity: 1 },
    { district: 'CORE',       intensity: 1 },
  ],
  V1: [
    { district: 'QUAD',      intensity: 1 },
    { district: 'HAMSTRING', intensity: 1 },
    { district: 'CALF',      intensity: 1 },
  ],
  V2: [
    { district: 'SHOULDER', intensity: 1 },
    { district: 'CORE',     intensity: 1 },
    { district: 'CALF',     intensity: 1 },
  ],
}

// ── startSession ─────────────────────────────────────────────────────────────
export async function startSession(planDayId: string, plannedSessionId?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  // Controlla se c'è già una sessione attiva
  const existing = await prisma.activeSession.findUnique({
    where: { userId },
    include: {
      workoutSession: {
        include: { exercises: { orderBy: { orderIndex: 'asc' }, include: { setLogs: { orderBy: { setNumber: 'asc' } } } } },
      },
    },
  })
  if (existing) return { activeSessionId: existing.id, workoutSessionId: existing.workoutSessionId, isNew: false }

  // Fetch PlanDay
  const planDay = await prisma.planDay.findUnique({
    where: { id: planDayId },
    include: {
      planExercises: { orderBy: { orderIndex: 'asc' } },
      plan: { include: { mesocycle: true } },
    },
  })
  if (!planDay) return { error: 'PlanDay non trovato' }

  // Crea WorkoutSession
  const workoutSession = await prisma.workoutSession.create({
    data: {
      userId,
      mesocycleId: planDay.plan?.mesocycleId ?? null,
      date: new Date(),
      type: planDay.dayLabel as SessionType,
    },
  })

  // Crea Exercise records dal PlanExercise
  // Codifica restSec e repsRange in reps/technicalNotes per non cambiare schema
  await prisma.exercise.createMany({
    data: planDay.planExercises.map(pe => ({
      sessionId: workoutSession.id,
      name: pe.name,
      orderIndex: pe.orderIndex,
      sets: pe.sets,
      reps: pe.repsMin === pe.repsMax ? String(pe.repsMin) : `${pe.repsMin}-${pe.repsMax}`,
      rir: pe.targetRir,
      technicalNotes: JSON.stringify({
        restSec: pe.restSec,
        repsMin: pe.repsMin,
        repsMax: pe.repsMax,
        plan: pe.notes ?? '',
      }),
    })),
  })

  // Crea ActiveSession
  const activeSession = await prisma.activeSession.create({
    data: { userId, workoutSessionId: workoutSession.id },
  })

  // Collega PlannedSession
  if (plannedSessionId) {
    await prisma.plannedSession.update({
      where: { id: plannedSessionId, userId },
      data: { workoutSessionId: workoutSession.id },
    })
  }

  return { activeSessionId: activeSession.id, workoutSessionId: workoutSession.id, isNew: true }
}

// ── getActiveSession ──────────────────────────────────────────────────────────
export async function getActiveSession() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  return prisma.activeSession.findUnique({
    where: { userId },
    include: {
      workoutSession: {
        include: {
          exercises: {
            orderBy: { orderIndex: 'asc' },
            include: { setLogs: { orderBy: { setNumber: 'asc' } } },
          },
        },
      },
      setLogs: true,
    },
  })
}

// ── logSet ────────────────────────────────────────────────────────────────────
export async function logSet(params: {
  activeSessionId: string
  exerciseId: string
  setNumber: number
  weightKg: number | null
  repsActual: number | null
  rirActual: number | null
  isWarmup: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }

  await prisma.setLog.upsert({
    where: {
      activeSessionId_exerciseId_setNumber: {
        activeSessionId: params.activeSessionId,
        exerciseId: params.exerciseId,
        setNumber: params.setNumber,
      },
    },
    update: {
      weightKg: params.weightKg,
      repsActual: params.repsActual,
      rirActual: params.rirActual,
      isWarmup: params.isWarmup,
    },
    create: {
      activeSessionId: params.activeSessionId,
      exerciseId: params.exerciseId,
      setNumber: params.setNumber,
      weightKg: params.weightKg,
      repsActual: params.repsActual,
      rirActual: params.rirActual,
      isWarmup: params.isWarmup,
    },
  })

  // Aggiorna currentSetIdx / currentExerciseIdx
  await prisma.activeSession.update({
    where: { id: params.activeSessionId },
    data: { currentSetIdx: params.setNumber },
  })

  return { success: true }
}

// ── advanceExercise ───────────────────────────────────────────────────────────
export async function advanceExercise(activeSessionId: string, exerciseIdx: number) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }

  await prisma.activeSession.update({
    where: { id: activeSessionId },
    data: { currentExerciseIdx: exerciseIdx, currentSetIdx: 0 },
  })

  return { success: true }
}

// ── getPreviousPerformance ────────────────────────────────────────────────────
// Carica i SetLog dell'ultima sessione per ogni esercizio per mostrare "Prec: X kg × Y"
export async function getPreviousPerformance(exerciseName: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const lastExercise = await prisma.exercise.findFirst({
    where: {
      name: exerciseName,
      session: { userId: session.user.id },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      setLogs: {
        where: { isWarmup: false },
        orderBy: { setNumber: 'asc' },
      },
    },
  })

  return lastExercise?.setLogs ?? null
}

// ── finishSession ─────────────────────────────────────────────────────────────
export async function finishSession(params: {
  activeSessionId: string
  rpe: number | null
  notes: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }

  const active = await prisma.activeSession.findUnique({
    where: { id: params.activeSessionId },
    include: {
      workoutSession: {
        include: {
          exercises: {
            include: { setLogs: { where: { isWarmup: false } } },
          },
        },
      },
    },
  })
  if (!active) return { error: 'Sessione non trovata' }

  const durationMin = Math.round(
    (Date.now() - new Date(active.startedAt).getTime()) / 60000
  )

  // Training Load = somma (reps × kg × sets_factor) normalizzata su RPE
  const rpeFactor = params.rpe ? params.rpe / 10 : 0.7
  let rawTL = 0
  for (const ex of active.workoutSession.exercises) {
    for (const sl of ex.setLogs) {
      const w = sl.weightKg ?? 0
      const r = sl.repsActual ?? 0
      rawTL += w * r * 0.033
    }
  }
  const trainingLoad = Math.round(rawTL * rpeFactor * (durationMin / 60))

  await prisma.workoutSession.update({
    where: { id: active.workoutSessionId },
    data: {
      durationMin,
      rpe: params.rpe,
      notes: params.notes,
      trainingLoad: trainingLoad || durationMin * 1.5,
    },
  })

  // Crea DistrictStress
  const sessionType = active.workoutSession.type
  const stressData = SESSION_STRESS[sessionType] ?? []
  if (stressData.length > 0) {
    await prisma.districtStress.createMany({
      data: stressData.map(s => ({
        sessionId: active.workoutSessionId,
        district: s.district,
        intensity: s.intensity,
      })),
    })
  }

  // Aggiorna PlannedSession
  const planned = await prisma.plannedSession.findFirst({
    where: { workoutSessionId: active.workoutSessionId },
  })
  if (planned) {
    await prisma.plannedSession.update({
      where: { id: planned.id },
      data: { status: 'COMPLETED' },
    })
  }

  // Cancella ActiveSession
  await prisma.activeSession.delete({ where: { id: params.activeSessionId } })

  return { success: true, workoutSessionId: active.workoutSessionId }
}

// ── abandonSession ────────────────────────────────────────────────────────────
export async function abandonSession(activeSessionId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }

  const active = await prisma.activeSession.findUnique({
    where: { id: activeSessionId, workoutSession: { userId: session.user.id } },
  })
  if (!active) return { error: 'Sessione non trovata' }

  await prisma.workoutSession.delete({ where: { id: active.workoutSessionId } })
  return { success: true }
}

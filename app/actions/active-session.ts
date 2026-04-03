'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SessionType, District } from '@prisma/client'

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

  // Carica l'ultimo carico per ogni esercizio del piano (tramite Exercise model)
  const exerciseNames = planDay.planExercises.map(pe => pe.name)
  const lastExercises = await prisma.exercise.findMany({
    where: {
      name: { in: exerciseNames },
      session: { userId },
      loadKg: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['name'],
    select: { name: true, loadKg: true },
  })
  const loadMap = new Map(lastExercises.map(e => [e.name, e.loadKg]))

  // Crea Exercise records dal PlanExercise
  await prisma.exercise.createMany({
    data: planDay.planExercises.map(pe => ({
      sessionId: workoutSession.id,
      name: pe.name,
      orderIndex: pe.orderIndex,
      sets: pe.sets,
      reps: pe.repsMin === pe.repsMax ? String(pe.repsMin) : `${pe.repsMin}-${pe.repsMax}`,
      rir: pe.targetRir,
      restSec: pe.restSec,
      repsMin: pe.repsMin,
      repsMax: pe.repsMax,
      planNotes: pe.notes,
      loadKg: loadMap.get(pe.name) ?? null,
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
  feelingScore?: number | null
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
      feelingScore: params.feelingScore ?? null,
    },
    create: {
      activeSessionId: params.activeSessionId,
      exerciseId: params.exerciseId,
      setNumber: params.setNumber,
      weightKg: params.weightKg,
      repsActual: params.repsActual,
      rirActual: params.rirActual,
      isWarmup: params.isWarmup,
      feelingScore: params.feelingScore ?? null,
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
// Carica i SetLog dell'ultima sessione PRECEDENTE per mostrare "Prec: X kg × Y".
// currentSessionId esclude la sessione in corso — altrimenti mostrerebbe i
// propri dati parziali come "record precedente".
export async function getPreviousPerformance(exerciseName: string, currentSessionId?: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const lastExercise = await prisma.exercise.findFirst({
    where: {
      name: exerciseName,
      session: {
        userId: session.user.id,
        ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
      },
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

  // ── DistrictStress: calcolato dai SetLog reali + ExerciseDefinition ──────────
  const exerciseNames2 = active.workoutSession.exercises.map(e => e.name)
  const defs = exerciseNames2.length > 0
    ? await prisma.exerciseDefinition.findMany({
        where: {
          OR: [
            { name: { in: exerciseNames2 } },
            { nameIt: { in: exerciseNames2 } },
          ],
        },
        select: { name: true, nameIt: true, primaryMuscles: true, secondaryMuscles: true },
      })
    : []

  const defByName = new Map<string, { primaryMuscles: District[]; secondaryMuscles: District[] }>()
  for (const d of defs) {
    defByName.set(d.name.toLowerCase(), d)
    if (d.nameIt) defByName.set(d.nameIt.toLowerCase(), d)
  }

  const districtSets: Partial<Record<District, number>> = {}
  for (const ex of active.workoutSession.exercises) {
    const workingSets = ex.setLogs.length
    if (workingSets === 0) continue
    const def = defByName.get(ex.name.toLowerCase())
    if (!def) continue
    for (const d of def.primaryMuscles)   districtSets[d] = (districtSets[d] ?? 0) + workingSets
    for (const d of def.secondaryMuscles) districtSets[d] = (districtSets[d] ?? 0) + workingSets * 0.5
  }

  const toIntensity = (s: number) => s <= 0 ? 0 : s <= 2 ? 1 : s <= 5 ? 2 : 3

  const stressEntries = (Object.entries(districtSets) as [District, number][])
    .filter(([, s]) => s > 0)
    .map(([district, sets]) => ({
      sessionId: active.workoutSessionId,
      district,
      intensity: toIntensity(sets),
    }))

  if (stressEntries.length > 0) {
    await prisma.districtStress.createMany({ data: stressEntries })
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

  // Elimina ActiveSession prima di WorkoutSession — evita FK constraint
  await prisma.activeSession.delete({ where: { id: activeSessionId } })
  await prisma.workoutSession.delete({ where: { id: active.workoutSessionId } })
  return { success: true }
}

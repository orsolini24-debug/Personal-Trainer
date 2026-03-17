'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export interface ExerciseHistoryEntry {
  sessionDate: Date
  sessionType: string
  weightKg: number | null
  repsActual: number | null
  rirActual: number | null
  feelingScore: number | null
  isWarmup: boolean
  setNumber: number
}

export interface ExerciseHistory {
  exerciseName: string
  entries: ExerciseHistoryEntry[]
  lastSessionDate: Date | null
  bestWeight: number | null
  trend: 'up' | 'down' | 'stable' | 'none'
}

export async function getExerciseHistory(exerciseName: string, limit = 3): Promise<ExerciseHistory> {
  const session = await auth()
  if (!session?.user?.id) return { exerciseName, entries: [], lastSessionDate: null, bestWeight: null, trend: 'none' }

  const userId = session.user.id

  // Get last N sessions that contain this exercise
  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 20,
    include: {
      exercises: {
        where: { name: { contains: exerciseName.split(' ').slice(0, 3).join(' '), mode: 'insensitive' } },
        include: {
          setLogs: {
            where: { isWarmup: false },
            orderBy: { setNumber: 'asc' }
          }
        }
      }
    }
  })

  const relevantSessions = sessions.filter(s => s.exercises.length > 0).slice(0, limit)

  const entries: ExerciseHistoryEntry[] = relevantSessions.flatMap(s =>
    s.exercises.flatMap(ex =>
      ex.setLogs.map(sl => ({
        sessionDate: s.date,
        sessionType: s.type,
        weightKg: sl.weightKg,
        repsActual: sl.repsActual,
        rirActual: sl.rirActual,
        feelingScore: (sl as { feelingScore?: number | null }).feelingScore ?? null,
        isWarmup: sl.isWarmup,
        setNumber: sl.setNumber,
      }))
    )
  )

  const weights = entries.filter(e => e.weightKg != null).map(e => e.weightKg as number)
  const bestWeight = weights.length > 0 ? Math.max(...weights) : null

  // Trend: compare last 2 sessions avg weight
  let trend: 'up' | 'down' | 'stable' | 'none' = 'none'
  if (relevantSessions.length >= 2) {
    const avgWeight = (sess: typeof relevantSessions[0]) => {
      const wts = sess.exercises.flatMap(e => e.setLogs.map(s => s.weightKg ?? 0)).filter(w => w > 0)
      return wts.length ? wts.reduce((a, b) => a + b, 0) / wts.length : 0
    }
    const lastAvg = avgWeight(relevantSessions[0])
    const prevAvg = avgWeight(relevantSessions[1])
    if (lastAvg > prevAvg * 1.02) trend = 'up'
    else if (lastAvg < prevAvg * 0.98) trend = 'down'
    else trend = 'stable'
  } else if (relevantSessions.length === 1) {
    trend = 'stable'
  }

  return {
    exerciseName,
    entries,
    lastSessionDate: relevantSessions[0]?.date ?? null,
    bestWeight,
    trend,
  }
}

export async function getPlanDayWithHistory(planDayId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const planDay = await prisma.planDay.findUnique({
    where: { id: planDayId },
    include: {
      plan: {
        include: {
          mesocycle: true
        }
      },
      planExercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exerciseDef: true
        }
      }
    }
  })

  if (!planDay) return null

  // Verify ownership
  if (planDay.plan.userId !== userId) return null

  return planDay
}

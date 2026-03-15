'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function getActivePlan() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  return prisma.workoutPlan.findFirst({
    where: { userId, isActive: true },
    include: {
      mesocycle: true,
      planDays: {
        orderBy: { orderIndex: 'asc' },
        include: { planExercises: { orderBy: { orderIndex: 'asc' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTodayPlannedSession() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const today = new Date()
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))

  return prisma.plannedSession.findFirst({
    where: {
      userId,
      scheduledDate: todayUTC,
    },
    include: {
      planDay: {
        include: {
          planExercises: { orderBy: { orderIndex: 'asc' } },
        },
      },
      plan: true,
    },
  })
}

export async function getWeekPlannedSessions(weekStart: Date) {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  return prisma.plannedSession.findMany({
    where: {
      userId,
      scheduledDate: { gte: weekStart, lte: weekEnd },
    },
    include: {
      planDay: true,
      workoutSession: true,
    },
    orderBy: { scheduledDate: 'asc' },
  })
}

export async function getMonthPlannedSessions(year: number, month: number) {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  return prisma.plannedSession.findMany({
    where: { userId, scheduledDate: { gte: start, lte: end } },
    include: { planDay: true, workoutSession: true },
    orderBy: { scheduledDate: 'asc' },
  })
}

export async function markSessionSkipped(plannedSessionId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  await prisma.plannedSession.update({
    where: { id: plannedSessionId, userId: session.user.id },
    data: { status: 'SKIPPED' },
  })
  return { success: true }
}

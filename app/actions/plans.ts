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

// ─── WEEKLY CALENDAR ─────────────────────────────────────────────────────────

export interface WeekCalendarSession {
  id: string
  scheduledDate: string // ISO date string YYYY-MM-DD
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED'
  planDayLabel: string
  planDayFocus: string | null
  planDayId: string
  workoutSessionId: string | null
}

export async function getWeekCalendarData(weekStartISO: string): Promise<WeekCalendarSession[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const weekStart = new Date(weekStartISO + 'T00:00:00Z')
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)

  const sessions = await prisma.plannedSession.findMany({
    where: { userId, scheduledDate: { gte: weekStart, lte: weekEnd } },
    include: { planDay: true },
    orderBy: { scheduledDate: 'asc' },
  })

  return sessions.map(s => ({
    id: s.id,
    scheduledDate: s.scheduledDate.toISOString().split('T')[0],
    status: s.status as 'PENDING' | 'COMPLETED' | 'SKIPPED',
    planDayLabel: s.planDay.dayLabel,
    planDayFocus: s.planDay.focus,
    planDayId: s.planDay.id,
    workoutSessionId: s.workoutSessionId,
  }))
}

export async function schedulePlanForWeek(planId: string, weekStartISO: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId },
    include: { planDays: { orderBy: { orderIndex: 'asc' } } },
  })
  if (!plan || plan.planDays.length === 0) return { error: 'Piano non trovato o senza giornate' }

  const weekStart = new Date(weekStartISO + 'T00:00:00Z')
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)

  // Count sessions already planned before this week to calculate rotation
  const totalBefore = await prisma.plannedSession.count({
    where: { userId, planId, scheduledDate: { lt: weekStart } },
  })

  // Get already scheduled dates this week (may have been scheduled individually)
  const existing = await prisma.plannedSession.findMany({
    where: { userId, scheduledDate: { gte: weekStart, lte: weekEnd } },
    select: { scheduledDate: true },
  })
  const existingDates = new Set(existing.map(s => s.scheduledDate.toISOString().split('T')[0]))

  const trainingDays = [...plan.trainingDays].sort((a, b) => a - b) // [1,3,5]
  const planDays = plan.planDays
  let dayIndex = totalBefore
  let created = 0

  for (const trainingDayNum of trainingDays) {
    // trainingDayNum: 0=Sun,1=Mon,...,6=Sat; weekStart is Monday
    const offset = (trainingDayNum - 1 + 7) % 7
    const date = new Date(weekStart)
    date.setUTCDate(date.getUTCDate() + offset)
    const dateStr = date.toISOString().split('T')[0]

    if (existingDates.has(dateStr)) { dayIndex++; continue }

    const planDay = planDays[dayIndex % planDays.length]
    dayIndex++

    try {
      await prisma.plannedSession.create({
        data: { userId, planId, planDayId: planDay.id, scheduledDate: date },
      })
      created++
    } catch {
      // unique constraint — slot already taken by another session
    }
  }

  return { success: true, created }
}

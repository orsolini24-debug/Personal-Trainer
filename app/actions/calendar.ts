'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SessionType } from '@prisma/client'

export interface CalendarDayData {
  date: string // ISO date string YYYY-MM-DD
  planned?: {
    id: string
    status: 'PENDING' | 'COMPLETED' | 'SKIPPED'
    label: string
    focus: string | null
  }
  workout?: {
    id: string
    type: string
    duration?: number | null
    load?: number | null
    rpe?: number | null
  }
  hasNutrition: boolean
  hasRecovery: boolean
  hasBiometrics: boolean
}

export async function getCalendarMonthData(year: number, month: number): Promise<CalendarDayData[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  // Date range for the month (UTC to avoid timezone issues with prisma)
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  const [planned, actual, nutrition, recovery, biometrics] = await Promise.all([
    prisma.plannedSession.findMany({
      where: { userId, scheduledDate: { gte: startDate, lte: endDate } },
      include: { planDay: true }
    }),
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } }
    }),
    prisma.nutritionDay.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { date: true }
    }),
    prisma.recoveryLog.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { date: true }
    }),
    prisma.biometricLog.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { date: true }
    })
  ])

  // Map to date string for easy lookup
  const data: Record<string, CalendarDayData> = {}
  
  // Initialize month days
  for (let d = 1; d <= new Date(year, month, 0).getDate(); d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    data[dateStr] = {
      date: dateStr,
      hasNutrition: false,
      hasRecovery: false,
      hasBiometrics: false
    }
  }

  planned.forEach(p => {
    const dateStr = p.scheduledDate.toISOString().split('T')[0]
    if (data[dateStr]) {
      data[dateStr].planned = {
        id: p.id,
        status: p.status as 'PENDING' | 'COMPLETED' | 'SKIPPED',
        label: p.planDay.dayLabel,
        focus: p.planDay.focus
      }
    }
  })

  actual.forEach(w => {
    const dateStr = w.date.toISOString().split('T')[0]
    if (data[dateStr]) {
      data[dateStr].workout = {
        id: w.id,
        type: w.type,
        duration: w.durationMin,
        load: w.trainingLoad,
        rpe: w.rpe
      }
    }
  })

  nutrition.forEach(n => {
    const dateStr = n.date.toISOString().split('T')[0]
    if (data[dateStr]) data[dateStr].hasNutrition = true
  })

  recovery.forEach(r => {
    const dateStr = r.date.toISOString().split('T')[0]
    if (data[dateStr]) data[dateStr].hasRecovery = true
  })

  biometrics.forEach(b => {
    const dateStr = b.date.toISOString().split('T')[0]
    if (data[dateStr]) data[dateStr].hasBiometrics = true
  })

  return Object.values(data).sort((a, b) => a.date.localeCompare(b.date))
}

export async function logPlannedSessionRetroactive(params: {
  plannedSessionId: string
  date: string
  durationMin?: number
  trainingLoad?: number
  rpe?: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorizzato')
  const userId = session.user.id

  const planned = await prisma.plannedSession.findUnique({
    where: { id: params.plannedSessionId, userId },
    include: { planDay: true }
  })

  if (!planned) throw new Error('Sessione pianificata non trovata')

  const date = new Date(params.date + 'T12:00:00Z') // Mid-day UTC to avoid date shifting

  const workout = await prisma.workoutSession.create({
    data: {
      userId,
      date,
      type: planned.planDay.dayLabel as SessionType,
      durationMin: params.durationMin,
      trainingLoad: params.trainingLoad,
      rpe: params.rpe,
      notes: params.notes,
      plannedSession: { connect: { id: planned.id } }
    }
  })

  await prisma.plannedSession.update({
    where: { id: planned.id },
    data: {
      status: 'COMPLETED',
      workoutSessionId: workout.id
    }
  })

  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true, workoutId: workout.id }
}

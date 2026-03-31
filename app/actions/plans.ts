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
  exerciseCount: number
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
    include: {
      planDay: {
        include: { planExercises: { select: { id: true } } },
      },
    },
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
    exerciseCount: s.planDay.planExercises.length,
  }))
}

// ─── MANUAL ASSIGNMENT ──────────────────────────────────────────────────────

export async function assignSessionToDay(planId: string, planDayId: string, dateISO: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  const date = new Date(dateISO + 'T00:00:00Z')

  // Remove existing PENDING session on that date (don't touch COMPLETED)
  await prisma.plannedSession.deleteMany({
    where: { userId, scheduledDate: date, status: 'PENDING' },
  })

  // Verify ownership of planDay
  const planDay = await prisma.planDay.findFirst({
    where: { id: planDayId, plan: { userId } },
  })
  if (!planDay) return { error: 'Giornata non trovata' }

  try {
    await prisma.plannedSession.create({
      data: { userId, planId, planDayId, scheduledDate: date },
    })
    return { success: true }
  } catch {
    return { error: 'Sessione già presente' }
  }
}

export async function removeSessionFromDay(plannedSessionId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  // Only allow removing PENDING sessions — COMPLETED have workout data
  const existing = await prisma.plannedSession.findFirst({
    where: { id: plannedSessionId, userId, status: 'PENDING' },
  })
  if (!existing) return { error: 'Sessione non trovata o già completata' }

  await prisma.plannedSession.delete({ where: { id: plannedSessionId } })
  return { success: true }
}

export async function deletePlannedSession(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autenticato')
  const userId = session.user.id

  try {
    // We only allow deleting PENDING or SKIPPED sessions.
    // If it's COMPLETED, it has a workout session attached, so better keep it.
    const session = await prisma.plannedSession.findUnique({
      where: { id, userId }
    })

    if (!session) throw new Error('Sessione non trovata')
    if (session.status === 'COMPLETED') throw new Error('Non puoi eliminare una sessione già completata. Elimina l\'allenamento associato invece.')

    await prisma.plannedSession.delete({
      where: { id, userId }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
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

  // Get already scheduled dates this week for THIS plan only
  const existing = await prisma.plannedSession.findMany({
    where: { userId, planId, scheduledDate: { gte: weekStart, lte: weekEnd } },
    select: { scheduledDate: true },
  })
  const existingDates = new Set(existing.map(s => s.scheduledDate.toISOString().split('T')[0]))

  const planDays = plan.planDays
  let trainingDays = [...plan.trainingDays].sort((a, b) => a - b) // [1,3,5]
  
  // Se non ci sono giorni di allenamento definiti, usa un default basato sul numero di sessioni
  if (trainingDays.length === 0) {
    const num = planDays.length
    if (num === 1) trainingDays = [1]
    else if (num === 2) trainingDays = [1, 4]
    else if (num === 4) trainingDays = [1, 2, 4, 5]
    else if (num >= 5) trainingDays = [1, 2, 3, 4, 5, 6].slice(0, num)
    else trainingDays = [1, 3, 5] // Default 3 giorni
  }

  let dayIndex = totalBefore
  let created = 0

  for (const trainingDayNum of trainingDays) {
    // trainingDayNum: 0=Sun,1=Mon,...,6=Sat; weekStart is Monday
    const offset = (trainingDayNum - 1 + 7) % 7
    const date = new Date(weekStart)
    date.setUTCDate(date.getUTCDate() + offset)
    const dateStr = date.toISOString().split('T')[0]

    // Se il giorno è già occupato, passiamo al prossimo giorno di allenamento 
    // ma NON incrementiamo dayIndex perché non abbiamo "consumato" la sessione del piano
    if (existingDates.has(dateStr)) continue

    const planDay = planDays[dayIndex % planDays.length]
    
    try {
      await prisma.plannedSession.create({
        data: { userId, planId, planDayId: planDay.id, scheduledDate: date },
      })
      created++
      dayIndex++ // Incrementiamo solo se creata con successo
    } catch {
      // unique constraint — slot already taken by another session
    }
  }

  return { success: true, created }
}

export interface ScheduleOptions {
  planId: string
  trainingDays: number[] // [1, 3, 5] = Lun, Mer, Ven (1 = Lun, 0 = Dom)
  startDateISO: string   // "YYYY-MM-DD"
  startSessionIndex: number // 0 = A, 1 = B...
  weeksToSchedule?: number // Default: 4
}

export async function advancedSchedulePlan(options: ScheduleOptions) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  const { planId, trainingDays, startDateISO, startSessionIndex, weeksToSchedule = 4 } = options

  if (trainingDays.length === 0) return { error: 'Devi selezionare almeno un giorno di allenamento.' }

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId },
    include: { planDays: { orderBy: { orderIndex: 'asc' } } },
  })
  if (!plan || plan.planDays.length === 0) return { error: 'Piano non trovato o senza giornate.' }

  // 1. Aggiorna i giorni preferiti sul piano
  await prisma.workoutPlan.update({
    where: { id: planId },
    data: { trainingDays }
  })

  // 2. Calcola le date da generare
  const startDate = new Date(startDateISO + 'T00:00:00Z')
  const endDate = new Date(startDate)
  endDate.setUTCDate(endDate.getUTCDate() + (weeksToSchedule * 7))

  // Trova le date già occupate in questo periodo per QUESTO piano
  const existing = await prisma.plannedSession.findMany({
    where: { userId, planId, scheduledDate: { gte: startDate, lte: endDate } },
    select: { scheduledDate: true },
  })
  const existingDates = new Set(existing.map(s => s.scheduledDate.toISOString().split('T')[0]))

  const planDays = plan.planDays
  let currentSessionIndex = startSessionIndex
  let createdCount = 0

  // Generiamo iterando giorno per giorno dal startDate al endDate
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getUTCDay() // 0 = Dom, 1 = Lun...
    const dateStr = currentDate.toISOString().split('T')[0]

    // Se oggi è uno dei giorni scelti dall'utente e non c'è già una sessione
    if (trainingDays.includes(dayOfWeek) && !existingDates.has(dateStr)) {
      const planDay = planDays[currentSessionIndex % planDays.length]
      
      try {
        await prisma.plannedSession.create({
          data: { 
            userId, 
            planId, 
            planDayId: planDay.id, 
            scheduledDate: new Date(currentDate) 
          },
        })
        createdCount++
        currentSessionIndex++ // Avanza alla sessione successiva solo se pianificata con successo
      } catch (e) {
        // Ignora conflitti se il db impedisce (es. unique constraints aggiuntivi)
      }
    }

    // Avanza di un giorno
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }

  return { success: true, createdCount }
}


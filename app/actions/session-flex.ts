'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function skipPlannedSession(planDayId: string, date: string, reason?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  const scheduledDate = new Date(date)
  const planId = await getPlanIdForDay(planDayId)

  await prisma.plannedSession.upsert({
    where: { userId_planId_scheduledDate: { userId, planId, scheduledDate } },
    create: {
      userId,
      planId,
      planDayId,
      scheduledDate,
      status: 'SKIPPED',
      skipReason: reason ?? 'Saltato manualmente',
    },
    update: {
      status: 'SKIPPED',
      skipReason: reason ?? 'Saltato manualmente',
    }
  })

  revalidatePath('/plan')
  revalidatePath('/training')
  return { success: true }
}

async function getPlanIdForDay(planDayId: string): Promise<string> {
  const day = await prisma.planDay.findUnique({ where: { id: planDayId }, select: { planId: true } })
  return day?.planId ?? ''
}

/**
 * Auto-skip: segna come SKIPPED tutte le PlannedSession dei giorni precedenti
 * che sono ancora PENDING (non avviate, nessuna WorkoutSession collegata).
 * Chiamare all'inizio di ogni page load rilevante (dashboard, body, plan).
 */
export async function autoSkipPastPendingSessions() {
  const session = await auth()
  if (!session?.user?.id) return { skipped: 0 }
  const userId = session.user.id

  // Considera "ieri" come soglia: sessioni pianificate prima di oggi senza sessione reale
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const pending = await prisma.plannedSession.findMany({
    where: {
      userId,
      status: 'PENDING',
      scheduledDate: { lt: todayStart },
      workoutSessionId: null,   // nessuna sessione reale completata
    },
    select: { id: true },
  })

  if (pending.length === 0) return { skipped: 0 }

  await prisma.plannedSession.updateMany({
    where: { id: { in: pending.map(p => p.id) } },
    data: {
      status: 'SKIPPED',
      skipReason: 'Sessione non avviata — saltata automaticamente',
    },
  })

  revalidatePath('/plan')
  revalidatePath('/training')
  revalidatePath('/dashboard')

  return { skipped: pending.length }
}

export async function getAlternateDays(planDayId: string) {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const day = await prisma.planDay.findUnique({
    where: { id: planDayId },
    include: {
      plan: {
        include: {
          mesocycle: { select: { id: true, name: true } },
          planDays: {
            include: { planExercises: { orderBy: { orderIndex: 'asc' }, take: 4 } }
          }
        }
      }
    }
  })

  if (!day || day.plan.userId !== userId) return []

  return day.plan.planDays.filter(d => d.id !== planDayId)
}

'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function skipPlannedSession(planDayId: string, date: string, reason?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  const scheduledDate = new Date(date)

  await prisma.plannedSession.upsert({
    where: { userId_scheduledDate: { userId, scheduledDate } },
    create: {
      userId,
      planId: await getPlanIdForDay(planDayId),
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

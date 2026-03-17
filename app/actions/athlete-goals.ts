'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { GoalType, SportType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export type GoalInput = {
  type: GoalType
  sport?: SportType
  description: string
  targetValue?: number
  currentValue?: number
  targetDate?: Date
  unit?: string
  priority?: number
  notes?: string
}

export async function saveAthleteGoals(goals: GoalInput[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  // Deactivate old goals
  await prisma.athleteGoal.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false }
  })

  // Create new goals
  await prisma.athleteGoal.createMany({
    data: goals.map((g, i) => ({
      userId,
      type: g.type,
      sport: g.sport,
      description: g.description,
      targetValue: g.targetValue,
      currentValue: g.currentValue,
      targetDate: g.targetDate,
      unit: g.unit,
      priority: g.priority ?? (i + 1),
      notes: g.notes,
      isActive: true,
    }))
  })

  revalidatePath('/plan')
  return { success: true }
}

export async function getActiveGoals() {
  const session = await auth()
  if (!session?.user?.id) return []
  return prisma.athleteGoal.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { priority: 'asc' }
  })
}

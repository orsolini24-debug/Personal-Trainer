'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateGoalProgress(goalId: string, newValue: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorizzato')

  try {
    await prisma.athleteGoal.update({
      where: { 
        id: goalId, 
        userId: session.user.id 
      },
      data: { 
        currentValue: newValue 
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/plan')
    return { success: true }
  } catch (error) {
    console.error('Error updating goal progress:', error)
    return { success: false, error: 'Errore durante l\'aggiornamento del progresso' }
  }
}

export async function getActiveGoals() {
  const session = await auth()
  if (!session?.user?.id) return []

  try {
    return await prisma.athleteGoal.findMany({
      where: { 
        userId: session.user.id, 
        isActive: true 
      },
      orderBy: { 
        priority: 'asc' 
      }
    })
  } catch (error) {
    console.error('Error fetching active goals:', error)
    return []
  }
}

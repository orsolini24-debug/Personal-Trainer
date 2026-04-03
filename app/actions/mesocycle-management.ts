"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MesoStatus } from "@prisma/client"

export async function activateMesocycle(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Archivia l'attuale attivo (Meso e Plan)
      await tx.mesocycle.updateMany({
        where: { userId, status: MesoStatus.ACTIVE, planType: { not: 'NUTRITION_ONLY' } },
        data: { status: MesoStatus.ARCHIVED }
      })

      await tx.workoutPlan.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      })

      // 2. Attiva questo meso
      await tx.mesocycle.update({
        where: { id, userId },
        data: { status: MesoStatus.ACTIVE }
      })

      // 3. Attiva il relativo workout plan
      await tx.workoutPlan.updateMany({
        where: { userId, mesocycleId: id },
        data: { isActive: true }
      })
    })

    revalidatePath("/plan")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Elimina un mesociclo e tutta la struttura collegata.
 *
 * Ordine di eliminazione (rispetta i vincoli FK):
 *   SetLog → ActiveSession
 *   PlannedSession
 *   PlanExercise → PlanDay → WorkoutPlan
 *   WorkoutSession (detached: mesocycleId = null, i log rimangono)
 *   Mesocycle
 */
export async function deleteMesocycle(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  try {
    await prisma.$transaction(async (tx) => {
      // Verifica ownership
      const meso = await tx.mesocycle.findUnique({ where: { id } })
      if (!meso || meso.userId !== userId) throw new Error("Mesociclo non trovato")

      // 1. Raccogli gli ID dei WorkoutPlan di questo meso
      const plans = await tx.workoutPlan.findMany({
        where: { mesocycleId: id },
        select: { id: true },
      })
      const planIds = plans.map(p => p.id)

      // 2. Elimina PlannedSession legate ai piani
      if (planIds.length > 0) {
        await tx.plannedSession.deleteMany({
          where: { planId: { in: planIds } },
        })
      }

      // 3. Elimina i WorkoutPlan (cascades a PlanDay → PlanExercise)
      if (planIds.length > 0) {
        await tx.workoutPlan.deleteMany({
          where: { id: { in: planIds } },
        })
      }

      // 4. Scollega le sessioni reali (non le cancelliamo — i log restano)
      await tx.workoutSession.updateMany({
        where: { mesocycleId: id, userId },
        data: { mesocycleId: null },
      })

      // 5. Elimina il mesociclo
      await tx.mesocycle.delete({ where: { id } })
    })

    revalidatePath("/plan")
    revalidatePath("/calendar")
    revalidatePath("/training")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Elimina massivamente tutti i mesocicli ARCHIVED, DRAFT o COMPLETED dell'utente.
 */
export async function bulkDeleteMesocycles() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Trova i mesocicli da eliminare
      const mesos = await tx.mesocycle.findMany({
        where: { 
          userId, 
          status: { in: [MesoStatus.ARCHIVED, MesoStatus.DRAFT, MesoStatus.COMPLETED] } 
        },
        select: { id: true },
      })
      const mesoIds = mesos.map(m => m.id)

      if (mesoIds.length === 0) return

      // 2. Trova i WorkoutPlan legati a questi mesocicli
      const plans = await tx.workoutPlan.findMany({
        where: { mesocycleId: { in: mesoIds } },
        select: { id: true },
      })
      const planIds = plans.map(p => p.id)

      // 3. Elimina PlannedSession legate ai piani
      if (planIds.length > 0) {
        await tx.plannedSession.deleteMany({
          where: { planId: { in: planIds } },
        })
      }

      // 4. Elimina i WorkoutPlan
      if (planIds.length > 0) {
        await tx.workoutPlan.deleteMany({
          where: { id: { in: planIds } },
        })
      }

      // 5. Scollega le sessioni reali
      await tx.workoutSession.updateMany({
        where: { mesocycleId: { in: mesoIds }, userId },
        data: { mesocycleId: null },
      })

      // 6. Elimina i mesocicli
      await tx.mesocycle.deleteMany({
        where: { id: { in: mesoIds }, userId },
      })
    })

    revalidatePath("/plan")
    revalidatePath("/calendar")
    revalidatePath("/training")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


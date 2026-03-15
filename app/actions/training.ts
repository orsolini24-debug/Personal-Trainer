"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { SessionType, District } from "@prisma/client"

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non autorizzato")
  return session.user.id
}

export async function createSession(data: { date: Date; type: SessionType; mesocycleId?: string }) {
  try {
    const userId = await getUserId()
    const session = await prisma.workoutSession.create({
      data: {
        userId,
        date: data.date,
        type: data.type,
        mesocycleId: data.mesocycleId,
      },
    })
    revalidatePath("/training")
    return { success: true, data: session }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addExercise(data: {
  sessionId: string
  name: string
  sets?: number
  reps?: string
  loadKg?: number
  rir?: number
  technicalNotes?: string
  orderIndex: number
}) {
  try {
    await getUserId() // verify auth
    const exercise = await prisma.exercise.create({
      data: {
        sessionId: data.sessionId,
        name: data.name,
        sets: data.sets,
        reps: data.reps,
        loadKg: data.loadKg,
        rir: data.rir,
        technicalNotes: data.technicalNotes,
        orderIndex: data.orderIndex,
      },
    })
    revalidatePath(`/training/${data.sessionId}`)
    return { success: true, data: exercise }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateExercise(id: string, data: any) {
  try {
    await getUserId() // verify auth
    const exercise = await prisma.exercise.update({
      where: { id },
      data,
    })
    revalidatePath(`/training/${exercise.sessionId}`)
    return { success: true, data: exercise }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteExercise(id: string) {
  try {
    await getUserId() // verify auth
    const exercise = await prisma.exercise.delete({
      where: { id },
    })
    revalidatePath(`/training/${exercise.sessionId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateDistrictStress(sessionId: string, district: District, intensity: number) {
  try {
    await getUserId() // verify auth
    
    // Check if it exists
    const existing = await prisma.districtStress.findFirst({
      where: { sessionId, district }
    })

    let result
    if (existing) {
      result = await prisma.districtStress.update({
        where: { id: existing.id },
        data: { intensity }
      })
    } else {
      result = await prisma.districtStress.create({
        data: { sessionId, district, intensity }
      })
    }

    revalidatePath(`/training/${sessionId}`)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function closeSession(sessionId: string, data: { rpe?: number; notes?: string; durationMin?: number }) {
  try {
    await getUserId() // verify auth
    const session = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        rpe: data.rpe,
        notes: data.notes,
        durationMin: data.durationMin,
      },
    })
    revalidatePath("/training")
    revalidatePath(`/training/${sessionId}`)
    return { success: true, data: session }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteSession(id: string) {
  try {
    await getUserId() // verify auth
    await prisma.workoutSession.delete({
      where: { id },
    })
    revalidatePath("/training")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

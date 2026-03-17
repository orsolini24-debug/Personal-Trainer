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

const TEMPLATES: Record<string, any[]> = {
  A: [
    { name: "Squat", sets: 4, reps: "6-8" },
    { name: "Panca Piana", sets: 4, reps: "6-8" },
    { name: "Rematore Bilanciere", sets: 4, reps: "8-10" }
  ],
  B: [
    { name: "Stacco da Terra", sets: 4, reps: "5-7" },
    { name: "Military Press", sets: 4, reps: "6-8" },
    { name: "Trazioni", sets: 4, reps: "8-10" }
  ],
  C: [
    { name: "Affondi", sets: 3, reps: "10-12" },
    { name: "Panca Inclinata Manubri", sets: 3, reps: "8-10" },
    { name: "Pulley", sets: 3, reps: "10-12" }
  ],
  D: [
    { name: "Leg Press", sets: 3, reps: "10-15" },
    { name: "Alzate Laterali", sets: 3, reps: "12-15" },
    { name: "Curl Bicipiti", sets: 3, reps: "10-12" },
    { name: "Pushdown Tricipiti", sets: 3, reps: "10-12" }
  ]
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

    // Pre-populate if template exists
    const template = TEMPLATES[data.type as string]
    if (template) {
      await prisma.exercise.createMany({
        data: template.map((ex, idx) => ({
          sessionId: session.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          orderIndex: idx
        }))
      })
    }

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

export async function getExerciseHistory(name: string) {
  try {
    const userId = await getUserId()
    const exercises = await prisma.exercise.findMany({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        session: { userId }
      },
      include: {
        session: { select: { date: true } }
      },
      orderBy: {
        session: { date: 'asc' }
      }
    })
    return { success: true, data: exercises }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function closeSession(sessionId: string, data: { rpe?: number; notes?: string; durationMin?: number; voiceNoteUrl?: string }) {
  try {
    await getUserId() // verify auth
    const trainingLoad = (data.durationMin && data.rpe) ? data.durationMin * data.rpe : null;
    const session = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        rpe: data.rpe,
        notes: data.notes,
        durationMin: data.durationMin,
        trainingLoad: trainingLoad,
        voiceNoteUrl: data.voiceNoteUrl
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

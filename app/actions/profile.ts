"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveUserProfile(data: {
  biologicalSex: string
  weightKg: number
  heightCm: number
  birthDate: string // YYYY-MM-DD
  experienceLevel: string
  trainingYears: number
  primaryGoal: string
  secondarySports: string[]
  injuriesList: string[]
  availableDays: number
  sessionDuration: number
  equipmentLevel: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  try {
    const userId = session.user.id

    // Update user base data
    await prisma.user.update({
      where: { id: userId },
      data: {
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        birthDate: new Date(data.birthDate),
      }
    })

    // Upsert profile data
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        biologicalSex: data.biologicalSex,
        experienceLevel: data.experienceLevel,
        trainingYears: data.trainingYears,
        primaryGoal: data.primaryGoal,
        secondarySports: data.secondarySports,
        injuriesList: data.injuriesList,
        availableDays: data.availableDays,
        sessionDuration: data.sessionDuration,
        equipmentLevel: data.equipmentLevel,
      },
      create: {
        userId,
        biologicalSex: data.biologicalSex,
        experienceLevel: data.experienceLevel,
        trainingYears: data.trainingYears,
        primaryGoal: data.primaryGoal,
        secondarySports: data.secondarySports,
        injuriesList: data.injuriesList,
        availableDays: data.availableDays,
        sessionDuration: data.sessionDuration,
        equipmentLevel: data.equipmentLevel,
      }
    })

    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

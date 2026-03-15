"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MetricSource } from "@prisma/client"

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non autorizzato")
  return session.user.id
}

export async function addBiometricLog(data: {
  date: Date
  weightKg?: number
  fatPct?: number
  muscleMassKg?: number
  waterPct?: number
  waistCm?: number
  hipsCm?: number
  chestCm?: number
  armCm?: number
  thighCm?: number
}) {
  try {
    const userId = await getUserId()
    const d = new Date(data.date)
    d.setUTCHours(0, 0, 0, 0)

    const log = await prisma.biometricLog.upsert({
      where: { userId_date: { userId, date: d } },
      update: {
        weightKg: data.weightKg,
        fatPct: data.fatPct,
        muscleMassKg: data.muscleMassKg,
        waterPct: data.waterPct,
        waistCm: data.waistCm,
        hipsCm: data.hipsCm,
        chestCm: data.chestCm,
        armCm: data.armCm,
        thighCm: data.thighCm,
      },
      create: {
        userId,
        date: d,
        source: MetricSource.MANUAL,
        weightKg: data.weightKg,
        fatPct: data.fatPct,
        muscleMassKg: data.muscleMassKg,
        waterPct: data.waterPct,
        waistCm: data.waistCm,
        hipsCm: data.hipsCm,
        chestCm: data.chestCm,
        armCm: data.armCm,
        thighCm: data.thighCm,
      }
    })

    revalidatePath("/body")
    return { success: true, data: log }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getBiometricHistory(days: number = 30) {
  try {
    const userId = await getUserId()
    const d = new Date()
    d.setDate(d.getDate() - days)
    
    const logs = await prisma.biometricLog.findMany({
      where: { userId, date: { gte: d } },
      orderBy: { date: 'desc' }
    })
    
    return { success: true, data: logs }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
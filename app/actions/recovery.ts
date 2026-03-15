"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Ecosystem, DataSource } from "@prisma/client"

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non autorizzato")
  return session.user.id
}

export async function saveRecoveryLog(data: {
  date: Date
  ctl?: number
  atl?: number
  tsb?: number
  hrv?: number
  rhr?: number
  sleepMin?: number
  sleepScore?: number
  recoveryScore?: number
}) {
  try {
    const userId = await getUserId()
    const d = new Date(data.date)
    d.setUTCHours(0, 0, 0, 0)

    const acwr = (data.atl != null && data.ctl != null && data.ctl > 0) ? data.atl / data.ctl : null

    const log = await prisma.recoveryLog.upsert({
      where: { userId_date: { userId, date: d } },
      update: {
        ctl: data.ctl,
        atl: data.atl,
        tsb: data.tsb,
        acwr: acwr,
        hrv: data.hrv,
        rhr: data.rhr,
        sleepMin: data.sleepMin,
        sleepScore: data.sleepScore,
        recoveryScore: data.recoveryScore,
      },
      create: {
        userId,
        date: d,
        source: DataSource.MANUAL,
        ctl: data.ctl,
        atl: data.atl,
        tsb: data.tsb,
        acwr: acwr,
        hrv: data.hrv,
        rhr: data.rhr,
        sleepMin: data.sleepMin,
        sleepScore: data.sleepScore,
        recoveryScore: data.recoveryScore,
      }
    })

    revalidatePath("/recovery")
    return { success: true, data: log }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getRecoveryHistory(days: number = 14) {
  try {
    const userId = await getUserId()
    const d = new Date()
    d.setDate(d.getDate() - days)
    
    const logs = await prisma.recoveryLog.findMany({
      where: { userId, date: { gte: d } },
      orderBy: { date: 'desc' }
    })
    
    return { success: true, data: logs }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveUserDevice(data: { ecosystem: Ecosystem, deviceModel?: string, appName?: string, isPrimary: boolean }) {
  try {
    const userId = await getUserId()
    
    if (data.isPrimary) {
      await prisma.userDevice.updateMany({
        where: { userId },
        data: { isPrimary: false }
      })
    }

    const device = await prisma.userDevice.create({
      data: {
        userId,
        ecosystem: data.ecosystem,
        deviceModel: data.deviceModel,
        appName: data.appName,
        isPrimary: data.isPrimary
      }
    })

    revalidatePath("/recovery")
    return { success: true, data: device }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
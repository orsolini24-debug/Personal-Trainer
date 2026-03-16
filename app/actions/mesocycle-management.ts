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
      // 1. Archivia l'attuale attivo
      await tx.mesocycle.updateMany({
        where: { userId, status: MesoStatus.ACTIVE },
        data: { status: MesoStatus.ARCHIVED }
      })

      // 2. Attiva questo
      await tx.mesocycle.update({
        where: { id, userId },
        data: { status: MesoStatus.ACTIVE }
      })
    })

    revalidatePath("/plan")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteMesocycle(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  try {
    await prisma.mesocycle.delete({
      where: { id, userId: session.user.id }
    })
    revalidatePath("/plan")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

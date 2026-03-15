"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MealType, FoodSource } from "@prisma/client"

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non autorizzato")
  return session.user.id
}

export async function getOrCreateNutritionDay(date: Date) {
  try {
    const userId = await getUserId()
    const d = new Date(date)
    d.setUTCHours(0, 0, 0, 0)

    let day = await prisma.nutritionDay.findUnique({
      where: { userId_date: { userId, date: d } },
      include: { meals: { include: { foodItems: true } } }
    })

    if (!day) {
      day = await prisma.nutritionDay.create({
        data: {
          userId,
          date: d,
          kcalTarget: 2500, // Default temporaneo
        },
        include: { meals: { include: { foodItems: true } } }
      })
      
      // Auto-create meals
      await prisma.meal.createMany({
        data: [
          { nutritionDayId: day.id, type: MealType.BREAKFAST },
          { nutritionDayId: day.id, type: MealType.LUNCH },
          { nutritionDayId: day.id, type: MealType.PRE_WORKOUT },
          { nutritionDayId: day.id, type: MealType.DINNER },
        ]
      })

      day = await prisma.nutritionDay.findUnique({
        where: { id: day.id },
        include: { meals: { include: { foodItems: true } } }
      })
    }

    return { success: true, data: day }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addMeal(nutritionDayId: string, type: MealType) {
  try {
    await getUserId()
    const meal = await prisma.meal.create({
      data: { nutritionDayId, type }
    })
    revalidatePath("/nutrition")
    return { success: true, data: meal }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function updateDayTotals(mealId: string) {
  const meal = await prisma.meal.findUnique({ where: { id: mealId }, select: { nutritionDayId: true } })
  if (!meal) return

  const day = await prisma.nutritionDay.findUnique({
    where: { id: meal.nutritionDayId },
    include: { meals: { include: { foodItems: true } } }
  })
  if (!day) return

  let kcal = 0, p = 0, c = 0, f = 0
  day.meals.forEach(m => {
    m.foodItems.forEach(fi => {
      kcal += fi.kcal || 0
      p += fi.proteinG || 0
      c += fi.carbsG || 0
      f += fi.fatG || 0
    })
  })

  await prisma.nutritionDay.update({
    where: { id: day.id },
    data: { kcalActual: kcal, proteinG: p, carbsG: c, fatG: f }
  })
}

export async function addFoodItem(mealId: string, data: { name: string, quantityG?: number, kcal?: number, proteinG?: number, carbsG?: number, fatG?: number, source?: FoodSource }) {
  try {
    await getUserId()
    const item = await prisma.foodItem.create({
      data: {
        mealId,
        ...data,
        source: data.source || FoodSource.MANUAL
      }
    })
    await updateDayTotals(mealId)
    revalidatePath("/nutrition")
    return { success: true, data: item }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteFoodItem(id: string) {
  try {
    await getUserId()
    const item = await prisma.foodItem.findUnique({ where: { id } })
    if (item) {
      await prisma.foodItem.delete({ where: { id } })
      await updateDayTotals(item.mealId)
      revalidatePath("/nutrition")
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateNutritionTargets(nutritionDayId: string, data: { kcalTarget?: number, proteinG?: number, carbsG?: number, fatG?: number }) {
  try {
    await getUserId()
    const day = await prisma.nutritionDay.update({
      where: { id: nutritionDayId },
      data
    })
    revalidatePath("/nutrition")
    return { success: true, data: day }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
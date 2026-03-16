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

    // Check if it's a training day
    const session = await prisma.workoutSession.findFirst({
      where: {
        userId,
        date: {
          gte: d,
          lt: new Date(d.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })
    const isTrainingDay = !!session

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })

    let day = await prisma.nutritionDay.findUnique({
      where: { userId_date: { userId, date: d } },
      include: { meals: { include: { foodItems: true } } }
    })

    // Base default values
    let baseKcal = 2200;
    let baseCarbs = 200;
    let baseProtein = 150;
    let baseFat = 70;

    // Optional dynamic calculation based on user info
    if (user?.profile?.weightKg) {
      // Very basic Mifflin-St Jeor estimate (assuming moderate activity)
      // Men: 10 x weight (kg) + 6.25 x height (cm) - 5 x age (y) + 5
      // Women: 10 x weight (kg) + 6.25 x height (cm) - 5 x age (y) - 161
      let bmr = 10 * user.profile.weightKg;
      if (user.profile.heightCm) bmr += 6.25 * user.profile.heightCm;
      
      const birthDate = user.profile.birthDate;
      if (birthDate) {
        const age = new Date().getFullYear() - birthDate.getFullYear();
        bmr -= 5 * age;
      } else if (user.profile.ageYears) {
        bmr -= 5 * user.profile.ageYears;
      }
      
      if (user.profile?.biologicalSex === "FEMALE") {
        bmr -= 161;
      } else {
        bmr += 5;
      }

      // Multiply by activity factor (assume 1.55 for moderate)
      const tdee = Math.round(bmr * 1.55);
      
      // Adjust based on goal
      if (user.profile?.primaryGoal === "WEIGHT_LOSS") baseKcal = tdee - 500;
      else if (user.profile?.primaryGoal === "HYPERTROPHY") baseKcal = tdee + 300;
      else baseKcal = tdee;

      baseProtein = Math.round(user.profile.weightKg * 2.0); // 2g/kg
      baseFat = Math.round(user.profile.weightKg * 0.8); // 0.8g/kg
      baseCarbs = Math.round((baseKcal - (baseProtein * 4) - (baseFat * 9)) / 4);
    }

    const targetKcal = isTrainingDay ? baseKcal + 400 : baseKcal;
    const targetCarbs = isTrainingDay ? baseCarbs + 100 : baseCarbs;

    if (!day) {
      day = await prisma.nutritionDay.create({
        data: {
          userId,
          date: d,
          kcalTarget: targetKcal,
          isTrainingDay,
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
          { nutritionDayId: day.id, type: MealType.SNACK },
        ]
      })

      day = await prisma.nutritionDay.findUnique({
        where: { id: day.id },
        include: { meals: { include: { foodItems: true } } }
      })
    } else if (day.isTrainingDay !== isTrainingDay || day.kcalTarget !== targetKcal) {
      // Update targets if training day status changed
      day = await prisma.nutritionDay.update({
        where: { id: day.id },
        data: {
          isTrainingDay,
          kcalTarget: targetKcal,
        },
        include: { meals: { include: { foodItems: true } } }
      })
    }

    return { success: true, data: { ...day, targetCarbs, targetProtein: baseProtein, targetFat: baseFat } }
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
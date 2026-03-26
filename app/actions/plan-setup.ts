'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SportType } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BasicProfileData {
  name: string
  ageYears: number
  biologicalSex: 'MALE' | 'FEMALE'
  heightCm: number
  experienceScore: number  // 1-10
  gymSessionsPerWeek: number
  sports: SportType[]
}

export interface ExistingPlanData {
  planDescription: string
  durationLabel: string        // "< 1 mese" | "1-3 mesi" | "3-6 mesi" | "6+ mesi"
  satisfaction: number         // 1-5
  squat1RM?: number
  bench1RM?: number
  deadlift1RM?: number
}

export interface GeneratePlanData {
  primaryGoal: string
  sessionDurationMin: number   // 30 | 45 | 60 | 90 | 120
  timelineWeeks: number        // 4 | 8 | 12 | 16 | 24
  planType: 'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY'
  upcomingEvent?: string
  injuries?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: map experienceScore (1-10) → experienceLevel string
// ─────────────────────────────────────────────────────────────────────────────

function scoreToExperienceLevel(score: number): string {
  if (score <= 2) return 'BEGINNER'
  if (score <= 5) return 'INTERMEDIATE'
  if (score <= 8) return 'ADVANCED'
  return 'ELITE'
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION 1: Save basic profile (Phase 1 of the wizard)
// ─────────────────────────────────────────────────────────────────────────────

export async function saveBasicProfile(data: BasicProfileData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  try {
    const experienceLevel = scoreToExperienceLevel(data.experienceScore)
    const trainingYears = Math.max(0, Math.round((data.experienceScore - 1) * 0.8))

    await prisma.$transaction(async (tx) => {
      // Update user name if provided
      if (data.name?.trim()) {
        await tx.user.update({
          where: { id: userId },
          data: { name: data.name.trim() }
        })
      }

      // Upsert UserProfile with basic data
      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          biologicalSex: data.biologicalSex,
          ageYears: data.ageYears,
          heightCm: data.heightCm,
          primarySport: data.sports[0] ?? 'PALESTRA',
          mainSports: data.sports,
          experienceLevel,
          trainingYears,
          availableDays: data.gymSessionsPerWeek,
          onboardingCompleted: false, // will be set true on final submit
        },
        update: {
          biologicalSex: data.biologicalSex,
          ageYears: data.ageYears,
          heightCm: data.heightCm,
          primarySport: data.sports[0] ?? 'PALESTRA',
          mainSports: data.sports,
          experienceLevel,
          trainingYears,
          availableDays: data.gymSessionsPerWeek,
        }
      })
    })

    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Database error' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION 2a: Complete with existing plan
// ─────────────────────────────────────────────────────────────────────────────

export async function completeWithExistingPlan(
  profile: BasicProfileData,
  plan: ExistingPlanData
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  try {
    await prisma.$transaction(async (tx) => {
      // Update user name
      if (profile.name?.trim()) {
        await tx.user.update({
          where: { id: userId },
          data: { name: profile.name.trim(), onboardingCompleted: true }
        })
      } else {
        await tx.user.update({
          where: { id: userId },
          data: { onboardingCompleted: true }
        })
      }

      // Build strength refs
      const strengthRefs: Record<string, number> = {}
      if (plan.squat1RM)   strengthRefs.squat1RM   = plan.squat1RM
      if (plan.bench1RM)   strengthRefs.bench1RM   = plan.bench1RM
      if (plan.deadlift1RM) strengthRefs.deadlift1RM = plan.deadlift1RM

      const experienceLevel = scoreToExperienceLevel(profile.experienceScore)

      // Upsert full profile
      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          biologicalSex: profile.biologicalSex,
          ageYears: profile.ageYears,
          heightCm: profile.heightCm,
          primarySport: profile.sports[0] ?? 'PALESTRA',
          mainSports: profile.sports,
          experienceLevel,
          trainingYears: Math.max(0, Math.round((profile.experienceScore - 1) * 0.8)),
          availableDays: profile.gymSessionsPerWeek,
          isFollowingPlan: true,
          currentPlanText: plan.planDescription,
          strengthRefs: Object.keys(strengthRefs).length ? strengthRefs : undefined,
          onboardingCompleted: true,
        },
        update: {
          biologicalSex: profile.biologicalSex,
          ageYears: profile.ageYears,
          heightCm: profile.heightCm,
          primarySport: profile.sports[0] ?? 'PALESTRA',
          mainSports: profile.sports,
          experienceLevel,
          trainingYears: Math.max(0, Math.round((profile.experienceScore - 1) * 0.8)),
          availableDays: profile.gymSessionsPerWeek,
          isFollowingPlan: true,
          currentPlanText: plan.planDescription,
          strengthRefs: Object.keys(strengthRefs).length ? strengthRefs : undefined,
          onboardingCompleted: true,
        }
      })

      // Create a placeholder ACTIVE mesocycle from the existing plan
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 56) // default 8 weeks

      await tx.mesocycle.create({
        data: {
          userId,
          name: 'Piano Corrente',
          status: 'ACTIVE',
          planType: 'TRAINING_ONLY',
          startDate,
          endDate,
          objectives: plan.planDescription || 'Piano inserito manualmente dall\'utente.',
          aiProposals: undefined,
        }
      })
    })

    revalidatePath('/plan')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Database error' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION 2b: Complete with AI-generated plan
// Saves profile + builds synthetic chat history → triggers plan generation
// ─────────────────────────────────────────────────────────────────────────────

export async function completeWithGeneratedPlan(
  profile: BasicProfileData,
  genData: GeneratePlanData
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  try {
    const experienceLevel = scoreToExperienceLevel(profile.experienceScore)

    // Save profile + mark onboarding complete
    await prisma.$transaction(async (tx) => {
      if (profile.name?.trim()) {
        await tx.user.update({
          where: { id: userId },
          data: { name: profile.name.trim(), onboardingCompleted: true }
        })
      } else {
        await tx.user.update({
          where: { id: userId },
          data: { onboardingCompleted: true }
        })
      }

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          biologicalSex: profile.biologicalSex,
          ageYears: profile.ageYears,
          heightCm: profile.heightCm,
          primarySport: profile.sports[0] ?? 'PALESTRA',
          mainSports: profile.sports,
          experienceLevel,
          trainingYears: Math.max(0, Math.round((profile.experienceScore - 1) * 0.8)),
          availableDays: profile.gymSessionsPerWeek,
          sessionDuration: genData.sessionDurationMin,
          primaryGoal: genData.primaryGoal,
          injuriesList: genData.injuries ? [genData.injuries] : [],
          onboardingCompleted: true,
        },
        update: {
          biologicalSex: profile.biologicalSex,
          ageYears: profile.ageYears,
          heightCm: profile.heightCm,
          primarySport: profile.sports[0] ?? 'PALESTRA',
          mainSports: profile.sports,
          experienceLevel,
          trainingYears: Math.max(0, Math.round((profile.experienceScore - 1) * 0.8)),
          availableDays: profile.gymSessionsPerWeek,
          sessionDuration: genData.sessionDurationMin,
          primaryGoal: genData.primaryGoal,
          injuriesList: genData.injuries ? [genData.injuries] : [],
          onboardingCompleted: true,
        }
      })
    })

    revalidatePath('/plan')
    return { success: true, triggerGeneration: true }
  } catch (e: any) {
    return { error: e.message ?? 'Database error' }
  }
}


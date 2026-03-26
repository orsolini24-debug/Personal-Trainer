'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { SportType } from '@prisma/client'
import { generatePlanFromWizard } from './plan-wizard'
import type { BasicProfileData, GeneratePlanData } from './plan-setup'

function buildSyntheticChatHistory(
  profile: BasicProfileData,
  genData: GeneratePlanData
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const sportsList = profile.sports.join(', ') || 'non specificato'
  const sexLabel = profile.biologicalSex === 'FEMALE' ? 'donna' : 'uomo'
  const userSummary = [
    `Sono un ${sexLabel} di ${profile.ageYears} anni, alto ${profile.heightCm} cm.`,
    `Mi alleno ${profile.gymSessionsPerWeek} volte a settimana, prevalentemente ${sportsList}.`,
    `Esperienza: ${profile.experienceScore}/10.`,
    `Obiettivo: ${genData.primaryGoal}.`,
    `Sessioni da ${genData.sessionDurationMin} min, ${genData.timelineWeeks} settimane.`,
    genData.upcomingEvent ? `Evento: ${genData.upcomingEvent}.` : '',
    genData.injuries ? `Infortuni: ${genData.injuries}.` : 'Nessun infortuno rilevante.',
  ].filter(Boolean).join(' ')
  return [
    { role: 'assistant', content: 'Raccontami obiettivi e situazione attuale.' },
    { role: 'user', content: userSummary },
    { role: 'assistant', content: 'Perfetto. Procedo con la generazione del piano. ###READY###' },
  ]
}

export interface NewPlanInput {
  planType: 'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY'
  primaryGoal: string
  sessionDurationMin: number
  timelineWeeks: number
  upcomingEvent?: string
  injuries?: string
}

function experienceLevelToScore(level: string | null | undefined): number {
  switch (level) {
    case 'BEGINNER':     return 2
    case 'INTERMEDIATE': return 5
    case 'ADVANCED':     return 8
    case 'ELITE':        return 10
    default:             return 3
  }
}

/**
 * Creates a new plan for a user who has already completed onboarding.
 * Reads their existing profile from DB — no need to re-fill form.
 */
export async function createNewPlanForExistingUser(input: NewPlanInput) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autorizzato' }
  const userId = session.user.id

  try {
    // 1. Read the existing profile
    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    })

    // 2. Update goal/duration on profile for the new cycle
    if (profile) {
      await prisma.userProfile.update({
        where: { userId },
        data: {
          primaryGoal: input.primaryGoal,
          sessionDuration: input.sessionDurationMin,
          injuriesList: input.injuries ? [input.injuries] : profile.injuriesList ?? [],
        }
      })
    }

    // 3. Build BasicProfileData from existing DB values
    const basicProfile = {
      name: user?.name ?? '',
      ageYears: profile?.ageYears ?? 25,
      biologicalSex: (profile?.biologicalSex ?? 'MALE') as 'MALE' | 'FEMALE',
      heightCm: profile?.heightCm ?? 175,
      experienceScore: experienceLevelToScore(profile?.experienceLevel),
      gymSessionsPerWeek: profile?.availableDays ?? 3,
      sports: (profile?.mainSports?.length ? profile.mainSports : [profile?.primarySport ?? 'PALESTRA']) as SportType[],
    }

    const genData = {
      primaryGoal: input.primaryGoal,
      sessionDurationMin: input.sessionDurationMin,
      timelineWeeks: input.timelineWeeks,
      planType: input.planType,
      upcomingEvent: input.upcomingEvent,
      injuries: input.injuries,
    }

    // 4. Build synthetic chat history + generate plan
    const chatHistory = buildSyntheticChatHistory(basicProfile, genData)
    await generatePlanFromWizard(chatHistory, input.planType)

    revalidatePath('/plan')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Errore generazione piano' }
  }
}

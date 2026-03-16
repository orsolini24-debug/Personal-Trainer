'use server'

import { auth } from '@/auth'
import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'
import { SportType } from '@prisma/client'
import { completeDeepOnboarding, type DeepOnboardingData } from './deep-onboarding'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

const VALID_SPORTS: SportType[] = [
  'PALESTRA', 'SOCCER', 'PADEL', 'TENNIS', 'BASKETBALL', 'VOLLEYBALL', 'GYMNASTICS', 'CROSSFIT', 
  'HYROX', 'HOCKEY', 'BASEBALL', 'AMERICAN_FOOTBALL', 'RUGBY', 'CRICKET', 'HANDBALL', 'LACROSS',
  'RUNNING', 'TRAIL_RUNNING', 'SPRINTING', 'MARATHON', 'TRIATHLON', 'OBSTACLE_RACING',
  'SKIING', 'SKI_TOURING', 'SNOWBOARDING', 'MOUNTAINEERING', 'CLIMBING', 'TREKKING', 
  'MTB', 'GRAVEL_BIKING', 'CYCLING', 'SWIMMING', 'OPEN_WATER_SWIMMING', 'WATER_POLO', 
  'ROWING', 'KAYAKING', 'SURFING', 'WINDSURFING', 'KITESURFING', 'SAILING', 'DIVING', 'SUP',
  'COMBAT', 'BOXING', 'MUAY_THAI', 'KICKBOXING', 'MMA', 'BJJ', 'JUDO', 'KARATE', 
  'TAEKWONDO', 'WRESTLING', 'FENCING', 'YOGA', 'PILATES', 'GOLF', 'BADMINTON', 
  'SQUASH', 'SKATING', 'ARCHERY', 'EQUESTRIAN', 'DANCING', 'CALISTHENICS', 'OTHER'
]

function validateSport(s: string): SportType {
  const upper = (s || '').toUpperCase().replace(/\s+/g, '_') as SportType
  if (VALID_SPORTS.includes(upper)) return upper
  if (upper.includes('BOULDER')) return 'CLIMBING'
  if (upper.includes('CALCETTO') || upper.includes('CALCIOTTO')) return 'SOCCER'
  if (upper.includes('BODYBUILDING') || upper.includes('WEIGHTLIFTING')) return 'PALESTRA'
  if (upper.includes('ARRAMPICATA')) return 'CLIMBING'
  if (upper.includes('LOTTA')) return 'COMBAT'
  if (upper.includes('SCI')) return 'SKIING'
  return 'OTHER'
}

export async function chatWithPT(messages: { role: 'user' | 'assistant' | 'system', content: string }[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const systemPrompt = `Sei un Personal Trainer d'élite. Fai un'intervista profonda. 
  REGOLE:
  1. Una domanda alla volta.
  2. Approfondisci infortuni e carichi (es. i 100kg di panca citati).
  3. Quando hai tutto, scrivi ###FINISH###.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    })
    return { response: completion.choices[0].message.content || "" }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function extractProfileData(messages: { role: 'user' | 'assistant' | 'system', content: string }[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const extractionPrompt = `Estrai i dati in JSON. Sport ammessi: ${VALID_SPORTS.join(', ')}.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: "Estrai JSON puro per DeepOnboardingData." },
        { role: 'user', content: `Chat:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n${extractionPrompt}` }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    })

    const raw = JSON.parse(completion.choices[0].message.content || "{}")
    
    const sanitized: DeepOnboardingData = {
      biologicalSex: raw.biologicalSex === 'FEMALE' ? 'FEMALE' : 'MALE',
      ageYears: Math.max(1, Number(raw.ageYears) || 25),
      weightKg: Math.max(1, Number(raw.weightKg) || 70),
      heightCm: Math.max(1, Number(raw.heightCm) || 175),
      primarySport: validateSport(raw.primarySport || 'PALESTRA'),
      mainSports: Array.isArray(raw.mainSports) ? raw.mainSports.map(validateSport) : [validateSport(raw.primarySport || 'PALESTRA')],
      sportLevels: raw.sportLevels || {},
      experienceLevel: raw.experienceLevel || 'INTERMEDIATE',
      trainingYears: Number(raw.trainingYears) || 1,
      strengthRefs: raw.strengthRefs || {},
      primaryGoal: raw.primaryGoal || 'Performance',
      isFollowingPlan: !!raw.isFollowingPlan,
      currentPlanText: raw.currentPlanText || "",
      targetEvent: raw.targetEvent || "",
      dietaryType: raw.dietaryType || 'OMNIVORE',
      eatingRoutine: {
        mealsPerDay: Number(raw.eatingRoutine?.mealsPerDay) || 3,
        snacks: !!raw.eatingRoutine?.snacks,
        intermittentFasting: !!raw.eatingRoutine?.intermittentFasting
      },
      availableDays: Math.min(7, Math.max(1, Number(raw.availableDays) || 3)),
      sessionDuration: Math.max(1, Number(raw.sessionDuration) || 60),
      equipmentLevel: raw.equipmentLevel || 'FULL_GYM',
      preferredSplit: raw.preferredSplit || "CUSTOM",
      injuriesList: Array.isArray(raw.injuriesList) ? raw.injuriesList : [],
      hasProfessionalData: false,
      dailyRoutine: raw.dailyRoutine || "",
      favoriteFoods: Array.isArray(raw.favoriteFoods) ? raw.favoriteFoods : [],
      dislikedFoods: Array.isArray(raw.dislikedFoods) ? raw.dislikedFoods : [],
      allergies: Array.isArray(raw.allergies) ? raw.allergies : []
    }

    return await completeDeepOnboarding(sanitized)
  } catch (e: any) {
    return { error: e.message }
  }
}

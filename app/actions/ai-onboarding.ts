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

  // Recupero info base se esistono per contestualizzare
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id }
  })

  const systemPrompt = `Sei l'Apex Performance Onboarder. Il tuo compito è profilare l'atleta per creare un piano perfetto.
  REGOLE:
  1. ADATTABILITÀ: Se l'utente vuole solo dimagrire, correre o non fa palestra, NON parlare di "carichi", "panca" o "sala pesi". Focalizzati sulla sua costanza, routine e obiettivi reali (es. mobilità, perdita peso).
  2. UNA DOMANDA ALLA VOLTA: Non inondare l'utente di domande.
  3. APPROFONDIMENTO: Chiedi della sua routine quotidiana (es. quante ore sta seduto), infortuni passati e attrezzatura a disposizione.
  4. TONO: Professionale, d'élite, ma empatico e adattato allo sport dell'atleta.
  5. CONCLUSIONE: Quando hai un quadro completo (Bio, Sport, Obiettivi, Routine, Logistica), scrivi ###FINISH###.`

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

  const extractionPrompt = `Estrai i dati dall'intervista in JSON per DeepOnboardingData. 
  REGOLE ESTRAZIONE:
  - primarySport: scegli tra ${VALID_SPORTS.join(', ')}.
  - equipmentLevel: valuta bene se l'utente ha detto di NON andare in palestra. In quel caso usa 'NONE' o 'BODYWEIGHT'. 
  - dailyRoutine: estrai dettagli sulla sedentarietà (es. "10 ore al PC").
  - experienceLevel: 'BEGINNER' se non si è mai allenato seriamente.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: "Estrai JSON puro per DeepOnboardingData basandoti sull'intervista." },
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
      primarySport: validateSport(raw.primarySport || 'OTHER'),
      mainSports: Array.isArray(raw.mainSports) ? raw.mainSports.map(validateSport) : [validateSport(raw.primarySport || 'OTHER')],
      sportLevels: raw.sportLevels || {},
      experienceLevel: raw.experienceLevel || 'BEGINNER',
      trainingYears: Number(raw.trainingYears) || 0,
      strengthRefs: raw.strengthRefs || {},
      primaryGoal: raw.primaryGoal || 'Salute',
      isFollowingPlan: !!raw.isFollowingPlan,
      currentPlanText: raw.currentPlanText || "",
      targetEvent: raw.targetEvent || "",
      dietaryPreferences: raw.dietaryPreferences || [],
    }
  } catch {
    return null
  }
}

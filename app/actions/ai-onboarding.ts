'use server'

import { auth } from '@/auth'
import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'
import { SportType } from '@prisma/client'
import { completeDeepOnboarding, DeepOnboardingData } from './deep-onboarding'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

// Lista ufficiale SportType dal database per validazione
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
  const upper = s.toUpperCase() as SportType
  if (VALID_SPORTS.includes(upper)) return upper
  
  // Mapping di emergenza per sport comuni
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

  const systemPrompt = `Sei un Personal Trainer d'élite e Preparatore Atletico specializzato in Ricomposizione Corporea e Performance.
Il tuo obiettivo è fare un'intervista approfondita (Intake) all'atleta per creare il piano perfetto. 

REGOLE DI CONVERSAZIONE:
1. Sii professionale, empatico e molto tecnico. Approfondisci ogni risposta.
2. Se l'utente menziona infortuni (es. crociato, dita rotte), chiedi come influenzano il movimento oggi.
3. Se l'utente fornisce carichi (es. 100kg panca), usali per capire il suo livello di forza.
4. Raccogli: Biometria, Sport DNA (tutti gli sport), Livello, Obiettivi, Nutrizione, Logistica.
5. Quando hai un quadro COMPLETO e DETTAGLIATO, scrivi come ULTIMA parola: "###FINISH###".`

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

  const extractionPrompt = `Analizza la conversazione ed estrai un JSON per DeepOnboardingData.
  
  Enum SportType ammessi: ${VALID_SPORTS.join(', ')}.
  
  Mappa ogni sport citato su uno di questi valori. 
  Esempio: "Boulder" -> "CLIMBING", "Calcetto" -> "SOCCER".
  
  JSON richiesto:
  {
    "biologicalSex": "MALE" | "FEMALE",
    "ageYears": number,
    "weightKg": number,
    "heightCm": number,
    "primarySport": SportType,
    "mainSports": SportType[],
    "experienceLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    "primaryGoal": string,
    "dietaryType": string,
    "eatingRoutine": { "mealsPerDay": number, "snacks": boolean, "intermittentFasting": boolean },
    "availableDays": number,
    "sessionDuration": number,
    "equipmentLevel": "FULL_GYM" | "HOME_GYM" | "BODYWEIGHT_ONLY",
    "injuriesList": string[],
    "strengthRefs": { "squat1RM": number, "bench1RM": number, "deadlift1RM": number }
  }`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: "Estrai i dati dall'intervista PT in formato JSON puro." },
        { role: 'user', content: `Conversazione:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n${extractionPrompt}` }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    })

    const raw = JSON.parse(completion.choices[0].message.content || "{}")
    
    // VALIDAZIONE E SANITIZZAZIONE RIGIDA
    const sanitized: DeepOnboardingData = {
      biologicalSex: raw.biologicalSex === 'FEMALE' ? 'FEMALE' : 'MALE',
      ageYears: Math.max(1, Number(raw.ageYears) || 25),
      weightKg: Math.max(1, Number(raw.weightKg) || 70),
      heightCm: Math.max(1, Number(raw.heightCm) || 175),
      primarySport: validateSport(raw.primarySport || 'PALESTRA'),
      mainSports: Array.isArray(raw.mainSports) ? raw.mainSports.map(validateSport) : [validateSport(raw.primarySport || 'PALESTRA')],
      experienceLevel: raw.experienceLevel || 'INTERMEDIATE',
      primaryGoal: raw.primaryGoal || 'Miglioramento Performance',
      dietaryType: raw.dietaryType || 'OMNIVORE',
      eatingRoutine: {
        mealsPerDay: Number(raw.eatingRoutine?.mealsPerDay) || 3,
        snacks: !!raw.eatingRoutine?.snacks,
        intermittentFasting: !!raw.eatingRoutine?.intermittentFasting
      },
      availableDays: Math.min(7, Math.max(1, Number(raw.availableDays) || 3)),
      sessionDuration: Math.max(1, Number(raw.sessionDuration) || 60),
      equipmentLevel: raw.equipmentLevel || 'FULL_GYM',
      injuriesList: Array.isArray(raw.injuriesList) ? raw.injuriesList : [],
      strengthRefs: {
        squat1RM: Number(raw.strengthRefs?.squat1RM) || 0,
        bench1RM: Number(raw.strengthRefs?.bench1RM) || 0,
        deadlift1RM: Number(raw.strengthRefs?.deadlift1RM) || 0
      },
      hasProfessionalData: false,
      trainingYears: 1,
      dailyRoutine: "",
      preferredSplit: "CUSTOM",
      favoriteFoods: [],
      dislikedFoods: [],
      allergies: []
    }

    return await completeDeepOnboarding(sanitized)
  } catch (e: any) {
    return { error: e.message }
  }
}

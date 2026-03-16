'use server'

import { auth } from '@/auth'
import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SportType } from '@prisma/client'
import { completeDeepOnboarding, DeepOnboardingData } from './deep-onboarding'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

export async function chatWithPT(messages: { role: 'user' | 'assistant' | 'system', content: string }[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const systemPrompt = `Sei un Personal Trainer d'élite e Preparatore Atletico.
Il tuo obiettivo è fare un'intervista approfondita (Intake) all'atleta per creare il piano perfetto.

REGOLE DI CONVERSAZIONE:
1. Sii professionale, empatico e tecnico.
2. Fai UNA domanda alla volta. Non sommergere l'utente.
3. Se l'utente menziona dolori o infortuni, approfondisci (es. "Da quanto tempo hai dolore al ginocchio? In quali movimenti?").
4. Devi raccogliere:
   - Biometria (Sesso, Età, Peso, Altezza).
   - Sport DNA (Tutti gli sport praticati, con focus su quello primario).
   - Livello (Anni di allenamento, carichi attuali se fa palestra).
   - Obiettivi (Cosa vuole ottenere in 30 giorni).
   - Nutrizione (Tipo di dieta, pasti, cibi preferiti/odiati).
   - Logistica (Giorni liberi, durata sessione, attrezzatura).
5. Quando pensi di avere TUTTE le informazioni necessarie, scrivi come ULTIMA parola del messaggio: "###FINISH###".

Dati già raccolti (se presenti):
${JSON.stringify(messages.filter(m => m.role === 'system'), null, 2)}
`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content || ""
    return { response }
  } catch (e: any) {
    console.error("AI Chat Error:", e)
    return { error: e.message }
  }
}

export async function extractProfileData(messages: { role: 'user' | 'assistant' | 'system', content: string }[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const extractionPrompt = `Analizza la conversazione tra il PT e l'atleta ed estrai un oggetto JSON completo basato sull'interfaccia DeepOnboardingData.

REGOLE CRITICHE PER GLI SPORT (SportType):
Usa SOLO questi valori esatti. Se lo sport non è in lista, usa 'OTHER' o quello più vicino:
PALESTRA, SOCCER, PADEL, TENNIS, BASKETBALL, VOLLEYBALL, GYMNASTICS, CROSSFIT, HYROX, HOCKEY, BASEBALL, AMERICAN_FOOTBALL, RUGBY, CRICKET, HANDBALL, LACROSS, RUNNING, TRAIL_RUNNING, SPRINTING, MARATHON, TRIATHLON, OBSTACLE_RACING, SKIING, SKI_TOURING, SNOWBOARDING, MOUNTAINEERING, CLIMBING, TREKKING, MTB, GRAVEL_BIKING, CYCLING, SWIMMING, OPEN_WATER_SWIMMING, WATER_POLO, ROWING, KAYAKING, SURFING, WINDSURFING, KITESURFING, SAILING, DIVING, SUP, COMBAT, BOXING, MUAY_THAI, KICKBOXING, MMA, BJJ, JUDO, KARATE, TAEKWONDO, WRESTLING, FENCING, YOGA, PILATES, GOLF, BADMINTON, SQUASH, SKATING, ARCHERY, EQUESTRIAN, DANCING, CALISTHENICS, OTHER.

Interfaccia richiesta (JSON):
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
  "favoriteFoods": string[],
  "dislikedFoods": string[],
  "allergies": string[],
  "availableDays": number,
  "sessionDuration": number,
  "equipmentLevel": "FULL_GYM" | "HOME_GYM" | "BODYWEIGHT_ONLY",
  "injuriesList": string[]
}

Conversazione:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

IMPORTANTE: 
- Assicurati che primarySport e mainSports contengano solo i valori Enum sopra elencati.
- Se un dato numerico manca, usa 0.
- Se una stringa manca, usa "".
- Non usare null o undefined.
`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: extractionPrompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    })

    const rawData = JSON.parse(completion.choices[0].message.content || "{}")
    
    // Sanitizzazione finale prima del DB
    const extractedData: DeepOnboardingData = {
      biologicalSex: rawData.biologicalSex || "MALE",
      ageYears: Number(rawData.ageYears) || 25,
      weightKg: Number(rawData.weightKg) || 70,
      heightCm: Number(rawData.heightCm) || 170,
      primarySport: rawData.primarySport || "PALESTRA",
      mainSports: Array.isArray(rawData.mainSports) ? rawData.mainSports : ["PALESTRA"],
      experienceLevel: rawData.experienceLevel || "BEGINNER",
      primaryGoal: rawData.primaryGoal || "",
      dietaryType: rawData.dietaryType || "OMNIVORE",
      eatingRoutine: {
        mealsPerDay: Number(rawData.eatingRoutine?.mealsPerDay) || 3,
        snacks: !!rawData.eatingRoutine?.snacks,
        intermittentFasting: !!rawData.eatingRoutine?.intermittentFasting
      },
      favoriteFoods: Array.isArray(rawData.favoriteFoods) ? rawData.favoriteFoods : [],
      dislikedFoods: Array.isArray(rawData.dislikedFoods) ? rawData.dislikedFoods : [],
      allergies: Array.isArray(rawData.allergies) ? rawData.allergies : [],
      availableDays: Number(rawData.availableDays) || 3,
      sessionDuration: Number(rawData.sessionDuration) || 60,
      equipmentLevel: rawData.equipmentLevel || "FULL_GYM",
      preferredSplit: "CUSTOM",
      injuriesList: Array.isArray(rawData.injuriesList) ? rawData.injuriesList : [],
      hasProfessionalData: false,
      trainingYears: 1,
      strengthRefs: {},
      dailyRoutine: ""
    }
    
    const res = await completeDeepOnboarding(extractedData)
    return res
  } catch (e: any) {
    console.error("Data Extraction Error:", e)
    return { error: e.message }
  }
}

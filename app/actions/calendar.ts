'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SessionType, SportType } from '@prisma/client'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface ManualActivitySummary {
  id: string
  title: string
  sportType: SportType | null
  customType: string | null
  durationMin: number | null
  distanceKm: number | null
  heartRateAvg: number | null
  calories: number | null
  source: string
  aiSummary: string | null
  notes: string | null
  attachmentCount: number
  createdAt: string
}

export interface CalendarDayData {
  date: string // ISO date string YYYY-MM-DD
  planned?: {
    id: string
    planDayId: string
    status: 'PENDING' | 'COMPLETED' | 'SKIPPED'
    label: string
    focus: string | null
    exerciseCount: number
  }
  workout?: {
    id: string
    type: string
    duration?: number | null
    load?: number | null
    rpe?: number | null
    notes?: string | null
  }
  manualActivities: ManualActivitySummary[]
  hasNutrition: boolean
  hasRecovery: boolean
  hasBiometrics: boolean
  analysis?: {
    adherenceScore: number | null
    hasAnalysis: boolean
  }
}

export interface DayDetailData {
  date: string
  planned?: {
    id: string
    planDayId: string
    status: string
    label: string
    focus: string | null
    notes: string | null
    exercises: {
      id: string
      name: string
      sets: number
      repsMin: number
      repsMax: number
      targetRir: number
      restSec: number
      orderIndex: number
    }[]
  }
  workout?: {
    id: string
    type: string
    duration: number | null
    load: number | null
    rpe: number | null
    notes: string | null
    exerciseCount: number
  }
  manualActivities: ManualActivitySummary[]
  nutrition?: {
    calories: number | null
    protein: number | null
    carbs: number | null
    fat: number | null
  } | null
  recovery?: {
    sleepMin: number | null
    sleepScore: number | null
    hrv: number | null
    recoveryScore: number | null
    rhr: number | null
  } | null
  biometrics?: {
    weightKg: number | null
    fatPct: number | null
  } | null
  analysis?: {
    id: string
    analysisText: string
    adherenceScore: number | null
    suggestedAdaptations: string | null
    appliedAt: string | null
    createdAt: string
  } | null
}

export interface AddManualActivityInput {
  date: string
  title: string
  sportType?: SportType | null
  customType?: string
  durationMin?: number
  distanceKm?: number
  heartRateAvg?: number
  heartRateMax?: number
  calories?: number
  notes?: string
  rawJson?: string       // JSON string from watch export
  imageBase64?: string   // base64 for OCR via Vision
  imageTitle?: string
}

// ─── Get calendar month ────────────────────────────────────────────────────────

export async function getCalendarMonthData(year: number, month: number): Promise<CalendarDayData[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  const [planned, actual, nutrition, recovery, biometrics, manualActivitiesRaw, analyses] = await Promise.all([
    prisma.plannedSession.findMany({
      where: { userId, scheduledDate: { gte: startDate, lte: endDate } },
      include: {
        planDay: {
          include: {
            planExercises: { select: { id: true } }
          }
        }
      }
    }),
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } }
    }),
    prisma.nutritionDay.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { date: true }
    }),
    prisma.recoveryLog.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { date: true }
    }),
    prisma.biometricLog.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { date: true }
    }),
    prisma.manualActivity.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.dailyAnalysis.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { date: true, adherenceScore: true }
    }),
  ])

  // Initialize month days
  const data: Record<string, CalendarDayData> = {}
  for (let d = 1; d <= new Date(year, month, 0).getDate(); d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    data[dateStr] = {
      date: dateStr,
      manualActivities: [],
      hasNutrition: false,
      hasRecovery: false,
      hasBiometrics: false
    }
  }

  planned.forEach(p => {
    const dateStr = p.scheduledDate.toISOString().split('T')[0]
    if (data[dateStr]) {
      data[dateStr].planned = {
        id: p.id,
        planDayId: p.planDayId,
        status: p.status as 'PENDING' | 'COMPLETED' | 'SKIPPED',
        label: p.planDay.dayLabel,
        focus: p.planDay.focus,
        exerciseCount: p.planDay.planExercises.length
      }
    }
  })

  actual.forEach(w => {
    const dateStr = w.date.toISOString().split('T')[0]
    if (data[dateStr]) {
      data[dateStr].workout = {
        id: w.id,
        type: w.type,
        duration: w.durationMin,
        load: w.trainingLoad,
        rpe: w.rpe,
        notes: w.notes
      }
    }
  })

  nutrition.forEach(n => {
    const dateStr = n.date.toISOString().split('T')[0]
    if (data[dateStr]) data[dateStr].hasNutrition = true
  })

  recovery.forEach(r => {
    const dateStr = r.date.toISOString().split('T')[0]
    if (data[dateStr]) data[dateStr].hasRecovery = true
  })

  biometrics.forEach(b => {
    const dateStr = b.date.toISOString().split('T')[0]
    if (data[dateStr]) data[dateStr].hasBiometrics = true
  })

  manualActivitiesRaw.forEach((a) => {
    const dateStr = (a.date instanceof Date ? a.date : new Date(a.date)).toISOString().split('T')[0]
    if (data[dateStr]) {
      data[dateStr].manualActivities.push({
        id: a.id,
        title: a.title,
        sportType: a.sportType,
        customType: a.customType,
        durationMin: a.durationMin,
        distanceKm: a.distanceKm,
        heartRateAvg: a.heartRateAvg,
        calories: a.calories,
        source: a.source,
        aiSummary: a.aiSummary,
        notes: a.notes,
        attachmentCount: Array.isArray(a.attachments) ? a.attachments.length : 0,
        createdAt: a.createdAt.toISOString()
      })
    }
  })

  analyses.forEach((an) => {
    const dateStr = (an.date instanceof Date ? an.date : new Date(an.date)).toISOString().split('T')[0]
    if (data[dateStr]) {
      data[dateStr].analysis = {
        adherenceScore: an.adherenceScore,
        hasAnalysis: true
      }
    }
  })

  return Object.values(data).sort((a, b) => a.date.localeCompare(b.date))
}

// ─── Get day detail ────────────────────────────────────────────────────────────

export async function getDayDetail(dateISO: string): Promise<DayDetailData | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const date = new Date(dateISO + 'T00:00:00Z')
  const dateEnd = new Date(dateISO + 'T23:59:59Z')

  const [planned, workout, nutrition, recovery, biometrics, manualActivitiesRaw, analysis] = await Promise.all([
    prisma.plannedSession.findFirst({
      where: { userId, scheduledDate: { gte: date, lte: dateEnd } },
      include: {
        planDay: {
          include: {
            planExercises: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    }),
    prisma.workoutSession.findFirst({
      where: { userId, date: { gte: date, lte: dateEnd } },
      include: { exercises: { select: { id: true } } }
    }),
    prisma.nutritionDay.findFirst({
      where: { userId, date: { gte: date, lte: dateEnd } }
    }),
    prisma.recoveryLog.findFirst({
      where: { userId, date: { gte: date, lte: dateEnd } }
    }),
    prisma.biometricLog.findFirst({
      where: { userId, date: { gte: date, lte: dateEnd } }
    }),
    prisma.manualActivity.findMany({
      where: { userId, date: { gte: date, lte: dateEnd } },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.dailyAnalysis.findFirst({
      where: { userId, date: { gte: date, lte: dateEnd } }
    }),
  ])

  return {
    date: dateISO,
    planned: planned ? {
      id: planned.id,
      planDayId: planned.planDayId,
      status: planned.status,
      label: planned.planDay.dayLabel,
      focus: planned.planDay.focus,
      notes: planned.planDay.notes,
      exercises: planned.planDay.planExercises.map(pe => ({
        id: pe.id,
        name: pe.name,
        sets: pe.sets,
        repsMin: pe.repsMin,
        repsMax: pe.repsMax,
        targetRir: pe.targetRir,
        restSec: pe.restSec,
        orderIndex: pe.orderIndex
      }))
    } : undefined,
    workout: workout ? {
      id: workout.id,
      type: workout.type,
      duration: workout.durationMin,
      load: workout.trainingLoad,
      rpe: workout.rpe,
      notes: workout.notes,
      exerciseCount: workout.exercises.length
    } : undefined,
    manualActivities: manualActivitiesRaw.map((a) => ({
      id: a.id,
      title: a.title,
      sportType: a.sportType,
      customType: a.customType,
      durationMin: a.durationMin,
      distanceKm: a.distanceKm,
      heartRateAvg: a.heartRateAvg,
      calories: a.calories,
      source: a.source,
      aiSummary: a.aiSummary,
      notes: a.notes,
      attachmentCount: Array.isArray(a.attachments) ? a.attachments.length : 0,
      createdAt: a.createdAt.toISOString()
    })),
    nutrition: nutrition ? {
      calories: nutrition.kcalActual,
      protein: nutrition.proteinG,
      carbs: nutrition.carbsG,
      fat: nutrition.fatG,
    } : null,
    recovery: recovery ? {
      sleepMin: recovery.sleepMin,
      sleepScore: recovery.sleepScore,
      hrv: recovery.hrv,
      recoveryScore: recovery.recoveryScore,
      rhr: recovery.rhr,
    } : null,
    biometrics: biometrics ? {
      weightKg: biometrics.weightKg,
      fatPct: biometrics.fatPct,
    } : null,
    analysis: analysis ? {
      id: analysis.id,
      analysisText: analysis.analysisText,
      adherenceScore: analysis.adherenceScore,
      suggestedAdaptations: analysis.suggestedAdaptations,
      appliedAt: analysis.appliedAt?.toISOString() ?? null,
      createdAt: analysis.createdAt.toISOString()
    } : null
  }
}

// ─── Parse watch JSON ──────────────────────────────────────────────────────────

export async function parseWatchJSON(jsonStr: string): Promise<Partial<AddManualActivityInput>> {
  try {
    const raw = JSON.parse(jsonStr)

    // Suunto format
    if (raw.MoveData || raw.Header) {
      const h = raw.Header ?? {}
      const md = raw.MoveData ?? {}
      return {
        title: h.ActivityName ?? 'Attività Suunto',
        sportType: mapSportType(h.ActivityType),
        durationMin: h.Duration ? Math.round(h.Duration / 60) : undefined,
        distanceKm: h.Distance ? h.Distance / 1000 : undefined,
        heartRateAvg: md.AvgHeartRate ?? h.AvgHeartRate ?? undefined,
        heartRateMax: md.MaxHeartRate ?? h.MaxHeartRate ?? undefined,
        calories: h.Calories ?? undefined,
      }
    }

    // Garmin Connect format
    if (raw.activityId || raw.activityName) {
      return {
        title: raw.activityName ?? 'Attività Garmin',
        sportType: mapSportType(raw.activityType?.typeKey ?? raw.sport),
        durationMin: raw.duration ? Math.round(raw.duration / 60) : undefined,
        distanceKm: raw.distance ? raw.distance / 1000 : undefined,
        heartRateAvg: raw.averageHR ?? undefined,
        heartRateMax: raw.maxHR ?? undefined,
        calories: raw.calories ?? undefined,
      }
    }

    // Polar format
    if (raw['polar-exercise-data'] || raw.sport) {
      const d = raw['polar-exercise-data'] ?? raw
      return {
        title: `Attività Polar – ${d.sport ?? 'Sport'}`,
        sportType: mapSportType(d.sport),
        durationMin: d['training-load']?.duration
          ? Math.round(parseInt(d['training-load'].duration) / 60)
          : undefined,
        distanceKm: d.distance ? parseFloat(d.distance) / 1000 : undefined,
        heartRateAvg: d.heart_rate?.average ?? undefined,
        heartRateMax: d.heart_rate?.maximum ?? undefined,
        calories: d.calories ? parseInt(d.calories) : undefined,
      }
    }

    // Generic / custom format — try common fields
    const generic: Partial<AddManualActivityInput> = {
      title: raw.name ?? raw.title ?? raw.activityName ?? 'Attività importata',
      sportType: mapSportType(raw.sport ?? raw.type ?? raw.sportType),
      durationMin: raw.durationMin ?? raw.duration_minutes ?? (raw.duration ? Math.round(raw.duration / 60) : undefined),
      distanceKm: raw.distanceKm ?? raw.distance_km ?? (raw.distance ? raw.distance / 1000 : undefined),
      heartRateAvg: raw.heartRateAvg ?? raw.avg_hr ?? raw.averageHR,
      heartRateMax: raw.heartRateMax ?? raw.max_hr ?? raw.maxHR,
      calories: raw.calories ?? raw.kcal,
    }

    // If we got at least a title, return it
    if (generic.title) return generic

    // Fallback: send to Groq for extraction
    throw new Error('Unknown format')
  } catch {
    // Use Groq to parse unknown JSON formats
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Sei un parser di dati fitness. Analizza il JSON di un'attività sportiva e restituisci SOLO un JSON con questi campi (null se non presenti):
{"title": string, "sportType": null|"RUNNING"|"CYCLING"|"SWIMMING"|"STRENGTH"|"YOGA"|"HIIT"|"WALKING"|"ROWING"|"SKIING"|"OTHER", "durationMin": number|null, "distanceKm": number|null, "heartRateAvg": number|null, "heartRateMax": number|null, "calories": number|null}`
          },
          { role: 'user', content: jsonStr.substring(0, 3000) }
        ],
        max_tokens: 300,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
      return JSON.parse(res.choices[0]?.message?.content ?? '{}')
    } catch {
      return { title: 'Attività importata' }
    }
  }
}

function mapSportType(raw: string | undefined | null): SportType | undefined {
  if (!raw) return undefined
  const s = raw.toLowerCase()
  if (s.includes('run') || s.includes('corsa')) return 'RUNNING'
  if (s.includes('cycl') || s.includes('bik') || s.includes('ciclismo')) return 'CYCLING'
  if (s.includes('swim') || s.includes('nuoto')) return 'SWIMMING'
  if (s.includes('strength') || s.includes('gym') || s.includes('weight') || s.includes('palestra') || s.includes('forza')) return 'STRENGTH'
  if (s.includes('yoga')) return 'YOGA'
  if (s.includes('hiit') || s.includes('circuit')) return 'HIIT'
  if (s.includes('walk') || s.includes('cammin') || s.includes('hiking')) return 'WALKING'
  if (s.includes('row') || s.includes('canottaggio')) return 'ROWING'
  if (s.includes('ski') || s.includes('snow')) return 'SKIING'
  return 'OTHER'
}

// ─── Parse image attachment via OCR ───────────────────────────────────────────

export async function parseImageAttachment(
  base64: string,
  title?: string
): Promise<Partial<AddManualActivityInput>> {
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analizza questa immagine (screenshot di orologio/app fitness/bilancia) ed estrai i dati.
Restituisci SOLO un JSON con questi campi (null se non presenti):
{"title": string, "sportType": null|"RUNNING"|"CYCLING"|"SWIMMING"|"STRENGTH"|"YOGA"|"HIIT"|"WALKING"|"ROWING"|"SKIING"|"OTHER", "durationMin": number|null, "distanceKm": number|null, "heartRateAvg": number|null, "heartRateMax": number|null, "calories": number|null, "weightKg": number|null, "bodyFatPct": number|null, "summary": string}`
            },
            { type: 'image_url', image_url: { url: base64 } }
          ]
        }
      ],
      max_tokens: 400,
      temperature: 0.1,
    })

    const content = res.choices[0]?.message?.content ?? '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { title: title ?? 'Attività da immagine' }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      title: parsed.title ?? title ?? 'Attività da immagine',
      sportType: parsed.sportType as SportType ?? null,
      durationMin: parsed.durationMin,
      distanceKm: parsed.distanceKm,
      heartRateAvg: parsed.heartRateAvg,
      heartRateMax: parsed.heartRateMax,
      calories: parsed.calories,
    }
  } catch {
    return { title: title ?? 'Attività da immagine' }
  }
}

// ─── Add manual activity ───────────────────────────────────────────────────────

export async function addManualActivity(
  input: AddManualActivityInput
): Promise<{ success: boolean; id?: string; error?: string; parsedData?: Partial<AddManualActivityInput> }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Non autorizzato' }
  const userId = session.user.id

  let finalInput = { ...input }

  // Parse JSON if provided
  if (input.rawJson) {
    try {
      const parsed = await parseWatchJSON(input.rawJson)
      finalInput = {
        ...finalInput,
        title: finalInput.title || parsed.title || 'Attività importata',
        sportType: finalInput.sportType ?? parsed.sportType,
        durationMin: finalInput.durationMin ?? parsed.durationMin,
        distanceKm: finalInput.distanceKm ?? parsed.distanceKm,
        heartRateAvg: finalInput.heartRateAvg ?? parsed.heartRateAvg,
        heartRateMax: finalInput.heartRateMax ?? parsed.heartRateMax,
        calories: finalInput.calories ?? parsed.calories,
      }
    } catch { /* keep original input */ }
  }

  // Parse image if provided
  if (input.imageBase64) {
    try {
      const parsed = await parseImageAttachment(input.imageBase64, input.imageTitle)
      finalInput = {
        ...finalInput,
        title: finalInput.title || parsed.title || 'Attività da immagine',
        sportType: finalInput.sportType ?? parsed.sportType,
        durationMin: finalInput.durationMin ?? parsed.durationMin,
        distanceKm: finalInput.distanceKm ?? parsed.distanceKm,
        heartRateAvg: finalInput.heartRateAvg ?? parsed.heartRateAvg,
        heartRateMax: finalInput.heartRateMax ?? parsed.heartRateMax,
        calories: finalInput.calories ?? parsed.calories,
      }
    } catch { /* keep original input */ }
  }

  // Generate AI summary if we have data
  let aiSummary: string | null = null
  if (finalInput.durationMin || finalInput.distanceKm || finalInput.heartRateAvg) {
    try {
      const summaryRes = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Sei un coach fitness. Scrivi un breve riassunto (1-2 frasi in italiano) dell\'attività con commento sulla prestazione.' },
          {
            role: 'user',
            content: `Attività: ${finalInput.title} (${finalInput.sportType ?? 'generico'})
Durata: ${finalInput.durationMin ?? '?'} min
Distanza: ${finalInput.distanceKm ?? '?'} km
FC media: ${finalInput.heartRateAvg ?? '?'} bpm
Calorie: ${finalInput.calories ?? '?'} kcal
Note: ${finalInput.notes ?? 'nessuna'}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
      aiSummary = summaryRes.choices[0]?.message?.content ?? null
    } catch { /* no AI summary */ }
  }

  const attachments: string[] = []
  if (input.imageBase64) attachments.push(`image:${Date.now()}`)
  if (input.rawJson) attachments.push(`json:${Date.now()}`)

  try {
    const activity = await prisma.manualActivity.create({
      data: {
        userId,
        date: new Date(finalInput.date + 'T12:00:00Z'),
        title: finalInput.title,
        sportType: finalInput.sportType ?? null,
        customType: finalInput.customType ?? null,
        durationMin: finalInput.durationMin ?? null,
        distanceKm: finalInput.distanceKm ?? null,
        heartRateAvg: finalInput.heartRateAvg ?? null,
        heartRateMax: finalInput.heartRateMax ?? null,
        calories: finalInput.calories ?? null,
        notes: finalInput.notes ?? null,
        attachments,
        rawJson: input.rawJson ?? null,
        aiSummary,
        source: input.rawJson ? 'WATCH_IMPORT' : input.imageBase64 ? 'IMAGE_OCR' : 'MANUAL',
      }
    })

    revalidatePath('/calendar')
    return { success: true, id: activity.id, parsedData: finalInput }
  } catch (err) {
    return { success: false, error: 'Errore nel salvataggio' }
  }
}

// ─── Delete manual activity ────────────────────────────────────────────────────

export async function deleteManualActivity(id: string): Promise<{ success: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false }
  const userId = session.user.id

  try {
    await prisma.manualActivity.delete({
      where: { id, userId }
    })
    revalidatePath('/calendar')
    return { success: true }
  } catch {
    return { success: false }
  }
}

// ─── Run daily analysis ────────────────────────────────────────────────────────

export async function runDailyAnalysis(
  dateISO: string
): Promise<{ success: boolean; analysisText?: string; adherenceScore?: number; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Non autorizzato' }
  const userId = session.user.id

  const detail = await getDayDetail(dateISO)
  if (!detail) return { success: false, error: 'Dati non trovati' }

  const context = buildDayContext(detail)

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Sei il coach AI di Performance Ecosystem. Analizza la giornata dell'atleta e fornisci un'analisi dettagliata.
Rispondi in formato JSON:
{
  "analysisText": "Analisi della giornata (3-5 frasi in italiano)",
  "adherenceScore": <0-100, quanto l'atleta ha seguito il piano>,
  "suggestedAdaptations": "Eventuali adattamenti al piano per i prossimi giorni (o null se tutto ok)"
}`
        },
        { role: 'user', content: context }
      ],
      max_tokens: 600,
      temperature: 0.6,
      response_format: { type: 'json_object' }
    })

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}')
    const analysisText = parsed.analysisText ?? 'Analisi non disponibile'
    const adherenceScore = parsed.adherenceScore ?? null
    const suggestedAdaptations = parsed.suggestedAdaptations ?? null

    // Upsert DailyAnalysis
    await prisma.dailyAnalysis.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(dateISO + 'T00:00:00Z')
        }
      },
      update: { analysisText, adherenceScore, suggestedAdaptations },
      create: {
        userId,
        date: new Date(dateISO + 'T00:00:00Z'),
        analysisText,
        adherenceScore,
        suggestedAdaptations
      }
    })

    revalidatePath('/calendar')
    return { success: true, analysisText, adherenceScore }
  } catch (err) {
    return { success: false, error: 'Errore analisi AI' }
  }
}

function buildDayContext(detail: DayDetailData): string {
  const lines: string[] = [`[ANALISI GIORNATA: ${detail.date}]`]

  if (detail.planned) {
    lines.push(`\nPIANO: Sessione "${detail.planned.label}" – ${detail.planned.focus ?? ''}`)
    lines.push(`Status: ${detail.planned.status}`)
    lines.push(`Esercizi previsti: ${detail.planned.exercises.map(e => e.name).join(', ')}`)
  } else {
    lines.push('\nPIANO: Nessuna sessione pianificata')
  }

  if (detail.workout) {
    lines.push(`\nALLENAMENTO REGISTRATO: ${detail.workout.type} – ${detail.workout.duration ?? '?'} min`)
    lines.push(`Carico: ${detail.workout.load ?? '?'} | RPE: ${detail.workout.rpe ?? '?'}`)
    lines.push(`Esercizi completati: ${detail.workout.exerciseCount}`)
    if (detail.workout.notes) lines.push(`Note: ${detail.workout.notes}`)
  } else {
    lines.push('\nALLENAMENTO: Nessuno registrato')
  }

  if (detail.manualActivities.length > 0) {
    lines.push('\nATTIVITÀ MANUALI:')
    detail.manualActivities.forEach(a => {
      lines.push(`- ${a.title}: ${a.durationMin ?? '?'} min, ${a.distanceKm ?? '?'} km, FC ${a.heartRateAvg ?? '?'} bpm, ${a.calories ?? '?'} kcal`)
      if (a.aiSummary) lines.push(`  [AI: ${a.aiSummary}]`)
    })
  }

  if (detail.nutrition) {
    lines.push(`\nNUTRIZIONE: ${detail.nutrition.calories ?? '?'} kcal | P:${detail.nutrition.protein ?? '?'}g C:${detail.nutrition.carbs ?? '?'}g F:${detail.nutrition.fat ?? '?'}g`)
  }

  if (detail.recovery) {
    lines.push(`\nRECUPERO: Sonno ${detail.recovery.sleepMin ?? '?'} min (score ${detail.recovery.sleepScore ?? '?'}/100)`)
    if (detail.recovery.hrv) lines.push(`HRV: ${detail.recovery.hrv} ms`)
    if (detail.recovery.rhr) lines.push(`RHR: ${detail.recovery.rhr} bpm`)
  }

  if (detail.biometrics) {
    lines.push(`\nBIOMETRICA: Peso ${detail.biometrics.weightKg ?? '?'} kg | BF ${detail.biometrics.fatPct ?? '?'}%`)
  }

  return lines.join('\n')
}

// ─── Log planned session retroactive (preserved) ───────────────────────────────

export async function logPlannedSessionRetroactive(params: {
  plannedSessionId: string
  date: string
  durationMin?: number
  trainingLoad?: number
  rpe?: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorizzato')
  const userId = session.user.id

  const planned = await prisma.plannedSession.findUnique({
    where: { id: params.plannedSessionId, userId },
    include: { planDay: true }
  })

  if (!planned) throw new Error('Sessione pianificata non trovata')

  const date = new Date(params.date + 'T12:00:00Z')

  const workout = await prisma.workoutSession.create({
    data: {
      userId,
      date,
      type: planned.planDay.dayLabel as SessionType,
      durationMin: params.durationMin,
      trainingLoad: params.trainingLoad,
      rpe: params.rpe,
      notes: params.notes,
      plannedSession: { connect: { id: planned.id } }
    }
  })

  await prisma.plannedSession.update({
    where: { id: planned.id },
    data: {
      status: 'COMPLETED',
      workoutSessionId: workout.id
    }
  })

  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true, workoutId: workout.id }
}

export async function deleteSkippedSessions() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorizzato')
  const userId = session.user.id

  try {
    const result = await prisma.plannedSession.deleteMany({
      where: {
        userId,
        status: 'SKIPPED'
      }
    })

    revalidatePath('/calendar')
    revalidatePath('/plan')
    return { success: true, count: result.count }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deletePastPendingSessions() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorizzato')
  const userId = session.user.id

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  try {
    const result = await prisma.plannedSession.deleteMany({
      where: {
        userId,
        status: 'PENDING',
        scheduledDate: { lt: today }
      }
    })

    revalidatePath('/calendar')
    revalidatePath('/plan')
    return { success: true, count: result.count }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

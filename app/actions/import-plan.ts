'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

// ─── MESOCICLO 1 — dati dai PDF ────────────────────────────────────────────

const MESO_NAME = 'Mesociclo 1 — Rientro & Riattivazione'
const MESO_START = new Date('2026-03-11T00:00:00.000Z')
const MESO_END   = new Date('2026-04-06T23:59:59.000Z')

// Esercizi per ogni giorno — dal PDF
const GIORNI = [
  {
    label: 'A' as const,
    focus: 'Lower Posteriore — Bicipite femorale + Glutei + Eccentrico',
    order: 0,
    exercises: [
      { name: 'Abductor Machine', sets: 3, repsMin: 15, repsMax: 15, targetRir: 3, restSec: 90,  notes: 'Riscaldamento anca — piede in fuori' },
      { name: 'Copenhagen Plank', sets: 3, repsMin: 20, repsMax: 20, targetRir: 2, restSec: 60,  notes: 'Adduttori + controllo valgo — 20 sec/lato' },
      { name: 'Hip Thrust',       sets: 4, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 150, notes: 'Gluteo primario — 60 kg S1. +5-10 kg/sett' },
      { name: 'Hack Squat',       sets: 3, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 150, notes: 'Discesa 3 sec, no rimbalzo — 40 kg S1' },
      { name: 'Nordic Curl Eccentrico', sets: 3, repsMin: 5, repsMax: 5, targetRir: 0, restSec: 180, notes: '⚠️ 5 sec in discesa — NON risalire. STOP se tensione >2/10' },
      { name: 'Rear Kick Macchina', sets: 3, repsMin: 12, repsMax: 12, targetRir: 2, restSec: 90,  notes: 'Estensione anca controllata — 50 kg S1' },
      { name: 'Leg Extension',    sets: 3, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 90,  notes: 'Ok da S1 — non carica bicipite fem. — 45 kg S1' },
      { name: 'Plank + Pallof Press', sets: 3, repsMin: 30, repsMax: 30, targetRir: 2, restSec: 60, notes: 'Plank 30 sec + Pallof 10 rip — anti-estensione' },
    ],
  },
  {
    label: 'B' as const,
    focus: 'Upper Push — Petto + Spalle + Tricipiti',
    order: 1,
    exercises: [
      { name: 'Panca Piana',           sets: 4, repsMin: 6,  repsMax: 6,  targetRir: 2, restSec: 180, notes: 'Riscaldamento 20→50→70→75 kg. +2.5 kg se RIR≥2' },
      { name: 'Panca Inclinata Manubri', sets: 3, repsMin: 8, repsMax: 8,  targetRir: 2, restSec: 120, notes: 'Inclinato 45° — range completo — 26 kg/lato S1' },
      { name: 'Croci Manubri',         sets: 3, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 90,  notes: 'Fly 30° — no rimbalzo in basso — 14 kg/lato S1' },
      { name: 'Military Press',        sets: 4, repsMin: 6,  repsMax: 6,  targetRir: 2, restSec: 180, notes: '-15% dal riferimento S1 — 50 kg S1. +2.5 kg se RIR≥2' },
      { name: 'Alzate Laterali',       sets: 4, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 90,  notes: 'Strict — no slancio, gomito leggermente flesso — 10 kg S1' },
      { name: 'Alzate Laterali al Cavo', sets: 3, repsMin: 12, repsMax: 12, targetRir: 2, restSec: 90, notes: 'Unilaterale — controllo scapolare — 6 kg/lato S1' },
      { name: 'Pushdown Tricipiti',    sets: 4, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 90,  notes: 'Gomito fisso — solo avambraccio — 18 kg S1' },
      { name: 'Dips',                  sets: 2, repsMin: 12, repsMax: 15, targetRir: 2, restSec: 120, notes: 'No zavorra S1-S2. +5 kg da S3' },
      { name: 'Face Pull',             sets: 3, repsMin: 15, repsMax: 15, targetRir: 3, restSec: 60,  notes: 'OBBLIGATORIO — salute spalle/scapole — carico leggero' },
    ],
  },
  {
    label: 'C' as const,
    focus: 'Upper Pull — Schiena + Bicipiti + Core',
    order: 2,
    exercises: [
      { name: 'Trazioni',              sets: 4, repsMin: 6,  repsMax: 6,  targetRir: 2, restSec: 180, notes: 'RIR≥2 — stop se tecnica degrada. +5 kg da S3' },
      { name: 'Lat Machine',           sets: 3, repsMin: 8,  repsMax: 8,  targetRir: 2, restSec: 120, notes: 'Scapole giù prima di tirare — 75 kg S1' },
      { name: 'Pulley Basso',          sets: 3, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 120, notes: 'Presa neutra — finitura completa — 70 kg S1' },
      { name: 'Rematore con Bilanciere', sets: 4, repsMin: 8, repsMax: 8, targetRir: 2, restSec: 150, notes: 'Schiena neutra — no rimbalzo — 60 kg S1' },
      { name: 'Stacco da Terra',       sets: 4, repsMin: 5,  repsMax: 5,  targetRir: 2, restSec: 210, notes: '⚠️ DIAGNOSTICO S1 — 100 kg (65% max). Senti risposta bicipite fem.' },
      { name: 'Curl Bilanciere',       sets: 3, repsMin: 8,  repsMax: 8,  targetRir: 2, restSec: 90,  notes: '-10% dal riferimento — 22 kg S1. +2.5 kg' },
      { name: 'Curl Manubri',          sets: 3, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 90,  notes: 'Controllo — no slancio — 10 kg/lato S1' },
      { name: 'Hollow Hold + Rotazioni', sets: 3, repsMin: 20, repsMax: 20, targetRir: 2, restSec: 60, notes: 'Hollow 20 sec + rotazioni 12 rip — respirazione controllata' },
    ],
  },
  {
    label: 'D' as const,
    focus: 'Lower Anteriore — Quadricipiti + Anche + Integrato',
    order: 3,
    exercises: [
      { name: 'Goblet Squat',          sets: 3, repsMin: 10, repsMax: 10, targetRir: 3, restSec: 90,  notes: 'Riscaldamento — ginocchio su piede, valgo check — 24 kg' },
      { name: 'Squat',                 sets: 4, repsMin: 6,  repsMax: 6,  targetRir: 2, restSec: 180, notes: 'Reintroduzione — 70 kg S1. Non testare massimale. +5 kg se RIR≥2' },
      { name: 'Leg Extension',         sets: 4, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 90,  notes: 'Quadricipite isolato — ok da S1 — 50 kg S1' },
      { name: 'Affondi',               sets: 3, repsMin: 10, repsMax: 10, targetRir: 2, restSec: 120, notes: 'Camminati manubri — controllo valgo step by step — 16 kg/lato' },
      { name: 'Abductor Machine',      sets: 3, repsMin: 15, repsMax: 15, targetRir: 2, restSec: 90,  notes: 'Stabilità anca — 55 kg S1' },
      { name: 'Plank Laterale',        sets: 3, repsMin: 30, repsMax: 30, targetRir: 2, restSec: 60,  notes: 'Plank laterale + abduzione — 30 sec/lato — catena laterale, glute med' },
      { name: 'Farmer Carry',          sets: 3, repsMin: 20, repsMax: 20, targetRir: 2, restSec: 90,  notes: '20 metri — core lombare funzionale — 24 kg/lato S1' },
      { name: 'Calf Raise',            sets: 4, repsMin: 15, repsMax: 15, targetRir: 2, restSec: 90,  notes: 'Bilaterale — salute Achille — carico progressivo — 60 kg S1' },
    ],
  },
  {
    label: 'V1' as const,
    focus: 'Cardio + Atletica Base',
    order: 4,
    exercises: [
      { name: 'Camminata / Bici Leggera', sets: 1, repsMin: 5,  repsMax: 5,  targetRir: 5, restSec: 0,  notes: 'Riscaldamento 5 min — RPE 3' },
      { name: 'Cardio Z2',              sets: 1, repsMin: 25, repsMax: 25, targetRir: 4, restSec: 0,  notes: 'S1-S2: bici o ellittica | S3+: corsa continua — 20-25 min RPE 4-5' },
      { name: 'Skip + Andature',        sets: 1, repsMin: 10, repsMax: 10, targetRir: 3, restSec: 0,  notes: 'SOLO DA S3 — skip A+B, andature, accelerazioni 20m×6 — RPE 5-6' },
    ],
  },
  {
    label: 'V2' as const,
    focus: 'Core Avanzato + Mobilità + Prehab',
    order: 5,
    exercises: [
      { name: 'Mobilità Hip 90/90',      sets: 2, repsMin: 10, repsMax: 10, targetRir: 5, restSec: 30, notes: 'Rotazioni toraciche + hip 90/90 + world greatest stretch — 15 min' },
      { name: 'Prehab Ginocchio',        sets: 3, repsMin: 15, repsMax: 15, targetRir: 4, restSec: 60, notes: 'Terminal knee extension elastico + mini squat monopodal — controllo valgo' },
      { name: 'Calf Raise Eccentrico',   sets: 3, repsMin: 12, repsMax: 12, targetRir: 4, restSec: 60, notes: 'Prehab Achille — eccentrico + equilibrio monopodal 30 sec' },
      { name: 'Face Pull + Y-T-W',       sets: 3, repsMin: 15, repsMax: 15, targetRir: 4, restSec: 60, notes: 'Prehab spalle — elastico + rotazioni esterne — scapole attivate' },
      { name: 'Hollow Hold',             sets: 3, repsMin: 30, repsMax: 30, targetRir: 3, restSec: 60, notes: 'Core anti-estensione — 30 sec. +Pallof press 12 rip + dead bug 10 rip' },
      { name: 'Respirazione HRV',        sets: 1, repsMin: 5,  repsMax: 5,  targetRir: 5, restSec: 0,  notes: 'Inspira 4 sec — espira 6 sec — 5 min — sistema nervoso' },
    ],
  },
]

// Mappa giorno settimana → piano giorno (Template B — weekend leggero)
// 0=Dom→V2, 2=Mar→A, 3=Mer→V1, 4=Gio→B, 5=Ven→C, 6=Sab→D
const TEMPLATE_B: Record<number, string> = {
  2: 'A',
  3: 'V1',
  4: 'B',
  5: 'C',
  6: 'D',
  0: 'V2',
}

export async function importMesociclo1() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  const userId = session.user.id

  // Check se già importato
  const existing = await prisma.mesocycle.findFirst({
    where: { userId, name: MESO_NAME },
  })
  if (existing) return { error: 'Piano già importato', mesocycleId: existing.id }

  // ── 1. Aggiorna dati atleta ────────────────────────────────────────────
  await prisma.userProfile.upsert({
    where: { userId },
    update: { weightKg: 83, heightCm: 171, birthDate: new Date('1997-01-01') },
    create: { userId, weightKg: 83, heightCm: 171, birthDate: new Date('1997-01-01') },
  })
  
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true }
  })

  // ── 2. Crea Mesociclo ──────────────────────────────────────────────────
  const meso = await prisma.mesocycle.create({
    data: {
      userId,
      name: MESO_NAME,
      startDate: MESO_START,
      endDate: MESO_END,
      status: 'ACTIVE',
      objectives: 'Rientro sicuro, riabilitazione bicipite femorale, riattivazione full-body. CTL target 35-40 TSS/d. VO2max target 49+.',
      kpi: {
        stacco:  { baseline: '100 kg×5', target: '130 kg×5' },
        squat:   { baseline: '70 kg×6',  target: '90 kg×6' },
        nordic:  { baseline: '3×5',      target: '3×8 fluidi' },
        cardio:  { baseline: '20 min ellittica RPE5', target: '25 min corsa Z2' },
        tensioneBicipite: { baseline: '0-2/10', target: '0/10 su tutto' },
        ctl:     { baseline: 26, target: 38 },
        vo2max:  { baseline: 46.6, target: 49 },
        tlWeek1: '1200-1400', tlWeek2: '1500-1700', tlWeek3: '1800-2000', tlWeek4: '1000-1200',
      },
    },
  })

  // ── 3. Crea WorkoutPlan ────────────────────────────────────────────────
  const plan = await prisma.workoutPlan.create({
    data: {
      userId,
      mesocycleId: meso.id,
      name: 'Scheda M1 — 4+2 sessioni/settimana',
      description: 'Template B (weekend leggero): Mar=A, Mer=V1, Gio=B, Ven=C, Sab=D, Dom=V2. 4 sessioni palestra core + 2 variabili.',
      goal: 'Recomposizione corporea — perdita grasso + mantenimento massa',
      weeksTotal: 4,
      daysPerWeek: 6,
      trainingDays: [0, 2, 3, 4, 5, 6],
      isActive: true,
      source: 'IMPORTED',
    },
  })

  // ── 4. Crea PlanDay e PlanExercise ────────────────────────────────────
  const planDayMap: Record<string, string> = {}

  for (const giorno of GIORNI) {
    const planDay = await prisma.planDay.create({
      data: {
        planId: plan.id,
        dayLabel: giorno.label,
        focus: giorno.focus,
        orderIndex: giorno.order,
      },
    })
    planDayMap[giorno.label] = planDay.id

    await prisma.planExercise.createMany({
      data: giorno.exercises.map((ex, idx) => ({
        planDayId: planDay.id,
        name: ex.name,
        orderIndex: idx,
        sets: ex.sets,
        repsMin: ex.repsMin,
        repsMax: ex.repsMax,
        targetRir: ex.targetRir,
        restSec: ex.restSec,
        notes: ex.notes,
      })),
    })
  }

  // ── 5. Genera PlannedSessions per 4 settimane ─────────────────────────
  const plannedSessions: {
    userId: string
    planId: string
    planDayId: string
    scheduledDate: Date
    status: 'PENDING' | 'COMPLETED' | 'SKIPPED'
  }[] = []

  // Itera ogni giorno dal 11 marzo al 6 aprile
  const totalDays = Math.ceil(
    (MESO_END.getTime() - MESO_START.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(MESO_START, i)
    const dayOfWeek = date.getUTCDay() // 0=Sun,...,6=Sat
    const sessionLabel = TEMPLATE_B[dayOfWeek]
    if (!sessionLabel) continue

    const planDayId = planDayMap[sessionLabel]
    if (!planDayId) continue

    // Setta la data come date-only (UTC midnight)
    const scheduledDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    )

    plannedSessions.push({
      userId,
      planId: plan.id,
      planDayId,
      scheduledDate,
      status: scheduledDate < new Date() ? 'SKIPPED' : 'PENDING',
    })
  }

  // Filtra duplicati sullo stesso giorno (safety)
  const seen = new Set<string>()
  const dedupedSessions = plannedSessions.filter(s => {
    const key = s.scheduledDate.toISOString()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  await prisma.plannedSession.createMany({
    data: dedupedSessions,
    skipDuplicates: true,
  })

  // ── 6. Crea Infortuni ─────────────────────────────────────────────────
  await prisma.injury.createMany({
    data: [
      {
        userId,
        district: 'HAMSTRING',
        description: 'Lesione bicipite femorale sx — cicatrice 3 cm confermata eco agosto 2025. Nessuna riabilitazione eseguita. Leg curl sospeso S1-S2. Nordic curl eccentrico come protocollo principale.',
        startDate: new Date('2025-08-01'),
        status: 'RECOVERING',
        notes: 'DISTRETTO PRIORITARIO — tensione >2/10: interrompi esercizio, segnala subito',
      },
      {
        userId,
        district: 'KNEE',
        description: 'ACL+PCL pregresso (8 anni) — ginocchio sinistro. Valgo da monitorare, no instabilità attuale.',
        startDate: new Date('2018-01-01'),
        status: 'RECOVERING',
        notes: 'Monitorare valgo. Se instabilità: sostituisci affondi con leg press unilaterale.',
      },
      {
        userId,
        district: 'CALF',
        description: 'Lesione parziale tendine Achille destro 2018 — riabilitata. Scrocchio in rotazione.',
        startDate: new Date('2018-06-01'),
        endDate: new Date('2019-01-01'),
        status: 'RESOLVED',
        notes: 'Calf raise progressivo. Monitorare.',
      },
    ],
    skipDuplicates: true,
  })

  // ── 7. Crea NutritionDay targets per tutta la durata ──────────────────
  const nutritionDays: {
    userId: string
    date: Date
    kcalTarget: number
    proteinG: number
    carbsG: number
    fatG: number
    isTrainingDay: boolean
  }[] = []

  const gymDays = new Set(['A', 'B', 'C', 'D'])

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(MESO_START, i)
    const dayOfWeek = date.getUTCDay()
    const sessionLabel = TEMPLATE_B[dayOfWeek]
    const isTrainingDay = sessionLabel ? gymDays.has(sessionLabel) : false
    const dateOnly = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    )

    nutritionDays.push({
      userId,
      date: dateOnly,
      kcalTarget: isTrainingDay ? 2400 : 2000,
      proteinG: isTrainingDay ? 165 : 160,
      carbsG: isTrainingDay ? 260 : 160,
      fatG: 72,
      isTrainingDay,
    })
  }

  await prisma.nutritionDay.createMany({
    data: nutritionDays,
    skipDuplicates: true,
  })

  return {
    success: true,
    mesocycleId: meso.id,
    planId: plan.id,
    sessionCount: dedupedSessions.length,
  }
}

export async function deleteImport(mesocycleId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non autenticato' }
  await prisma.mesocycle.delete({ where: { id: mesocycleId, userId: session.user.id } })
  return { success: true }
}

/**
 * run-daily-analysis.mjs
 *
 * Nightly script: runs DailyAnalysis for all users for today's date.
 * Called by the scheduled task every evening at 22:00.
 *
 * Usage: node scripts/run-daily-analysis.mjs [YYYY-MM-DD]
 */

import { PrismaClient } from '@prisma/client'
import Groq from 'groq-sdk'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const prisma = new PrismaClient()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const targetDate = process.argv[2] ?? new Date().toISOString().split('T')[0]
console.log(`\n🌙 Daily Analysis — ${targetDate}\n`)

async function buildDayContext(userId, dateISO) {
  const date = new Date(dateISO + 'T00:00:00Z')
  const dateEnd = new Date(dateISO + 'T23:59:59Z')

  const [planned, workout, nutrition, recovery, biometrics, manualActivities] = await Promise.all([
    prisma.plannedSession.findFirst({
      where: { userId, scheduledDate: { gte: date, lte: dateEnd } },
      include: { planDay: { include: { planExercises: { select: { name: true } } } } }
    }),
    prisma.workoutSession.findFirst({
      where: { userId, date: { gte: date, lte: dateEnd } },
      include: { exercises: { select: { id: true } } }
    }),
    prisma.nutritionDay.findFirst({ where: { userId, date: { gte: date, lte: dateEnd } } }),
    prisma.recoveryLog.findFirst({ where: { userId, date: { gte: date, lte: dateEnd } } }),
    prisma.biometricLog.findFirst({ where: { userId, date: { gte: date, lte: dateEnd } } }),
    prisma.manualActivity.findMany({ where: { userId, date: { gte: date, lte: dateEnd } } }),
  ])

  const lines = [`[ANALISI GIORNATA: ${dateISO}]`]

  if (planned) {
    lines.push(`\nPIANO: Sessione "${planned.planDay.dayLabel}" – ${planned.planDay.focus ?? ''}`)
    lines.push(`Status: ${planned.status}`)
    lines.push(`Esercizi previsti: ${planned.planDay.planExercises.map(e => e.name).join(', ')}`)
  } else {
    lines.push('\nPIANO: Nessuna sessione pianificata')
  }

  if (workout) {
    lines.push(`\nALLENAMENTO: ${workout.type} – ${workout.durationMin ?? '?'} min`)
    lines.push(`Carico: ${workout.trainingLoad ?? '?'} | RPE: ${workout.rpe ?? '?'}`)
    lines.push(`Esercizi completati: ${workout.exercises.length}`)
  } else {
    lines.push('\nALLENAMENTO: Nessuno registrato')
  }

  if (manualActivities.length > 0) {
    lines.push('\nATTIVITÀ MANUALI:')
    manualActivities.forEach(a => {
      lines.push(`- ${a.title}: ${a.durationMin ?? '?'} min, ${a.distanceKm ?? '?'} km, FC ${a.heartRateAvg ?? '?'} bpm`)
    })
  }

  if (nutrition) {
    lines.push(`\nNUTRIZIONE: ${nutrition.calories ?? '?'} kcal | P:${nutrition.protein ?? '?'}g C:${nutrition.carbs ?? '?'}g F:${nutrition.fat ?? '?'}g`)
  }

  if (recovery) {
    lines.push(`\nRECUPERO: Sonno ${recovery.sleepHours ?? '?'}h (qualità ${recovery.sleepQuality ?? '?'}/10)`)
    lines.push(`Stress: ${recovery.stressLevel ?? '?'}/10 | Dolori: ${recovery.muscleSoreness ?? '?'}/10 | Umore: ${recovery.mood ?? '?'}/10`)
    if (recovery.hrv) lines.push(`HRV: ${recovery.hrv} ms`)
  }

  if (biometrics) {
    lines.push(`\nBIOMETRICA: Peso ${biometrics.weightKg ?? '?'} kg`)
  }

  return lines.join('\n')
}

async function runAnalysisForUser(userId, dateISO) {
  const context = await buildDayContext(userId, dateISO)

  // Skip if no meaningful data
  if (!context.includes('ALLENAMENTO:') && !context.includes('ATTIVITÀ') && !context.includes('NUTRIZIONE')) {
    console.log(`  ⚪ User ${userId.slice(0, 8)}... — no data, skip`)
    return
  }

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Sei il coach AI di Performance Ecosystem. Analizza la giornata dell'atleta.
Rispondi SOLO in JSON:
{"analysisText": "3-5 frasi in italiano", "adherenceScore": <0-100>, "suggestedAdaptations": "adattamenti o null"}`
      },
      { role: 'user', content: context }
    ],
    max_tokens: 600,
    temperature: 0.6,
    response_format: { type: 'json_object' }
  })

  const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}')

  await prisma.dailyAnalysis.upsert({
    where: { userId_date: { userId, date: new Date(dateISO + 'T00:00:00Z') } },
    update: {
      analysisText: parsed.analysisText ?? 'Analisi completata',
      adherenceScore: parsed.adherenceScore ?? null,
      suggestedAdaptations: parsed.suggestedAdaptations ?? null,
    },
    create: {
      userId,
      date: new Date(dateISO + 'T00:00:00Z'),
      analysisText: parsed.analysisText ?? 'Analisi completata',
      adherenceScore: parsed.adherenceScore ?? null,
      suggestedAdaptations: parsed.suggestedAdaptations ?? null,
    }
  })

  console.log(`  ✅ User ${userId.slice(0, 8)}... — score: ${parsed.adherenceScore ?? '?'}%`)
  if (parsed.suggestedAdaptations) {
    console.log(`     💡 ${parsed.suggestedAdaptations.slice(0, 80)}...`)
  }
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } })
  console.log(`Analisi per ${users.length} utenti — data: ${targetDate}\n`)

  for (const user of users) {
    try {
      await runAnalysisForUser(user.id, targetDate)
    } catch (err) {
      console.error(`  ❌ User ${user.id.slice(0, 8)}... — error:`, err.message)
    }
  }

  console.log('\n✨ Daily analysis completata.\n')
  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Fatal error:', err)
  await prisma.$disconnect()
  process.exit(1)
})

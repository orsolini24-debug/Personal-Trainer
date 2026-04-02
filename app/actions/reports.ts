'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' })

// ─────────────────────────────────────────────────────────────────────────────
// Generate Weekly Report
// Gathers the last 7 days of data and asks Groq for a narrative summary.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateWeeklyReport(): Promise<{
  success: boolean
  content?: string
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Non autorizzato' }
  const userId = session.user.id

  const today = new Date()
  today.setUTCHours(23, 59, 59, 999)
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)
  weekAgo.setUTCHours(0, 0, 0, 0)

  try {
    // Gather all data in parallel
    const [
      profile,
      workoutSessions,
      nutritionDays,
      recoveryLogs,
      manualActivities,
      dailyAnalyses,
      biometric,
      activeMeso,
    ] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.workoutSession.findMany({
        where: { userId, date: { gte: weekAgo, lte: today } },
        include: { exercises: true },
        orderBy: { date: 'asc' },
      }),
      prisma.nutritionDay.findMany({
        where: { userId, date: { gte: weekAgo, lte: today } },
        orderBy: { date: 'asc' },
      }),
      prisma.recoveryLog.findMany({
        where: { userId, date: { gte: weekAgo, lte: today } },
        orderBy: { date: 'asc' },
      }),
      prisma.manualActivity.findMany({
        where: { userId, date: { gte: weekAgo, lte: today } },
        orderBy: { date: 'asc' },
      }),
      prisma.dailyAnalysis.findMany({
        where: { userId, date: { gte: weekAgo, lte: today } },
        orderBy: { date: 'asc' },
      }),
      prisma.biometricLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
      prisma.mesocycle.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { workoutPlan: true },
      }),
    ])

    // ── Build context string ──────────────────────────────────────────────────
    const lines: string[] = []
    lines.push(`# Profilo Atleta`)
    if (profile) {
      lines.push(`- Sesso: ${profile.biologicalSex}, Età: ${profile.ageYears ?? '?'} anni`)
      lines.push(`- Livello: ${profile.experienceLevel ?? 'N/D'}`)
      lines.push(`- Obiettivo: ${profile.primaryGoal ?? 'N/D'}`)
      lines.push(`- Sport principale: ${profile.primarySport ?? 'N/D'}`)
      lines.push(`- Allenamenti/settimana target: ${profile.availableDays ?? 'N/D'}`)
    }
    if (biometric) {
      lines.push(`- Peso attuale: ${biometric.weightKg ?? '?'} kg`)
    }
    if (activeMeso) {
      lines.push(`\n## Piano Attivo: ${activeMeso.name}`)
      lines.push(`- Obiettivo mesociclo: ${activeMeso.objectives ?? 'N/D'}`)
    }

    lines.push(`\n## Allenamenti Completati (${workoutSessions.length})`)
    if (workoutSessions.length === 0) {
      lines.push('Nessun allenamento registrato questa settimana.')
    } else {
      for (const ws of workoutSessions) {
        const dateStr = ws.date.toISOString().split('T')[0]
        lines.push(`- ${dateStr}: ${ws.durationMin ?? '?'} min, ${ws.exercises.length} esercizi, RPE ${ws.rpe ?? 'N/D'}, note: ${ws.notes ?? 'nessuna'}`)
      }
    }

    lines.push(`\n## Attività Extra (${manualActivities.length})`)
    for (const ma of manualActivities) {
      const dateStr = ma.date.toISOString().split('T')[0]
      lines.push(`- ${dateStr}: ${ma.title} (${ma.durationMin ?? '?'} min, ${ma.distanceKm ?? '?'} km)`)
    }

    lines.push(`\n## Recovery`)
    if (recoveryLogs.length === 0) {
      lines.push('Nessun log recovery questa settimana.')
    } else {
      const avgRecovery = recoveryLogs.reduce((s, r) => s + (r.recoveryScore ?? 0), 0) / recoveryLogs.length
      lines.push(`- Score medio: ${avgRecovery.toFixed(0)}/100`)
      for (const r of recoveryLogs) {
        const dateStr = r.date.toISOString().split('T')[0]
        lines.push(`  - ${dateStr}: score ${r.recoveryScore ?? '?'}, HRV ${r.hrv ?? '?'}, sonno ${r.sleepHours ?? '?'} h, TSB ${r.tsb ?? '?'}`)
      }
    }

    lines.push(`\n## Nutrizione`)
    if (nutritionDays.length === 0) {
      lines.push('Nessun log nutrizionale questa settimana.')
    } else {
      const avgKcal = nutritionDays.reduce((s, n) => s + (n.kcalActual ?? 0), 0) / nutritionDays.length
      lines.push(`- Kcal medie/giorno: ${avgKcal.toFixed(0)}`)
      for (const n of nutritionDays) {
        const dateStr = n.date.toISOString().split('T')[0]
        lines.push(`  - ${dateStr}: ${n.kcalActual ?? '?'} kcal, P:${Math.round(n.proteinG ?? 0)}g C:${Math.round(n.carbsG ?? 0)}g F:${Math.round(n.fatG ?? 0)}g`)
      }
    }

    if (dailyAnalyses.length > 0) {
      lines.push(`\n## Analisi Giornaliere AI (${dailyAnalyses.length})`)
      for (const da of dailyAnalyses) {
        const dateStr = da.date.toISOString().split('T')[0]
        lines.push(`- ${dateStr} (adherence ${da.adherenceScore ?? '?'}%): ${da.analysisText.slice(0, 120)}...`)
      }
    }

    const context = lines.join('\n')

    // ── Groq call ─────────────────────────────────────────────────────────────
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Sei il coach AI di Performance Ecosystem. Genera un report settimanale dettagliato e motivante per l'atleta.
Il report deve:
- Essere scritto in italiano, in modo professionale ma coinvolgente
- Essere lungo 3-5 paragrafi
- Analizzare trend di allenamento, recovery e nutrizione
- Indicare punti di forza della settimana
- Dare 2-3 raccomandazioni concrete per la settimana successiva
- Concludere con un messaggio motivazionale
Rispondi SOLO con il testo del report, senza titoli né markdown.`
        },
        { role: 'user', content: context }
      ],
      max_tokens: 900,
      temperature: 0.7,
    })

    const content = res.choices[0]?.message?.content?.trim() ?? 'Report non disponibile.'

    // ── Save to DB ────────────────────────────────────────────────────────────
    await prisma.aIReport.create({
      data: {
        userId,
        type: 'WEEKLY',
        date: new Date(),
        content,
        dataInputJson: { generatedAt: new Date().toISOString(), daysWithData: workoutSessions.length + nutritionDays.length + recoveryLogs.length },
      }
    })

    revalidatePath('/dashboard')
    return { success: true, content }
  } catch (err: any) {
    console.error('generateWeeklyReport error:', err)
    return { success: false, error: err.message ?? 'Errore generazione report' }
  }
}

'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getActiveGoals } from '@/app/actions/athlete-goals'

export async function getDashboardData() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [recovery, nutrition, workout, biometric, profile, goals, lastReport] = await Promise.all([
    prisma.recoveryLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.nutritionDay.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.workoutSession.findFirst({ where: { userId, date: { gte: today } }, orderBy: { date: 'asc' } }),
    prisma.biometricLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    getActiveGoals(),
    prisma.aIReport.findFirst({
      where: { userId, type: 'WEEKLY' },
      orderBy: { date: 'desc' }
    })
  ])

  // Recovery
  const score = recovery?.recoveryScore ?? 0
  const scoreLabel = score > 66 ? 'OTTIMO' : score > 33 ? 'MODERATO' : score > 0 ? 'BASSO' : '–'
  const scoreColor = score > 66 ? '#16a34a' : score > 33 ? '#d97706' : score > 0 ? '#dc2626' : 'var(--fg-subtle)'
  // Vivid pastel fill for recovery card (theme-aware but always bright)
  const scoreBg = score > 66
    ? '#4ade80'   // green
    : score > 33
    ? '#fbbf24'   // amber
    : score > 0
    ? '#f87171'   // red
    : 'var(--bg-elevated)'

  // Nutrition
  const kcalActual = nutrition?.kcalActual ?? 0
  const kcalTarget = nutrition?.kcalTarget ?? 2200
  const kcalPct = Math.min(100, Math.round((kcalActual / kcalTarget) * 100))
  const proActual = Math.round(nutrition?.proteinG ?? 0)
  const carbActual = Math.round(nutrition?.carbsG ?? 0)
  const fatActual = Math.round(nutrition?.fatG ?? 0)
  const proteinTarget = profile?.weightKg ? Math.round(profile.weightKg * 2.0) : 160
  const fatTarget = profile?.weightKg ? Math.round(profile.weightKg * 0.8) : 70
  const carbsTarget = Math.round((kcalTarget - proteinTarget * 4 - fatTarget * 9) / 4)

  // Coach
  const coachMsg = score > 66
    ? `Recovery ${score}% — puoi spingere${workout?.type ? ` sulla sessione ${workout.type.replace(/_/g,' ')}` : ''} oggi.`
    : score > 33
    ? `Recovery ${score}% — allena con attenzione ai segnali del corpo.`
    : score > 0
    ? `Recovery ${score}% — valuta recupero attivo o intensità ridotta.`
    : 'Sincronizza i dati di recupero per ricevere consigli personalizzati.'

  // Athlete
  const sportLevelMap = (profile?.sportLevels ?? {}) as Record<string, string>
  const primarySport = profile?.mainSports?.[0] ?? profile?.primarySport ?? null
  const sportLevel = primarySport ? (sportLevelMap[primarySport] ?? profile?.experienceLevel) : null
  const athleteLabel = sportLevel ?? profile?.experienceLevel ?? 'Atleta'
  const sportName = primarySport ? String(primarySport).replace(/_/g, ' ') : null

  // Date
  const dayName = today.toLocaleDateString('it-IT', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })

  // Streak Calculation (Sessions this week vs Target)
  const monday = new Date(today)
  const day = today.getUTCDay()
  const diff = today.getUTCDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  monday.setUTCDate(diff)
  monday.setUTCHours(0, 0, 0, 0)

  const [completedSessions, activePlan, weekSessionsWithDates, recentPRs, weightHistory] = await Promise.all([
    prisma.workoutSession.count({
      where: { userId, date: { gte: monday, lte: new Date() } }
    }),
    prisma.workoutPlan.findFirst({
      where: { userId, isActive: true },
      select: { daysPerWeek: true }
    }),
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: monday, lte: new Date() } },
      select: { date: true, type: true },
      orderBy: { date: 'asc' },
    }),
    prisma.workoutSet.findMany({
      where: {
        exercise: { workoutSession: { userId } },
        isPR: true,
        loggedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { weightKg: true, repsActual: true, exercise: { select: { name: true } } },
      take: 5,
    }).catch(() => []),
    prisma.biometricLog.findMany({
      where: { userId, weightKg: { not: null } },
      orderBy: { date: 'desc' },
      take: 8,
      select: { date: true, weightKg: true },
    }),
  ])

  const sessionsTarget = activePlan?.daysPerWeek ?? 5
  const streakValue = String(completedSessions)
  const streakUnit = `/ ${sessionsTarget} sessioni`

  // Weight delta vs 7 days ago
  const currentWeight = weightHistory[0]?.weightKg ?? null
  const olderWeight = weightHistory.find(w => {
    const diff = (today.getTime() - new Date(w.date).getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 5
  })?.weightKg ?? null
  const weightDelta = currentWeight && olderWeight ? Math.round((currentWeight - olderWeight) * 10) / 10 : null

  return {
    userName: session.user.name?.split(' ')[0] || 'Atleta',
    dayName, dateStr,
    score, scoreLabel, scoreColor, scoreBg,
    hrv: recovery?.hrv ?? null,
    tsb: recovery?.tsb ?? null,
    sleepH: recovery?.sleepMin ? Math.round(recovery.sleepMin / 60) : null,
    workout: workout ? {
      type: workout.type,
      durationMin: workout.durationMin,
      trainingLoad: workout.trainingLoad,
    } : null,
    kcalActual, kcalTarget, kcalPct,
    proActual, carbActual, fatActual,
    proteinTarget, carbsTarget, fatTarget,
    coachMsg,
    weightKg: biometric?.weightKg ?? null,
    athleteLabel, sportName,
    goals,
    streakValue,
    streakUnit,
    weekSessionDates: weekSessionsWithDates.map(s => s.date.toISOString()),
    weekSessionsCount: completedSessions,
    weekSessionsTarget: sessionsTarget,
    recentPRs: recentPRs.map(pr => ({
      exerciseName: (pr.exercise as { name: string }).name,
      weightKg: pr.weightKg,
      repsActual: pr.repsActual,
    })),
    currentWeight,
    weightDelta,
    lastReport: lastReport ? {
      date: lastReport.date.toISOString(),
      content: lastReport.content.slice(0, 150) + (lastReport.content.length > 150 ? '...' : '')
    } : null,
  }
}

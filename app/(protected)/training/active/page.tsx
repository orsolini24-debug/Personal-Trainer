import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { startSession, getActiveSession } from '@/app/actions/active-session'
import ActiveTracker from './ActiveTracker'

interface Props {
  searchParams: Promise<{ planDayId?: string; plannedSessionId?: string }>
}

export default async function ActiveSessionPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams

  // Se arriva dal piano → avvia nuova sessione
  if (params.planDayId) {
    const result = await startSession(params.planDayId, params.plannedSessionId)
    if ('error' in result && result.error) {
      redirect('/training')
    }
  }

  // Carica sessione attiva
  const active = await getActiveSession()
  if (!active) redirect('/training')

  // Recupera dati precedenti per ogni esercizio
  const exercises = active.workoutSession.exercises
  const prevPerfs: Record<string, { weightKg: number | null; repsActual: number | null; setNumber: number }[]> = {}

  for (const ex of exercises) {
    const lastEx = await prisma.exercise.findFirst({
      where: {
        name: ex.name,
        session: { userId: session.user.id },
        id: { not: ex.id },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        setLogs: {
          where: { isWarmup: false },
          orderBy: { setNumber: 'asc' },
          take: 6,
        },
      },
    })
    if (lastEx?.setLogs?.length) {
      prevPerfs[ex.id] = lastEx.setLogs.map(sl => ({
        weightKg: sl.weightKg,
        repsActual: sl.repsActual,
        setNumber: sl.setNumber,
      }))
    }
  }

  // Batch-load ExerciseDefinition data (media + muscles) by name
  const exerciseNames = exercises.map(ex => ex.name)
  const exerciseDefs = await prisma.exerciseDefinition.findMany({
    where: { name: { in: exerciseNames } },
    select: {
      name: true,
      mediaUrl: true,
      mediaUrls: true,
      primaryMuscles: true,
      secondaryMuscles: true,
      descriptionIt: true,
      description: true,
      tipsIt: true,
    },
  })
  const defByName = Object.fromEntries(exerciseDefs.map(d => [d.name, d]))

  // Serializza per passare al client
  const trackerData = {
    activeSessionId: active.id,
    workoutSessionId: active.workoutSessionId,
    sessionType: active.workoutSession.type,
    startedAt: active.startedAt.toISOString(),
    currentExerciseIdx: active.currentExerciseIdx,
    currentSetIdx: active.currentSetIdx,
    exercises: exercises.map(ex => {
      let parsedNotes: { restSec?: number; repsMin?: number; repsMax?: number; plan?: string } = {}
      try { parsedNotes = JSON.parse(ex.technicalNotes ?? '{}') } catch {}
      const def = defByName[ex.name]
      return {
        id: ex.id,
        name: ex.name,
        orderIndex: ex.orderIndex,
        sets: ex.sets ?? 3,
        repsMin: parsedNotes.repsMin ?? parseInt(ex.reps?.split('-')[0] ?? '8'),
        repsMax: parsedNotes.repsMax ?? parseInt(ex.reps?.split('-').pop() ?? '12'),
        targetRir: ex.rir ?? 2,
        restSec: parsedNotes.restSec ?? 120,
        planNotes: parsedNotes.plan ?? ex.technicalNotes ?? '',
        // Exercise definition data
        mediaUrl: def?.mediaUrl ?? null,
        mediaUrls: def?.mediaUrls ?? [],
        primaryMuscles: def?.primaryMuscles ?? [],
        secondaryMuscles: def?.secondaryMuscles ?? [],
        description: def?.descriptionIt ?? def?.description ?? null,
        tips: def?.tipsIt ?? null,
        completedSets: ex.setLogs.map(sl => ({
          setNumber: sl.setNumber,
          weightKg: sl.weightKg,
          repsActual: sl.repsActual,
          rirActual: sl.rirActual,
          isWarmup: sl.isWarmup,
        })),
        previousSets: prevPerfs[ex.id] ?? [],
      }
    }),
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <ActiveTracker data={trackerData} />
    </div>
  )
}

import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getPlanDayWithHistory, getExerciseHistory } from "@/app/actions/exercise-history"
import type { ExerciseHistory } from "@/app/actions/exercise-history"
import { getAlternateDays } from "@/app/actions/session-flex"
import { computeSuggestion } from "@/lib/suggestion"
import Link from "next/link"
import {
  ChevronLeft, Play, Info, Target, Activity,
  Clock, Calendar
} from "lucide-react"
import PlanDayClient from "./PlanDayClient"
import ExerciseCard, { ExerciseCardData } from "@/components/ExerciseCard"
import BodyMuscleMap from "@/components/BodyMuscleMap"
import { District, Equipment } from "@prisma/client"

// Aggregate all muscles across the day for the overview heatmap
function aggregateDayMuscles(exercises: ExerciseCardData[]) {
  const primary = new Set<District>()
  const secondary = new Set<District>()
  exercises.forEach(ex => {
    ex.primaryMuscles?.forEach(m => primary.add(m))
    ex.secondaryMuscles?.forEach(m => {
      if (!primary.has(m)) secondary.add(m)
    })
  })
  return {
    primary: Array.from(primary),
    secondary: Array.from(secondary),
  }
}

export default async function PlanDayPage({ params }: { params: Promise<{ planDayId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { planDayId } = await params
  const planDay = await getPlanDayWithHistory(planDayId)
  if (!planDay) notFound()

  // Fetch history for all exercises in parallel
  const histories: ExerciseHistory[] = await Promise.all(
    planDay.planExercises.map(pe => getExerciseHistory(pe.name, 3))
  )

  const alternateDays = await getAlternateDays(planDayId)
  const today = new Date().toISOString().split('T')[0]

  // Build ExerciseCardData merging PlanExercise + ExerciseDefinition
  const exerciseCards: ExerciseCardData[] = planDay.planExercises.map(pe => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = (pe as any).exerciseDef as {
      equipment: Equipment
      difficulty: string
      primaryMuscles: District[]
      secondaryMuscles: District[]
      mediaUrl: string | null
      mediaUrls: string[]
      description: string | null
      descriptionIt: string | null
      tips: string | null
      tipsIt: string | null
      isCompound: boolean
      movementType: string
    } | null

    return {
      id: pe.id,
      name: pe.name,
      orderIndex: pe.orderIndex,
      sets: pe.sets,
      repsMin: pe.repsMin,
      repsMax: pe.repsMax,
      targetRir: pe.targetRir,
      restSec: pe.restSec,
      notes: pe.notes,
      equipment: def?.equipment ?? null,
      difficulty: def?.difficulty ?? null,
      primaryMuscles: def?.primaryMuscles ?? [],
      secondaryMuscles: def?.secondaryMuscles ?? [],
      mediaUrl: def?.mediaUrl ?? null,
      mediaUrls: def?.mediaUrls ?? [],
      description: def?.description ?? null,
      descriptionIt: def?.descriptionIt ?? null,
      tips: def?.tips ?? null,
      tipsIt: def?.tipsIt ?? null,
      isCompound: def?.isCompound ?? null,
      movementType: def?.movementType ?? null,
    }
  })

  // Aggregate day muscles for overview heatmap
  const { primary: dayPrimary, secondary: daySecondary } = aggregateDayMuscles(exerciseCards)

  // Compute total session time estimate
  const totalSets = exerciseCards.reduce((sum, ex) => sum + ex.sets, 0)
  const avgRestSec = exerciseCards.length > 0
    ? exerciseCards.reduce((sum, ex) => sum + (ex.restSec ?? 120), 0) / exerciseCards.length
    : 120
  const estimatedMinutes = Math.round((totalSets * (45 + avgRestSec)) / 60)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-500">

      {/* ── BACK NAV ── */}
      <Link href="/plan" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Piano
      </Link>

      {/* ── HEADER CARD ── */}
      <div className="bg-surface rounded-[2.5rem] border border-border overflow-hidden relative">
        {/* Background decorative gradient */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 20%, var(--accent) 0%, transparent 60%)' }}
        />

        <div className="relative z-10 p-8">
          {/* Title row */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
            >
              {planDay.dayLabel}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">
                {planDay.plan.mesocycle?.name ?? 'Piano Attivo'}
              </p>
              <h1 className="text-2xl font-black text-primary leading-tight">
                {planDay.focus ?? `Sessione ${planDay.dayLabel}`}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-muted font-bold flex items-center gap-1.5">
                  <Target className="w-3 h-3" /> {exerciseCards.length} esercizi
                </span>
                <span className="text-xs text-muted font-bold flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> ~{estimatedMinutes} min
                </span>
                <span className="text-xs text-muted font-bold flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> {totalSets} serie totali
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {planDay.notes && (
            <div className="mb-6 p-4 rounded-2xl bg-base border border-border flex gap-3">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-muted italic leading-relaxed">{planDay.notes}</p>
            </div>
          )}

          {/* Day muscle overview heatmap */}
          {(dayPrimary.length > 0 || daySecondary.length > 0) && (
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Muscoli della Sessione
              </p>
              <BodyMuscleMap
                primaryMuscles={dayPrimary}
                secondaryMuscles={daySecondary}
                size="sm"
                showLegend={true}
              />
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 flex-wrap">
            <Link
              href={`/training/active?planDayId=${planDayId}`}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              <Play className="w-4 h-4" /> Inizia Sessione
            </Link>
            <PlanDayClient planDayId={planDayId} alternateDays={alternateDays} today={today} />
          </div>
        </div>
      </div>

      {/* ── EXERCISE LIST ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted flex items-center gap-2">
            <Target className="w-4 h-4" /> Esercizi
          </h2>
          <span className="text-[10px] text-muted font-bold">
            Tocca per espandere dettagli, immagini e heatmap
          </span>
        </div>

        {exerciseCards.map((exercise, idx) => {
          const history = histories[idx]
          const lastSets = history.entries.filter(e => !e.isWarmup)
          const lastWeight = lastSets[0]?.weightKg ?? null
          const lastReps = lastSets[0]?.repsActual ?? null
          const lastRir = lastSets[0]?.rirActual ?? null
          const lastFeeling = lastSets[0]?.feelingScore ?? null

          let suggestedWeight: number | null = null
          let suggestionRationale: string | null = null

          if (lastWeight != null) {
            const s = computeSuggestion(
              lastWeight, lastReps, lastRir,
              exercise.targetRir, exercise.repsMin, exercise.repsMax, lastFeeling
            )
            suggestedWeight = s.suggestedWeight
            suggestionRationale = s.rationale
          }

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={idx}
              lastWeight={lastWeight}
              lastReps={lastReps}
              lastRir={lastRir}
              lastFeeling={lastFeeling}
              trend={history.trend}
              suggestedWeight={suggestedWeight}
              suggestionRationale={suggestionRationale}
            />
          )
        })}
      </div>

      {/* ── SESSION NOTES FOOTER ── */}
      <div className="p-5 rounded-[2rem] bg-surface border border-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
          <Calendar className="w-3 h-3" /> Nota di programmazione
        </p>
        <p className="text-xs text-muted leading-relaxed italic">
          I suggerimenti di carico sono basati sul metodo RIR (Reps In Reserve) di Mike Israetel / Renaissance Periodization.
          Il sistema considera l&apos;ultimo carico, il RIR effettivo e la sensazione soggettiva per modulare la progressione.
        </p>
      </div>
    </div>
  )
}

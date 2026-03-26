import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getPlanDayWithHistory, getExerciseHistory } from "@/app/actions/exercise-history"
import type { ExerciseHistory } from "@/app/actions/exercise-history"
import { getAlternateDays } from "@/app/actions/session-flex"
import { computeSuggestion } from "@/lib/suggestion"
import Link from "next/link"
import {
  ChevronLeft, Play, Target, Activity, Clock, Zap
} from "lucide-react"
import PlanDayClient from "./PlanDayClient"
import ExerciseCard, { ExerciseCardData } from "@/components/ExerciseCard"
import BodyMuscleMap from "@/components/BodyMuscleMap"
import { District, Equipment } from "@prisma/client"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function aggregateDayMuscles(exercises: ExerciseCardData[]) {
  const primary = new Set<District>()
  const secondaryCount = new Map<District, number>()

  exercises.forEach(ex => {
    ex.primaryMuscles?.forEach(m => primary.add(m))
    ex.secondaryMuscles?.forEach(m => {
      secondaryCount.set(m, (secondaryCount.get(m) ?? 0) + 1)
    })
  })

  const secondary: District[] = []
  const complementary: District[] = []

  secondaryCount.forEach((count, m) => {
    if (primary.has(m)) return
    if (count >= 2) complementary.push(m)
    else secondary.push(m)
  })

  return { primary: Array.from(primary), secondary, complementary }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function PlanDayPage({ params }: { params: Promise<{ planDayId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { planDayId } = await params
  const planDay = await getPlanDayWithHistory(planDayId)
  if (!planDay) notFound()

  const histories: ExerciseHistory[] = await Promise.all(
    planDay.planExercises.map(pe => getExerciseHistory(pe.name, 3))
  )

  const alternateDays = await getAlternateDays(planDayId)
  const today = new Date().toISOString().split('T')[0]

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

  const { primary: dayPrimary, secondary: daySecondary, complementary: dayComplementary } = aggregateDayMuscles(exerciseCards)

  const totalSets = exerciseCards.reduce((sum, ex) => sum + ex.sets, 0)
  const avgRestSec = exerciseCards.length > 0
    ? exerciseCards.reduce((sum, ex) => sum + (ex.restSec ?? 120), 0) / exerciseCards.length
    : 120
  const estimatedMinutes = Math.round((totalSets * (45 + avgRestSec)) / 60)

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 space-y-0 animate-in fade-in duration-500">

      {/* ── BACK NAV ── */}
      <div className="pt-4 pb-6">
        <Link
          href="/plan"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all group"
          style={{ color: 'var(--fg-muted)' }}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Piano
        </Link>
      </div>

      {/* ── HERO HEADER ── */}
      <div
        className="relative rounded-[2.5rem] overflow-hidden mb-6"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, var(--bg-surface)), var(--bg-surface))',
          border: '1.5px solid color-mix(in srgb, var(--accent) 25%, var(--border-default))',
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />

        <div className="relative z-10 p-7">
          {/* Day badge + title */}
          <div className="flex items-start gap-5 mb-6">
            <div
              className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-black text-3xl text-white shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2, var(--accent)))' }}
            >
              {planDay.dayLabel}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                {planDay.plan.mesocycle?.name ?? 'Piano Attivo'}
              </p>
              <h1 className="text-2xl font-black text-primary tracking-tighter leading-tight">
                {planDay.focus ?? `Sessione ${planDay.dayLabel}`}
              </h1>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { icon: Target, label: `${exerciseCards.length} esercizi` },
              { icon: Activity, label: `${totalSets} serie` },
              { icon: Clock, label: `~${estimatedMinutes} min` },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
          </div>

          {/* Notes */}
          {planDay.notes && (
            <div
              className="flex gap-3 p-4 rounded-2xl mb-6"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <p className="text-sm leading-relaxed italic" style={{ color: 'var(--fg-muted)' }}>{planDay.notes}</p>
            </div>
          )}

          {/* Body muscle map */}
          {(dayPrimary.length > 0 || daySecondary.length > 0) && (
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--fg-subtle)' }}>
                <Activity className="w-3 h-3" /> Muscoli della sessione
              </p>
              <BodyMuscleMap
                primaryMuscles={dayPrimary}
                secondaryMuscles={daySecondary}
                complementary={dayComplementary}
                size="sm"
                showLegend
              />
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3 flex-wrap">
            <Link
              href={`/training/active?planDayId=${planDayId}`}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-black text-sm text-white transition-all active:scale-95"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 35%, transparent)',
              }}
            >
              <Play className="w-4 h-4" fill="white" />
              Inizia Sessione
            </Link>
            <PlanDayClient planDayId={planDayId} alternateDays={alternateDays} today={today} />
          </div>
        </div>
      </div>

      {/* ── EXERCISE LIST ── */}
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center justify-between px-1 mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--fg-muted)' }}>
            <Target className="w-3.5 h-3.5" />
            Esercizi
          </h2>
          <span className="text-[10px] font-bold" style={{ color: 'var(--fg-subtle)', opacity: 0.5 }}>
            → dettaglio e video
          </span>
        </div>

        {exerciseCards.map((exercise, idx) => {
          const history = histories[idx]
          const lastSets = history.entries.filter(e => !e.isWarmup)
          const lastWeight = lastSets[0]?.weightKg ?? null
          const lastReps   = lastSets[0]?.repsActual ?? null
          const lastRir    = lastSets[0]?.rirActual ?? null
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

      {/* ── FOOTER NOTE ── */}
      <div
        className="mt-6 p-5 rounded-[1.5rem] text-center"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
      >
        <p className="text-[10px] leading-relaxed italic" style={{ color: 'var(--fg-muted)', opacity: 0.6 }}>
          Carichi suggeriti via metodo RIR (Israetel / RP). Il campo kg nella scheda è solo un promemoria — i dati ufficiali si registrano nella sessione attiva.
        </p>
      </div>
    </div>
  )
}

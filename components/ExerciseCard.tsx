'use client'

import { useState, useEffect } from 'react'
import { District, Equipment } from '@prisma/client'
import { X, Dumbbell, Zap, Info, ChevronRight, TrendingUp, TrendingDown, Minus, ChevronLeft } from 'lucide-react'
import BodyMuscleMap from './BodyMuscleMap'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EQUIPMENT_LABELS: Record<Equipment, { label: string; icon: string }> = {
  BARBELL:        { label: 'Bilanciere',   icon: '🏋️' },
  DUMBBELL:       { label: 'Manubri',      icon: '💪' },
  CABLE:          { label: 'Cavi',         icon: '🔗' },
  MACHINE:        { label: 'Macchinario',  icon: '⚙️' },
  BODYWEIGHT:     { label: 'Corpo libero', icon: '🤸' },
  KETTLEBELL:     { label: 'Kettlebell',   icon: '🫙' },
  RESISTANCE_BAND:{ label: 'Elastico',     icon: '🎗️' },
  SMITH_MACHINE:  { label: 'Smith',        icon: '🔩' },
}

const MACHINE_LOOKUP: Record<string, string> = {
  'hack squat':     'Hack Squat Machine',
  'leg press':      'Leg Press',
  'leg curl':       'Leg Curl Machine',
  'leg extension':  'Leg Extension Machine',
  'lat pulldown':   'Lat Pulldown / Cable Tower',
  'seated row':     'Low Row / Cable Row',
  'chest press':    'Chest Press Machine',
  'shoulder press': 'Shoulder Press Machine',
  'pec deck':       'Pec Deck / Butterfly',
  'chest fly':      'Cable Crossover / Pec Deck',
  'cable row':      'Low Cable Row',
  'cable fly':      'Cable Crossover',
  'hip thrust':     'Hip Thrust Machine',
  'glute kickback': 'Kickback Machine',
  'calf raise':     'Calf Raise Machine',
  'back extension': 'Roman Chair',
  'abductor':       'Abductor Machine',
  'adductor':       'Adductor Machine',
}

function getMachineInfo(name: string): string | null {
  const lower = name.toLowerCase()
  for (const [key, m] of Object.entries(MACHINE_LOOKUP)) {
    if (lower.includes(key)) return m
  }
  return null
}

const FEELING_LABELS = ['', '😣 Pesante', '😤 Difficile', '😐 Ok', '😊 Buona', '🔥 Ottima']

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ExerciseCardData {
  id: string
  name: string
  orderIndex: number
  sets: number
  repsMin: number
  repsMax: number
  targetRir: number
  restSec: number
  notes?: string | null
  equipment?: Equipment | null
  difficulty?: string | null
  primaryMuscles?: District[]
  secondaryMuscles?: District[]
  mediaUrl?: string | null
  mediaUrls?: string[]
  description?: string | null
  descriptionIt?: string | null
  tips?: string | null
  tipsIt?: string | null
  isCompound?: boolean | null
  movementType?: string | null
}

interface ExerciseCardProps {
  exercise: ExerciseCardData
  index: number
  lastWeight?: number | null
  lastReps?: number | null
  lastRir?: number | null
  lastFeeling?: number | null
  trend?: 'up' | 'down' | 'stable' | 'none'
  suggestedWeight?: number | null
  suggestionRationale?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise Detail Modal (bottom sheet on mobile, centered on desktop)
// ─────────────────────────────────────────────────────────────────────────────

function ExerciseDetailModal({
  exercise,
  lastWeight, lastReps, lastRir, lastFeeling,
  suggestedWeight, suggestionRationale,
  onClose,
}: ExerciseCardProps & { onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0)
  const allImages = [exercise.mediaUrl, ...(exercise.mediaUrls ?? [])].filter(Boolean) as string[]
  const desc = exercise.descriptionIt || exercise.description
  const tips = exercise.tipsIt || exercise.tips
  const machineInfo = exercise.equipment === 'MACHINE' ? getMachineInfo(exercise.name) : null

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-rise-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border-default))',
          borderRadius: '2.5rem 2.5rem 0 0',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="w-10 h-1 rounded-full opacity-30" style={{ background: 'var(--fg-muted)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-4 pb-3 shrink-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2, var(--accent)))' }}
          >
            {exercise.orderIndex + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-lg text-primary leading-tight tracking-tight truncate">
              {exercise.name}
            </h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <span
                className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}
              >
                {exercise.sets}×{exercise.repsMin === exercise.repsMax ? exercise.repsMin : `${exercise.repsMin}–${exercise.repsMax}`} @RIR{exercise.targetRir}
              </span>
              {exercise.equipment && (
                <span className="text-[10px] font-bold" style={{ color: 'var(--fg-muted)' }}>
                  {EQUIPMENT_LABELS[exercise.equipment]?.icon} {EQUIPMENT_LABELS[exercise.equipment]?.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-5 scrollbar-hide">

          {/* Image viewer */}
          {allImages.length > 0 ? (
            <div className="relative rounded-[1.5rem] overflow-hidden bg-base border border-border"
              style={{ aspectRatio: '4/3' }}>
              <img
                src={allImages[imgIdx]}
                alt={exercise.name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImgIdx(i => Math.min(allImages.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {allImages.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{ background: i === imgIdx ? 'white' : 'rgba(255,255,255,0.4)', transform: i === imgIdx ? 'scale(1.3)' : 'scale(1)' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-[1.5rem] flex items-center justify-center py-10"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <div className="text-center space-y-2">
                <Dumbbell className="w-10 h-10 mx-auto opacity-20" style={{ color: 'var(--fg-muted)' }} />
                <p className="text-xs font-bold opacity-40" style={{ color: 'var(--fg-muted)' }}>Nessuna immagine</p>
              </div>
            </div>
          )}

          {/* Machine info */}
          {machineInfo && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'color-mix(in srgb, #f59e0b 10%, transparent)', border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)' }}>
              <span className="text-lg">⚙️</span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#f59e0b' }}>Macchinario</p>
                <p className="text-sm font-bold text-primary">{machineInfo}</p>
              </div>
            </div>
          )}

          {/* Last performance + suggestion row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--fg-subtle)' }}>Ultima volta</p>
              {lastWeight != null ? (
                <>
                  <p className="text-base font-black text-primary leading-tight">
                    {lastWeight}kg × {lastReps ?? '?'}
                    {lastRir != null && <span className="text-xs font-medium ml-1" style={{ color: 'var(--fg-muted)' }}>@{lastRir}</span>}
                  </p>
                  {lastFeeling != null && (
                    <p className="text-[10px] mt-1" style={{ color: 'var(--fg-muted)' }}>{FEELING_LABELS[lastFeeling]}</p>
                  )}
                </>
              ) : (
                <p className="text-xs font-bold" style={{ color: 'var(--fg-muted)' }}>Prima sessione</p>
              )}
            </div>
            <div className="p-4 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>⚡ Oggi prova</p>
              {suggestedWeight != null ? (
                <>
                  <p className="text-base font-black text-primary">{suggestedWeight}kg</p>
                  {suggestionRationale && (
                    <p className="text-[10px] leading-tight mt-1 line-clamp-2" style={{ color: 'var(--fg-muted)' }}>{suggestionRationale}</p>
                  )}
                </>
              ) : (
                <p className="text-xs font-bold" style={{ color: 'var(--fg-muted)' }}>Carico libero</p>
              )}
            </div>
          </div>

          {/* Description */}
          {desc && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--fg-subtle)' }}>
                <Info className="w-3 h-3" /> Come eseguire
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{desc}</p>
            </div>
          )}

          {/* Tips */}
          {tips && (
            <div className="p-4 rounded-2xl"
              style={{ background: 'color-mix(in srgb, #10b981 8%, transparent)', border: '1px solid color-mix(in srgb, #10b981 20%, transparent)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#10b981' }}>
                <Zap className="w-3 h-3" /> Consigli tecnici
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{tips}</p>
            </div>
          )}

          {/* Plan notes */}
          {exercise.notes && (
            <div className="flex gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <p className="text-xs italic leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{exercise.notes}</p>
            </div>
          )}

          {/* Muscle heatmap */}
          {(exercise.primaryMuscles?.length || exercise.secondaryMuscles?.length) ? (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--fg-subtle)' }}>
                🫀 Muscoli coinvolti
              </p>
              <BodyMuscleMap
                primaryMuscles={exercise.primaryMuscles ?? []}
                secondaryMuscles={exercise.secondaryMuscles ?? []}
                size="sm"
                showLegend
              />
            </div>
          ) : null}

          {/* Rest time */}
          <div className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--fg-subtle)' }}>Recupero</p>
              <p className="text-base font-black text-primary">{exercise.restSec}s</p>
            </div>
            {exercise.isCompound && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--accent2, var(--accent)) 15%, transparent)', color: 'var(--accent2, var(--accent))' }}>
                Multiarticolare
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ExerciseCard (compact list item)
// ─────────────────────────────────────────────────────────────────────────────

export default function ExerciseCard({
  exercise, index,
  lastWeight, lastReps, lastRir, lastFeeling,
  trend, suggestedWeight, suggestionRationale,
}: ExerciseCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [plannedWeight, setPlannedWeight] = useState(
    suggestedWeight != null ? String(suggestedWeight) : lastWeight != null ? String(lastWeight) : ''
  )

  const repsLabel = exercise.repsMin === exercise.repsMax
    ? String(exercise.repsMin)
    : `${exercise.repsMin}–${exercise.repsMax}`

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'

  return (
    <>
      <div
        className="rounded-[1.75rem] overflow-hidden transition-all duration-200"
        style={{
          background: 'var(--bg-elevated)',
          border: '1.5px solid var(--border-default)',
        }}
      >
        {/* ── Main row ── */}
        <div className="flex items-center gap-3 p-4">
          {/* Number badge */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2, var(--accent)))' }}
          >
            {index + 1}
          </div>

          {/* Name + prescription */}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base text-primary leading-tight truncate tracking-tight">
              {exercise.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  color: 'var(--accent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                }}
              >
                {exercise.sets}×{repsLabel} @RIR{exercise.targetRir}
              </span>
              {exercise.equipment && (
                <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>
                  {EQUIPMENT_LABELS[exercise.equipment]?.icon}
                </span>
              )}
              {trend && trend !== 'none' && (
                <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
              )}
            </div>
          </div>

          {/* Quick weight target input */}
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="number"
              value={plannedWeight}
              onChange={e => setPlannedWeight(e.target.value)}
              placeholder="kg"
              className="w-16 h-9 px-2 rounded-xl text-sm font-black text-center outline-none transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border-default)',
                color: 'var(--fg-primary)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          {/* Detail arrow */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--fg-muted)',
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Last perf + suggestion strip ── */}
        {(lastWeight != null || suggestedWeight != null) && (
          <div
            className="flex items-center gap-3 px-4 pb-3"
          >
            {lastWeight != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--fg-subtle)' }}>
                  Ultima:
                </span>
                <span className="text-[11px] font-black" style={{ color: 'var(--fg-primary)' }}>
                  {lastWeight}kg×{lastReps}
                  {lastRir != null && (
                    <span className="font-medium opacity-60"> @{lastRir}</span>
                  )}
                </span>
              </div>
            )}
            {lastWeight != null && suggestedWeight != null && (
              <span className="opacity-20" style={{ color: 'var(--fg-muted)' }}>·</span>
            )}
            {suggestedWeight != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                  ⚡ Oggi:
                </span>
                <span className="text-[11px] font-black" style={{ color: 'var(--accent)' }}>
                  {suggestedWeight}kg
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {modalOpen && (
        <ExerciseDetailModal
          exercise={exercise}
          index={index}
          lastWeight={lastWeight}
          lastReps={lastReps}
          lastRir={lastRir}
          lastFeeling={lastFeeling}
          trend={trend}
          suggestedWeight={suggestedWeight}
          suggestionRationale={suggestionRationale}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}

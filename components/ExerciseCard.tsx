'use client'

import { useState } from 'react'
import { District, Equipment } from '@prisma/client'
import { ChevronDown, ChevronUp, Dumbbell, Zap, Info, Monitor, Weight } from 'lucide-react'
import BodyMuscleMap from './BodyMuscleMap'

// Equipment italiani con icona
const EQUIPMENT_LABELS: Record<Equipment, { label: string; icon: string; machineNote?: string }> = {
  BARBELL: { label: 'Bilanciere', icon: '🏋️' },
  DUMBBELL: { label: 'Manubri', icon: '💪' },
  CABLE: { label: 'Cavi / Pulley', icon: '🔗' },
  MACHINE: { label: 'Macchinario', icon: '⚙️', machineNote: 'Vedi nome esercizio per il macchinario specifico' },
  BODYWEIGHT: { label: 'Corpo libero', icon: '🤸' },
  KETTLEBELL: { label: 'Kettlebell', icon: '🫙' },
  RESISTANCE_BAND: { label: 'Elastico', icon: '🎗️' },
  SMITH_MACHINE: { label: 'Smith Machine', icon: '🔩' },
}

// Lookup per macchine specifiche per esercizi comuni
const MACHINE_LOOKUP: Record<string, string> = {
  'hack squat': 'Hack Squat Machine',
  'leg press': 'Leg Press',
  'leg curl': 'Leg Curl Machine / Lying Leg Curl',
  'leg extension': 'Leg Extension Machine',
  'lat pulldown': 'Lat Pulldown / Cable Tower',
  'seated row': 'Low Row / Cable Row Machine',
  'chest press': 'Chest Press Machine',
  'shoulder press': 'Shoulder Press Machine',
  'pec deck': 'Pec Deck / Butterfly Machine',
  'chest fly': 'Cable Crossover / Pec Deck',
  'cable row': 'Low Cable Row',
  'cable fly': 'Cable Crossover',
  'hip thrust': 'Hip Thrust Machine o Bench + Bilanciere',
  'glute kickback': 'Cable / Kickback Machine',
  'calf raise': 'Calf Raise Machine o Leg Press',
  'back extension': 'Back Extension / Roman Chair',
}

function getMachineInfo(exerciseName: string): string | null {
  const lower = exerciseName.toLowerCase()
  for (const [key, machine] of Object.entries(MACHINE_LOOKUP)) {
    if (lower.includes(key)) return machine
  }
  return null
}

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
  // From ExerciseDefinition (optional)
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
  // History
  lastWeight?: number | null
  lastReps?: number | null
  lastRir?: number | null
  lastFeeling?: number | null
  trend?: 'up' | 'down' | 'stable' | 'none'
  // Suggestion
  suggestedWeight?: number | null
  suggestionRationale?: string | null
}

export default function ExerciseCard({
  exercise, index,
  lastWeight, lastReps, lastRir, lastFeeling,
  trend, suggestedWeight, suggestionRationale,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [imageIdx, setImageIdx] = useState(0)

  const hasDef = !!(exercise.equipment || exercise.primaryMuscles?.length)
  const allImages = [exercise.mediaUrl, ...(exercise.mediaUrls ?? [])].filter(Boolean) as string[]
  const machineInfo = exercise.equipment === 'MACHINE' ? getMachineInfo(exercise.name) : null
  const isMachine = exercise.equipment === 'MACHINE' || exercise.equipment === 'CABLE' || exercise.equipment === 'SMITH_MACHINE'
  const desc = exercise.descriptionIt || exercise.description
  const tips = exercise.tipsIt || exercise.tips

  const FEELING_LABELS = ['', '😣 Pesante', '😤 Difficile', '😐 Ok', '😊 Buona', '🔥 Ottima']
  const TREND_COLORS = { up: 'var(--positive)', down: 'var(--negative)', stable: 'var(--warning)', none: 'var(--fg-muted)' }
  const TREND_ICONS = { up: '↑', down: '↓', stable: '→', none: '' }

  return (
    <div
      className="bg-surface rounded-[2rem] border border-border overflow-hidden transition-all duration-300"
      style={{ boxShadow: expanded ? '0 8px 32px rgba(0,0,0,0.2)' : 'none' }}
    >
      {/* ── MAIN ROW ── */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Number badge */}
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 mt-0.5"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
          >
            {index + 1}
          </div>

          {/* Exercise info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-black text-primary text-base leading-tight">{exercise.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {/* Prescription */}
                  <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20">
                    {exercise.sets}×{exercise.repsMin === exercise.repsMax ? exercise.repsMin : `${exercise.repsMin}-${exercise.repsMax}`} @RIR{exercise.targetRir}
                  </span>
                  {/* Rest */}
                  <span className="text-[10px] font-bold text-muted">⏱ {exercise.restSec}s</span>
                  {/* Equipment */}
                  {exercise.equipment && (
                    <span className="text-[10px] font-bold text-muted">
                      {EQUIPMENT_LABELS[exercise.equipment]?.icon} {EQUIPMENT_LABELS[exercise.equipment]?.label}
                    </span>
                  )}
                  {/* Compound badge */}
                  {exercise.isCompound && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-accent2 bg-accent2/10 px-1.5 py-0.5 rounded-md border border-accent2/20">
                      Multiarticolare
                    </span>
                  )}
                  {/* Trend */}
                  {trend && trend !== 'none' && (
                    <span className="text-[10px] font-black" style={{ color: TREND_COLORS[trend] }}>
                      {TREND_ICONS[trend]} {trend === 'up' ? 'Progressione' : trend === 'down' ? 'Regressione' : 'Stabile'}
                    </span>
                  )}
                </div>
              </div>

              {/* Expand button */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                style={{
                  background: expanded ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: expanded ? 'white' : 'var(--fg-muted)',
                }}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {/* Last performance */}
              {lastWeight != null ? (
                <div className="p-2.5 rounded-xl bg-base border border-border">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Ultima volta</p>
                  <p className="text-sm font-black text-primary">
                    {lastWeight}kg × {lastReps ?? '?'}
                    {lastRir != null && <span className="text-muted text-xs font-medium"> @{lastRir}</span>}
                  </p>
                  {lastFeeling != null && (
                    <p className="text-[9px] text-muted mt-0.5">{FEELING_LABELS[lastFeeling]}</p>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-base border border-border flex items-center justify-center">
                  <p className="text-[9px] text-muted text-center">Prima sessione</p>
                </div>
              )}

              {/* AI suggestion */}
              {suggestedWeight != null ? (
                <div className="p-2.5 rounded-xl bg-accent/5 border border-accent/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-1">⚡ Oggi prova</p>
                  <p className="text-sm font-black text-primary">{suggestedWeight}kg</p>
                  {suggestionRationale && (
                    <p className="text-[9px] text-muted mt-0.5 leading-tight line-clamp-2">{suggestionRationale}</p>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-center">
                  <p className="text-[9px] text-accent text-center">Carico libero</p>
                </div>
              )}
            </div>

            {/* Machine info callout */}
            {isMachine && (machineInfo || exercise.equipment === 'MACHINE') && (
              <div className="mt-2 px-3 py-2 rounded-xl flex items-center gap-2 bg-warning/5 border border-warning/20">
                <span className="text-warning text-sm">⚙️</span>
                <p className="text-[10px] text-muted font-medium">
                  <span className="text-warning font-bold">Macchinario: </span>
                  {machineInfo ?? 'Vedi nome esercizio per il macchinario specifico'}
                </p>
              </div>
            )}

            {/* Plan notes */}
            {exercise.notes && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-base border border-border text-[10px] text-muted italic flex gap-2 items-start">
                <Info className="w-3 h-3 mt-0.5 text-accent shrink-0" />
                {exercise.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EXPANDED DETAIL ── */}
      {expanded && (
        <div className="border-t border-border">
          <div className="p-5 space-y-5">

            {/* Image viewer */}
            {allImages.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Esecuzione</p>
                <div className="relative rounded-2xl overflow-hidden bg-base border border-border"
                  style={{ aspectRatio: '16/9' }}>
                  <img
                    src={allImages[imageIdx]}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  {allImages.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImageIdx(i)}
                          className="w-1.5 h-1.5 rounded-full transition-all"
                          style={{ background: i === imageIdx ? 'white' : 'rgba(255,255,255,0.4)' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-base border border-border flex items-center justify-center p-8">
                <div className="text-center">
                  <Dumbbell className="w-10 h-10 text-muted opacity-30 mx-auto mb-2" />
                  <p className="text-[10px] text-muted font-medium">Nessuna immagine disponibile</p>
                </div>
              </div>
            )}

            {/* Description */}
            {desc && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Come eseguire
                </p>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            )}

            {/* Tips */}
            {tips && (
              <div className="p-3 rounded-2xl bg-positive/5 border border-positive/20">
                <p className="text-[9px] font-black uppercase tracking-widest text-positive mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Consigli tecnici
                </p>
                <p className="text-xs text-muted leading-relaxed">{tips}</p>
              </div>
            )}

            {/* Muscle Heatmap */}
            {(exercise.primaryMuscles?.length || exercise.secondaryMuscles?.length) ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
                  🫀 Muscoli coinvolti
                </p>
                <BodyMuscleMap
                  primaryMuscles={exercise.primaryMuscles ?? []}
                  secondaryMuscles={exercise.secondaryMuscles ?? []}
                  size="sm"
                  showLegend={true}
                />
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-base border border-border text-center">
                <p className="text-[10px] text-muted">Dati muscolari non disponibili per questo esercizio</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

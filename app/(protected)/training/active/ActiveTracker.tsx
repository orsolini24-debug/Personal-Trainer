'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Check, ChevronLeft, ChevronRight, Flag,
  Bot, Camera, Send, RefreshCw, Layers, SkipForward,
  Plus, Minus, ChevronDown, ChevronUp, Info,
  AlertTriangle, Dumbbell, Trophy, Timer, Play,
} from 'lucide-react'
import { logSet, advanceExercise, finishSession, abandonSession } from '@/app/actions/active-session'
import { askWorkoutAI, suggestExerciseAlternative, WorkoutAIMessage } from '@/app/actions/workout-ai'
import { District } from '@prisma/client'
import MuscleHeatmap from '@/app/components/MuscleHeatmap'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CompletedSet = {
  setNumber: number
  weightKg: number | null
  repsActual: number | null
  rirActual: number | null
  isWarmup: boolean
}

type ExerciseData = {
  id: string
  name: string
  orderIndex: number
  sets: number
  repsMin: number
  repsMax: number
  targetRir: number
  restSec: number
  planNotes: string
  mediaUrl: string | null
  mediaUrls: string[]
  primaryMuscles: District[]
  secondaryMuscles: District[]
  description: string | null
  tips: string | null
  completedSets: CompletedSet[]
  previousSets: { setNumber: number; weightKg: number | null; repsActual: number | null }[]
}

type TrackerData = {
  activeSessionId: string
  workoutSessionId: string
  sessionType: string
  startedAt: string
  currentExerciseIdx: number
  currentSetIdx: number
  exercises: ExerciseData[]
}

type TableInput = { kg: string; reps: string; rir: string }
type Screen = 'overview' | 'exercise'

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────

function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function elapsed(startedAt: string) {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}

function beep(freq = 880, duration = 0.4) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq; osc.type = 'sine'
    gain.gain.setValueAtTime(0.35, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(); osc.stop(ctx.currentTime + duration)
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// RestOverlay — full-screen rest countdown
// ─────────────────────────────────────────────────────────────────────────────

function RestOverlay({
  restLeft, restTotal, onSkip, onAdjust, accent,
}: {
  restLeft: number; restTotal: number; onSkip: () => void
  onAdjust: (delta: number) => void; accent: string
}) {
  const progress = restTotal > 0 ? restLeft / restTotal : 0
  const circumference = 2 * Math.PI * 80
  const dashOffset = circumference * (1 - progress)
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--bg-base)', backdropFilter: 'blur(20px)' }}>
      <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: accent }}>Recupero</p>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="90" cy="90" r="80" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
        </svg>
        <div className="text-center">
          <span className="text-6xl font-black tabular-nums leading-none"
            style={{ color: restLeft <= 5 ? '#ef4444' : 'var(--fg-primary)' }}>{fmt(restLeft)}</span>
          <p className="text-xs font-bold mt-1" style={{ color: 'var(--fg-muted)' }}>/ {fmt(restTotal)}</p>
        </div>
      </div>
      <div className="flex gap-3">
        {[-30, -15, +15, +30].map(delta => (
          <button key={delta} onClick={() => onAdjust(delta)}
            className="px-4 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95"
            style={{
              background: delta > 0 ? 'var(--bg-elevated)' : 'color-mix(in srgb, #ef4444 12%, var(--bg-elevated))',
              border: `1px solid ${delta > 0 ? 'var(--border-default)' : 'color-mix(in srgb, #ef4444 30%, transparent)'}`,
              color: delta > 0 ? 'var(--fg-muted)' : '#ef4444',
            }}>
            {delta > 0 ? `+${delta}s` : `${delta}s`}
          </button>
        ))}
      </div>
      <button onClick={onSkip}
        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm transition-all active:scale-95"
        style={{ background: accent, color: 'var(--accent-on)', boxShadow: `0 8px 24px color-mix(in srgb, ${accent} 35%, transparent)` }}>
        Avanti <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PlateCalculator
// ─────────────────────────────────────────────────────────────────────────────

function PlateCalculator({ isOpen, onClose, onApply, initialWeight }: {
  isOpen: boolean; onClose: () => void; onApply: (weight: number) => void; initialWeight: number
}) {
  const [targetWeight, setTargetWeight] = useState(initialWeight || 20)
  const [barbellWeight, setBarbellWeight] = useState(20)
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25]
  useEffect(() => { if (isOpen) setTargetWeight(initialWeight || 20) }, [isOpen, initialWeight])
  if (!isOpen) return null

  const weightPerSide = Math.max(0, (targetWeight - barbellWeight) / 2)
  let remaining = weightPerSide
  const platesNeeded: { weight: number; count: number }[] = []
  plates.forEach(p => {
    if (remaining >= p) {
      const count = Math.floor(remaining / p)
      platesNeeded.push({ weight: p, count })
      remaining = Math.round((remaining - count * p) * 100) / 100
    }
  })
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--fg-primary)' }}>
            <Layers className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Calcolatore Dischi
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: 'var(--fg-muted)' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col items-center mb-6">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--fg-muted)' }}>Peso Totale</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setTargetWeight(w => Math.max(20, w - 2.5))}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}>
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-4xl font-black w-32 text-center" style={{ color: 'var(--fg-primary)' }}>
              {targetWeight} <span className="text-lg font-medium" style={{ color: 'var(--fg-muted)' }}>kg</span>
            </span>
            <button onClick={() => setTargetWeight(w => w + 2.5)}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}>
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-center mb-3" style={{ color: 'var(--fg-muted)' }}>Per ogni lato</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {platesNeeded.length === 0
              ? <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>Solo bilanciere ({barbellWeight}kg)</span>
              : platesNeeded.map((p, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5" style={{ height: 60 }}>
                    {Array.from({ length: p.count }).map((_, i) => (
                      <div key={i} className="w-3 rounded-sm"
                        style={{ background: 'var(--accent)', height: Math.max(16, p.weight * 2.2), border: '1px solid rgba(255,255,255,0.12)' }} />
                    ))}
                  </div>
                  <span className="text-xs font-black" style={{ color: 'var(--fg-primary)' }}>{p.weight}</span>
                  <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>×{p.count}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="flex gap-2 mb-4 text-xs">
          <span className="text-xs font-bold" style={{ color: 'var(--fg-muted)' }}>Bilanciere:</span>
          {[10, 15, 20].map(w => (
            <button key={w} onClick={() => setBarbellWeight(w)}
              className="px-3 py-1 rounded-xl font-black transition-all"
              style={{
                background: barbellWeight === w ? 'var(--accent)' : 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: barbellWeight === w ? 'var(--accent-on)' : 'var(--fg-muted)',
              }}>
              {w}kg
            </button>
          ))}
        </div>
        <button onClick={() => { onApply(targetWeight); onClose() }}
          className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
          Usa {targetWeight}kg
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AICoachDrawer
// ─────────────────────────────────────────────────────────────────────────────

function AICoachDrawer({ isOpen, onClose, exercise, currentSet }: {
  isOpen: boolean; onClose: () => void; exercise: ExerciseData; currentSet: number
}) {
  const [messages, setMessages] = useState<WorkoutAIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevBest = exercise.previousSets[0]

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Ciao! Stai eseguendo **${exercise.name}** — ${exercise.sets}×${exercise.repsMin}-${exercise.repsMax} @RIR${exercise.targetRir}.${prevBest ? ` Ultima: ${prevBest.weightKg}kg×${prevBest.repsActual}.` : ''} Come posso aiutarti?`,
      }])
    }
  }, [isOpen])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const handleSend = async (text?: string, img?: string | null) => {
    const msgText = text ?? input.trim()
    if (!msgText && !img) return
    const userMsg: WorkoutAIMessage = { role: 'user', content: msgText || '📷 Analizza tecnica' }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages); setInput(''); setPendingImage(null); setLoading(true)
    const { reply, error } = await askWorkoutAI(newMessages, {
      exerciseName: exercise.name, currentSet, totalSets: exercise.sets,
      repsMin: exercise.repsMin, repsMax: exercise.repsMax,
      targetRir: exercise.targetRir, restSec: exercise.restSec,
      lastWeight: exercise.previousSets[0]?.weightKg, lastReps: exercise.previousSets[0]?.repsActual,
    }, img ?? null)
    setMessages(prev => [...prev, { role: 'assistant', content: error ? `❌ ${error}` : reply }])
    setLoading(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPendingImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  if (!isOpen) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[2rem] overflow-hidden animate-in slide-in-from-bottom-4"
        style={{ height: '80dvh', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="shrink-0 flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>
              <Bot className="w-4 h-4" style={{ color: 'var(--accent-on)' }} />
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: 'var(--fg-primary)' }}>Coach AI</p>
              <p className="text-[10px] font-bold" style={{ color: 'var(--fg-muted)' }}>{exercise.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: 'var(--fg-muted)', background: 'var(--bg-elevated)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={m.role === 'user'
                  ? { background: 'var(--accent)', color: 'var(--accent-on)', borderBottomRightRadius: 6 }
                  : { background: 'var(--bg-elevated)', color: 'var(--fg-primary)', border: '1px solid var(--border-subtle)', borderBottomLeftRadius: 6 }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          {pendingImage && (
            <div className="flex justify-end">
              <div className="relative">
                <img src={pendingImage} alt="preview" className="w-32 h-32 rounded-2xl object-cover" />
                <button onClick={() => setPendingImage(null)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ background: 'rgba(0,0,0,0.6)' }}>×</button>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {['Alternativa più facile?', 'Corretto il carico?', 'Tecnica corretta?'].map(q => (
              <button key={q} onClick={() => handleSend(q)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="shrink-0 px-4 pb-6 pt-3 flex items-end gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
          <button onClick={() => fileRef.current?.click()}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{ background: pendingImage ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: pendingImage ? 'var(--accent-on)' : 'var(--fg-muted)' }}>
            <Camera className="w-5 h-5" />
          </button>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Chiedi al tuo coach..." rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)', maxHeight: '100px' }} />
          <button onClick={() => pendingImage ? handleSend(input || undefined, pendingImage) : handleSend()}
            disabled={loading || (!input.trim() && !pendingImage)}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ExerciseSkipSheet
// ─────────────────────────────────────────────────────────────────────────────

function ExerciseSkipSheet({ isOpen, onClose, exercise, onSkip, onSwapSuggested }: {
  isOpen: boolean; onClose: () => void; exercise: ExerciseData; onSkip: () => void; onSwapSuggested: (name: string) => void
}) {
  const [reason, setReason] = useState('')
  const [loadingAlt, setLoadingAlt] = useState(false)
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [explanation, setExplanation] = useState('')

  const handleGetAlternatives = async () => {
    setLoadingAlt(true); setAlternatives([])
    const { alternatives: alts, explanation: expl } = await suggestExerciseAlternative(exercise.name, reason)
    setAlternatives(alts); setExplanation(expl); setLoadingAlt(false)
  }

  if (!isOpen) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] p-6 space-y-5 animate-in slide-in-from-bottom-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', maxHeight: '85dvh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black" style={{ color: 'var(--fg-primary)' }}>{exercise.name}</h3>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--fg-muted)' }}>Cosa vuoi fare con questo esercizio?</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--fg-muted)' }}>Perché non va? (opzionale)</p>
          <input value={reason} onChange={e => setReason(e.target.value)}
            placeholder="es. macchinario occupato, dolore spalla..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }} />
        </div>
        <button onClick={handleGetAlternatives} disabled={loadingAlt}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
          {loadingAlt ? <><RefreshCw className="w-4 h-4 animate-spin" /> Cerco alternative…</> : <><Bot className="w-4 h-4" /> Chiedi una sostituzione all&apos;AI</>}
        </button>
        {alternatives.length > 0 && (
          <div className="space-y-3">
            {explanation && <p className="text-xs leading-relaxed px-1" style={{ color: 'var(--fg-muted)' }}>{explanation}</p>}
            {alternatives.map((alt, i) => (
              <button key={i} onClick={() => { onSwapSuggested(alt); onClose() }}
                className="w-full px-4 py-3.5 rounded-2xl text-left font-bold text-sm flex items-center gap-3 transition-all active:scale-95"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}>
                <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>{i + 1}</span>
                {alt}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>oppure</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>
        <button onClick={() => { onSkip(); onClose() }}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--negative)', color: 'var(--negative)' }}>
          <SkipForward className="w-4 h-4" /> Salta esercizio
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SetTableRow — inline row in Hevy-style set table
// ─────────────────────────────────────────────────────────────────────────────

function SetTableRow({
  setLabel, prevKg, prevReps, isPrevBetter, input, completed, completedData,
  isPR, accent, onChange, onComplete, onLongPressKg,
}: {
  setLabel: string
  prevKg: number | null
  prevReps: number | null
  isPrevBetter: boolean
  input: TableInput
  completed: boolean
  completedData?: CompletedSet
  isPR: boolean
  accent: string
  onChange: (field: keyof TableInput, val: string) => void
  onComplete: () => void
  onLongPressKg: () => void
}) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isWarmup = setLabel === 'W'
  const prevStr = prevKg != null && prevReps != null ? `${prevKg}×${prevReps}` : '–'

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-2 rounded-xl transition-all duration-500"
      style={{
        background: isPR && completed
          ? 'rgba(245,194,0,0.06)'
          : completed
            ? 'rgba(52,211,153,0.05)'
            : 'transparent',
        border: isPR && completed
          ? '1px solid rgba(245,194,0,0.18)'
          : completed
            ? '1px solid rgba(52,211,153,0.12)'
            : '1px solid transparent',
      }}>

      {/* Set badge */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
        style={{
          background: completed
            ? isPR ? 'rgba(245,194,0,0.15)' : 'rgba(52,211,153,0.12)'
            : isWarmup ? 'rgba(251,146,60,0.12)' : 'var(--bg-elevated)',
          color: completed
            ? isPR ? '#F5C200' : 'var(--positive)'
            : isWarmup ? 'var(--warning)' : 'var(--fg-muted)',
        }}>
        {completed && !isPR ? <Check className="w-3.5 h-3.5" /> : isPR && completed ? <Trophy className="w-3 h-3" /> : setLabel}
      </div>

      {/* Prev column */}
      <div className="w-[68px] shrink-0 text-center">
        <span className="text-[11px] font-medium tabular-nums leading-none"
          style={{ color: isPrevBetter ? 'var(--fg-muted)' : 'var(--fg-subtle)' }}>
          {prevStr}
        </span>
        {isPrevBetter && <span className="text-[9px] ml-0.5" style={{ color: 'var(--accent)' }}>↑</span>}
      </div>

      {/* Kg input */}
      <div
        className="flex-1 relative"
        onPointerDown={() => { longPressRef.current = setTimeout(onLongPressKg, 500) }}
        onPointerUp={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null } }}
        onPointerLeave={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null } }}>
        {completed
          ? <div className="w-full text-center py-2 rounded-lg text-sm font-black tabular-nums"
              style={{ background: 'var(--bg-elevated)', color: 'var(--fg-primary)' }}>
              {completedData?.weightKg ?? '–'}
            </div>
          : <input
              type="number" inputMode="decimal" placeholder="–"
              value={input.kg}
              onChange={e => onChange('kg', e.target.value)}
              className="w-full text-center text-sm font-black rounded-lg py-2 outline-none"
              style={{
                background: input.kg ? `color-mix(in srgb, ${accent} 12%, var(--bg-elevated))` : 'var(--bg-elevated)',
                border: `1.5px solid ${input.kg ? accent + '60' : 'var(--border-subtle)'}`,
                color: 'var(--fg-primary)', WebkitAppearance: 'none', MozAppearance: 'textfield',
              }}
            />
        }
      </div>

      {/* Reps input */}
      <div className="w-[44px] shrink-0">
        {completed
          ? <div className="w-full text-center py-2 rounded-lg text-sm font-black tabular-nums"
              style={{ background: 'var(--bg-elevated)', color: 'var(--fg-primary)' }}>
              {completedData?.repsActual ?? '–'}
            </div>
          : <input
              type="number" inputMode="numeric" placeholder="–"
              value={input.reps}
              onChange={e => onChange('reps', e.target.value)}
              className="w-full text-center text-sm font-black rounded-lg py-2 outline-none"
              style={{
                background: input.reps ? `color-mix(in srgb, ${accent} 12%, var(--bg-elevated))` : 'var(--bg-elevated)',
                border: `1.5px solid ${input.reps ? accent + '60' : 'var(--border-subtle)'}`,
                color: 'var(--fg-primary)', WebkitAppearance: 'none', MozAppearance: 'textfield',
              }}
            />
        }
      </div>

      {/* RIR input (working sets only) */}
      {!isWarmup
        ? <div className="w-[36px] shrink-0">
            {completed
              ? <div className="w-full text-center py-2 rounded-lg text-xs font-medium tabular-nums"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
                  {completedData?.rirActual ?? '–'}
                </div>
              : <input
                  type="number" inputMode="numeric" placeholder="–"
                  value={input.rir}
                  onChange={e => onChange('rir', e.target.value)}
                  className="w-full text-center text-xs font-medium rounded-lg py-2 outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1.5px solid var(--border-subtle)',
                    color: 'var(--fg-muted)', WebkitAppearance: 'none', MozAppearance: 'textfield',
                  }}
                />
            }
          </div>
        : <div className="w-[36px] shrink-0" />
      }

      {/* Complete button */}
      <button
        onClick={onComplete}
        disabled={completed}
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:cursor-default"
        style={{
          background: completed
            ? isPR ? 'rgba(245,194,0,0.15)' : 'rgba(52,211,153,0.12)'
            : 'var(--bg-elevated)',
          border: `1.5px solid ${completed ? (isPR ? '#F5C200' : 'var(--positive)') : 'var(--border-default)'}`,
          color: completed ? (isPR ? '#F5C200' : 'var(--positive)') : 'var(--fg-muted)',
          opacity: completed ? 1 : 1,
        }}>
        {isPR && completed ? <Trophy className="w-3.5 h-3.5" /> : <Check className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkoutOverview — scrollable exercise list with progress + bottom timer bar
// ─────────────────────────────────────────────────────────────────────────────

function WorkoutOverview({
  data, completedSets, elapsedSecs, isResting, restLeft, restTotal, accent,
  onExerciseSelect, onFinish, onAbandon, onSkipRest,
}: {
  data: TrackerData
  completedSets: Record<string, CompletedSet[]>
  elapsedSecs: number
  isResting: boolean
  restLeft: number
  restTotal: number
  accent: string
  onExerciseSelect: (idx: number) => void
  onFinish: () => void
  onAbandon: () => void
  onSkipRest: () => void
}) {
  const totalSets = data.exercises.reduce((acc, ex) => acc + ex.sets, 0)
  const doneSets = Object.values(completedSets).flat().filter(s => !s.isWarmup).length
  const allDone = doneSets >= totalSets
  const totalVolume = Object.values(completedSets).flat().reduce((acc, s) => {
    if (!s.isWarmup && s.weightKg && s.repsActual) return acc + s.weightKg * s.repsActual
    return acc
  }, 0)

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: 'var(--bg-base)' }}>

      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-safe pt-4 pb-3"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onAbandon}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}>
                {data.sessionType}
              </span>
              <span className="text-xl font-black tabular-nums" style={{ color: 'var(--fg-primary)' }}>{fmt(elapsedSecs)}</span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
              {doneSets}/{totalSets} serie{totalVolume > 0 ? ` · ${totalVolume.toLocaleString()}kg` : ''}
            </p>
          </div>
          <button
            onClick={onFinish}
            className="px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
            style={{ background: 'var(--positive)', color: 'white' }}>
            Fine
          </button>
        </div>

        {/* Global progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%`, background: accent }} />
        </div>
      </div>

      {/* ── Exercise list ── */}
      <div className="flex-1 overflow-y-auto py-3 px-4 space-y-2" style={{ paddingBottom: isResting ? 120 : 80 }}>
        {data.exercises.map((ex, idx) => {
          const done = (completedSets[ex.id] ?? []).filter(s => !s.isWarmup).length
          const isComplete = done >= ex.sets
          const isActive = !isComplete && data.exercises.slice(0, idx).every(e => {
            const d = (completedSets[e.id] ?? []).filter(s => !s.isWarmup).length
            return d >= e.sets
          })
          const allMedia = [ex.mediaUrl, ...ex.mediaUrls].filter(Boolean) as string[]
          const thumb = allMedia[0]

          return (
            <button
              key={ex.id}
              onClick={() => onExerciseSelect(idx)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all active:scale-98"
              style={{
                background: isActive
                  ? `color-mix(in srgb, ${accent} 6%, var(--bg-surface))`
                  : 'var(--bg-surface)',
                border: `1.5px solid ${isActive ? accent + '30' : isComplete ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}`,
              }}>

              {/* Thumbnail / placeholder */}
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)' }}>
                {thumb
                  ? <img src={thumb} alt={ex.name} className="w-full h-full object-cover" />
                  : <Dumbbell className="w-5 h-5" style={{ color: 'var(--fg-subtle)' }} />
                }
              </div>

              {/* Name + details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate leading-tight" style={{ color: 'var(--fg-primary)' }}>{ex.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  {ex.sets}×{ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}–${ex.repsMax}`}
                  {' '}· @RIR{ex.targetRir}
                </p>
              </div>

              {/* Completion badge */}
              <div className="shrink-0 flex items-center gap-1.5">
                {isComplete
                  ? <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(52,211,153,0.15)', border: '1.5px solid var(--positive)' }}>
                      <Check className="w-3.5 h-3.5" style={{ color: 'var(--positive)' }} />
                    </div>
                  : <div className="flex items-center gap-0.5">
                      {Array.from({ length: ex.sets }).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                          style={{ background: i < done ? accent : 'var(--bg-elevated)', border: `1px solid ${i < done ? accent : 'var(--border-default)'}` }} />
                      ))}
                    </div>
                }
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-1" style={{ color: accent }} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Bottom rest bar ── */}
      {isResting && (
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-safe pb-4 pt-3"
          style={{ background: 'linear-gradient(to top, var(--bg-base) 70%, transparent)', zIndex: 10 }}>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: `color-mix(in srgb, ${accent} 10%, var(--bg-elevated))`, border: `1px solid ${accent}30` }}>
            <Timer className="w-4 h-4 shrink-0" style={{ color: accent }} />
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>Recupero</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${restTotal > 0 ? (restLeft / restTotal) * 100 : 0}%`, background: accent }} />
                </div>
                <span className="text-base font-black tabular-nums shrink-0" style={{ color: 'var(--fg-primary)' }}>{fmt(restLeft)}</span>
              </div>
            </div>
            <button onClick={onSkipRest}
              className="px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
              style={{ background: accent, color: 'var(--accent-on)' }}>
              Salta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ExerciseDetail — full-screen exercise view with Hevy-style set table
// ─────────────────────────────────────────────────────────────────────────────

function ExerciseDetail({
  ex, exIdx, totalExercises, completedSets, tableInputs,
  isResting, restLeft, restTotal, accent, sessionType,
  onBack, onNext, onPrev, onChange, onCompleteSet, onSkipRest, onAdjustRest,
  onOpenCalc, onOpenAI, onOpenSkip,
}: {
  ex: ExerciseData
  exIdx: number
  totalExercises: number
  completedSets: CompletedSet[]
  tableInputs: Record<number, TableInput>
  isResting: boolean
  restLeft: number
  restTotal: number
  accent: string
  sessionType: string
  onBack: () => void
  onNext: () => void
  onPrev: () => void
  onChange: (setNum: number, field: keyof TableInput, val: string) => void
  onCompleteSet: (setNum: number, isWarmup: boolean) => void
  onSkipRest: () => void
  onAdjustRest: (delta: number) => void
  onOpenCalc: (setNum: number) => void
  onOpenAI: () => void
  onOpenSkip: () => void
}) {
  const [mediaExpanded, setMediaExpanded] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [showNotes, setShowNotes] = useState(false)

  const allImages = [ex.mediaUrl, ...ex.mediaUrls].filter(Boolean) as string[]
  const doneWorking = completedSets.filter(s => !s.isWarmup).length
  const doneWarmup = completedSets.filter(s => s.isWarmup).length
  const allDone = doneWorking >= ex.sets

  // Build set rows: warmup rows (already logged) + up to 1 new warmup slot + working sets
  const warmupRows = Array.from({ length: Math.max(doneWarmup, 0) }, (_, i) => i + 1)
  const workingRows = Array.from({ length: ex.sets }, (_, i) => i + 1)

  // PR detection: compare volume (kg × reps) against all previous sets
  const allPrevVolume = ex.previousSets
    .map(s => (s.weightKg ?? 0) * (s.repsActual ?? 0))
    .reduce((a, b) => Math.max(a, b), 0)
  const allPrevKg = ex.previousSets
    .map(s => s.weightKg ?? 0)
    .reduce((a, b) => Math.max(a, b), 0)

  const getCompletedSet = (setNum: number, isWarmup: boolean) =>
    completedSets.find(s => s.isWarmup === isWarmup && s.setNumber === (isWarmup ? setNum : setNum))

  const isPR = (setNum: number) => {
    const c = getCompletedSet(setNum, false)
    if (!c) return false
    const vol = (c.weightKg ?? 0) * (c.repsActual ?? 0)
    const heavier = (c.weightKg ?? 0) > allPrevKg
    return vol > allPrevVolume || heavier
  }

  const getPrevForSet = (setNum: number) => {
    return ex.previousSets.find(s => s.setNumber === setNum) ?? ex.previousSets[0] ?? null
  }

  const getInput = (setNum: number, isWarmup = false) => {
    const key = isWarmup ? -setNum : setNum
    return tableInputs[key] ?? { kg: '', reps: String(ex.repsMin), rir: String(ex.targetRir) }
  }

  // Next incomplete working set number (for "Fatto" button context)
  const nextIncompleteSet = workingRows.find(i => !getCompletedSet(i, false))

  return (
    <div className="flex flex-col h-[100dvh] select-none" style={{ background: 'var(--bg-base)' }}>

      {/* Rest overlay */}
      {isResting && (
        <RestOverlay restLeft={restLeft} restTotal={restTotal}
          onSkip={onSkipRest} onAdjust={onAdjustRest} accent={accent} />
      )}

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center px-2">
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: accent }}>
            {sessionType} · {exIdx + 1} / {totalExercises}
          </p>
          <h2 className="text-base font-black leading-tight line-clamp-1" style={{ color: 'var(--fg-primary)' }}>{ex.name}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onPrev} disabled={exIdx === 0}
            className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-25"
            style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onNext}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 100 }}>

        {/* Media section — collapsed by default */}
        {allImages.length > 0 && (
          <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setMediaExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5"
              style={{ background: 'var(--bg-surface)', color: 'var(--fg-muted)' }}>
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Dumbbell className="w-3 h-3" /> Tecnica
              </span>
              {mediaExpanded
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />}
            </button>
            {mediaExpanded && (
              <div className="relative" style={{ aspectRatio: '16/9', background: 'var(--bg-elevated)' }}>
                <img src={allImages[imgIdx]} alt={ex.name} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                {allImages.length > 1 && (
                  <>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {allImages.map((_, i) => (
                        <button key={i} onClick={() => setImgIdx(i)}
                          className="w-1.5 h-1.5 rounded-full transition-all"
                          style={{ background: i === imgIdx ? 'white' : 'rgba(255,255,255,0.4)', transform: i === imgIdx ? 'scale(1.4)' : 'scale(1)' }} />
                      ))}
                    </div>
                    <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setImgIdx(i => Math.min(allImages.length - 1, i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info strip */}
        <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { label: 'Serie', val: String(ex.sets) },
            { label: 'Reps', val: ex.repsMin === ex.repsMax ? String(ex.repsMin) : `${ex.repsMin}–${ex.repsMax}` },
            { label: 'RIR', val: `@${ex.targetRir}` },
            { label: 'Rest', val: `${ex.restSec}s` },
          ].map(({ label, val }) => (
            <div key={label} className="text-center shrink-0">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>{label}</p>
              <p className="text-base font-black mt-0.5" style={{ color: 'var(--fg-primary)' }}>{val}</p>
            </div>
          ))}
          {doneWorking > 0 && (
            <div className="text-center shrink-0 ml-2 pl-4" style={{ borderLeft: '1px solid var(--border-subtle)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Fatto</p>
              <p className="text-base font-black mt-0.5" style={{ color: accent }}>{doneWorking}/{ex.sets}</p>
            </div>
          )}
        </div>

        {/* Plan notes */}
        {ex.planNotes && (
          <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2.5"
            style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-400" />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-primary)' }}>{ex.planNotes}</p>
          </div>
        )}

        {/* ── Set Table ── */}
        <div className="px-3 pt-3">
          {/* Table header */}
          <div className="flex items-center gap-1.5 px-2 pb-2">
            <div className="w-8 shrink-0" />
            <div className="w-[68px] shrink-0 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-subtle)' }}>Prec.</span>
            </div>
            <div className="flex-1 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-subtle)' }}>Kg</span>
            </div>
            <div className="w-[44px] shrink-0 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-subtle)' }}>Rep</span>
            </div>
            <div className="w-[36px] shrink-0 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-subtle)' }}>RIR</span>
            </div>
            <div className="w-9 shrink-0" />
          </div>

          {/* Warmup row(s) */}
          {warmupRows.map(wNum => {
            const comp = getCompletedSet(wNum, true)
            const inputKey = -wNum
            const inp = tableInputs[inputKey] ?? { kg: '', reps: String(ex.repsMin), rir: '' }
            return (
              <SetTableRow
                key={`w${wNum}`}
                setLabel="W"
                prevKg={null}
                prevReps={null}
                isPrevBetter={false}
                input={inp}
                completed={!!comp}
                completedData={comp}
                isPR={false}
                accent={accent}
                onChange={(field, val) => onChange(-wNum, field, val)}
                onComplete={() => onCompleteSet(-wNum, true)}
                onLongPressKg={() => onOpenCalc(-wNum)}
              />
            )
          })}

          {/* Add warmup button if no warmup logged yet */}
          {warmupRows.length === 0 && (
            <button
              onClick={() => onCompleteSet(-1, true)}
              className="flex items-center gap-2 px-3 py-2 mb-1 rounded-xl text-xs font-bold transition-all"
              style={{ color: 'var(--fg-muted)', border: '1px dashed var(--border-subtle)' }}>
              <Plus className="w-3.5 h-3.5" /> Aggiungi riscaldamento
            </button>
          )}

          {/* Working set rows */}
          {workingRows.map(setNum => {
            const comp = getCompletedSet(setNum, false)
            const prev = getPrevForSet(setNum)
            const inp = getInput(setNum)
            const prevBetter = prev?.weightKg != null && prev?.repsActual != null
            const prDetected = isPR(setNum)
            return (
              <SetTableRow
                key={`s${setNum}`}
                setLabel={String(setNum)}
                prevKg={prev?.weightKg ?? null}
                prevReps={prev?.repsActual ?? null}
                isPrevBetter={prevBetter}
                input={inp}
                completed={!!comp}
                completedData={comp}
                isPR={prDetected}
                accent={accent}
                onChange={(field, val) => onChange(setNum, field, val)}
                onComplete={() => onCompleteSet(setNum, false)}
                onLongPressKg={() => onOpenCalc(setNum)}
              />
            )
          })}
        </div>

        {/* Tip / description */}
        {(ex.description || ex.tips) && (
          <div className="mx-4 mt-3">
            <button onClick={() => setShowNotes(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}>
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left">Note tecniche</span>
              {showNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showNotes && (
              <div className="mt-1 px-3 py-3 rounded-xl text-xs leading-relaxed space-y-2"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}>
                {ex.description && <p>{ex.description}</p>}
                {ex.tips && <p className="font-medium" style={{ color: 'var(--positive)' }}>💡 {ex.tips}</p>}
              </div>
            )}
          </div>
        )}

        {/* AI + skip actions */}
        <div className="flex gap-2 px-4 mt-3">
          <button onClick={onOpenAI}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>
            <Bot className="w-3.5 h-3.5" style={{ color: accent }} /> Coach AI
          </button>
          <button onClick={onOpenSkip}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>
            <SkipForward className="w-3.5 h-3.5" /> Salta / cambia
          </button>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="shrink-0 px-4 pb-safe pb-4 pt-3"
        style={{
          background: 'linear-gradient(to top, var(--bg-base) 70%, transparent)',
          position: 'absolute', bottom: 0, left: 0, right: 0,
        }}>
        {allDone
          ? <button onClick={onNext}
              className="w-full py-5 rounded-3xl font-black text-[17px] transition-all active:scale-97 duration-150"
              style={{
                background: `linear-gradient(135deg, var(--positive), #15803d)`,
                color: 'white',
                boxShadow: '0 10px 30px rgba(34,197,94,0.3)',
              }}>
              → Prossimo esercizio
            </button>
          : nextIncompleteSet
            ? <button
                onClick={() => onCompleteSet(nextIncompleteSet, false)}
                className="w-full py-5 rounded-3xl font-black text-[17px] transition-all active:scale-97 duration-150"
                style={{
                  background: accent,
                  color: 'var(--accent-on)',
                  boxShadow: `0 10px 30px color-mix(in srgb, ${accent} 40%, transparent)`,
                }}>
                ✓ Completa serie {nextIncompleteSet}
              </button>
            : null
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ActiveTracker({ data }: { data: TrackerData }) {
  const router = useRouter()

  // Screen state
  const [screen, setScreen] = useState<Screen>('overview')
  const [activeExIdx, setActiveExIdx] = useState(data.currentExerciseIdx)

  // Completed sets (server-synced)
  const [completedSets, setCompletedSets] = useState<Record<string, CompletedSet[]>>(
    Object.fromEntries(data.exercises.map(ex => [ex.id, ex.completedSets]))
  )

  // Table inputs: exId → setNum → {kg, reps, rir}
  // setNum > 0 = working set, setNum < 0 = warmup (stored as negative key)
  const [tableInputs, setTableInputs] = useState<Record<string, Record<number, TableInput>>>(() => {
    const init: Record<string, Record<number, TableInput>> = {}
    data.exercises.forEach(ex => {
      init[ex.id] = {}
      for (let i = 1; i <= ex.sets; i++) {
        const prev = ex.previousSets.find(s => s.setNumber === i) ?? ex.previousSets[0] ?? null
        init[ex.id][i] = {
          kg: prev?.weightKg?.toString() ?? '',
          reps: prev?.repsActual?.toString() ?? String(ex.repsMin),
          rir: String(ex.targetRir),
        }
      }
    })
    return init
  })

  // Rest timer
  const [isResting, setIsResting] = useState(false)
  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(120)
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed timer
  const [elapsedSecs, setElapsedSecs] = useState(() => elapsed(data.startedAt))
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Modals
  const [calcOpen, setCalcOpen] = useState(false)
  const [calcTargetSetNum, setCalcTargetSetNum] = useState<number>(1)
  const [showAI, setShowAI] = useState(false)
  const [showSkipSheet, setShowSkipSheet] = useState(false)

  // Finish flow
  const [showFinish, setShowFinish] = useState(false)
  const [rpeInput, setRpeInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)

  const ex = data.exercises[activeExIdx]

  // Elapsed tick
  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsedSecs(elapsed(data.startedAt)), 1000)
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [data.startedAt])

  // Start rest
  const startRest = useCallback((secs: number) => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    setRestTotal(secs); setRestLeft(secs); setIsResting(true)
    restTimerRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) { clearInterval(restTimerRef.current!); setIsResting(false); beep(880, 0.4); return 0 }
        if (prev === 6) beep(660, 0.2)
        return prev - 1
      })
    }, 1000)
  }, [])

  const skipRest = useCallback(() => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    setIsResting(false); setRestLeft(0)
  }, [])

  const adjustRest = (delta: number) => {
    setRestLeft(prev => Math.max(0, prev + delta))
    setRestTotal(prev => Math.max(1, prev + delta))
  }

  // Handle input change per exercise, per set
  const handleInputChange = (exId: string, setNum: number, field: keyof TableInput, val: string) => {
    setTableInputs(prev => ({
      ...prev,
      [exId]: { ...(prev[exId] ?? {}), [setNum]: { ...(prev[exId]?.[setNum] ?? { kg: '', reps: '', rir: '' }), [field]: val } }
    }))
  }

  // Complete a set
  const handleCompleteSet = useCallback((exId: string, setNum: number, isWarmup: boolean, restSec: number) => {
    const inputs = tableInputs[exId]?.[isWarmup ? -Math.abs(setNum) : setNum] ?? { kg: '', reps: '', rir: '' }
    const actualSetNum = isWarmup
      ? ((completedSets[exId] ?? []).filter(s => s.isWarmup).length + 1)
      : Math.abs(setNum)

    const newSet: CompletedSet = {
      setNumber: actualSetNum,
      weightKg: inputs.kg ? parseFloat(inputs.kg) : null,
      repsActual: inputs.reps ? parseInt(inputs.reps) : null,
      rirActual: inputs.rir ? parseInt(inputs.rir) : null,
      isWarmup,
    }

    setCompletedSets(prev => ({ ...prev, [exId]: [...(prev[exId] ?? []), newSet] }))
    logSet({
      activeSessionId: data.activeSessionId,
      exerciseId: exId,
      setNumber: newSet.setNumber,
      weightKg: newSet.weightKg,
      repsActual: newSet.repsActual,
      rirActual: newSet.rirActual,
      isWarmup: newSet.isWarmup,
      feelingScore: isWarmup ? null : 3,
    })

    // Pre-fill next working set with same values
    if (!isWarmup) {
      const nextSetNum = newSet.setNumber + 1
      setTableInputs(prev => ({
        ...prev,
        [exId]: {
          ...(prev[exId] ?? {}),
          [nextSetNum]: {
            kg: inputs.kg,
            reps: inputs.reps,
            rir: inputs.rir,
          }
        }
      }))
      startRest(restSec)
    }
  }, [tableInputs, completedSets, data.activeSessionId, startRest])

  const handleNextExercise = useCallback(() => {
    const nextIdx = activeExIdx + 1
    advanceExercise(data.activeSessionId, nextIdx)
    if (nextIdx >= data.exercises.length) {
      setShowFinish(true)
    } else {
      setActiveExIdx(nextIdx)
      setScreen('overview')
      skipRest()
    }
  }, [activeExIdx, data.activeSessionId, data.exercises.length, skipRest])

  const handlePrevExercise = useCallback(() => {
    if (activeExIdx > 0) { setActiveExIdx(activeExIdx - 1); skipRest() }
  }, [activeExIdx, skipRest])

  const handleExerciseSelect = (idx: number) => {
    setActiveExIdx(idx)
    setScreen('exercise')
  }

  const handleFinish = useCallback(async () => {
    setSaving(true)
    const res = await finishSession({
      activeSessionId: data.activeSessionId,
      rpe: rpeInput ? parseInt(rpeInput) : null,
      notes: notesInput || null,
    })
    setSaving(false)
    if ('success' in res && res.success) router.push('/training')
  }, [data.activeSessionId, rpeInput, notesInput, router])

  const handleAbandon = useCallback(async () => {
    if (!confirm('Sei sicuro di voler abbandonare la sessione?')) return
    await abandonSession(data.activeSessionId)
    router.push('/training')
  }, [data.activeSessionId, router])

  const sessionColors: Record<string, string> = {
    A: 'var(--positive)', B: 'var(--accent)', C: 'var(--accent2)', D: 'var(--warning)',
    V1: 'var(--negative)', V2: 'var(--fg-muted)',
  }
  const accent = sessionColors[data.sessionType] ?? 'var(--accent)'

  // ── Finish screen ──────────────────────────────────────────────────────────
  if (showFinish) {
    const allPrimary = Array.from(new Set(data.exercises.flatMap(e => e.primaryMuscles))) as District[]
    const allSecondary = Array.from(new Set(
      data.exercises.flatMap(e => e.secondaryMuscles).filter(m => !allPrimary.includes(m))
    )) as District[]
    const totalVolume = Object.values(completedSets).flat().reduce((acc, s) => {
      if (!s.isWarmup && s.weightKg && s.repsActual) return acc + s.weightKg * s.repsActual
      return acc
    }, 0)

    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center p-6 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, border: `2px solid ${accent}` }}>
              <Flag className="w-10 h-10" style={{ color: accent }} />
            </div>
            <h2 className="text-3xl font-black mb-1" style={{ color: 'var(--fg-primary)' }}>Sessione completata!</h2>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>{fmt(elapsedSecs)} · Volume: {totalVolume.toLocaleString()} kg</p>
          </div>
          {(allPrimary.length > 0 || allSecondary.length > 0) && (
            <div className="rounded-2xl p-4 flex flex-col items-center gap-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Muscoli allenati</p>
              <MuscleHeatmap size="full" showLabels={true} primaryMuscles={allPrimary} secondaryMuscles={allSecondary} />
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-wider block mb-2" style={{ color: 'var(--fg-muted)' }}>RPE sessione (6-10)</label>
              <div className="flex gap-2">
                {[6, 7, 8, 9, 10].map(v => (
                  <button key={v} onClick={() => setRpeInput(String(v))}
                    className="flex-1 py-3 rounded-xl font-black text-sm transition-all active:scale-95"
                    style={{
                      background: rpeInput === String(v) ? accent : 'var(--bg-elevated)',
                      color: rpeInput === String(v) ? 'var(--accent-on)' : 'var(--fg-muted)',
                      border: `1px solid ${rpeInput === String(v) ? accent : 'var(--border-subtle)'}`,
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)}
              placeholder="Note (tensione, sensazioni, pesi ottimali…)" rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }} />
          </div>
          <button onClick={handleFinish} disabled={saving}
            className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-60"
            style={{ background: accent, color: 'var(--accent-on)', boxShadow: `0 8px 24px color-mix(in srgb, ${accent} 35%, transparent)` }}>
            {saving ? 'Salvando…' : 'Salva e concludi'}
          </button>
        </div>
      </div>
    )
  }

  // ── Modals ─────────────────────────────────────────────────────────────────
  const calcInitialWeight = ex ? (tableInputs[ex.id]?.[calcTargetSetNum]?.kg
    ? parseFloat(tableInputs[ex.id][calcTargetSetNum].kg) : 20) : 20

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      {/* Plate Calculator */}
      <PlateCalculator
        isOpen={calcOpen} onClose={() => setCalcOpen(false)}
        initialWeight={calcInitialWeight}
        onApply={w => {
          if (ex) handleInputChange(ex.id, calcTargetSetNum, 'kg', w.toString())
        }}
      />

      {/* AI Coach */}
      {ex && (
        <AICoachDrawer
          isOpen={showAI} onClose={() => setShowAI(false)}
          exercise={ex}
          currentSet={(completedSets[ex.id] ?? []).filter(s => !s.isWarmup).length + 1}
        />
      )}

      {/* Skip sheet */}
      {ex && (
        <ExerciseSkipSheet
          isOpen={showSkipSheet} onClose={() => setShowSkipSheet(false)}
          exercise={ex} onSkip={handleNextExercise} onSwapSuggested={() => handleNextExercise()}
        />
      )}

      {/* ── Overview screen ── */}
      {screen === 'overview' && (
        <WorkoutOverview
          data={data}
          completedSets={completedSets}
          elapsedSecs={elapsedSecs}
          isResting={isResting}
          restLeft={restLeft}
          restTotal={restTotal}
          accent={accent}
          onExerciseSelect={handleExerciseSelect}
          onFinish={() => setShowFinish(true)}
          onAbandon={handleAbandon}
          onSkipRest={skipRest}
        />
      )}

      {/* ── Exercise detail screen ── */}
      {screen === 'exercise' && ex && (
        <ExerciseDetail
          ex={ex}
          exIdx={activeExIdx}
          totalExercises={data.exercises.length}
          completedSets={completedSets[ex.id] ?? []}
          tableInputs={tableInputs[ex.id] ?? {}}
          isResting={isResting}
          restLeft={restLeft}
          restTotal={restTotal}
          accent={accent}
          sessionType={data.sessionType}
          onBack={() => setScreen('overview')}
          onNext={handleNextExercise}
          onPrev={handlePrevExercise}
          onChange={(setNum, field, val) => handleInputChange(ex.id, setNum, field, val)}
          onCompleteSet={(setNum, isWarmup) => handleCompleteSet(ex.id, setNum, isWarmup, ex.restSec)}
          onSkipRest={skipRest}
          onAdjustRest={adjustRest}
          onOpenCalc={(setNum) => { setCalcTargetSetNum(setNum); setCalcOpen(true) }}
          onOpenAI={() => setShowAI(true)}
          onOpenSkip={() => setShowSkipSheet(true)}
        />
      )}
    </div>
  )
}

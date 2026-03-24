'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Check, Timer, Zap,
  X, SkipForward, Plus, Minus, Flag, AlertTriangle,
  Layers, FastForward, Bot, Camera, Send, RefreshCw,
  ChevronDown, ChevronUp, Play, Pause, RotateCcw,
  ImageOff, Dumbbell, Info,
} from 'lucide-react'
import { logSet, advanceExercise, finishSession, abandonSession } from '@/app/actions/active-session'
import { askWorkoutAI, suggestExerciseAlternative, WorkoutAIMessage } from '@/app/actions/workout-ai'
import { District } from '@prisma/client'
import MuscleHeatmap from '@/app/components/MuscleHeatmap'

// ── Types ────────────────────────────────────────────────────────────────────

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
  // Media & definition
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

// ── Utils ────────────────────────────────────────────────────────────────────

function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function elapsed(startedAt: string) {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}

// ── Plate Calculator ────────────────────────────────────────────────────────

function PlateCalculator({
  isOpen, onClose, onApply, initialWeight,
}: {
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
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--fg-primary)' }}>
            <Layers className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Calcolatore Dischi
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--fg-muted)' }}><X className="w-5 h-5" /></button>
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
        <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-center mb-3" style={{ color: 'var(--fg-muted)' }}>Per ogni lato</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {platesNeeded.length === 0
              ? <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>Solo bilanciere ({barbellWeight}kg)</span>
              : platesNeeded.map((p, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="flex items-end justify-center gap-0.5" style={{ height: '80px' }}>
                    {Array.from({ length: p.count }).map((_, i) => (
                      <div key={i} className="w-3 rounded-sm"
                        style={{ background: 'var(--accent)', height: `${Math.max(20, p.weight * 3)}px`, border: '1px solid rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  <span className="text-xs font-bold mt-1" style={{ color: 'var(--fg-primary)' }}>{p.weight}</span>
                  <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>×{p.count}</span>
                </div>
              ))}
          </div>
        </div>
        <button onClick={() => { onApply(targetWeight); onClose() }}
          className="w-full py-4 rounded-2xl font-black text-lg text-white transition-transform active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>
          Usa questo peso
        </button>
      </div>
    </>
  )
}

// ── Swipeable Row ─────────────────────────────────────────────────────────────

function SwipeableRow({ children, onSwipe, disabled, accent }: {
  children: React.ReactNode; onSwipe: () => void; disabled: boolean; accent: string
}) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const SWIPE_THRESHOLD = 120

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    startXRef.current = e.clientX
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const diff = e.clientX - startXRef.current
    if (diff > 0 && diff <= SWIPE_THRESHOLD + 20) setTranslateX(diff)
  }
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    if (translateX >= SWIPE_THRESHOLD) onSwipe()
    setTranslateX(0)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 left-0 flex items-center pl-6 z-0"
        style={{ width: `${Math.max(0, translateX)}px`, background: `${accent}30` }}>
        <Check className="w-5 h-5 text-white" />
      </div>
      <div className="relative z-10 touch-none"
        style={{ transform: `translateX(${translateX}px)`, transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
        {children}
      </div>
    </div>
  )
}

// ── AI Coach Drawer ─────────────────────────────────────────────────────────

function AICoachDrawer({
  isOpen, onClose, exercise, currentSet,
}: {
  isOpen: boolean
  onClose: () => void
  exercise: ExerciseData
  currentSet: number
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
        content: `Ciao! Sono il tuo coach AI 💪 Stai eseguendo **${exercise.name}** — ${exercise.sets}×${exercise.repsMin}-${exercise.repsMax} @RIR${exercise.targetRir}.${prevBest ? ` Ultimo carico registrato: ${prevBest.weightKg}kg×${prevBest.repsActual}.` : ''} Hai domande sulla tecnica, il carico o vuoi un esercizio alternativo?`,
      }])
    }
  }, [isOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (text?: string, img?: string | null) => {
    const msgText = text ?? input.trim()
    if (!msgText && !img) return

    const userMsg: WorkoutAIMessage = { role: 'user', content: msgText || '📷 Analizza la mia tecnica' }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setPendingImage(null)
    setLoading(true)

    const { reply, error } = await askWorkoutAI(newMessages, {
      exerciseName: exercise.name,
      currentSet,
      totalSets: exercise.sets,
      repsMin: exercise.repsMin,
      repsMax: exercise.repsMax,
      targetRir: exercise.targetRir,
      restSec: exercise.restSec,
      lastWeight: exercise.previousSets[0]?.weightKg,
      lastReps: exercise.previousSets[0]?.repsActual,
    }, img ?? null)

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: error ? `❌ ${error}` : reply,
    }])
    setLoading(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const base64 = ev.target?.result as string
      setPendingImage(base64)
    }
    reader.readAsDataURL(file)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[2rem] overflow-hidden animate-in slide-in-from-bottom-4"
        style={{
          height: '80dvh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
        }}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>
              <Bot className="w-4 h-4 text-white" />
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={m.role === 'user'
                  ? { background: 'var(--accent)', color: 'white', borderBottomRightRadius: '6px' }
                  : { background: 'var(--bg-elevated)', color: 'var(--fg-primary)', border: '1px solid var(--border-subtle)', borderBottomLeftRadius: '6px' }
                }>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                Sto elaborando…
              </div>
            </div>
          )}
          {/* Pending image preview */}
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

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {['Alternativa più facile?', 'Corretto il carico?', 'Tecnica corretta?', 'Variante a casa?'].map(q => (
              <button key={q} onClick={() => handleSend(q)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--fg-muted)',
                }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="shrink-0 px-4 pb-6 pt-3 flex items-end gap-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {/* Camera button */}
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleImageUpload} />
          <button onClick={() => fileRef.current?.click()}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{ background: pendingImage ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: pendingImage ? 'white' : 'var(--fg-muted)' }}>
            <Camera className="w-5 h-5" />
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Chiedi al tuo coach..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--fg-primary)',
              maxHeight: '100px',
            }}
          />
          <button
            onClick={() => pendingImage ? handleSend(input || undefined, pendingImage) : handleSend()}
            disabled={loading || (!input.trim() && !pendingImage)}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white transition-all disabled:opacity-40 active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}

// ── Skip / Swap Sheet ────────────────────────────────────────────────────────

function ExerciseSkipSheet({
  isOpen, onClose, exercise, onSkip, onSwapSuggested,
}: {
  isOpen: boolean
  onClose: () => void
  exercise: ExerciseData
  onSkip: () => void
  onSwapSuggested: (name: string) => void
}) {
  const [reason, setReason] = useState('')
  const [loadingAlt, setLoadingAlt] = useState(false)
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [explanation, setExplanation] = useState('')

  const handleGetAlternatives = async () => {
    setLoadingAlt(true)
    setAlternatives([])
    const { alternatives: alts, explanation: expl } = await suggestExerciseAlternative(exercise.name, reason)
    setAlternatives(alts)
    setExplanation(expl)
    setLoadingAlt(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] p-6 space-y-5 animate-in slide-in-from-bottom-4"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
          maxHeight: '85dvh',
          overflowY: 'auto',
        }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black" style={{ color: 'var(--fg-primary)' }}>
              {exercise.name}
            </h3>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--fg-muted)' }}>
              Cosa vuoi fare con questo esercizio?
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason input */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--fg-muted)' }}>
            Perché non va? (opzionale)
          </p>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="es. macchinario occupato, dolore spalla, non ho attrezzatura..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--fg-primary)',
            }}
          />
        </div>

        {/* AI alternatives */}
        <button onClick={handleGetAlternatives} disabled={loadingAlt}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>
          {loadingAlt
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Cerco alternative…</>
            : <><Bot className="w-4 h-4" /> Chiedi all&apos;AI una sostituzione</>}
        </button>

        {/* Alternatives list */}
        {alternatives.length > 0 && (
          <div className="space-y-3">
            {explanation && (
              <p className="text-xs leading-relaxed px-1" style={{ color: 'var(--fg-muted)' }}>{explanation}</p>
            )}
            {alternatives.map((alt, i) => (
              <button key={i} onClick={() => { onSwapSuggested(alt); onClose() }}
                className="w-full px-4 py-3.5 rounded-2xl text-left font-bold text-sm flex items-center gap-3 transition-all active:scale-95"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--fg-primary)',
                }}>
                <span className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>{i + 1}</span>
                {alt}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>oppure</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>

        {/* Skip button */}
        <button onClick={() => { onSkip(); onClose() }}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--negative)',
            color: 'var(--negative)',
          }}>
          <SkipForward className="w-4 h-4" />
          Salta esercizio
        </button>
      </div>
    </>
  )
}

// ── Stopwatch Widget ─────────────────────────────────────────────────────────

function StopwatchWidget({ accent }: { accent: string }) {
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch')
  const [secs, setSecs] = useState(0)
  const [running, setRunning] = useState(false)
  const [timerDuration, setTimerDuration] = useState(60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const start = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setSecs(prev => {
        if (mode === 'timer' && prev >= timerDuration) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          // Beep
          try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.frequency.value = 660; osc.type = 'sine'
            gain.gain.setValueAtTime(0.4, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
            osc.start(); osc.stop(ctx.currentTime + 0.6)
          } catch {}
          return prev
        }
        return mode === 'stopwatch' ? prev + 1 : prev + 1
      })
    }, 1000)
  }

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setSecs(0)
  }

  const displaySecs = mode === 'timer' ? Math.max(0, timerDuration - secs) : secs
  const progress = mode === 'timer' ? secs / timerDuration : 0
  const timerFinished = mode === 'timer' && secs >= timerDuration

  return (
    <div className="rounded-2xl p-3 flex items-center gap-3"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${timerFinished ? '#EF4444' : 'var(--border-subtle)'}`,
        boxShadow: timerFinished ? '0 0 20px rgba(239,68,68,0.3)' : 'none',
      }}>
      {/* Mode toggle */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => { reset(); setMode(m => m === 'stopwatch' ? 'timer' : 'stopwatch') }}
          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--fg-muted)',
            border: '1px solid var(--border-subtle)',
          }}>
          {mode === 'stopwatch' ? '⏱ SW' : '⏳ TM'}
        </button>
      </div>

      {/* Timer display */}
      <div className="flex-1 flex items-center gap-2">
        {mode === 'timer' && (
          <div className="relative w-10 h-10 shrink-0">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                stroke={timerFinished ? '#EF4444' : accent}
                strokeDasharray={`${progress * 100} 100`}
                strokeDashoffset="0" strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.9s linear' }} />
            </svg>
          </div>
        )}
        <span className={`font-black tabular-nums text-xl ${timerFinished ? 'animate-pulse' : ''}`}
          style={{ color: timerFinished ? '#EF4444' : 'var(--fg-primary)' }}>
          {fmt(displaySecs)}
        </span>
        {mode === 'timer' && !running && secs === 0 && (
          <div className="flex items-center gap-1 ml-1">
            <button onClick={() => setTimerDuration(t => Math.max(5, t - 15))}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
              style={{ background: 'var(--bg-surface)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
              -15
            </button>
            <button onClick={() => setTimerDuration(t => t + 15)}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
              style={{ background: 'var(--bg-surface)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
              +15
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={reset} className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-surface)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={running ? pause : start}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
          style={{ background: running ? 'var(--negative)' : accent }}>
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
        </button>
      </div>
    </div>
  )
}

// ── Exercise Media ────────────────────────────────────────────────────────────

function ExerciseMedia({ exercise }: { exercise: ExerciseData }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const allImages = [exercise.mediaUrl, ...exercise.mediaUrls].filter(Boolean) as string[]

  if (allImages.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
      {/* Toggle header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5"
        style={{ background: 'var(--bg-elevated)' }}>
        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
          style={{ color: 'var(--fg-muted)' }}>
          <Dumbbell className="w-3 h-3" /> Tecnica
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--fg-muted)' }} />
          : <ChevronUp className="w-4 h-4" style={{ color: 'var(--fg-muted)' }} />}
      </button>
      {!collapsed && (
        <div className="relative" style={{ aspectRatio: '16/9', background: 'var(--bg-base)' }}>
          <img
            src={allImages[imgIdx]}
            alt={exercise.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
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
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ActiveTracker({ data }: { data: TrackerData }) {
  const router = useRouter()

  const [exIdx, setExIdx] = useState(data.currentExerciseIdx)
  const [completedSets, setCompletedSets] = useState<Record<string, CompletedSet[]>>(
    Object.fromEntries(data.exercises.map(ex => [ex.id, ex.completedSets]))
  )
  const [isResting, setIsResting] = useState(false)
  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(120)

  // Options
  const [quickMode, setQuickMode] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showSkipSheet, setShowSkipSheet] = useState(false)

  // Inputs
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRir] = useState('')
  const [isWarmup, setIsWarmup] = useState(false)
  const [feeling, setFeeling] = useState<number>(3)

  // Sessione
  const [showFinish, setShowFinish] = useState(false)
  const [rpeInput, setRpeInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [elapsedSecs, setElapsedSecs] = useState(elapsed(data.startedAt))

  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const ex = data.exercises[exIdx]
  const done = completedSets[ex?.id ?? ''] ?? []
  const currentSetNum = done.filter(s => !s.isWarmup).length + 1
  const totalDone = done.filter(s => !s.isWarmup).length
  const allExDone = exIdx >= data.exercises.length

  const totalVolume = Object.values(completedSets).flat().reduce((acc, set) => {
    if (!set.isWarmup && set.weightKg && set.repsActual) return acc + set.weightKg * set.repsActual
    return acc
  }, 0)

  // Elapsed timer
  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsedSecs(elapsed(data.startedAt)), 1000)
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [data.startedAt])

  // Pre-fill from previous
  useEffect(() => {
    if (!ex) return
    const prevSet = ex.previousSets.find(s => s.setNumber === currentSetNum) ?? ex.previousSets[0]
    if (prevSet && weight === '' && reps === '') {
      setWeight(prevSet.weightKg?.toString() ?? '')
      setReps(prevSet.repsActual?.toString() ?? String(ex.repsMin))
    } else if (weight === '' && reps === '') {
      setWeight('')
      setReps(String(ex.repsMin))
    }
    if (rir === '') setRir(String(ex.targetRir))
    setIsWarmup(false)
  }, [exIdx, currentSetNum])

  // Rest timer
  const startRest = useCallback((secs: number) => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    setRestTotal(secs); setRestLeft(secs); setIsResting(true)
    restTimerRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current!)
          setIsResting(false)
          try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.frequency.value = 880; osc.type = 'sine'
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
            osc.start(); osc.stop(ctx.currentTime + 0.4)
          } catch {}
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const skipRest = useCallback(() => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    setIsResting(false); setRestLeft(0)
  }, [])

  const adjustRest = (s: number) => {
    setRestLeft(prev => Math.max(0, prev + s))
    setRestTotal(prev => Math.max(1, prev + s))
  }

  // Completa serie
  const handleCompleteSet = useCallback(async () => {
    if (!ex) return
    const setNum = isWarmup
      ? -(done.filter(s => s.isWarmup).length + 1)
      : totalDone + 1

    const newSet: CompletedSet = {
      setNumber: setNum > 0 ? setNum : done.filter(s => s.isWarmup).length + 1,
      weightKg: weight ? parseFloat(weight) : null,
      repsActual: reps ? parseInt(reps) : null,
      rirActual: quickMode || !rir ? null : parseInt(rir),
      isWarmup,
    }

    setCompletedSets(prev => ({ ...prev, [ex.id]: [...(prev[ex.id] ?? []), newSet] }))
    logSet({
      activeSessionId: data.activeSessionId,
      exerciseId: ex.id,
      setNumber: newSet.setNumber,
      weightKg: newSet.weightKg,
      repsActual: newSet.repsActual,
      rirActual: newSet.rirActual,
      isWarmup: newSet.isWarmup,
      feelingScore: isWarmup ? null : feeling,
    })
    if (!isWarmup) startRest(ex.restSec)
    setReps(''); setIsWarmup(false); setFeeling(3)
  }, [ex, done, totalDone, weight, reps, rir, isWarmup, feeling, quickMode, data.activeSessionId, startRest])

  const fillFromPrevious = () => {
    const prevSet = ex.previousSets.find(s => s.setNumber === currentSetNum) ?? ex.previousSets[0]
    if (prevSet) {
      if (prevSet.weightKg) setWeight(prevSet.weightKg.toString())
      if (prevSet.repsActual) setReps(prevSet.repsActual.toString())
    }
  }

  const handleNextExercise = useCallback(async () => {
    const nextIdx = exIdx + 1
    advanceExercise(data.activeSessionId, nextIdx)
    setExIdx(nextIdx); skipRest(); setWeight(''); setReps('')
  }, [exIdx, data.activeSessionId, skipRest])

  const handlePrevExercise = useCallback(() => {
    if (exIdx > 0) { setExIdx(exIdx - 1); skipRest(); setWeight(''); setReps('') }
  }, [exIdx, skipRest])

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

  if (allExDone && !showFinish) setShowFinish(true)
  if (!ex && !showFinish) return <div style={{ color: 'var(--fg-primary)', padding: 24 }}>Nessun esercizio trovato.</div>

  const sessionColors: Record<string, string> = {
    A: 'var(--positive)', B: 'var(--accent)', C: 'var(--accent2)', D: 'var(--warning)',
    V1: 'var(--negative)', V2: 'var(--fg-muted)',
  }
  const accent = sessionColors[data.sessionType] ?? 'var(--accent)'
  const prevBest = ex?.previousSets.find(s => s.setNumber === totalDone + 1) ?? ex?.previousSets[0]

  // ─ Fine sessione ─
  if (showFinish) {
    // Aggrega tutti i muscoli allenati durante la sessione
    const allPrimary = Array.from(new Set(data.exercises.flatMap(e => e.primaryMuscles))) as District[]
    const allSecondary = Array.from(new Set(
      data.exercises.flatMap(e => e.secondaryMuscles).filter(m => !allPrimary.includes(m))
    )) as District[]

    return (
      <div className="flex flex-col h-full items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${accent}20`, border: `2px solid ${accent}` }}>
              <Flag className="w-10 h-10 animate-bounce" style={{ color: accent }} />
            </div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--fg-primary)' }}>Sessione completata!</h2>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              {fmt(elapsedSecs)} · Vol: {totalVolume.toLocaleString()} kg
            </p>
          </div>

          {/* Muscle heatmap post-workout */}
          {(allPrimary.length > 0 || allSecondary.length > 0) && (
            <div className="rounded-2xl p-4 flex flex-col items-center gap-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
                Muscoli allenati
              </p>
              <MuscleHeatmap
                size="full"
                showLabels={true}
                primaryMuscles={allPrimary}
                secondaryMuscles={allSecondary}
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider block mb-1.5" style={{ color: 'var(--fg-muted)' }}>RPE (6–10)</label>
            <div className="flex gap-2">
              {[6, 7, 8, 9, 10].map(v => (
                <button key={v} onClick={() => setRpeInput(String(v))}
                  className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all"
                  style={{
                    background: rpeInput === String(v) ? accent : 'var(--bg-elevated)',
                    color: rpeInput === String(v) ? 'white' : 'var(--fg-muted)',
                    border: `1px solid ${rpeInput === String(v) ? accent : 'var(--border-subtle)'}`,
                  }}>
                  {v}
                </button>
              ))}
            </div>
            <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)}
              placeholder="Note (tensione, sensazioni, pesi…)" rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)', outline: 'none' }} />
          </div>
          <button onClick={handleFinish} disabled={saving}
            className="w-full py-3.5 rounded-2xl font-black text-base text-white transition-all active:scale-95"
            style={{ background: accent, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvataggio…' : 'Salva e concludi'}
          </button>
        </div>
      </div>
    )
  }

  // ─ Tracker principale ─
  return (
    <div className="flex flex-col h-[100dvh] select-none overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      <PlateCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)}
        initialWeight={parseFloat(weight) || 20} onApply={w => setWeight(w.toString())} />

      <AICoachDrawer isOpen={showAI} onClose={() => setShowAI(false)}
        exercise={ex} currentSet={currentSetNum} />

      <ExerciseSkipSheet
        isOpen={showSkipSheet} onClose={() => setShowSkipSheet(false)}
        exercise={ex}
        onSkip={handleNextExercise}
        onSwapSuggested={name => {
          // Just advance to next for now — swap requires a server action
          handleNextExercise()
        }}
      />

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <button onClick={handleAbandon} className="p-2 rounded-xl"
          style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-lg font-black tabular-nums tracking-wider" style={{ color: 'var(--fg-primary)' }}>
            {fmt(elapsedSecs)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: accent }}>
            <Zap className="w-2.5 h-2.5" /> {totalVolume.toLocaleString()} kg
          </span>
        </div>
        <button onClick={() => setShowFinish(true)}
          className="px-4 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95"
          style={{ background: 'var(--positive)', boxShadow: '0 0 16px rgba(16,185,129,0.35)' }}>
          Fine
        </button>
      </div>

      {/* Quick Mode + AI button */}
      <div className="shrink-0 flex justify-between items-center px-4 py-2"
        style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <FastForward className={`w-4 h-4`} style={{ color: quickMode ? 'var(--warning)' : 'var(--fg-muted)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--fg-primary)' }}>Modalità Rapida</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white',
              boxShadow: '0 2px 10px color-mix(in srgb, var(--accent) 40%, transparent)',
            }}>
            <Bot className="w-3.5 h-3.5" /> Coach AI
          </button>
          <button onClick={() => setQuickMode(!quickMode)}
            className={`w-10 h-6 rounded-full p-1 transition-colors`}
            style={{ background: quickMode ? 'var(--warning)' : 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${quickMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Exercise progress dots */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-2" style={{ background: 'var(--bg-base)' }}>
        {data.exercises.map((e, i) => {
          const d = (completedSets[e.id] ?? []).filter(s => !s.isWarmup).length
          return (
            <div key={e.id} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: i < exIdx ? '100%' : i === exIdx ? `${(d / e.sets) * 100}%` : '0%',
                  background: i <= exIdx ? accent : 'transparent',
                  opacity: i < exIdx ? 0.4 : 1,
                }} />
            </div>
          )
        })}
      </div>

      {/* ── Rest timer overlay ── */}
      {isResting && (
        <div className="absolute inset-x-0 z-20 mx-4 rounded-2xl p-4 flex items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-300"
          style={{
            top: '138px',
            background: 'var(--bg-surface)',
            border: `1px solid ${accent}50`,
            boxShadow: `0 20px 60px ${accent}30`,
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 animate-pulse"
            style={{ background: `${accent}20` }}>
            <Timer className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--fg-muted)' }}>Recupero</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all ease-linear"
                style={{ width: `${(restLeft / restTotal) * 100}%`, background: accent }} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl font-black tabular-nums" style={{ color: accent }}>{fmt(restLeft)}</span>
            <div className="flex gap-1.5">
              <button onClick={() => adjustRest(-15)} className="px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>-15s</button>
              <button onClick={() => adjustRest(30)} className="px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: 'var(--bg-elevated)', color: accent, border: '1px solid var(--border-subtle)' }}>+30s</button>
              <button onClick={skipRest} className="px-2 py-1 rounded-lg text-[10px] font-black"
                style={{ background: 'var(--bg-elevated)', color: 'var(--warning)', border: '1px solid var(--border-subtle)' }}>SKIP</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Exercise header + nav */}
        <div className="flex items-center gap-3">
          <button onClick={handlePrevExercise} disabled={exIdx === 0}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-30 transition-all active:scale-95"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-primary)' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5" style={{ color: accent }}>
              {exIdx + 1} / {data.exercises.length}
            </span>
            <h2 className="text-xl font-black leading-tight truncate" style={{ color: 'var(--fg-primary)' }}>
              {ex.name}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-1">
              <p className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
                {ex.sets}×{ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}–${ex.repsMax}`} · Rest {ex.restSec}s
              </p>
              <button
                onClick={() => setShowSkipSheet(true)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{ color: 'var(--fg-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                Non mi va
              </button>
            </div>
          </div>
          <button onClick={handleNextExercise}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-primary)' }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Muscle heatmap (compact) */}
        {(ex.primaryMuscles.length > 0 || ex.secondaryMuscles.length > 0) && (
          <div className="flex justify-center py-1">
            <MuscleHeatmap
              size="compact"
              showLabels={false}
              primaryMuscles={ex.primaryMuscles}
              secondaryMuscles={ex.secondaryMuscles}
            />
          </div>
        )}

        {/* Exercise media */}
        <ExerciseMedia exercise={ex} />

        {/* Description/tips pill */}
        {(ex.description || ex.tips) && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none px-4 py-2.5 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}>
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest flex-1">Note tecniche</span>
              <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-2 px-4 py-3 rounded-xl text-xs leading-relaxed space-y-2"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}>
              {ex.description && <p>{ex.description}</p>}
              {ex.tips && <p className="font-medium" style={{ color: 'var(--positive)' }}>💡 {ex.tips}</p>}
            </div>
          </details>
        )}

        {/* Plan notes */}
        {ex.planNotes && (
          <div className="px-4 py-3 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: 'var(--fg-primary)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
            <p className="text-xs leading-relaxed">{ex.planNotes}</p>
          </div>
        )}

        {/* Stopwatch */}
        <StopwatchWidget accent={accent} />

        {/* Series log */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>Log Serie</p>
            <span className="text-[9px]" style={{ color: 'var(--fg-muted)' }}>Swipe → per completare</span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-2 text-[9px] font-black uppercase tracking-widest text-center"
            style={{ color: 'var(--fg-muted)' }}>
            <span className="col-span-2">Set</span>
            <span className="col-span-3">Kg</span>
            <span className="col-span-3">Reps</span>
            {!quickMode && <span className="col-span-2">RIR</span>}
            <span className={quickMode ? 'col-span-4' : 'col-span-2'}>Azione</span>
          </div>

          {Array.from({ length: ex.sets }).map((_, i) => {
            const setNum = i + 1
            const logged = done.find(s => !s.isWarmup && s.setNumber === setNum)
            const prev = ex.previousSets.find(s => s.setNumber === setNum) ?? ex.previousSets[0]
            const isCurrent = !logged && done.filter(s => !s.isWarmup).length === i

            if (logged) return (
              <div key={setNum} className="grid grid-cols-12 gap-2 items-center px-3 py-4 rounded-2xl"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="col-span-2 text-sm font-black text-center" style={{ color: 'var(--positive)' }}>{setNum}</span>
                <span className="col-span-3 text-lg font-black text-center" style={{ color: 'var(--fg-primary)' }}>{logged.weightKg ?? '–'}</span>
                <span className="col-span-3 text-lg font-black text-center" style={{ color: 'var(--fg-primary)' }}>{logged.repsActual ?? '–'}</span>
                {!quickMode && <span className="col-span-2 text-sm font-bold text-center" style={{ color: 'var(--fg-muted)' }}>{logged.rirActual ?? '–'}</span>}
                <div className={`flex justify-center ${quickMode ? 'col-span-4' : 'col-span-2'}`}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--positive)' }}>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            )

            if (isCurrent) return (
              <SwipeableRow key={setNum} onSwipe={handleCompleteSet} disabled={totalDone >= ex.sets} accent={accent}>
                <div className="p-3 rounded-2xl"
                  style={{ background: 'var(--bg-surface)', border: `1px solid ${accent}40`, boxShadow: `0 4px 20px ${accent}15` }}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 flex flex-col items-center">
                      <span className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black text-white"
                        style={{ background: accent }}>{setNum}</span>
                      {isWarmup && <span className="text-[8px] font-black mt-1" style={{ color: 'var(--warning)' }}>WARM</span>}
                    </div>

                    {/* KG input */}
                    <div className="col-span-3">
                      <div className="w-full h-12 rounded-xl flex items-center justify-center text-lg font-black cursor-pointer transition-all active:scale-95"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
                        onPointerDown={e => {
                          const t = setTimeout(() => setCalcOpen(true), 500)
                          e.currentTarget.onpointerup = () => clearTimeout(t)
                          e.currentTarget.onpointerleave = () => clearTimeout(t)
                        }}
                        onClick={() => { const v = prompt('Inserisci Kg:', weight); if (v !== null) setWeight(v) }}>
                        {weight || '–'}
                      </div>
                    </div>

                    {/* Reps input */}
                    <div className="col-span-3">
                      <div className="w-full h-12 rounded-xl flex items-center justify-center text-lg font-black cursor-pointer transition-all active:scale-95"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
                        onClick={() => { const v = prompt('Inserisci Reps:', reps); if (v !== null) setReps(v) }}>
                        {reps || '–'}
                      </div>
                    </div>

                    {/* RIR */}
                    {!quickMode && (
                      <div className="col-span-2">
                        <div className="w-full h-12 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all active:scale-95"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
                          onClick={() => { const v = prompt('RIR (0–4):', rir); if (v !== null) setRir(v) }}>
                          {rir || '–'}
                        </div>
                      </div>
                    )}

                    {/* Copy previous */}
                    <div className={`flex justify-center ${quickMode ? 'col-span-4' : 'col-span-2'}`}>
                      <button onClick={fillFromPrevious} disabled={!prevBest}
                        className="w-full h-12 flex items-center justify-center rounded-xl text-xl font-black disabled:opacity-30 transition-all active:scale-95"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--fg-primary)', border: '1px solid var(--border-subtle)' }}>
                        =
                      </button>
                    </div>
                  </div>

                  {/* Feeling */}
                  {!isWarmup && (
                    <div className="flex gap-1.5 items-center mt-3 px-1">
                      <span className="text-[9px] font-black uppercase tracking-widest mr-1" style={{ color: 'var(--fg-muted)' }}>Feeling:</span>
                      {[1, 2, 3, 4, 5].map(score => (
                        <button key={score} onClick={() => setFeeling(score)}
                          className="w-8 h-8 rounded-xl text-sm transition-all active:scale-90"
                          style={{
                            background: feeling === score ? accent : 'var(--bg-elevated)',
                            border: `1px solid ${feeling === score ? accent : 'var(--border-default)'}`,
                            color: feeling === score ? 'white' : 'var(--fg-muted)',
                          }}>
                          {['😣', '😤', '😐', '😊', '🔥'][score - 1]}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Previous hint */}
                  {prevBest && (
                    <p className="text-[9px] text-center mt-2" style={{ color: 'var(--fg-muted)' }}>
                      Precedente: {prevBest.weightKg}kg × {prevBest.repsActual}
                    </p>
                  )}
                </div>
              </SwipeableRow>
            )

            return (
              <div key={setNum} className="grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-2xl opacity-45"
                style={{ background: 'var(--bg-elevated)' }}>
                <span className="col-span-2 text-sm font-black text-center" style={{ color: 'var(--fg-muted)' }}>{setNum}</span>
                <span className="col-span-3 text-sm font-bold text-center" style={{ color: 'var(--fg-muted)' }}>{prev?.weightKg ?? '–'}</span>
                <span className="col-span-3 text-sm font-bold text-center" style={{ color: 'var(--fg-muted)' }}>{prev?.repsActual ?? '–'}</span>
                {!quickMode && <span className="col-span-2 text-sm font-bold text-center" style={{ color: 'var(--fg-muted)' }}>–</span>}
                <div className={`flex justify-center ${quickMode ? 'col-span-4' : 'col-span-2'}`}>
                  <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid var(--border-subtle)' }} />
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* ── Bottom fixed actions ── */}
      <div className="shrink-0 p-4 space-y-3 pb-safe"
        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex gap-3">
          <button onClick={() => setIsWarmup(v => !v)}
            className="flex-1 py-3 rounded-2xl text-xs font-black transition-all active:scale-95"
            style={{
              background: isWarmup ? 'rgba(234,179,8,0.15)' : 'var(--bg-elevated)',
              color: isWarmup ? 'var(--warning)' : 'var(--fg-muted)',
              border: `1px solid ${isWarmup ? 'rgba(234,179,8,0.3)' : 'var(--border-subtle)'}`,
            }}>
            + Warm-up
          </button>

          {totalDone >= ex.sets ? (
            <button onClick={handleNextExercise}
              className="flex-[2] py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white transition-all active:scale-95"
              style={{ background: accent, boxShadow: `0 4px 20px ${accent}40` }}>
              <SkipForward className="w-5 h-5" />
              {exIdx < data.exercises.length - 1 ? 'Prossimo Esercizio' : 'Termina Sessione'}
            </button>
          ) : (
            <button onClick={handleCompleteSet}
              className="flex-[2] py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white transition-all active:scale-95"
              style={{ background: accent, boxShadow: `0 4px 20px ${accent}40` }}>
              <Check className="w-5 h-5" />
              Logga {isWarmup ? 'Warm-up' : `Serie ${totalDone + 1}`}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

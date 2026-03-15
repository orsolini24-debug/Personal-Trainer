'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Check, Timer, Zap,
  X, SkipForward, Plus, Minus, Flag, AlertTriangle, Layers, FastForward
} from 'lucide-react'
import { logSet, advanceExercise, finishSession, abandonSession } from '@/app/actions/active-session'

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

// ── Components ──────────────────────────────────────────────────────────────

function PlateCalculator({
  isOpen,
  onClose,
  onApply,
  initialWeight
}: {
  isOpen: boolean
  onClose: () => void
  onApply: (weight: number) => void
  initialWeight: number
}) {
  const [targetWeight, setTargetWeight] = useState(initialWeight || 20)
  const [barbellWeight, setBarbellWeight] = useState(20)
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25]

  useEffect(() => {
    if (isOpen) setTargetWeight(initialWeight || 20)
  }, [isOpen, initialWeight])

  if (!isOpen) return null

  // Calculate plates per side
  const weightPerSide = Math.max(0, (targetWeight - barbellWeight) / 2)
  let remaining = weightPerSide
  const platesNeeded: { weight: number, count: number }[] = []

  plates.forEach(p => {
    if (remaining >= p) {
      const count = Math.floor(remaining / p)
      platesNeeded.push({ weight: p, count })
      remaining -= count * p
      // fix floating point errors
      remaining = Math.round(remaining * 100) / 100
    }
  })

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#111118] border-t border-white/10 rounded-t-[2rem] p-6 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#3b82f6]" /> Calcolatore Dischi
          </h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#f1f5f9] p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <p className="text-[#64748b] text-sm mb-2">Peso Totale</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setTargetWeight(w => Math.max(20, w - 2.5))} className="w-12 h-12 rounded-full bg-[#0a0a0f] border border-white/5 flex items-center justify-center text-[#f1f5f9] hover:bg-white/5">
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-4xl font-black text-[#f1f5f9] w-32 text-center">{targetWeight} <span className="text-lg text-[#64748b] font-medium">kg</span></span>
            <button onClick={() => setTargetWeight(w => w + 2.5)} className="w-12 h-12 rounded-full bg-[#0a0a0f] border border-white/5 flex items-center justify-center text-[#f1f5f9] hover:bg-white/5">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {remaining > 0 && <p className="text-xs text-[#f59e0b] mt-2">Impossibile ottenere peso esatto (mancano {remaining * 2}kg)</p>}
        </div>

        <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5 mb-6">
          <p className="text-xs text-[#64748b] uppercase tracking-wider font-bold mb-3 text-center">Per ogni lato</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {platesNeeded.length === 0 ? (
              <span className="text-sm text-[#64748b]">Solo bilanciere ({barbellWeight}kg)</span>
            ) : (
              platesNeeded.map((p, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-8 flex items-end justify-center gap-0.5" style={{ height: '80px' }}>
                    {Array.from({ length: p.count }).map((_, i) => (
                      <div key={i} className="w-3 bg-[#3b82f6] rounded-sm border border-white/20" 
                        style={{ height: `${Math.max(20, p.weight * 3)}px` }}></div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#f1f5f9] mt-2">{p.weight}</span>
                  <span className="text-[10px] text-[#64748b]">x{p.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <button 
          onClick={() => { onApply(targetWeight); onClose() }}
          className="w-full py-4 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-transform active:scale-95"
        >
          Usa questo peso
        </button>
      </div>
    </>
  )
}

function SwipeableRow({ children, onSwipe, disabled, accent }: { children: React.ReactNode, onSwipe: () => void, disabled: boolean, accent: string }) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const SWIPE_THRESHOLD = 120

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    startXRef.current = e.clientX
    currentXRef.current = e.clientX
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    currentXRef.current = e.clientX
    const diff = currentXRef.current - startXRef.current
    if (diff > 0 && diff <= SWIPE_THRESHOLD + 20) {
      setTranslateX(diff)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    
    if (translateX >= SWIPE_THRESHOLD) {
      onSwipe()
    }
    setTranslateX(0)
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-transparent">
      {/* Background that reveals on swipe */}
      <div 
        className="absolute inset-y-0 left-0 flex items-center pl-6 z-0"
        style={{ width: `${Math.max(0, translateX)}px`, background: `${accent}40` }}
      >
        <Check className="w-5 h-5 text-white" />
      </div>
      
      {/* Draggable surface */}
      <div
        className="relative z-10 touch-none transition-transform"
        style={{ 
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
      </div>
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

  // Inputs per la serie corrente
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRir] = useState('')
  const [isWarmup, setIsWarmup] = useState(false)

  // Sessione finita
  const [showFinish, setShowFinish] = useState(false)
  const [rpeInput, setRpeInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [elapsedSecs, setElapsedSecs] = useState(elapsed(data.startedAt))

  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const repsRef = useRef<HTMLInputElement>(null)

  const ex = data.exercises[exIdx]
  const done = completedSets[ex?.id ?? ''] ?? []
  const currentSetNum = done.filter(s => !s.isWarmup).length + 1
  const totalDone = done.filter(s => !s.isWarmup).length
  const allExDone = exIdx >= data.exercises.length

  // Calculate real-time volume
  const totalVolume = Object.values(completedSets).flat().reduce((acc, set) => {
    if (!set.isWarmup && set.weightKg && set.repsActual) {
      return acc + (set.weightKg * set.repsActual)
    }
    return acc
  }, 0)

  // Elapsed timer
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsedSecs(elapsed(data.startedAt))
    }, 1000)
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [data.startedAt])

  // Pre-fill con carico precedente (solo se non ci sono dati correnti per evitare di sovrascrivere l'utente)
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
    setRestTotal(secs)
    setRestLeft(secs)
    setIsResting(true)
    restTimerRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current!)
          setIsResting(false)
          // Play sound
          if (typeof window !== 'undefined') {
             const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
             audio.play().catch(e => console.error("Audio play failed:", e))
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const skipRest = useCallback(() => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    setIsResting(false)
    setRestLeft(0)
  }, [])

  // Completa serie
  const handleCompleteSet = useCallback(async () => {
    if (!ex) return
    const setNum = isWarmup
      ? -(done.filter(s => s.isWarmup).length + 1)
      : totalDone + 1

    const w = weight ? parseFloat(weight) : null
    const r = reps ? parseInt(reps) : null
    const ri = (quickMode || !rir) ? null : parseInt(rir)

    const newSet: CompletedSet = {
      setNumber: setNum > 0 ? setNum : done.filter(s => s.isWarmup).length + 1,
      weightKg: w,
      repsActual: r,
      rirActual: ri,
      isWarmup,
    }

    // Optimistic update
    setCompletedSets(prev => ({
      ...prev,
      [ex.id]: [...(prev[ex.id] ?? []), newSet],
    }))

    // Persist in background
    logSet({
      activeSessionId: data.activeSessionId,
      exerciseId: ex.id,
      setNumber: newSet.setNumber,
      weightKg: newSet.weightKg,
      repsActual: newSet.repsActual,
      rirActual: newSet.rirActual,
      isWarmup: newSet.isWarmup,
    })

    // Avvia rest timer (solo se non warm-up)
    if (!isWarmup) startRest(ex.restSec)

    // Reset inputs but keep weight
    setReps('')
    setIsWarmup(false)
  }, [ex, done, totalDone, weight, reps, rir, isWarmup, quickMode, data.activeSessionId, startRest])

  // Copia da precedente
  const fillFromPrevious = () => {
    const prevSet = ex.previousSets.find(s => s.setNumber === currentSetNum) ?? ex.previousSets[0]
    if (prevSet) {
      if (prevSet.weightKg) setWeight(prevSet.weightKg.toString())
      if (prevSet.repsActual) setReps(prevSet.repsActual.toString())
    }
  }

  // Avanza all'esercizio successivo
  const handleNextExercise = useCallback(async () => {
    const nextIdx = exIdx + 1
    advanceExercise(data.activeSessionId, nextIdx)
    setExIdx(nextIdx)
    skipRest()
    setWeight('')
    setReps('')
  }, [exIdx, data.activeSessionId, skipRest])

  const handlePrevExercise = useCallback(() => {
    if (exIdx > 0) {
      setExIdx(exIdx - 1)
      skipRest()
      setWeight('')
      setReps('')
    }
  }, [exIdx, skipRest])

  // Termina sessione
  const handleFinish = useCallback(async () => {
    setSaving(true)
    const res = await finishSession({
      activeSessionId: data.activeSessionId,
      rpe: rpeInput ? parseInt(rpeInput) : null,
      notes: notesInput || null,
    })
    setSaving(false)
    if ('success' in res && res.success) {
      router.push('/training')
    }
  }, [data.activeSessionId, rpeInput, notesInput, router])

  const handleAbandon = useCallback(async () => {
    if (!confirm('Sei sicuro di voler abbandonare la sessione?')) return
    await abandonSession(data.activeSessionId)
    router.push('/training')
  }, [data.activeSessionId, router])

  // Se tutti gli esercizi sono finiti
  if (allExDone && !showFinish) {
    setShowFinish(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!ex && !showFinish) {
    return <div style={{ color: 'var(--fg-primary)', padding: 24 }}>Nessun esercizio trovato.</div>
  }

  const sessionColors: Record<string, string> = {
    A: '#10b981', B: '#3b82f6', C: '#8b5cf6', D: '#f59e0b', V1: '#ef4444', V2: '#94a3b8'
  }
  const accent = sessionColors[data.sessionType] ?? 'var(--accent)'
  const prevBest = ex?.previousSets.find(s => s.setNumber === totalDone + 1) ?? ex?.previousSets[0]

  // ─ Schermata fine sessione ─
  if (showFinish) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
              style={{ background: `${accent}20`, border: `2px solid ${accent}` }}>
              <Flag className="w-10 h-10" style={{ color: accent }} />
            </div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--fg-primary)' }}>
              Sessione completata!
            </h2>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              Durata: {fmt(elapsedSecs)} · Vol: {totalVolume.toLocaleString()} kg
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-black uppercase tracking-wider block mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                RPE (6-10)
              </label>
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
            </div>
            <textarea
              value={notesInput} onChange={e => setNotesInput(e.target.value)}
              placeholder="Note (tensione, sensazioni, pesi…)"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--fg-primary)',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-black text-base transition-all"
            style={{ background: accent, color: 'white', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Salvataggio...' : 'Salva e concludi'}
          </button>
        </div>
      </div>
    )
  }

  // ─ Schermata tracker ─
  return (
    <div className="flex flex-col h-[100dvh] select-none fixed inset-0 z-[100] bg-[#05050f]">

      <PlateCalculator 
        isOpen={calcOpen} 
        onClose={() => setCalcOpen(false)} 
        initialWeight={parseFloat(weight) || 20}
        onApply={(w) => setWeight(w.toString())}
      />

      {/* ── Top bar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#0d0d1a]"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button onClick={handleAbandon} className="p-2 rounded-xl text-[#64748b] hover:bg-white/5">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-lg font-black tabular-nums tracking-wider text-[#f1f5f9]">
            {fmt(elapsedSecs)}
          </span>
          <span className="text-[10px] font-bold uppercase text-[#3b82f6] tracking-widest flex items-center gap-1">
            Vol: {totalVolume.toLocaleString()} kg
          </span>
        </div>
        
        <button
          onClick={() => setShowFinish(true)}
          className="px-4 py-2 rounded-xl text-xs font-black text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          style={{ background: '#10b981' }}
        >
          Fine
        </button>
      </div>

      {/* Quick Mode Toggle */}
      <div className="bg-[#141424] px-4 py-2 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <FastForward className={`w-4 h-4 ${quickMode ? 'text-[#f59e0b]' : 'text-[#64748b]'}`} />
          <span className="text-xs font-bold text-[#f1f5f9]">Modalità Rapida</span>
        </div>
        <button 
          onClick={() => setQuickMode(!quickMode)}
          className={`w-10 h-6 rounded-full p-1 transition-colors ${quickMode ? 'bg-[#f59e0b]' : 'bg-[#0a0a18] border border-white/10'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${quickMode ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Progress barre esercizi */}
      <div className="flex items-center gap-1 px-4 py-2 bg-[#05050f]">
        {data.exercises.map((e, i) => {
          const done_ = (completedSets[e.id] ?? []).filter(s => !s.isWarmup).length
          const full = done_ >= e.sets
          return (
            <div key={e.id} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: i < exIdx ? '100%' : i === exIdx ? `${(done_ / e.sets) * 100}%` : '0%',
                  background: full ? accent : i === exIdx ? accent : 'transparent',
                  opacity: i < exIdx ? 0.4 : 1,
                }} />
            </div>
          )
        })}
      </div>

      {/* ── Rest timer overlay ── */}
      {isResting && (
        <div
          className="absolute inset-x-0 top-32 z-20 mx-4 rounded-2xl p-4 flex items-center gap-4 bg-[#141424]"
          style={{ border: `1px solid ${accent}40`, boxShadow: `0 12px 40px ${accent}30` }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}20` }}>
            <Timer className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5 text-[#94a3b8]">Recupero</p>
            <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
              <div className="h-full rounded-full transition-all ease-linear"
                style={{ width: `${(restLeft / restTotal) * 100}%`, background: accent }} />
            </div>
          </div>
          <span className="text-2xl font-black tabular-nums" style={{ color: accent }}>{fmt(restLeft)}</span>
          <button onClick={skipRest} className="text-xs font-bold px-3 py-2 rounded-lg bg-white/5 text-[#f1f5f9]">
            Skip
          </button>
        </div>
      )}

      {/* ── Corpo principale ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Esercizio header */}
        <div className="flex items-center gap-3">
          <button onClick={handlePrevExercise} disabled={exIdx === 0}
            className="p-3 rounded-xl shrink-0 disabled:opacity-30 bg-[#141424] border border-white/5 text-[#f1f5f9]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: accent }}>
              {exIdx + 1} / {data.exercises.length}
            </span>
            <h2 className="text-2xl font-black leading-tight text-[#f1f5f9] mb-1">
              {ex.name}
            </h2>
            <p className="text-xs text-[#94a3b8] font-medium">
              {ex.sets}x{ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}-${ex.repsMax}`} · Rest {ex.restSec}s
            </p>
          </div>
          <button onClick={handleNextExercise}
            className="p-3 rounded-xl shrink-0 bg-[#141424] border border-white/5 text-[#f1f5f9]">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Note piano */}
        {ex.planNotes && (
          <div className="px-4 py-3 rounded-xl text-sm leading-relaxed flex items-start gap-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f1f5f9]">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#f59e0b]" />
            <p>{ex.planNotes}</p>
          </div>
        )}

        {/* Serie completate / correnti */}
        <div className="space-y-3 mt-6">
          <div className="flex justify-between items-center px-2">
            <p className="text-xs font-black uppercase tracking-wider text-[#64748b]">
              Log Serie
            </p>
            <span className="text-[10px] text-[#64748b]">Swipe a destra per completare</span>
          </div>

          {/* Intestazione Colonne */}
          <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">
            <span className="col-span-2">Set</span>
            <span className="col-span-3">Kg</span>
            <span className="col-span-3">Reps</span>
            {!quickMode && <span className="col-span-2">RIR</span>}
            <span className={quickMode ? "col-span-4" : "col-span-2"}>Azione</span>
          </div>

          {/* Serie pianificate rendering */}
          {Array.from({ length: ex.sets }).map((_, i) => {
            const setNum = i + 1
            const logged = done.find(s => !s.isWarmup && s.setNumber === setNum)
            const prev = ex.previousSets.find(s => s.setNumber === setNum) ?? ex.previousSets[0]
            const isCurrent = !logged && done.filter(s => !s.isWarmup).length === i

            if (logged) {
              return (
                <div key={setNum} className="grid grid-cols-12 gap-2 items-center px-3 py-4 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20">
                  <span className="col-span-2 text-sm font-black text-center text-[#10b981]">{setNum}</span>
                  <span className="col-span-3 text-lg font-black text-center text-[#f1f5f9]">{logged.weightKg}</span>
                  <span className="col-span-3 text-lg font-black text-center text-[#f1f5f9]">{logged.repsActual}</span>
                  {!quickMode && <span className="col-span-2 text-sm font-bold text-center text-[#94a3b8]">{logged.rirActual ?? '-'}</span>}
                  <div className={`flex justify-center ${quickMode ? 'col-span-4' : 'col-span-2'}`}>
                    <Check className="w-5 h-5 text-[#10b981]" />
                  </div>
                </div>
              )
            }

            if (isCurrent) {
              return (
                <SwipeableRow key={setNum} onSwipe={handleCompleteSet} disabled={totalDone >= ex.sets} accent={accent}>
                  <div className="grid grid-cols-12 gap-2 items-center p-3 rounded-2xl bg-[#111118] border border-white/10 shadow-lg">
                    <div className="col-span-2 flex flex-col items-center">
                      <span className="text-xs font-black text-[#f1f5f9] bg-white/10 w-6 h-6 rounded-full flex items-center justify-center mb-1">{setNum}</span>
                      {isWarmup && <span className="text-[9px] text-[#f59e0b] font-bold">WARM</span>}
                    </div>
                    
                    {/* Active Inputs */}
                    <div className="col-span-3">
                      <div 
                        className="w-full h-12 bg-[#0a0a0f] border border-white/10 rounded-xl flex items-center justify-center text-lg font-black text-[#f1f5f9] cursor-pointer"
                        onPointerDown={(e) => {
                          // Lungo tocco per plate calculator
                          const timer = setTimeout(() => setCalcOpen(true), 500);
                          e.currentTarget.onpointerup = () => clearTimeout(timer);
                          e.currentTarget.onpointerleave = () => clearTimeout(timer);
                        }}
                        onClick={() => {
                          const val = prompt("Inserisci Kg:", weight);
                          if (val !== null) setWeight(val);
                        }}
                      >
                        {weight || '-'}
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div 
                        className="w-full h-12 bg-[#0a0a0f] border border-white/10 rounded-xl flex items-center justify-center text-lg font-black text-[#f1f5f9] cursor-pointer"
                        onClick={() => {
                          const val = prompt("Inserisci Reps:", reps);
                          if (val !== null) setReps(val);
                        }}
                      >
                        {reps || '-'}
                      </div>
                    </div>

                    {!quickMode && (
                      <div className="col-span-2">
                        <div 
                          className="w-full h-12 bg-[#0a0a0f] border border-white/10 rounded-xl flex items-center justify-center text-sm font-bold text-[#94a3b8] cursor-pointer"
                          onClick={() => {
                            const val = prompt("Inserisci RIR (0-4):", rir);
                            if (val !== null) setRir(val);
                          }}
                        >
                          {rir || '-'}
                        </div>
                      </div>
                    )}

                    <div className={`flex justify-center gap-1 ${quickMode ? 'col-span-4' : 'col-span-2'}`}>
                      <button 
                        onClick={fillFromPrevious}
                        disabled={!prevBest}
                        className="w-10 h-12 flex items-center justify-center bg-white/5 rounded-xl disabled:opacity-30 text-[#f1f5f9] text-xl font-black"
                      >
                        =
                      </button>
                    </div>
                  </div>
                  {/* Previous stat hint */}
                  {prevBest && (
                    <p className="text-[10px] text-center text-[#64748b] mt-1">
                      Precedente: {prevBest.weightKg}kg x {prevBest.repsActual}
                    </p>
                  )}
                </SwipeableRow>
              )
            }

            // Future sets
            return (
              <div key={setNum} className="grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-2xl bg-[#0a0a0f] opacity-50">
                <span className="col-span-2 text-sm font-black text-center text-[#64748b]">{setNum}</span>
                <span className="col-span-3 text-sm font-bold text-center text-[#64748b]">{prev?.weightKg ?? '-'}</span>
                <span className="col-span-3 text-sm font-bold text-center text-[#64748b]">{prev?.repsActual ?? '-'}</span>
                {!quickMode && <span className="col-span-2 text-sm font-bold text-center text-[#64748b]">-</span>}
                <div className={`flex justify-center ${quickMode ? 'col-span-4' : 'col-span-2'}`}>
                  <div className="w-4 h-4 rounded-full border border-[#64748b]"></div>
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* ── Fixed Bottom Actions ── */}
      <div className="shrink-0 p-4 bg-[#0d0d1a] border-t border-white/5 space-y-3 pb-safe">
        <div className="flex gap-3">
          <button
            onClick={() => setIsWarmup(v => !v)}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${isWarmup ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30' : 'bg-[#141424] text-[#64748b] border border-white/5'}`}
          >
            + Warm-up
          </button>
          {totalDone >= ex.sets ? (
             <button onClick={handleNextExercise}
               className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-transform active:scale-95"
               style={{ background: accent }}>
               <SkipForward className="w-5 h-5" />
               {exIdx < data.exercises.length - 1 ? 'Prossimo Esercizio' : 'Termina Sessione'}
             </button>
          ) : (
             <button
               onClick={handleCompleteSet}
               className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-transform active:scale-95"
               style={{ background: accent }}>
               <Check className="w-5 h-5" />
               Logga {isWarmup ? 'Warm-up' : `Serie ${totalDone + 1}`}
             </button>
          )}
        </div>
      </div>

    </div>
  )
}

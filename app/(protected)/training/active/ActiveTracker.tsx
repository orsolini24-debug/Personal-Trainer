'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Check, Timer, Zap,
  X, SkipForward, Plus, Minus, Flag, AlertTriangle,
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

  // Elapsed timer
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsedSecs(elapsed(data.startedAt))
    }, 1000)
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [data.startedAt])

  // Pre-fill con carico precedente
  useEffect(() => {
    if (!ex) return
    const prevSet = ex.previousSets.find(s => s.setNumber === currentSetNum) ?? ex.previousSets[0]
    if (prevSet) {
      setWeight(prevSet.weightKg?.toString() ?? '')
      setReps(prevSet.repsActual?.toString() ?? String(ex.repsMin))
    } else {
      setWeight('')
      setReps(String(ex.repsMin))
    }
    setRir(String(ex.targetRir))
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

    const newSet: CompletedSet = {
      setNumber: isWarmup ? done.filter(s => s.isWarmup).length + 1 : totalDone + 1,
      weightKg: weight ? parseFloat(weight) : null,
      repsActual: reps ? parseInt(reps) : null,
      rirActual: rir ? parseInt(rir) : null,
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

    // Reset inputs
    setIsWarmup(false)
  }, [ex, done, totalDone, weight, reps, rir, isWarmup, data.activeSessionId, startRest])

  // Avanza all'esercizio successivo
  const handleNextExercise = useCallback(async () => {
    const nextIdx = exIdx + 1
    advanceExercise(data.activeSessionId, nextIdx)
    setExIdx(nextIdx)
    skipRest()
  }, [exIdx, data.activeSessionId, skipRest])

  const handlePrevExercise = useCallback(() => {
    if (exIdx > 0) {
      setExIdx(exIdx - 1)
      skipRest()
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
              Durata: {fmt(elapsedSecs)} · {data.exercises.length} esercizi
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

  const prevBest = ex.previousSets.find(s => s.setNumber === totalDone + 1) ?? ex.previousSets[0]

  // ─ Schermata tracker ─
  return (
    <div className="flex flex-col h-full select-none">

      {/* ── Top bar ── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button onClick={handleAbandon} className="p-2 rounded-xl" style={{ color: 'var(--fg-subtle)' }}>
          <X className="w-4 h-4" />
        </button>

        {/* Progress barre esercizi */}
        <div className="flex-1 flex items-center gap-1">
          {data.exercises.map((e, i) => {
            const done_ = (completedSets[e.id] ?? []).filter(s => !s.isWarmup).length
            const full = done_ >= e.sets
            return (
              <div key={e.id} className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--border-subtle)' }}>
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

        <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: 'var(--fg-muted)' }}>
          {fmt(elapsedSecs)}
        </span>
        <button
          onClick={() => setShowFinish(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-black"
          style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}
        >
          Termina
        </button>
      </div>

      {/* ── Rest timer overlay ── */}
      {isResting && (
        <div
          className="absolute inset-x-0 top-14 z-20 mx-4 rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'var(--bg-elevated)', border: `1px solid ${accent}40`, boxShadow: `0 8px 32px ${accent}20` }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}20` }}>
            <Timer className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--fg-muted)' }}>Recupero</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${(restLeft / restTotal) * 100}%`, background: accent }} />
            </div>
          </div>
          <span className="text-2xl font-black tabular-nums" style={{ color: accent }}>{fmt(restLeft)}</span>
          <button onClick={skipRest} className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{ color: 'var(--fg-subtle)', background: 'var(--bg-surface)' }}>
            Skip
          </button>
          <div className="flex gap-1">
            <button onClick={() => setRestLeft(l => l - 30 > 0 ? l - 30 : 0)}
              className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center"
              style={{ background: 'var(--bg-surface)', color: 'var(--fg-muted)' }}>
              -30
            </button>
            <button onClick={() => setRestLeft(l => l + 30)}
              className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center"
              style={{ background: 'var(--bg-surface)', color: 'var(--fg-muted)' }}>
              +30
            </button>
          </div>
        </div>
      )}

      {/* ── Corpo principale ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Esercizio header */}
        <div className="flex items-start gap-3">
          <button onClick={handlePrevExercise} disabled={exIdx === 0}
            className="p-2 rounded-xl mt-0.5 shrink-0 disabled:opacity-30"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: accent }}>
                Esercizio {exIdx + 1}/{data.exercises.length}
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight" style={{ color: 'var(--fg-primary)' }}>
              {ex.name}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--fg-muted)' }}>
              {ex.sets} serie · {ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}-${ex.repsMax}`} reps · RIR {ex.targetRir} · Rest {fmt(ex.restSec)}
            </p>
          </div>
          <button onClick={handleNextExercise}
            className="p-2 rounded-xl mt-0.5 shrink-0"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Note piano */}
        {ex.planNotes && (
          <div className="px-3 py-2 rounded-xl text-xs leading-relaxed flex items-start gap-2"
            style={{ background: `${accent}10`, border: `1px solid ${accent}25`, color: 'var(--fg-muted)' }}>
            {ex.planNotes.startsWith('⚠️') && <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />}
            {ex.planNotes}
          </div>
        )}

        {/* Serie completate */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--fg-subtle)' }}>
            Serie
          </p>
          {/* Intestazione */}
          <div className="grid grid-cols-12 gap-1 px-2">
            <span className="col-span-1 text-[10px] font-bold text-center" style={{ color: 'var(--fg-subtle)' }}>#</span>
            <span className="col-span-4 text-[10px] font-bold text-center" style={{ color: 'var(--fg-subtle)' }}>Kg</span>
            <span className="col-span-4 text-[10px] font-bold text-center" style={{ color: 'var(--fg-subtle)' }}>Reps</span>
            <span className="col-span-2 text-[10px] font-bold text-center" style={{ color: 'var(--fg-subtle)' }}>RIR</span>
            <span className="col-span-1" />
          </div>

          {/* Serie pianificate */}
          {Array.from({ length: ex.sets }).map((_, i) => {
            const setNum = i + 1
            const logged = done.find(s => !s.isWarmup && s.setNumber === setNum)
            const prev = ex.previousSets.find(s => s.setNumber === setNum) ?? ex.previousSets[0]
            const isCurrent = !logged && done.filter(s => !s.isWarmup).length === i

            return (
              <div key={setNum}
                className="grid grid-cols-12 gap-1 items-center px-2 py-2 rounded-xl transition-all"
                style={{
                  background: logged ? `${accent}10` : isCurrent ? 'var(--bg-elevated)' : 'transparent',
                  border: isCurrent ? `1px solid ${accent}40` : '1px solid transparent',
                  opacity: !logged && !isCurrent ? 0.5 : 1,
                }}>
                <span className="col-span-1 text-xs font-black text-center" style={{ color: logged ? accent : 'var(--fg-subtle)' }}>
                  {setNum}
                </span>

                <div className="col-span-4 text-center">
                  {logged ? (
                    <span className="text-sm font-black" style={{ color: 'var(--fg-primary)' }}>
                      {logged.weightKg ?? '—'}
                    </span>
                  ) : prev ? (
                    <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
                      prec: {prev.weightKg ?? '—'}
                    </span>
                  ) : <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>—</span>}
                </div>

                <div className="col-span-4 text-center">
                  {logged ? (
                    <span className="text-sm font-black" style={{ color: 'var(--fg-primary)' }}>
                      {logged.repsActual ?? '—'}
                    </span>
                  ) : prev ? (
                    <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
                      prec: {prev.repsActual ?? '—'}
                    </span>
                  ) : <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>—</span>}
                </div>

                <div className="col-span-2 text-center">
                  {logged && <span className="text-xs font-bold" style={{ color: 'var(--fg-muted)' }}>{logged.rirActual ?? '—'}</span>}
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  {logged ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: accent }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full border-2 animate-pulse" style={{ borderColor: accent }} />
                  ) : null}
                </div>
              </div>
            )
          })}

          {/* Warm-up rows */}
          {done.filter(s => s.isWarmup).map((sl, i) => (
            <div key={`w${i}`} className="grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded-xl"
              style={{ background: 'var(--bg-elevated)', opacity: 0.7 }}>
              <span className="col-span-1 text-[10px] font-black text-center" style={{ color: 'var(--fg-subtle)' }}>W</span>
              <span className="col-span-4 text-sm font-bold text-center" style={{ color: 'var(--fg-muted)' }}>{sl.weightKg ?? '—'}</span>
              <span className="col-span-4 text-sm font-bold text-center" style={{ color: 'var(--fg-muted)' }}>{sl.repsActual ?? '—'}</span>
              <span className="col-span-2" />
              <div className="col-span-1 flex justify-center">
                <Check className="w-3 h-3" style={{ color: 'var(--fg-subtle)' }} />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Input area ── */}
      {totalDone < ex.sets && (
        <div
          className="shrink-0 p-4 space-y-4"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
        >
          {/* Warm-up toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWarmup(v => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-black transition-all"
              style={{
                background: isWarmup ? 'rgba(245,158,11,0.15)' : 'var(--bg-elevated)',
                color: isWarmup ? '#f59e0b' : 'var(--fg-subtle)',
                border: `1px solid ${isWarmup ? '#f59e0b40' : 'var(--border-subtle)'}`,
              }}>
              W — Riscaldamento
            </button>
            <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
              Serie {isWarmup ? 'W' : totalDone + 1} di {ex.sets}
            </span>
          </div>

          {/* KG / REPS / RIR */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Kg', value: weight, setter: setWeight, placeholder: '0', next: () => repsRef.current?.focus() },
              { label: 'Reps', value: reps, setter: setReps, placeholder: String(ex.repsMin), ref: repsRef },
              { label: 'RIR', value: rir, setter: setRir, placeholder: String(ex.targetRir) },
            ].map(({ label, value, setter, placeholder, next, ref }) => (
              <div key={label}>
                <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 text-center"
                  style={{ color: 'var(--fg-subtle)' }}>{label}</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => setter(v => String(Math.max(0, parseFloat(v || '0') - (label === 'Kg' ? 2.5 : 1))))}
                    className="w-8 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}>
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    ref={ref as React.RefObject<HTMLInputElement>}
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={e => e.key === 'Enter' && next?.()}
                    placeholder={placeholder}
                    className="flex-1 h-10 rounded-lg text-center font-black text-base w-full"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: `1px solid ${accent}40`,
                      color: 'var(--fg-primary)',
                      outline: 'none',
                    }}
                  />
                  <button onClick={() => setter(v => String(parseFloat(v || '0') + (label === 'Kg' ? 2.5 : 1)))}
                    className="w-8 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Completa serie */}
          <button
            onClick={handleCompleteSet}
            className="w-full py-3.5 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2"
            style={{ background: accent, color: 'white' }}
          >
            <Check className="w-5 h-5" />
            {isWarmup ? 'Completa Warm-up' : `Completa Serie ${totalDone + 1}`}
          </button>

          {/* Next exercise shortcut */}
          {totalDone >= ex.sets && (
            <button onClick={handleNextExercise}
              className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--bg-elevated)', border: `1px solid ${accent}`, color: accent }}>
              <SkipForward className="w-4 h-4" />
              {exIdx < data.exercises.length - 1 ? 'Esercizio successivo' : 'Termina sessione'}
            </button>
          )}
        </div>
      )}

      {/* All sets done for this exercise */}
      {totalDone >= ex.sets && (
        <div className="shrink-0 p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={handleNextExercise}
            className="w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2"
            style={{ background: accent, color: 'white' }}>
            <SkipForward className="w-5 h-5" />
            {exIdx < data.exercises.length - 1 ? 'Prossimo esercizio' : 'Termina sessione'}
          </button>
        </div>
      )}

    </div>
  )
}

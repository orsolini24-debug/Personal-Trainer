'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dumbbell, Utensils, Zap, Target, Activity, BarChart2, Trophy,
  Clock, Calendar, ChevronRight, ChevronLeft, Loader2, CheckCircle2, Sparkles,
  AlertCircle,
} from 'lucide-react'
import { createNewPlanForExistingUser, type NewPlanInput } from '@/app/actions/plan-create'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'TYPE' | 'GOAL' | 'DETAILS' | 'GENERATING' | 'DONE'

const PLAN_TYPES: { id: 'TRAINING_ONLY' | 'NUTRITION_ONLY' | 'FULL'; label: string; sub: string; emoji: string; color: string }[] = [
  {
    id: 'TRAINING_ONLY',
    label: 'Allenamento',
    sub: 'Scheda personalizzata, periodizzazione, carichi e progressioni',
    emoji: '🏋️',
    color: 'var(--accent)',
  },
  {
    id: 'NUTRITION_ONLY',
    label: 'Nutrizione',
    sub: 'Macro targets, meal timing, strategia calorica basata sul tuo obiettivo',
    emoji: '🥗',
    color: 'var(--positive)',
  },
  {
    id: 'FULL',
    label: 'Piano Completo',
    sub: 'Allenamento + Nutrizione integrati in un singolo ecosistema',
    emoji: '⚡',
    color: 'var(--warning)',
  },
]

const GOALS = [
  { value: 'Aumentare la forza massimale',       label: 'Forza',           icon: Dumbbell,  color: '#3b82f6' },
  { value: 'Aumentare la massa muscolare',        label: 'Ipertrofia',      icon: BarChart2, color: '#8b5cf6' },
  { value: 'Perdere peso e ridurre il grasso',    label: 'Dimagrimento',    icon: Target,    color: '#f59e0b' },
  { value: 'Migliorare la performance sportiva',  label: 'Performance',     icon: Trophy,    color: '#10b981' },
  { value: 'Migliorare la resistenza aerobica',   label: 'Resistenza',      icon: Activity,  color: '#06b6d4' },
  { value: 'Mantenersi in forma e in salute',     label: 'Salute',          icon: Zap,       color: '#ec4899' },
]

const TIMELINES = [
  { value: 4,  label: '4 sett.',  desc: 'Sprint intenso' },
  { value: 8,  label: '8 sett.',  desc: 'Ciclo standard' },
  { value: 12, label: '12 sett.', desc: 'Mesociclo completo' },
  { value: 16, label: '16 sett.', desc: 'Blocco lungo' },
  { value: 24, label: '24 sett.', desc: 'Periodizzazione annuale' },
]

const DURATIONS = [
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 ora'  },
  { value: 90,  label: '1h 30'  },
  { value: 120, label: '2 ore'  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function NewPlanCreator() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('TYPE')
  const [planType, setPlanType] = useState<'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY' | null>(null)
  const [goal, setGoal] = useState<string>('')
  const [timeline, setTimeline] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [event, setEvent] = useState('')
  const [injuries, setInjuries] = useState('')
  const [error, setError] = useState<string | null>(null)

  const goalDef    = GOALS.find(g => g.value === goal)
  const planTypeDef = PLAN_TYPES.find(t => t.id === planType)

  // Progress bar steps
  const STEPS: Step[] = ['TYPE', 'GOAL', 'DETAILS']
  const stepIdx = STEPS.indexOf(step)

  const handleGenerate = async () => {
    if (!planType || !goal || !timeline || !duration) return
    setStep('GENERATING')
    setError(null)

    const input: NewPlanInput = {
      planType,
      primaryGoal: goal,
      sessionDurationMin: duration,
      timelineWeeks: timeline,
      upcomingEvent: event.trim() || undefined,
      injuries: injuries.trim() || undefined,
    }

    const result = await createNewPlanForExistingUser(input)
    if (result && 'error' in result) {
      setError(result.error)
      setStep('DETAILS')
      return
    }
    setStep('DONE')
    setTimeout(() => router.refresh(), 800)
  }

  // ── Generating / Done ───────────────────────────────────────────────────────

  if (step === 'GENERATING') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-8 text-center animate-page">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center animate-pulse-glow"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
          }}
        >
          <Sparkles className="w-12 h-12" style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-2" style={{ color: 'var(--fg-primary)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.04em' }}>
            Costruendo il tuo piano...
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-muted)', maxWidth: '320px' }}>
            L&apos;AI sta creando 3 proposte personalizzate basandosi sul tuo profilo e obiettivi.
          </p>
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--fg-subtle)' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Elaborazione in corso</span>
        </div>
      </div>
    )
  }

  if (step === 'DONE') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-8 text-center animate-pop-in">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: 'color-mix(in srgb, var(--positive) 12%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--positive) 25%, transparent)',
          }}
        >
          <CheckCircle2 className="w-12 h-12" style={{ color: 'var(--positive)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-2" style={{ color: 'var(--fg-primary)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.04em' }}>
            Piano creato!
          </h2>
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>Sto caricando il tuo dashboard...</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main wizard UI
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto animate-page">

      {/* Progress bar */}
      {stepIdx >= 0 && (
        <div className="flex items-center gap-3 mb-10">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1 rounded-full transition-all duration-500 flex-1"
              style={{
                background: i <= stepIdx ? 'var(--accent)' : 'var(--border-default)',
                opacity: i <= stepIdx ? 1 : 0.4,
              }}
            />
          ))}
          <span
            className="text-[10px] font-black uppercase tracking-widest shrink-0"
            style={{ color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {stepIdx + 1} / {STEPS.length}
          </span>
        </div>
      )}

      {/* ── STEP 1: Piano Type ── */}
      {step === 'TYPE' && (
        <div className="animate-fade-up">
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
            Nuovo Piano
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-8" style={{ color: 'var(--fg-primary)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.05em' }}>
            Cosa vuoi costruire?
          </h2>
          <div className="space-y-3">
            {PLAN_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setPlanType(t.id); setStep('GOAL') }}
                className="w-full text-left transition-all"
                style={{
                  background: planType === t.id
                    ? `color-mix(in srgb, ${t.color} 8%, var(--bg-surface))`
                    : 'var(--bg-surface)',
                  border: `1.5px solid ${planType === t.id
                    ? `color-mix(in srgb, ${t.color} 35%, transparent)`
                    : 'var(--border-default)'}`,
                  borderRadius: '20px',
                  padding: '22px 24px',
                  cursor: 'pointer',
                  transform: 'translateY(0)',
                  boxShadow: planType === t.id ? `0 4px 20px color-mix(in srgb, ${t.color} 15%, transparent)` : 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = `color-mix(in srgb, ${t.color} 40%, transparent)`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  if (planType !== t.id) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{
                      background: `color-mix(in srgb, ${t.color} 12%, var(--bg-elevated))`,
                      border: `1px solid color-mix(in srgb, ${t.color} 20%, transparent)`,
                    }}
                  >
                    {t.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-base" style={{ color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
                      {t.label}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                      {t.sub}
                    </p>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 shrink-0 transition-transform"
                    style={{ color: 'var(--fg-subtle)' }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Goal ── */}
      {step === 'GOAL' && (
        <div className="animate-fade-up">
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: planTypeDef?.color ?? 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
            {planTypeDef?.emoji} {planTypeDef?.label}
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-8" style={{ color: 'var(--fg-primary)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.05em' }}>
            Qual è il tuo obiettivo?
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-10">
            {GOALS.map((g) => {
              const Icon = g.icon
              const selected = goal === g.value
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className="text-left transition-all"
                  style={{
                    background: selected
                      ? `color-mix(in srgb, ${g.color} 10%, var(--bg-surface))`
                      : 'var(--bg-surface)',
                    border: `1.5px solid ${selected ? g.color : 'var(--border-default)'}`,
                    borderRadius: '18px',
                    padding: '18px 16px',
                    cursor: 'pointer',
                    boxShadow: selected ? `0 4px 16px color-mix(in srgb, ${g.color} 20%, transparent)` : 'none',
                    transform: selected ? 'scale(1.01)' : 'scale(1)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `color-mix(in srgb, ${g.color} 15%, var(--bg-elevated))` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: g.color }} />
                  </div>
                  <p className="font-black text-sm" style={{ color: 'var(--fg-primary)' }}>
                    {g.label}
                  </p>
                </button>
              )
            })}
          </div>
          <NavButtons
            onBack={() => setStep('TYPE')}
            onNext={() => { if (goal) setStep('DETAILS') }}
            disabled={!goal}
          />
        </div>
      )}

      {/* ── STEP 3: Details ── */}
      {step === 'DETAILS' && (
        <div className="animate-fade-up">
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
            {goalDef?.label ?? 'Obiettivo'}
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-8" style={{ color: 'var(--fg-primary)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.05em' }}>
            Durata e logistica
          </h2>

          {/* Timeline */}
          <div className="mb-7">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
              <Calendar className="w-3 h-3 inline mr-1" />Durata del Ciclo
            </p>
            <div className="flex gap-2 flex-wrap">
              {TIMELINES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTimeline(t.value)}
                  className="transition-all"
                  style={{
                    padding: '10px 16px', borderRadius: '12px',
                    background: timeline === t.value
                      ? 'var(--accent)'
                      : 'var(--bg-elevated)',
                    border: `1px solid ${timeline === t.value ? 'var(--accent)' : 'var(--border-default)'}`,
                    color: timeline === t.value ? 'var(--accent-on)' : 'var(--fg-muted)',
                    cursor: 'pointer',
                    fontSize: '12px', fontWeight: 800,
                    boxShadow: timeline === t.value ? '0 4px 12px var(--glow-accent)' : 'none',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 900, fontFamily: "'Sora', sans-serif" }}>{t.label}</span>
                  <span style={{ display: 'block', fontSize: '9px', opacity: 0.7, fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="mb-7">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
              <Clock className="w-3 h-3 inline mr-1" />Durata sessione
            </p>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className="transition-all"
                  style={{
                    padding: '12px 18px', borderRadius: '12px',
                    background: duration === d.value ? 'var(--accent)' : 'var(--bg-elevated)',
                    border: `1px solid ${duration === d.value ? 'var(--accent)' : 'var(--border-default)'}`,
                    color: duration === d.value ? 'var(--accent-on)' : 'var(--fg-muted)',
                    cursor: 'pointer',
                    fontSize: '13px', fontWeight: 900,
                    fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em',
                    boxShadow: duration === d.value ? '0 4px 12px var(--glow-accent)' : 'none',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          <div className="space-y-4 mb-7 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
              Opzionale
            </p>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                Evento / Gara in programma
              </label>
              <input
                type="text"
                value={event}
                onChange={e => setEvent(e.target.value)}
                placeholder="es. Maratona di Milano, 15 aprile"
                className="w-full h-11 px-4 rounded-2xl text-sm font-medium outline-none transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid var(--border-default)',
                  color: 'var(--fg-primary)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                Limitazioni / Infortuni
              </label>
              <input
                type="text"
                value={injuries}
                onChange={e => setInjuries(e.target.value)}
                placeholder="es. Dolore al ginocchio sinistro, lombalgia"
                className="w-full h-11 px-4 rounded-2xl text-sm font-medium outline-none transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid var(--border-default)',
                  color: 'var(--fg-primary)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-3 p-4 rounded-2xl mb-5"
              style={{
                background: 'color-mix(in srgb, var(--negative) 8%, var(--bg-elevated))',
                border: '1px solid color-mix(in srgb, var(--negative) 20%, transparent)',
              }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--negative)' }} />
              <p className="text-sm" style={{ color: 'var(--negative)' }}>{error}</p>
            </div>
          )}

          <NavButtons
            onBack={() => setStep('GOAL')}
            onNext={handleGenerate}
            nextLabel="Genera Piano"
            disabled={!timeline || !duration}
          />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Navigation buttons
// ─────────────────────────────────────────────────────────────────────────────

function NavButtons({
  onBack, onNext, nextLabel = 'Continua', disabled, loading,
}: {
  onBack?: () => void; onNext: () => void; nextLabel?: string;
  disabled?: boolean; loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all hover:-translate-x-0.5"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--fg-muted)',
          }}
        >
          <ChevronLeft className="w-4 h-4" /> Indietro
        </button>
      ) : <div />}

      <button
        type="button"
        onClick={onNext}
        disabled={disabled || loading}
        className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-0.5 active:scale-95"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-on)',
          boxShadow: disabled ? 'none' : '0 4px 16px var(--glow-accent)',
        }}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {nextLabel} {!loading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  )
}

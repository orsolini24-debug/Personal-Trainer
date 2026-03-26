'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dumbbell, Zap, Target, Activity, BarChart2, Trophy,
  Clock, Calendar, Loader2, CheckCircle2, Sparkles, AlertCircle, ArrowRight,
} from 'lucide-react'
import { createNewPlanForExistingUser, type NewPlanInput } from '@/app/actions/plan-create'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'FORM' | 'GENERATING' | 'DONE'

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

  const [step, setStep] = useState<Step>('FORM')
  const [planType, setPlanType] = useState<'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY'>('TRAINING_ONLY')
  const [goal, setGoal] = useState<string>('')
  const [timeline, setTimeline] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [event, setEvent] = useState('')
  const [injuries, setInjuries] = useState('')
  const [error, setError] = useState<string | null>(null)

  const goalDef    = GOALS.find(g => g.value === goal)
  const planTypeDef = PLAN_TYPES.find(t => t.id === planType)

  const handleGenerate = async () => {
    if (!goal || !timeline || !duration) return
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
      setStep('FORM')
      return
    }
    setStep('DONE')
    setTimeout(() => router.refresh(), 800)
  }

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

  return (
    <div className="max-w-5xl mx-auto animate-page">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-[2rem] border border-border p-6 md:p-8 bg-surface">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-accent mb-2">Plan Studio</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary mb-2">
            Crea il prossimo piano in 90 secondi
          </h2>
          <p className="text-sm text-fg-muted mb-8">
            Flusso semplificato: scegli il tipo, imposta focus e durata, genera subito.
          </p>

          <div className="space-y-7">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-fg-subtle mb-3">Tipo piano</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PLAN_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPlanType(t.id)}
                    className="text-left rounded-2xl border p-4 transition-all"
                    style={{
                      background: planType === t.id ? `color-mix(in srgb, ${t.color} 12%, var(--bg-elevated))` : 'var(--bg-elevated)',
                      borderColor: planType === t.id ? t.color : 'var(--border-default)',
                    }}
                  >
                    <p className="text-xl mb-2">{t.emoji}</p>
                    <p className="text-sm font-black text-primary">{t.label}</p>
                    <p className="text-[11px] text-fg-muted mt-1">{t.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-fg-subtle mb-3">Obiettivo</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GOALS.map((g) => {
                  const Icon = g.icon
                  const selected = goal === g.value
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGoal(g.value)}
                      className="rounded-2xl border p-4 text-left transition-all"
                      style={{
                        background: selected ? `color-mix(in srgb, ${g.color} 12%, var(--bg-elevated))` : 'var(--bg-elevated)',
                        borderColor: selected ? g.color : 'var(--border-default)',
                      }}
                    >
                      <Icon className="w-5 h-5 mb-2" style={{ color: selected ? g.color : 'var(--fg-muted)' }} />
                      <p className="text-sm font-black text-primary">{g.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-fg-subtle mb-3"><Calendar className="w-3 h-3 inline mr-1" />Durata ciclo</p>
                <div className="flex flex-wrap gap-2">
                  {TIMELINES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTimeline(t.value)}
                      className="px-3 py-2 rounded-xl border text-xs font-black transition-all"
                      style={{
                        background: timeline === t.value ? 'var(--accent)' : 'var(--bg-elevated)',
                        borderColor: timeline === t.value ? 'var(--accent)' : 'var(--border-default)',
                        color: timeline === t.value ? 'var(--accent-on)' : 'var(--fg-muted)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-fg-subtle mb-3"><Clock className="w-3 h-3 inline mr-1" />Durata sessione</p>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDuration(d.value)}
                      className="px-3 py-2 rounded-xl border text-xs font-black transition-all"
                      style={{
                        background: duration === d.value ? 'var(--accent)' : 'var(--bg-elevated)',
                        borderColor: duration === d.value ? 'var(--accent)' : 'var(--border-default)',
                        color: duration === d.value ? 'var(--accent-on)' : 'var(--fg-muted)',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <input
                type="text"
                value={event}
                onChange={e => setEvent(e.target.value)}
                placeholder="Evento / gara (opzionale)"
                className="w-full h-11 px-4 rounded-2xl text-sm font-medium outline-none transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
              />
              <input
                type="text"
                value={injuries}
                onChange={e => setInjuries(e.target.value)}
                placeholder="Limitazioni / infortuni (opzionale)"
                className="w-full h-11 px-4 rounded-2xl text-sm font-medium outline-none transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl"
                style={{
                  background: 'color-mix(in srgb, var(--negative) 8%, var(--bg-elevated))',
                  border: '1px solid color-mix(in srgb, var(--negative) 20%, transparent)',
                }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--negative)' }} />
                <p className="text-sm" style={{ color: 'var(--negative)' }}>{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!goal || !timeline || !duration}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
            >
              Genera Piano
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-border p-6 bg-elevated h-fit">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-subtle mb-4">Anteprima</p>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface border border-border">
              <p className="text-xs text-fg-subtle uppercase font-black mb-1">Tipo</p>
              <p className="text-sm font-black text-primary">{planTypeDef?.emoji} {planTypeDef?.label}</p>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-border">
              <p className="text-xs text-fg-subtle uppercase font-black mb-1">Focus</p>
              <p className="text-sm font-black text-primary">{goalDef?.label || 'Seleziona obiettivo'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-surface border border-border">
                <p className="text-xs text-fg-subtle uppercase font-black mb-1">Ciclo</p>
                <p className="text-sm font-black text-primary">{timeline ? `${timeline} sett.` : '--'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-border">
                <p className="text-xs text-fg-subtle uppercase font-black mb-1">Sessione</p>
                <p className="text-sm font-black text-primary">{duration ? `${duration} min` : '--'}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

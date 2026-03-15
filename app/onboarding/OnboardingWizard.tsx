'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding, type OnboardingData } from '@/app/actions/onboarding'
import {
  User, Dumbbell, Target, Calendar, Shield,
  ChevronRight, ChevronLeft, Check, Loader2, Brain,
} from 'lucide-react'

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Anagrafica',  icon: User     },
  { id: 2, label: 'Esperienza', icon: Dumbbell  },
  { id: 3, label: 'Obiettivi',  icon: Target    },
  { id: 4, label: 'Logistica',  icon: Calendar  },
  { id: 5, label: 'Salute',     icon: Shield    },
]

const GOALS = [
  { value: 'HYPERTROPHY',        label: 'Ipertrofia',               desc: 'Aumentare massa muscolare' },
  { value: 'STRENGTH',           label: 'Forza',                    desc: 'Aumentare i carichi massimali' },
  { value: 'WEIGHT_LOSS',        label: 'Perdita peso',             desc: 'Ridurre il grasso corporeo' },
  { value: 'RECOMP',             label: 'Recomposizione',           desc: 'Perdere grasso e aumentare muscolo' },
  { value: 'PERFORMANCE',        label: 'Performance sportiva',     desc: 'Migliorare in uno sport specifico' },
  { value: 'RETURN_FROM_INJURY', label: 'Rientro da infortunio',   desc: 'Recupero sicuro e progressivo' },
]

const SPORTS = ['Corsa', 'Ciclismo', 'Nuoto', 'Hyrox', 'CrossFit', 'Arrampicata', 'Alpinismo', 'Calcio', 'Tennis', 'Triathlon', 'Sci']
const EQUIPMENT = [
  { value: 'FULL_GYM',      label: 'Palestra completa',  desc: 'Bilanciere, macchine, cavi, tutto' },
  { value: 'HOME_GYM',      label: 'Home gym',           desc: 'Manubri, kettlebell, elastici' },
  { value: 'BODYWEIGHT_ONLY', label: 'Solo corpo libero', desc: 'Nessun attrezzo' },
]
const SPLITS = [
  { value: 'UPPER_LOWER',     label: 'Upper/Lower',        desc: '4 giorni, upper + lower' },
  { value: 'PUSH_PULL_LEGS',  label: 'Push/Pull/Legs',     desc: '6 giorni, classico PPL' },
  { value: 'FULL_BODY',       label: 'Full Body',          desc: '3 giorni, tutto il corpo' },
  { value: 'CUSTOM',          label: 'Lascia decidere al coach', desc: 'Il piano AI sceglie il meglio per te' },
]
const DIETS = ['Vegetariano', 'Vegano', 'Senza lattosio', 'Senza glutine', 'Halal', 'Kosher']
const SUPPLEMENTS = ['Creatina', 'Proteine in polvere', 'Caffeina / pre-workout', 'BCAA', 'Omega-3', 'Vitamina D', 'Magnesio', 'Beta-alanina']

// ── Initial state ─────────────────────────────────────────────────────────────
const INITIAL: OnboardingData = {
  biologicalSex: '', ageYears: 25, weightKg: 75, heightCm: 175,
  experienceLevel: '', trainingYears: 1,
  strengthRefs: {},
  primaryGoal: '', secondarySports: [], targetEvent: '',
  availableDays: 4, sessionDuration: 60, equipmentLevel: '', preferredSplit: '',
  injuriesList: [], dietaryRestrictions: [], supplementsUsed: [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Card({ children, selected, onClick }: { children: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-2xl transition-all"
      style={{
        background: selected ? 'var(--accent-dim)' : 'var(--bg-surface)',
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-default)'}`,
        color: 'var(--fg-primary)',
      }}
    >
      {children}
    </button>
  )
}

function NumberInput({ label, value, onChange, min, max, unit }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit: string
}) {
  return (
    <div>
      <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
        >-</button>
        <div
          className="flex-1 h-9 rounded-xl flex items-center justify-center font-black"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
        >
          {value} <span className="text-xs font-medium ml-1" style={{ color: 'var(--fg-subtle)' }}>{unit}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
        >+</button>
      </div>
    </div>
  )
}

function TagInput({ label, value, options, onChange }: {
  label: string; value: string[]; options: string[]; onChange: (v: string[]) => void
}) {
  return (
    <div>
      <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = value.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? value.filter(v => v !== opt) : [...value, opt])}
              className="px-3 py-1.5 rounded-xl text-sm font-bold transition"
              style={{
                background: active ? 'var(--accent)' : 'var(--bg-surface)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
                color: active ? 'var(--accent-on, white)' : 'var(--fg-muted)',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TextListInput({ label, value, onChange, placeholder }: {
  label: string; value: string[]; onChange: (v: string[]) => void; placeholder: string
}) {
  const [text, setText] = useState('')
  const add = () => {
    if (!text.trim()) return
    onChange([...value, text.trim()])
    setText('')
  }
  return (
    <div>
      <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 rounded-xl text-sm font-bold"
          style={{ background: 'var(--accent)', color: 'var(--accent-on, white)' }}
        >
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="ml-1 opacity-60 hover:opacity-100"
            >×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export default function OnboardingWizard({ userName }: { userName?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData(d => ({ ...d, [key]: value }))

  const setRef = (key: keyof typeof data.strengthRefs, value: number) =>
    setData(d => ({ ...d, strengthRefs: { ...d.strengthRefs, [key]: value || undefined } }))

  const canAdvance = () => {
    if (step === 1) return data.biologicalSex !== '' && data.ageYears > 0 && data.weightKg > 0 && data.heightCm > 0
    if (step === 2) return data.experienceLevel !== ''
    if (step === 3) return data.primaryGoal !== ''
    if (step === 4) return data.availableDays > 0 && data.equipmentLevel !== '' && data.preferredSplit !== ''
    return true
  }

  const handleFinish = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await completeOnboarding(data)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      router.push('/plan')
    } catch (e) {
      setError('Errore imprevisto. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))' }}
          >
            PE
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: 'var(--fg-primary)' }}>Performance Ecosystem</p>
            <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--fg-subtle)', letterSpacing: '0.15em' }}>
              Setup Profilo
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: step > s.id ? '#10b981' : step === s.id ? 'var(--accent)' : 'var(--bg-surface)',
                  border: `2px solid ${step >= s.id ? (step > s.id ? '#10b981' : 'var(--accent)') : 'var(--border-default)'}`,
                }}
              >
                {step > s.id
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <span className="text-[10px] font-black" style={{ color: step === s.id ? 'white' : 'var(--fg-subtle)' }}>{s.id}</span>
                }
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 rounded-full" style={{ background: step > s.id ? '#10b981' : 'var(--bg-elevated)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 space-y-5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          {/* Step title */}
          <div>
            <p className="text-xs font-black uppercase mb-1" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>
              Step {step} di {STEPS.length}
            </p>
            <h2 className="text-xl font-black" style={{ color: 'var(--fg-primary)' }}>
              {step === 1 && `Ciao${userName ? ` ${userName}` : ''}! Parlami di te`}
              {step === 2 && 'La tua esperienza in palestra'}
              {step === 3 && 'Cosa vuoi raggiungere?'}
              {step === 4 && 'Organizzazione allenamento'}
              {step === 5 && 'Salute e alimentazione'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
              {step === 1 && 'Questi dati permettono al coach AI di calcolare i tuoi fabbisogni reali'}
              {step === 2 && 'Il piano sarà calibrato sulla tua forza attuale, non su valori generici'}
              {step === 3 && 'Ogni esercizio, volume e progressione saranno orientati al tuo obiettivo'}
              {step === 4 && 'Il piano si adatta alle tue possibilità reali, non a quelle ideali'}
              {step === 5 && 'Infortuni e alimentazione cambiano completamente la programmazione'}
            </p>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
                  Sesso biologico
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: 'MALE', l: 'Uomo' }, { v: 'FEMALE', l: 'Donna' }].map(o => (
                    <Card key={o.v} selected={data.biologicalSex === o.v} onClick={() => set('biologicalSex', o.v)}>
                      <span className="font-bold text-sm">{o.l}</span>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Età" value={data.ageYears} onChange={v => set('ageYears', v)} min={14} max={80} unit="anni" />
                <NumberInput label="Peso" value={data.weightKg} onChange={v => set('weightKg', v)} min={40} max={200} unit="kg" />
              </div>
              <NumberInput label="Altezza" value={data.heightCm} onChange={v => set('heightCm', v)} min={140} max={220} unit="cm" />
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
                  Livello esperienza
                </label>
                <div className="space-y-2">
                  {[
                    { v: 'BEGINNER',     l: 'Principiante',   d: 'Meno di 1 anno in palestra' },
                    { v: 'INTERMEDIATE', l: 'Intermedio',      d: '1-4 anni, progressi regolari' },
                    { v: 'ADVANCED',     l: 'Avanzato',        d: '4+ anni, vicino al potenziale genetico' },
                  ].map(o => (
                    <Card key={o.v} selected={data.experienceLevel === o.v} onClick={() => set('experienceLevel', o.v)}>
                      <p className="font-bold text-sm">{o.l}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{o.d}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <NumberInput label="Anni di allenamento" value={data.trainingYears} onChange={v => set('trainingYears', v)} min={0} max={40} unit="anni" />
              <div>
                <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
                  Forza attuale (stima 1RM, lascia 0 se non sai)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'squat1RM' as const, label: 'Squat' },
                    { key: 'bench1RM' as const, label: 'Panca' },
                    { key: 'deadlift1RM' as const, label: 'Stacco' },
                    { key: 'ohp1RM' as const, label: 'Military Press' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--fg-subtle)' }}>{label} (kg)</label>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={data.strengthRefs[key] ?? ''}
                        onChange={e => setRef(key, Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
                  Obiettivo principale
                </label>
                <div className="space-y-2">
                  {GOALS.map(g => (
                    <Card key={g.value} selected={data.primaryGoal === g.value} onClick={() => set('primaryGoal', g.value)}>
                      <p className="font-bold text-sm">{g.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{g.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <TagInput
                label="Sport / attività secondarie (opzionale)"
                value={data.secondarySports}
                options={SPORTS}
                onChange={v => set('secondarySports', v)}
              />
              <div>
                <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
                  Evento / gara target (opzionale)
                </label>
                <input
                  type="text"
                  value={data.targetEvent ?? ''}
                  onChange={e => set('targetEvent', e.target.value)}
                  placeholder="es. Hyrox Milano, Maratona Roma, Campionato regionale..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
                />
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Giorni/settimana" value={data.availableDays} onChange={v => set('availableDays', v)} min={2} max={7} unit="gg" />
                <NumberInput label="Durata sessione" value={data.sessionDuration} onChange={v => set('sessionDuration', v)} min={30} max={180} unit="min" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
                  Attrezzatura disponibile
                </label>
                <div className="space-y-2">
                  {EQUIPMENT.map(e => (
                    <Card key={e.value} selected={data.equipmentLevel === e.value} onClick={() => set('equipmentLevel', e.value)}>
                      <p className="font-bold text-sm">{e.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{e.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
                  Split preferito
                </label>
                <div className="space-y-2">
                  {SPLITS.map(s => (
                    <Card key={s.value} selected={data.preferredSplit === s.value} onClick={() => set('preferredSplit', s.value)}>
                      <p className="font-bold text-sm">{s.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{s.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5 ── */}
          {step === 5 && (
            <div className="space-y-4">
              <TextListInput
                label="Infortuni / limitazioni fisiche"
                value={data.injuriesList}
                onChange={v => set('injuriesList', v)}
                placeholder="es. Ernia L4-L5, spalla destra, ginocchio SX..."
              />
              <TagInput
                label="Restrizioni alimentari"
                value={data.dietaryRestrictions}
                options={DIETS}
                onChange={v => set('dietaryRestrictions', v)}
              />
              <TagInput
                label="Supplementi che usi già"
                value={data.supplementsUsed}
                options={SUPPLEMENTS}
                onChange={v => set('supplementsUsed', v)}
              />

              {/* Preview TDEE */}
              {data.weightKg > 0 && data.heightCm > 0 && data.ageYears > 0 && data.biologicalSex && (
                <div
                  className="p-3 rounded-2xl text-xs"
                  style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--fg-muted)' }}
                >
                  <p className="font-black mb-1" style={{ color: 'var(--accent)' }}>
                    <Brain className="w-3 h-3 inline mr-1" />
                    Anteprima calcoli
                  </p>
                  <p>Il coach genererà un piano specifico per te. L'AI userà tutti i dati inseriti per creare esercizi, progressioni settimana per settimana, e target nutrizionali giornalieri personalizzati.</p>
                </div>
              )}

              {error && (
                <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{error}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
              >
                <ChevronLeft className="w-4 h-4" />
                Indietro
              </button>
            )}
            <button
              type="button"
              disabled={!canAdvance() || loading}
              onClick={() => step < 5 ? setStep(s => s + 1) : handleFinish()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition"
              style={{
                background: canAdvance() && !loading ? 'var(--accent)' : 'var(--bg-elevated)',
                color: canAdvance() && !loading ? 'var(--accent-on, white)' : 'var(--fg-subtle)',
                border: '1px solid transparent',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Il coach sta costruendo il tuo piano…
                </>
              ) : step === 5 ? (
                <>
                  <Brain className="w-4 h-4" />
                  Genera il mio piano AI
                </>
              ) : (
                <>
                  Continua
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--fg-subtle)' }}>
          Puoi modificare questi dati in qualsiasi momento dalle impostazioni
        </p>
      </div>
    </div>
  )
}

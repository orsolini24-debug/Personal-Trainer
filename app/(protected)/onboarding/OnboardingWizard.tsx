'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding, type OnboardingData } from '@/app/actions/onboarding'
import {
  User, Dumbbell, Target, Calendar, Shield,
  ChevronRight, ChevronLeft, Check, Loader2, Brain,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Anagrafica', icon: User },
  { id: 2, label: 'Esperienza', icon: Dumbbell },
  { id: 3, label: 'Obiettivi',  icon: Target },
  { id: 4, label: 'Logistica',  icon: Calendar },
  { id: 5, label: 'Salute',     icon: Shield },
]

const GOALS = [
  { value: 'HYPERTROPHY',        label: 'Ipertrofia',             desc: 'Aumentare massa muscolare' },
  { value: 'STRENGTH',           label: 'Forza',                  desc: 'Aumentare i carichi massimali' },
  { value: 'WEIGHT_LOSS',        label: 'Perdita peso',           desc: 'Ridurre il grasso corporeo' },
  { value: 'RECOMP',             label: 'Ricomposizione',         desc: 'Perdere grasso e costruire muscolo' },
  { value: 'PERFORMANCE',        label: 'Performance sportiva',   desc: 'Migliorare in uno sport specifico' },
  { value: 'RETURN_FROM_INJURY', label: 'Rientro da infortunio', desc: 'Recupero sicuro e progressivo' },
]
const SPORTS = ['Corsa', 'Ciclismo', 'Nuoto', 'Hyrox', 'CrossFit', 'Arrampicata', 'Alpinismo', 'Calcio', 'Tennis', 'Triathlon', 'Sci']
const EQUIPMENT = [
  { value: 'FULL_GYM',       label: 'Palestra completa',  desc: 'Bilanciere, macchine, cavi, tutto' },
  { value: 'HOME_GYM',       label: 'Home gym',           desc: 'Manubri, kettlebell, elastici' },
  { value: 'BODYWEIGHT_ONLY', label: 'Solo corpo libero', desc: 'Nessun attrezzo' },
]
const SPLITS = [
  { value: 'UPPER_LOWER',    label: 'Upper/Lower',              desc: '4 giorni, upper + lower' },
  { value: 'PUSH_PULL_LEGS', label: 'Push/Pull/Legs',           desc: '6 giorni, classico PPL' },
  { value: 'FULL_BODY',      label: 'Full Body',                desc: '3 giorni, tutto il corpo' },
  { value: 'CUSTOM',         label: 'Lascia decidere al coach', desc: "L'AI sceglie il miglior split per te" },
]
const DIETS = ['Vegetariano', 'Vegano', 'Senza lattosio', 'Senza glutine', 'Halal']
const SUPPLEMENTS = ['Creatina', 'Proteine in polvere', 'Caffeina/pre-workout', 'BCAA', 'Omega-3', 'Vitamina D', 'Magnesio']

const INITIAL: OnboardingData = {
  biologicalSex: '', ageYears: 25, weightKg: 75, heightCm: 175,
  experienceLevel: '', trainingYears: 1, strengthRefs: {},
  primaryGoal: '', secondarySports: [], targetEvent: '',
  availableDays: 4, sessionDuration: 60, equipmentLevel: '', preferredSplit: '',
  injuriesList: [], dietaryRestrictions: [], supplementsUsed: [],
}

function SelectCard({ label, desc, selected, onClick }: { label: string; desc?: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left px-4 py-3 rounded-2xl transition-all"
      style={{ background: selected ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-default)'}` }}>
      <p className="font-bold text-sm" style={{ color: selected ? 'var(--accent)' : 'var(--fg-primary)' }}>{label}</p>
      {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{desc}</p>}
    </button>
  )
}

function NumInput({ label, value, onChange, min, max, unit }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase mb-1.5" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>−</button>
        <div className="flex-1 h-9 rounded-xl flex items-center justify-center font-black" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <span style={{ color: 'var(--fg-primary)' }}>{value}</span>
          <span className="text-xs ml-1" style={{ color: 'var(--fg-subtle)' }}>{unit}</span>
        </div>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>+</button>
      </div>
    </div>
  )
}

function Chips({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = selected.includes(o)
        return (
          <button key={o} type="button" onClick={() => onChange(on ? selected.filter(s => s !== o) : [...selected, o])}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
            style={{ background: on ? 'var(--accent)' : 'var(--bg-elevated)', border: `1px solid ${on ? 'var(--accent)' : 'var(--border-default)'}`, color: on ? 'var(--accent-on, #fff)' : 'var(--fg-muted)' }}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

function TextList({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState('')
  const add = () => { if (!text.trim()) return; onChange([...value, text.trim()]); setText('') }
  return (
    <div>
      <p className="text-[10px] font-black uppercase mb-1.5" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>{label}</p>
      <div className="flex gap-2 mb-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder} className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }} />
        <button type="button" onClick={add} className="px-3 py-2 rounded-xl text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--accent-on, #fff)' }}>+</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>
            {v}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100">×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function OnboardingWizard({ userName }: { userName?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => setData(d => ({ ...d, [k]: v }))
  const setRef = (k: keyof typeof data.strengthRefs, v: number) => setData(d => ({ ...d, strengthRefs: { ...d.strengthRefs, [k]: v || undefined } }))

  const canAdvance = () => {
    if (step === 1) return data.biologicalSex && data.ageYears > 0 && data.weightKg > 0 && data.heightCm > 0
    if (step === 2) return !!data.experienceLevel
    if (step === 3) return !!data.primaryGoal
    if (step === 4) return data.availableDays > 0 && !!data.equipmentLevel && !!data.preferredSplit
    return true
  }

  const finish = async () => {
    setLoading(true); setError('')
    try {
      const res = await completeOnboarding(data)
      if ('error' in res && res.error) { setError(res.error); return }
      router.push('/plan')
      router.refresh()
    } catch { setError('Errore imprevisto. Riprova.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 absolute inset-0 z-[100]" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))' }}>PE</div>
          <div>
            <p className="font-black text-sm" style={{ color: 'var(--fg-primary)' }}>Performance Ecosystem</p>
            <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--fg-subtle)', letterSpacing: '0.15em' }}>Setup Profilo</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{ background: step > s.id ? '#10b981' : step === s.id ? 'var(--accent)' : 'var(--bg-surface)', border: `2px solid ${step >= s.id ? (step > s.id ? '#10b981' : 'var(--accent)') : 'var(--border-default)'}` }}>
                {step > s.id
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <span className="text-[10px] font-black" style={{ color: step === s.id ? 'white' : 'var(--fg-subtle)' }}>{s.id}</span>}
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-0.5 rounded-full" style={{ background: step > s.id ? '#10b981' : 'var(--bg-elevated)' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 space-y-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div>
            <p className="text-xs font-black uppercase mb-1" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>Step {step} di {STEPS.length}</p>
            <h2 className="text-xl font-black" style={{ color: 'var(--fg-primary)' }}>
              {step === 1 && `Ciao${userName ? ` ${userName}` : ''}! Parlami di te`}
              {step === 2 && 'La tua esperienza in palestra'}
              {step === 3 && 'Cosa vuoi raggiungere?'}
              {step === 4 && 'Organizzazione allenamento'}
              {step === 5 && 'Salute e alimentazione'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
              {step === 1 && 'Il coach AI calcola metabolismo, TDEE e fabbisogni reali dai tuoi dati'}
              {step === 2 && 'Volume, selezione esercizi e carichi saranno calibrati sulla tua forza attuale'}
              {step === 3 && 'Ogni esercizio, progressione e macro nutrizionali saranno orientati al tuo obiettivo'}
              {step === 4 && 'Il piano si adatta alla tua realtà, non a quella ideale'}
              {step === 5 && 'Infortuni e alimentazione cambiano radicalmente la programmazione'}
            </p>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>Sesso biologico</p>
                <div className="grid grid-cols-2 gap-2">
                  <SelectCard label="Uomo" selected={data.biologicalSex === 'MALE'} onClick={() => set('biologicalSex', 'MALE')} />
                  <SelectCard label="Donna" selected={data.biologicalSex === 'FEMALE'} onClick={() => set('biologicalSex', 'FEMALE')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Età" value={data.ageYears} onChange={v => set('ageYears', v)} min={14} max={80} unit="anni" />
                <NumInput label="Peso" value={data.weightKg} onChange={v => set('weightKg', v)} min={40} max={200} unit="kg" />
              </div>
              <NumInput label="Altezza" value={data.heightCm} onChange={v => set('heightCm', v)} min={140} max={220} unit="cm" />
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  { v: 'BEGINNER',     l: 'Principiante',   d: 'Meno di 1 anno, o primo approccio strutturato' },
                  { v: 'INTERMEDIATE', l: 'Intermedio',      d: '1-4 anni con progressi continui' },
                  { v: 'ADVANCED',     l: 'Avanzato',        d: '4+ anni, vicino al potenziale genetico' },
                ].map(o => <SelectCard key={o.v} label={o.l} desc={o.d} selected={data.experienceLevel === o.v} onClick={() => set('experienceLevel', o.v)} />)}
              </div>
              <NumInput label="Anni di allenamento" value={data.trainingYears} onChange={v => set('trainingYears', v)} min={0} max={40} unit="anni" />
              <div>
                <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>Stima 1RM (lascia 0 se non sai)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ k: 'squat1RM' as const, l: 'Squat' }, { k: 'bench1RM' as const, l: 'Panca' }, { k: 'deadlift1RM' as const, l: 'Stacco' }, { k: 'ohp1RM' as const, l: 'Military Press' }].map(({ k, l }) => (
                    <div key={k}>
                      <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--fg-subtle)' }}>{l} (kg)</p>
                      <input type="number" min={0} max={500} value={data.strengthRefs[k] ?? ''} onChange={e => setRef(k, Number(e.target.value))} placeholder="0"
                        className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {GOALS.map(g => <SelectCard key={g.value} label={g.label} desc={g.desc} selected={data.primaryGoal === g.value} onClick={() => set('primaryGoal', g.value)} />)}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>Sport / attività secondarie</p>
                <Chips options={SPORTS} selected={data.secondarySports} onChange={v => set('secondarySports', v)} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase mb-1.5" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>Evento / gara target (opzionale)</p>
                <input type="text" value={data.targetEvent ?? ''} onChange={e => set('targetEvent', e.target.value)}
                  placeholder="es. Hyrox Milano, Maratona Roma..." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }} />
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Giorni/settimana" value={data.availableDays} onChange={v => set('availableDays', v)} min={2} max={7} unit="gg" />
                <NumInput label="Durata sessione" value={data.sessionDuration} onChange={v => set('sessionDuration', v)} min={30} max={180} unit="min" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>Attrezzatura disponibile</p>
                <div className="space-y-2">{EQUIPMENT.map(e => <SelectCard key={e.value} label={e.label} desc={e.desc} selected={data.equipmentLevel === e.value} onClick={() => set('equipmentLevel', e.value)} />)}</div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>Split preferito</p>
                <div className="space-y-2">{SPLITS.map(s => <SelectCard key={s.value} label={s.label} desc={s.desc} selected={data.preferredSplit === s.value} onClick={() => set('preferredSplit', s.value)} />)}</div>
              </div>
            </div>
          )}

          {/* ── STEP 5 ── */}
          {step === 5 && (
            <div className="space-y-4">
              <TextList label="Infortuni / limitazioni fisiche" value={data.injuriesList} onChange={v => set('injuriesList', v)} placeholder="es. Ernia L4-L5, spalla dx, LCA SX..." />
              <div>
                <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>Restrizioni alimentari</p>
                <Chips options={DIETS} selected={data.dietaryRestrictions} onChange={v => set('dietaryRestrictions', v)} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>Supplementi già in uso</p>
                <Chips options={SUPPLEMENTS} selected={data.supplementsUsed} onChange={v => set('supplementsUsed', v)} />
              </div>
              <div className="p-3 rounded-2xl text-xs" style={{ background: 'var(--accent-dim)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--fg-muted)' }}>
                <p className="font-black mb-1" style={{ color: 'var(--accent)' }}>🧠 Cosa succede ora</p>
                <p>Il coach AI analizzerà il tuo profilo completo e genererà un mesociclo di 4 settimane con esercizi, progressioni, target nutrizionali giornalieri e protocollo supplementi — tutto calibrato su di te.</p>
              </div>
              {error && <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{error}</p>}
            </div>
          )}

          {/* Nav */}
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>
                <ChevronLeft className="w-4 h-4" />Indietro
              </button>
            )}
            <button type="button" disabled={!canAdvance() || loading}
              onClick={() => step < 5 ? setStep(s => s + 1) : finish()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition"
              style={{ background: canAdvance() && !loading ? 'var(--accent)' : 'var(--bg-elevated)', color: canAdvance() && !loading ? 'var(--accent-on, #fff)' : 'var(--fg-subtle)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Il coach sta costruendo il tuo piano…</>
                : step === 5 ? <><Brain className="w-4 h-4" />Genera il mio piano AI</>
                  : <>Continua<ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--fg-subtle)' }}>
          Puoi aggiornare questi dati in qualsiasi momento dalle impostazioni
        </p>
      </div>
    </div>
  )
}

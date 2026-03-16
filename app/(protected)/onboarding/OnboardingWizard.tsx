'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding, type OnboardingData } from '@/app/actions/onboarding'
import { ChevronRight, ChevronLeft, Check, Loader2, Brain } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const GOALS = [
  { value: 'HYPERTROPHY',        label: 'Ipertrofia',             desc: 'Aumentare massa muscolare' },
  { value: 'STRENGTH',           label: 'Forza massimale',        desc: 'Aumentare i carichi massimali' },
  { value: 'WEIGHT_LOSS',        label: 'Perdita peso',           desc: 'Ridurre il grasso corporeo' },
  { value: 'RECOMP',             label: 'Ricomposizione',         desc: 'Perdere grasso e costruire muscolo insieme' },
  { value: 'PERFORMANCE',        label: 'Performance sportiva',   desc: 'Migliorare in uno sport specifico' },
  { value: 'RETURN_FROM_INJURY', label: 'Rientro da infortunio', desc: 'Recupero sicuro e progressivo' },
]

const SPORT_OPTIONS = [
  { id: 'SOCCER',     label: 'Calcio',      icon: '⚽' },
  { id: 'PADEL',      label: 'Padel',       icon: '🎾' },
  { id: 'TENNIS',     label: 'Tennis',      icon: '🏸' },
  { id: 'RUNNING',    label: 'Corsa',       icon: '🏃' },
  { id: 'SWIMMING',   label: 'Nuoto',       icon: '🏊' },
  { id: 'CYCLING',    label: 'Ciclismo',    icon: '🚴' },
  { id: 'CROSSFIT',   label: 'CrossFit',    icon: '🏋️' },
  { id: 'HYROX',      label: 'Hyrox',       icon: '🔥' },
  { id: 'COMBAT',     label: 'Boxe/MMA',    icon: '🥊' },
  { id: 'BASKETBALL', label: 'Basket',      icon: '🏀' },
  { id: 'VOLLEYBALL', label: 'Pallavolo',   icon: '🏐' },
  { id: 'OTHER',      label: 'Altro sport', icon: '🎯' },
]

const EQUIPMENT = [
  { value: 'FULL_GYM',        label: 'Palestra completa', desc: 'Bilanciere, macchine, cavi, manubri' },
  { value: 'HOME_GYM',        label: 'Home gym',          desc: 'Manubri, kettlebell, elastici, sbarra' },
  { value: 'BODYWEIGHT_ONLY', label: 'Solo corpo libero', desc: 'Nessun attrezzo specifico' },
]

const SPLITS = [
  { value: 'UPPER_LOWER',    label: 'Upper / Lower',          desc: '4 sessioni — parte alta + bassa' },
  { value: 'PUSH_PULL_LEGS', label: 'Push / Pull / Legs',     desc: '6 sessioni — classico PPL' },
  { value: 'FULL_BODY',      label: 'Full Body',              desc: '3 sessioni — tutto il corpo' },
  { value: 'CUSTOM',         label: 'Lascia decidere al coach', desc: "L'AI sceglie il miglior split per te" },
]

const DIETS = ['Vegetariano', 'Vegano', 'Senza lattosio', 'Senza glutine', 'Halal', 'Kosher']
const SUPPS = ['Creatina', 'Proteine in polvere', 'Caffeina / pre-workout', 'BCAA', 'Omega-3', 'Vitamina D', 'Magnesio', 'Beta-alanina']

const INITIAL: OnboardingData = {
  biologicalSex: '', ageYears: 25, weightKg: 75, heightCm: 175,
  experienceLevel: '', trainingYears: 1, strengthRefs: {},
  primaryGoal: '', secondarySports: [], mainSports: [], sportLevels: {}, targetEvent: '',
  availableDays: 4, sessionDuration: 60, equipmentLevel: '', preferredSplit: 'CUSTOM',
  injuriesList: [], dietaryRestrictions: [], supplementsUsed: [],
}

// ── Small UI helpers ──────────────────────────────────────────────────────────

function Sel({ label, desc, active, onClick }: { label: string; desc?: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left p-3 rounded-2xl border transition-all"
      style={{
        background: active ? 'rgba(59,130,246,0.1)' : '#0a0a0f',
        border: `2px solid ${active ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
        color: active ? '#3b82f6' : '#94a3b8',
      }}>
      <p className="font-bold text-sm">{label}</p>
      {desc && <p className="text-xs mt-0.5" style={{ color: active ? '#60a5fa' : '#64748b' }}>{desc}</p>}
    </button>
  )
}

function NumStepper({ label, value, onChange, min, max, unit }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-xl font-bold text-xl flex items-center justify-center"
          style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>−</button>
        <div className="flex-1 h-10 rounded-xl flex items-center justify-center font-black"
          style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: '#f1f5f9' }}>{value}</span>
          <span className="text-xs ml-1" style={{ color: '#64748b' }}>{unit}</span>
        </div>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 rounded-xl font-bold text-xl flex items-center justify-center"
          style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>+</button>
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
            style={{
              background: on ? 'rgba(59,130,246,0.15)' : '#0a0a0f',
              border: `1px solid ${on ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
              color: on ? '#3b82f6' : '#64748b',
            }}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

function TextList({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [txt, setTxt] = useState('')
  const add = () => { if (!txt.trim()) return; onChange([...value, txt.trim()]); setTxt('') }
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>{label}</p>
      <div className="flex gap-2 mb-2">
        <input value={txt} onChange={e => setTxt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }} />
        <button type="button" onClick={add}
          className="px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: '#3b82f6', color: '#fff' }}>+</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
            {v}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100 ml-0.5">×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function OnboardingWizard({ userName }: { userName?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) =>
    setData(d => ({ ...d, [k]: v }))

  const setRef = (k: keyof typeof data.strengthRefs, v: number) =>
    setData(d => ({ ...d, strengthRefs: { ...d.strengthRefs, [k]: v || undefined } }))

  const toggleSport = (id: string) => {
    if (data.mainSports.includes(id)) {
      const lvls = { ...data.sportLevels }; delete lvls[id]
      setData(d => ({ ...d, mainSports: d.mainSports.filter(s => s !== id), sportLevels: lvls }))
    } else {
      setData(d => ({ ...d, mainSports: [...d.mainSports, id], sportLevels: { ...d.sportLevels, [id]: 'AMATEUR' } }))
    }
  }

  const canAdvance = () => {
    if (step === 1) return !!data.biologicalSex && data.ageYears > 0 && data.weightKg > 0 && data.heightCm > 0
    if (step === 2) return !!data.experienceLevel
    if (step === 3) return !!data.primaryGoal
    if (step === 4) return true // sport DNA opzionale
    if (step === 5) return data.availableDays > 0 && !!data.equipmentLevel && !!data.preferredSplit
    return true
  }

  const finish = async () => {
    setLoading(true); setError('')
    try {
      const res = await completeOnboarding(data)
      if ('error' in res && res.error) { setError(String(res.error)); return }
      router.push('/plan')
      router.refresh()
    } catch { setError('Errore imprevisto. Riprova.') }
    finally { setLoading(false) }
  }

  const TOTAL = 6

  return (
    <div className="min-h-screen flex items-center justify-center p-4 absolute inset-0 z-[100]"
      style={{ background: '#05050f', overflowY: 'auto' }}>
      <div className="w-full max-w-lg py-8">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>PE</div>
          <div>
            <p className="font-black text-sm" style={{ color: '#f1f5f9' }}>Performance Ecosystem</p>
            <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#475569' }}>Setup Profilo</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {Array.from({ length: TOTAL }, (_, i) => i + 1).map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: step > s ? '#10b981' : step === s ? '#3b82f6' : '#111118',
                  border: `2px solid ${step >= s ? (step > s ? '#10b981' : '#3b82f6') : 'rgba(255,255,255,0.08)'}`,
                }}>
                {step > s
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <span className="text-[10px] font-black" style={{ color: step === s ? '#fff' : '#475569' }}>{s}</span>}
              </div>
              {i < TOTAL - 1 && <div className="flex-1 h-0.5 rounded-full" style={{ background: step > s ? '#10b981' : 'rgba(255,255,255,0.05)' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 space-y-5" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.05)' }}>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#3b82f6' }}>
              Step {step} di {TOTAL}
            </p>
            <h2 className="text-xl font-black" style={{ color: '#f1f5f9' }}>
              {step === 1 && `Ciao${userName ? ` ${userName}` : ''}! Parlami di te`}
              {step === 2 && 'La tua esperienza'}
              {step === 3 && 'Cosa vuoi raggiungere?'}
              {step === 4 && 'Il tuo Sport DNA'}
              {step === 5 && 'Organizzazione allenamento'}
              {step === 6 && 'Salute e alimentazione'}
            </h2>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              {step === 1 && 'Questi dati permettono di calcolare il tuo metabolismo e personalizzare ogni aspetto del piano'}
              {step === 2 && 'Volume, selezione esercizi e progressione saranno calibrati sulla tua forza attuale'}
              {step === 3 && 'Ogni esercizio, macro e progressione saranno orientati a questo obiettivo'}
              {step === 4 && 'Gli sport che pratichi influenzano il volume, il recupero e la selezione degli esercizi (opzionale)'}
              {step === 5 && 'Il piano si adatta alle tue possibilità reali, non a quelle ideali'}
              {step === 6 && 'Infortuni e restrizioni alimentari cambiano radicalmente la programmazione'}
            </p>
          </div>

          {/* ── STEP 1: Anagrafica ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Sesso biologico</p>
                <div className="grid grid-cols-2 gap-2">
                  <Sel label="Uomo" active={data.biologicalSex === 'MALE'} onClick={() => set('biologicalSex', 'MALE')} />
                  <Sel label="Donna" active={data.biologicalSex === 'FEMALE'} onClick={() => set('biologicalSex', 'FEMALE')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumStepper label="Età" value={data.ageYears} onChange={v => set('ageYears', v)} min={14} max={80} unit="anni" />
                <NumStepper label="Peso" value={data.weightKg} onChange={v => set('weightKg', v)} min={40} max={200} unit="kg" />
              </div>
              <NumStepper label="Altezza" value={data.heightCm} onChange={v => set('heightCm', v)} min={140} max={220} unit="cm" />
            </div>
          )}

          {/* ── STEP 2: Esperienza ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Sel label="Principiante" desc="Meno di 1 anno, o primo approccio strutturato" active={data.experienceLevel === 'BEGINNER'} onClick={() => set('experienceLevel', 'BEGINNER')} />
                <Sel label="Intermedio" desc="1–4 anni con progressi regolari" active={data.experienceLevel === 'INTERMEDIATE'} onClick={() => set('experienceLevel', 'INTERMEDIATE')} />
                <Sel label="Avanzato" desc="4+ anni, vicino al potenziale genetico" active={data.experienceLevel === 'ADVANCED'} onClick={() => set('experienceLevel', 'ADVANCED')} />
              </div>
              <NumStepper label="Anni di allenamento" value={data.trainingYears} onChange={v => set('trainingYears', v)} min={0} max={40} unit="anni" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Stima 1RM (lascia 0 se non sai)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: 'squat1RM' as const, l: 'Squat' },
                    { k: 'bench1RM' as const, l: 'Panca' },
                    { k: 'deadlift1RM' as const, l: 'Stacco' },
                    { k: 'ohp1RM' as const, l: 'Military Press' },
                  ].map(({ k, l }) => (
                    <div key={k}>
                      <p className="text-[10px] font-bold mb-1" style={{ color: '#475569' }}>{l} (kg)</p>
                      <input type="number" min={0} max={500} value={data.strengthRefs[k] ?? ''}
                        onChange={e => setRef(k, Number(e.target.value))} placeholder="0"
                        className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none"
                        style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Obiettivi ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {GOALS.map(g => (
                  <Sel key={g.value} label={g.label} desc={g.desc} active={data.primaryGoal === g.value} onClick={() => set('primaryGoal', g.value)} />
                ))}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#64748b' }}>Evento / gara target (opzionale)</p>
                <input type="text" value={data.targetEvent ?? ''} onChange={e => set('targetEvent', e.target.value)}
                  placeholder="es. Hyrox Milano, Maratona Roma, Gara regionale..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }} />
              </div>
            </div>
          )}

          {/* ── STEP 4: Sport DNA ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {SPORT_OPTIONS.map(sport => {
                  const sel = data.mainSports.includes(sport.id)
                  return (
                    <div key={sport.id} className="space-y-1">
                      <button type="button" onClick={() => toggleSport(sport.id)}
                        className="w-full flex items-center gap-2 p-3 rounded-2xl border transition-all text-left"
                        style={{
                          background: sel ? 'rgba(16,185,129,0.1)' : '#0a0a0f',
                          border: `2px solid ${sel ? '#10b981' : 'rgba(255,255,255,0.05)'}`,
                          color: sel ? '#10b981' : '#64748b',
                        }}>
                        <span className="text-lg">{sport.icon}</span>
                        <span className="font-bold text-sm">{sport.label}</span>
                      </button>
                      {sel && (
                        <select value={data.sportLevels[sport.id] ?? 'AMATEUR'}
                          onChange={e => setData(d => ({ ...d, sportLevels: { ...d.sportLevels, [sport.id]: e.target.value } }))}
                          className="w-full rounded-lg p-1.5 text-[10px] font-bold outline-none"
                          style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                          <option value="AMATEUR">Amatoriale</option>
                          <option value="INTERMEDIATE">Intermedio</option>
                          <option value="COMPETITIVE">Agonista</option>
                          <option value="PRO">Professionista</option>
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
              {data.mainSports.length === 0 && (
                <p className="text-xs text-center" style={{ color: '#475569' }}>
                  Nessuno sport? Nessun problema — puoi saltare questo step.
                </p>
              )}
            </div>
          )}

          {/* ── STEP 5: Logistica ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <NumStepper label="Giorni/settimana" value={data.availableDays} onChange={v => set('availableDays', v)} min={2} max={7} unit="gg" />
                <NumStepper label="Durata sessione" value={data.sessionDuration} onChange={v => set('sessionDuration', v)} min={30} max={180} unit="min" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Attrezzatura disponibile</p>
                <div className="space-y-2">
                  {EQUIPMENT.map(e => <Sel key={e.value} label={e.label} desc={e.desc} active={data.equipmentLevel === e.value} onClick={() => set('equipmentLevel', e.value)} />)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Split preferito</p>
                <div className="space-y-2">
                  {SPLITS.map(s => <Sel key={s.value} label={s.label} desc={s.desc} active={data.preferredSplit === s.value} onClick={() => set('preferredSplit', s.value)} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 6: Salute e alimentazione ── */}
          {step === 6 && (
            <div className="space-y-4">
              <TextList label="Infortuni / limitazioni fisiche" value={data.injuriesList}
                onChange={v => set('injuriesList', v)} placeholder="es. Ernia L4-L5, ginocchio SX, spalla dx..." />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Restrizioni alimentari</p>
                <Chips options={DIETS} selected={data.dietaryRestrictions} onChange={v => set('dietaryRestrictions', v)} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Supplementi già in uso</p>
                <Chips options={SUPPS} selected={data.supplementsUsed} onChange={v => set('supplementsUsed', v)} />
              </div>
              <div className="p-3 rounded-2xl text-xs" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p className="font-black mb-1" style={{ color: '#3b82f6' }}>
                  <Brain className="w-3 h-3 inline mr-1" />
                  Cosa succede ora
                </p>
                <p style={{ color: '#94a3b8' }}>
                  Il coach AI analizzerà il tuo profilo e genererà un mesociclo di 4 settimane completo: esercizi, progressioni settimana per settimana, target nutrizionali giornalieri e protocollo supplementi.
                </p>
              </div>
              {error && <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm"
                style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                <ChevronLeft className="w-4 h-4" />
                Indietro
              </button>
            )}
            <button type="button" disabled={!canAdvance() || loading}
              onClick={() => step < TOTAL ? setStep(s => s + 1) : finish()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition"
              style={{
                background: canAdvance() && !loading ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.05)',
                color: canAdvance() && !loading ? '#fff' : '#475569',
                boxShadow: canAdvance() && !loading ? '0 0 20px rgba(59,130,246,0.3)' : 'none',
              }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Il coach sta costruendo il piano…</>
                : step === TOTAL
                  ? <><Brain className="w-4 h-4" />Genera il mio piano AI</>
                  : <>Continua<ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#334155' }}>
          Puoi aggiornare questi dati in qualsiasi momento dalle impostazioni
        </p>
      </div>
    </div>
  )
}

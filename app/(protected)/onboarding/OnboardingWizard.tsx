'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { completeDeepOnboarding, type DeepOnboardingData } from '@/app/actions/deep-onboarding'
import {
  User, Trophy, Activity, Utensils, Clock,
  ChevronRight, ChevronLeft, Scale, Target, 
  Dumbbell, Zap, Flame, Shield, Check, Loader2, ArrowRight, Calendar
} from 'lucide-react'
import { SportType } from '@prisma/client'

const STEPS = [
  { id: 1, label: 'BIO' },
  { id: 2, label: 'SPORT' },
  { id: 3, label: 'LIVELLO' },
  { id: 4, label: 'META' },
  { id: 5, label: 'FUEL' },
  { id: 6, label: 'LIFE' },
]

const SPORT_OPTIONS = [
  { value: 'PALESTRA', label: 'Palestra', icon: '🏋️' },
  { value: 'RUNNING', label: 'Corsa', icon: '🏃' },
  { value: 'PADEL', label: 'Padel', icon: '🎾' },
  { value: 'CROSSFIT', label: 'CrossFit', icon: '🔥' },
  { value: 'CALISTHENICS', label: 'Cali', icon: '🤸' },
  { value: 'SOCCER', label: 'Calcio', icon: '⚽' },
  { value: 'COMBAT', label: 'Combat', icon: '🥊' },
  { value: 'CYCLING', label: 'Bici', icon: '🚴' },
]

const INITIAL: DeepOnboardingData = {
  biologicalSex: '', ageYears: 25, weightKg: 75, heightCm: 175,
  hasProfessionalData: false,
  primarySport: 'PALESTRA', mainSports: [], sportLevels: {},
  experienceLevel: '', trainingYears: 1, strengthRefs: {},
  primaryGoal: '', isFollowingPlan: false,
  dietaryType: 'OMNIVORE', eatingRoutine: { mealsPerDay: 4, snacks: true, intermittentFasting: false },
  favoriteFoods: [], dislikedFoods: [], allergies: [], dailyRoutine: '',
  availableDays: 4, sessionDuration: 60, equipmentLevel: 'FULL_GYM',
  preferredSplit: 'CUSTOM', injuriesList: []
}

export default function OnboardingWizard({ userName, embedded = false }: { userName?: string, embedded?: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<DeepOnboardingData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  const set = <K extends keyof DeepOnboardingData>(k: K, v: DeepOnboardingData[K]) => {
    setData(d => ({ ...d, [k]: v }))
  }

  const handleComplete = async () => {
    setLoading(true)
    const res = await completeDeepOnboarding(data)
    setLoading(false)
    if (res.success) {
      if (embedded) {
        window.location.reload()
      } else {
        router.push('/plan')
        router.refresh()
      }
    } else {
      alert("Errore: " + res.error)
    }
  }

  if (!isMounted) return null

  const canProceed = () => {
    if (step === 1) return data.biologicalSex && data.weightKg > 0 && data.ageYears > 0
    if (step === 2) return !!data.primarySport
    if (step === 3) return !!data.experienceLevel
    if (step === 5) return !!data.dietaryType
    if (step === 6) return data.availableDays > 0 && !!data.equipmentLevel
    return true
  }

  // ── HIGH CONTRAST UI COMPONENTS ──────────────────────────────────────────

  const InputField = ({ label, value, onChange, suffix, stepVal = 1 }: any) => (
    <div className="flex-1 space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="decimal"
            value={value === 0 ? '' : value}
            onChange={(e) => {
              const val = e.target.value.replace(',', '.');
              if (val === '' || /^\d*\.?\d*$/.test(val)) onChange(val === '' ? 0 : val);
            }}
            className="w-full h-16 bg-zinc-100 border-2 border-zinc-200 rounded-2xl px-6 font-black text-2xl text-black outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
          {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-xs uppercase">{suffix}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => onChange(Math.max(0, (parseFloat(value.toString()) || 0) + stepVal))} className="p-2 bg-zinc-100 rounded-lg hover:bg-zinc-200 text-black active:scale-95"><ChevronRight className="w-4 h-4 -rotate-90" /></button>
          <button type="button" onClick={() => onChange(Math.max(0, (parseFloat(value.toString()) || 0) - stepVal))} className="p-2 bg-zinc-100 rounded-lg hover:bg-zinc-200 text-black active:scale-95"><ChevronRight className="w-4 h-4 rotate-90" /></button>
        </div>
      </div>
    </div>
  )

  const SelectionButton = ({ active, onClick, icon: Icon, label, desc }: any) => (
    <button 
      type="button"
      onClick={onClick}
      className={`relative p-6 rounded-3xl border-2 transition-all text-left flex flex-col h-full ${
        active ? 'bg-blue-600 border-blue-600 shadow-lg' : 'bg-white border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
        {typeof Icon === 'string' ? <span className="text-2xl">{Icon}</span> : <Icon className="w-6 h-6" />}
      </div>
      <h3 className={`font-black text-sm uppercase tracking-tight ${active ? 'text-white' : 'text-zinc-900'}`}>{label}</h3>
      {desc && <p className={`text-[10px] font-bold mt-1 uppercase ${active ? 'text-blue-100' : 'text-zinc-500'}`}>{desc}</p>}
      {active && <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white flex items-center justify-center"><Check className="w-4 h-4 text-blue-600" strokeWidth={4} /></div>}
    </button>
  )

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      
      {/* Steps Progress */}
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-blue-600' : 'bg-zinc-200'}`} />
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-2xl p-8 md:p-12 min-h-[500px] flex flex-col">
        
        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">Biometria</h2>
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Base biologica AI</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SelectionButton active={data.biologicalSex === 'MALE'} onClick={() => set('biologicalSex', 'MALE')} icon={User} label="Uomo" />
                <SelectionButton active={data.biologicalSex === 'FEMALE'} onClick={() => set('biologicalSex', 'FEMALE')} icon={User} label="Donna" />
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <InputField label="Peso Corporeo" value={data.weightKg} onChange={(val: any) => set('weightKg', parseFloat(val))} suffix="kg" stepVal={0.5} />
                <InputField label="Età Atleta" value={data.ageYears} onChange={(val: any) => set('ageYears', parseInt(val))} suffix="anni" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">DNA Sport</h2>
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Attività prevalente</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SPORT_OPTIONS.map(s => (
                  <SelectionButton key={s.value} active={data.primarySport === s.value} onClick={() => set('primarySport', s.value as SportType)} icon={s.icon} label={s.label} />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">Esperienza</h2>
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Anzianità allenamento</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { v: 'BEGINNER', l: 'Principiante', d: 'Meno di 1 anno' },
                  { v: 'INTERMEDIATE', l: 'Intermedio', d: '1-3 anni di costanza' },
                  { v: 'ADVANCED', l: 'Avanzato', d: 'Oltre 3 anni' }
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => set('experienceLevel', opt.v)} className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${data.experienceLevel === opt.v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'}`}>
                    <div className="text-left"><h3 className="font-black text-lg uppercase">{opt.l}</h3><p className={`text-[10px] font-bold uppercase ${data.experienceLevel === opt.v ? 'text-blue-100' : 'text-zinc-500'}`}>{opt.d}</p></div>
                    {data.experienceLevel === opt.v && <Check className="w-6 h-6 text-white" strokeWidth={4} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">Obiettivo</h2>
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Meta finale</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { v: 'HYPERTROPHY', l: 'Ipertrofia', i: '📈' },
                  { v: 'STRENGTH', l: 'Forza', i: '⚡' },
                  { v: 'WEIGHT_LOSS', l: 'Definizione', i: '🔥' },
                  { v: 'PERFORMANCE', l: 'Performance', i: '🏆' }
                ].map(opt => (
                  <SelectionButton key={opt.v} active={data.primaryGoal === opt.v} onClick={() => set('primaryGoal', opt.v)} icon={opt.i} label={opt.l} />
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">Fuel</h2>
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Regime alimentare</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['OMNIVORE', 'VEGETARIAN', 'VEGAN', 'KETO'].map(t => (
                  <SelectionButton key={t} active={data.dietaryType === t} onClick={() => set('dietaryType', t)} icon={Utensils} label={t} />
                ))}
              </div>
              <div className="p-8 bg-zinc-50 rounded-3xl border-2 border-zinc-200 flex items-center justify-between">
                <div className="text-left"><h3 className="font-black text-lg text-zinc-900 uppercase">Pasti / Giorno</h3><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Frequenza</p></div>
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map(n => (
                    <button key={n} type="button" onClick={() => set('eatingRoutine', {...data.eatingRoutine, mealsPerDay: n})} className={`w-14 h-14 rounded-2xl font-black border-2 transition-all flex items-center justify-center text-xl ${data.eatingRoutine.mealsPerDay === n ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">Life</h2>
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Disponibilità</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <InputField label="Giorni Liberi" value={data.availableDays} onChange={(e: any) => set('availableDays', parseInt(e))} suffix="GIORNI" />
                <InputField label="Tempo Sessione" value={data.sessionDuration} onChange={(e: any) => set('sessionDuration', parseInt(e))} suffix="MIN" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: 'FULL_GYM', l: 'Palestra', i: '🏢' },
                  { v: 'HOME_GYM', l: 'Home', i: '🏠' },
                  { v: 'BODYWEIGHT_ONLY', l: 'Libero', i: '🤸' }
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => set('equipmentLevel', opt.v)} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${data.equipmentLevel === opt.v ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
                    <span className="text-3xl mb-1">{opt.i}</span>
                    <span className="text-[10px] font-black uppercase text-center">{opt.l}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-12 pt-8 border-t border-zinc-100">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="px-8 py-5 rounded-2xl bg-zinc-100 text-zinc-600 font-black hover:bg-zinc-200 active:scale-95 transition-all"><ChevronLeft className="w-6 h-6" /></button>
          )}
          <button 
            type="button" 
            onClick={() => step < STEPS.length ? setStep(s => s + 1) : handleComplete()}
            disabled={!canProceed() || loading}
            className={`flex-1 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-20 ${canProceed() ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-zinc-100 text-zinc-400'}`}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{step === STEPS.length ? 'Finalizza' : 'Continua'} <ArrowRight className="w-6 h-6" strokeWidth={3} /></>}
          </button>
        </div>

      </div>
    </div>
  )
}

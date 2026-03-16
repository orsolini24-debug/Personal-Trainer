'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeDeepOnboarding, type DeepOnboardingData } from '@/app/actions/deep-onboarding'
import {
  User, Dumbbell, Target, Calendar, Shield,
  ChevronRight, ChevronLeft, Check, Loader2, Trophy,
  Activity, Scale, PieChart, Utensils, ClipboardList,
  Flame, HeartPulse, Clock, Zap, Star, AlertCircle, FastForward
} from 'lucide-react'
import { SportType } from '@prisma/client'

const STEPS = [
  { id: 1, label: 'Bio & Corpo', icon: User },
  { id: 2, label: 'Sport DNA', icon: Trophy },
  { id: 3, label: 'Performance', icon: Activity },
  { id: 4, label: 'Stato Attuale', icon: ClipboardList },
  { id: 5, label: 'Nutrizione', icon: Utensils },
  { id: 6, label: 'Routine & Logistica', icon: Clock },
]

const SPORT_OPTIONS = [
  { value: 'PALESTRA', label: 'Palestra / Bodybuilding', icon: '🏋️' },
  { value: 'CALISTHENICS', label: 'Calisthenics', icon: '🤸' },
  { value: 'CROSSFIT', label: 'CrossFit', icon: '🔥' },
  { value: 'HYROX', label: 'Hyrox', icon: '⏱️' },
  { value: 'RUNNING', label: 'Corsa', icon: '🏃' },
  { value: 'PADEL', label: 'Padel', icon: '🎾' },
  { value: 'SOCCER', label: 'Calcio', icon: '⚽' },
  { value: 'COMBAT', label: 'Boxe / MMA', icon: '🥊' },
  { value: 'CYCLING', label: 'Ciclismo', icon: '🚴' },
  { value: 'SWIMMING', label: 'Nuoto', icon: '🏊' },
  { value: 'SKIING', label: 'Sci', icon: '⛷️' },
  { value: 'HOCKEY', label: 'Hockey', icon: '🏒' },
  { value: 'BASEBALL', label: 'Baseball', icon: '⚾' },
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

export default function OnboardingWizard({ userName }: { userName?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<DeepOnboardingData>(INITIAL)
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof DeepOnboardingData>(k: K, v: DeepOnboardingData[K]) => setData(d => ({ ...d, [k]: v }))

  const handleComplete = async () => {
    setLoading(true)
    const res = await completeDeepOnboarding(data)
    setLoading(false)
    if (res.success) {
      router.push('/plan')
      router.refresh()
    } else {
      alert("Errore: " + res.error)
    }
  }

  const handleNext = () => setStep(s => s + 1)
  const handlePrev = () => setStep(s => s - 1)

  // ── RENDER STEPS ─────────────────────────────────────────────────────────

  const Step1Bio = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500"><Scale className="w-6 h-6" /></div>
        <h2 className="text-2xl font-black text-[#f1f5f9]">Bio & Composizione</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['MALE', 'FEMALE'].map(s => (
          <button key={s} onClick={() => set('biologicalSex', s)} className={`p-4 rounded-2xl border font-bold transition-all ${data.biologicalSex === s ? 'bg-[#3b82f6]/10 border-[#3b82f6] text-[#3b82f6]' : 'bg-[#0a0a0f] border-white/5 text-[#64748b]'}`}>
            {s === 'MALE' ? 'Uomo' : 'Donna'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748b]">Peso (kg)</label>
          <input type="number" step="0.1" value={data.weightKg} onChange={e=>set('weightKg', parseFloat(e.target.value))} className="w-full p-4 rounded-2xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none font-bold" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748b]">Età</label>
          <input type="number" value={data.ageYears} onChange={e=>set('ageYears', parseInt(e.target.value))} className="w-full p-4 rounded-2xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none font-bold" />
        </div>
      </div>
      <div className="p-5 rounded-3xl bg-[#0a0a0f] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold text-[#f1f5f9]">Dati Professionali?</p>
          <button onClick={() => set('hasProfessionalData', !data.hasProfessionalData)} className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase transition-all ${data.hasProfessionalData ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-white/5 text-[#64748b] border border-white/5'}`}>
            {data.hasProfessionalData ? 'Sì, ho dati BIA/Visita' : 'No, sono stime'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#64748b]">Massa Grassa %</label>
            <input type="number" value={data.bodyFatPct || ''} onChange={e=>set('bodyFatPct', parseFloat(e.target.value))} placeholder="es. 15" className="w-full p-3 rounded-xl bg-white/5 border border-white/5 text-[#f1f5f9] outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#64748b]">Massa Magra (kg)</label>
            <input type="number" value={data.leanMassKg || ''} onChange={e=>set('leanMassKg', parseFloat(e.target.value))} placeholder="es. 62" className="w-full p-3 rounded-xl bg-white/5 border border-white/5 text-[#f1f5f9] outline-none" />
          </div>
        </div>
      </div>
    </div>
  )

  const Step2Sport = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500"><Trophy className="w-6 h-6" /></div>
        <h2 className="text-2xl font-black text-[#f1f5f9]">Sport DNA</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {SPORT_OPTIONS.map(s => (
          <button key={s.value} onClick={() => set('primarySport', s.value as SportType)} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${data.primarySport === s.value ? 'bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b]' : 'bg-[#0a0a0f] border-white/5 text-[#64748b]'}`}>
            <span className="text-2xl">{s.icon}</span>
            <span className="text-[10px] font-black uppercase text-center">{s.label}</span>
          </button>
        ))}
      </div>
      
      {data.primarySport === 'RUNNING' && (
        <div className="p-5 rounded-3xl bg-[#3b82f6]/5 border border-[#3b82f6]/20 space-y-4">
          <p className="text-xs font-black text-[#3b82f6] uppercase tracking-widest">Metrica Corsa</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#64748b]">Ritmo Medio (min/km)</label>
              <input type="text" value={data.runningData?.avgPace || ''} onChange={e=>set('runningData', {...data.runningData, avgPace: e.target.value})} placeholder="es. 4:50" className="w-full p-3 rounded-xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#64748b]">Distanza Max (km)</label>
              <input type="number" value={data.runningData?.maxDistance || ''} onChange={e=>set('runningData', {...data.runningData, maxDistance: parseFloat(e.target.value)})} placeholder="es. 21" className="w-full p-3 rounded-xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const Step3Experience = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500"><Activity className="w-6 h-6" /></div>
        <h2 className="text-2xl font-black text-[#f1f5f9]">Esperienza & Forza</h2>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(l => (
            <button key={l} onClick={() => set('experienceLevel', l)} className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${data.experienceLevel === l ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-[#0a0a0f] border-white/5 text-[#64748b]'}`}>{l}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[{ k: 'squat1RM' as const, l: 'Squat' }, { k: 'bench1RM' as const, l: 'Panca' }, { k: 'deadlift1RM' as const, l: 'Stacco' }, { k: 'ohp1RM' as const, l: 'Military' }].map(({ k, l }) => (
            <div key={k} className="space-y-1">
              <label className="text-[10px] font-bold text-[#64748b] uppercase">{l} Max (kg)</label>
              <input type="number" value={data.strengthRefs[k] || ''} onChange={e => set('strengthRefs', { ...data.strengthRefs, [k]: parseInt(e.target.value) || undefined })} className="w-full p-3 rounded-xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none font-bold" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const Step4Status = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><ClipboardList className="w-6 h-6" /></div>
        <h2 className="text-2xl font-black text-[#f1f5f9]">Stato Attuale</h2>
      </div>
      <div className="space-y-4">
        <div className="p-5 rounded-3xl bg-[#0a0a0f] border border-white/5 space-y-3">
          <p className="text-sm font-bold text-[#f1f5f9]">Stai seguendo un piano ora?</p>
          <div className="flex gap-2">
            <button onClick={() => set('isFollowingPlan', true)} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${data.isFollowingPlan ? 'bg-[#6366f1]/20 border-[#6366f1] text-[#6366f1]' : 'bg-white/5 border-transparent text-[#64748b]'}`}>Sì</button>
            <button onClick={() => set('isFollowingPlan', false)} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${!data.isFollowingPlan ? 'bg-white/10 border-white/20 text-[#f1f5f9]' : 'bg-white/5 border-transparent text-[#64748b]'}`}>No</button>
          </div>
          {data.isFollowingPlan && (
            <textarea value={data.currentPlanText} onChange={e=>set('currentPlanText', e.target.value)} placeholder="Incolla il tuo piano attuale qui (testo o elenco esercizi)..." rows={4} className="w-full p-3 rounded-xl bg-white/5 border border-white/5 text-[#f1f5f9] outline-none text-[10px] resize-none" />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748b]">Gara / Evento Target (opzionale)</label>
          <input type="text" value={data.targetEvent || ''} onChange={e=>set('targetEvent', e.target.value)} placeholder="es. Maratona di Milano, Torneo Padel..." className="w-full p-4 rounded-2xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none text-sm font-medium" />
        </div>
      </div>
    </div>
  )

  const Step5Nutrition = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-green-500/10 text-green-500"><Utensils className="w-6 h-6" /></div>
        <h2 className="text-2xl font-black text-[#f1f5f9]">Nutrizione & Gusti</h2>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {['OMNIVORE', 'VEGETARIAN', 'VEGAN', 'KETO'].map(t => (
            <button key={t} onClick={() => set('dietaryType', t)} className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${data.dietaryType === t ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-[#0a0a0f] border-white/5 text-[#64748b]'}`}>{t}</button>
          ))}
        </div>
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#0a0a0f] border border-white/5">
            <label className="text-[10px] font-bold text-[#64748b] uppercase mb-2 block">Routine Pasti</label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#f1f5f9]">Quanti pasti al giorno?</span>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map(n => (
                  <button key={n} onClick={() => set('eatingRoutine', {...data.eatingRoutine, mealsPerDay: n})} className={`w-8 h-8 rounded-lg text-xs font-bold ${data.eatingRoutine.mealsPerDay === n ? 'bg-green-500 text-white' : 'bg-white/5 text-[#64748b]'}`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
          <textarea placeholder="Cibi Preferiti (es. Salmone, Avocado, Pasta)" onBlur={e=>set('favoriteFoods', e.target.value.split(',').map(s=>s.trim()))} className="w-full p-3 rounded-xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none text-xs" />
          <textarea placeholder="Cibi da Evitare / Allergie" onBlur={e=>set('dislikedFoods', e.target.value.split(',').map(s=>s.trim()))} className="w-full p-3 rounded-xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none text-xs" />
        </div>
      </div>
    </div>
  )

  const Step6Routine = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><Clock className="w-6 h-6" /></div>
        <h2 className="text-2xl font-black text-[#f1f5f9]">Logistica & Allenamento</h2>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#64748b] uppercase">Giorni/Sett</label>
            <input type="number" value={data.availableDays} onChange={e=>set('availableDays', parseInt(e.target.value))} className="w-full p-4 rounded-2xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#64748b] uppercase">Durata (min)</label>
            <input type="number" value={data.sessionDuration} onChange={e=>set('sessionDuration', parseInt(e.target.value))} className="w-full p-4 rounded-2xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none font-bold" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[
            { v: 'FULL_GYM', l: 'Palestra Completa' },
            { v: 'HOME_GYM', l: 'Home Gym (Manubri/Panca)' },
            { v: 'BODYWEIGHT_ONLY', l: 'Corpo Libero' }
          ].map(opt => (
            <button key={opt.v} onClick={() => set('equipmentLevel', opt.v)} className={`p-4 rounded-2xl border text-left font-bold transition-all ${data.equipmentLevel === opt.v ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500' : 'bg-[#0a0a0f] border-white/5 text-[#64748b]'}`}>{opt.l}</button>
          ))}
        </div>
        <textarea value={data.dailyRoutine} onChange={e=>set('dailyRoutine', e.target.value)} placeholder="Descrivi brevemente la tua giornata tipo (es. Lavoro sedentario, cammino molto...)" rows={3} className="w-full p-4 rounded-2xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] outline-none text-xs resize-none" />
      </div>
    </div>
  )

  const canProceed = () => {
    if (step === 1) return data.biologicalSex && data.weightKg > 0 && data.ageYears > 0
    if (step === 2) return !!data.primarySport
    if (step === 3) return !!data.experienceLevel
    if (step === 5) return !!data.dietaryType
    if (step === 6) return data.availableDays > 0 && !!data.equipmentLevel
    return true
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05050f] p-4 absolute inset-0 z-[100] font-sans selection:bg-[#3b82f6]/30">
      <div className="w-full max-w-lg bg-[#111118] p-8 md:p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        
        {/* Deep Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0a0a0f] flex">
          {STEPS.map(s => (
            <div key={s.id} className={`h-full flex-1 transition-all duration-700 ${step >= s.id ? 'bg-gradient-to-r from-[#3b82f6] to-[#6366f1]' : 'bg-transparent'}`} />
          ))}
        </div>

        <div className="mb-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center font-black text-white text-[10px] shadow-lg">PE</div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b]">Athlete Intake</span>
          </div>
          <span className="text-[10px] font-black text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-1 rounded-md">{Math.round((step/STEPS.length)*100)}%</span>
        </div>

        <div className="min-h-[420px]">
          {step === 1 && <Step1Bio />}
          {step === 2 && <Step2Sport />}
          {step === 3 && <Step3Experience />}
          {step === 4 && <Step4Status />}
          {step === 5 && <Step5Nutrition />}
          {step === 6 && <Step6Routine />}
        </div>

        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <button onClick={handlePrev} className="px-6 py-4 rounded-3xl bg-[#0a0a0f] border border-white/5 text-[#f1f5f9] hover:bg-white/5 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => step < STEPS.length ? handleNext() : handleComplete()}
            disabled={!canProceed() || loading}
            className="flex-1 py-4 rounded-[2rem] bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-black flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-20 active:scale-95 transition-all"
          >
            {step === STEPS.length ? (loading ? 'Configurazione...' : 'Inizia Trasformazione') : 'Continua'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

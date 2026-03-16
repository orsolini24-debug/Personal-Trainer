'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { completeDeepOnboarding, type DeepOnboardingData } from '@/app/actions/deep-onboarding'
import {
  User, Trophy, Activity, ClipboardList, Utensils, Clock,
  ChevronRight, ChevronLeft, Scale, Target, 
  Dumbbell, Zap, Flame, Shield, Check, Loader2, ArrowRight
} from 'lucide-react'
import { SportType } from '@prisma/client'

const STEPS = [
  { id: 1, label: 'Profilo', icon: User, color: 'blue' },
  { id: 2, label: 'DNA Sport', icon: Trophy, color: 'orange' },
  { id: 3, label: 'Performance', icon: Activity, color: 'purple' },
  { id: 4, label: 'Obiettivi', icon: Target, color: 'indigo' },
  { id: 5, label: 'Nutrizione', icon: Utensils, color: 'green' },
  { id: 6, label: 'Logistica', icon: Clock, color: 'cyan' },
]

const SPORT_OPTIONS = [
  { value: 'PALESTRA', label: 'Palestra', icon: '🏋️', desc: 'Bodybuilding & Forza' },
  { value: 'RUNNING', label: 'Corsa', icon: '🏃', desc: 'Maratona & Trail' },
  { value: 'PADEL', label: 'Padel', icon: '🎾', desc: 'Tecnica & Agilità' },
  { value: 'CROSSFIT', label: 'CrossFit', icon: '🔥', desc: 'Alta Intensità' },
  { value: 'CALISTHENICS', label: 'Calisthenics', icon: '🤸', desc: 'Peso Corporeo' },
  { value: 'SOCCER', label: 'Calcio', icon: '⚽', desc: 'Sport di Squadra' },
  { value: 'COMBAT', label: 'Combat', icon: '🥊', desc: 'Boxe & MMA' },
  { value: 'CYCLING', label: 'Ciclismo', icon: '🚴', desc: 'Resistenza' },
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
      router.push('/plan')
      router.refresh()
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

  // ── UI Components ────────────────────────────────────────────────────────

  const CardSelect = ({ active, onClick, icon, label, desc, colorClass }: any) => (
    <button
      onClick={onClick}
      className={`relative p-6 rounded-[2rem] border transition-all duration-300 text-left group overflow-hidden ${
        active 
          ? `bg-surface border-${colorClass}/40 ring-1 ring-${colorClass}/30` 
          : 'bg-surface/50 border-subtle hover:border-white/20'
      }`}
    >
      {active && (
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${colorClass}/10 blur-3xl rounded-full`} />
      )}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl bg-base border border-subtle group-hover:scale-110 transition-transform ${active ? `text-${colorClass}` : 'text-muted'}`}>
        {icon}
      </div>
      <h3 className={`font-black text-lg ${active ? 'text-primary' : 'text-muted'}`}>{label}</h3>
      <p className="text-xs font-medium text-muted/60 mt-1">{desc}</p>
      {active && <div className={`absolute bottom-6 right-6 w-6 h-6 rounded-full bg-${colorClass} flex items-center justify-center text-white`}><Check className="w-4 h-4" /></div>}
    </button>
  )

  const ModernInput = ({ label, value, onChange, type = "number", suffix, prefixIcon: Icon }: any) => (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 group-focus-within:text-primary transition-colors">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-4 w-5 h-5 text-muted/40 group-focus-within:text-primary transition-colors" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full bg-base border border-subtle rounded-2xl p-4 font-black text-lg outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all ${Icon ? 'pl-12' : ''}`}
        />
        {suffix && <span className="absolute right-4 font-bold text-muted text-sm">{suffix}</span>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020205] text-[#f1f5f9] flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Header */}
        <div className="mb-12 space-y-8">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-widest text-primary">Intake Atleta</h1>
                <p className="text-[10px] font-bold text-muted">Performance Ecosystem AI</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary italic">Step 0{step}</span>
              <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">del percorso totale</p>
            </div>
          </div>

          <div className="flex gap-2 px-1">
            {STEPS.map((s) => (
              <div 
                key={s.id} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${
                  step >= s.id ? 'bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[480px] transition-all duration-500">
          
          {/* STEP 1: BIO */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-primary">Chi sei?</h2>
                <p className="text-muted font-medium">Definiamo le basi biologiche per l'algoritmo AI.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => set('biologicalSex', 'MALE')}
                  className={`group relative p-8 rounded-[2.5rem] border transition-all duration-500 ${data.biologicalSex === 'MALE' ? 'bg-primary/10 border-primary shadow-2xl shadow-primary/10' : 'bg-surface/50 border-subtle hover:border-white/10'}`}
                >
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110 ${data.biologicalSex === 'MALE' ? 'bg-primary text-white' : 'bg-base text-muted'}`}>
                    <User className="w-8 h-8" />
                  </div>
                  <span className={`block text-center font-black tracking-tighter ${data.biologicalSex === 'MALE' ? 'text-primary' : 'text-muted'}`}>UOMO</span>
                </button>
                <button 
                  onClick={() => set('biologicalSex', 'FEMALE')}
                  className={`group relative p-8 rounded-[2.5rem] border transition-all duration-500 ${data.biologicalSex === 'FEMALE' ? 'bg-primary/10 border-primary shadow-2xl shadow-primary/10' : 'bg-surface/50 border-subtle hover:border-white/10'}`}
                >
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110 ${data.biologicalSex === 'FEMALE' ? 'bg-primary text-white' : 'bg-base text-muted'}`}>
                    <User className="w-8 h-8" />
                  </div>
                  <span className={`block text-center font-black tracking-tighter ${data.biologicalSex === 'FEMALE' ? 'text-primary' : 'text-muted'}`}>DONNA</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <ModernInput 
                  label="Peso Attuale" 
                  value={data.weightKg} 
                  onChange={(e: any) => set('weightKg', parseFloat(e.target.value))} 
                  suffix="kg"
                  prefixIcon={Scale}
                />
                <ModernInput 
                  label="La tua Età" 
                  value={data.ageYears} 
                  onChange={(e: any) => set('ageYears', parseInt(e.target.value))} 
                  suffix="anni"
                  prefixIcon={Clock}
                />
              </div>
            </div>
          )}

          {/* STEP 2: SPORT DNA */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-primary">Sport DNA</h2>
                <p className="text-muted font-medium">Quale attività domina la tua routine settimanale?</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                {SPORT_OPTIONS.map(s => (
                  <button 
                    key={s.value} 
                    onClick={() => set('primarySport', s.value as SportType)}
                    className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-3 ${data.primarySport === s.value ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/5' : 'bg-surface/50 border-subtle hover:border-white/10'}`}
                  >
                    <span className="text-4xl group-hover:scale-125 transition-transform">{s.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${data.primarySport === s.value ? 'text-orange-500' : 'text-muted'}`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PERFORMANCE */}
          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-primary">Livello Atletico</h2>
                <p className="text-muted font-medium">Sii onesto con te stesso per calibrare i volumi.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { v: 'BEGINNER', l: 'Principiante', d: 'Meno di 1 anno di esperienza costante.', c: 'green' },
                  { v: 'INTERMEDIATE', l: 'Intermedio', d: '1-3 anni di allenamento strutturato.', c: 'blue' },
                  { v: 'ADVANCED', l: 'Avanzato', d: 'Oltre 3 anni, padronanza dei fondamentali.', c: 'purple' }
                ].map(opt => (
                  <button 
                    key={opt.v}
                    onClick={() => set('experienceLevel', opt.v)}
                    className={`p-6 rounded-[2rem] border text-left transition-all duration-300 relative overflow-hidden group ${data.experienceLevel === opt.v ? `bg-surface border-${opt.c}-500/40 ring-1 ring-${opt.c}-500/20` : 'bg-surface/50 border-subtle hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${data.experienceLevel === opt.v ? `bg-${opt.c}-500 text-white` : 'bg-base text-muted'}`}>
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`font-black text-lg ${data.experienceLevel === opt.v ? 'text-primary' : 'text-muted'}`}>{opt.l}</h3>
                        <p className="text-xs font-medium text-muted/60">{opt.d}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: OBIETTIVI */}
          {step === 4 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-primary">La tua Meta</h2>
                <p className="text-muted font-medium">L'AI genererà il percorso basandosi su questo.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { v: 'HYPERTROPHY', l: 'Ipertrofia', d: 'Costruzione massa muscolare', i: Flame, c: 'orange' },
                  { v: 'STRENGTH', l: 'Forza Pura', d: 'Massimizzare i massimali (1RM)', i: Dumbbell, c: 'blue' },
                  { v: 'WEIGHT_LOSS', l: 'Definizione', d: 'Perdita grasso & Recomposing', i: Scale, c: 'green' },
                  { v: 'PERFORMANCE', l: 'Performance', d: 'Funzionalità per il tuo sport', i: Activity, c: 'indigo' }
                ].map(opt => (
                  <button 
                    key={opt.v}
                    onClick={() => set('primaryGoal', opt.v)}
                    className={`p-6 rounded-[2.5rem] border text-left transition-all duration-300 group ${data.primaryGoal === opt.v ? `bg-surface border-${opt.c}-500/40 ring-1 ring-${opt.c}-500/20` : 'bg-surface/50 border-subtle hover:border-white/10'}`}
                  >
                    <opt.i className={`w-8 h-8 mb-4 ${data.primaryGoal === opt.v ? `text-${opt.c}-500` : 'text-muted'}`} />
                    <h3 className={`font-black text-lg ${data.primaryGoal === opt.v ? 'text-primary' : 'text-muted'}`}>{opt.l}</h3>
                    <p className="text-[10px] font-bold text-muted/50 uppercase tracking-tighter">{opt.d}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: NUTRITION */}
          {step === 5 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-primary">Carburante</h2>
                <p className="text-muted font-medium">Ottimizziamo i macronutrienti per le tue sessioni.</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-2 p-2 bg-surface border border-subtle rounded-3xl">
                  {['OMNIVORE', 'VEGETARIAN', 'VEGAN', 'KETO'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => set('dietaryType', t)}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${data.dietaryType === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-primary'}`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="p-8 rounded-[2.5rem] bg-surface border border-subtle flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg text-primary">Frequenza Pasti</h3>
                    <p className="text-xs text-muted font-medium">Quanti pasti solidi al giorno?</p>
                  </div>
                  <div className="flex gap-3">
                    {[3, 4, 5, 6].map(n => (
                      <button 
                        key={n} 
                        onClick={() => set('eatingRoutine', {...data.eatingRoutine, mealsPerDay: n})}
                        className={`w-12 h-12 rounded-2xl font-black transition-all border ${data.eatingRoutine.mealsPerDay === n ? 'bg-primary border-primary text-white' : 'bg-base border-subtle text-muted hover:border-white/20'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: LOGISTICS */}
          {step === 6 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-primary">Logistica</h2>
                <p className="text-muted font-medium">Ultimi dettagli prima della generazione del piano.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <ModernInput 
                  label="Giorni Disponibili" 
                  value={data.availableDays} 
                  onChange={(e: any) => set('availableDays', parseInt(e.target.value))} 
                  suffix="/ sett"
                  prefixIcon={Calendar}
                />
                <ModernInput 
                  label="Durata Sessione" 
                  value={data.sessionDuration} 
                  onChange={(e: any) => set('sessionDuration', parseInt(e.target.value))} 
                  suffix="min"
                  prefixIcon={Clock}
                />
              </div>

              <div className="space-y-3">
                {[
                  { v: 'FULL_GYM', l: 'Palestra Commerciale', i: '🏢' },
                  { v: 'HOME_GYM', l: 'Home Gym Essentials', i: '🏠' },
                  { v: 'BODYWEIGHT_ONLY', l: 'Solo Corpo Libero', i: '🤸' }
                ].map(opt => (
                  <button 
                    key={opt.v}
                    onClick={() => set('equipmentLevel', opt.v)}
                    className={`w-full p-6 rounded-3xl border text-left transition-all duration-300 flex items-center gap-4 ${data.equipmentLevel === opt.v ? 'bg-primary/10 border-primary' : 'bg-surface/50 border-subtle hover:border-white/10'}`}
                  >
                    <span className="text-2xl">{opt.i}</span>
                    <span className={`font-black tracking-tight ${data.equipmentLevel === opt.v ? 'text-primary' : 'text-muted'}`}>{opt.l}</span>
                    {data.equipmentLevel === opt.v && <Check className="ml-auto text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex gap-4">
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="px-8 py-5 rounded-[2rem] bg-surface border border-subtle text-muted font-black hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <button 
            onClick={() => step < STEPS.length ? setStep(s => s + 1) : handleComplete()}
            disabled={!canProceed() || loading}
            className="flex-1 py-5 rounded-[2rem] bg-gradient-to-r from-primary to-accent text-white font-black text-lg flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(59,130,246,0.3)] active:scale-95 disabled:opacity-10 transition-all group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {step === STEPS.length ? 'Analizza & Genera' : 'Prossimo Step'}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in-bottom {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

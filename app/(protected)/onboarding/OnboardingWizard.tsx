'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { completeDeepOnboarding, type DeepOnboardingData } from '@/app/actions/deep-onboarding'
import {
  User, Trophy, Activity, Utensils, Clock,
  ChevronRight, ChevronLeft, Scale, Target, 
  Dumbbell, Zap, Flame, Shield, Check, Loader2, ArrowRight, Calendar, Search, X
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

const ALL_SPORTS = [
  // PALESTRA & FORZA
  { id: 'PALESTRA', label: 'Palestra / BB', cat: 'Forza', icon: '💪' },
  { id: 'CROSSFIT', label: 'CrossFit', cat: 'Forza', icon: '🔥' },
  { id: 'CALISTHENICS', label: 'Calisthenics', cat: 'Forza', icon: '🤸' },
  { id: 'GYMNASTICS', label: 'Ginnastica', cat: 'Forza', icon: '🤸‍♂️' },
  
  // CORSA & ENDURANCE
  { id: 'RUNNING', label: 'Corsa', cat: 'Endurance', icon: '🏃' },
  { id: 'TRAIL_RUNNING', label: 'Trail Running', cat: 'Endurance', icon: '⛰️' },
  { id: 'SPRINTING', label: 'Sprint', cat: 'Endurance', icon: '⚡' },
  { id: 'MARATHON', label: 'Maratona', icon: '🏁', cat: 'Endurance' },
  { id: 'TRIATHLON', label: 'Triathlon', cat: 'Endurance', icon: '🏊' },
  { id: 'CYCLING', label: 'Ciclismo', cat: 'Endurance', icon: '🚴' },
  { id: 'MTB', label: 'MTB', cat: 'Endurance', icon: '🚵' },
  { id: 'GRAVEL_BIKING', label: 'Gravel', cat: 'Endurance', icon: '🚲' },
  { id: 'SWIMMING', label: 'Nuoto', cat: 'Endurance', icon: '🏊‍♂️' },
  { id: 'OPEN_WATER_SWIMMING', label: 'Nuoto Fondo', cat: 'Endurance', icon: '🌊' },
  { id: 'ROWING', label: 'Canottaggio', cat: 'Endurance', icon: '🚣' },

  // SPORT DI SQUADRA
  { id: 'SOCCER', label: 'Calcio', cat: 'Squadra', icon: '⚽' },
  { id: 'PADEL', label: 'Padel', cat: 'Squadra', icon: '🎾' },
  { id: 'TENNIS', label: 'Tennis', cat: 'Squadra', icon: '🎾' },
  { id: 'BASKETBALL', label: 'Basket', cat: 'Squadra', icon: '🏀' },
  { id: 'VOLLEYBALL', label: 'Volley', cat: 'Squadra', icon: '🏐' },
  { id: 'RUGBY', label: 'Rugby', cat: 'Squadra', icon: '🏉' },
  { id: 'AMERICAN_FOOTBALL', label: 'Football', cat: 'Squadra', icon: '🏈' },
  { id: 'WATER_POLO', label: 'Pallanuoto', cat: 'Squadra', icon: '🤽' },
  { id: 'HANDBALL', label: 'Pallamano', cat: 'Squadra', icon: '🤾' },

  // LOTTA & COMBATTIMENTO
  { id: 'COMBAT', label: 'Lotta / Arti Marziali', cat: 'Lotta', icon: '🥋' },
  { id: 'BOXING', label: 'Boxe', cat: 'Lotta', icon: '🥊' },
  { id: 'KICKBOXING', label: 'Kickboxing', cat: 'Lotta', icon: '🥋' },
  { id: 'MUAY_THAI', label: 'Muay Thai', cat: 'Lotta', icon: '🥊' },
  { id: 'MMA', label: 'MMA', cat: 'Lotta', icon: '🤼' },
  { id: 'BJJ', label: 'BJJ', cat: 'Lotta', icon: '🥋' },
  { id: 'JUDO', label: 'Judo', cat: 'Lotta', icon: '🥋' },
  { id: 'WRESTLING', label: 'Wrestling', cat: 'Lotta', icon: '🤼‍♂️' },
  { id: 'KARATE', label: 'Karate', cat: 'Lotta', icon: '🥋' },
  { id: 'TAEKWONDO', label: 'Taekwondo', cat: 'Lotta', icon: '🥋' },
  { id: 'FENCING', label: 'Scherma', cat: 'Lotta', icon: '🤺' },

  // MONTAGNA & OUTDOOR
  { id: 'CLIMBING', label: 'Arrampicata', cat: 'Outdoor', icon: '🧗' },
  { id: 'TREKKING', label: 'Trekking', cat: 'Outdoor', icon: '🥾' },
  { id: 'MOUNTAINEERING', label: 'Alpinismo', cat: 'Outdoor', icon: '🏔️' },
  { id: 'SKIING', label: 'Sci', cat: 'Outdoor', icon: '⛷️' },
  { id: 'SKI_TOURING', label: 'Sci Alpinismo', cat: 'Outdoor', icon: '🎿' },
  { id: 'SNOWBOARDING', label: 'Snowboard', cat: 'Outdoor', icon: '🏂' },

  // ACQUATICI & WIND
  { id: 'SURFING', label: 'Surf', cat: 'Acqua', icon: '🏄' },
  { id: 'WINDSURFING', label: 'Windsurf', cat: 'Acqua', icon: '⛵' },
  { id: 'KITESURFING', label: 'Kitesurf', cat: 'Acqua', icon: '🏄‍♂️' },
  { id: 'SAILING', label: 'Vela', cat: 'Acqua', icon: '⛵' },
  { id: 'KAYAKING', label: 'Kayak', cat: 'Acqua', icon: '🛶' },
  { id: 'DIVING', label: 'Subacquea', cat: 'Acqua', icon: '🤿' },
  { id: 'SUP', label: 'SUP', cat: 'Acqua', icon: '🏄‍♀️' },

  // ALTRI
  { id: 'YOGA', label: 'Yoga', cat: 'Mind', icon: '🧘' },
  { id: 'PILATES', label: 'Pilates', cat: 'Mind', icon: '🧘‍♀️' },
  { id: 'GOLF', label: 'Golf', cat: 'Sport', icon: '⛳' },
  { id: 'SKATING', label: 'Pattinaggio', cat: 'Sport', icon: '⛸️' },
  { id: 'DANCING', label: 'Danza', cat: 'Sport', icon: '💃' },
  { id: 'ARCHERY', label: 'Tiro con Arco', cat: 'Sport', icon: '🏹' },
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
  const [searchSport, setSearchSport] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  const set = <K extends keyof DeepOnboardingData>(k: K, v: DeepOnboardingData[K]) => {
    setData(d => ({ ...d, [k]: v }))
  }

  const toggleSport = (sportId: string) => {
    const current = data.mainSports || []
    if (current.includes(sportId as SportType)) {
      set('mainSports', current.filter(s => s !== sportId))
      if (data.primarySport === sportId) set('primarySport', current[0] || 'PALESTRA')
    } else {
      set('mainSports', [...current, sportId as SportType])
      if (current.length === 0) set('primarySport', sportId as SportType)
    }
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
    if (step === 2) return (data.mainSports || []).length > 0
    if (step === 3) return !!data.experienceLevel
    if (step === 5) return !!data.dietaryType
    if (step === 6) return data.availableDays > 0 && !!data.equipmentLevel
    return true
  }

  // ── COMPONENTS ──────────────────────────────────────────────────────────

  const ProInput = ({ label, value, onChange, placeholder, suffix, stepVal = 1 }: any) => (
    <div className="flex-1">
      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{label}</label>
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
            className="w-full h-16 bg-zinc-50 border-2 border-zinc-200 rounded-2xl px-6 font-black text-2xl text-black outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
          {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-xs">{suffix}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => onChange(Math.max(0, (parseFloat(value.toString()) || 0) + stepVal))} className="p-2 bg-zinc-100 rounded-lg"><ChevronRight className="w-4 h-4 -rotate-90" /></button>
          <button type="button" onClick={() => onChange(Math.max(0, (parseFloat(value.toString()) || 0) - stepVal))} className="p-2 bg-zinc-100 rounded-lg"><ChevronRight className="w-4 h-4 rotate-90" /></button>
        </div>
      </div>
    </div>
  )

  const categories = Array.from(new Set(ALL_SPORTS.map(s => s.cat)))

  return (
    <div className="w-full max-w-4xl mx-auto">
      
      {/* Header Progress */}
      <div className="mb-8 flex justify-between items-center px-1">
        <div className="flex gap-1.5 flex-1 max-w-[300px]">
          {STEPS.map((s) => (
            <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-blue-600' : 'bg-zinc-200'}`} />
          ))}
        </div>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Fase 0{step}</span>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[3rem] border border-zinc-200 shadow-2xl p-8 md:p-12 min-h-[600px] flex flex-col">
        
        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">Biometria</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Profilo Biologico Base</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => set('biologicalSex', 'MALE')} className={`p-8 rounded-3xl border-4 transition-all text-center ${data.biologicalSex === 'MALE' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                  <User className="w-10 h-10 mx-auto mb-3" />
                  <span className="font-black uppercase tracking-widest">Uomo</span>
                </button>
                <button onClick={() => set('biologicalSex', 'FEMALE')} className={`p-8 rounded-3xl border-4 transition-all text-center ${data.biologicalSex === 'FEMALE' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                  <User className="w-10 h-10 mx-auto mb-3" />
                  <span className="font-black uppercase tracking-widest">Donna</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <ProInput label="Peso (kg)" value={data.weightKg} onChange={(val: any) => set('weightKg', parseFloat(val))} suffix="kg" stepVal={0.5} />
                <ProInput label="Età (anni)" value={data.ageYears} onChange={(val: any) => set('ageYears', parseInt(val))} suffix="anni" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">DNA Sport</h2>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Seleziona tutti gli sport che pratichi</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Cerca sport..." 
                    className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-600"
                    value={searchSport}
                    onChange={(e) => setSearchSport(e.target.value)}
                  />
                </div>
              </div>

              {/* Selected Chips */}
              <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                {(data.mainSports || []).map(sId => {
                  const s = ALL_SPORTS.find(x => x.id === sId)
                  return (
                    <button key={sId} onClick={() => toggleSport(sId)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest">
                      <span>{s?.icon} {s?.label}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )
                })}
                {(data.mainSports || []).length === 0 && <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest my-auto">Nessuno sport selezionato</span>}
              </div>

              <div className="space-y-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => {
                  const sportsInCat = ALL_SPORTS.filter(s => s.cat === cat && s.label.toLowerCase().includes(searchSport.toLowerCase()))
                  if (sportsInCat.length === 0) return null
                  return (
                    <div key={cat} className="space-y-3">
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] border-b border-zinc-100 pb-2">{cat}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {sportsInCat.map(s => (
                          <button 
                            key={s.id}
                            onClick={() => toggleSport(s.id)}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                              data.mainSports?.includes(s.id as SportType) ? 'bg-blue-600 border-blue-600 text-white scale-[0.98]' : 'bg-zinc-50 border-zinc-100 text-zinc-500 hover:border-zinc-200'
                            }`}
                          >
                            <span className="text-2xl">{s.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter leading-none text-center">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">Esperienza</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Da quanto tempo ti alleni?</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { v: 'BEGINNER', l: 'Principiante', d: 'Meno di 1 anno di esperienza' },
                  { v: 'INTERMEDIATE', l: 'Intermedio', d: '1-3 anni di costanza' },
                  { v: 'ADVANCED', l: 'Avanzato', d: 'Oltre 3 anni di esperienza' }
                ].map(opt => (
                  <button key={opt.v} onClick={() => set('experienceLevel', opt.v)} className={`p-6 rounded-2xl border-4 text-left flex justify-between items-center transition-all ${data.experienceLevel === opt.v ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-zinc-50 border-zinc-100 text-zinc-900'}`}>
                    <div><h3 className="font-black text-xl uppercase leading-none">{opt.l}</h3><p className={`text-[10px] font-bold mt-1 uppercase ${data.experienceLevel === opt.v ? 'text-blue-100' : 'text-zinc-500'}`}>{opt.d}</p></div>
                    {data.experienceLevel === opt.v && <Check className="w-8 h-8" strokeWidth={4} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">Obiettivo</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Meta per i prossimi 30 giorni</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { v: 'HYPERTROPHY', l: 'Ipertrofia', i: '📈', d: 'Massa Muscolare' },
                  { v: 'STRENGTH', l: 'Forza', i: '⚡', d: 'Carichi Massimi' },
                  { v: 'WEIGHT_LOSS', l: 'Definizione', i: '🔥', d: 'Dimagrimento' },
                  { v: 'PERFORMANCE', l: 'Performance', i: '🏆', d: 'Capacità Atletica' }
                ].map(opt => (
                  <button key={opt.v} onClick={() => set('primaryGoal', opt.v)} className={`p-8 rounded-3xl border-4 text-left transition-all ${data.primaryGoal === opt.v ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-zinc-50 border-zinc-100 text-zinc-900'}`}>
                    <span className="text-4xl mb-4 block">{opt.i}</span>
                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">{opt.l}</h3>
                    <p className={`text-[10px] font-bold mt-1 uppercase ${data.primaryGoal === opt.v ? 'text-blue-100' : 'text-zinc-500'}`}>{opt.d}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">Fuel</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Nutrizione e Frequenza</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['OMNIVORE', 'VEGETARIAN', 'VEGAN', 'KETO'].map(t => (
                  <button key={t} onClick={() => set('dietaryType', t)} className={`p-6 rounded-2xl border-4 font-black uppercase text-xs tracking-widest transition-all ${data.dietaryType === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>{t}</button>
                ))}
              </div>
              <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <h3 className="font-black text-xl text-black uppercase leading-none">Pasti / Giorno</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Esclusi snack</p>
                </div>
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map(n => (
                    <button key={n} onClick={() => set('eatingRoutine', {...data.eatingRoutine, mealsPerDay: n})} className={`w-14 h-14 rounded-2xl font-black border-4 transition-all flex items-center justify-center text-xl ${data.eatingRoutine.mealsPerDay === n ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' : 'bg-white border-zinc-200 text-zinc-400'}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">Life</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Disponibilità e Setup</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <ProInput label="Giorni Liberi" value={data.availableDays} onChange={(e: any) => set('availableDays', parseInt(e))} suffix="GIORNI" />
                <ProInput label="Tempo Sessione" value={data.sessionDuration} onChange={(e: any) => set('sessionDuration', parseInt(e))} suffix="MIN" stepVal={5} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: 'FULL_GYM', l: 'Palestra', i: '🏢' },
                  { v: 'HOME_GYM', l: 'Home', i: '🏠' },
                  { v: 'BODYWEIGHT_ONLY', l: 'Libero', i: '🤸' }
                ].map(opt => (
                  <button key={opt.v} onClick={() => set('equipmentLevel', opt.v)} className={`p-6 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all ${data.equipmentLevel === opt.v ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
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
            <button type="button" onClick={() => setStep(s => s - 1)} className="px-8 py-5 rounded-2xl bg-zinc-100 text-zinc-600 font-black flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-all"><ChevronLeft className="w-6 h-6" /></button>
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

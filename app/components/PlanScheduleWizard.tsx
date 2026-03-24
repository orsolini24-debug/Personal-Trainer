'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Check, ChevronRight, X, AlertTriangle, Play, Sparkles } from 'lucide-react'
import { advancedSchedulePlan } from '@/app/actions/plans'
import { useRouter } from 'next/navigation'

interface PlanDay {
  id: string
  dayLabel: string
  focus: string | null
}

interface Props {
  planId: string
  planDays: PlanDay[]
  initialTrainingDays?: number[]
  onClose: () => void
}

const WEEK_DAYS = [
  { id: 1, label: 'Lunedì' },
  { id: 2, label: 'Martedì' },
  { id: 3, label: 'Mercoledì' },
  { id: 4, label: 'Giovedì' },
  { id: 5, label: 'Venerdì' },
  { id: 6, label: 'Sabato' },
  { id: 0, label: 'Domenica' },
]

export default function PlanScheduleWizard({ planId, planDays, initialTrainingDays = [], onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // State
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialTrainingDays.length > 0 ? initialTrainingDays : [1, 3, 5]
  )
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [startSessionIdx, setStartSessionIdx] = useState<number>(0)

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId))
    } else {
      setSelectedDays([...selectedDays, dayId])
    }
  }

  const handleSchedule = async () => {
    if (selectedDays.length === 0) {
      alert("Seleziona almeno un giorno di allenamento.")
      return
    }

    setLoading(true)
    const res = await advancedSchedulePlan({
      planId,
      trainingDays: selectedDays,
      startDateISO: startDate,
      startSessionIndex: startSessionIdx,
      weeksToSchedule: 4 // Pianifichiamo per 4 settimane di default
    })
    
    setLoading(false)
    if (res.success) {
      router.refresh()
      onClose()
    } else {
      alert("Errore durante la pianificazione: " + res.error)
    }
  }

  const isAsynchronous = selectedDays.length > 0 && selectedDays.length < planDays.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface rounded-[2.5rem] border border-border overflow-hidden shadow-2xl animate-pop-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-primary tracking-tight">Auto-Pianificazione</h2>
              <p className="text-[10px] text-fg-subtle font-black uppercase tracking-widest">Imposta la rotazione</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center text-fg-muted hover:text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* 1. Giorni di allenamento */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-primary flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded bg-fg-muted/20 flex items-center justify-center text-[10px]">1</span>
                Giorni di allenamento
              </h3>
              <p className="text-[11px] text-fg-subtle ml-7">Quali giorni sei disponibile ad allenarti?</p>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pl-7">
              {WEEK_DAYS.map(day => {
                const isActive = selectedDays.includes(day.id)
                return (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      isActive 
                        ? 'bg-accent/10 border-accent/30 text-accent' 
                        : 'bg-base border-border text-fg-subtle hover:border-fg-muted/30'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{day.label.slice(0, 3)}</span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-accent mt-1" />}
                  </button>
                )
              })}
            </div>

            {/* Asynchronous Alert */}
            {isAsynchronous && (
              <div className="ml-7 p-4 rounded-2xl border border-warning/30 bg-warning/5 flex items-start gap-3 animate-blur-in">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-warning">Rotazione Asincrona Rilevata</p>
                  <p className="text-[11px] text-warning/80 mt-1 leading-relaxed">
                    Il piano ha {planDays.length} sessioni ma hai scelto {selectedDays.length} giorni di allenamento. 
                    Il sistema adatterà la rotazione automaticamente: impiegherai più di una settimana per completare un microciclo.
                  </p>
                </div>
              </div>
            )}
            {selectedDays.length > planDays.length && (
               <div className="ml-7 p-4 rounded-2xl border border-accent/30 bg-accent/5 flex items-start gap-3 animate-blur-in">
               <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
               <div>
                 <p className="text-xs font-black text-accent">Rotazione Accelerata</p>
                 <p className="text-[11px] text-accent/80 mt-1 leading-relaxed">
                   Ti alleni più giorni delle sessioni previste. Le sessioni ricominceranno a ruotare prima della fine della settimana (es. A B C A).
                 </p>
               </div>
             </div>
            )}
          </section>

          {/* 2. Data Inizio */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-primary flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded bg-fg-muted/20 flex items-center justify-center text-[10px]">2</span>
                Da quando iniziamo?
              </h3>
              <p className="text-[11px] text-fg-subtle ml-7">Il sistema calcolerà le date a partire da questo giorno.</p>
            </div>
            
            <div className="pl-7">
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-base border border-border text-primary font-bold text-sm focus:border-accent outline-none"
              />
            </div>
          </section>

          {/* 3. Sessione di Partenza */}
          <section className="space-y-4 pb-4">
            <div>
              <h3 className="text-sm font-black text-primary flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded bg-fg-muted/20 flex items-center justify-center text-[10px]">3</span>
                Sessione di partenza
              </h3>
              <p className="text-[11px] text-fg-subtle ml-7">Se hai già fatto allenamenti questa settimana, puoi iniziare da una sessione avanzata.</p>
            </div>
            
            <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {planDays.map((day, idx) => (
                <button
                  key={day.id}
                  onClick={() => setStartSessionIdx(idx)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    startSessionIdx === idx 
                      ? 'bg-accent/10 border-accent text-primary shadow-[inset_0_0_0_1px_var(--accent)]' 
                      : 'bg-base border-border text-fg-muted hover:border-fg-muted/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${startSessionIdx === idx ? 'bg-accent text-white' : 'glass'}`}>
                    {day.dayLabel}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${startSessionIdx === idx ? 'text-primary' : ''}`}>{day.focus || 'Allenamento'}</p>
                    {startSessionIdx === idx && <p className="text-[9px] text-accent font-black uppercase tracking-widest mt-0.5">Selezionata</p>}
                  </div>
                  {startSessionIdx === idx && <Check className="w-4 h-4 text-accent" />}
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-base shrink-0 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-3 rounded-xl text-xs font-bold text-fg-muted hover:text-primary transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSchedule}
            disabled={loading || selectedDays.length === 0}
            className="btn-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Pianificazione...' : 'Genera Calendario'}
          </button>
        </div>

      </div>
    </div>
  )
}

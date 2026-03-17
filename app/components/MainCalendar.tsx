'use client'

import { useState, useEffect } from 'react'
import { 
  ChevronLeft, ChevronRight, Check, X, 
  Dumbbell, Utensils, Zap, Activity, Info, Clock, TrendingUp
} from 'lucide-react'
import { getCalendarMonthData, logPlannedSessionRetroactive, type CalendarDayData } from '@/app/actions/calendar'
import { markSessionSkipped } from '@/app/actions/plans'

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

export default function MainCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [days, setDays] = useState<CalendarDayData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null)
  
  // Retroactive log form state
  const [showLogForm, setShowLogForm] = useState(false)
  const [duration, setDuration] = useState('')
  const [load, setLoad] = useState('')
  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchMonthData = async (date: Date) => {
    setLoading(true)
    const data = await getCalendarMonthData(date.getFullYear(), date.getMonth() + 1)
    setDays(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMonthData(currentDate)
  }, [currentDate])

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleRetroactiveLog = async () => {
    if (!selectedDay?.planned || !selectedDay.date) return
    setSubmitting(true)
    try {
      await logPlannedSessionRetroactive({
        plannedSessionId: selectedDay.planned.id,
        date: selectedDay.date,
        durationMin: duration ? parseInt(duration) : undefined,
        trainingLoad: load ? parseFloat(load) : undefined,
        rpe: rpe ? parseInt(rpe) : undefined,
        notes: notes || undefined
      })
      setShowLogForm(false)
      fetchMonthData(currentDate)
      setSelectedDay(null)
    } catch (error) {
      console.error(error)
      alert("Errore durante il salvataggio")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (!selectedDay?.planned) return
    if (!confirm("Segnare questa sessione come saltata?")) return
    await markSessionSkipped(selectedDay.planned.id)
    fetchMonthData(currentDate)
    setSelectedDay(null)
  }

  // Calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7 // Adjust for Monday start
  const blanks = Array.from({ length: startOffset }, (_, i) => i)

  return (
    <div className="space-y-6">
      {/* Header navigazione */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-subtle">
        <h2 className="text-xl font-black text-primary">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-base border border-subtle hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 rounded-xl bg-base border border-subtle text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">
            Oggi
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-base border border-subtle hover:bg-white/5 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Griglia Calendario */}
      <div className="bg-surface rounded-3xl border border-subtle overflow-hidden">
        {/* Giorni della settimana */}
        <div className="grid grid-cols-7 border-b border-subtle bg-base/50">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted">
              {d}
            </div>
          ))}
        </div>

        {/* Celle giorni */}
        <div className="grid grid-cols-7 relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-sm flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {blanks.map(b => (
            <div key={`blank-${b}`} className="aspect-square border-r border-b border-subtle last:border-r-0 opacity-20 bg-base/20" />
          ))}

          {days.map((day, i) => {
            const isToday = day.date === new Date().toISOString().split('T')[0]
            const isCompleted = day.planned?.status === 'COMPLETED' || !!day.workout
            const isSkipped = day.planned?.status === 'SKIPPED'
            const isPending = day.planned?.status === 'PENDING' && !day.workout
            
            return (
              <button 
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square border-r border-b border-subtle last:border-r-0 relative group p-1 transition-all
                  ${isToday ? 'bg-accent/5' : 'hover:bg-white/5'}
                `}
              >
                {/* Numero giorno */}
                <span className={`absolute top-2 left-2 text-[10px] font-black tabular-nums transition-colors
                  ${isToday ? 'text-accent' : 'text-muted group-hover:text-primary'}
                `}>
                  {i + 1}
                </span>

                {/* Indicatori Attività */}
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  {/* Workout Pip */}
                  {(day.planned || day.workout) && (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                      ${isCompleted ? 'bg-positive text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 
                        isSkipped ? 'bg-negative/20 text-negative' :
                        isPending ? 'border-2 border-dashed border-accent/40 text-accent/60' : 'bg-foreground/5 text-muted'}
                    `}>
                      <Dumbbell className="w-4 h-4" />
                    </div>
                  )}

                  {/* Altri Pips (Dots) */}
                  <div className="flex gap-1">
                    {day.hasNutrition && <div className="w-1.5 h-1.5 rounded-full bg-warning" />}
                    {day.hasRecovery && <div className="w-1.5 h-1.5 rounded-full bg-positive" />}
                    {day.hasBiometrics && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pannello Dettaglio Giorno (Drawer-like) */}
      {selectedDay && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedDay(null); setShowLogForm(false) }} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-subtle shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-primary">Dettaglio Giorno</h3>
                <p className="text-muted font-bold uppercase tracking-widest text-xs">
                  {new Date(selectedDay.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button onClick={() => { setSelectedDay(null); setShowLogForm(false) }} className="p-3 rounded-full bg-base border border-subtle hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Stato Allenamento */}
              {(() => {
                const isSkipped = selectedDay.planned?.status === 'SKIPPED'
                return (
                  <div className="card p-6 border-accent/20">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedDay.workout ? 'bg-positive text-white' : 'bg-accent/10 text-accent'}`}>
                        <Dumbbell className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-primary">Allenamento</h4>
                        <p className="text-sm text-muted">
                          {selectedDay.planned ? `Pianificato: ${selectedDay.planned.label}` : 'Nessun allenamento pianificato'}
                        </p>
                      </div>
                    </div>

                    {selectedDay.workout ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-2xl bg-base border border-subtle">
                          <p className="text-[10px] uppercase font-bold text-muted mb-1">Durata</p>
                          <p className="text-lg font-black text-primary">{selectedDay.workout.duration || '--'} min</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-base border border-subtle">
                          <p className="text-[10px] uppercase font-bold text-muted mb-1">Load</p>
                          <p className="text-lg font-black text-primary">{selectedDay.workout.load || '--'}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-base border border-subtle">
                          <p className="text-[10px] uppercase font-bold text-muted mb-1">RPE</p>
                          <p className="text-lg font-black text-primary">{selectedDay.workout.rpe || '--'}/10</p>
                        </div>
                      </div>
                    ) : selectedDay.planned?.status === 'PENDING' ? (
                      <div className="space-y-3">
                        {!showLogForm ? (
                          <div className="flex flex-col gap-3">
                            <button 
                              onClick={() => setShowLogForm(true)}
                              className="w-full py-4 bg-accent text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/20 active:scale-95 transition-transform"
                            >
                              Logga Risultati Orologio
                            </button>
                            <button 
                              onClick={handleSkip}
                              className="w-full py-4 bg-foreground/5 text-muted rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-negative/10 hover:text-negative transition-colors"
                            >
                              Segna come saltata
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Durata (min)</label>
                                <div className="relative">
                                  <Clock className="absolute left-3 top-3 w-4 h-4 text-muted" />
                                  <input 
                                    type="number" value={duration} onChange={e => setDuration(e.target.value)}
                                    className="w-full bg-base border border-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:border-accent outline-none" 
                                    placeholder="60"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Training Load</label>
                                <div className="relative">
                                  <TrendingUp className="absolute left-3 top-3 w-4 h-4 text-muted" />
                                  <input 
                                    type="number" value={load} onChange={e => setLoad(e.target.value)}
                                    className="w-full bg-base border border-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:border-accent outline-none" 
                                    placeholder="120"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">RPE (1-10)</label>
                              <input 
                                type="number" min="1" max="10" value={rpe} onChange={e => setRpe(e.target.value)}
                                className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-sm focus:border-accent outline-none" 
                                placeholder="8"
                              />
                            </div>
                            <textarea 
                              value={notes} onChange={e => setNotes(e.target.value)}
                              className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-sm focus:border-accent outline-none resize-none" 
                              placeholder="Note sessione..." rows={3}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setShowLogForm(false)}
                                className="flex-1 py-3 bg-foreground/5 text-muted rounded-xl font-bold text-xs uppercase tracking-widest"
                              >
                                Annulla
                              </button>
                              <button 
                                onClick={handleRetroactiveLog}
                                disabled={submitting}
                                className="flex-[2] py-3 bg-positive text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                              >
                                {submitting ? 'Salvataggio...' : 'Conferma Log'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : isSkipped ? (
                      <p className="text-center py-4 text-negative font-black uppercase tracking-widest text-xs bg-negative/5 rounded-2xl">
                        Sessione Saltata
                      </p>
                    ) : (
                      <p className="text-center py-4 text-muted font-bold text-xs italic">
                        Nessuna attività registrata
                      </p>
                    )}

                    {/* Tips AI */}
                    {!selectedDay.workout && selectedDay.planned && !isSkipped && (
                      <div className="p-4 mt-6 rounded-2xl bg-accent/5 border border-accent/10 flex gap-3 italic text-xs text-muted leading-relaxed">
                        <Info className="w-4 h-4 shrink-0 text-accent" />
                        Se hai completato questa sessione ma non avevi il telefono, inserisci qui i dati del tuo Suunto per non perdere il calcolo del carico settimanale.
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Altre attività */}
              <div className="grid grid-cols-1 gap-3">
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${selectedDay.hasNutrition ? 'bg-warning/5 border-warning/20 text-warning' : 'bg-base border-subtle text-muted'}`}>
                  <div className="flex items-center gap-3">
                    <Utensils className="w-5 h-5" />
                    <span className="font-bold text-sm">Nutrizione</span>
                  </div>
                  {selectedDay.hasNutrition ? <Check className="w-5 h-5" /> : <X className="w-5 h-5 opacity-30" />}
                </div>
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${selectedDay.hasRecovery ? 'bg-positive/5 border-positive/20 text-positive' : 'bg-base border-subtle text-muted'}`}>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5" />
                    <span className="font-bold text-sm">Recupero</span>
                  </div>
                  {selectedDay.hasRecovery ? <Check className="w-5 h-5" /> : <X className="w-5 h-5 opacity-30" />}
                </div>
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${selectedDay.hasBiometrics ? 'bg-accent/5 border-accent/20 text-accent' : 'bg-base border-subtle text-muted'}`}>
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5" />
                    <span className="font-bold text-sm">Biometria</span>
                  </div>
                  {selectedDay.hasBiometrics ? <Check className="w-5 h-5" /> : <X className="w-5 h-5 opacity-30" />}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

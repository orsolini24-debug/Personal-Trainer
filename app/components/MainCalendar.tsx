'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Play, X, Plus, Dumbbell,
  Utensils, Zap, Activity, Clock, TrendingUp, Flame,
  MapPin, Heart, Bot, Check, SkipForward, Upload,
  Calendar, ChevronDown, AlertCircle
} from 'lucide-react'
import {
  getCalendarMonthData, getDayDetail, logPlannedSessionRetroactive,
  runDailyAnalysis,
  deleteSkippedSessions, deletePastPendingSessions,
  deleteManualActivity,
  type CalendarDayData, type DayDetailData, type ManualActivitySummary
} from '@/app/actions/calendar'
import { markSessionSkipped, deletePlannedSession } from '@/app/actions/plans'
import { deleteSession } from '@/app/actions/training'
import { Trash2, CalendarX } from 'lucide-react'
import AddActivitySheet from '@/app/components/AddActivitySheet'

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

const SPORT_LABEL: Record<string, string> = {
  RUNNING: '🏃 Corsa', CYCLING: '🚴 Ciclismo', SWIMMING: '🏊 Nuoto',
  STRENGTH: '🏋️ Forza', YOGA: '🧘 Yoga', HIIT: '⚡ HIIT',
  WALKING: '🚶 Camminata', ROWING: '🚣 Canottaggio', SKIING: '⛷️ Sci', OTHER: '🎯 Altro'
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function MainCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [days, setDays] = useState<CalendarDayData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null)
  const [dayDetail, setDayDetail] = useState<DayDetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)

  // Retroactive log
  const [showLogForm, setShowLogForm] = useState(false)
  const [duration, setDuration] = useState('')
  const [load, setLoad] = useState('')
  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // AI analysis
  const [analyzingDay, startAnalysis] = useTransition()
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  const fetchMonthData = useCallback(async (date: Date) => {
    setLoading(true)
    const data = await getCalendarMonthData(date.getFullYear(), date.getMonth() + 1)
    setDays(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMonthData(currentDate)
  }, [currentDate, fetchMonthData])

  const handleDayClick = async (day: CalendarDayData) => {
    setSelectedDay(day)
    setDayDetail(null)
    setShowLogForm(false)
    setAnalysisResult(null)
    setDetailLoading(true)
    const detail = await getDayDetail(day.date)
    setDayDetail(detail)
    setDetailLoading(false)
  }

  const closeDrawer = () => {
    setSelectedDay(null)
    setDayDetail(null)
    setShowLogForm(false)
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
      closeDrawer()
    } catch {
      alert('Errore durante il salvataggio')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (!selectedDay?.planned) return
    if (!confirm('Segnare questa sessione come saltata?')) return
    await markSessionSkipped(selectedDay.planned.id)
    fetchMonthData(currentDate)
    closeDrawer()
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Eliminare definitivamente questa sessione pianificata?')) return
    const res = await deletePlannedSession(sessionId)
    if (res.success) {
      fetchMonthData(currentDate)
      closeDrawer()
    } else {
      alert(res.error)
    }
  }

  const handleDeleteWorkout = async (sessionId: string) => {
    if (!confirm('Eliminare definitivamente questo allenamento e tutti i suoi dati?')) return
    const res = await deleteSession(sessionId)
    if (res.success) {
      fetchMonthData(currentDate)
      closeDrawer()
    } else {
      alert(res.error)
    }
  }

  const handleDeleteManualActivityLocal = async (activityId: string) => {
    if (!confirm('Eliminare questa attività extra?')) return
    const res = await deleteManualActivity(activityId)
    if (res.success) {
      fetchMonthData(currentDate)
      // Refresh detail if open
      if (selectedDay) {
        getDayDetail(selectedDay.date).then(setDayDetail)
      }
    } else {
      alert('Errore durante l\'eliminazione')
    }
  }

  const handleCleanCalendar = async () => {
    if (!confirm('Vuoi eliminare tutte le sessioni saltate e quelle passate non completate?')) return
    setLoading(true)
    try {
      await deleteSkippedSessions()
      await deletePastPendingSessions()
      fetchMonthData(currentDate)
    } finally {
      setLoading(false)
    }
  }

  const handleRunAnalysis = () => {
    if (!selectedDay) return
    startAnalysis(async () => {
      const result = await runDailyAnalysis(selectedDay.date)
      if (result.success && result.analysisText) {
        setAnalysisResult(result.analysisText)
        fetchMonthData(currentDate)
      }
    })
  }

  // Calendar grid
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="relative">
      {/* ── Month navigator ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-2.5 rounded-xl bg-surface border border-border hover:border-accent/40 transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-muted" />
          </button>

          <h2 className="text-xl font-black text-primary min-w-[11rem] text-center">
            {MONTHS[month]} {year}
          </h2>

          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-2.5 rounded-xl bg-surface border border-border hover:border-accent/40 transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCleanCalendar}
            disabled={loading}
            className="p-2.5 rounded-xl bg-surface border border-border text-muted hover:text-[#EF4444] hover:border-[#EF4444]/40 transition-all active:scale-95 disabled:opacity-50"
            title="Pulisci calendario (elimina saltate e passate)"
          >
            <CalendarX className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-black uppercase tracking-widest text-muted hover:text-primary hover:border-accent/40 transition-all"
          >
            Oggi
          </button>
          <button
            onClick={() => { setSelectedDay({ date: todayStr, manualActivities: [], hasNutrition: false, hasRecovery: false, hasBiometrics: false }); setShowAddActivity(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
            style={{ background: 'var(--accent)' }}
          >
            <Plus className="w-3.5 h-3.5" /> Attività
          </button>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="bg-surface rounded-3xl border border-border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_SHORT.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-surface/70 backdrop-blur-sm flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty cells */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square border-r border-b border-border last:border-r-0 bg-base/30" />
          ))}

          {/* Day cells */}
          {days.map((day, i) => {
            const isToday = day.date === todayStr
            const isSelected = selectedDay?.date === day.date
            const isCompleted = day.planned?.status === 'COMPLETED' || !!day.workout
            const isSkipped = day.planned?.status === 'SKIPPED'
            const isPending = day.planned?.status === 'PENDING' && !day.workout
            const hasManual = day.manualActivities.length > 0
            const hasAnalysis = !!day.analysis?.hasAnalysis

            return (
              <button
                key={day.date}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square border-r border-b border-border last:border-r-0 relative flex flex-col items-center justify-start pt-2 pb-1 px-1
                  transition-all duration-150 group
                  ${isSelected ? 'bg-accent/10' : isToday ? 'bg-accent/5' : 'hover:bg-white/[0.03]'}
                `}
              >
                {/* Day number */}
                <span className={`
                  text-[11px] font-black tabular-nums mb-1 leading-none
                  ${isToday ? 'text-accent' : isSelected ? 'text-accent/80' : 'text-muted group-hover:text-primary'}
                `}>
                  {i + 1}
                </span>

                {/* Activity icons */}
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {/* Workout / Planned badge */}
                  {(day.planned || day.workout) && (
                    <div className={`
                      w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110
                      ${isCompleted
                        ? 'bg-[#10B981] text-white'
                        : isSkipped
                          ? 'bg-[#EF4444]/20 text-[#EF4444]'
                          : isPending
                            ? 'border-2 border-dashed text-accent/70'
                            : 'bg-foreground/5 text-muted'}
                    `}
                      style={isPending ? { borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' } : {}}
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Manual activity badge */}
                  {hasManual && (
                    <div className="flex gap-0.5">
                      {day.manualActivities.slice(0, 3).map((_, mi) => (
                        <div key={mi} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent2, #8B5CF6)' }} />
                      ))}
                    </div>
                  )}

                  {/* Data dots */}
                  <div className="flex gap-0.5">
                    {day.hasNutrition && <div className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />}
                    {day.hasRecovery && <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
                    {day.hasBiometrics && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                    {hasAnalysis && <div className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />}
                  </div>
                </div>

                {/* Today ring */}
                {isToday && (
                  <div className="absolute inset-0 rounded-none pointer-events-none border-t-2 opacity-60" style={{ borderColor: 'var(--accent)' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-4 mt-4 px-1">
        {[
          { color: '#10B981', label: 'Completato' },
          { color: 'var(--accent)', label: 'Pianificato', dashed: true },
          { color: 'var(--accent2, #8B5CF6)', label: 'Attività extra' },
          { color: '#EAB308', label: 'Nutrizione' },
          { color: '#EC4899', label: 'Analisi AI' },
        ].map(({ color, label, dashed }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-sm ${dashed ? 'border-2 border-dashed' : ''}`}
              style={{ background: dashed ? 'transparent' : color, borderColor: dashed ? color : undefined }}
            />
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Day detail drawer ── */}
      {selectedDay && !showAddActivity && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto animate-in slide-in-from-right duration-300"
            style={{ background: 'var(--bg-surface, #0F0F0F)', borderLeft: '1px solid var(--border)' }}
          >
            {/* Drawer header */}
            <div className="sticky top-0 z-10 px-6 py-5 border-b border-border"
              style={{ background: 'var(--bg-surface, #0F0F0F)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-0.5">
                    {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase()}
                  </p>
                  <h3 className="text-xl font-black text-primary">
                    {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddActivity(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Attività
                  </button>
                  <button onClick={closeDrawer} className="p-2.5 rounded-xl bg-base border border-border hover:bg-white/5 transition-all">
                    <X className="w-4 h-4 text-muted" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* ── Planned session ── */}
                  {(selectedDay.planned || dayDetail?.planned) && (
                    <PlannedSessionCard
                      day={selectedDay}
                      detail={dayDetail}
                      showLogForm={showLogForm}
                      setShowLogForm={setShowLogForm}
                      duration={duration} setDuration={setDuration}
                      load={load} setLoad={setLoad}
                      rpe={rpe} setRpe={setRpe}
                      notes={notes} setNotes={setNotes}
                      submitting={submitting}
                      onRetroLog={handleRetroactiveLog}
                      onSkip={handleSkip}
                      onDelete={handleDeleteSession}
                    />
                  )}

                  {/* ── Completed workout ── */}
                  {dayDetail?.workout && (
                    <WorkoutCard 
                      workout={dayDetail.workout} 
                      onDelete={handleDeleteWorkout} 
                    />
                  )}

                  {/* ── Manual activities ── */}
                  {(dayDetail?.manualActivities ?? selectedDay.manualActivities).length > 0 && (
                    <ManualActivitiesCard
                      activities={dayDetail?.manualActivities ?? selectedDay.manualActivities}
                      onDelete={handleDeleteManualActivityLocal}
                    />
                  )}

                  {/* ── No activity at all ── */}
                  {!selectedDay.planned && !dayDetail?.workout && (dayDetail?.manualActivities?.length ?? 0) === 0 && (
                    <div className="p-6 rounded-3xl border border-border bg-base/30 text-center">
                      <Calendar className="w-8 h-8 text-muted/40 mx-auto mb-3" />
                      <p className="text-sm font-bold text-muted">Nessuna attività in questo giorno</p>
                      <p className="text-xs text-muted/60 mt-1">Aggiungi un'attività manuale o importa dati da orologio</p>
                    </div>
                  )}

                  {/* ── Health indicators ── */}
                  <HealthIndicators day={selectedDay} detail={dayDetail} />

                  {/* ── AI analysis ── */}
                  <AnalysisCard
                    day={selectedDay}
                    detail={dayDetail}
                    analyzing={analyzingDay}
                    analysisResult={analysisResult}
                    onRunAnalysis={handleRunAnalysis}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Add activity sheet ── */}
      {showAddActivity && (
        <AddActivitySheet
          defaultDate={selectedDay?.date ?? todayStr}
          onClose={() => setShowAddActivity(false)}
          onSuccess={() => {
            setShowAddActivity(false)
            fetchMonthData(currentDate)
            if (selectedDay) {
              getDayDetail(selectedDay.date).then(setDayDetail)
            }
          }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function PlannedSessionCard({
  day, detail,
  showLogForm, setShowLogForm,
  duration, setDuration,
  load, setLoad,
  rpe, setRpe,
  notes, setNotes,
  submitting,
  onRetroLog,
  onSkip,
  onDelete
}: {
  day: CalendarDayData
  detail: DayDetailData | null
  showLogForm: boolean
  setShowLogForm: (v: boolean) => void
  duration: string; setDuration: (v: string) => void
  load: string; setLoad: (v: string) => void
  rpe: string; setRpe: (v: string) => void
  notes: string; setNotes: (v: string) => void
  submitting: boolean
  onRetroLog: () => void
  onSkip: () => void
  onDelete: (id: string) => void
}) {

  const planned = day.planned ?? detail?.planned
  if (!planned) return null

  const isCompleted = planned.status === 'COMPLETED'
  const isSkipped = planned.status === 'SKIPPED'
  const isPending = planned.status === 'PENDING'

  return (
    <div className="rounded-3xl border overflow-hidden" style={{
      background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
      borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)'
    }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2, #8B5CF6))' }}
          >
            {planned.label}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-accent">Piano</p>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full
                ${isCompleted ? 'bg-[#10B981]/20 text-[#10B981]' : isSkipped ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-accent/10 text-accent/70'}
              `}>
                {isCompleted ? '✓ Completato' : isSkipped ? '✗ Saltato' : '◎ Pianificato'}
              </span>
            </div>
            <p className="font-black text-primary truncate">{planned.focus ?? `Sessione ${planned.label}`}</p>
          </div>
          {!isCompleted && (
            <button
              onClick={() => onDelete(planned.id)}
              className="p-2 rounded-xl hover:bg-negative/10 text-muted hover:text-negative transition-all"
              title="Elimina sessione"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Exercise list */}
      {detail?.planned?.exercises && detail.planned.exercises.length > 0 && (
        <div className="px-5 py-3 border-b" style={{ borderColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">
            {detail.planned.exercises.length} esercizi
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detail.planned.exercises.map(ex => (
              <span key={ex.id} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-base border border-border text-muted">
                {ex.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4">
        {isPending && !detail?.workout && (
          <>
            {!showLogForm ? (
              <div className="flex gap-2">
                <Link
                  href={`/training/active?planDayId=${'planDayId' in planned ? planned.planDayId : ''}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-95"
                  style={{ background: 'var(--accent)', boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 25%, transparent)' }}
                >
                  <Play className="w-4 h-4" /> Avvia Ora
                </Link>
                <button
                  onClick={() => setShowLogForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm border border-border text-muted hover:text-primary hover:border-accent/40 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Log Orologio
                </button>
                <button
                  onClick={onSkip}
                  title="Salta"
                  className="p-3 rounded-2xl border border-border text-muted hover:border-[#EF4444]/40 hover:text-[#EF4444] transition-all"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Durata (min)</label>
                    <input
                      type="number" value={duration} onChange={e => setDuration(e.target.value)}
                      className="w-full bg-base border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent outline-none text-primary"
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Load</label>
                    <input
                      type="number" value={load} onChange={e => setLoad(e.target.value)}
                      className="w-full bg-base border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent outline-none text-primary"
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">RPE</label>
                    <input
                      type="number" min="1" max="10" value={rpe} onChange={e => setRpe(e.target.value)}
                      className="w-full bg-base border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent outline-none text-primary"
                      placeholder="8"
                    />
                  </div>
                </div>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full bg-base border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent outline-none resize-none text-primary"
                  placeholder="Note opzionali..." rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowLogForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-muted text-xs font-black uppercase tracking-widest"
                  >Annulla</button>
                  <button onClick={onRetroLog} disabled={submitting}
                    className="flex-[2] py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all"
                    style={{ background: '#10B981' }}
                  >
                    {submitting ? 'Salvataggio...' : 'Conferma'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {isCompleted && (
          <Link
            href={`/plan/day/${'planDayId' in planned ? planned.planDayId : ''}`}
            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black text-accent border border-current/20 hover:bg-accent/5 transition-all"
          >
            Vedi dettagli sessione <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
          </Link>
        )}

        {isSkipped && (
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#EF4444]/60 py-1">
            Sessione saltata
          </p>
        )}
      </div>
    </div>
  )
}

function WorkoutCard({ workout, onDelete }: { workout: NonNullable<DayDetailData['workout']>, onDelete: (id: string) => void }) {
  return (
    <div className="rounded-3xl border border-[#10B981]/20 overflow-hidden" style={{ background: 'color-mix(in srgb, #10B981 5%, transparent)' }}>
      <div className="px-5 py-4 border-b border-[#10B981]/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">Allenamento Completato</p>
            <p className="font-black text-primary">{workout.type} · {workout.exerciseCount} esercizi</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(workout.id)}
          className="p-2 rounded-xl hover:bg-negative/10 text-muted hover:text-negative transition-all"
          title="Elimina allenamento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-px p-4 bg-base/10">
        {[
          { icon: Clock, label: 'Durata', value: workout.duration ? `${workout.duration} min` : '—' },
          { icon: TrendingUp, label: 'Load', value: workout.load ?? '—' },
          { icon: Flame, label: 'RPE', value: workout.rpe ? `${workout.rpe}/10` : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-surface rounded-2xl px-3 py-3 text-center">
            <Icon className="w-4 h-4 text-muted mx-auto mb-1" />
            <p className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</p>
            <p className="text-base font-black text-primary">{value}</p>
          </div>
        ))}
      </div>
      {workout.notes && (
        <p className="px-5 pb-4 text-xs text-muted italic">{workout.notes}</p>
      )}
    </div>
  )
}

function ManualActivitiesCard({ activities, onDelete }: { activities: ManualActivitySummary[], onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? activities : activities.slice(0, 2)

  return (
    <div className="rounded-3xl border border-border overflow-hidden bg-surface">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted" />
          <p className="text-sm font-black text-primary">Attività Extra</p>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent/10 text-accent">
            {activities.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {shown.map(a => (
          <div key={a.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-primary truncate">
                  {SPORT_LABEL[a.sportType ?? ''] ?? a.customType ?? '🎯'} {a.title}
                </p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  {a.source === 'WATCH_IMPORT' ? '⌚ Importato' : a.source === 'IMAGE_OCR' ? '📷 OCR' : '✏️ Manuale'}
                </p>
              </div>
              <button
                onClick={() => onDelete(a.id)}
                className="p-2 rounded-xl hover:bg-negative/10 text-muted hover:text-negative transition-all shrink-0"
                title="Elimina attività"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 flex-wrap text-xs text-muted">
              {a.durationMin && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.durationMin} min</span>
              )}
              {a.distanceKm && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.distanceKm} km</span>
              )}
              {a.heartRateAvg && (
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{a.heartRateAvg} bpm</span>
              )}
              {a.calories && (
                <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{a.calories} kcal</span>
              )}
            </div>

            {/* AI summary */}
            {a.aiSummary && (
              <p className="mt-2 text-xs text-muted italic leading-relaxed border-l-2 pl-3" style={{ borderColor: 'var(--accent)' }}>
                {a.aiSummary}
              </p>
            )}
          </div>
        ))}
      </div>

      {activities.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 text-xs font-black text-accent uppercase tracking-widest border-t border-border hover:bg-accent/5 transition-colors"
        >
          {expanded ? 'Mostra meno ↑' : `+${activities.length - 2} altre ↓`}
        </button>
      )}
    </div>
  )
}

function HealthIndicators({ day, detail }: { day: CalendarDayData; detail: DayDetailData | null }) {
  const indicators = [
    {
      icon: Utensils, label: 'Nutrizione', active: day.hasNutrition,
      color: '#EAB308',
      detail: detail?.nutrition
        ? `${detail.nutrition.calories ?? '?'} kcal · P${detail.nutrition.protein ?? '?'}g C${detail.nutrition.carbs ?? '?'}g F${detail.nutrition.fat ?? '?'}g`
        : null
    },
    {
      icon: Zap, label: 'Recupero', active: day.hasRecovery,
      color: '#10B981',
      detail: detail?.recovery
        ? `Sonno ${detail.recovery.sleepMin ?? '?'} min (score ${detail.recovery.sleepScore ?? '?'}/100)${detail.recovery.hrv ? ` · HRV ${detail.recovery.hrv}` : ''}`
        : null
    },
    {
      icon: Activity, label: 'Biometria', active: day.hasBiometrics,
      color: 'var(--accent)',
      detail: detail?.biometrics
        ? `Peso ${detail.biometrics.weightKg ?? '?'} kg${detail.biometrics.fatPct ? ` · BF ${detail.biometrics.fatPct}%` : ''}`
        : null
    },
  ]

  if (!indicators.some(i => i.active)) return null

  return (
    <div className="rounded-3xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Dati Giornata</p>
      </div>
      <div className="divide-y divide-border">
        {indicators.filter(i => i.active).map(({ icon: Icon, label, color, detail: det }) => (
          <div key={label} className="flex items-start gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-primary">{label}</p>
              {det && <p className="text-[11px] text-muted mt-0.5">{det}</p>}
            </div>
            <Check className="w-4 h-4 shrink-0 mt-1" style={{ color }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisCard({
  day, detail, analyzing, analysisResult, onRunAnalysis
}: {
  day: CalendarDayData
  detail: DayDetailData | null
  analyzing: boolean
  analysisResult: string | null
  onRunAnalysis: () => void
}) {
  const existingAnalysis = detail?.analysis
  const score = existingAnalysis?.adherenceScore ?? day.analysis?.adherenceScore
  const text = analysisResult ?? existingAnalysis?.analysisText

  return (
    <div className="rounded-3xl border overflow-hidden" style={{
      background: 'color-mix(in srgb, #EC4899 4%, transparent)',
      borderColor: 'color-mix(in srgb, #EC4899 20%, transparent)'
    }}>
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'color-mix(in srgb, #EC4899 10%, transparent)' }}>
        <div className="w-9 h-9 rounded-xl bg-[#EC4899]/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-[#EC4899]" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#EC4899]">Analisi AI</p>
          <p className="text-sm font-black text-primary">Valutazione Giornata</p>
        </div>
        {score != null && (
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Aderenza</p>
            <p className="text-2xl font-black" style={{ color: score >= 80 ? '#10B981' : score >= 50 ? '#EAB308' : '#EF4444' }}>
              {Math.round(score)}%
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        {text ? (
          <>
            <p className="text-sm text-muted leading-relaxed mb-3 italic">{text}</p>
            {existingAnalysis?.suggestedAdaptations && (
              <div className="p-3 rounded-2xl border flex gap-2" style={{ borderColor: 'color-mix(in srgb, #EC4899 20%, transparent)', background: 'color-mix(in srgb, #EC4899 5%, transparent)' }}>
                <AlertCircle className="w-4 h-4 text-[#EC4899] shrink-0 mt-0.5" />
                <p className="text-xs text-muted leading-relaxed">{existingAnalysis.suggestedAdaptations}</p>
              </div>
            )}
            <button
              onClick={onRunAnalysis}
              disabled={analyzing}
              className="mt-3 w-full py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all disabled:opacity-50"
              style={{ borderColor: 'color-mix(in srgb, #EC4899 30%, transparent)', color: '#EC4899' }}
            >
              {analyzing ? 'Analisi in corso...' : 'Rigenera Analisi'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Esegui l'analisi AI per ricevere un feedback sulla giornata, confrontare il piano con l'eseguito e ottenere suggerimenti di adattamento.
            </p>
            <button
              onClick={onRunAnalysis}
              disabled={analyzing}
              className="w-full py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ background: '#EC4899', boxShadow: '0 4px 16px color-mix(in srgb, #EC4899 25%, transparent)' }}
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analisi in corso...
                </span>
              ) : (
                '✨ Analizza con AI'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

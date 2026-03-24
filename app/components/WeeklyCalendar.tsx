"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import {
  ChevronLeft, ChevronRight, Loader2, Plus,
  CheckCircle2, XCircle, Zap, X, Sparkles,
  CalendarDays, Dumbbell,
} from "lucide-react"
import {
  getWeekCalendarData,
  assignSessionToDay,
  removeSessionFromDay,
  type WeekCalendarSession,
} from "@/app/actions/plans"
import PlanScheduleWizard from "./PlanScheduleWizard"

// ─── Types ───────────────────────────────────────────────────────────────────


export type PlanDayOption = {
  id: string
  dayLabel: string
  focus: string | null
  exerciseCount: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_SHORT  = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
const DAY_FULL   = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
const MONTH_IT   = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"]

const SESSION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A:       { bg: "color-mix(in srgb, var(--accent)    14%, transparent)", text: "var(--accent)",   border: "color-mix(in srgb, var(--accent)    35%, transparent)" },
  B:       { bg: "color-mix(in srgb, var(--accent2)   14%, transparent)", text: "var(--accent2)",  border: "color-mix(in srgb, var(--accent2)   35%, transparent)" },
  C:       { bg: "color-mix(in srgb, var(--positive)  14%, transparent)", text: "var(--positive)", border: "color-mix(in srgb, var(--positive)  35%, transparent)" },
  D:       { bg: "color-mix(in srgb, var(--warning)   14%, transparent)", text: "var(--warning)",  border: "color-mix(in srgb, var(--warning)   35%, transparent)" },
  V1:      { bg: "color-mix(in srgb, var(--accent)    14%, transparent)", text: "var(--accent)",   border: "color-mix(in srgb, var(--accent)    35%, transparent)" },
  V2:      { bg: "color-mix(in srgb, var(--accent2)   14%, transparent)", text: "var(--accent2)",  border: "color-mix(in srgb, var(--accent2)   35%, transparent)" },
  OUTDOOR: { bg: "color-mix(in srgb, var(--positive)  14%, transparent)", text: "var(--positive)", border: "color-mix(in srgb, var(--positive)  35%, transparent)" },
}
function getColor(label: string) {
  return SESSION_COLORS[label] ?? {
    bg: "color-mix(in srgb, var(--fg-muted) 10%, transparent)",
    text: "var(--fg-muted)",
    border: "color-mix(in srgb, var(--fg-muted) 20%, transparent)",
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day))
  return date
}
function toISO(d: Date): string { return d.toISOString().split("T")[0] }
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setUTCDate(r.getUTCDate() + n); return r
}
function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const fmt = (d: Date) => `${d.getUTCDate()} ${MONTH_IT[d.getUTCMonth()]}`
  return `${fmt(monday)} – ${fmt(sunday)} ${sunday.getUTCFullYear()}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SessionPicker({
  planDays,
  onSelect,
  onClose,
}: {
  planDays: PlanDayOption[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <div
      className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl p-2 shadow-xl animate-slide-up"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      }}
    >
      <p
        className="text-[9px] font-black uppercase tracking-widest px-2 mb-2"
        style={{ color: "var(--fg-subtle)" }}
      >
        Assegna sessione
      </p>
      <div className="space-y-0.5">
        {planDays.map(pd => {
          const c = getColor(pd.dayLabel)
          return (
            <button
              key={pd.id}
              onClick={() => onSelect(pd.id)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-all"
              style={{ border: "1px solid transparent" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = c.bg
                el.style.borderColor = c.border
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = "transparent"
                el.style.borderColor = "transparent"
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0"
                style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
              >
                {pd.dayLabel}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--fg-primary)" }}>
                  {pd.focus || `Sessione ${pd.dayLabel}`}
                </p>
                <p className="text-[9px]" style={{ color: "var(--fg-subtle)" }}>
                  {pd.exerciseCount} esercizi
                </p>
              </div>
            </button>
          )
        })}
      </div>
      <button
        onClick={onClose}
        className="w-full mt-1.5 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all rounded-xl"
        style={{ color: "var(--fg-subtle)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-surface)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
      >
        Annulla
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeeklyCalendar({
  planId,
  planDays,
  initialSessions,
  initialTrainingDays = []
}: {
  planId: string | undefined
  planDays: PlanDayOption[]
  initialSessions: WeekCalendarSession[]
  initialTrainingDays?: number[]
}) {
  const todayISO = toISO(new Date())

  const [weekOffset, setWeekOffset]         = useState(0)
  const [sessions, setSessions]             = useState<WeekCalendarSession[]>(initialSessions)
  const [isPending, startTransition]        = useTransition()
  const [activePicker, setActivePicker]     = useState<string | null>(null)
  const [loadingDate, setLoadingDate]       = useState<string | null>(null)
  const [removingId, setRemovingId]         = useState<string | null>(null)
  const [isWizardOpen, setIsWizardOpen]     = useState(false)

  const monday    = addDays(getMonday(new Date()), weekOffset * 7)
  const mondayISO = toISO(monday)

  // Refetch when week changes
  useEffect(() => {
    if (weekOffset === 0) { setSessions(initialSessions); return }
    startTransition(async () => {
      const data = await getWeekCalendarData(mondayISO)
      setSessions(data)
    })
  }, [weekOffset, mondayISO, initialSessions])

  const dayMap: Record<string, WeekCalendarSession | undefined> = {}
  sessions.forEach(s => { dayMap[s.scheduledDate] = s })

  const refreshWeek = async () => {
    const data = await getWeekCalendarData(mondayISO)
    setSessions(data)
  }

  const handleAssign = async (planDayId: string, dateISO: string) => {
    if (!planId) return
    setLoadingDate(dateISO)
    setActivePicker(null)
    await assignSessionToDay(planId, planDayId, dateISO)
    await refreshWeek()
    setLoadingDate(null)
  }

  const handleRemove = async (sessionId: string) => {
    setRemovingId(sessionId)
    await removeSessionFromDay(sessionId)
    await refreshWeek()
    setRemovingId(null)
  }

  const handleAutoSchedule = () => {
    setIsWizardOpen(true)
  }

  const isCurrentWeek = weekOffset === 0

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--r-lg, 20px)",
        boxShadow: "var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
          >
            <CalendarDays className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Calendario Settimanale
            </p>
            <p className="text-sm font-semibold leading-none mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {formatWeekLabel(monday)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-schedule */}
          {planId && planDays.length > 0 && (
            <button
              onClick={handleAutoSchedule}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: "color-mix(in srgb, var(--accent2, var(--accent)) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent2, var(--accent)) 25%, transparent)",
                color: "var(--accent2, var(--accent))",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-pianifica
            </button>
          )}

          {/* Week navigation */}
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "var(--bg-elevated)", color: "var(--fg-muted)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: "color-mix(in srgb, var(--accent) 14%, transparent)",
                color: "var(--accent)",
                border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            >
              Oggi
            </button>
          )}
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "var(--bg-elevated)", color: "var(--fg-muted)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Days Grid ── */}
      {isPending ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--fg-subtle)" }} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[560px] gap-px" style={{ background: "var(--border-subtle)" }}>
            {Array.from({ length: 7 }, (_, i) => {
              const date     = addDays(monday, i)
              const iso      = toISO(date)
              const s        = dayMap[iso]
              const isToday  = iso === todayISO
              const isPast   = iso < todayISO
              const color    = s ? getColor(s.planDayLabel) : null
              const isLoading = loadingDate === iso
              const isRemoving = s && removingId === s.id
              const isPickerOpen = activePicker === iso

              return (
                <div
                  key={iso}
                  className="relative flex flex-col"
                  style={{
                    background: isToday
                      ? "color-mix(in srgb, var(--accent) 6%, var(--bg-elevated))"
                      : "var(--bg-elevated)",
                    minHeight: "180px",
                  }}
                >
                  {/* Day header */}
                  <div className="flex items-start justify-between px-3 pt-3 pb-2">
                    <div>
                      <p
                        className="text-[10px] font-black uppercase tracking-wider"
                        style={{ color: isToday ? "var(--accent)" : "var(--fg-subtle)" }}
                      >
                        {DAY_SHORT[i]}
                      </p>
                      <p
                        className="text-2xl font-black leading-none mt-0.5 tabular-nums"
                        style={{
                          color: isToday ? "var(--accent)"
                            : isPast   ? "var(--fg-subtle)"
                            : "var(--fg-primary)",
                        }}
                      >
                        {date.getUTCDate()}
                      </p>
                    </div>
                    {isToday && (
                      <span
                        className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--accent)", color: "var(--accent-on)" }}
                      >
                        oggi
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-2 pb-3">
                    {isLoading || isRemoving ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--fg-subtle)" }} />
                      </div>
                    ) : s ? (
                      /* Session card */
                      <div className="relative group/sess">
                        <Link
                          href={
                            s.status === "COMPLETED" && s.workoutSessionId
                              ? `/training/${s.workoutSessionId}`
                              : `/plan/day/${s.planDayId}`
                          }
                          className="block rounded-xl p-2.5 transition-all"
                          style={{
                            background: s.status === "COMPLETED"
                              ? "color-mix(in srgb, var(--positive) 12%, transparent)"
                              : s.status === "SKIPPED"
                              ? "color-mix(in srgb, var(--fg-subtle) 8%, transparent)"
                              : color!.bg,
                            border: `1px solid ${
                              s.status === "COMPLETED" ? "color-mix(in srgb, var(--positive) 35%, transparent)"
                              : s.status === "SKIPPED"  ? "var(--border-default)"
                              : color!.border
                            }`,
                          }}
                        >
                          {/* Label + status icon */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[9px] shrink-0"
                              style={{
                                background: s.status === "COMPLETED" ? "color-mix(in srgb, var(--positive) 20%, transparent)"
                                  : s.status === "SKIPPED" ? "color-mix(in srgb, var(--fg-subtle) 15%, transparent)"
                                  : color!.bg,
                                color: s.status === "COMPLETED" ? "var(--positive)"
                                  : s.status === "SKIPPED" ? "var(--fg-subtle)"
                                  : color!.text,
                              }}
                            >
                              {s.planDayLabel}
                            </div>
                            {s.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "var(--positive)" }} />}
                            {s.status === "SKIPPED"   && <XCircle      className="w-3 h-3 shrink-0" style={{ color: "var(--fg-subtle)" }} />}
                            {s.status === "PENDING" && isToday && <Zap className="w-3 h-3 shrink-0" style={{ color: color!.text }} />}
                          </div>

                          {/* Focus */}
                          {s.planDayFocus && (
                            <p
                              className="text-[10px] font-semibold leading-tight line-clamp-2"
                              style={{
                                color: s.status === "COMPLETED" ? "var(--positive)"
                                  : s.status === "SKIPPED" ? "var(--fg-subtle)"
                                  : color!.text,
                                opacity: 0.9,
                              }}
                            >
                              {s.planDayFocus}
                            </p>
                          )}

                          {/* Exercise count */}
                          {s.exerciseCount > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Dumbbell className="w-2.5 h-2.5 shrink-0" style={{ color: s.status === "COMPLETED" ? "var(--positive)" : s.status === "SKIPPED" ? "var(--fg-subtle)" : color!.text, opacity: 0.6 }} />
                              <p
                                className="text-[9px] font-medium"
                                style={{
                                  color: s.status === "COMPLETED" ? "var(--positive)"
                                    : s.status === "SKIPPED" ? "var(--fg-subtle)"
                                    : color!.text,
                                  opacity: 0.7,
                                }}
                              >
                                {s.exerciseCount} esercizi
                              </p>
                            </div>
                          )}

                          {/* Status label */}
                          {s.status === "COMPLETED" && (
                            <p className="text-[9px] mt-1.5 font-bold uppercase tracking-wide" style={{ color: "var(--positive)" }}>
                              ✓ Completata
                            </p>
                          )}
                          {s.status === "SKIPPED" && (
                            <p className="text-[9px] mt-1.5 font-bold uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>
                              — Saltata
                            </p>
                          )}
                          {s.status === "PENDING" && isToday && (
                            <p className="text-[9px] mt-1.5 font-bold uppercase tracking-wide" style={{ color: color!.text }}>
                              Da fare oggi
                            </p>
                          )}
                        </Link>

                        {/* Remove button — only for PENDING */}
                        {s.status === "PENDING" && (
                          <button
                            onClick={e => { e.stopPropagation(); handleRemove(s.id) }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/sess:opacity-100 scale-90 group-hover/sess:scale-100"
                            style={{ background: "var(--negative)", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                            title="Rimuovi sessione"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {/* Replace option for pending — show below if picker closed */}
                        {s.status === "PENDING" && planDays.length > 1 && (
                          <button
                            onClick={() => setActivePicker(isPickerOpen ? null : iso)}
                            className="w-full mt-1.5 text-[9px] font-semibold py-1 rounded-lg transition-all opacity-0 group-hover/sess:opacity-100"
                            style={{
                              color: "var(--fg-subtle)",
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            Cambia sessione
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Empty day */
                      planId && planDays.length > 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
                          <button
                            onClick={() => setActivePicker(isPickerOpen ? null : iso)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                            style={{
                              background: "var(--bg-surface)",
                              border: "1.5px dashed var(--border-strong)",
                              color: "var(--fg-subtle)",
                            }}
                            title="Aggiungi sessione"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <p className="text-[9px]" style={{ color: "var(--border-strong)" }}>Riposo</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full py-4">
                          <p className="text-[9px]" style={{ color: "var(--border-default)" }}>—</p>
                        </div>
                      )
                    )}
                  </div>

                  {/* Session picker dropdown */}
                  {isPickerOpen && planDays.length > 0 && (
                    <SessionPicker
                      planDays={planDays}
                      onSelect={id => handleAssign(id, iso)}
                      onClose={() => setActivePicker(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-wrap gap-2"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-4">
          {[
            { color: "var(--accent)",   label: "Pianificata" },
            { color: "var(--positive)", label: "Completata" },
            { color: "var(--fg-subtle)",label: "Saltata" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[9px] font-semibold" style={{ color: "var(--fg-subtle)" }}>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[9px]" style={{ color: "var(--fg-subtle)" }}>
          Clicca + per assegnare · × per rimuovere
        </p>
      </div>

      {/* ── Wizard ── */}
      {isWizardOpen && planId && (
        <PlanScheduleWizard
          planId={planId}
          planDays={planDays}
          initialTrainingDays={initialTrainingDays}
          onClose={() => {
            setIsWizardOpen(false)
            refreshWeek()
          }}
        />
      )}
    </div>
  )
}

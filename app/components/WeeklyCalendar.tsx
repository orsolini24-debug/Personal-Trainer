"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, CalendarDays, Zap, CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react"
import { getWeekCalendarData, schedulePlanForWeek, type WeekCalendarSession } from "@/app/actions/plans"

const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getUTCDay()
  const diff = (day === 0 ? -6 : 1 - day)
  date.setUTCDate(date.getUTCDate() + diff)
  return date
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0]
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setUTCDate(result.getUTCDate() + n)
  return result
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${monday.toLocaleDateString("it-IT", opts)} – ${sunday.toLocaleDateString("it-IT", opts)}`
}

const SESSION_TYPE_COLORS: Record<string, string> = {
  A: "var(--accent)",
  B: "var(--accent2)",
  C: "var(--positive)",
  D: "var(--warning)",
  V1: "var(--accent)",
  V2: "var(--accent2)",
  OUTDOOR: "var(--positive)",
  OTHER: "var(--fg-muted)",
}

export default function WeeklyCalendar({
  planId,
  initialSessions,
}: {
  planId: string | undefined
  initialSessions: WeekCalendarSession[]
}) {
  const todayISO = toISO(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [sessions, setSessions] = useState<WeekCalendarSession[]>(initialSessions)
  const [isPending, startTransition] = useTransition()
  const [isScheduling, setIsScheduling] = useState(false)

  const monday = addDays(getMonday(new Date()), weekOffset * 7)
  const mondayISO = toISO(monday)

  // Refetch when week changes
  useEffect(() => {
    if (weekOffset === 0) {
      setSessions(initialSessions)
      return
    }
    startTransition(async () => {
      const data = await getWeekCalendarData(mondayISO)
      setSessions(data)
    })
  }, [weekOffset, mondayISO, initialSessions])

  const handleSchedule = async () => {
    if (!planId) return
    setIsScheduling(true)
    await schedulePlanForWeek(planId, mondayISO)
    const data = await getWeekCalendarData(mondayISO)
    setSessions(data)
    setIsScheduling(false)
  }

  // Build 7-day map
  const dayMap: Record<string, WeekCalendarSession | undefined> = {}
  sessions.forEach(s => { dayMap[s.scheduledDate] = s })

  const isCurrentWeek = weekOffset === 0

  return (
    <div className="rounded-[2rem] overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
            <CalendarDays className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--accent)" }}>Calendario</p>
            <p className="text-[11px] font-semibold" style={{ color: "var(--fg-muted)" }}>{formatWeekLabel(monday)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
              className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
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

      {/* Days grid */}
      <div className="p-4">
        {isPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--fg-subtle)" }} />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(monday, i)
              const iso = toISO(date)
              const s = dayMap[iso]
              const isToday = iso === todayISO
              const dayNum = date.getUTCDate()
              const accent = s ? (SESSION_TYPE_COLORS[s.planDayLabel] || "var(--accent)") : undefined

              return (
                <div key={iso} className="flex flex-col items-center gap-1">
                  {/* Day label */}
                  <span className="text-[9px] font-bold uppercase" style={{ color: isToday ? "var(--accent)" : "var(--fg-subtle)" }}>
                    {DAY_LABELS[i]}
                  </span>

                  {/* Day cell */}
                  {s ? (
                    <Link
                      href={s.status === "COMPLETED" && s.workoutSessionId
                        ? `/training/${s.workoutSessionId}`
                        : `/plan/day/${s.planDayId}`}
                      className="w-full"
                    >
                      <div
                        className="relative rounded-xl p-1.5 flex flex-col items-center gap-0.5 transition-all cursor-pointer"
                        style={{
                          background: s.status === "COMPLETED"
                            ? `color-mix(in srgb, var(--positive) 15%, transparent)`
                            : s.status === "SKIPPED"
                              ? `color-mix(in srgb, var(--fg-subtle) 10%, transparent)`
                              : `color-mix(in srgb, ${accent} 15%, transparent)`,
                          border: `1px solid ${
                            s.status === "COMPLETED" ? "var(--positive)"
                            : s.status === "SKIPPED" ? "var(--border-default)"
                            : accent
                          }${isToday ? "" : "88"}`,
                          outline: isToday ? `2px solid ${accent}` : undefined,
                          outlineOffset: isToday ? "2px" : undefined,
                        }}
                      >
                        <span className="text-[11px] font-black tabular-nums" style={{
                          color: s.status === "COMPLETED" ? "var(--positive)"
                            : s.status === "SKIPPED" ? "var(--fg-subtle)"
                            : accent
                        }}>
                          {dayNum}
                        </span>
                        <span className="text-[8px] font-black" style={{
                          color: s.status === "COMPLETED" ? "var(--positive)"
                            : s.status === "SKIPPED" ? "var(--fg-subtle)"
                            : accent
                        }}>
                          {s.planDayLabel}
                        </span>
                        {/* Status icon overlay */}
                        {s.status === "COMPLETED" && (
                          <CheckCircle2 className="w-2.5 h-2.5" style={{ color: "var(--positive)" }} />
                        )}
                        {s.status === "SKIPPED" && (
                          <XCircle className="w-2.5 h-2.5" style={{ color: "var(--fg-subtle)" }} />
                        )}
                        {s.status === "PENDING" && isToday && (
                          <Zap className="w-2.5 h-2.5" style={{ color: accent }} />
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div
                      className="w-full rounded-xl p-1.5 flex flex-col items-center gap-0.5"
                      style={{
                        background: isToday ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "var(--bg-elevated)",
                        border: `1px solid ${isToday ? "var(--accent)44" : "var(--border-subtle)"}`,
                        outline: isToday ? "2px solid var(--accent)44" : undefined,
                        outlineOffset: isToday ? "2px" : undefined,
                      }}
                    >
                      <span className="text-[11px] font-black tabular-nums" style={{ color: isToday ? "var(--accent)" : "var(--fg-subtle)" }}>
                        {dayNum}
                      </span>
                      <span className="text-[8px]" style={{ color: "var(--border-default)" }}>—</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Schedule button */}
        {planId && (
          <button
            onClick={handleSchedule}
            disabled={isScheduling}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              border: "1px dashed color-mix(in srgb, var(--accent) 50%, transparent)",
              color: "var(--accent)",
            }}
          >
            {isScheduling ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Pianificazione…</>
            ) : (
              <><Calendar className="w-3.5 h-3.5" /> Pianifica questa settimana</>
            )}
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {[
          { color: "var(--accent)", label: "Pianificata" },
          { color: "var(--positive)", label: "Completata" },
          { color: "var(--fg-subtle)", label: "Saltata" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[9px] font-semibold" style={{ color: "var(--fg-subtle)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format, startOfWeek, addDays, isSameDay, differenceInCalendarWeeks } from "date-fns"
import { it } from "date-fns/locale"
import { Activity, Flame, CalendarDays, Dumbbell, Play, BookOpen, ChevronRight, Eye, Plus } from "lucide-react"
import { redirect } from "next/navigation"
import NewSessionModal from "./new-session-modal"

const SESSION_COLORS: Record<string, string> = {
  A: 'var(--positive)', B: 'var(--accent)', C: 'var(--accent2)', D: 'var(--warning)',
  V1: 'var(--negative)', V2: 'var(--fg-muted)',
}

const SESSION_FOCUS: Record<string, string> = {
  A: 'Lower Posteriore', B: 'Upper Push', C: 'Upper Pull', D: 'Lower Anteriore',
  V1: 'Cardio & Atletica', V2: 'Core & Mobilità',
}

const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

export default async function TrainingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  const thirtyDaysAgo = new Date(todayUTC)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [plannedToday, sessions] = await Promise.all([
    prisma.plannedSession.findFirst({
      where: { userId, scheduledDate: todayUTC, status: 'PENDING' },
      include: {
        planDay: { include: { planExercises: { orderBy: { orderIndex: 'asc' }, take: 6 } } },
      },
    }),
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 50,
      include: { _count: { select: { exercises: true } } },
    }),
  ])

  const totalSessions = sessions.length
  const tlSessions = sessions.filter(s => s.trainingLoad != null)
  const avgTL = tlSessions.length > 0
    ? Math.round(tlSessions.reduce((acc, s) => acc + (s.trainingLoad || 0), 0) / tlSessions.length)
    : 0

  // Streak
  let streak = 0
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const sortedDates = Array.from(new Set(sessions.map(s => {
    const d = new Date(s.date); d.setUTCHours(0, 0, 0, 0); return d.getTime()
  }))).sort((a, b) => b - a)
  if (sortedDates.length > 0) {
    let cur = today.getTime()
    if (sortedDates[0] === cur || sortedDates[0] === cur - 86400000) {
      streak = 1; cur = sortedDates[0]
      for (let i = 1; i < sortedDates.length; i++) {
        if (sortedDates[i] === cur - 86400000) { streak++; cur -= 86400000 } else break
      }
    }
  }

  // Week strip — Monday-based current week
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const sessionDates = sessions.map(s => { const d = new Date(s.date); d.setUTCHours(0,0,0,0); return d })

  const sessionColor = plannedToday ? (SESSION_COLORS[plannedToday.planDay?.dayLabel ?? ''] ?? 'var(--fg-muted)') : 'var(--fg-muted)'

  // Group sessions by week
  interface SessionGroup { label: string; sessions: typeof sessions }
  const groups: SessionGroup[] = []
  const groupMap = new Map<number, typeof sessions>()

  sessions.forEach(s => {
    const d = new Date(s.date)
    const weeksAgo = differenceInCalendarWeeks(today, d, { weekStartsOn: 1 })
    if (!groupMap.has(weeksAgo)) groupMap.set(weeksAgo, [])
    groupMap.get(weeksAgo)!.push(s)
  })

  groupMap.forEach((sess, weeksAgo) => {
    let label: string
    if (weeksAgo === 0) label = 'Questa settimana'
    else if (weeksAgo === 1) label = 'Settimana scorsa'
    else label = `${weeksAgo} settimane fa`
    groups.push({ label, sessions: sess })
  })
  const sortedGroups: SessionGroup[] = []
  Array.from(groupMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([weeksAgo, sess]) => {
    let label: string
    if (weeksAgo === 0) label = 'Questa settimana'
    else if (weeksAgo === 1) label = 'Settimana scorsa'
    else label = `${weeksAgo} settimane fa`
    sortedGroups.push({ label, sessions: sess })
  })

  return (
    <div className="animate-page athletic-panel max-w-4xl mx-auto pb-24">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4" style={{ animation: 'fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: 'var(--accent)' }}>
            Training Log
          </p>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>
            Allenamenti
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/training/library"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>
            <BookOpen className="w-4 h-4" />
          </Link>
          <NewSessionModal />
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="flex gap-3 px-4 mb-5" style={{ animation: 'fade-up 0.35s 60ms cubic-bezier(0.16,1,0.3,1) both' }}>
        {[
          { label: 'Sessioni', value: String(totalSessions), color: 'var(--accent)' },
          { label: 'TL medio', value: avgTL ? String(avgTL) : '—', color: 'var(--accent2)' },
          { label: 'Streak', value: `${streak}g`, color: 'var(--warning)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex-1 py-3.5 px-3 rounded-2xl text-center transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', cursor: 'default' }}>
            <p className="text-xl font-black tabular-nums" style={{ color, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.04em' }}>{value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Week strip ── */}
      <div className="mx-4 mb-5 px-4 py-3 rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--fg-muted)' }}>
          Settimana corrente
        </p>
        <div className="flex justify-between">
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, today)
            const hasSession = sessionDates.some(d => isSameDay(d, day))
            const isFuture = day > today
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase"
                  style={{ color: isToday ? 'var(--accent)' : 'var(--fg-subtle)' }}>
                  {DAY_LABELS[idx]}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black"
                  style={{
                    background: isToday
                      ? 'var(--accent)'
                      : hasSession
                        ? 'color-mix(in srgb, var(--positive) 15%, var(--bg-elevated))'
                        : 'var(--bg-elevated)',
                    border: isToday
                      ? 'none'
                      : hasSession
                        ? '1px solid rgba(52,211,153,0.3)'
                        : '1px solid var(--border-subtle)',
                    color: isToday ? 'var(--accent-on)' : hasSession ? 'var(--positive)' : 'var(--fg-subtle)',
                    opacity: isFuture && !isToday ? 0.45 : 1,
                  }}>
                  {hasSession && !isToday ? '✓' : format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Today's session ── */}
      {plannedToday && plannedToday.planDay && (
        <div className="mx-4 mb-5 rounded-[1.75rem] overflow-hidden"
          style={{
            background: `color-mix(in srgb, ${sessionColor} 6%, var(--bg-surface))`,
            border: `1.5px solid color-mix(in srgb, ${sessionColor} 25%, transparent)`,
          }}>
          {/* Color accent line */}
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${sessionColor}, ${sessionColor}40, transparent)` }} />

          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0"
                style={{ background: `color-mix(in srgb, ${sessionColor} 18%, var(--bg-elevated))`, color: sessionColor }}>
                {plannedToday.planDay.dayLabel}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: sessionColor }}>
                  Sessione di Oggi
                </p>
                <p className="font-black text-lg leading-tight mt-0.5" style={{ color: 'var(--fg-primary)' }}>
                  {SESSION_FOCUS[plannedToday.planDay.dayLabel] ?? plannedToday.planDay.dayLabel}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  {plannedToday.planDay.planExercises.length} esercizi
                </p>
              </div>
            </div>

            {/* Exercise mini-list */}
            <div className="space-y-1 mb-4">
              {plannedToday.planDay.planExercises.slice(0, 5).map((pe, idx) => (
                <div key={pe.id} className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                    style={{ background: `color-mix(in srgb, ${sessionColor} 15%, transparent)`, color: sessionColor }}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--fg-primary)' }}>
                    {pe.name}
                  </span>
                  <span className="text-xs font-medium tabular-nums shrink-0" style={{ color: 'var(--fg-muted)' }}>
                    {pe.sets}×{pe.repsMin === pe.repsMax ? pe.repsMin : `${pe.repsMin}–${pe.repsMax}`}
                  </span>
                </div>
              ))}
              {plannedToday.planDay.planExercises.length > 5 && (
                <p className="text-[11px] pl-6" style={{ color: 'var(--fg-muted)' }}>
                  +{plannedToday.planDay.planExercises.length - 5} altri...
                </p>
              )}
            </div>

            {/* CTAs */}
            <div className="flex gap-2">
              <Link href={`/plan/day/${plannedToday.planDay.id}`}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-black transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)', flex: 1 }}>
                <Eye className="w-3.5 h-3.5" /> Scheda
              </Link>
              <Link href={`/training/active?planDayId=${plannedToday.planDay.id}&plannedSessionId=${plannedToday.id}`}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all"
                style={{
                  background: sessionColor, color: 'var(--accent-on)',
                  boxShadow: `0 6px 20px color-mix(in srgb, ${sessionColor} 35%, transparent)`,
                  flex: 2,
                }}>
                <Play className="w-4 h-4 fill-current" /> Inizia Sessione
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Session history ── */}
      <div className="px-4" style={{ animation: 'fade-up 0.4s 180ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
          Storico
        </p>

        {sessions.length === 0 ? (
          <div className="text-center py-16 rounded-[2rem]"
            style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)' }}>
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <Dumbbell className="w-7 h-7" style={{ color: 'var(--fg-subtle)', opacity: 0.5 }} />
            </div>
            <p className="font-bold text-sm" style={{ color: 'var(--fg-muted)' }}>Nessuna sessione registrata</p>
            <p className="text-xs mt-1.5 mb-4" style={{ color: 'var(--fg-subtle)' }}>Inizia il tuo primo allenamento!</p>
            <Link href="/training/active"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 4px 14px var(--glow-accent)', textDecoration: 'none' }}>
              <Play className="w-4 h-4 fill-current" /> Nuovo Allenamento
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedGroups.map(({ label, sessions: groupSessions }) => (
              <div key={label}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2.5 px-1"
                  style={{ color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
                <div className="space-y-2">
                  {groupSessions.map(s => {
                    const color = SESSION_COLORS[s.type] ?? 'var(--fg-muted)'
                    return (
                      <Link key={s.id} href={`/training/${s.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                        <div
                          className="session-card flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: `3px solid ${color}`,
                          }}>
                          {/* Type badge */}
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                            style={{
                              background: `color-mix(in srgb, ${color} 15%, var(--bg-elevated))`,
                              color,
                              boxShadow: `0 2px 8px color-mix(in srgb, ${color} 20%, transparent)`,
                            }}>
                            {s.type}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--fg-primary)' }}>
                              {SESSION_FOCUS[s.type] ?? `Tipo ${s.type}`}
                            </p>
                            <p className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'var(--fg-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                              {format(new Date(s.date), "EEE dd MMM", { locale: it })}
                              {s.durationMin ? ` · ${s.durationMin}min` : ''}
                              {s.trainingLoad ? ` · TL ${s.trainingLoad}` : ''}
                            </p>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg"
                              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                              <Dumbbell className="w-3 h-3" style={{ color: 'var(--fg-subtle)' }} />
                              <span className="text-[11px] font-bold" style={{ color: 'var(--fg-muted)' }}>{s._count.exercises}</span>
                            </div>
                            {s.rpe && (
                              <div className="px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                                <span className="text-[11px] font-bold" style={{ color: 'var(--fg-muted)' }}>RPE {s.rpe}</span>
                              </div>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--fg-subtle)' }} />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Activity, Flame, CalendarDays, Dumbbell, Play, BookOpen, ChevronRight, Eye } from "lucide-react"
import { redirect } from "next/navigation"
import NewSessionModal from "./new-session-modal"

const SESSION_COLORS: Record<string, string> = {
  A: 'var(--positive)', B: 'var(--accent)', C: 'var(--accent2)', D: 'var(--warning)', V1: 'var(--negative)', V2: 'var(--fg-muted)',
}

const SESSION_FOCUS: Record<string, string> = {
  A: 'Lower Posteriore', B: 'Upper Push', C: 'Upper Pull', D: 'Lower Anteriore',
  V1: 'Cardio & Atletica', V2: 'Core & Mobilità',
}

export default async function TrainingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  const [plannedToday, sessions] = await Promise.all([
    prisma.plannedSession.findFirst({
      where: { userId, scheduledDate: todayUTC, status: 'PENDING' },
      include: {
        planDay: { include: { planExercises: { orderBy: { orderIndex: 'asc' }, take: 5 } } },
      },
    }),
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { _count: { select: { exercises: true } } },
    }),
  ])

  const totalSessions = sessions.length
  const tlSessions = sessions.filter(s => s.trainingLoad != null)
  const avgTL = tlSessions.length > 0
    ? Math.round(tlSessions.reduce((acc, s) => acc + (s.trainingLoad || 0), 0) / tlSessions.length)
    : 0

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

  const sessionColor = plannedToday ? (SESSION_COLORS[plannedToday.planDay?.dayLabel ?? ''] ?? 'var(--fg-muted)') : 'var(--fg-muted)'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--accent)' }}>
            Centro Allenamento
          </p>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>
            Training Log
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/training/library"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--fg-muted)',
            }}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Libreria</span>
          </Link>
          <NewSessionModal />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CalendarDays, label: 'Sessioni', value: totalSessions, color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)' },
          { icon: Activity, label: 'TL Medio', value: avgTL || '—', color: 'var(--accent2)', bg: 'color-mix(in srgb, var(--accent2) 12%, transparent)' },
          { icon: Flame, label: 'Streak', value: `${streak}g`, color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className="p-4 rounded-[1.5rem] flex flex-col gap-2"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg, color }}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider" style={{ color: 'var(--fg-subtle)' }}>{label}</p>
              <p className="text-xl font-black mt-0.5" style={{ color: 'var(--fg-primary)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's planned session banner */}
      {plannedToday && plannedToday.planDay && (
        <div
          className="rounded-[2rem] overflow-hidden"
          style={{
            background: `color-mix(in srgb, ${sessionColor} 8%, var(--bg-surface))`,
            border: `1px solid color-mix(in srgb, ${sessionColor} 30%, transparent)`,
          }}
        >
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${sessionColor}, transparent)` }} />
          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
                style={{ background: `color-mix(in srgb, ${sessionColor} 20%, transparent)`, color: sessionColor }}
              >
                {plannedToday.planDay.dayLabel}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: sessionColor }}>
                  Sessione di Oggi
                </p>
                <p className="font-black text-lg leading-tight" style={{ color: 'var(--fg-primary)' }}>
                  {SESSION_FOCUS[plannedToday.planDay.dayLabel] ?? plannedToday.planDay.dayLabel}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  {plannedToday.planDay.planExercises.length} esercizi programmati
                </p>
              </div>
            </div>

            {/* Exercise vertical list */}
            <div className="space-y-1.5 mb-4">
              {plannedToday.planDay.planExercises.map((pe, idx) => (
                <div key={pe.id} className="flex items-center gap-3 py-1">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: `color-mix(in srgb, ${sessionColor} 15%, transparent)`, color: sessionColor }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold flex-1 min-w-0 truncate" style={{ color: 'var(--fg-primary)' }}>
                    {pe.name}
                  </span>
                  <span className="text-xs shrink-0 font-medium tabular-nums" style={{ color: 'var(--fg-muted)' }}>
                    {pe.sets}×{pe.repsMin === pe.repsMax ? pe.repsMin : `${pe.repsMin}–${pe.repsMax}`}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex gap-2">
              <Link
                href={`/plan/day/${plannedToday.planDay.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold flex-1 transition-all border"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--fg-muted)',
                }}
              >
                <Eye className="w-4 h-4" />
                Scheda
              </Link>
              <Link
                href={`/training/active?planDayId=${plannedToday.planDay.id}&plannedSessionId=${plannedToday.id}`}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm flex-[2] transition-all"
                style={{
                  background: sessionColor,
                  color: 'white',
                  boxShadow: `0 4px 16px color-mix(in srgb, ${sessionColor} 35%, transparent)`,
                }}
              >
                <Play className="w-4 h-4 fill-white" />
                Inizia Sessione
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--fg-subtle)' }}>
          Storico Sessioni
        </h2>
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div
              className="text-center py-16 rounded-[2rem]"
              style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)' }}
            >
              <Dumbbell className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--fg-subtle)', opacity: 0.4 }} />
              <p className="font-bold" style={{ color: 'var(--fg-muted)' }}>Nessuna sessione registrata.</p>
              <p className="text-sm mt-1" style={{ color: 'var(--fg-subtle)' }}>Creane una nuova per iniziare!</p>
            </div>
          ) : (
            sessions.map(s => {
              const color = SESSION_COLORS[s.type] ?? 'var(--fg-muted)'
              return (
                <Link key={s.id} href={`/training/${s.id}`}>
                  <div
                    className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] transition-all hover:scale-[1.005]"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
                    >
                      {s.type}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: 'var(--fg-primary)' }}>
                        {SESSION_FOCUS[s.type] ?? `Tipo ${s.type}`}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                        {format(new Date(s.date), "dd MMM yyyy", { locale: it })}
                        {s.durationMin ? ` · ${s.durationMin} min` : ''}
                        {s.trainingLoad ? ` · TL ${s.trainingLoad}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                        <Dumbbell className="w-3 h-3" style={{ color: 'var(--fg-subtle)' }} />
                        <span className="text-xs font-bold" style={{ color: 'var(--fg-muted)' }}>{s._count.exercises}</span>
                      </div>
                      {s.rpe && (
                        <div className="px-2.5 py-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                          <span className="text-xs font-bold" style={{ color: 'var(--fg-muted)' }}>RPE {s.rpe}</span>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--fg-subtle)' }} />
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

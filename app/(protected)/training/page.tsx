import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Activity, Flame, CalendarDays, Dumbbell, Play, BookOpen, ChevronRight } from "lucide-react"
import { redirect } from "next/navigation"
import NewSessionModal from "./new-session-modal"

const SESSION_COLORS: Record<string, string> = {
  A: '#10b981', B: '#3b82f6', C: '#8b5cf6', D: '#f59e0b', V1: '#ef4444', V2: '#64748b',
}

const SESSION_FOCUS: Record<string, string> = {
  A: 'Lower Posteriore', B: 'Upper Push', C: 'Upper Pull', D: 'Lower Anteriore',
  V1: 'Cardio & Atletica', V2: 'Core & Mobilità',
}

export default async function TrainingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  // Today's planned session
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  const [plannedToday, sessions] = await Promise.all([
    prisma.plannedSession.findFirst({
      where: { userId, scheduledDate: todayUTC, status: 'PENDING' },
      include: {
        planDay: { include: { planExercises: { orderBy: { orderIndex: 'asc' }, take: 4 } } },
      },
    }),
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { _count: { select: { exercises: true } } },
    }),
  ])

  // Stats
  const totalSessions = sessions.length
  const tlSessions = sessions.filter(s => s.trainingLoad != null)
  const avgTL = tlSessions.length > 0
    ? Math.round(tlSessions.reduce((acc, s) => acc + (s.trainingLoad || 0), 0) / tlSessions.length)
    : 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sortedDates = Array.from(new Set(sessions.map(s => {
    const d = new Date(s.date); d.setHours(0, 0, 0, 0); return d.getTime()
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

  const sessionColor = plannedToday ? (SESSION_COLORS[plannedToday.planDay?.dayLabel ?? ''] ?? '#64748b') : '#64748b'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent)' }}>Allenamento</p>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>Training Log</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--fg-muted)' }}>Il tuo storico di allenamento</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/training/library"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--fg-muted)',
            }}
          >
            <BookOpen className="w-4 h-4" />
            Libreria
          </Link>
          <NewSessionModal />
        </div>
      </div>

      {/* Today's planned session banner */}
      {plannedToday && plannedToday.planDay && (
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{
            background: `${sessionColor}12`,
            border: `1px solid ${sessionColor}30`,
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0"
            style={{ background: `${sessionColor}20`, color: sessionColor }}
          >
            {plannedToday.planDay.dayLabel}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm" style={{ color: 'var(--fg-primary)' }}>
              Sessione di oggi — {SESSION_FOCUS[plannedToday.planDay.dayLabel] ?? plannedToday.planDay.dayLabel}
            </p>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
              {plannedToday.planDay.planExercises.slice(0, 4).map(pe => (
                <span key={pe.id} className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                  {pe.name} {pe.sets}×{pe.repsMin === pe.repsMax ? pe.repsMin : `${pe.repsMin}-${pe.repsMax}`}
                </span>
              ))}
              {plannedToday.planDay.planExercises.length > 4 && (
                <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
                  +{plannedToday.planDay.planExercises.length - 4} altri
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/training/active?planDayId=${plannedToday.planDay.id}&plannedSessionId=${plannedToday.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm shrink-0"
            style={{ background: sessionColor, color: '#fff' }}
          >
            <Play className="w-4 h-4 fill-white" />
            Inizia
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CalendarDays, label: 'Sessioni', value: totalSessions, color: '#3b82f6' },
          { icon: Activity, label: 'TL Medio', value: avgTL, color: '#6366f1' },
          { icon: Flame, label: 'Streak', value: `${streak}g`, color: '#f97316' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18`, color }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider" style={{ color: 'var(--fg-subtle)' }}>{label}</p>
              <p className="text-lg font-black" style={{ color: 'var(--fg-primary)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sessions List */}
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)' }}
          >
            <Dumbbell className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--fg-subtle)' }} />
            <p style={{ color: 'var(--fg-muted)' }}>Nessuna sessione. Creane una nuova!</p>
          </div>
        ) : (
          sessions.map(s => {
            const color = SESSION_COLORS[s.type] ?? '#64748b'
            return (
              <Link key={s.id} href={`/training/${s.id}`}>
                <div
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderLeftColor: color,
                    borderLeftWidth: 3,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background: `${color}18`, color }}
                  >
                    {s.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm" style={{ color: 'var(--fg-primary)' }}>
                        {SESSION_FOCUS[s.type] ?? `Tipo ${s.type}`}
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                      {format(new Date(s.date), "dd MMM yyyy", { locale: it })}
                      {s.durationMin ? ` · ${s.durationMin} min` : ''}
                      {s.trainingLoad ? ` · TL ${s.trainingLoad}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
                      <Dumbbell className="w-3.5 h-3.5 inline mr-1" />{s._count.exercises}
                    </span>
                    {s.rpe && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}
                      >
                        RPE {s.rpe}
                      </span>
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
  )
}

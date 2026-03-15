import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format, addDays, startOfWeek } from "date-fns"
import { it } from "date-fns/locale"
import {
  Calendar, CheckCircle2, Target, Dumbbell, ChevronRight,
  AlertTriangle, Flame, Zap, RefreshCw, Clock,
} from "lucide-react"
import Link from "next/link"
import ImportPlanButton from "./ImportPlanButton"

const SESSION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A:       { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', border: '#10b981' },
  B:       { bg: 'rgba(59,130,246,0.12)',  text: '#3b82f6', border: '#3b82f6' },
  C:       { bg: 'rgba(139,92,246,0.12)',  text: '#8b5cf6', border: '#8b5cf6' },
  D:       { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: '#f59e0b' },
  V1:      { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444', border: '#ef4444' },
  V2:      { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: '#64748b' },
  OUTDOOR: { bg: 'rgba(20,184,166,0.12)',  text: '#14b8a6', border: '#14b8a6' },
  OTHER:   { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: '#64748b' },
}

const SESSION_LABELS: Record<string, string> = {
  A: 'Lower Post. — Femorali + Glutei',
  B: 'Upper Push — Petto + Spalle + Tricipiti',
  C: 'Upper Pull — Schiena + Bicipiti',
  D: 'Lower Ant. — Quadricipiti + Anche',
  V1: 'Cardio + Atletica',
  V2: 'Core + Mobilità + Prehab',
  OUTDOOR: 'Outdoor — Sci/Trekking',
  OTHER: 'Altra attività',
}

export default async function PlanPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const today = new Date()
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))

  const [activeMeso, activePlan, weekSessions, injuries] = await Promise.all([
    prisma.mesocycle.findFirst({
      where: { userId, isActive: true },
      orderBy: { startDate: 'desc' },
    }),
    prisma.workoutPlan.findFirst({
      where: { userId, isActive: true },
      include: {
        planDays: {
          orderBy: { orderIndex: 'asc' },
          include: { planExercises: { orderBy: { orderIndex: 'asc' } } },
        },
        mesocycle: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.plannedSession.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1)),
          lte: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7)),
        },
      },
      include: { planDay: true, workoutSession: true },
      orderBy: { scheduledDate: 'asc' },
    }),
    prisma.injury.findMany({
      where: { userId, status: { in: ['ACTIVE', 'RECOVERING'] } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Calcola progressione mesociclo
  let mesoProgress = 0
  let mesoWeek = 1
  if (activeMeso) {
    const elapsed = todayUTC.getTime() - new Date(activeMeso.startDate).getTime()
    const total   = new Date(activeMeso.endDate ?? addDays(new Date(activeMeso.startDate), 28)).getTime() - new Date(activeMeso.startDate).getTime()
    mesoProgress = Math.min(100, Math.round((elapsed / total) * 100))
    mesoWeek = Math.min(4, Math.ceil(elapsed / (7 * 24 * 60 * 60 * 1000)) + 1)
  }

  // Settimana corrente — lunedì a domenica
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const sessionByDate = new Map(
    weekSessions.map(s => [
      new Date(s.scheduledDate).toISOString().slice(0, 10),
      s,
    ])
  )

  const kpi = activeMeso?.kpi as Record<string, unknown> | null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent)' }}>Piano</p>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>
            {activePlan ? activePlan.name : 'Plan Manager'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
            {activeMeso ? `${activeMeso.name} · Settimana ${mesoWeek}/4` : 'Nessun piano attivo'}
          </p>
        </div>
        {!activePlan && <ImportPlanButton />}
      </div>

      {/* Nessun piano — CTA import */}
      {!activePlan && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--bg-surface)', border: '2px dashed var(--border-default)' }}
        >
          <Target className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--fg-subtle)' }} />
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--fg-primary)' }}>
            Nessun piano importato
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--fg-muted)' }}>
            Importa il Mesociclo 1 con tutti gli esercizi, il calendario e il piano nutrizionale già configurati.
          </p>
          <ImportPlanButton large />
        </div>
      )}

      {/* Mesociclo attivo — barra progresso */}
      {activeMeso && (
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b98130' }}
                >
                  Attivo · S{mesoWeek}
                </span>
                <h2 className="font-black" style={{ color: 'var(--fg-primary)' }}>{activeMeso.name}</h2>
              </div>
              <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>{activeMeso.objectives}</p>
            </div>
            <p className="text-2xl font-black shrink-0 ml-4" style={{ color: 'var(--accent)' }}>{mesoProgress}%</p>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'var(--border-subtle)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${mesoProgress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2, #6366f1))' }}
            />
          </div>

          {/* KPI grid */}
          {kpi && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Stacco', val: (kpi.stacco as { target: string })?.target },
                { label: 'Squat',  val: (kpi.squat as { target: string })?.target },
                { label: 'CTL target', val: `${(kpi.ctl as { target: number })?.target} TSS/d` },
                { label: 'VO2max target', val: `${(kpi.vo2max as { target: number })?.target} ml/kg` },
              ].map(k => (
                <div
                  key={k.label}
                  className="rounded-xl p-3"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                >
                  <p className="text-xs mb-1" style={{ color: 'var(--fg-subtle)' }}>{k.label}</p>
                  <p className="font-black text-sm" style={{ color: 'var(--fg-primary)' }}>{k.val}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── Calendario settimanale ─────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          <h2
            className="text-sm font-black uppercase tracking-wider flex items-center gap-2"
            style={{ color: 'var(--fg-muted)' }}
          >
            <Calendar className="w-4 h-4" /> Settimana corrente
          </h2>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            {weekDays.map((date, idx) => {
              const dateKey = date.toISOString().slice(0, 10)
              const ps = sessionByDate.get(dateKey)
              const isToday = dateKey === todayUTC.toISOString().slice(0, 10)
              const isPast = date < today && !isToday
              const label = ps?.planDay?.dayLabel as string | undefined
              const col = label ? SESSION_COLORS[label] : null
              const isDone = ps?.status === 'COMPLETED'
              const isSkipped = ps?.status === 'SKIPPED'

              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{
                    borderBottom: idx < 6 ? '1px solid var(--border-subtle)' : 'none',
                    background: isToday ? 'var(--accent-dim)' : 'transparent',
                  }}
                >
                  {/* Data */}
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: isToday ? 'var(--accent)' : 'var(--fg-subtle)' }}>
                      {format(date, 'EEE', { locale: it })}
                    </p>
                    <p className="text-lg font-black leading-tight" style={{ color: isToday ? 'var(--accent)' : 'var(--fg-primary)' }}>
                      {format(date, 'd')}
                    </p>
                  </div>

                  {/* Badge sessione */}
                  {ps && label ? (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                        style={{ background: col?.bg, color: col?.text, border: `1px solid ${col?.border}40`, opacity: isSkipped ? 0.4 : 1 }}
                      >
                        {label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: isSkipped ? 'var(--fg-subtle)' : 'var(--fg-primary)', textDecoration: isSkipped ? 'line-through' : 'none' }}>
                          {SESSION_LABELS[label] ?? label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--fg-subtle)' }}>
                          {ps.planDay?.focus?.split(' — ')[0]}
                        </p>
                      </div>
                      {isDone && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />}
                      {isToday && !isDone && (
                        <Link
                          href="/training"
                          className="px-3 py-1.5 rounded-xl text-xs font-black shrink-0"
                          style={{ background: 'var(--accent)', color: 'var(--accent-on, white)' }}
                        >
                          Inizia
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                        <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>—</span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--fg-subtle)' }}>
                        {isPast ? 'Riposo' : 'Riposo'}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Sidebar destra ─────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">

          {/* Dettaglio piano (PlanDays) */}
          {activePlan && (
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--fg-muted)' }}>
                <Dumbbell className="w-4 h-4" /> Schede
              </h3>
              <div className="space-y-2">
                {activePlan.planDays.map(pd => {
                  const col = SESSION_COLORS[pd.dayLabel] ?? SESSION_COLORS.OTHER
                  return (
                    <div
                      key={pd.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                        style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}40` }}
                      >
                        {pd.dayLabel}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--fg-primary)' }}>
                          {SESSION_LABELS[pd.dayLabel] ?? pd.dayLabel}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-subtle)' }}>
                          {pd.planExercises.length} esercizi
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--fg-subtle)' }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Infortuni attivi */}
          {injuries.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <h3 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#f59e0b' }}>
                <AlertTriangle className="w-4 h-4" /> Infortuni monitorati
              </h3>
              <div className="space-y-2">
                {injuries.map(inj => (
                  <div key={inj.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: inj.status === 'ACTIVE' ? '#ef4444' : '#f59e0b' }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--fg-primary)' }}>
                        {inj.district.replace('_', ' ')} — {inj.status === 'RECOVERING' ? 'In recupero' : 'Attivo'}
                      </p>
                      <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                        {inj.description.slice(0, 80)}…
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info nutrizionale */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--fg-muted)' }}>
              <Flame className="w-4 h-4" /> Target nutrizionali
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Giorno allenamento', kcal: 2400, pro: 165, carb: 260, fat: 72, color: 'var(--accent)' },
                { label: 'Giorno riposo', kcal: 2000, pro: 160, carb: 160, fat: 72, color: 'var(--fg-muted)' },
              ].map(t => (
                <div key={t.label} className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: t.color }}>{t.label}</p>
                  <div className="flex gap-3 text-xs" style={{ color: 'var(--fg-muted)' }}>
                    <span><span className="font-bold" style={{ color: 'var(--fg-primary)' }}>{t.kcal}</span> kcal</span>
                    <span><span className="font-bold" style={{ color: '#8b5cf6' }}>{t.pro}g</span> P</span>
                    <span><span className="font-bold" style={{ color: '#f59e0b' }}>{t.carb}g</span> C</span>
                    <span><span className="font-bold" style={{ color: '#ef4444' }}>{t.fat}g</span> G</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Dettaglio esercizi sessioni */}
      {activePlan && (
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
            Dettaglio esercizi
          </h2>
          {activePlan.planDays
            .filter(pd => ['A', 'B', 'C', 'D'].includes(pd.dayLabel))
            .map(pd => {
              const col = SESSION_COLORS[pd.dayLabel]
              return (
                <details key={pd.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                  <summary
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                      style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}40` }}
                    >
                      {pd.dayLabel}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: 'var(--fg-primary)' }}>{pd.focus}</p>
                      <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>{pd.planExercises.length} esercizi</p>
                    </div>
                    <ChevronRight className="w-4 h-4 transition-transform" style={{ color: 'var(--fg-subtle)' }} />
                  </summary>
                  <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {pd.planExercises.map((ex, idx) => (
                      <div key={ex.id} className="px-5 py-3 flex items-start gap-4">
                        <span className="text-xs font-black w-5 text-right shrink-0 mt-0.5" style={{ color: 'var(--fg-subtle)' }}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm" style={{ color: 'var(--fg-primary)' }}>{ex.name}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.text }}>
                              {ex.sets}×{ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}-${ex.repsMax}`}
                            </span>
                            {ex.targetRir < 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
                                RIR {ex.targetRir}
                              </span>
                            )}
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--fg-subtle)' }}>
                              <Clock className="w-3 h-3" /> {ex.restSec}s
                            </span>
                          </div>
                          {ex.notes && (
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                              {ex.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })}
        </div>
      )}
    </div>
  )
}

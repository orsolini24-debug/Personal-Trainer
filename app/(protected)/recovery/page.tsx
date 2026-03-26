import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import RecoveryForm from "./recovery-form"
import RecoveryHistory from "./recovery-history"
import DeviceForm from "./device-form"
import RecoveryOrb from "@/components/RecoveryOrb"
import MuscleHeatmap from "@/components/MuscleHeatmap"
import { District } from "@prisma/client"
import { HeartPulse, TrendingUp, AlertTriangle } from "lucide-react"

export default async function RecoveryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [todayLog, history, devices] = await Promise.all([
    prisma.recoveryLog.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.recoveryLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 14 }),
    prisma.userDevice.findMany({ where: { userId } })
  ])

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  const recentSessions = await prisma.workoutSession.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    include: { districtStress: true }
  })

  let monotony = null
  if (recentSessions.length > 0) {
    const tls = recentSessions.map(s => s.trainingLoad || 0).filter(tl => tl > 0)
    if (tls.length > 1) {
      const avg = tls.reduce((a, b) => a + b, 0) / tls.length
      const stdDev = Math.sqrt(tls.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / (tls.length - 1))
      if (stdDev > 0) monotony = avg / stdDev
    }
  }

  const districtTotals = Object.keys(District).reduce((acc, key) => {
    acc[key as District] = 0
    return acc
  }, {} as Record<District, number>)

  recentSessions.forEach(s => {
    s.districtStress.forEach(ds => {
      districtTotals[ds.district] = (districtTotals[ds.district] || 0) + ds.intensity
    })
  })

  const score = todayLog?.recoveryScore ?? 0
  const scoreColor = score > 66 ? 'var(--positive)' : score > 33 ? 'var(--warning)' : score > 0 ? 'var(--negative)' : 'var(--fg-muted)'
  const acwr = todayLog?.acwr
  const acwrColor = acwr && acwr > 1.5 ? 'var(--negative)' : acwr && acwr > 1.2 ? 'var(--warning)' : 'var(--positive)'
  const monotonyColor = monotony && monotony > 2 ? 'var(--warning)' : 'var(--positive)'
  const activeFatigued = Object.entries(districtTotals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])

  return (
    <div className="animate-page max-w-5xl mx-auto space-y-6 pb-8">

      <div style={{ animation: 'fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
        <p className="text-xs font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--positive)', fontFamily: "'JetBrains Mono', monospace" }}>
          Centro Recupero
        </p>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--fg-primary)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.05em' }}>
          Recovery Dashboard
        </h1>
      </div>

      {/* Hero */}
      <section
        className="rounded-[2.5rem] p-8 relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <HeartPulse className="w-64 h-64" style={{ color: 'var(--positive)' }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center shrink-0">
            <RecoveryOrb score={score} label={score > 0 ? "Recovery" : "Nessun Dato"} />
            {score > 0 && (
              <p className="text-xs font-black uppercase tracking-widest mt-3" style={{ color: scoreColor }}>
                {score > 66 ? "Pronto all'intensita" : score > 33 ? 'Cautela' : 'Recupero'}
              </p>
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {[
              { label: 'HRV', value: todayLog?.hrv ? `${todayLog.hrv}ms` : '\u2014', color: 'var(--accent2)' },
              { label: 'RHR', value: todayLog?.rhr ? `${todayLog.rhr}bpm` : '\u2014', color: 'var(--accent)' },
              { label: 'Sonno', value: todayLog?.sleepMin ? `${(todayLog.sleepMin / 60).toFixed(1)}h` : '\u2014', color: 'var(--warning)' },
              { label: 'TSB', value: todayLog?.tsb ? todayLog.tsb.toFixed(1) : '\u2014', color: 'var(--positive)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 rounded-2xl text-center" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--fg-muted)' }}>{label}</p>
                <p className="text-xl font-black" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <section className="rounded-[2.5rem] p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <RecoveryForm initialData={todayLog} />
          </section>
          <section className="rounded-[2.5rem] p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <h2 className="font-black text-lg mb-5" style={{ color: 'var(--fg-primary)' }}>Storico e Trend</h2>
            <RecoveryHistory history={history} />
          </section>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <section className="rounded-[2.5rem] p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <h2 className="font-black text-base mb-4 flex items-center gap-2" style={{ color: 'var(--fg-primary)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Metriche Avanzate
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>ACWR Rischio</p>
                  {acwr && acwr > 1.5 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--negative)' }} />
                      <span className="text-[10px] font-black" style={{ color: 'var(--negative)' }}>Alto</span>
                    </div>
                  )}
                </div>
                <p className="text-3xl font-black" style={{ color: acwr ? acwrColor : 'var(--fg-subtle)' }}>
                  {acwr ? acwr.toFixed(2) : '\u2014'}
                </p>
                {acwr && (
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (acwr / 2) * 100)}%`, background: acwrColor }} />
                  </div>
                )}
              </div>
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Monotony 7gg</p>
                  {monotony && monotony > 2 && (
                    <span className="text-[10px] font-black" style={{ color: 'var(--warning)' }}>Variazione richiesta</span>
                  )}
                </div>
                <p className="text-3xl font-black" style={{ color: monotony ? monotonyColor : 'var(--fg-subtle)' }}>
                  {monotony ? monotony.toFixed(2) : '\u2014'}
                </p>
                {monotony && (
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (monotony / 3) * 100)}%`, background: monotonyColor }} />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[2.5rem] p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <h2 className="font-black text-base mb-4" style={{ color: 'var(--fg-primary)' }}>
              Tensione Muscolare <span className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>(7 giorni)</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <MuscleHeatmap stress={districtTotals} side="front" />
              <MuscleHeatmap stress={districtTotals} side="back" />
            </div>
            {activeFatigued.length > 0 ? (
              <div className="space-y-2">
                {activeFatigued.slice(0, 5).map(([district, total]) => {
                  const pct = Math.min(100, (total / 12) * 100)
                  const recovDays = Math.ceil(total / 0.8)
                  return (
                    <div key={district} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold capitalize" style={{ color: 'var(--fg-primary)' }}>
                          {district.replace('_', ' ').toLowerCase()}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                          style={{ background: 'color-mix(in srgb, var(--negative) 12%, transparent)', color: 'var(--negative)' }}>
                          ~{recovDays}gg
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--negative)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--fg-muted)' }}>Nessun affaticamento registrato.</p>
            )}
          </section>

          <section className="rounded-[2.5rem] p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <DeviceForm devices={devices} />
          </section>
        </div>
      </div>
    </div>
  )
}

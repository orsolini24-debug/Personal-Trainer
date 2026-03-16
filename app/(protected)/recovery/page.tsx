import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import RecoveryForm from "./recovery-form"
import RecoveryHistory from "./recovery-history"
import DeviceForm from "./device-form"
import RecoveryOrb from "@/components/RecoveryOrb"
import MuscleHeatmap from "@/components/MuscleHeatmap"
import { District } from "@prisma/client"

export default async function RecoveryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const today = new Date()
  today.setUTCHours(0,0,0,0)

  const [todayLog, history, devices] = await Promise.all([
    prisma.recoveryLog.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.recoveryLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 14 }),
    prisma.userDevice.findMany({ where: { userId } })
  ])

  // Calculate Monotony & Heatmap
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  const recentSessions = await prisma.workoutSession.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    include: { districtStress: true }
  })

  // Monotony calculation
  let monotony = null
  if (recentSessions.length > 0) {
    const tls = recentSessions.map(s => s.trainingLoad || 0).filter(tl => tl > 0)
    if (tls.length > 1) {
      const avg = tls.reduce((a, b) => a + b, 0) / tls.length
      const stdDev = Math.sqrt(tls.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / (tls.length - 1))
      if (stdDev > 0) monotony = avg / stdDev
    }
  }

  // Heatmap aggregation
  const districtTotals = Object.keys(District).reduce((acc, key) => {
    acc[key as District] = 0;
    return acc;
  }, {} as Record<District, number>);

  recentSessions.forEach(s => {
    s.districtStress.forEach(ds => {
      districtTotals[ds.district] = (districtTotals[ds.district] || 0) + ds.intensity
    })
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Recovery Dashboard</h1>
      
      {/* ── Whoop-style Recovery Orb ── */}
      <section className="bg-surface rounded-3xl p-6 border border-subtle flex flex-col items-center justify-center relative overflow-hidden">
        {/* Sfondo decorativo sfumato per dare profondità */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none"></div>
        <RecoveryOrb score={todayLog?.recoveryScore ?? 0} label={todayLog?.recoveryScore ? "Recovery" : "Nessun Dato"} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-surface rounded-2xl p-6 border border-subtle">
            <RecoveryForm initialData={todayLog} />
          </section>

          <section className="bg-surface rounded-2xl p-6 border border-subtle">
            <h2 className="text-xl font-bold mb-6 text-primary">Storico & Trend</h2>
            <RecoveryHistory history={history} />
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-surface rounded-2xl p-6 border border-subtle">
            <h2 className="text-xl font-bold mb-4 text-primary">Metriche Avanzate</h2>
            <div className="space-y-4">
              <div className="p-4 bg-base rounded-xl border border-subtle">
                <p className="text-sm text-muted mb-1">ACWR (Rischio Infortuni)</p>
                <div className="flex items-end gap-3">
                  <span className={`text-2xl font-bold ${todayLog?.acwr && todayLog.acwr > 1.5 ? 'text-[#ef4444]' : 'text-primary'}`}>
                    {todayLog?.acwr ? todayLog.acwr.toFixed(2) : '-'}
                  </span>
                  {todayLog?.acwr && todayLog.acwr > 1.5 && <span className="text-xs text-[#ef4444] mb-1">Alto Rischio</span>}
                </div>
              </div>
              <div className="p-4 bg-base rounded-xl border border-subtle">
                <p className="text-sm text-muted mb-1">Monotony (7gg)</p>
                <div className="flex items-end gap-3">
                  <span className={`text-2xl font-bold ${monotony && monotony > 2 ? 'text-[#f59e0b]' : 'text-primary'}`}>
                    {monotony ? monotony.toFixed(2) : '-'}
                  </span>
                  {monotony && monotony > 2 && <span className="text-xs text-[#f59e0b] mb-1">Stallo</span>}
                </div>
              </div>
            </div>
          </section>

          {/* ── Muscle Heatmap ── */}
          <section className="bg-surface rounded-2xl p-6 border border-subtle">
            <h2 className="text-xl font-bold mb-6 text-primary">Tensione Muscolare (7gg)</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <MuscleHeatmap stress={districtTotals} side="front" />
              <MuscleHeatmap stress={districtTotals} side="back" />
            </div>

            {/* Fatigue Cards */}
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(districtTotals)
                .filter(([_, total]) => total > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([district, total]) => {
                  // Normalize intensity per bar filling (max let's say 12 for visual logic)
                  const visualPct = Math.min(100, (total / 12) * 100);
                  const recoveryDays = Math.ceil(total / 0.8);
                  
                  return (
                    <div key={district} className="flex flex-col justify-center p-3 bg-base rounded-xl border border-subtle gap-2">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-primary truncate">{district}</span>
                        <span className="text-[10px] text-[#ef4444] font-medium px-2 py-0.5 bg-[#ef4444]/10 rounded-md">
                          Recupero stimato: {recoveryDays} gg
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-[#ef4444] transition-all" style={{ width: `${visualPct}%` }}></div>
                      </div>
                    </div>
                  )
              })}
              {Object.keys(districtTotals).filter(k => districtTotals[k as District] > 0).length === 0 && (
                <p className="text-sm text-muted text-center w-full py-4">Nessun affaticamento registrato.</p>
              )}
            </div>
          </section>

          <section className="bg-surface rounded-2xl p-6 border border-subtle">
            <DeviceForm devices={devices} />
          </section>
        </div>
      </div>
    </div>
  )
}
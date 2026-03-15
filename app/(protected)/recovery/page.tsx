import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import RecoveryForm from "./recovery-form"
import RecoveryHistory from "./recovery-history"
import DeviceForm from "./device-form"

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
  const districtTotals: Record<string, number> = {}
  recentSessions.forEach(s => {
    s.districtStress.forEach(ds => {
      districtTotals[ds.district] = (districtTotals[ds.district] || 0) + ds.intensity
    })
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">Recovery Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <RecoveryForm initialData={todayLog} />
          </section>

          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold mb-6 text-[#f1f5f9]">Storico & Trend</h2>
            <RecoveryHistory history={history} />
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold mb-4 text-[#f1f5f9]">Metriche Avanzate</h2>
            <div className="space-y-4">
              <div className="p-4 bg-[#0a0a0f] rounded-xl border border-white/5">
                <p className="text-sm text-[#64748b] mb-1">ACWR (Rischio Infortuni)</p>
                <div className="flex items-end gap-3">
                  <span className={`text-2xl font-bold ${todayLog?.acwr && todayLog.acwr > 1.5 ? 'text-[#ef4444]' : 'text-[#f1f5f9]'}`}>
                    {todayLog?.acwr ? todayLog.acwr.toFixed(2) : '-'}
                  </span>
                  {todayLog?.acwr && todayLog.acwr > 1.5 && <span className="text-xs text-[#ef4444] mb-1">Alto Rischio</span>}
                </div>
              </div>
              <div className="p-4 bg-[#0a0a0f] rounded-xl border border-white/5">
                <p className="text-sm text-[#64748b] mb-1">Monotony (7gg)</p>
                <div className="flex items-end gap-3">
                  <span className={`text-2xl font-bold ${monotony && monotony > 2 ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
                    {monotony ? monotony.toFixed(2) : '-'}
                  </span>
                  {monotony && monotony > 2 && <span className="text-xs text-[#f59e0b] mb-1">Stallo</span>}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold mb-4 text-[#f1f5f9]">Stress Distrettuale (7gg)</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(districtTotals).sort((a, b) => b[1] - a[1]).map(([district, total]) => (
                <div key={district} className="flex justify-between items-center p-2 bg-[#0a0a0f] rounded border border-white/5">
                  <span className="text-xs text-[#64748b] truncate mr-2" title={district}>{district}</span>
                  <div className="flex gap-0.5">
                    {[...Array(Math.min(5, Math.ceil(total / 3)))].map((_, i) => (
                      <div key={i} className="w-1.5 h-3 bg-[#ef4444] rounded-sm opacity-80"></div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(districtTotals).length === 0 && (
                <p className="text-xs text-[#64748b] col-span-2">Nessun dato recente.</p>
              )}
            </div>
          </section>

          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <DeviceForm devices={devices} />
          </section>
        </div>
      </div>
    </div>
  )
}
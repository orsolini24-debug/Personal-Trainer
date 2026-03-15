"use client"

import { format } from "date-fns"

export default function RecoveryHistory({ history }: { history: any[] }) {
  if (!history || history.length === 0) return <p className="text-[#64748b] text-sm">Nessun dato storico.</p>

  // Reverse for chart (oldest to newest)
  const chartData = [...history].reverse()
  const width = 100
  const height = 40

  // HRV Chart Data
  const hrvData = chartData.filter(d => d.hrv != null)
  let hrvPoints = ""
  if (hrvData.length >= 2) {
    const min = Math.min(...hrvData.map(d => d.hrv)) - 5
    const max = Math.max(...hrvData.map(d => d.hrv)) + 5
    const range = max - min || 1
    hrvPoints = hrvData.map((d, i) => {
      const x = (i / (hrvData.length - 1)) * width
      const y = height - (((d.hrv - min) / range) * height)
      return `${x},${y}`
    }).join(" ")
  }

  // TSB Chart Data
  const tsbData = chartData.filter(d => d.tsb != null)
  let tsbPoints = ""
  if (tsbData.length >= 2) {
    const min = Math.min(...tsbData.map(d => d.tsb)) - 5
    const max = Math.max(...tsbData.map(d => d.tsb)) + 5
    const range = max - min || 1
    tsbPoints = tsbData.map((d, i) => {
      const x = (i / (tsbData.length - 1)) * width
      const y = height - (((d.tsb - min) / range) * height)
      return `${x},${y}`
    }).join(" ")
  }

  return (
    <div className="space-y-8">
      {/* Charts */}
      {chartData.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
            <h3 className="text-xs text-[#64748b] mb-2 uppercase tracking-wider font-semibold">Trend HRV</h3>
            <div className="h-20 w-full relative">
              {hrvPoints ? (
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <polyline fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={hrvPoints} />
                </svg>
              ) : <p className="text-xs text-[#64748b]">Dati insufficienti</p>}
            </div>
          </div>
          <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
            <h3 className="text-xs text-[#64748b] mb-2 uppercase tracking-wider font-semibold">Trend TSB (Forma)</h3>
            <div className="h-20 w-full relative">
              {tsbPoints ? (
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  {/* Zero line */}
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                  <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={tsbPoints} />
                </svg>
              ) : <p className="text-xs text-[#64748b]">Dati insufficienti</p>}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#64748b] uppercase tracking-wider bg-[#0a0a0f] border-b border-white/5">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl-lg">Data</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">HRV</th>
              <th className="px-4 py-3 font-semibold">RHR</th>
              <th className="px-4 py-3 font-semibold rounded-tr-lg">TSB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {history.map((log) => {
              const isGoodScore = log.recoveryScore && log.recoveryScore >= 70
              const isBadScore = log.recoveryScore && log.recoveryScore < 40
              const isGoodTsb = log.tsb && log.tsb > -10
              const isBadTsb = log.tsb && log.tsb < -30

              return (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#f1f5f9]">{format(new Date(log.date), "dd/MM")}</td>
                  <td className={`px-4 py-3 font-semibold ${isGoodScore ? 'text-[#10b981]' : (isBadScore ? 'text-[#ef4444]' : 'text-[#f59e0b]')}`}>
                    {log.recoveryScore || '-'}
                  </td>
                  <td className="px-4 py-3 text-[#f1f5f9]">{log.hrv || '-'}</td>
                  <td className="px-4 py-3 text-[#f1f5f9]">{log.rhr || '-'}</td>
                  <td className={`px-4 py-3 font-semibold ${isGoodTsb ? 'text-[#10b981]' : (isBadTsb ? 'text-[#ef4444]' : 'text-[#f59e0b]')}`}>
                    {log.tsb || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
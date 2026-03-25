"use client"

import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Heart, Zap, TrendingUp, Calendar } from "lucide-react"

export default function RecoveryHistory({ history }: { history: any[] }) {
  if (!history || history.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 bg-surface/50 rounded-[32px] border border-dashed border-border">
      <Calendar className="w-8 h-8 text-muted/20 mb-3" />
      <p className="text-muted text-sm font-medium">Nessun dato storico disponibile.</p>
    </div>
  )

  // Reverse for chart (oldest to newest), limit to last 7 days for sparklines
  const last7 = [...history].slice(0, 7).reverse()
  const width = 200
  const height = 60

  const getPoints = (data: any[], key: string) => {
    const valid = data.filter(d => d[key] != null)
    if (valid.length < 2) return ""
    const min = Math.min(...valid.map(d => d[key])) - 2
    const max = Math.max(...valid.map(d => d[key])) + 2
    const range = max - min || 1
    return valid.map((d, i) => {
      const x = (i / (valid.length - 1)) * width
      const y = height - (((d[key] - min) / range) * height)
      return `${x},${y}`
    }).join(" ")
  }

  const hrvPoints = getPoints(last7, 'hrv')
  const scorePoints = getPoints(last7, 'recoveryScore')

  return (
    <div className="space-y-8 animate-page">
      {/* Sparklines Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* HRV Sparkline */}
        <div className="bg-surface p-6 rounded-[32px] border border-border shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-accent2/10 text-accent2">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-primary uppercase tracking-widest">Trend HRV (7g)</h3>
            </div>
            {last7.length > 0 && last7[last7.length-1].hrv && (
              <span className="text-lg font-black text-accent2 num">{last7[last7.length-1].hrv}ms</span>
            )}
          </div>
          <div className="h-20 w-full relative pt-2">
            {hrvPoints ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent2)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--accent2)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`M0,${height} L${hrvPoints} L${width},${height} Z`} fill="url(#hrvGrad)" />
                <polyline fill="none" stroke="var(--accent2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={hrvPoints} />
                {/* Last point dot */}
                {(() => {
                  const pts = hrvPoints.split(' ')
                  const last = pts[pts.length-1].split(',')
                  return <circle cx={last[0]} cy={last[1]} r="4" fill="var(--accent2)" stroke="var(--bg-surface)" strokeWidth="2" />
                })()}
              </svg>
            ) : <p className="text-[10px] text-muted uppercase font-bold text-center py-4">Dati insufficienti</p>}
          </div>
        </div>

        {/* Recovery Score Sparkline */}
        <div className="bg-surface p-6 rounded-[32px] border border-border shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-warning/10 text-warning">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-primary uppercase tracking-widest">Trend Score (7g)</h3>
            </div>
            {last7.length > 0 && last7[last7.length-1].recoveryScore && (
              <span className="text-lg font-black text-warning num">{last7[last7.length-1].recoveryScore}%</span>
            )}
          </div>
          <div className="h-20 w-full relative pt-2">
            {scorePoints ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--warning)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--warning)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`M0,${height} L${scorePoints} L${width},${height} Z`} fill="url(#scoreGrad)" />
                <polyline fill="none" stroke="var(--warning)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={scorePoints} />
                {(() => {
                  const pts = scorePoints.split(' ')
                  const last = pts[pts.length-1].split(',')
                  return <circle cx={last[0]} cy={last[1]} r="4" fill="var(--warning)" stroke="var(--bg-surface)" strokeWidth="2" />
                })()}
              </svg>
            ) : <p className="text-[10px] text-muted uppercase font-bold text-center py-4">Dati insufficienti</p>}
          </div>
        </div>
      </div>

      {/* Storico Lista */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-primary uppercase tracking-widest px-1">Storico Recupero</h3>
        {history.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full"
                style={{
                  background: entry.recoveryScore >= 70 ? 'var(--positive)' :
                              entry.recoveryScore >= 40 ? 'var(--warning)' : 'var(--negative)'
                }}
              />
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-tight">
                  {format(new Date(entry.date), "EEE dd MMM", { locale: it })}
                </p>
                {entry.sleepHours != null && (
                  <p className="text-[10px] text-muted mt-0.5">Sonno: {entry.sleepHours}h</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {entry.hrv != null && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-muted uppercase">HRV</p>
                  <p className="text-sm font-black text-accent2 num">{entry.hrv}ms</p>
                </div>
              )}
              {entry.recoveryScore != null && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-muted uppercase">Score</p>
                  <p className="text-sm font-black num"
                    style={{
                      color: entry.recoveryScore >= 70 ? 'var(--positive)' :
                             entry.recoveryScore >= 40 ? 'var(--warning)' : 'var(--negative)'
                    }}>
                    {entry.recoveryScore}%
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
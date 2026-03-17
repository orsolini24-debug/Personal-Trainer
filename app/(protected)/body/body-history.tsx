"use client"

import { format } from "date-fns"
import { it } from "date-fns/locale"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export default function BodyHistory({ history }: { history: any[] }) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--fg-muted)' }}>
        Nessun dato storico.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {history.map((log, idx) => {
        const prev = history[idx + 1]
        const weightDelta = log.weightKg && prev?.weightKg ? log.weightKg - prev.weightKg : null
        const TrendIcon = weightDelta === null ? null : weightDelta > 0.1 ? TrendingUp : weightDelta < -0.1 ? TrendingDown : Minus
        const trendColor = weightDelta === null ? 'var(--fg-subtle)' : weightDelta > 0.1 ? 'var(--negative)' : weightDelta < -0.1 ? 'var(--positive)' : 'var(--fg-muted)'

        return (
          <div
            key={log.id}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)' }}
          >
            <div className="shrink-0 text-center w-10">
              <p className="text-xs font-black" style={{ color: 'var(--fg-primary)' }}>
                {format(new Date(log.date), "dd", { locale: it })}
              </p>
              <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--fg-muted)' }}>
                {format(new Date(log.date), "MMM", { locale: it })}
              </p>
            </div>

            <div className="flex-1 flex items-center gap-4">
              {log.weightKg && (
                <div>
                  <p className="text-xs font-black" style={{ color: 'var(--fg-primary)' }}>{log.weightKg} <span style={{ color: 'var(--fg-muted)' }}>kg</span></p>
                </div>
              )}
              {log.fatPct && (
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--warning)' }}>{log.fatPct}<span style={{ color: 'var(--fg-muted)' }}>%</span></p>
                </div>
              )}
              {log.waistCm && (
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--accent2)' }}>{log.waistCm}<span style={{ color: 'var(--fg-muted)' }}>cm</span></p>
                </div>
              )}
            </div>

            {TrendIcon && weightDelta !== null && (
              <div className="flex items-center gap-1 shrink-0">
                <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
                <span className="text-[10px] font-black" style={{ color: trendColor }}>
                  {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

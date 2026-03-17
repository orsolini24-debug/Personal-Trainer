"use client"

import { format } from "date-fns"
import { it } from "date-fns/locale"

interface BiometricEntry {
  weightKg?: number | null
  date: string | Date
}

export default function BodyChart({ history }: { history: BiometricEntry[] }) {
  const data = history.filter(h => h.weightKg).reverse()
  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-32 rounded-2xl" style={{ background: 'var(--bg-base)', border: '1px dashed var(--border-default)' }}>
        <p className="text-sm font-bold" style={{ color: 'var(--fg-muted)' }}>Dati insufficienti</p>
        <p className="text-xs mt-1" style={{ color: 'var(--fg-subtle)' }}>Aggiungi almeno 2 misurazioni</p>
      </div>
    )
  }

  const weights = data.map(d => d.weightKg!)
  const minW = Math.min(...weights) - 0.5
  const maxW = Math.max(...weights) + 0.5
  const range = maxW - minW || 1

  const vbWidth = 300
  const vbHeight = 80
  const padX = 8
  const padY = 8
  const innerW = vbWidth - padX * 2
  const innerH = vbHeight - padY * 2

  const getX = (i: number) => padX + (i / (data.length - 1)) * innerW
  const getY = (w: number) => padY + innerH - ((w - minW) / range) * innerH

  const points = data.map((d, i) => `${getX(i)},${getY(d.weightKg!)}`).join(' ')

  // Area path
  const areaPath = `M ${getX(0)},${getY(data[0].weightKg!)} ` +
    data.slice(1).map((d, i) => `L ${getX(i + 1)},${getY(d.weightKg!)}`).join(' ') +
    ` L ${getX(data.length - 1)},${padY + innerH} L ${padX},${padY + innerH} Z`

  const first = data[0].weightKg!
  const last = data[data.length - 1].weightKg!
  const delta = last - first
  const trendColor = delta < -0.1 ? 'var(--positive)' : delta > 0.1 ? 'var(--negative)' : 'var(--warning)'

  return (
    <div className="space-y-3">
      {/* Trend badge */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'var(--fg-muted)' }}>
          {data.length} misurazioni
        </p>
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl"
          style={{ background: `color-mix(in srgb, ${trendColor} 12%, transparent)` }}>
          <span className="text-xs font-black" style={{ color: trendColor }}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
          </span>
          <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>nel periodo</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative rounded-2xl overflow-hidden p-1" style={{ background: 'var(--bg-base)' }}>
        {/* Y axis labels */}
        <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between pointer-events-none">
          <span className="text-[9px] font-bold" style={{ color: 'var(--fg-subtle)' }}>{maxW.toFixed(1)}</span>
          <span className="text-[9px] font-bold" style={{ color: 'var(--fg-subtle)' }}>{minW.toFixed(1)}</span>
        </div>

        <svg viewBox={`0 0 ${vbWidth} ${vbHeight}`} className="w-full" style={{ height: 120 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(t => (
            <line
              key={t}
              x1={padX} y1={padY + innerH * t}
              x2={padX + innerW} y2={padY + innerH * t}
              stroke="var(--border-default)" strokeWidth="0.5"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#weightGrad)" />

          {/* Line */}
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)} cy={getY(d.weightKg!)}
              r={i === 0 || i === data.length - 1 ? 3 : 1.5}
              fill="var(--accent)"
            />
          ))}

          {/* Last value label */}
          <text
            x={getX(data.length - 1) - 2}
            y={getY(last) - 6}
            fontSize="7"
            fontWeight="700"
            fill="var(--accent)"
            textAnchor="end"
          >
            {last.toFixed(1)} kg
          </text>
        </svg>
      </div>

      {/* X-axis: first + last dates */}
      <div className="flex justify-between px-1">
        <span className="text-[10px] font-bold" style={{ color: 'var(--fg-subtle)' }}>
          {format(new Date(data[0].date), "dd MMM", { locale: it })}
        </span>
        <span className="text-[10px] font-bold" style={{ color: 'var(--fg-subtle)' }}>
          {format(new Date(data[data.length - 1].date), "dd MMM", { locale: it })}
        </span>
      </div>
    </div>
  )
}

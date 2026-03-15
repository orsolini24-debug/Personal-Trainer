"use client"

export default function BodyChart({ history }: { history: any[] }) {
  const data = history.filter(h => h.weightKg).reverse() // Ordine cronologico
  if (data.length < 2) return <p className="text-zinc-500 text-sm">Dati insufficienti per il grafico.</p>

  const weights = data.map(d => d.weightKg!)
  const minW = Math.min(...weights) - 1
  const maxW = Math.max(...weights) + 1
  const range = maxW - minW

  // Genera i punti per la SVG polyline
  const width = 100
  const height = 40
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (((d.weightKg! - minW) / range) * height)
    return `${x},${y}`
  }).join(" ")

  return (
    <div className="w-full relative pt-4 pb-2">
      <div className="flex justify-between text-xs text-zinc-500 mb-2">
        <span>{maxW.toFixed(1)} kg</span>
      </div>
      <div className="w-full h-32 bg-zinc-50 dark:bg-zinc-950 rounded-lg relative overflow-hidden">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible p-2">
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100
            const y = 40 - (((d.weightKg! - minW) / range) * 40)
            return (
              <circle key={i} cx={x} cy={y} r="1.5" fill="#3b82f6" />
            )
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-zinc-500 mt-2">
        <span>{minW.toFixed(1)} kg</span>
      </div>
    </div>
  )
}
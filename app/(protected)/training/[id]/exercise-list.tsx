"use client"

import { useState, useEffect } from "react"
import { addExercise, deleteExercise, getExerciseHistory } from "@/app/actions/training"
import { Exercise } from "@prisma/client"
import { Trash2, Plus, Timer, Activity, X } from "lucide-react"
import ExerciseAutocomplete from "@/components/ExerciseAutocomplete"

function TimerComponent() {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [inputMinutes, setInputMinutes] = useState("1")
  const [inputSeconds, setInputSeconds] = useState("30")

  useEffect(() => {
    let interval: any = null
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1)
      }, 1000)
    } else if (seconds === 0 && isActive) {
      setIsActive(false)
      if (typeof window !== 'undefined') {
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
        audio.play().catch(e => console.error(e))
      }
    }
    return () => clearInterval(interval)
  }, [isActive, seconds])

  const startTimer = () => {
    const mins = parseInt(inputMinutes) || 0
    const secs = parseInt(inputSeconds) || 0
    setSeconds(mins * 60 + secs)
    setIsActive(true)
  }

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-surface p-4 rounded-xl border border-border mb-6 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
        <Timer className="w-5 h-5" />
      </div>
      {!isActive ? (
        <div className="flex items-center gap-2 flex-1">
          <input type="number" value={inputMinutes} onChange={e=>setInputMinutes(e.target.value)} className="w-12 p-1 bg-base border border-border rounded text-center text-sm focus:outline-none focus:border-accent" placeholder="m" />
          <span className="text-muted">:</span>
          <input type="number" value={inputSeconds} onChange={e=>setInputSeconds(e.target.value)} className="w-12 p-1 bg-base border border-border rounded text-center text-sm focus:outline-none focus:border-accent" placeholder="s" />
          <button onClick={startTimer} className="ml-auto px-4 py-1.5 bg-accent hover:opacity-90 text-white rounded text-sm font-medium transition-all">Start</button>
        </div>
      ) : (
        <div className="flex items-center justify-between flex-1">
          <span className="text-2xl font-mono font-bold text-accent">{formatTime(seconds)}</span>
          <button onClick={() => setIsActive(false)} className="px-4 py-1.5 bg-negative/20 text-negative hover:bg-negative/30 rounded text-sm font-medium transition-colors">Stop</button>
        </div>
      )}
    </div>
  )
}

function getMuscleColor(name: string) {
  const n = name.toLowerCase()
  if (n.includes('panca') || n.includes('chest') || n.includes('petto') || n.includes('push up')) return 'var(--accent)'
  if (n.includes('squat') || n.includes('leg') || n.includes('quad') || n.includes('affondi')) return 'var(--positive)'
  if (n.includes('trazioni') || n.includes('row') || n.includes('rematore') || n.includes('lat')) return 'var(--accent2)'
  if (n.includes('shoulder') || n.includes('spalle') || n.includes('military')) return 'var(--warning)'
  if (n.includes('stacco') || n.includes('deadlift') || n.includes('hamstring')) return 'var(--negative)'
  if (n.includes('curl') || n.includes('bicipiti') || n.includes('tricep') || n.includes('braccia')) return 'var(--accent)'
  return 'var(--border-default)'
}

export default function ExerciseList({ sessionId, initialExercises }: { sessionId: string, initialExercises: Exercise[] }) {
  const [exercises, setExercises] = useState(initialExercises)
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [sets, setSets] = useState("")
  const [reps, setReps] = useState("")
  const [loadKg, setLoadKg] = useState("")
  const [rir, setRir] = useState("")

  // Chart state
  const [chartExName, setChartExName] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any[]>([])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setLoading(true)

    const res = await addExercise({
      sessionId,
      name,
      sets: sets ? parseInt(sets) : undefined,
      reps: reps || undefined,
      loadKg: loadKg ? parseFloat(loadKg) : undefined,
      rir: rir ? parseInt(rir) : undefined,
      orderIndex: exercises.length
    })

    if (res.success && res.data) {
      setExercises([...exercises, res.data])
      setName(""); setSets(""); setReps(""); setLoadKg(""); setRir("")
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro?")) return
    const res = await deleteExercise(id)
    if (res.success) {
      setExercises(exercises.filter(e => e.id !== id))
    }
  }

  const openChart = async (exName: string) => {
    setChartExName(exName)
    const res = await getExerciseHistory(exName)
    if (res.success && res.data) {
      setChartData(res.data.filter((d: any) => d.loadKg != null))
    }
  }

  return (
    <div className="space-y-6 relative">
      <TimerComponent />

      {/* Lista */}
      <div className="space-y-4">
        {exercises.map((ex, idx) => {
          const muscleColor = getMuscleColor(ex.name)
          
          return (
            <div 
              key={ex.id} 
              className="group relative flex flex-col p-4 md:p-5 bg-base rounded-2xl border border-border-subtle hover:border-accent/40 card-interactive shadow-sm overflow-hidden"
              style={{ borderLeft: `6px solid ${muscleColor}` }}
            >
              {/* Background Glow on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-muted/60 uppercase tracking-tighter">#{idx + 1}</span>
                    <h3 className="font-black text-primary text-lg tracking-tight leading-none uppercase">{ex.name}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ex.sets && ex.reps && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border-subtle shadow-sm">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">Sets</span>
                        <span className="font-black text-primary text-xs num">{ex.sets}x{ex.reps}</span>
                      </div>
                    )}
                    {ex.loadKg != null && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/5 border border-accent/20 shadow-sm">
                        <span className="text-[9px] font-bold text-accent uppercase tracking-tighter">Kg</span>
                        <span className="font-black text-accent text-xs num">{ex.loadKg}</span>
                      </div>
                    )}
                    {ex.rir != null && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10 border border-warning/20 shadow-sm">
                        <span className="text-[9px] font-bold text-warning uppercase tracking-tighter">RIR</span>
                        <span className="font-black text-warning text-xs num">{ex.rir}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openChart(ex.name)} 
                    className="p-2.5 rounded-xl bg-base hover:bg-accent hover:text-white text-muted border border-border transition-all duration-300 shadow-sm"
                    title="Vedi progressione"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(ex.id)} 
                    className="p-2.5 rounded-xl bg-base hover:bg-negative/10 text-negative/40 hover:text-negative border border-border transition-all shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-3xl bg-base/50">
            <Plus className="w-8 h-8 text-muted/30 mb-2" />
            <p className="text-sm text-muted font-medium">Nessun esercizio aggiunto.</p>
          </div>
        )}
      </div>

      {/* Form Aggiungi */}
      <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end bg-surface p-5 rounded-xl border border-border">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-primary mb-1.5">Esercizio *</label>
          <ExerciseAutocomplete
            value={name}
            onChange={setName}
            onSelect={(ex) => setName(ex.name)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary mb-1.5">Serie</label>
          <input type="number" value={sets} onChange={e => setSets(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-base text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30" placeholder="es. 4" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary mb-1.5">Reps</label>
          <input type="text" value={reps} onChange={e => setReps(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-base text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30" placeholder="es. 8-10" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary mb-1.5">Kg</label>
          <input type="number" step="0.5" value={loadKg} onChange={e => setLoadKg(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-base text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30" placeholder="es. 100" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary mb-1.5">RIR (0-4)</label>
          <input type="number" value={rir} onChange={e => setRir(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-base text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30" placeholder="es. 2" />
        </div>
        <div className="col-span-2 md:col-span-6 mt-2">
          <button type="submit" disabled={loading || !name} className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:opacity-90 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all shadow-[0_0_15px_var(--accent-glow,rgba(0,0,0,0))]">
            <Plus className="h-4 w-4" /> Aggiungi Esercizio
          </button>
        </div>
      </form>

      {/* Chart Modal — Progressione esercizio */}
      {chartExName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg relative shadow-2xl rounded-2xl p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <button onClick={() => setChartExName(null)}
              className="absolute top-4 right-4 transition-colors"
              style={{ color: 'var(--fg-muted)' }}>
              <X className="w-5 h-5" />
            </button>

            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
              Progressione
            </p>
            <h3 className="text-xl font-black mb-4" style={{ color: 'var(--fg-primary)' }}>
              {chartExName}
            </h3>

            {chartData.length < 2 ? (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
                Dati insufficienti — servono almeno 2 sessioni con questo esercizio.
              </p>
            ) : (() => {
              // Raggruppa per data sessione → prendi il peso massimo per sessione
              const sessionMap: Record<string, { dateLabel: string; maxKg: number; isoDate: string }> = {}
              for (const d of chartData as any[]) {
                const isoDate = new Date(d.session.date).toISOString().slice(0, 10)
                const dateLabel = new Date(d.session.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
                if (!sessionMap[isoDate]) {
                  sessionMap[isoDate] = { dateLabel, maxKg: d.loadKg, isoDate }
                } else if (d.loadKg > sessionMap[isoDate].maxKg) {
                  sessionMap[isoDate].maxKg = d.loadKg
                }
              }
              const sessions = Object.values(sessionMap).sort((a, b) => a.isoDate.localeCompare(b.isoDate))

              const maxKg = Math.max(...sessions.map(s => s.maxKg))
              const minKg = Math.min(...sessions.map(s => s.maxKg))
              const range = maxKg - minKg || 1

              // Trend badge
              const last = sessions[sessions.length - 1].maxKg
              const prev = sessions[sessions.length - 2].maxKg
              const delta = parseFloat((last - prev).toFixed(1))
              const trendIcon = delta > 0 ? '↑' : delta < 0 ? '↓' : '→'
              const trendColor = delta > 0 ? 'var(--positive)' : delta < 0 ? 'var(--negative)' : 'var(--warning)'
              const trendLabel = delta !== 0 ? `${delta > 0 ? '+' : ''}${delta} kg` : 'Stabile'

              // Coordinate SVG
              const W = 300, H = 70, PAD_X = 20, PAD_Y = 12
              const pts = sessions.map((s, i) => ({
                x: PAD_X + (i / (sessions.length - 1)) * (W - PAD_X * 2),
                y: PAD_Y + (1 - (s.maxKg - minKg) / range) * (H - PAD_Y * 2),
                ...s
              }))
              const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')

              return (
                <div>
                  {/* KPI row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div>
                      <p className="text-3xl font-black" style={{ color: 'var(--fg-primary)' }}>{last} <span className="text-lg font-medium" style={{ color: 'var(--fg-muted)' }}>kg</span></p>
                      <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>ultima sessione</p>
                    </div>
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        background: `color-mix(in srgb, ${trendColor} 12%, transparent)`,
                        color: trendColor,
                        border: `1px solid color-mix(in srgb, ${trendColor} 25%, transparent)`
                      }}>
                      {trendIcon} {trendLabel} vs precedente
                    </span>
                    <span className="ml-auto text-xs" style={{ color: 'var(--fg-subtle)' }}>
                      Max: <strong style={{ color: 'var(--fg-primary)' }}>{maxKg} kg</strong>
                    </span>
                  </div>

                  {/* SVG chart */}
                  <div className="rounded-xl overflow-hidden"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                    <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" style={{ height: '160px' }}>
                      <defs>
                        <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.20" />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Griglia orizzontale */}
                      {[0, 0.5, 1].map(pct => {
                        const y = PAD_Y + (1 - pct) * (H - PAD_Y * 2)
                        const val = (minKg + pct * range).toFixed(0)
                        return (
                          <g key={pct}>
                            <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y}
                              stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="3,4" />
                            <text x={PAD_X - 3} y={y + 3} fontSize="6" fill="var(--fg-subtle)" textAnchor="end">{val}</text>
                          </g>
                        )
                      })}

                      {/* Area fill */}
                      <polygon
                        fill="url(#exGrad)"
                        points={`${pts[0].x},${H} ${polyline} ${pts[pts.length - 1].x},${H}`}
                      />

                      {/* Linea principale */}
                      <polyline fill="none" stroke="var(--accent)" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" points={polyline} />

                      {/* Punti + etichette */}
                      {pts.map((p, i) => {
                        const isLast = i === pts.length - 1
                        return (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r={isLast ? 4 : 2.5}
                              fill={isLast ? 'var(--accent)' : 'var(--bg-base)'}
                              stroke="var(--accent)" strokeWidth="2" />
                            {/* Data label */}
                            <text
                              x={p.x} y={H + 16}
                              fontSize="7"
                              fill={isLast ? 'var(--fg-primary)' : 'var(--fg-subtle)'}
                              textAnchor="middle"
                              fontWeight={isLast ? 'bold' : 'normal'}
                            >
                              {p.dateLabel}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
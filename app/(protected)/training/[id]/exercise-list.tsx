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
    <div className="bg-[#111118] p-4 rounded-xl border border-white/5 mb-6 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
        <Timer className="w-5 h-5" />
      </div>
      {!isActive ? (
        <div className="flex items-center gap-2 flex-1">
          <input type="number" value={inputMinutes} onChange={e=>setInputMinutes(e.target.value)} className="w-12 p-1 bg-[#0a0a0f] border border-white/10 rounded text-center text-sm focus:outline-none focus:border-blue-500" placeholder="m" />
          <span>:</span>
          <input type="number" value={inputSeconds} onChange={e=>setInputSeconds(e.target.value)} className="w-12 p-1 bg-[#0a0a0f] border border-white/10 rounded text-center text-sm focus:outline-none focus:border-blue-500" placeholder="s" />
          <button onClick={startTimer} className="ml-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">Start</button>
        </div>
      ) : (
        <div className="flex items-center justify-between flex-1">
          <span className="text-2xl font-mono font-bold text-blue-500">{formatTime(seconds)}</span>
          <button onClick={() => setIsActive(false)} className="px-4 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded text-sm font-medium transition-colors">Stop</button>
        </div>
      )}
    </div>
  )
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
      <div className="space-y-3">
        {exercises.map((ex, idx) => (
          <div key={ex.id} className="flex items-center justify-between p-4 bg-[#0a0a0f] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#f1f5f9]">{idx + 1}. {ex.name}</span>
                <button onClick={() => openChart(ex.name)} className="p-1 text-[#64748b] hover:text-[#3b82f6] transition-colors" title="Vedi progressione">
                  <Activity className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-[#64748b] mt-1.5 flex gap-4">
                {ex.sets && ex.reps && <span className="bg-white/5 px-2 py-0.5 rounded">{ex.sets}x{ex.reps}</span>}
                {ex.loadKg != null && <span className="bg-[#3b82f6]/10 text-[#3b82f6] px-2 py-0.5 rounded font-medium">{ex.loadKg} kg</span>}
                {ex.rir != null && <span className="bg-white/5 px-2 py-0.5 rounded">RIR {ex.rir}</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(ex.id)} className="text-red-500/70 p-2 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all ml-2">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
        {exercises.length === 0 && <p className="text-sm text-[#64748b] text-center py-4">Nessun esercizio aggiunto.</p>}
      </div>

      {/* Form Aggiungi */}
      <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end bg-[#111118] p-5 rounded-xl border border-white/5">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-[#f1f5f9] mb-1.5">Esercizio *</label>
          <ExerciseAutocomplete
            value={name}
            onChange={setName}
            onSelect={(ex) => setName(ex.name)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#f1f5f9] mb-1.5">Serie</label>
          <input type="number" value={sets} onChange={e => setSets(e.target.value)} className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50" placeholder="es. 4" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#f1f5f9] mb-1.5">Reps</label>
          <input type="text" value={reps} onChange={e => setReps(e.target.value)} className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50" placeholder="es. 8-10" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#f1f5f9] mb-1.5">Kg</label>
          <input type="number" step="0.5" value={loadKg} onChange={e => setLoadKg(e.target.value)} className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50" placeholder="es. 100" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#f1f5f9] mb-1.5">RIR (0-4)</label>
          <input type="number" value={rir} onChange={e => setRir(e.target.value)} className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50" placeholder="es. 2" />
        </div>
        <div className="col-span-2 md:col-span-6 mt-2">
          <button type="submit" disabled={loading || !name} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Plus className="h-4 w-4" /> Aggiungi Esercizio
          </button>
        </div>
      </form>

      {/* Chart Modal */}
      {chartExName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-lg relative shadow-2xl">
            <button onClick={() => setChartExName(null)} className="absolute top-4 right-4 text-[#64748b] hover:text-[#f1f5f9]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 text-[#f1f5f9]">Progressione: <span className="text-[#3b82f6]">{chartExName}</span></h3>
            
            {chartData.length < 2 ? (
              <p className="text-[#64748b] py-8 text-center">Dati insufficienti per questo esercizio (min 2 sessioni).</p>
            ) : (
              <div className="h-48 relative mb-4">
                {/* SVG Line Chart */}
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  {(() => {
                    const max = Math.max(...chartData.map(d => d.loadKg))
                    const min = Math.min(...chartData.map(d => d.loadKg))
                    const range = max - min || 1
                    
                    const points = chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 100
                      const y = 50 - (((d.loadKg - min) / range) * 50)
                      return `${x},${y}`
                    }).join(" ")

                    return (
                      <>
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
                        {chartData.map((d, i) => {
                          const x = (i / (chartData.length - 1)) * 100
                          const y = 50 - (((d.loadKg - min) / range) * 50)
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="2" fill="#6366f1" />
                              {i === chartData.length - 1 && <text x={x} y={y - 4} fontSize="4" fill="#f1f5f9" textAnchor="middle">{d.loadKg}kg</text>}
                            </g>
                          )
                        })}
                      </>
                    )
                  })()}
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
"use client"

import { useState } from "react"
import { saveRecoveryLog } from "@/app/actions/recovery"
import { useRouter } from "next/navigation"

export default function RecoveryForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hrv, setHrv] = useState(initialData?.hrv?.toString() || "")
  const [rhr, setRhr] = useState(initialData?.rhr?.toString() || "")
  const [sleep, setSleep] = useState(initialData?.sleepMin ? (initialData.sleepMin / 60).toString() : "")
  const [score, setScore] = useState(initialData?.recoveryScore?.toString() || "")
  const [ctl, setCtl] = useState(initialData?.ctl?.toString() || "")
  const [atl, setAtl] = useState(initialData?.atl?.toString() || "")
  const [tsb, setTsb] = useState(initialData?.tsb?.toString() || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    await saveRecoveryLog({
      date: new Date(date),
      hrv: hrv ? parseFloat(hrv) : undefined,
      rhr: rhr ? parseInt(rhr) : undefined,
      sleepMin: sleep ? parseFloat(sleep) * 60 : undefined,
      recoveryScore: score ? parseInt(score) : undefined,
      ctl: ctl ? parseFloat(ctl) : undefined,
      atl: atl ? parseFloat(atl) : undefined,
      tsb: tsb ? parseFloat(tsb) : undefined,
    })

    setLoading(false)
    router.refresh()
  }

  // Semaforo Logic
  let trafficLight = "bg-zinc-200 dark:bg-zinc-800"
  if (score && tsb) {
    const s = parseInt(score)
    const t = parseFloat(tsb)
    if (s >= 70 && t > -10) trafficLight = "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
    else if (s < 40 || t < -30) trafficLight = "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
    else trafficLight = "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Dati di Oggi</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-500">Stato:</span>
          <div className={`w-6 h-6 rounded-full transition-all duration-500 ${trafficLight}`}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950" required />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><label className="block text-xs text-zinc-500 mb-1">HRV (ms)</label><input type="number" step="0.1" value={hrv} onChange={e=>setHrv(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm" /></div>
          <div><label className="block text-xs text-zinc-500 mb-1">RHR (bpm)</label><input type="number" value={rhr} onChange={e=>setRhr(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm" /></div>
          <div><label className="block text-xs text-zinc-500 mb-1">Sonno (ore)</label><input type="number" step="0.1" value={sleep} onChange={e=>setSleep(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm" /></div>
          <div><label className="block text-xs text-zinc-500 mb-1">Score (0-100)</label><input type="number" value={score} onChange={e=>setScore(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm" /></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs text-zinc-500 mb-1">CTL (Fitness)</label><input type="number" step="0.1" value={ctl} onChange={e=>setCtl(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm" /></div>
          <div><label className="block text-xs text-zinc-500 mb-1">ATL (Fatica)</label><input type="number" step="0.1" value={atl} onChange={e=>setAtl(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm" /></div>
          <div><label className="block text-xs text-zinc-500 mb-1">TSB (Forma)</label><input type="number" step="0.1" value={tsb} onChange={e=>setTsb(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm" /></div>
        </div>

        <p className="text-xs text-zinc-500 italic mt-2">Copia questi valori dalla tua app fitness (es. Suunto, Garmin).</p>

        <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
          {loading ? "Salvataggio..." : "Salva Dati"}
        </button>
      </form>
    </div>
  )
}
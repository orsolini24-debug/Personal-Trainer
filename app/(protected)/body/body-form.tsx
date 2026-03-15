"use client"

import { useState } from "react"
import { addBiometricLog } from "@/app/actions/body"
import { useRouter } from "next/navigation"

export default function BodyForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weightKg, setWeightKg] = useState(initialData?.weightKg?.toString() || "")
  const [fatPct, setFatPct] = useState(initialData?.fatPct?.toString() || "")
  const [waistCm, setWaistCm] = useState(initialData?.waistCm?.toString() || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    await addBiometricLog({
      date: new Date(date),
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      fatPct: fatPct ? parseFloat(fatPct) : undefined,
      waistCm: waistCm ? parseFloat(waistCm) : undefined,
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Aggiungi Misurazione</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Peso (kg)</label>
          <input type="number" step="0.1" value={weightKg} onChange={e=>setWeightKg(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Massa Grassa (%)</label>
          <input type="number" step="0.1" value={fatPct} onChange={e=>setFatPct(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Circonferenza Vita (cm)</label>
          <input type="number" step="0.5" value={waistCm} onChange={e=>setWaistCm(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
          {loading ? "Salvataggio..." : "Salva"}
        </button>
      </form>
    </div>
  )
}
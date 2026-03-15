"use client"

import { useState } from "react"
import { closeSession } from "@/app/actions/training"
import { useRouter } from "next/navigation"

export default function CloseSessionForm({ sessionId, initialData }: { sessionId: string, initialData: any }) {
  const [rpe, setRpe] = useState(initialData.rpe?.toString() || "")
  const [duration, setDuration] = useState(initialData.durationMin?.toString() || "")
  const [notes, setNotes] = useState(initialData.notes || "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await closeSession(sessionId, {
      rpe: rpe ? parseInt(rpe) : undefined,
      durationMin: duration ? parseInt(duration) : undefined,
      notes: notes || undefined
    })
    setLoading(false)
    if (res.success) {
      alert("Sessione salvata!")
      router.push("/training")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">RPE (1-10)</label>
          <input
            type="number"
            min="1" max="10"
            value={rpe}
            onChange={e => setRpe(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Durata (min)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Note</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 resize-none"
          placeholder="Come ti sei sentito?"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? "Salvataggio..." : "Salva & Chiudi Sessione"}
      </button>
    </form>
  )
}
"use client"

import { useState } from "react"
import { addExercise, deleteExercise } from "@/app/actions/training"
import { Exercise } from "@prisma/client"
import { Trash2, Plus } from "lucide-react"

export default function ExerciseList({ sessionId, initialExercises }: { sessionId: string, initialExercises: Exercise[] }) {
  const [exercises, setExercises] = useState(initialExercises)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [sets, setSets] = useState("")
  const [reps, setReps] = useState("")
  const [loadKg, setLoadKg] = useState("")
  const [rir, setRir] = useState("")

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

  return (
    <div className="space-y-6">
      {/* Lista */}
      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <div key={ex.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex-1">
              <span className="font-semibold">{idx + 1}. {ex.name}</span>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex gap-3">
                {ex.sets && ex.reps && <span>{ex.sets}x{ex.reps}</span>}
                {ex.loadKg != null && <span>{ex.loadKg} kg</span>}
                {ex.rir != null && <span>RIR {ex.rir}</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(ex.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {exercises.length === 0 && <p className="text-sm text-zinc-500 italic">Nessun esercizio aggiunto.</p>}
      </div>

      {/* Form Aggiungi */}
      <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="col-span-2">
          <label className="block text-xs text-zinc-500 mb-1">Esercizio *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900" placeholder="es. Squat" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Serie</label>
          <input type="number" value={sets} onChange={e => setSets(e.target.value)} className="w-full p-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900" placeholder="es. 4" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Reps</label>
          <input type="text" value={reps} onChange={e => setReps(e.target.value)} className="w-full p-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900" placeholder="es. 8-10" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kg</label>
          <input type="number" step="0.5" value={loadKg} onChange={e => setLoadKg(e.target.value)} className="w-full p-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900" placeholder="es. 100" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">RIR</label>
          <input type="number" value={rir} onChange={e => setRir(e.target.value)} className="w-full p-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900" placeholder="es. 2" />
        </div>
        <div className="col-span-2 md:col-span-6 mt-2">
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded text-sm font-medium disabled:opacity-50">
            <Plus className="h-4 w-4" /> Aggiungi
          </button>
        </div>
      </form>
    </div>
  )
}
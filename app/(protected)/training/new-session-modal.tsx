"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSession } from "@/app/actions/training"
import { SessionType } from "@prisma/client"
import { Plus, X } from "lucide-react"

export default function NewSessionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<SessionType>(SessionType.A)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createSession({ date: new Date(date), type })
    setLoading(false)
    if (res.success && res.data) {
      setIsOpen(false)
      router.push(`/training/${res.data.id}`)
    } else {
      alert("Errore: " + res.error)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
      >
        <Plus className="h-4 w-4" /> Nuova Sessione
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Crea Sessione</h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as SessionType)}
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950"
                >
                  {Object.values(SessionType).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? "Creazione..." : "Crea"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
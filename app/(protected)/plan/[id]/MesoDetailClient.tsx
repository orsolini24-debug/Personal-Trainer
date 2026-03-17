"use client"

import { useState } from "react"
import { activateMesocycle, deleteMesocycle } from "@/app/actions/mesocycle-management"
import { useRouter } from "next/navigation"
import { Zap, Trash2, Loader2, CheckCircle2 } from "lucide-react"

export default function MesoDetailClient({ id, status }: { id: string, status: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleActivate = async () => {
    if (!confirm("Vuoi attivare questo mesociclo? L'attuale mesociclo attivo verrà archiviato.")) return
    setLoading(true)
    const res = await activateMesocycle(id)
    setLoading(false)
    if (res.success) {
      router.push("/plan")
      router.refresh()
    } else {
      alert("Errore: " + res.error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questo mesociclo?")) return
    setLoading(true)
    const res = await deleteMesocycle(id)
    setLoading(false)
    if (res.success) {
      router.push("/plan")
      router.refresh()
    } else {
      alert("Errore: " + res.error)
    }
  }

  return (
    <div className="flex gap-3">
      {status !== 'ACTIVE' && (
        <button
          onClick={handleActivate}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-black text-sm shadow-lg disabled:opacity-50 btn-primary"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Attiva Piano
        </button>
      )}
      <button 
        onClick={handleDelete}
        disabled={loading}
        className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}

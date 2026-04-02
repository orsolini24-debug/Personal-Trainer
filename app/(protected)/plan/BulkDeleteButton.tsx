'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { bulkDeleteMesocycles } from '@/app/actions/mesocycle-management'
import { useRouter } from 'next/navigation'

export default function BulkDeleteButton() {
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleBulkDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000) // Reset dopo 3 secondi
      return
    }

    setLoading(true)
    try {
      const res = await bulkDeleteMesocycles()
      if (res?.success) {
        router.refresh()
      } else {
        alert("Errore durante l'eliminazione")
      }
    } catch (err) {
      alert("Errore imprevisto")
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <button
      onClick={handleBulkDelete}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
        ${confirming 
          ? 'bg-negative text-white animate-pulse' 
          : 'glass-sm text-negative hover:bg-negative/10 border border-negative/20'}
      `}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : confirming ? (
        <AlertTriangle className="w-3 h-3" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
      {confirming ? 'Conferma?' : 'Svuota Archivio'}
    </button>
  )
}

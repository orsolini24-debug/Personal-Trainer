"use client"

import { useState } from "react"
import { translateExercisesBatch } from "@/app/actions/exercises-translation"
import { Languages, Loader2, CheckCircle2 } from "lucide-react"

export default function ExerciseTranslator() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean, count: number, error?: string } | null>(null)

  const handleTranslate = async () => {
    setLoading(true)
    setResult(null)
    const res = await translateExercisesBatch(30)
    setLoading(false)
    setResult({ success: res.success, count: res.count ?? 0, error: res.error })
  }

  return (
    <div className="bg-[#111118] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#f1f5f9]">Localizzazione AI</h3>
            <p className="text-xs text-[#64748b]">Traduci e arricchisci gli esercizi in Italiano.</p>
          </div>
        </div>
        <button
          onClick={handleTranslate}
          disabled={loading}
          className="px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
          {loading ? "Traduzione in corso..." : "Batch 30"}
        </button>
      </div>

      {result && result.success && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#10b981] animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4" />
          Aggiornati {result.count} esercizi con successo.
        </div>
      )}
    </div>
  )
}

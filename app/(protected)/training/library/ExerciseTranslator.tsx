"use client"

import { useState } from "react"
import { translateExercisesBatch } from "@/app/actions/exercises-translation"
import { Languages, Loader2, CheckCircle2, Play, CircleStop } from "lucide-react"

export default function ExerciseTranslator() {
  const [loading, setLoading] = useState(false)
  const [isAuto, setIsAuto] = useState(false)
  const [totalTranslated, setTotalTranslated] = useState(0)
  const [result, setResult] = useState<{ success: boolean, count: number, error?: string } | null>(null)

  const handleTranslate = async (auto = false) => {
    setLoading(true)
    if (!auto) setResult(null)
    
    const res = await translateExercisesBatch(30)
    
    if (res.success && res.count && res.count > 0) {
      setTotalTranslated(prev => prev + (res.count || 0))
      setResult({ success: true, count: res.count })
      
      if (auto && isAuto) {
        // Continue if in auto mode
        setTimeout(() => handleTranslate(true), 1000)
      } else {
        setLoading(false)
        setIsAuto(false)
      }
    } else {
      setLoading(false)
      setIsAuto(false)
      setResult({ success: res.success, count: res.count ?? 0, error: res.error || (res.count === 0 ? "Tutti gli esercizi sono già tradotti." : undefined) })
    }
  }

  const toggleAuto = () => {
    if (isAuto) {
      setIsAuto(false)
    } else {
      setIsAuto(true)
      handleTranslate(true)
    }
  }

  return (
    <div className="bg-surface border border-subtle rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#3b82f6]/5 rounded-full blur-3xl group-hover:bg-[#3b82f6]/10 transition-all duration-700"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] border border-[#3b82f6]/20">
            <Languages className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-primary">Localizzazione AI</h3>
            <p className="text-xs text-muted mt-1 font-medium italic">Database: ~630 esercizi da tradurre e arricchire.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => handleTranslate(false)}
            disabled={loading}
            className="flex-1 md:flex-none px-5 py-3 bg-white/5 hover:bg-white/10 text-primary rounded-2xl font-bold text-xs transition-all border border-subtle disabled:opacity-50"
          >
            {loading && !isAuto ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Batch 30"}
          </button>
          
          <button
            onClick={toggleAuto}
            className={`flex-[2] md:flex-none px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${isAuto ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white shadow-blue-500/20'}`}
          >
            {isAuto ? <CircleStop className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAuto ? "Ferma Auto" : "Traduzione Automatica"}
          </button>
        </div>
      </div>

      {(totalTranslated > 0 || result) && (
        <div className="mt-6 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#10b981] transition-all duration-1000" style={{ width: loading ? '100%' : '0%', opacity: loading ? 1 : 0 }}></div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className={result?.error ? "text-red-500" : "text-[#10b981] flex items-center gap-1"}>
              {result?.error ? result.error : <><CheckCircle2 className="w-3 h-3" /> {isAuto ? "Processando..." : "Completato"}</>}
            </span>
            <span className="text-muted">Totale Sessione: {totalTranslated}</span>
          </div>
        </div>
      )}
    </div>
  )
}

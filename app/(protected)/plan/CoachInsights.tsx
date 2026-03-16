"use client"

import { useState, useEffect } from "react"
import { getPlanInsights } from "@/app/actions/plan-adaptation"
import { 
  Sparkles, Target, TrendingUp, ArrowRight, 
  Loader2, Info, Brain, Milestone 
} from "lucide-react"

interface Insights {
  expectedObjectives: string[]
  nextPhasePreview: string
  currentStatus: string
  adjustments: string[]
}

export default function CoachInsights({ mesoId }: { mesoId: string }) {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await getPlanInsights(mesoId)
      if (res) setInsights(res as Insights)
      setLoading(false)
    }
    load()
  }, [mesoId])

  if (loading) {
    return (
      <div className="bg-surface rounded-[2.5rem] p-8 border border-subtle flex flex-col items-center justify-center min-h-[200px] animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-bold text-muted uppercase tracking-widest">Analisi del Coach in corso...</p>
      </div>
    )
  }

  if (!insights) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Expected Objectives */}
      <div className="bg-surface rounded-[2.5rem] p-8 border border-subtle relative overflow-hidden group hover:border-primary/30 transition-all">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
          <Target className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
            <Milestone className="w-4 h-4" /> Obiettivi Attesi
          </h3>
          <div className="space-y-4">
            {insights.expectedObjectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <p className="text-sm font-bold text-primary italic leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Phase Preview */}
      <div className="bg-surface rounded-[2.5rem] p-8 border border-subtle relative overflow-hidden group hover:border-accent/30 transition-all">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:-rotate-12 transition-transform duration-700">
          <Sparkles className="w-32 h-32 text-accent" />
        </div>
        <div className="relative z-10">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-6 flex items-center gap-2">
            <Brain className="w-4 h-4" /> Evoluzione Prossima Fase
          </h3>
          <p className="text-sm font-medium text-muted leading-relaxed mb-6">
            {insights.nextPhasePreview}
          </p>
          <div className="pt-4 border-t border-white/5 flex items-center justify-between group/link cursor-pointer">
            <span className="text-[10px] font-black uppercase tracking-widest text-accent">Dettagli Roadmap</span>
            <ArrowRight className="w-4 h-4 text-accent group-hover/link:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Current Status & Adjustments */}
      <div className="md:col-span-2 bg-surface rounded-[2.5rem] p-8 border border-subtle relative overflow-hidden group hover:border-[#10b981]/30 transition-all">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
          <TrendingUp className="w-48 h-48 text-[#10b981]" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#10b981] mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Analisi del Passo
              </h3>
              <p className="text-lg font-black text-primary tracking-tight">
                {insights.currentStatus}
              </p>
            </div>
          </div>
          
          {insights.adjustments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.adjustments.map((adj, i) => (
                <div key={i} className="bg-base p-4 rounded-2xl border border-subtle flex items-center gap-3 group/adj hover:border-[#10b981]/50 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 text-[#10b981] flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 fill-[#10b981]" />
                  </div>
                  <p className="text-xs font-bold text-primary leading-tight">{adj}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

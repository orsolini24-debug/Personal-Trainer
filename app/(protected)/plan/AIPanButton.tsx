"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { generateAITripleProposal } from "@/app/actions/deep-onboarding"
import { useRouter } from "next/navigation"

interface AIPanButtonProps {
  label?: string
}

export default function AIPanButton({ label }: AIPanButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!confirm("L'AI analizzerà il tuo profilo per generare 3 proposte strategiche. Procedere?")) return
    setLoading(true)
    const res = await generateAITripleProposal()
    setLoading(false)

    if (res.success) {
      router.refresh()
    } else {
      alert("Errore: " + res.error)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent2 text-white rounded-2xl font-black text-sm transition-all shadow-[0_0_25px_rgba(59,130,246,0.3)] disabled:opacity-50 active:scale-95 hover:brightness-110"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
      {loading ? "Analisi Atleta..." : (label || "Genera Strategie AI")}
    </button>
  )
}

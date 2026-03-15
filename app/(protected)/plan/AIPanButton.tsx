"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { generateAIPlan } from "@/app/actions/ai-plan"
import { useRouter } from "next/navigation"

export default function AIPanButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!confirm("L'AI genererà un nuovo mesociclo basato sul tuo profilo. Procedere?")) return
    setLoading(true)
    const res = await generateAIPlan()
    setLoading(false)
    
    if (res.success) {
      alert("Piano generato con successo!")
      router.refresh()
    } else {
      alert("Errore: " + res.error)
    }
  }

  return (
    <button 
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50"
    >
      <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? "Generazione..." : "Genera Piano AI"}
    </button>
  )
}

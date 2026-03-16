"use client"

import { useState } from "react"
import { FileText, X, Loader2, Check, UploadCloud } from "lucide-react"
import { analyzeAndImportPlan } from "@/app/actions/import-analysis"
import { useRouter } from "next/navigation"

export default function PlanImportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleImport = async () => {
    if (!text.trim()) return
    setLoading(true)
    const res = await analyzeAndImportPlan(text)
    setLoading(false)
    
    if (res.success) {
      setIsOpen(false)
      setText("")
      alert("Piano importato e attivato con successo!")
      router.refresh()
    } else {
      alert("Errore: " + res.error)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-2xl bg-foreground/5 text-muted hover:text-[#3b82f6] transition-all border border-subtle group"
        title="Importa Piano Esistente"
      >
        <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xl bg-surface border border-default rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6]">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-primary">Importa Piano Esistente</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-muted mb-6 leading-relaxed">
              Incolla il testo del tuo piano attuale (esercizi, serie, reps). L'AI lo analizzerà e lo trasformerà in un formato digitale per questo ecosistema.
            </p>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Esempio:
Giorno A - Upper Body:
Panca Piana 4x8 90s
Rematore 3x10 60s
..."
              className="w-full h-64 p-4 rounded-3xl bg-base border border-subtle text-primary text-sm focus:border-[#3b82f6]/50 outline-none resize-none mb-6"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-foreground/5 text-muted font-bold hover:bg-foreground/10 transition-all"
              >
                Annulla
              </button>
              <button 
                onClick={handleImport}
                disabled={loading || !text.trim()}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-20 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {loading ? "Analisi AI..." : "Analizza & Importa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

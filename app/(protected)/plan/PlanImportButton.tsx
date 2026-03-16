"use client"

import { useState, useRef } from "react"
import { FileText, X, Loader2, Check, UploadCloud, Image as ImageIcon, FileType } from "lucide-react"
import { analyzeAndImportPlan } from "@/app/actions/import-analysis"
import { extractTextFromImage } from "@/app/actions/import-vision"
import { extractTextFromPDF } from "@/app/actions/import-pdf"
import { useRouter } from "next/navigation"

export default function PlanImportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      const res = await extractTextFromImage(base64)
      if (res.success && res.text) {
        setText(prev => prev + (prev ? "\n\n" : "") + res.text)
      } else {
        alert("Errore durante l'estrazione del testo dall'immagine: " + res.error)
      }
      setIsExtracting(false)
    }
    reader.readAsDataURL(file)
  }

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      const res = await extractTextFromPDF(base64)
      if (res.success && res.text) {
        setText(prev => prev + (prev ? "\n\n" : "") + res.text)
      } else {
        alert("Errore durante l'estrazione del testo dal PDF: " + res.error)
      }
      setIsExtracting(false)
    }
    reader.readAsDataURL(file)
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
          <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6]">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-zinc-900">Importa Piano</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => imageInputRef.current?.click()}
                disabled={isExtracting}
                className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-zinc-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all group"
              >
                {isExtracting ? <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6] mb-2" /> : <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-[#3b82f6] mb-2" />}
                <span className="text-xs font-black text-zinc-500 group-hover:text-[#3b82f6] uppercase tracking-widest">Carica Foto</span>
                <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </button>
              
              <button 
                onClick={() => pdfInputRef.current?.click()}
                disabled={isExtracting}
                className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-zinc-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all group"
              >
                {isExtracting ? <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6] mb-2" /> : <FileType className="w-8 h-8 text-zinc-400 group-hover:text-[#3b82f6] mb-2" />}
                <span className="text-xs font-black text-zinc-500 group-hover:text-[#3b82f6] uppercase tracking-widest">Carica PDF</span>
                <input type="file" ref={pdfInputRef} onChange={handlePdfChange} accept="application/pdf" className="hidden" />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Testo Estratto / Contenuto</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Il testo estratto apparirà qui. Puoi anche incollarlo manualmente..."
                className="w-full h-48 p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-100 text-zinc-900 text-sm font-medium focus:border-[#3b82f6] outline-none resize-none transition-all placeholder:text-zinc-300"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-zinc-100 text-zinc-500 font-bold hover:bg-zinc-200 transition-all"
              >
                Annulla
              </button>
              <button 
                onClick={handleImport}
                disabled={loading || !text.trim() || isExtracting}
                className="flex-[2] py-4 rounded-2xl bg-[#3b82f6] text-white font-black flex items-center justify-center gap-2 shadow-xl disabled:opacity-20 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {loading ? "Analisi AI..." : "Conferma e Importa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

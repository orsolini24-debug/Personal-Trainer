"use client"

import { useState, useRef, useEffect } from "react"
import { FileText, X, Loader2, Check, UploadCloud, Image as ImageIcon, FileType, Info } from "lucide-react"
import { analyzeAndImportPlanSmart } from "@/app/actions/import-analysis"
import { extractTextFromImage } from "@/app/actions/import-vision"
import { useRouter } from "next/navigation"

export default function PlanImportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Load PDF.js dynamically
  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'
      script.onload = () => {
        // @ts-ignore
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'
      }
      document.head.appendChild(script)
    }
  }, [isOpen])

  const handleImport = async () => {
    if (!text.trim()) return
    setLoading(true)
    const res = await analyzeAndImportPlanSmart(text)
    setLoading(false)
    
    if (res.success) {
      let msg = "Importazione completata!"
      if (res.importedTraining && res.importedNutrition) msg = "Allenamento e Dieta importati con successo!"
      else if (res.importedTraining) msg = "Allenamento importato con successo!"
      else if (res.importedNutrition) msg = "Dieta importata con successo!"
      else msg = "Nessun dato riconosciuto correttamente nel testo."

      if (res.trainingError || res.nutritionError) {
        msg += "\n\nNote:\n" + (res.trainingError ? `- Training: ${res.trainingError}\n` : "") + (res.nutritionError ? `- Dieta: ${res.nutritionError}` : "")
      }

      alert(msg)
      if (res.importedTraining || res.importedNutrition) {
        setIsOpen(false)
        setText("")
        router.refresh()
      }
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
        alert("Errore durante l'estrazione: " + res.error)
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
      try {
        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer)
        // @ts-ignore
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise
        let fullText = ""
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const strings = content.items.map((item: any) => item.str)
          fullText += strings.join(" ") + "\n\n"
        }
        
        setText(prev => prev + (prev ? "\n\n" : "") + fullText)
      } catch (error) {
        alert("Errore durante la lettura del PDF. Se è una scansione, prova a caricarlo come foto.")
      }
      setIsExtracting(false)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-2xl transition-all border group"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--fg-muted)',
        }}
        title="Importa Piano Esistente"
      >
        <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: 'var(--accent)' }} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black" style={{ color: 'var(--fg-primary)' }}>Importa Piano</h3>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ color: 'var(--fg-muted)' }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--fg-muted)' }}>
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p>
                Puoi caricare foto o PDF sia di <strong>allenamenti</strong> che di <strong>diete</strong>. L'intelligenza artificiale riconoscerà automaticamente il contenuto e lo salverà nella sezione corretta.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isExtracting}
                className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed transition-all group"
                style={{ borderColor: 'var(--border-default)', color: 'var(--fg-muted)' }}
              >
                {isExtracting
                  ? <Loader2 className="w-8 h-8 animate-spin mb-2" style={{ color: 'var(--accent)' }} />
                  : <ImageIcon className="w-8 h-8 mb-2" style={{ color: 'var(--fg-subtle)' }} />
                }
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Carica Foto</span>
                <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </button>

              <button
                onClick={() => pdfInputRef.current?.click()}
                disabled={isExtracting}
                className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed transition-all group"
                style={{ borderColor: 'var(--border-default)', color: 'var(--fg-muted)' }}
              >
                {isExtracting
                  ? <Loader2 className="w-8 h-8 animate-spin mb-2" style={{ color: 'var(--accent)' }} />
                  : <FileType className="w-8 h-8 mb-2" style={{ color: 'var(--fg-subtle)' }} />
                }
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Carica PDF</span>
                <input type="file" ref={pdfInputRef} onChange={handlePdfChange} accept="application/pdf" className="hidden" />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--fg-subtle)' }}>Contenuto Analizzato</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Il testo del piano apparirà qui dopo l'estrazione..."
                className="w-full h-48 p-4 rounded-2xl text-sm font-medium outline-none resize-none transition-all"
                style={{
                  background: 'var(--bg-input)',
                  border: '2px solid var(--border-default)',
                  color: 'var(--fg-primary)',
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-4 rounded-2xl font-bold transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-default)' }}
              >Annulla</button>
              <button
                onClick={handleImport}
                disabled={loading || !text.trim() || isExtracting}
                className="flex-[2] py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl disabled:opacity-20 transition-all"
                style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
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

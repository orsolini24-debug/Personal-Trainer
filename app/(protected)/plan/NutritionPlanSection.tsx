'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { importNutritionPlanFromText, importNutritionPlanFromImage, deleteNutritionPlan, NutritionPlanData } from '@/app/actions/import-nutrition'
import {
  Utensils, Upload, FileText, Image, Type, X, Loader2,
  CheckCircle2, Trash2, ChevronDown, ChevronUp, Flame,
  Beef, Wheat, Droplets, Clock, AlertCircle
} from 'lucide-react'

interface ActiveNutritionMeso {
  id: string
  name: string
  objectives: string | null
  kpi: unknown
  startDate: Date
  endDate: Date | null
}

interface Props {
  activeNutritionMeso: ActiveNutritionMeso | null
}

type ImportMode = 'text' | 'image' | null

export default function NutritionPlanSection({ activeNutritionMeso }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<ImportMode>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load PDF.js dynamically
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'
    script.onload = () => {
      // @ts-ignore
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'
    }
    document.head.appendChild(script)
  }, [])

  const kpi = activeNutritionMeso?.kpi as {
    kcalTarget?: number; proteinG?: number; carbsG?: number; fatG?: number
    meals?: { name: string; timeHint: string; kcal: number; foods: string[]; notes?: string }[]
    guidelines?: string[]
  } | null

  const handleTextImport = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    const res = await importNutritionPlanFromText(text)
    if ('error' in res) {
      setError(res.error ?? null)
    } else {
      setMode(null)
      setText('')
      router.refresh()
    }
    setLoading(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    if (file.type === 'application/pdf') {
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
          
          const res = await importNutritionPlanFromText(fullText)
          if ('error' in res) {
            setError(res.error ?? null)
          } else {
            setMode(null)
            router.refresh()
          }
        } catch (error) {
          setError("Errore durante la lettura del PDF. Se è una scansione, prova a caricarlo come foto.")
        }
        setLoading(false)
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const [meta, base64] = dataUrl.split(',')
        const mimeType = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
        const res = await importNutritionPlanFromImage(base64, mimeType)
        if ('error' in res) {
          setError(res.error ?? null)
        } else {
          setMode(null)
          router.refresh()
        }
        setLoading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDelete = async () => {
    if (!activeNutritionMeso) return
    setDeleting(true)
    await deleteNutritionPlan(activeNutritionMeso.id)
    setDeleting(false)
    router.refresh()
  }

  // ── DISPLAY active nutrition plan ──────────────────────────────────────────
  if (activeNutritionMeso && !mode) {
    return (
      <section className="bg-surface rounded-[2.5rem] border border-border overflow-hidden">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--positive) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--positive) 25%, transparent)' }}>
              <Utensils className="w-6 h-6 text-positive" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-positive mb-0.5">Piano Attivo</p>
              <h3 className="font-black text-primary text-lg leading-tight">{activeNutritionMeso.name}</h3>
              {activeNutritionMeso.objectives && (
                <p className="text-xs text-muted mt-0.5 line-clamp-1 italic">{activeNutritionMeso.objectives}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('text')}
              className="p-2.5 rounded-xl text-muted hover:text-primary transition-all border border-border hover:border-accent/30"
              style={{ background: 'var(--bg-elevated)' }}
              title="Aggiorna piano"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2.5 rounded-xl text-muted hover:text-negative transition-all border border-border hover:border-negative/30"
              style={{ background: 'var(--bg-elevated)' }}
              title="Rimuovi piano"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2.5 rounded-xl transition-all border border-border"
              style={{ background: expanded ? 'var(--accent)' : 'var(--bg-elevated)', color: expanded ? 'white' : 'var(--fg-muted)', borderColor: expanded ? 'var(--accent)' : 'var(--border-default)' }}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Macro summary bar */}
        {kpi && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Flame, label: 'Kcal', value: kpi.kcalTarget, unit: 'kcal', color: 'var(--warning)' },
                { icon: Beef, label: 'Proteine', value: kpi.proteinG, unit: 'g', color: 'var(--accent2)' },
                { icon: Wheat, label: 'Carboidrati', value: kpi.carbsG, unit: 'g', color: 'var(--warning)' },
                { icon: Droplets, label: 'Grassi', value: kpi.fatG, unit: 'g', color: 'var(--accent)' },
              ].map(({ icon: Icon, label, value, unit, color }) => (
                <div key={label} className="p-3 rounded-2xl bg-base border border-border text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</p>
                  <p className="font-black text-primary text-sm">{value ?? '—'}<span className="text-[10px] text-muted font-medium ml-0.5">{unit}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expanded: meals + guidelines */}
        {expanded && kpi && (
          <div className="px-6 pb-6 space-y-5 border-t border-border pt-5">
            {/* Meals */}
            {kpi.meals && kpi.meals.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Pasti
                </p>
                <div className="space-y-2">
                  {kpi.meals.map((meal, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-base border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-primary">{meal.name}</span>
                          {meal.timeHint && (
                            <span className="text-[10px] font-bold text-muted">{meal.timeHint}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-warning">{meal.kcal} kcal</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {meal.foods.map((food, j) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 rounded-lg bg-elevated border border-border text-muted font-medium">
                            {food}
                          </span>
                        ))}
                      </div>
                      {meal.notes && (
                        <p className="text-[10px] text-muted mt-2 italic">{meal.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guidelines */}
            {kpi.guidelines && kpi.guidelines.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Linee Guida
                </p>
                <div className="space-y-1.5">
                  {kpi.guidelines.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="text-positive mt-0.5 shrink-0">✓</span>
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    )
  }

  // ── IMPORT MODE ────────────────────────────────────────────────────────────
  if (!mode) {
    return (
      <section className="bg-surface rounded-[2.5rem] border border-border p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--positive) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--positive) 25%, transparent)' }}>
            <Utensils className="w-6 h-6 text-positive" />
          </div>
          <div>
            <h3 className="font-black text-primary text-lg">Piano Alimentare</h3>
            <p className="text-sm text-muted">Importa il tuo piano nutrizionale</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setMode('text')}
            className="p-5 rounded-[2rem] border border-border hover:border-positive/30 transition-all text-left group"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <Type className="w-6 h-6 text-positive mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-black text-primary text-sm mb-1">Incolla Testo</p>
            <p className="text-[11px] text-muted">Testo del piano, lista pasti, macros</p>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="p-5 rounded-[2rem] border border-border hover:border-positive/30 transition-all text-left group"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <Image className="w-6 h-6 text-positive mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-black text-primary text-sm mb-1">Foto o Documento</p>
            <p className="text-[11px] text-muted">PNG, JPG, PDF — AI lo legge automaticamente</p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-base border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <p className="text-sm text-muted">Analisi in corso...</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: 'color-mix(in srgb, var(--negative) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--negative) 25%, transparent)' }}>
            <AlertCircle className="w-4 h-4 text-negative shrink-0" />
            <p className="text-sm text-negative">{error}</p>
          </div>
        )}
      </section>
    )
  }

  // ── TEXT INPUT MODE ────────────────────────────────────────────────────────
  return (
    <section className="bg-surface rounded-[2.5rem] border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-positive" /> Incolla il Piano Alimentare
        </h3>
        <button onClick={() => setMode(null)} className="text-muted hover:text-primary">
          <X className="w-5 h-5" />
        </button>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Incolla qui il tuo piano alimentare — testo libero, lista pasti, macros, qualsiasi formato..."
        rows={10}
        className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none transition-all"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--fg-primary)',
          fontFamily: 'inherit',
          lineHeight: '1.6',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
      />

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'color-mix(in srgb, var(--negative) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--negative) 25%, transparent)' }}>
          <AlertCircle className="w-4 h-4 text-negative shrink-0" />
          <p className="text-sm text-negative">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => { setMode(null); setError(null) }}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted border border-border transition-all hover:border-border-strong"
          style={{ background: 'var(--bg-elevated)' }}
        >
          Annulla
        </button>
        <button
          onClick={handleTextImport}
          disabled={loading || !text.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{ background: 'var(--positive)' }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisi AI...</> : <><CheckCircle2 className="w-4 h-4" /> Importa Piano</>}
        </button>
      </div>
    </section>
  )
}

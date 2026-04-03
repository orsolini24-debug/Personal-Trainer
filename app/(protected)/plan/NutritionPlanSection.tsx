'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { importNutritionPlanFromText, importNutritionPlanFromImage, deleteNutritionPlan, NutritionPlanData } from '@/app/actions/import-nutrition'
import {
  Utensils, Upload, FileText, Image, Type, X, Loader2,
  CheckCircle2, Trash2, ChevronDown, ChevronUp, Flame,
  Beef, Wheat, Droplets, Clock, AlertCircle, Info
} from 'lucide-react'
import MesoSettings from './MesoSettings'

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
      // @ts-ignore
      if (!window.pdfjsLib) {
        setError('PDF.js non ancora caricato. Attendi qualche secondo e riprova.')
        setLoading(false)
        if (fileRef.current) fileRef.current.value = ''
        return
      }
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
      <div className="space-y-10">
        <section className="rounded-[3rem] p-10 card-elevated mesh-bg border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.04] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-1000">
            <Utensils className="w-72 h-72" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white glow-accent"
                     style={{ background: 'linear-gradient(135deg, var(--positive), #10B981)' }}>
                  <Utensils className="w-10 h-10" />
                </div>
                <div>
                  <span className="badge badge-accent mb-1.5 animate-glow-breathe" style={{ background: 'var(--positive)', borderColor: 'var(--positive)' }}>
                    Alimentazione Attiva
                  </span>
                  <h2 className="text-4xl font-black text-primary tracking-tighter leading-none">{activeNutritionMeso.name}</h2>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right glass-sm p-4 rounded-2xl border border-border/50">
                  <p className="text-[10px] font-black uppercase text-fg-subtle tracking-widest mb-1.5">Target Giornaliero</p>
                  <p className="text-sm font-black text-primary num tracking-tight">
                    {kpi?.kcalTarget ?? '—'} <span className="text-[10px] opacity-40 uppercase">kcal</span>
                  </p>
                </div>
                <MesoSettings mesoId={activeNutritionMeso.id} mesoName={activeNutritionMeso.name} />
              </div>
            </div>

            {/* Macros Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Proteine', value: kpi?.proteinG, color: 'var(--accent)', icon: Beef, unit: 'g' },
                { label: 'Carboidrati', value: kpi?.carbsG, color: 'var(--warning)', icon: Wheat, unit: 'g' },
                { label: 'Grassi', value: kpi?.fatG, color: 'var(--fg-muted)', icon: Droplets, unit: 'g' },
                { label: 'Kcal', value: kpi?.kcalTarget, color: 'var(--positive)', icon: Flame, unit: 'kcal' },
              ].map((macro) => (
                <div key={macro.label} className="glass-sm p-4 rounded-2xl border border-border/40 text-center surface-accent">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <macro.icon className="w-3 h-3" style={{ color: macro.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-fg-subtle">{macro.label}</span>
                  </div>
                  <p className="text-xl font-black tracking-tight text-primary">
                    {macro.value ?? '—'}<span className="text-[10px] font-bold opacity-40 ml-0.5">{macro.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="glass-sm p-6 rounded-[2rem] border border-border/40 mb-10 surface-accent">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                  <Info className="w-4 h-4" /> Focus Nutrizionale
                </h3>
                <button 
                  onClick={() => setMode('text')}
                  className="btn-ghost px-3 py-1 text-[10px] font-bold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Aggiorna
                </button>
              </div>
              <p className="text-fg-muted text-sm leading-relaxed italic opacity-80">{activeNutritionMeso.objectives ?? 'Piano alimentare personalizzato basato sui tuoi obiettivi.'}</p>
            </div>

            {/* Meals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kpi?.meals?.map((meal, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-[2.5rem] card-interactive surface-accent group/card"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 rounded-2xl glass-sm flex items-center justify-center font-black text-accent group-hover/card:btn-primary group-hover/card:text-white transition-all shadow-md">
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-accent opacity-40" />
                      <span className="text-[10px] font-black text-fg-subtle uppercase tracking-widest">{meal.timeHint || 'Pasto'}</span>
                    </div>
                  </div>
                  <p className="font-black text-lg text-primary mb-1 tracking-tight">{meal.name}</p>
                  <p className="text-[10px] text-positive uppercase font-black tracking-widest mb-5">{meal.kcal} kcal</p>
                  
                  <div className="space-y-2 opacity-60 group-hover/card:opacity-100 transition-opacity">
                    {meal.foods.map((food, fidx) => (
                      <p key={fidx} className="text-[10px] font-bold text-fg-muted truncate flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-positive/40 inline-block" /> {food}
                      </p>
                    ))}
                  </div>
                  {meal.notes && (
                    <p className="mt-4 text-[10px] text-muted italic opacity-60 line-clamp-2">{meal.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Guidelines Section */}
            {kpi?.guidelines && kpi.guidelines.length > 0 && (
              <div className="mt-10 pt-10 border-t border-border/40">
                <p className="divider-label mb-6">Linee Guida Tecnica</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kpi.guidelines.map((g, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl glass-sm border border-border/30">
                      <div className="w-6 h-6 rounded-lg bg-positive/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-positive" />
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{g}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
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

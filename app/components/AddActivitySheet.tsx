'use client'

import { useState, useRef, useCallback } from 'react'
import {
  X, Upload, FileJson, Image, Activity, Clock, MapPin,
  Heart, Flame, ChevronDown, Loader2, Check, AlertCircle,
  Camera, Plus
} from 'lucide-react'
import { addManualActivity, type AddManualActivityInput } from '@/app/actions/calendar'
import { SportType } from '@prisma/client'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  defaultDate: string
  onClose: () => void
  onSuccess: () => void
}

const SPORT_OPTIONS: { value: SportType; label: string; emoji: string }[] = [
  { value: 'RUNNING', label: 'Corsa', emoji: '🏃' },
  { value: 'CYCLING', label: 'Ciclismo', emoji: '🚴' },
  { value: 'SWIMMING', label: 'Nuoto', emoji: '🏊' },
  { value: 'STRENGTH', label: 'Forza / Palestra', emoji: '🏋️' },
  { value: 'HIIT', label: 'HIIT / Circuit', emoji: '⚡' },
  { value: 'YOGA', label: 'Yoga / Pilates', emoji: '🧘' },
  { value: 'WALKING', label: 'Camminata / Hiking', emoji: '🚶' },
  { value: 'ROWING', label: 'Canottaggio', emoji: '🚣' },
  { value: 'SKIING', label: 'Sci / Snow', emoji: '⛷️' },
  { value: 'OTHER', label: 'Altro', emoji: '🎯' },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AddActivitySheet({ defaultDate, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'method' | 'manual' | 'import' | 'processing' | 'done'>('method')
  const [importMode, setImportMode] = useState<'json' | 'image' | null>(null)

  // Form fields
  const [date, setDate] = useState(defaultDate)
  const [title, setTitle] = useState('')
  const [sportType, setSportType] = useState<SportType | null>(null)
  const [customType, setCustomType] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [heartRateAvg, setHeartRateAvg] = useState('')
  const [heartRateMax, setHeartRateMax] = useState('')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')

  // Import
  const [jsonText, setJsonText] = useState('')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<Partial<AddManualActivityInput> | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleImageFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      setImageBase64(result)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleJsonFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setJsonText(e.target?.result as string ?? '')
    }
    reader.readAsText(file)
  }, [])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.type.startsWith('image/')) handleImageFile(file)
    else handleJsonFile(file)
  }, [handleImageFile, handleJsonFile])

  const prefillFromParsed = (parsed: Partial<AddManualActivityInput>) => {
    if (parsed.title) setTitle(parsed.title)
    if (parsed.sportType) setSportType(parsed.sportType)
    if (parsed.durationMin) setDurationMin(String(parsed.durationMin))
    if (parsed.distanceKm) setDistanceKm(String(parsed.distanceKm))
    if (parsed.heartRateAvg) setHeartRateAvg(String(parsed.heartRateAvg))
    if (parsed.heartRateMax) setHeartRateMax(String(parsed.heartRateMax))
    if (parsed.calories) setCalories(String(parsed.calories))
    setParsedData(parsed)
  }

  const handleSubmit = async () => {
    if (!title && !jsonText && !imageBase64) {
      setError('Inserisci almeno un titolo o carica un file')
      return
    }

    setSubmitting(true)
    setError(null)
    setStep('processing')

    try {
      const input: AddManualActivityInput = {
        date,
        title: title || 'Attività importata',
        sportType: sportType ?? null,
        customType: customType || undefined,
        durationMin: durationMin ? parseInt(durationMin) : undefined,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        heartRateAvg: heartRateAvg ? parseInt(heartRateAvg) : undefined,
        heartRateMax: heartRateMax ? parseInt(heartRateMax) : undefined,
        calories: calories ? parseInt(calories) : undefined,
        notes: notes || undefined,
        rawJson: jsonText || undefined,
        imageBase64: imageBase64 || undefined,
        imageTitle: title || undefined,
      }

      const result = await addManualActivity(input)

      if (result.success) {
        setSuccessId(result.id ?? null)
        if (result.parsedData) prefillFromParsed(result.parsedData)
        setStep('done')
      } else {
        setError(result.error ?? 'Errore nel salvataggio')
        setStep(importMode ? 'import' : 'manual')
      }
    } catch {
      setError('Errore imprevisto')
      setStep(importMode ? 'import' : 'manual')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed inset-x-0 bottom-0 z-[60] rounded-t-[2rem] overflow-hidden animate-in slide-in-from-bottom duration-300"
        style={{ background: 'var(--bg-surface, #111)', border: '1px solid var(--border)', maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-0.5">Performance Ecosystem</p>
            <h2 className="text-lg font-black text-primary">
              {step === 'method' && 'Aggiungi Attività'}
              {step === 'manual' && 'Inserimento Manuale'}
              {step === 'import' && (importMode === 'json' ? 'Importa da Orologio' : 'Scansiona Screenshot')}
              {step === 'processing' && 'Elaborazione...'}
              {step === 'done' && 'Salvato!'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl border border-border hover:bg-white/5 text-muted transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92dvh - 110px)' }}>

          {/* ─ STEP: method ─ */}
          {step === 'method' && (
            <div className="px-6 py-6 space-y-4">
              {/* Date picker */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2">Data</label>
                <input
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-base border border-border rounded-2xl px-4 py-3 text-sm text-primary focus:border-accent outline-none"
                />
              </div>

              <p className="text-xs font-black uppercase tracking-widest text-muted">Come vuoi inserire i dati?</p>

              <button
                onClick={() => setStep('manual')}
                className="w-full flex items-center gap-4 p-5 rounded-3xl border border-border hover:border-accent/40 bg-base/50 hover:bg-accent/5 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
                >
                  <Plus className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-black text-primary">Inserimento Manuale</p>
                  <p className="text-xs text-muted mt-0.5">Compila i dati dell'attività a mano</p>
                </div>
              </button>

              <button
                onClick={() => { setImportMode('json'); setStep('import') }}
                className="w-full flex items-center gap-4 p-5 rounded-3xl border border-border hover:border-[#10B981]/40 bg-base/50 hover:bg-[#10B981]/5 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 flex items-center justify-center shrink-0">
                  <FileJson className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <p className="font-black text-primary">Importa JSON Orologio</p>
                  <p className="text-xs text-muted mt-0.5">Suunto, Garmin, Polar — incolla o carica il file JSON</p>
                </div>
              </button>

              <button
                onClick={() => { setImportMode('image'); setStep('import') }}
                className="w-full flex items-center gap-4 p-5 rounded-3xl border border-border hover:border-[#EC4899]/40 bg-base/50 hover:bg-[#EC4899]/5 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/15 flex items-center justify-center shrink-0">
                  <Camera className="w-6 h-6 text-[#EC4899]" />
                </div>
                <div>
                  <p className="font-black text-primary">Screenshot / Foto</p>
                  <p className="text-xs text-muted mt-0.5">Carica screenshot di orologio, bilancia o app fitness</p>
                </div>
              </button>
            </div>
          )}

          {/* ─ STEP: import ─ */}
          {step === 'import' && (
            <div className="px-6 py-6 space-y-5">
              <button onClick={() => setStep('method')} className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition-colors">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Indietro
              </button>

              {importMode === 'json' && (
                <>
                  <p className="text-xs text-muted leading-relaxed">
                    Incolla il JSON esportato dal tuo orologio o app fitness. L'AI estrarrà automaticamente tutti i dati.
                  </p>
                  <div
                    className="relative rounded-3xl border-2 border-dashed border-border p-4 transition-all hover:border-[#10B981]/40"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { handleFileDrop(e) }}
                  >
                    <textarea
                      value={jsonText}
                      onChange={e => setJsonText(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs font-mono text-muted resize-none leading-relaxed"
                      placeholder={'{\n  "activityName": "Morning Run",\n  "sport": "running",\n  "duration": 3600,\n  ...\n}'}
                      rows={8}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => jsonInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border text-xs font-bold text-muted hover:border-[#10B981]/40 hover:text-[#10B981] transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" /> Carica file .json
                    </button>
                    <input
                      ref={jsonInputRef} type="file" accept=".json,application/json" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleJsonFile(f) }}
                    />
                  </div>
                </>
              )}

              {importMode === 'image' && (
                <>
                  <p className="text-xs text-muted leading-relaxed">
                    Carica uno screenshot dell'orologio, della bilancia o di qualsiasi app fitness. L'AI leggerà i dati automaticamente.
                  </p>
                  {imagePreview ? (
                    <div className="relative rounded-3xl overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="preview" className="w-full object-contain max-h-64" />
                      <button
                        onClick={() => { setImagePreview(null); setImageBase64(null) }}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="rounded-3xl border-2 border-dashed border-border p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-[#EC4899]/40 hover:bg-[#EC4899]/5 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault()
                        const file = e.dataTransfer.files[0]
                        if (file?.type.startsWith('image/')) handleImageFile(file)
                      }}
                    >
                      <Image className="w-10 h-10 text-muted/40" />
                      <div className="text-center">
                        <p className="text-sm font-black text-muted">Trascina qui o tocca per caricare</p>
                        <p className="text-xs text-muted/60 mt-1">PNG, JPG, HEIC</p>
                      </div>
                      <input
                        ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Optional manual fields */}
              <details className="group">
                <summary className="flex items-center gap-2 text-xs font-black text-muted cursor-pointer list-none">
                  <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                  Aggiungi dati manuali (opzionale)
                </summary>
                <div className="mt-4 space-y-3">
                  <ManualFields
                    title={title} setTitle={setTitle}
                    sportType={sportType} setSportType={setSportType}
                    customType={customType} setCustomType={setCustomType}
                    durationMin={durationMin} setDurationMin={setDurationMin}
                    distanceKm={distanceKm} setDistanceKm={setDistanceKm}
                    heartRateAvg={heartRateAvg} setHeartRateAvg={setHeartRateAvg}
                    heartRateMax={heartRateMax} setHeartRateMax={setHeartRateMax}
                    calories={calories} setCalories={setCalories}
                    notes={notes} setNotes={setNotes}
                  />
                </div>
              </details>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={(!jsonText && !imageBase64) || submitting}
                className="w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: importMode === 'image' ? '#EC4899' : '#10B981' }}
              >
                {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Elaborazione AI...</span> : 'Importa e Salva'}
              </button>
            </div>
          )}

          {/* ─ STEP: manual ─ */}
          {step === 'manual' && (
            <div className="px-6 py-6 space-y-5">
              <button onClick={() => setStep('method')} className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition-colors">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Indietro
              </button>

              <ManualFields
                title={title} setTitle={setTitle}
                sportType={sportType} setSportType={setSportType}
                customType={customType} setCustomType={setCustomType}
                durationMin={durationMin} setDurationMin={setDurationMin}
                distanceKm={distanceKm} setDistanceKm={setDistanceKm}
                heartRateAvg={heartRateAvg} setHeartRateAvg={setHeartRateAvg}
                heartRateMax={heartRateMax} setHeartRateMax={setHeartRateMax}
                calories={calories} setCalories={setCalories}
                notes={notes} setNotes={setNotes}
              />

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!title || submitting}
                className="w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Salvataggio...</span>
                  : 'Salva Attività'}
              </button>
            </div>
          )}

          {/* ─ STEP: processing ─ */}
          {step === 'processing' && (
            <div className="px-6 py-16 flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
              <div>
                <p className="font-black text-primary text-lg">Elaborazione in corso</p>
                <p className="text-sm text-muted mt-1">
                  {importMode === 'image' ? "L'AI sta leggendo i dati dall'immagine..." : importMode === 'json' ? "Parsing del JSON in corso..." : "Salvataggio..."}
                </p>
              </div>
            </div>
          )}

          {/* ─ STEP: done ─ */}
          {step === 'done' && (
            <div className="px-6 py-12 flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#10B981]" />
              </div>
              <div>
                <p className="font-black text-primary text-xl">Attività Salvata!</p>
                {parsedData?.title && <p className="text-sm font-bold text-accent mt-1">{parsedData.title}</p>}
                <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs text-muted">
                  {parsedData?.durationMin && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{parsedData.durationMin} min</span>}
                  {parsedData?.distanceKm && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{parsedData.distanceKm} km</span>}
                  {parsedData?.heartRateAvg && <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{parsedData.heartRateAvg} bpm</span>}
                  {parsedData?.calories && <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{parsedData.calories} kcal</span>}
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setStep('method')
                    setTitle(''); setSportType(null); setCustomType('')
                    setDurationMin(''); setDistanceKm(''); setHeartRateAvg('')
                    setHeartRateMax(''); setCalories(''); setNotes('')
                    setJsonText(''); setImageBase64(null); setImagePreview(null)
                    setParsedData(null)
                  }}
                  className="flex-1 py-3 rounded-2xl border border-border text-sm font-black text-muted hover:text-primary transition-all"
                >
                  Aggiungi Altra
                </button>
                <button
                  onClick={onSuccess}
                  className="flex-[2] py-3 rounded-2xl text-sm font-black text-white transition-all active:scale-95"
                  style={{ background: 'var(--accent)' }}
                >
                  Fatto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── ManualFields sub-component ────────────────────────────────────────────────

function ManualFields({
  title, setTitle,
  sportType, setSportType,
  customType, setCustomType,
  durationMin, setDurationMin,
  distanceKm, setDistanceKm,
  heartRateAvg, setHeartRateAvg,
  heartRateMax, setHeartRateMax,
  calories, setCalories,
  notes, setNotes
}: {
  title: string; setTitle: (v: string) => void
  sportType: SportType | null; setSportType: (v: SportType | null) => void
  customType: string; setCustomType: (v: string) => void
  durationMin: string; setDurationMin: (v: string) => void
  distanceKm: string; setDistanceKm: (v: string) => void
  heartRateAvg: string; setHeartRateAvg: (v: string) => void
  heartRateMax: string; setHeartRateMax: (v: string) => void
  calories: string; setCalories: (v: string) => void
  notes: string; setNotes: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">
          Titolo *
        </label>
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full bg-base border border-border rounded-2xl px-4 py-3 text-sm text-primary focus:border-accent outline-none"
          placeholder="es. Corsa mattutina, Sessione chest..."
        />
      </div>

      {/* Sport type grid */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2">
          Tipo di Sport
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SPORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSportType(sportType === opt.value ? null : opt.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-bold text-left transition-all
                ${sportType === opt.value
                  ? 'border-accent bg-accent/10 text-primary'
                  : 'border-border bg-base text-muted hover:border-accent/40 hover:text-primary'}`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        {sportType === 'OTHER' && (
          <input
            type="text" value={customType} onChange={e => setCustomType(e.target.value)}
            className="mt-2 w-full bg-base border border-border rounded-2xl px-4 py-3 text-sm text-primary focus:border-accent outline-none"
            placeholder="Descrivi il tipo di attività..."
          />
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Clock, label: 'Durata (min)', value: durationMin, set: setDurationMin, placeholder: '60', type: 'number' },
          { icon: MapPin, label: 'Distanza (km)', value: distanceKm, set: setDistanceKm, placeholder: '10.5', type: 'number' },
          { icon: Heart, label: 'FC Media (bpm)', value: heartRateAvg, set: setHeartRateAvg, placeholder: '145', type: 'number' },
          { icon: Heart, label: 'FC Max (bpm)', value: heartRateMax, set: setHeartRateMax, placeholder: '175', type: 'number' },
          { icon: Flame, label: 'Calorie (kcal)', value: calories, set: setCalories, placeholder: '400', type: 'number' },
        ].map(({ icon: Icon, label, value, set, placeholder, type }) => (
          <div key={label}>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">{label}</label>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <input
                type={type} value={value} onChange={e => set(e.target.value)}
                className="w-full bg-base border border-border rounded-2xl pl-9 pr-3 py-2.5 text-sm text-primary focus:border-accent outline-none"
                placeholder={placeholder}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Note</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full bg-base border border-border rounded-2xl px-4 py-3 text-sm text-primary focus:border-accent outline-none resize-none"
          placeholder="Sensazioni, condizioni meteo, commenti..."
          rows={3}
        />
      </div>
    </div>
  )
}

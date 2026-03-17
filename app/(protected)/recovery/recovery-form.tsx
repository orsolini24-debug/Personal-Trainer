"use client"

import { useState } from "react"
import { saveRecoveryLog, parseWearableText } from "@/app/actions/recovery"
import { useRouter } from "next/navigation"
import { Heart, Moon, Activity, Zap, TrendingUp, ChevronDown, ChevronUp, Loader2, Save, Sparkles, Clipboard } from "lucide-react"

export default function RecoveryForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  // Form states
  const [hrv, setHrv] = useState(initialData?.hrv?.toString() || "")
  const [rhr, setRhr] = useState(initialData?.rhr?.toString() || "")
  const [sleep, setSleep] = useState(initialData?.sleepMin ? (initialData.sleepMin / 60).toString() : "")
  const [sleepScore, setSleepScore] = useState(initialData?.sleepScore?.toString() || "")
  const [score, setScore] = useState(initialData?.recoveryScore?.toString() || "")
  const [ctl, setCtl] = useState(initialData?.ctl?.toString() || "")
  const [atl, setAtl] = useState(initialData?.atl?.toString() || "")
  const [tsb, setTsb] = useState(initialData?.tsb?.toString() || "")
  
  // UI states
  const [pasteText, setPasteText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (hrv) { const v = parseFloat(hrv); if (v < 10 || v > 200) errs.hrv = "10–200 ms" }
    if (rhr) { const v = parseInt(rhr); if (v < 30 || v > 120) errs.rhr = "30–120 bpm" }
    if (sleep) { const mins = parseFloat(sleep) * 60; if (mins < 0 || mins > 720) errs.sleep = "0–12 ore" }
    if (score) { const v = parseInt(score); if (v < 0 || v > 100) errs.score = "0–100" }
    if (sleepScore) { const v = parseInt(sleepScore); if (v < 0 || v > 100) errs.sleepScore = "0–100" }
    return errs
  }

  const handleParseAI = async () => {
    if (!pasteText.trim()) return
    setParsing(true)
    const result = await parseWearableText(pasteText)
    setParsing(false)

    if (result.success && result.data) {
      const d = result.data
      if (d.hrv) setHrv(d.hrv.toString())
      if (d.rhr) setRhr(d.rhr.toString())
      if (d.sleepMin) setSleep((d.sleepMin / 60).toFixed(1))
      if (d.sleepScore) setSleepScore(d.sleepScore.toString())
      if (d.recoveryScore) setScore(d.recoveryScore.toString())
      if (d.ctl) setCtl(d.ctl.toString())
      if (d.atl) setAtl(d.atl.toString())
      if (d.tsb) setTsb(d.tsb.toString())
      
      setActiveTab("manual")
      // Opzionalmente scrolla al form o mostra un feedback
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    await saveRecoveryLog({
      date: new Date(date),
      hrv: hrv ? parseFloat(hrv) : undefined,
      rhr: rhr ? parseInt(rhr) : undefined,
      sleepMin: sleep ? parseFloat(sleep) * 60 : undefined,
      sleepScore: sleepScore ? parseInt(sleepScore) : undefined,
      recoveryScore: score ? parseInt(score) : undefined,
      ctl: ctl ? parseFloat(ctl) : undefined,
      atl: atl ? parseFloat(atl) : undefined,
      tsb: tsb ? parseFloat(tsb) : undefined,
    })
    setLoading(false)
    setDate(new Date().toISOString().split('T')[0])
    setHrv(""); setRhr(""); setSleep(""); setSleepScore(""); setScore(""); setCtl(""); setAtl(""); setTsb("")
    setPasteText("")
    router.refresh()
  }

  // Status light
  const scoreVal = score ? parseInt(score) : null
  const tsbVal = tsb ? parseFloat(tsb) : null
  const statusColor = (scoreVal !== null && tsbVal !== null)
    ? (scoreVal >= 70 && tsbVal > -10 ? 'var(--positive)' : (scoreVal < 40 || tsbVal < -30 ? 'var(--negative)' : 'var(--warning)'))
    : scoreVal !== null
    ? (scoreVal >= 70 ? 'var(--positive)' : scoreVal < 40 ? 'var(--negative)' : 'var(--warning)')
    : 'var(--border-default)'

  const statusLabel = (scoreVal !== null)
    ? (scoreVal >= 70 ? 'Ottimo' : scoreVal < 40 ? 'Critico' : 'Moderato')
    : 'In attesa'

  const inputStyle = (hasError?: boolean) => ({
    background: 'var(--bg-base)',
    border: `1px solid ${hasError ? 'var(--negative)' : 'var(--border-default)'}`,
    color: 'var(--fg-primary)',
    borderRadius: '0.875rem',
    padding: '0.75rem 1rem',
    width: '100%',
    fontSize: '1rem',
    fontWeight: '700',
    outline: 'none',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg" style={{ color: 'var(--fg-primary)' }}>Monitoraggio Recupero</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `color-mix(in srgb, ${statusColor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${statusColor} 30%, transparent)` }}>
          <div className="w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span className="text-xs font-black" style={{ color: statusColor }}>{statusLabel}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
        <button
          onClick={() => setActiveTab("manual")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all"
          style={{
            background: activeTab === "manual" ? 'var(--bg-card)' : 'transparent',
            color: activeTab === "manual" ? 'var(--fg-primary)' : 'var(--fg-muted)',
            boxShadow: activeTab === "manual" ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Clipboard className="w-3.5 h-3.5" /> MANUALE
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all"
          style={{
            background: activeTab === "ai" ? 'var(--bg-card)' : 'transparent',
            color: activeTab === "ai" ? 'var(--fg-primary)' : 'var(--fg-muted)',
            boxShadow: activeTab === "ai" ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: activeTab === "ai" ? 'var(--accent)' : 'inherit' }} /> INCOLLA DA APP
        </button>
      </div>

      {activeTab === "ai" ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
              Incolla il testo copiato dall'app (Suunto, Garmin, Apple, ecc.)
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Esempio: Recovery 75%, HRV 55ms, 7h 20m sonno..."
              className="w-full min-h-[160px] p-4 text-sm font-medium rounded-2xl outline-none transition-all"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
                color: 'var(--fg-primary)',
                resize: 'none'
              }}
            />
            <p className="text-[10px]" style={{ color: 'var(--fg-subtle)' }}>
              L'AI estrarrà automaticamente i valori numerici e popolerà i campi sottostanti.
            </p>
          </div>
          <button
            onClick={handleParseAI}
            disabled={parsing || !pasteText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
            style={{
              background: 'var(--accent)',
              color: 'white',
              boxShadow: parsing ? 'none' : '0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)',
            }}
          >
            {parsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Estrazione dati...</> : <><Sparkles className="w-4 h-4" /> Analizza Testo</>}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Date */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
              Data del rilievo
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle()} required />
          </div>

          {/* Main metrics - In evidenza */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                <Zap className="w-3.5 h-3.5" style={{ color: 'var(--positive)' }} /> Recovery Score (0–100)
              </label>
              <input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)}
                placeholder="—" style={{ ...inputStyle(!!errors.score), fontSize: '1.25rem', padding: '1rem' }} />
              {errors.score && <p className="text-[10px] mt-1" style={{ color: 'var(--negative)' }}>{errors.score}</p>}
              <p className="text-[9px] mt-1 opacity-60 ml-1">Valore combinato fornito dal tuo ecosistema</p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                <Heart className="w-3 h-3" style={{ color: 'var(--accent2)' }} /> HRV (ms)
              </label>
              <input type="number" step="0.1" min="10" max="200" value={hrv} onChange={e => setHrv(e.target.value)}
                placeholder="—" style={inputStyle(!!errors.hrv)} />
              {errors.hrv && <p className="text-[10px] mt-1" style={{ color: 'var(--negative)' }}>{errors.hrv}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                <Moon className="w-3 h-3" style={{ color: 'var(--warning)' }} /> Sonno (ore)
              </label>
              <input type="number" step="0.1" min="0" max="12" value={sleep} onChange={e => setSleep(e.target.value)}
                placeholder="—" style={inputStyle(!!errors.sleep)} />
              {errors.sleep && <p className="text-[10px] mt-1" style={{ color: 'var(--negative)' }}>{errors.sleep}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                <Activity className="w-3 h-3" style={{ color: 'var(--accent)' }} /> RHR (bpm)
              </label>
              <input type="number" min="30" max="120" value={rhr} onChange={e => setRhr(e.target.value)}
                placeholder="—" style={inputStyle(!!errors.rhr)} />
              {errors.rhr && <p className="text-[10px] mt-1" style={{ color: 'var(--negative)' }}>{errors.rhr}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                <Zap className="w-3 h-3" style={{ color: 'var(--warning)' }} /> Sleep Score
              </label>
              <input type="number" min="0" max="100" value={sleepScore} onChange={e => setSleepScore(e.target.value)}
                placeholder="—" style={inputStyle(!!errors.sleepScore)} />
              {errors.sleepScore && <p className="text-[10px] mt-1" style={{ color: 'var(--negative)' }}>{errors.sleepScore}</p>}
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all mt-2"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Carico Allenamento (Training Load)</span>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-200">
              {[
                { label: 'CTL', desc: 'Fitness', val: ctl, set: setCtl },
                { label: 'ATL', desc: 'Fatica', val: atl, set: setAtl },
                { label: 'TSB', desc: 'Forma', val: tsb, set: setTsb },
              ].map(({ label, desc, val, set }) => (
                <div key={label}>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                    {label} <span className="hidden sm:inline normal-case font-medium tracking-normal opacity-60">{desc}</span>
                  </label>
                  <input type="number" step="0.1" value={val} onChange={e => set(e.target.value)}
                    placeholder="—" style={inputStyle()} />
                </div>
              ))}
              <p className="col-span-3 text-[9px] italic opacity-60">Dati avanzati (TrainingPeaks, Suunto, intervals.icu)</p>
            </div>
          )}

          <div className="p-4 rounded-2xl space-y-2" style={{ background: 'color-mix(in srgb, var(--accent) 5%, transparent)', border: '1px dashed color-mix(in srgb, var(--accent) 20%, transparent)' }}>
            <p className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>💡 Suggerimento</p>
            <p className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>
              Trovi questi dati nella schermata <b>Recovery</b> o <b>Training Load</b> della tua app (Suunto, Garmin, Apple Health).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
            style={{
              background: 'var(--positive)',
              color: 'white',
              boxShadow: loading ? 'none' : '0 4px 16px color-mix(in srgb, var(--positive) 30%, transparent)',
            }}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvataggio...</> : <><Save className="w-4 h-4" /> Conferma e Salva</>}
          </button>
        </form>
      )}
    </div>
  )
}

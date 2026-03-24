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
      <div className="flex p-1.5 rounded-full bg-base border border-border shadow-inner max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-500 ${
            activeTab === "manual" 
              ? 'bg-accent text-white shadow-lg shadow-accent/25' 
              : 'text-muted hover:text-primary'
          }`}
        >
          <Clipboard className="w-3.5 h-3.5" /> MANUALE
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-500 ${
            activeTab === "ai" 
              ? 'bg-accent text-white shadow-lg shadow-accent/25' 
              : 'text-muted hover:text-primary'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI PARSER
        </button>
      </div>

      {activeTab === "ai" ? (
        <div className="space-y-4 animate-page">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--fg-muted)' }}>
              Incolla il testo copiato dall'app
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Esempio: Recovery 75%, HRV 55ms, 7h 20m sonno..."
              className="w-full min-h-[160px] p-4 text-sm font-medium rounded-3xl outline-none transition-all glass-heavy"
              style={{
                border: '1px solid var(--border-default)',
                color: 'var(--fg-primary)',
                resize: 'none'
              }}
            />
          </div>
          <button
            onClick={handleParseAI}
            disabled={parsing || !pasteText.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm disabled:opacity-50"
          >
            {parsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Estrazione...</> : <><Sparkles className="w-4 h-4" /> Analizza Testo</>}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 animate-page">
          {/* Recovery Score Circular Ring */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="var(--border-subtle)" strokeWidth="8" fill="transparent" />
                <circle cx="50" cy="50" r="42" stroke={statusColor} strokeWidth="8" fill="transparent"
                  strokeDasharray="264" strokeDashoffset={264 - ((scoreVal || 0) / 100) * 264} 
                  strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                  style={{ filter: `drop-shadow(0 0 8px ${statusColor})` }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <input 
                  type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)}
                  className="w-24 text-center text-5xl font-black text-primary bg-transparent outline-none num"
                  placeholder="--"
                />
                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-1">Recovery %</span>
              </div>
            </div>
            
            <div className="mt-4 px-4 py-1.5 rounded-full border border-border-subtle glass-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor }} />
              <span style={{ color: statusColor }}>Stato: {statusLabel}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/30" />
              <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Metriche Core</span>
              <div className="h-px flex-1 bg-border/30" />
            </div>

            {/* Date */}
            <div className="bg-base/40 p-1 rounded-2xl border border-border-subtle flex items-center">
              <div className="px-4 py-2 text-[10px] font-black text-muted uppercase tracking-widest shrink-0">Giorno</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} 
                className="bg-transparent text-sm font-bold text-primary w-full outline-none p-2" required />
            </div>

            {/* 2x2 Grid for Core Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="surface-accent p-4 rounded-3xl border border-border-subtle relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-accent2" />
                </div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">HRV (ms)</label>
                <input type="number" step="0.1" min="10" max="200" value={hrv} onChange={e => setHrv(e.target.value)}
                  placeholder="--" className="w-full bg-transparent text-3xl font-black text-primary outline-none num" />
                {errors.hrv && <p className="text-[10px] text-negative mt-1">{errors.hrv}</p>}
              </div>

              <div className="surface-accent p-4 rounded-3xl border border-border-subtle relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                  <Moon className="w-8 h-8 text-warning" />
                </div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Sonno (h)</label>
                <input type="number" step="0.1" min="0" max="12" value={sleep} onChange={e => setSleep(e.target.value)}
                  placeholder="--" className="w-full bg-transparent text-3xl font-black text-primary outline-none num" />
                {errors.sleep && <p className="text-[10px] text-negative mt-1">{errors.sleep}</p>}
              </div>

              <div className="surface-accent p-4 rounded-3xl border border-border-subtle relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                  <Activity className="w-8 h-8 text-accent" />
                </div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">RHR (bpm)</label>
                <input type="number" min="30" max="120" value={rhr} onChange={e => setRhr(e.target.value)}
                  placeholder="--" className="w-full bg-transparent text-3xl font-black text-primary outline-none num" />
                {errors.rhr && <p className="text-[10px] text-negative mt-1">{errors.rhr}</p>}
              </div>

              <div className="surface-accent p-4 rounded-3xl border border-border-subtle relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-warning" />
                </div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Sleep Score</label>
                <input type="number" min="0" max="100" value={sleepScore} onChange={e => setSleepScore(e.target.value)}
                  placeholder="--" className="w-full bg-transparent text-3xl font-black text-primary outline-none num" />
                {errors.sleepScore && <p className="text-[10px] text-negative mt-1">{errors.sleepScore}</p>}
              </div>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-3xl transition-all glass hover:bg-elevated/40"
            style={{ border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest">Training Load & Form</span>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500 stagger">
              {[
                { label: 'CTL', desc: 'Fitness', val: ctl, set: setCtl },
                { label: 'ATL', desc: 'Fatica', val: atl, set: setAtl },
                { label: 'TSB', desc: 'Forma', val: tsb, set: setTsb },
              ].map(({ label, desc, val, set }) => (
                <div key={label} className="bg-base p-4 rounded-3xl border border-border-subtle">
                  <label className="block text-[10px] font-black text-muted uppercase tracking-tighter mb-1.5">{label}</label>
                  <input type="number" step="0.1" value={val} onChange={e => set(e.target.value)}
                    placeholder="—" className="w-full bg-transparent text-xl font-bold text-primary outline-none num" />
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 py-4 rounded-3xl text-sm disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvataggio...</> : <><Save className="w-5 h-5" /> Registra Performance</>}
          </button>
        </form>
      )}
    </div>
  )
}

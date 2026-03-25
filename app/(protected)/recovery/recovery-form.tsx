"use client"

import { useState } from "react"
import { saveRecoveryLog, parseWearableText } from "@/app/actions/recovery"
import { useRouter } from "next/navigation"
import { Heart, Moon, Activity, Zap, TrendingUp, ChevronDown, ChevronUp, Loader2, Save, Sparkles, Clipboard } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

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

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Status */}
      <div className="bg-surface/50 backdrop-blur-md p-6 rounded-[32px] border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight">Recupero & Biofeedback</h2>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Giorno: {format(new Date(date), "EEEE, dd MMMM", { locale: it })}</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-4 py-2 bg-base/50 rounded-2xl border border-border-subtle flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: statusColor, boxShadow: `0 0 12px ${statusColor}` }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: statusColor }}>{statusLabel}</span>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} 
            className="bg-base border border-border-subtle rounded-2xl p-2 text-xs font-bold text-primary outline-none shadow-inner" />
        </div>
      </div>

      {/* Tabs / Switcher */}
      <div className="flex p-1.5 rounded-full bg-base border border-border shadow-inner max-w-xs mx-auto mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-500 ${
            activeTab === "manual" 
              ? 'bg-accent text-white shadow-lg shadow-accent/25' 
              : 'text-muted hover:text-primary'
          }`}
        >
          MANUALE
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-500 ${
            activeTab === "ai" 
              ? 'bg-accent text-white shadow-lg shadow-accent/25' 
              : 'text-muted hover:text-primary'
          }`}
        >
          AI PARSER
        </button>
      </div>

      {activeTab === "ai" ? (
        <div className="space-y-4 animate-page">
          <div className="bg-surface p-6 rounded-[32px] border border-border shadow-lg space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <p className="text-sm font-bold text-primary">Incolla i dati dal tuo wearable</p>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Esempio: Recovery 75%, HRV 55ms, 7h 20m sonno..."
              className="w-full min-h-[160px] p-5 text-sm font-medium rounded-2xl outline-none transition-all bg-base border border-border focus:border-accent/40"
              style={{ resize: 'none' }}
            />
            <button
              onClick={handleParseAI}
              disabled={parsing || !pasteText.trim()}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm disabled:opacity-50"
            >
              {parsing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analisi in corso...</> : <><Sparkles className="w-5 h-5" /> Estrai Dati con AI</>}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-page">
          {/* 4 Main Fields - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Recovery Score Card with Ring */}
            <div className="surface-accent p-6 rounded-[40px] border border-border-subtle shadow-xl flex flex-col items-center justify-center relative overflow-hidden group col-span-2 sm:col-span-1">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Zap className="w-16 h-16 text-warning" />
              </div>
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4 z-10">Recovery Score</label>
              <div className="relative w-32 h-32 flex items-center justify-center z-10">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" stroke="var(--border-subtle)" strokeWidth="6" fill="transparent" />
                  <circle cx="50" cy="50" r="44" stroke={statusColor} strokeWidth="6" fill="transparent"
                    strokeDasharray="276" strokeDashoffset={276 - ((scoreVal || 0) / 100) * 276} 
                    strokeLinecap="round" className="transition-all duration-700 ease-out" 
                    style={{ filter: `drop-shadow(0 0 10px ${statusColor})` }}
                  />
                </svg>
                <input 
                  type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)}
                  className="absolute w-20 text-center text-4xl font-black text-primary bg-transparent outline-none num"
                  placeholder="--"
                />
              </div>
            </div>

            {/* HRV Card */}
            <div className="bg-surface p-6 rounded-[40px] border border-border-subtle shadow-lg flex flex-col items-center justify-center relative group">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-accent2/10 text-accent2 opacity-40 group-hover:opacity-100 transition-opacity">
                <Heart className="w-5 h-5" />
              </div>
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">HRV (ms)</label>
              <input type="number" step="0.1" value={hrv} onChange={e => setHrv(e.target.value)}
                placeholder="--" className="w-full text-center text-4xl font-black text-primary bg-transparent outline-none num" />
              {errors.hrv && <p className="text-[10px] text-negative font-bold mt-1">{errors.hrv}</p>}
            </div>

            {/* RHR Card */}
            <div className="bg-surface p-6 rounded-[40px] border border-border-subtle shadow-lg flex flex-col items-center justify-center relative group">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-accent/10 text-accent opacity-40 group-hover:opacity-100 transition-opacity">
                <Activity className="w-5 h-5" />
              </div>
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">RHR (bpm)</label>
              <input type="number" value={rhr} onChange={e => setRhr(e.target.value)}
                placeholder="--" className="w-full text-center text-4xl font-black text-primary bg-transparent outline-none num" />
              {errors.rhr && <p className="text-[10px] text-negative font-bold mt-1">{errors.rhr}</p>}
            </div>

            {/* Sleep Card */}
            <div className="bg-surface p-6 rounded-[40px] border border-border-subtle shadow-lg flex flex-col items-center justify-center relative group">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-warning/10 text-warning opacity-40 group-hover:opacity-100 transition-opacity">
                <Moon className="w-5 h-5" />
              </div>
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">Sonno (h)</label>
              <input type="number" step="0.1" value={sleep} onChange={e => setSleep(e.target.value)}
                placeholder="--" className="w-full text-center text-4xl font-black text-primary bg-transparent outline-none num" />
              {errors.sleep && <p className="text-[10px] text-negative font-bold mt-1">{errors.sleep}</p>}
            </div>
          </div>

          {/* Training Load Section - Accordion */}
          <div className="bg-surface/30 rounded-[32px] border border-border-subtle overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-6 transition-all hover:bg-elevated/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent2/10 text-accent2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-primary">Carico & Forma (CTL/ATL)</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            </button>

            {showAdvanced && (
              <div className="px-6 pb-6 grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                {[
                  { label: 'CTL', val: ctl, set: setCtl, color: 'text-accent2' },
                  { label: 'ATL', val: atl, set: setAtl, color: 'text-warning' },
                  { label: 'TSB', val: tsb, set: setTsb, color: 'text-positive' },
                ].map(({ label, val, set, color }) => (
                  <div key={label} className="bg-base/60 p-4 rounded-3xl border border-border-subtle shadow-inner">
                    <label className="block text-[9px] font-black text-muted uppercase tracking-tighter mb-1.5">{label}</label>
                    <input type="number" step="0.1" value={val} onChange={e => set(e.target.value)}
                      placeholder="--" className={`w-full bg-transparent text-xl font-black outline-none num ${color}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-4 py-5 rounded-[28px] text-base font-black shadow-[0_10px_30px_rgba(var(--accent-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ boxShadow: '0 0 20px var(--glow-accent)' }}
          >
            {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Salvataggio...</> : <><Save className="w-6 h-6" /> Registra Dati Recupero</>}
          </button>
        </form>
      )}
    </div>
  )
}

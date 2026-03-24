import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBiometricHistory } from "@/app/actions/body"
import { autoSkipPastPendingSessions } from "@/app/actions/session-flex"
import BodyForm from "./body-form"
import BodyChart from "./body-chart"
import BodyHistory from "./body-history"
import PhotoUpload from "./photo-upload"
import { Camera, Activity, Scale, Percent, TrendingDown } from "lucide-react"

export default async function BodyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Auto-skip sessioni pianificate dei giorni passati non avviate
  await autoSkipPastPendingSessions()

  const res = await getBiometricHistory(30)
  const history = res.data || []

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayLog = history.find(l => new Date(l.date).getTime() === today.getTime())

  const latest = history[0]
  const weekAgo = history.find(l => {
    const d = new Date(l.date)
    const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 6 && diff <= 8
  })

  const weightDelta = latest?.weightKg && weekAgo?.weightKg
    ? latest.weightKg - weekAgo.weightKg
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-page">
      <div className="stagger">
        <p className="divider-label mb-2">Composizione Corporea</p>
        <h1 className="text-4xl font-black tracking-tighter text-accent-gradient">Body Metrics</h1>
      </div>

      {/* ── Banner "pesa oggi" se non ancora loggato ── */}
      {!todayLog && (
        <div
          className="flex items-center gap-5 p-5 rounded-[2rem] glass-sm animate-glow-breathe"
          style={{ border: "1px solid var(--accent)" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 btn-primary glow-accent">
            <Scale className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-base font-black tracking-tight" style={{ color: "var(--fg-primary)" }}>Peso di oggi non registrato</p>
            <p className="text-sm opacity-60" style={{ color: "var(--fg-muted)" }}>Inserisci i tuoi dati per mantenere il trend accurato</p>
          </div>
          <button className="btn-ghost px-4 py-2 text-[10px] font-black uppercase tracking-widest hidden sm:block">Log veloci</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
        {[
          { icon: Scale, label: "Peso", value: latest?.weightKg ? latest.weightKg : "—", unit: "kg", color: "var(--accent)" },
          { icon: Percent, label: "Grasso", value: latest?.fatPct ? latest.fatPct : "—", unit: "%", color: "var(--warning)" },
          { icon: Activity, label: "Vita", value: latest?.waistCm ? latest.waistCm : "—", unit: "cm", color: "var(--accent2)" },
          { icon: TrendingDown, label: "Logs", value: history.length, unit: "entry", color: "var(--positive)" },
        ].map(({ icon: Icon, label, value, unit, color }, i) => (
          <div key={label} className="p-6 rounded-[2.5rem] flex flex-col gap-4 card-interactive surface-accent group" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: "color-mix(in srgb, " + color + " 15%, transparent)", color, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50" style={{ color: "var(--fg-muted)" }}>{label}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black num tracking-tighter" style={{ color: "var(--fg-primary)" }}>{value}</p>
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">{unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 stagger">
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          <section className="rounded-[3rem] p-8 card-elevated mesh-bg" style={{ border: "1px solid var(--border-default)" }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-black text-xl tracking-tight" style={{ color: "var(--fg-primary)" }}>Trend Peso <span className="text-xs opacity-40 ml-2 font-bold uppercase tracking-widest">30 Giorni</span></h2>
              <div className="badge badge-accent">Analisi AI Attiva</div>
            </div>
            <BodyChart history={history} />
          </section>
          
          <section className="rounded-[3rem] p-8 card-elevated" style={{ border: "1px solid var(--border-default)" }}>
            <h2 className="font-black text-xl mb-6 tracking-tight" style={{ color: "var(--fg-primary)" }}>Storico Recente</h2>
            <BodyHistory history={history.slice(0, 10)} />
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
          <section className="rounded-[3rem] p-8 surface-accent" style={{ border: "1px solid var(--border-default)" }}>
            <BodyForm initialData={todayLog} />
          </section>
          
          <section className="rounded-[3rem] p-8 card-elevated mesh-bg" style={{ border: "1px solid var(--border-default)" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center btn-primary" style={{ background: "color-mix(in srgb, var(--accent2) 15%, transparent)", color: "var(--accent2)" }}>
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-lg tracking-tight" style={{ color: "var(--fg-primary)" }}>Foto Progresso</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Frontale · Laterale</p>
              </div>
            </div>
            <PhotoUpload />
          </section>
        </div>
      </div>
    </div>
  )
}

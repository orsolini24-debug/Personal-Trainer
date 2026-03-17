import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBiometricHistory } from "@/app/actions/body"
import BodyForm from "./body-form"
import BodyChart from "./body-chart"
import BodyHistory from "./body-history"
import PhotoUpload from "./photo-upload"
import { Camera, Activity, Scale, Percent, TrendingDown } from "lucide-react"

export default async function BodyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

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
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] mb-1" style={{ color: "var(--warning)" }}>Composizione Corporea</p>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--fg-primary)" }}>Body Metrics</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Scale, label: "Peso", value: latest?.weightKg ? latest.weightKg + " kg" : "—", color: "var(--accent)" },
          { icon: Percent, label: "Grasso", value: latest?.fatPct ? latest.fatPct + "%" : "—", color: "var(--warning)" },
          { icon: Activity, label: "Vita", value: latest?.waistCm ? latest.waistCm + " cm" : "—", color: "var(--accent2)" },
          { icon: TrendingDown, label: "Logs", value: history.length, color: "var(--positive)" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-5 rounded-[2rem] flex flex-col gap-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, " + color + " 12%, transparent)", color }}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
              <p className="text-2xl font-black" style={{ color: "var(--fg-primary)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <section className="rounded-[2.5rem] p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <h2 className="font-black text-lg mb-5" style={{ color: "var(--fg-primary)" }}>Trend Peso (30 giorni)</h2>
            <BodyChart history={history} />
          </section>
          <section className="rounded-[2.5rem] p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <h2 className="font-black text-lg mb-5" style={{ color: "var(--fg-primary)" }}>Storico Recente</h2>
            <BodyHistory history={history.slice(0, 10)} />
          </section>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <section className="rounded-[2.5rem] p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <BodyForm initialData={todayLog} />
          </section>
          <section className="rounded-[2.5rem] p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent2) 12%, transparent)", color: "var(--accent2)" }}>
                <Camera className="w-4 h-4" />
              </div>
              <h2 className="font-black text-base" style={{ color: "var(--fg-primary)" }}>Foto Progresso</h2>
            </div>
            <PhotoUpload />
          </section>
        </div>
      </div>
    </div>
  )
}

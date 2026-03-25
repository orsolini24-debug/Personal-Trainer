import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBiometricHistory } from "@/app/actions/body"
import { autoSkipPastPendingSessions } from "@/app/actions/session-flex"
import BodyForm from "./body-form"
import BodyChart from "./body-chart"
import BodyHistory from "./body-history"
import PhotoUpload from "./photo-upload"
import { Camera, Scale, TrendingDown, TrendingUp, Minus, Plus } from "lucide-react"

export default async function BodyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await autoSkipPastPendingSessions()

  const res = await getBiometricHistory(60)
  const history = res.data || []

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayLog = history.find(l => new Date(l.date).getTime() === today.getTime())

  const latest = history[0]
  const weekAgo = history.find(l => {
    const diff = (today.getTime() - new Date(l.date).getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 5 && diff <= 9
  })
  const monthAgo = history.find(l => {
    const diff = (today.getTime() - new Date(l.date).getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 25 && diff <= 35
  })

  const weightValues = history.filter(l => l.weightKg != null).map(l => l.weightKg!)
  const maxWeight = weightValues.length ? Math.max(...weightValues) : null
  const minWeight = weightValues.length ? Math.min(...weightValues) : null
  const weekDelta = latest?.weightKg && weekAgo?.weightKg
    ? Math.round((latest.weightKg - weekAgo.weightKg) * 10) / 10
    : null
  const monthDelta = latest?.weightKg && monthAgo?.weightKg
    ? Math.round((latest.weightKg - monthAgo.weightKg) * 10) / 10
    : null

  const DeltaIcon = weekDelta == null ? Minus : weekDelta < 0 ? TrendingDown : TrendingUp
  const deltaColor = weekDelta == null ? 'var(--fg-muted)' : weekDelta <= 0 ? 'var(--positive)' : 'var(--warning)'

  return (
    <div className="max-w-2xl mx-auto pb-24">

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: 'var(--accent)' }}>
          Composizione
        </p>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>
          Body Metrics
        </h1>
      </div>

      {/* ── Log banner ── */}
      {!todayLog && (
        <div className="mx-4 mb-5 flex items-center gap-4 px-4 py-4 rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-surface))',
            border: '1.5px solid color-mix(in srgb, var(--accent) 25%, transparent)',
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black" style={{ color: 'var(--fg-primary)' }}>Peso oggi non registrato</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>Registra per mantenere il trend accurato</p>
          </div>
        </div>
      )}

      {/* ── Current + Stats row ── */}
      <div className="px-4 mb-5">
        {/* Big current weight */}
        <div className="rounded-2xl px-5 py-5 mb-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--fg-muted)' }}>
            Peso attuale
          </p>
          <div className="flex items-end gap-4 justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: 'var(--fg-primary)' }}>
                {latest?.weightKg ?? '—'}
              </span>
              <span className="text-lg font-bold" style={{ color: 'var(--fg-muted)' }}>kg</span>
            </div>
            {weekDelta != null && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: `color-mix(in srgb, ${deltaColor} 12%, var(--bg-elevated))`, border: `1px solid color-mix(in srgb, ${deltaColor} 25%, transparent)` }}>
                <DeltaIcon className="w-4 h-4" style={{ color: deltaColor }} />
                <span className="text-sm font-black tabular-nums" style={{ color: deltaColor }}>
                  {weekDelta > 0 ? '+' : ''}{weekDelta} kg
                </span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--fg-muted)' }}>7g</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row: Ultimo · Più alto · Più basso */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Settimana', value: weekAgo?.weightKg, delta: weekDelta },
            { label: 'Più alto', value: maxWeight, delta: null },
            { label: 'Più basso', value: minWeight, delta: null },
          ].map(({ label, value, delta }) => (
            <div key={label} className="rounded-xl px-3 py-3 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--fg-muted)' }}>
                {label}
              </p>
              <p className="text-lg font-black tabular-nums" style={{ color: 'var(--fg-primary)' }}>
                {value ?? '—'}
              </p>
              {value && <p className="text-[9px]" style={{ color: 'var(--fg-subtle)' }}>kg</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="mx-4 mb-5 rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <p className="text-sm font-black" style={{ color: 'var(--fg-primary)' }}>Trend Peso</p>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
            60 giorni
          </span>
        </div>
        <div className="px-4 pb-4">
          <BodyChart history={history} />
        </div>
      </div>

      {/* ── Monthly delta chip ── */}
      {monthDelta != null && (
        <div className="mx-4 mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: monthDelta <= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(251,146,60,0.12)' }}>
            {monthDelta <= 0
              ? <TrendingDown className="w-4 h-4" style={{ color: 'var(--positive)' }} />
              : <TrendingUp className="w-4 h-4" style={{ color: 'var(--warning)' }} />
            }
          </div>
          <div>
            <p className="text-xs font-black" style={{ color: 'var(--fg-primary)' }}>
              {monthDelta <= 0 ? `${Math.abs(monthDelta)} kg persi` : `${monthDelta} kg guadagnati`} nell&apos;ultimo mese
            </p>
            <p className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>
              Da {monthAgo?.weightKg} kg → {latest?.weightKg} kg
            </p>
          </div>
        </div>
      )}

      {/* ── Log form + Photo ── */}
      <div className="px-4 space-y-4">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm font-black" style={{ color: 'var(--fg-primary)' }}>
              {todayLog ? 'Aggiorna misure' : 'Registra oggi'}
            </p>
          </div>
          <div className="px-5 pb-5">
            <BodyForm initialData={todayLog} />
          </div>
        </div>

        {/* Photo upload */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 pt-4 pb-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--accent2) 15%, var(--bg-elevated))', color: 'var(--accent2)' }}>
              <Camera className="w-4 h-4" />
            </div>
            <p className="text-sm font-black" style={{ color: 'var(--fg-primary)' }}>Foto Progresso</p>
          </div>
          <div className="px-5 pb-5">
            <PhotoUpload />
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm font-black" style={{ color: 'var(--fg-primary)' }}>Storico recente</p>
            </div>
            <div className="px-5 pb-4">
              <BodyHistory history={history.slice(0, 10)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

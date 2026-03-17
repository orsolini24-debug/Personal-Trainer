"use client"

import { useState } from "react"
import { addBiometricLog } from "@/app/actions/body"
import { useRouter } from "next/navigation"
import { Scale, Percent, Ruler, Loader2, Save } from "lucide-react"

export default function BodyForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weightKg, setWeightKg] = useState(initialData?.weightKg?.toString() || "")
  const [fatPct, setFatPct] = useState(initialData?.fatPct?.toString() || "")
  const [waistCm, setWaistCm] = useState(initialData?.waistCm?.toString() || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await addBiometricLog({
      date: new Date(date),
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      fatPct: fatPct ? parseFloat(fatPct) : undefined,
      waistCm: waistCm ? parseFloat(waistCm) : undefined,
    })
    setLoading(false)
    router.refresh()
  }

  const inputStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    color: 'var(--fg-primary)',
    borderRadius: '0.875rem',
    padding: '0.75rem 1rem',
    width: '100%',
    fontSize: '1.125rem',
    fontWeight: '700',
    outline: 'none',
  }

  const hasToday = !!initialData

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-black text-lg" style={{ color: 'var(--fg-primary)' }}>
          {hasToday ? 'Aggiorna Misurazione' : 'Log di Oggi'}
        </h2>
        {hasToday && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
            Dati odierni presenti — aggiornamento in corso
          </p>
        )}
      </div>

      {/* Current values if exist */}
      {hasToday && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Peso', value: initialData.weightKg ? `${initialData.weightKg}kg` : '\u2014', color: 'var(--accent)' },
            { label: 'Grasso', value: initialData.fatPct ? `${initialData.fatPct}%` : '\u2014', color: 'var(--warning)' },
            { label: 'Vita', value: initialData.waistCm ? `${initialData.waistCm}cm` : '\u2014', color: 'var(--accent2)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--fg-muted)' }}>{label}</p>
              <p className="text-base font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} required />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
              <Scale className="w-3 h-3" style={{ color: 'var(--accent)' }} /> Peso (kg)
            </label>
            <input type="number" step="0.1" min="20" max="300" value={weightKg} onChange={e => setWeightKg(e.target.value)}
              placeholder="75.5" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                <Percent className="w-3 h-3" style={{ color: 'var(--warning)' }} /> Grasso (%)
              </label>
              <input type="number" step="0.1" min="3" max="60" value={fatPct} onChange={e => setFatPct(e.target.value)}
                placeholder="15.0" style={inputStyle} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                <Ruler className="w-3 h-3" style={{ color: 'var(--accent2)' }} /> Vita (cm)
              </label>
              <input type="number" step="0.5" min="40" max="200" value={waistCm} onChange={e => setWaistCm(e.target.value)}
                placeholder="80" style={inputStyle} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
          style={{
            background: 'var(--accent)',
            color: 'white',
            boxShadow: loading ? 'none' : '0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)',
          }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvataggio...</> : <><Save className="w-4 h-4" /> Salva Misurazione</>}
        </button>
      </form>
    </div>
  )
}

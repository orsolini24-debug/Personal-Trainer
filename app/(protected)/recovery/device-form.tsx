"use client"

import { useState } from "react"
import { saveUserDevice } from "@/app/actions/recovery"
import { Ecosystem } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Watch, Loader2, Save } from "lucide-react"

const ECOSYSTEM_LABELS: Record<string, string> = {
  SUUNTO: 'Suunto',
  GARMIN: 'Garmin',
  POLAR: 'Polar',
  WHOOP: 'WHOOP',
  APPLE: 'Apple Watch',
  FITBIT: 'Fitbit',
  SAMSUNG: 'Samsung',
  OTHER: 'Altro',
}

export default function DeviceForm({ devices }: { devices: any[] }) {
  const router = useRouter()
  const primaryDevice = devices.find(d => d.isPrimary) || devices[0]

  const [ecosystem, setEcosystem] = useState<Ecosystem>(primaryDevice?.ecosystem || Ecosystem.SUUNTO)
  const [deviceModel, setDeviceModel] = useState(primaryDevice?.deviceModel || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await saveUserDevice({ ecosystem, deviceModel, isPrimary: true })
    setLoading(false)
    router.refresh()
  }

  const inputStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    color: 'var(--fg-primary)',
    borderRadius: '0.875rem',
    padding: '0.625rem 0.875rem',
    width: '100%',
    fontSize: '0.875rem',
    fontWeight: '600',
    outline: 'none',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
          <Watch className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-black text-base" style={{ color: 'var(--fg-primary)' }}>Il mio Device</h2>
          {primaryDevice && (
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              {ECOSYSTEM_LABELS[primaryDevice.ecosystem] || primaryDevice.ecosystem}
              {primaryDevice.deviceModel ? ` · ${primaryDevice.deviceModel}` : ''}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
            Ecosistema
          </label>
          <select value={ecosystem} onChange={e => setEcosystem(e.target.value as Ecosystem)} style={inputStyle}>
            {Object.values(Ecosystem).map(eco => (
              <option key={eco} value={eco}>{ECOSYSTEM_LABELS[eco] || eco.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-muted)' }}>
            Modello (opzionale)
          </label>
          <input
            type="text"
            value={deviceModel}
            onChange={e => setDeviceModel(e.target.value)}
            placeholder="es. Suunto Race, Garmin FR265..."
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvataggio...</> : <><Save className="w-3.5 h-3.5" /> Salva Device</>}
        </button>
      </form>
    </div>
  )
}

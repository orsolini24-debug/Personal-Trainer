"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSession } from "@/app/actions/training"
import { SessionType } from "@prisma/client"
import { Plus, X, Dumbbell } from "lucide-react"

const SESSION_LABELS: Record<string, string> = {
  A: 'A — Lower Posteriore',
  B: 'B — Upper Push',
  C: 'C — Upper Pull',
  D: 'D — Lower Anteriore',
  V1: 'V1 — Cardio & Atletica',
  V2: 'V2 — Core & Mobilità',
}

export default function NewSessionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<SessionType>(SessionType.A)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createSession({ date: new Date(date), type })
    setLoading(false)
    if (res.success && res.data) {
      setIsOpen(false)
      router.push(`/training/${res.data.id}`)
    } else {
      alert("Errore: " + res.error)
    }
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    color: 'var(--fg-primary)',
    borderRadius: '0.75rem',
    padding: '0.625rem 0.875rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black transition-all"
        style={{
          background: 'var(--accent)',
          color: 'white',
          boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 35%, transparent)',
        }}
      >
        <Plus className="w-4 h-4" strokeWidth={3} />
        <span className="hidden sm:inline">Nuova Sessione</span>
        <span className="sm:hidden">Nuova</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[2rem] p-6 space-y-5"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: 'var(--fg-primary)' }}>Nuova Sessione</h3>
                  <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Crea sessione manuale</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--fg-muted)' }}>
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--fg-muted)' }}>
                  Tipo Sessione
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as SessionType)}
                  style={inputStyle}
                >
                  {Object.values(SessionType).map((t) => (
                    <option key={t} value={t}>{SESSION_LABELS[t] ?? t}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  boxShadow: loading ? 'none' : '0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)',
                }}
              >
                {loading ? "Creazione in corso..." : "Crea Sessione"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

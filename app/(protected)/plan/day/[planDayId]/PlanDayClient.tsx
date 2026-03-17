'use client'

import { useState } from 'react'
import { skipPlannedSession } from '@/app/actions/session-flex'
import { useRouter } from 'next/navigation'
import { SkipForward, Shuffle, X } from 'lucide-react'
import Link from 'next/link'

type AlternateDay = {
  id: string
  dayLabel: string
  focus: string | null
  planExercises: { name: string }[]
}

interface Props {
  planDayId: string
  alternateDays: AlternateDay[]
  today: string
}

export default function PlanDayClient({ planDayId, alternateDays, today }: Props) {
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [showAltModal, setShowAltModal] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [skipping, setSkipping] = useState(false)
  const router = useRouter()

  const handleSkip = async () => {
    setSkipping(true)
    await skipPlannedSession(planDayId, today, skipReason || 'Saltato manualmente')
    setShowSkipModal(false)
    setSkipping(false)
    router.push('/training')
  }

  return (
    <>
      <button
        onClick={() => setShowAltModal(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all border border-border hover:border-accent/30 text-muted hover:text-primary"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <Shuffle className="w-4 h-4" /> Cambia Sessione
      </button>

      <button
        onClick={() => setShowSkipModal(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all border border-border text-muted hover:text-negative hover:border-negative/30"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <SkipForward className="w-4 h-4" /> Salta
      </button>

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-surface rounded-[2rem] border border-border p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-primary">Salta questa sessione?</h3>
              <button onClick={() => setShowSkipModal(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted">La sessione verrà segnata come saltata nel tuo storico.</p>
            <input
              type="text"
              placeholder="Motivo (opzionale)"
              value={skipReason}
              onChange={e => setSkipReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--fg-primary)' }}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSkipModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted border border-border">
                Annulla
              </button>
              <button
                onClick={handleSkip}
                disabled={skipping}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'var(--negative)' }}
              >
                {skipping ? 'Salvando...' : 'Salta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alternate Days Modal */}
      {showAltModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-surface rounded-[2rem] border border-border p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-primary">Scegli sessione alternativa</h3>
              <button onClick={() => setShowAltModal(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {alternateDays.map(day => (
                <Link
                  key={day.id}
                  href={`/plan/day/${day.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border hover:border-accent/30 transition-all group"
                  style={{ background: 'var(--bg-elevated)' }}
                  onClick={() => setShowAltModal(false)}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    {day.dayLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-primary text-sm truncate">{day.focus ?? `Sessione ${day.dayLabel}`}</p>
                    <p className="text-[10px] text-muted">{day.planExercises.length} esercizi</p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="text-[10px] text-muted text-center">
              Puoi anche andare alla <Link href="/training/library" className="text-accent hover:underline">libreria esercizi</Link> per una sessione libera
            </p>
          </div>
        </div>
      )}
    </>
  )
}

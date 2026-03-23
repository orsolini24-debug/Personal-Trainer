'use client'

import { useState } from 'react'
import { updateGoalProgress } from '@/app/actions/athlete-goals'
import { type AthleteGoal } from '@prisma/client'

interface Props {
  goals: AthleteGoal[]
  isCompact?: boolean
}

export default function KPITracker({ goals, isCompact = false }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>('')

  const handleUpdate = async (id: string) => {
    const value = parseFloat(tempValue)
    if (isNaN(value)) return

    const res = await updateGoalProgress(id, value)
    if (res.success) {
      setEditingId(null)
    }
  }

  if (goals.length === 0) {
    return (
      <div className="p-4 text-sm text-[var(--fg-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl">
        Nessun obiettivo attivo impostato.
      </div>
    )
  }

  return (
    <div className={`grid gap-4 ${isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
      {goals.map((goal) => {
        const current = goal.currentValue || 0
        const target = goal.targetValue || 1
        // Se target < current potrebbe essere un obiettivo di perdita peso o simile.
        // Ma di base facciamo current/target.
        // Se target è 0, mettiamo 0%
        let progress = target !== 0 ? (current / target) * 100 : 0
        
        // Gestione semplice per obiettivi "a calare" (es. peso corporeo)
        // Se non abbiamo un valore iniziale, è difficile calcolare la % reale di progresso.
        // Per ora limitiamo a 100% se raggiunto/superato.
        if (progress > 100) progress = 100
        if (progress < 0) progress = 0

        const barColor = progress >= 80 ? 'var(--positive)' : progress >= 50 ? 'var(--warning)' : 'var(--negative)'

        return (
          <div key={goal.id} className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-[var(--fg-primary)] leading-tight">{goal.description}</h4>
                <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider mt-0.5">{goal.type}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[var(--fg-primary)]">
                  {current}
                </span>
                <span className="text-sm text-[var(--fg-muted)] ml-1">
                  / {target} {goal.unit}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-[var(--bg-base)] rounded-full overflow-hidden mt-1">
              <div 
                className="h-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: barColor,
                  boxShadow: `0 0 8px ${barColor}44`
                }}
              />
            </div>

            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-[var(--fg-subtle)] font-mono uppercase">
                Progress: {progress.toFixed(1)}%
              </span>
              
              {editingId === goal.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    autoFocus
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-20 px-2 py-0.5 text-xs bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded focus:border-[var(--accent)] outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(goal.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <button 
                    onClick={() => handleUpdate(goal.id)}
                    className="text-[10px] bg-[var(--accent)] text-white px-2 py-0.5 rounded hover:opacity-90"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setEditingId(goal.id)
                    setTempValue(goal.currentValue?.toString() || '')
                  }}
                  className="text-[10px] text-[var(--accent)] hover:underline uppercase font-bold"
                >
                  Aggiorna
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { updateGoalProgress } from '@/app/actions/athlete-goals'
import { type AthleteGoal } from '@prisma/client'
import { Target, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react'

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
      <div className="p-8 rounded-[2rem] glass-sm border border-dashed border-border/50 text-center mesh-bg animate-blur-in">
        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mx-auto mb-4 opacity-20">
          <Target className="w-6 h-6" />
        </div>
        <p className="text-fg-subtle font-black tracking-tight uppercase text-[10px] opacity-50">Nessun obiettivo attivo impostato.</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-5 stagger ${isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
      {goals.map((goal, idx) => {
        const current = goal.currentValue || 0
        const target = goal.targetValue || 1
        let progress = target !== 0 ? (current / target) * 100 : 0
        
        if (progress > 100) progress = 100
        if (progress < 0) progress = 0

        const isCompleted = progress >= 100
        const barColor = isCompleted ? 'var(--positive)' : progress >= 50 ? 'var(--accent)' : 'var(--warning)'

        return (
          <div 
            key={goal.id} 
            className="p-6 rounded-[2rem] card-interactive surface-accent group animate-rise-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isCompleted ? 'bg-positive/10 text-positive' : 'glass-sm text-accent'}`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <Target size={20} />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-sm text-primary tracking-tight leading-tight truncate">{goal.description}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{goal.type}</span>
                    <span className="w-1 h-1 rounded-full bg-border-default" />
                    <span className="text-[9px] font-black text-accent uppercase tracking-widest">{goal.unit}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-black text-primary num tracking-tighter">
                    {current}
                  </span>
                  <span className="text-[10px] font-bold text-fg-subtle opacity-40 uppercase tracking-tighter">
                    / {target}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-positive' : 'text-fg-subtle opacity-60'}`}>
                  {isCompleted ? 'Obiettivo Raggiunto' : 'In Progresso'}
                </span>
                <span className="text-[10px] font-black num text-primary">
                  {progress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-bg-base rounded-full overflow-hidden border border-border-subtle shadow-inner">
                <div 
                  className="h-full transition-all duration-1000 ease-out rounded-full"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: barColor,
                    boxShadow: `0 0 12px color-mix(in srgb, ${barColor} 40%, transparent)`
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end mt-5">
              {editingId === goal.id ? (
                <div className="flex items-center gap-2 animate-pop-in">
                  <input
                    type="number"
                    step="any"
                    autoFocus
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-24 px-3 py-1.5 text-xs font-bold glass surface-accent border-accent/40 rounded-xl focus:ring-accent outline-none num"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(goal.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <button 
                    onClick={() => handleUpdate(goal.id)}
                    className="btn-primary px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest glow-accent"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-sm text-[10px] font-black text-accent hover:btn-primary hover:text-white transition-all uppercase tracking-widest"
                >
                  Aggiorna Progressi
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

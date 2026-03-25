"use client"

import { useState } from "react"
import { updateDistrictStress } from "@/app/actions/training"
import { DistrictStress, District } from "@prisma/client"
import { Zap } from "lucide-react"

const DISTRICT_MAP: Record<District, string> = {
  QUAD:       'Quadricipiti',
  HAMSTRING:  'Ischiocrurali',
  GLUTE:      'Glutei',
  KNEE:       'Ginocchio',
  LOWER_BACK: 'Lombari',
  UPPER_BACK: 'Dorsali',
  SHOULDER:   'Spalle',
  CHEST:      'Petto',
  BICEP:      'Bicipiti',
  TRICEP:     'Tricipiti',
  CALF:       'Polpacci',
  CORE:       'Core',
}

export default function DistrictStressForm({ sessionId, initialStress }: { sessionId: string, initialStress: DistrictStress[] }) {
  const [stress, setStress] = useState<Record<string, number>>(() => {
    const acc: Record<string, number> = {}
    initialStress.forEach(s => { acc[s.district] = s.intensity })
    return acc
  })

  const handleChange = async (district: District, val: number) => {
    setStress(prev => ({ ...prev, [district]: val }))
    await updateDistrictStress(sessionId, district, val)
  }

  const getLevelColor = (level: number) => {
    switch(level) {
      case 1: return 'var(--positive)'
      case 2: return 'var(--warning)'
      case 3: return 'var(--negative)'
      default: return 'var(--fg-muted)'
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:gap-x-8 md:gap-y-8">
        {Object.entries(DISTRICT_MAP).map(([d, label]) => {
          const currentLevel = stress[d] || 0
          
          return (
            <div key={d} className="space-y-3 animate-rise-up">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted/80 ml-1">{label}</span>
              
              <div className="flex justify-between items-center gap-1.5 p-1 bg-base/40 rounded-full border border-border-subtle shadow-inner">
                {[0, 1, 2, 3].map(level => {
                  const isActive = currentLevel === level
                  const color = getLevelColor(level)
                  
                  return (
                    <button
                      key={level}
                      onClick={() => handleChange(d as District, level)}
                      className={`relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full text-[10px] font-black transition-all duration-300 ${
                        isActive ? 'shadow-lg scale-110 z-10' : 'opacity-20 hover:opacity-100 grayscale hover:grayscale-0'
                      }`}
                      style={{
                        background: isActive ? (level === 0 ? 'var(--bg-elevated)' : color) : 'transparent',
                        color: isActive ? (level === 0 ? 'var(--fg-muted)' : 'white') : 'var(--fg-muted)',
                        boxShadow: isActive && level > 0 ? `0 0 15px color-mix(in srgb, ${color} 40%, transparent)` : 'none',
                        border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                      }}
                    >
                      {level}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-base border border-border" />
          <span className="text-[10px] font-bold text-muted uppercase">0 Nullo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-positive" />
          <span className="text-[10px] font-bold text-muted uppercase">1 Lieve</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-[10px] font-bold text-muted uppercase">2 Moderato</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-negative" />
          <span className="text-[10px] font-bold text-muted uppercase">3 Intenso</span>
        </div>
      </div>
    </div>
  )
}
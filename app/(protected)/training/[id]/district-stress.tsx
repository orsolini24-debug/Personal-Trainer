"use client"

import { useState } from "react"
import { updateDistrictStress } from "@/app/actions/training"
import { DistrictStress, District } from "@prisma/client"
import { Zap } from "lucide-react"

const DISTRICT_MAP: Record<District, string> = {
  QUAD:       'Quadricipiti',
  HAMSTRING:  'Ischiocrurali',
  GLUTE:      'Glutei',
  KNEE:       'Ginocchia',
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

  const getLevelStyle = (level: number) => {
    switch(level) {
      case 1: return { label: 'Lieve', bg: 'var(--positive-dim)', text: 'var(--positive)', border: 'var(--positive)', glow: 'var(--glow-positive)' }
      case 2: return { label: 'Medio', bg: 'var(--warning-dim)', text: 'var(--warning)', border: 'var(--warning)', glow: 'var(--glow-warning)' }
      case 3: return { label: 'Alto', bg: 'var(--negative-dim)', text: 'var(--negative)', border: 'var(--negative)', glow: 'var(--glow-negative)' }
      default: return { label: 'Nullo', bg: 'var(--bg-elevated)', text: 'var(--fg-subtle)', border: 'var(--border-default)', glow: 'transparent' }
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
      {Object.entries(DISTRICT_MAP).map(([d, label]) => {
        const currentLevel = stress[d] || 0
        const style = getLevelStyle(currentLevel)
        
        return (
          <div key={d} className="space-y-3 animate-rise-up">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
              <span className="badge scale-75 origin-right" style={{ 
                background: style.bg, 
                color: style.text, 
                borderColor: `color-mix(in srgb, ${style.text} 20%, transparent)` 
              }}>
                {style.label}
              </span>
            </div>
            
            <div className="flex gap-1.5 p-1.5 glass-sm rounded-2xl border border-border/40">
              {[0, 1, 2, 3].map(level => {
                const isActive = currentLevel === level
                const levelInfo = getLevelStyle(level)
                
                return (
                  <button
                    key={level}
                    onClick={() => handleChange(d as District, level)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all duration-300 ${
                      isActive ? 'shadow-xl scale-[1.05] z-10' : 'opacity-30 hover:opacity-100 grayscale hover:grayscale-0'
                    }`}
                    style={{
                      background: isActive ? levelInfo.text : 'transparent',
                      color: isActive ? 'white' : 'var(--fg-muted)',
                      boxShadow: isActive ? `0 6px 16px color-mix(in srgb, ${levelInfo.text} 30%, transparent)` : 'none',
                      border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                    }}
                  >
                    {level === 0 ? 'OFF' : level}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

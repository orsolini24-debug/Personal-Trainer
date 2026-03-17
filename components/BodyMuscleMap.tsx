'use client'

import { District } from '@prisma/client'
import { useState } from 'react'

interface BodyMuscleMapProps {
  primaryMuscles: District[]
  secondaryMuscles: District[]
  stabilizers?: District[]
  size?: 'sm' | 'md' | 'lg'
  showLegend?: boolean
}

// Mappa District → nome italiano
const MUSCLE_NAMES: Record<District, string> = {
  QUAD: 'Quadricipiti',
  HAMSTRING: 'Femorali',
  GLUTE: 'Glutei',
  KNEE: 'Ginocchio',
  LOWER_BACK: 'Lombari',
  UPPER_BACK: 'Dorsali/Trapezi',
  SHOULDER: 'Spalle',
  CHEST: 'Petto',
  BICEP: 'Bicipiti',
  TRICEP: 'Tricipiti',
  CALF: 'Polpacci',
  CORE: 'Core/Addominali',
}

export default function BodyMuscleMap({ primaryMuscles, secondaryMuscles, stabilizers = [], size = 'md', showLegend = true }: BodyMuscleMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<District | null>(null)

  const getMuscleColor = (district: District) => {
    if (primaryMuscles.includes(district)) return 'var(--negative)'
    if (secondaryMuscles.includes(district)) return 'var(--warning)'
    if (stabilizers.includes(district)) return '#EAB308'
    return 'var(--bg-elevated)'
  }

  const getMuscleOpacity = (district: District) => {
    const isActive = primaryMuscles.includes(district) || secondaryMuscles.includes(district) || stabilizers.includes(district)
    if (!isActive) return 0.6
    return hoveredMuscle === district ? 1 : 0.85
  }

  const getMuscleStroke = (district: District) => {
    if (hoveredMuscle === district) return 'var(--border-strong)'
    const isActive = primaryMuscles.includes(district) || secondaryMuscles.includes(district) || stabilizers.includes(district)
    return isActive ? 'rgba(255,255,255,0.2)' : 'var(--border-default)'
  }

  const getMuscleRole = (district: District) => {
    if (primaryMuscles.includes(district)) return 'Primario'
    if (secondaryMuscles.includes(district)) return 'Secondario'
    if (stabilizers.includes(district)) return 'Stabilizzatore'
    return null
  }

  const sizeClass = size === 'sm' ? 'max-h-48' : size === 'lg' ? 'max-h-80' : 'max-h-64'

  // Shared props for muscle path interactions
  const muscleProps = (district: District) => ({
    fill: getMuscleColor(district),
    fillOpacity: getMuscleOpacity(district),
    stroke: getMuscleStroke(district),
    strokeWidth: hoveredMuscle === district ? '1.5' : '1',
    style: { cursor: 'pointer', transition: 'all 0.15s ease' },
    onMouseEnter: () => setHoveredMuscle(district),
    onMouseLeave: () => setHoveredMuscle(null),
  })

  // FRONT VIEW SVG — corpo dettagliato
  const FrontBody = () => (
    <svg viewBox="0 0 140 340" className={`w-full h-auto ${sizeClass} drop-shadow-sm`}>
      {/* Body silhouette base */}
      <ellipse cx="70" cy="22" rx="18" ry="20" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5"/>
      {/* Neck */}
      <rect x="63" y="38" width="14" height="12" rx="3" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      {/* Torso */}
      <path d="M45,50 L95,50 L100,160 L85,165 L85,200 L55,200 L55,165 L40,160 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Left arm */}
      <path d="M45,55 L28,58 L22,110 L28,130 L35,130 L38,110 L45,95 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Right arm */}
      <path d="M95,55 L112,58 L118,110 L112,130 L105,130 L102,110 L95,95 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Left forearm */}
      <path d="M28,130 L22,175 L28,180 L38,180 L40,175 L35,130 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      {/* Right forearm */}
      <path d="M112,130 L118,175 L112,180 L102,180 L100,175 L105,130 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      {/* Left leg */}
      <path d="M55,200 L45,205 L42,285 L50,290 L62,290 L65,250 L65,200 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Right leg */}
      <path d="M85,200 L95,205 L98,285 L90,290 L78,290 L75,250 L75,200 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Left lower leg */}
      <path d="M42,285 L50,290 L62,290 L63,330 L48,330 L40,290 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      {/* Right lower leg */}
      <path d="M90,290 L98,285 L100,290 L92,330 L77,330 L77,290 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>

      {/* ── MUSCLE GROUPS — FRONT ── */}

      {/* CHEST (Pectoralis Major) */}
      <path d="M50,55 L90,55 L92,90 Q70,100 48,90 Z" {...muscleProps('CHEST')}>
        <title>{MUSCLE_NAMES.CHEST}{getMuscleRole('CHEST') ? ` — ${getMuscleRole('CHEST')}` : ''}</title>
      </path>

      {/* CORE / Rectus Abdominis */}
      <path d="M52,92 Q70,100 88,92 L86,155 Q70,165 54,155 Z" {...muscleProps('CORE')}>
        <title>{MUSCLE_NAMES.CORE}{getMuscleRole('CORE') ? ` — ${getMuscleRole('CORE')}` : ''}</title>
      </path>

      {/* SHOULDER Left (Anterior Delt) */}
      <path d="M46,52 L50,55 L48,90 L38,80 L36,62 Z" {...muscleProps('SHOULDER')}>
        <title>{MUSCLE_NAMES.SHOULDER}{getMuscleRole('SHOULDER') ? ` — ${getMuscleRole('SHOULDER')}` : ''}</title>
      </path>
      {/* SHOULDER Right */}
      <path d="M94,52 L90,55 L92,90 L102,80 L104,62 Z" {...muscleProps('SHOULDER')}>
        <title>{MUSCLE_NAMES.SHOULDER}</title>
      </path>

      {/* BICEP Left */}
      <path d="M29,62 L38,62 L38,80 L42,110 L30,108 Z" {...muscleProps('BICEP')}>
        <title>{MUSCLE_NAMES.BICEP}{getMuscleRole('BICEP') ? ` — ${getMuscleRole('BICEP')}` : ''}</title>
      </path>
      {/* BICEP Right */}
      <path d="M111,62 L102,62 L102,80 L98,110 L110,108 Z" {...muscleProps('BICEP')}>
        <title>{MUSCLE_NAMES.BICEP}</title>
      </path>

      {/* QUAD Left */}
      <path d="M47,205 L62,205 L64,280 L50,280 Z" {...muscleProps('QUAD')}>
        <title>{MUSCLE_NAMES.QUAD}{getMuscleRole('QUAD') ? ` — ${getMuscleRole('QUAD')}` : ''}</title>
      </path>
      {/* QUAD Right */}
      <path d="M78,205 L93,205 L90,280 L76,280 Z" {...muscleProps('QUAD')}>
        <title>{MUSCLE_NAMES.QUAD}</title>
      </path>

      {/* KNEE Left */}
      <ellipse cx="55" cy="288" rx="8" ry="6" {...muscleProps('KNEE')}>
        <title>{MUSCLE_NAMES.KNEE}{getMuscleRole('KNEE') ? ` — ${getMuscleRole('KNEE')}` : ''}</title>
      </ellipse>
      {/* KNEE Right */}
      <ellipse cx="85" cy="288" rx="8" ry="6" {...muscleProps('KNEE')}>
        <title>{MUSCLE_NAMES.KNEE}</title>
      </ellipse>

      {/* CALF Left (visible partially from front) */}
      <path d="M43,298 L57,298 L58,325 L44,325 Z" {...muscleProps('CALF')}>
        <title>{MUSCLE_NAMES.CALF}{getMuscleRole('CALF') ? ` — ${getMuscleRole('CALF')}` : ''}</title>
      </path>
      {/* CALF Right */}
      <path d="M83,298 L97,298 L96,325 L82,325 Z" {...muscleProps('CALF')}>
        <title>{MUSCLE_NAMES.CALF}</title>
      </path>

      {/* TRICEP Left (partially visible from front at arm inner) */}
      <path d="M29,108 L37,112 L36,130 L28,128 Z" {...muscleProps('TRICEP')}>
        <title>{MUSCLE_NAMES.TRICEP}{getMuscleRole('TRICEP') ? ` — ${getMuscleRole('TRICEP')}` : ''}</title>
      </path>
      {/* TRICEP Right */}
      <path d="M111,108 L103,112 L104,130 L112,128 Z" {...muscleProps('TRICEP')}>
        <title>{MUSCLE_NAMES.TRICEP}</title>
      </path>
    </svg>
  )

  // BACK VIEW SVG
  const BackBody = () => (
    <svg viewBox="0 0 140 340" className={`w-full h-auto ${sizeClass} drop-shadow-sm`}>
      {/* Body silhouette base (same outline) */}
      <ellipse cx="70" cy="22" rx="18" ry="20" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5"/>
      <rect x="63" y="38" width="14" height="12" rx="3" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M45,50 L95,50 L100,160 L85,165 L85,200 L55,200 L55,165 L40,160 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M45,55 L28,58 L22,110 L28,130 L35,130 L38,110 L45,95 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M95,55 L112,58 L118,110 L112,130 L105,130 L102,110 L95,95 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M28,130 L22,175 L28,180 L38,180 L40,175 L35,130 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M112,130 L118,175 L112,180 L102,180 L100,175 L105,130 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M55,200 L45,205 L42,285 L50,290 L62,290 L65,250 L65,200 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M85,200 L95,205 L98,285 L90,290 L78,290 L75,250 L75,200 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M42,285 L50,290 L62,290 L63,330 L48,330 L40,290 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M90,290 L98,285 L100,290 L92,330 L77,330 L77,290 Z" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>

      {/* ── MUSCLE GROUPS — BACK ── */}

      {/* UPPER_BACK (Trapezius + Latissimus) */}
      <path d="M50,52 L90,52 L94,130 L46,130 Z" {...muscleProps('UPPER_BACK')}>
        <title>{MUSCLE_NAMES.UPPER_BACK}{getMuscleRole('UPPER_BACK') ? ` — ${getMuscleRole('UPPER_BACK')}` : ''}</title>
      </path>

      {/* LOWER_BACK (Erector Spinae) */}
      <path d="M54,130 L86,130 L84,165 L56,165 Z" {...muscleProps('LOWER_BACK')}>
        <title>{MUSCLE_NAMES.LOWER_BACK}{getMuscleRole('LOWER_BACK') ? ` — ${getMuscleRole('LOWER_BACK')}` : ''}</title>
      </path>

      {/* SHOULDER Back (Rear Delt + Traps) */}
      <path d="M46,52 L50,52 L46,90 L36,80 L36,62 Z" {...muscleProps('SHOULDER')}>
        <title>{MUSCLE_NAMES.SHOULDER}{getMuscleRole('SHOULDER') ? ` — ${getMuscleRole('SHOULDER')}` : ''}</title>
      </path>
      <path d="M94,52 L90,52 L94,90 L104,80 L104,62 Z" {...muscleProps('SHOULDER')}>
        <title>{MUSCLE_NAMES.SHOULDER}</title>
      </path>

      {/* TRICEP Left (back view — prominent) */}
      <path d="M29,62 L38,62 L38,85 L44,110 L30,108 Z" {...muscleProps('TRICEP')}>
        <title>{MUSCLE_NAMES.TRICEP}{getMuscleRole('TRICEP') ? ` — ${getMuscleRole('TRICEP')}` : ''}</title>
      </path>
      {/* TRICEP Right */}
      <path d="M111,62 L102,62 L102,85 L96,110 L110,108 Z" {...muscleProps('TRICEP')}>
        <title>{MUSCLE_NAMES.TRICEP}</title>
      </path>

      {/* GLUTE */}
      <path d="M55,165 L85,165 L90,208 Q70,218 50,208 Z" {...muscleProps('GLUTE')}>
        <title>{MUSCLE_NAMES.GLUTE}{getMuscleRole('GLUTE') ? ` — ${getMuscleRole('GLUTE')}` : ''}</title>
      </path>

      {/* HAMSTRING Left */}
      <path d="M48,210 L64,210 L62,278 L46,278 Z" {...muscleProps('HAMSTRING')}>
        <title>{MUSCLE_NAMES.HAMSTRING}{getMuscleRole('HAMSTRING') ? ` — ${getMuscleRole('HAMSTRING')}` : ''}</title>
      </path>
      {/* HAMSTRING Right */}
      <path d="M76,210 L92,210 L94,278 L78,278 Z" {...muscleProps('HAMSTRING')}>
        <title>{MUSCLE_NAMES.HAMSTRING}</title>
      </path>

      {/* CALF Left */}
      <path d="M44,295 L60,295 L59,328 L45,328 Z" {...muscleProps('CALF')}>
        <title>{MUSCLE_NAMES.CALF}{getMuscleRole('CALF') ? ` — ${getMuscleRole('CALF')}` : ''}</title>
      </path>
      {/* CALF Right */}
      <path d="M80,295 L96,295 L95,328 L81,328 Z" {...muscleProps('CALF')}>
        <title>{MUSCLE_NAMES.CALF}</title>
      </path>

      {/* BICEP Left (back — less prominent) */}
      <path d="M30,108 L38,112 L36,128 L28,125 Z" {...muscleProps('BICEP')}>
        <title>{MUSCLE_NAMES.BICEP}{getMuscleRole('BICEP') ? ` — ${getMuscleRole('BICEP')}` : ''}</title>
      </path>
      {/* BICEP Right */}
      <path d="M110,108 L102,112 L104,128 L112,125 Z" {...muscleProps('BICEP')}>
        <title>{MUSCLE_NAMES.BICEP}</title>
      </path>

      {/* CORE (Back — partial obliques) */}
      <path d="M46,130 L55,130 L55,165 L50,162 Z" {...muscleProps('CORE')}>
        <title>{MUSCLE_NAMES.CORE}{getMuscleRole('CORE') ? ` — ${getMuscleRole('CORE')}` : ''}</title>
      </path>
      <path d="M94,130 L85,130 L85,165 L90,162 Z" {...muscleProps('CORE')}>
        <title>{MUSCLE_NAMES.CORE}</title>
      </path>
    </svg>
  )

  const allActive = [...primaryMuscles, ...secondaryMuscles, ...stabilizers]

  return (
    <div className="space-y-3">
      {/* Muscle bodies side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center">
          <FrontBody />
          <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-muted">Anteriore</p>
        </div>
        <div className="flex flex-col items-center">
          <BackBody />
          <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-muted">Posteriore</p>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredMuscle && (
        <div className="text-center py-1.5 px-3 rounded-xl text-xs font-bold transition-all"
          style={{
            background: getMuscleColor(hoveredMuscle),
            color: 'white',
            opacity: 0.9,
          }}>
          {MUSCLE_NAMES[hoveredMuscle]} — {getMuscleRole(hoveredMuscle) ?? 'Non coinvolto'}
        </div>
      )}

      {/* Muscle chips summary */}
      {allActive.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {primaryMuscles.map(m => (
            <span key={m} className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide text-white"
              style={{ background: 'var(--negative)' }}>
              {MUSCLE_NAMES[m]}
            </span>
          ))}
          {secondaryMuscles.map(m => (
            <span key={m} className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide text-white"
              style={{ background: 'var(--warning)' }}>
              {MUSCLE_NAMES[m]}
            </span>
          ))}
          {stabilizers.map(m => (
            <span key={m} className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide"
              style={{ background: '#EAB30820', border: '1px solid #EAB308', color: '#EAB308' }}>
              {MUSCLE_NAMES[m]}
            </span>
          ))}
        </div>
      )}

      {/* Legend */}
      {showLegend && allActive.length > 0 && (
        <div className="flex items-center gap-4 pt-1">
          {primaryMuscles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--negative)' }} />
              <span className="text-[9px] font-bold text-muted uppercase tracking-wide">Primario</span>
            </div>
          )}
          {secondaryMuscles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warning)' }} />
              <span className="text-[9px] font-bold text-muted uppercase tracking-wide">Secondario</span>
            </div>
          )}
          {stabilizers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EAB308' }} />
              <span className="text-[9px] font-bold text-muted uppercase tracking-wide">Stabilizzatore</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

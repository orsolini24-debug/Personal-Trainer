'use client'

import { District } from '@prisma/client'

interface MuscleHeatmapProps {
  stress: Record<District, number>
  side: 'front' | 'back'
}

export default function MuscleHeatmap({ stress, side }: MuscleHeatmapProps) {
  // Utility to determine fill color based on intensity (0-4+)
  const getFill = (district: District) => {
    const val = stress[district] || 0
    if (val === 0) return 'transparent'
    
    // Scale opacity based on value
    // 1 -> 30%, 2 -> 60%, 3+ -> 90%
    const opacity = Math.min(0.9, val * 0.3)
    return `rgba(239, 68, 68, ${opacity})` // #ef4444 with opacity
  }

  // Common stroke
  const strokeColor = 'var(--border-strong)'

  // Simplified SVG paths
  const FrontSVG = () => (
    <svg viewBox="0 0 200 400" className="w-full h-auto max-h-96 drop-shadow-md">
      {/* Background outline */}
      <path d="M70,30 Q100,10 130,30 L140,70 Q180,80 180,100 L160,200 L140,200 L130,160 L120,220 L130,380 L105,380 L100,240 L95,380 L70,380 L80,220 L70,160 L60,200 L40,200 L20,100 Q20,80 60,70 Z" fill="var(--bg-surface)" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round"/>
      
      {/* CHEST */}
      <path d="M75,75 Q100,70 125,75 L120,110 Q100,120 80,110 Z" fill={getFill('CHEST')} stroke={strokeColor} strokeWidth="1">
        <title>Petto: {stress.CHEST || 0}</title>
      </path>
      
      {/* CORE / ABDOMINALS */}
      <path d="M80,110 Q100,120 120,110 L115,180 Q100,190 85,180 Z" fill={getFill('CORE')} stroke={strokeColor} strokeWidth="1">
        <title>Core: {stress.CORE || 0}</title>
      </path>
      
      {/* SHOULDERS (Front delts) */}
      <path d="M50,75 L75,75 L70,105 L45,110 Z" fill={getFill('SHOULDER')} stroke={strokeColor} strokeWidth="1">
        <title>Spalle (Sx): {stress.SHOULDER || 0}</title>
      </path>
      <path d="M125,75 L150,75 L155,110 L130,105 Z" fill={getFill('SHOULDER')} stroke={strokeColor} strokeWidth="1">
        <title>Spalle (Dx): {stress.SHOULDER || 0}</title>
      </path>

      {/* BICEPS */}
      <path d="M45,110 L70,105 L65,150 L50,150 Z" fill={getFill('BICEP')} stroke={strokeColor} strokeWidth="1">
        <title>Bicipiti (Sx): {stress.BICEP || 0}</title>
      </path>
      <path d="M130,105 L155,110 L150,150 L135,150 Z" fill={getFill('BICEP')} stroke={strokeColor} strokeWidth="1">
        <title>Bicipiti (Dx): {stress.BICEP || 0}</title>
      </path>

      {/* QUADS (KNEE area included in quads generally for visual, or mapped specifically) */}
      <path d="M85,200 L115,200 L125,290 L105,290 L100,240 L95,290 L75,290 Z" fill={getFill('QUAD')} stroke={strokeColor} strokeWidth="1">
        <title>Quadricipiti: {stress.QUAD || 0}</title>
      </path>
      
      {/* KNEES (Joint) */}
      <path d="M75,290 L95,290 L95,310 L78,310 Z" fill={getFill('KNEE')} stroke={strokeColor} strokeWidth="1">
        <title>Ginocchia (Sx): {stress.KNEE || 0}</title>
      </path>
      <path d="M105,290 L125,290 L122,310 L105,310 Z" fill={getFill('KNEE')} stroke={strokeColor} strokeWidth="1">
        <title>Ginocchia (Dx): {stress.KNEE || 0}</title>
      </path>

    </svg>
  )

  const BackSVG = () => (
    <svg viewBox="0 0 200 400" className="w-full h-auto max-h-96 drop-shadow-md">
      {/* Background outline */}
      <path d="M70,30 Q100,10 130,30 L140,70 Q180,80 180,100 L160,200 L140,200 L130,160 L120,220 L130,380 L105,380 L100,240 L95,380 L70,380 L80,220 L70,160 L60,200 L40,200 L20,100 Q20,80 60,70 Z" fill="var(--bg-surface)" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round"/>
      
      {/* UPPER BACK (Traps/Lats) */}
      <path d="M75,60 Q100,70 125,60 L130,120 L70,120 Z" fill={getFill('UPPER_BACK')} stroke={strokeColor} strokeWidth="1">
        <title>Dorsali: {stress.UPPER_BACK || 0}</title>
      </path>

      {/* LOWER BACK */}
      <path d="M70,120 L130,120 L120,170 L80,170 Z" fill={getFill('LOWER_BACK')} stroke={strokeColor} strokeWidth="1">
        <title>Lombari: {stress.LOWER_BACK || 0}</title>
      </path>

      {/* GLUTES */}
      <path d="M80,170 L120,170 L125,220 L100,210 L75,220 Z" fill={getFill('GLUTE')} stroke={strokeColor} strokeWidth="1">
        <title>Glutei: {stress.GLUTE || 0}</title>
      </path>

      {/* HAMSTRINGS */}
      <path d="M75,220 L98,215 L95,290 L75,290 Z" fill={getFill('HAMSTRING')} stroke={strokeColor} strokeWidth="1">
        <title>Femorali (Sx): {stress.HAMSTRING || 0}</title>
      </path>
      <path d="M102,215 L125,220 L125,290 L105,290 Z" fill={getFill('HAMSTRING')} stroke={strokeColor} strokeWidth="1">
        <title>Femorali (Dx): {stress.HAMSTRING || 0}</title>
      </path>

      {/* CALVES */}
      <path d="M78,310 L95,310 L95,360 L75,360 Z" fill={getFill('CALF')} stroke={strokeColor} strokeWidth="1">
        <title>Polpacci (Sx): {stress.CALF || 0}</title>
      </path>
      <path d="M105,310 L122,310 L125,360 L105,360 Z" fill={getFill('CALF')} stroke={strokeColor} strokeWidth="1">
        <title>Polpacci (Dx): {stress.CALF || 0}</title>
      </path>

      {/* TRICEPS */}
      <path d="M45,110 L70,105 L65,150 L50,150 Z" fill={getFill('TRICEP')} stroke={strokeColor} strokeWidth="1">
        <title>Tricipiti (Sx): {stress.TRICEP || 0}</title>
      </path>
      <path d="M130,105 L155,110 L150,150 L135,150 Z" fill={getFill('TRICEP')} stroke={strokeColor} strokeWidth="1">
        <title>Tricipiti (Dx): {stress.TRICEP || 0}</title>
      </path>
    </svg>
  )

  return (
    <div className="flex flex-col items-center">
      {side === 'front' ? <FrontSVG /> : <BackSVG />}
      <span className="text-[10px] uppercase font-bold tracking-widest mt-4" style={{ color: 'var(--fg-muted)' }}>
        {side === 'front' ? 'Anteriore' : 'Posteriore'}
      </span>
    </div>
  )
}

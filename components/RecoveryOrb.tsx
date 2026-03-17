'use client'

import { useEffect, useState } from 'react'

export default function RecoveryOrb({ score, label }: { score: number, label: string }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    // Timeout to allow CSS transition to play after mounting
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  let color = 'var(--positive)'
  let glow = 'var(--glow-positive)'
  if (score < 33) {
    color = 'var(--negative)'
    glow = 'var(--glow-negative)'
  } else if (score < 66) {
    color = 'var(--warning)'
    glow = 'var(--glow-warning, rgba(245,158,11,0.35))'
  }

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = mounted ? circumference - (score / 100) * circumference : circumference

  return (
    <div className="flex flex-col items-center justify-center relative py-6">
      <div 
        className="relative flex items-center justify-center"
        style={{ width: '160px', height: '160px' }}
      >
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 140 140" style={{ filter: `drop-shadow(0 0 16px ${glow})` }}>
          {/* Background track */}
          <circle 
            cx="70" cy="70" r={radius} 
            stroke="var(--bg-elevated)" 
            strokeWidth="12" 
            fill="transparent" 
            className="opacity-50"
          />
          {/* Animated progress */}
          <circle 
            cx="70" cy="70" r={radius} 
            stroke={color} 
            strokeWidth="12" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: 'var(--fg-primary)' }}>
            {score}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest mt-1" style={{ color: color }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}

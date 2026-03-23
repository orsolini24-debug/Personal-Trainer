'use client'

import { District } from '@prisma/client'
import { useState } from 'react'

interface BodyMuscleMapProps {
  primaryMuscles: District[]
  secondaryMuscles: District[]
  /** Muscles that receive indirect/complementary work — shown in violet */
  complementary?: District[]
  size?: 'sm' | 'md' | 'lg'
  showLegend?: boolean
  className?: string
}

// ── Colour palette ────────────────────────────────────────────────────────────
const TIER_COLOR = {
  primary:      { hex: '#EF4444', glow: 'rgba(239,68,68,0.45)',    label: 'Principale'    },
  secondary:    { hex: '#EAB308', glow: 'rgba(234,179,8,0.45)',    label: 'Secondario'    },
  complementary:{ hex: '#A855F7', glow: 'rgba(168,85,247,0.45)',   label: 'Complementare' },
} as const

// ── Italian muscle names ──────────────────────────────────────────────────────
const MUSCLE_NAMES: Record<District, string> = {
  QUAD:       'Quadricipiti',
  HAMSTRING:  'Femorali',
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTier(
  d: District,
  primary: District[],
  secondary: District[],
  comp: District[],
): keyof typeof TIER_COLOR | null {
  if (primary.includes(d))    return 'primary'
  if (secondary.includes(d))  return 'secondary'
  if (comp.includes(d))       return 'complementary'
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
export default function BodyMuscleMap({
  primaryMuscles,
  secondaryMuscles,
  complementary = [],
  size = 'md',
  showLegend = true,
  className = '',
}: BodyMuscleMapProps) {
  const [hovered, setHovered] = useState<District | null>(null)

  const sizeH = size === 'sm' ? 'max-h-52' : size === 'lg' ? 'max-h-96' : 'max-h-72'

  // Build common fill/stroke helpers
  const tier = (d: District) => getTier(d, primaryMuscles, secondaryMuscles, complementary)

  const fill = (d: District) => {
    const t = tier(d)
    return t ? TIER_COLOR[t].hex : 'var(--bg-elevated)'
  }

  const fillOpacity = (d: District) => {
    const t = tier(d)
    if (!t) return 0.55
    return hovered === d ? 1 : 0.82
  }

  const stroke = (d: District) => {
    if (hovered === d) return 'rgba(255,255,255,0.7)'
    const t = tier(d)
    return t ? 'rgba(255,255,255,0.25)' : 'var(--border-default)'
  }

  const strokeWidth = (d: District) => (hovered === d ? '1.8' : '1')

  const filterAttr = (d: District) => {
    const t = tier(d)
    if (!t) return undefined
    return `url(#glow-${t})`
  }

  // Shared interactive props for each muscle path
  const mp = (d: District) => ({
    fill: fill(d),
    fillOpacity: fillOpacity(d),
    stroke: stroke(d),
    strokeWidth: strokeWidth(d),
    filter: filterAttr(d),
    style: { cursor: 'pointer', transition: 'fill-opacity 0.15s ease, stroke 0.15s ease' } as React.CSSProperties,
    onMouseEnter: () => setHovered(d),
    onMouseLeave: () => setHovered(null),
  })

  // ── SVG defs: glow filters ────────────────────────────────────────────────
  const SvgDefs = () => (
    <defs>
      {(Object.entries(TIER_COLOR) as [keyof typeof TIER_COLOR, typeof TIER_COLOR[keyof typeof TIER_COLOR]][]).map(([key, val]) => (
        <filter key={key} id={`glow-${key}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feFlood floodColor={val.hex} floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="coloredBlur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </defs>
  )

  // ── FRONT BODY ────────────────────────────────────────────────────────────
  const FrontBody = () => (
    <svg viewBox="0 0 140 340" className={`w-full h-auto ${sizeH} drop-shadow-sm`}>
      <SvgDefs />

      {/* Silhouette */}
      <ellipse cx="70" cy="22" rx="18" ry="20" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5"/>
      <rect x="63" y="38" width="14" height="12" rx="3" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M45,50 L95,50 L100,160 L85,165 L85,200 L55,200 L55,165 L40,160 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M45,55 L28,58 L22,110 L28,130 L35,130 L38,110 L45,95 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M95,55 L112,58 L118,110 L112,130 L105,130 L102,110 L95,95 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M28,130 L22,175 L28,180 L38,180 L40,175 L35,130 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M112,130 L118,175 L112,180 L102,180 L100,175 L105,130 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M55,200 L45,205 L42,285 L50,290 L62,290 L65,250 L65,200 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M85,200 L95,205 L98,285 L90,290 L78,290 L75,250 L75,200 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M42,285 L50,290 L62,290 L63,330 L48,330 L40,290 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M90,290 L98,285 L100,290 L92,330 L77,330 L77,290 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>

      {/* ── MUSCLE GROUPS ── */}

      {/* CHEST */}
      <path d="M50,55 L90,55 L92,90 Q70,100 48,90 Z" {...mp('CHEST')}>
        <title>{MUSCLE_NAMES.CHEST}</title>
      </path>

      {/* CORE */}
      <path d="M52,92 Q70,100 88,92 L86,155 Q70,165 54,155 Z" {...mp('CORE')}>
        <title>{MUSCLE_NAMES.CORE}</title>
      </path>

      {/* SHOULDER Left */}
      <path d="M46,52 L50,55 L48,90 L38,80 L36,62 Z" {...mp('SHOULDER')}>
        <title>{MUSCLE_NAMES.SHOULDER}</title>
      </path>
      {/* SHOULDER Right */}
      <path d="M94,52 L90,55 L92,90 L102,80 L104,62 Z" {...mp('SHOULDER')}>
        <title>{MUSCLE_NAMES.SHOULDER}</title>
      </path>

      {/* BICEP Left */}
      <path d="M29,62 L38,62 L38,80 L42,110 L30,108 Z" {...mp('BICEP')}>
        <title>{MUSCLE_NAMES.BICEP}</title>
      </path>
      {/* BICEP Right */}
      <path d="M111,62 L102,62 L102,80 L98,110 L110,108 Z" {...mp('BICEP')}>
        <title>{MUSCLE_NAMES.BICEP}</title>
      </path>

      {/* TRICEP Left (front partial) */}
      <path d="M29,108 L37,112 L36,130 L28,128 Z" {...mp('TRICEP')}>
        <title>{MUSCLE_NAMES.TRICEP}</title>
      </path>
      {/* TRICEP Right */}
      <path d="M111,108 L103,112 L104,130 L112,128 Z" {...mp('TRICEP')}>
        <title>{MUSCLE_NAMES.TRICEP}</title>
      </path>

      {/* QUAD Left */}
      <path d="M47,205 L62,205 L64,280 L50,280 Z" {...mp('QUAD')}>
        <title>{MUSCLE_NAMES.QUAD}</title>
      </path>
      {/* QUAD Right */}
      <path d="M78,205 L93,205 L90,280 L76,280 Z" {...mp('QUAD')}>
        <title>{MUSCLE_NAMES.QUAD}</title>
      </path>

      {/* KNEE Left */}
      <ellipse cx="55" cy="288" rx="8" ry="6" {...mp('KNEE')}>
        <title>{MUSCLE_NAMES.KNEE}</title>
      </ellipse>
      {/* KNEE Right */}
      <ellipse cx="85" cy="288" rx="8" ry="6" {...mp('KNEE')}>
        <title>{MUSCLE_NAMES.KNEE}</title>
      </ellipse>

      {/* CALF Left */}
      <path d="M43,298 L57,298 L58,325 L44,325 Z" {...mp('CALF')}>
        <title>{MUSCLE_NAMES.CALF}</title>
      </path>
      {/* CALF Right */}
      <path d="M83,298 L97,298 L96,325 L82,325 Z" {...mp('CALF')}>
        <title>{MUSCLE_NAMES.CALF}</title>
      </path>
    </svg>
  )

  // ── BACK BODY ─────────────────────────────────────────────────────────────
  const BackBody = () => (
    <svg viewBox="0 0 140 340" className={`w-full h-auto ${sizeH} drop-shadow-sm`}>
      <SvgDefs />

      {/* Silhouette */}
      <ellipse cx="70" cy="22" rx="18" ry="20" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5"/>
      <rect x="63" y="38" width="14" height="12" rx="3" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M45,50 L95,50 L100,160 L85,165 L85,200 L55,200 L55,165 L40,160 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M45,55 L28,58 L22,110 L28,130 L35,130 L38,110 L45,95 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M95,55 L112,58 L118,110 L112,130 L105,130 L102,110 L95,95 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M28,130 L22,175 L28,180 L38,180 L40,175 L35,130 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M112,130 L118,175 L112,180 L102,180 L100,175 L105,130 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M55,200 L45,205 L42,285 L50,290 L62,290 L65,250 L65,200 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M85,200 L95,205 L98,285 L90,290 L78,290 L75,250 L75,200 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M42,285 L50,290 L62,290 L63,330 L48,330 L40,290 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>
      <path d="M90,290 L98,285 L100,290 L92,330 L77,330 L77,290 Z"
        fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="1"/>

      {/* ── MUSCLE GROUPS ── */}

      {/* UPPER_BACK */}
      <path d="M50,52 L90,52 L94,130 L46,130 Z" {...mp('UPPER_BACK')}>
        <title>{MUSCLE_NAMES.UPPER_BACK}</title>
      </path>

      {/* LOWER_BACK */}
      <path d="M54,130 L86,130 L84,165 L56,165 Z" {...mp('LOWER_BACK')}>
        <title>{MUSCLE_NAMES.LOWER_BACK}</title>
      </path>

      {/* SHOULDER Left (rear) */}
      <path d="M46,52 L50,52 L46,90 L36,80 L36,62 Z" {...mp('SHOULDER')}>
        <title>{MUSCLE_NAMES.SHOULDER}</title>
      </path>
      {/* SHOULDER Right (rear) */}
      <path d="M94,52 L90,52 L94,90 L104,80 L104,62 Z" {...mp('SHOULDER')}>
        <title>{MUSCLE_NAMES.SHOULDER}</title>
      </path>

      {/* TRICEP Left */}
      <path d="M29,62 L38,62 L38,85 L44,110 L30,108 Z" {...mp('TRICEP')}>
        <title>{MUSCLE_NAMES.TRICEP}</title>
      </path>
      {/* TRICEP Right */}
      <path d="M111,62 L102,62 L102,85 L96,110 L110,108 Z" {...mp('TRICEP')}>
        <title>{MUSCLE_NAMES.TRICEP}</title>
      </path>

      {/* BICEP Left (back partial) */}
      <path d="M30,108 L38,112 L36,128 L28,125 Z" {...mp('BICEP')}>
        <title>{MUSCLE_NAMES.BICEP}</title>
      </path>
      {/* BICEP Right */}
      <path d="M110,108 L102,112 L104,128 L112,125 Z" {...mp('BICEP')}>
        <title>{MUSCLE_NAMES.BICEP}</title>
      </path>

      {/* GLUTE */}
      <path d="M55,165 L85,165 L90,208 Q70,218 50,208 Z" {...mp('GLUTE')}>
        <title>{MUSCLE_NAMES.GLUTE}</title>
      </path>

      {/* HAMSTRING Left */}
      <path d="M48,210 L64,210 L62,278 L46,278 Z" {...mp('HAMSTRING')}>
        <title>{MUSCLE_NAMES.HAMSTRING}</title>
      </path>
      {/* HAMSTRING Right */}
      <path d="M76,210 L92,210 L94,278 L78,278 Z" {...mp('HAMSTRING')}>
        <title>{MUSCLE_NAMES.HAMSTRING}</title>
      </path>

      {/* CALF Left */}
      <path d="M44,295 L60,295 L59,328 L45,328 Z" {...mp('CALF')}>
        <title>{MUSCLE_NAMES.CALF}</title>
      </path>
      {/* CALF Right */}
      <path d="M80,295 L96,295 L95,328 L81,328 Z" {...mp('CALF')}>
        <title>{MUSCLE_NAMES.CALF}</title>
      </path>

      {/* CORE obliques (side strips) */}
      <path d="M46,130 L55,130 L55,165 L50,162 Z" {...mp('CORE')}>
        <title>{MUSCLE_NAMES.CORE}</title>
      </path>
      <path d="M94,130 L85,130 L85,165 L90,162 Z" {...mp('CORE')}>
        <title>{MUSCLE_NAMES.CORE}</title>
      </path>
    </svg>
  )

  // All active districts (deduped)
  const allActive = Array.from(new Set([...primaryMuscles, ...secondaryMuscles, ...complementary]))

  // Tooltip content
  const tooltipTier = hovered ? tier(hovered) : null

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Bodies ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center gap-1">
          <FrontBody />
          <p className="text-[9px] font-black uppercase tracking-widest text-muted">Anteriore</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <BackBody />
          <p className="text-[9px] font-black uppercase tracking-widest text-muted">Posteriore</p>
        </div>
      </div>

      {/* ── Hover tooltip ── */}
      <div
        className="min-h-[28px] flex items-center justify-center transition-all duration-150"
        aria-live="polite"
      >
        {hovered && tooltipTier && (
          <div
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${TIER_COLOR[tooltipTier].hex}cc, ${TIER_COLOR[tooltipTier].hex}88)`,
              border: `1px solid ${TIER_COLOR[tooltipTier].hex}60`,
              boxShadow: `0 2px 12px ${TIER_COLOR[tooltipTier].glow}`,
            }}
          >
            {MUSCLE_NAMES[hovered]}
            <span className="ml-2 text-white/70 font-medium">— {TIER_COLOR[tooltipTier].label}</span>
          </div>
        )}
      </div>

      {/* ── Muscle chips ── */}
      {allActive.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {primaryMuscles.map(m => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide text-white"
              style={{
                background: `linear-gradient(135deg, ${TIER_COLOR.primary.hex}cc, ${TIER_COLOR.primary.hex}99)`,
                border: `1px solid ${TIER_COLOR.primary.hex}60`,
              }}
            >
              {MUSCLE_NAMES[m]}
            </span>
          ))}
          {secondaryMuscles.map(m => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide text-white"
              style={{
                background: `linear-gradient(135deg, ${TIER_COLOR.secondary.hex}cc, ${TIER_COLOR.secondary.hex}99)`,
                border: `1px solid ${TIER_COLOR.secondary.hex}60`,
              }}
            >
              {MUSCLE_NAMES[m]}
            </span>
          ))}
          {complementary.map(m => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide text-white"
              style={{
                background: `linear-gradient(135deg, ${TIER_COLOR.complementary.hex}cc, ${TIER_COLOR.complementary.hex}99)`,
                border: `1px solid ${TIER_COLOR.complementary.hex}60`,
              }}
            >
              {MUSCLE_NAMES[m]}
            </span>
          ))}
        </div>
      )}

      {/* ── Legend ── */}
      {showLegend && allActive.length > 0 && (
        <div className="flex items-center gap-4 pt-0.5 flex-wrap">
          {primaryMuscles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLOR.primary.hex }} />
              <span className="text-[9px] font-bold text-muted uppercase tracking-wide">Principale</span>
            </div>
          )}
          {secondaryMuscles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLOR.secondary.hex }} />
              <span className="text-[9px] font-bold text-muted uppercase tracking-wide">Secondario</span>
            </div>
          )}
          {complementary.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLOR.complementary.hex }} />
              <span className="text-[9px] font-bold text-muted uppercase tracking-wide">Complementare</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

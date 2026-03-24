'use client'

import { District } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  primaryMuscles?: District[]
  secondaryMuscles?: District[]
  complementaryMuscles?: District[]
  /** compact = piccola card esercizio, full = post-workout */
  size?: 'compact' | 'full'
  showLabels?: boolean
}

// ── Colori ────────────────────────────────────────────────────────────────────

const C = {
  primary:        '#ef4444',   // rosso
  secondary:      '#eab308',   // giallo
  complementary:  '#a855f7',   // viola
  inactive:       'rgba(128,128,128,0.10)',
  outline:        'rgba(128,128,128,0.25)',
  skin:           'rgba(128,128,128,0.06)',
}

// ── District → regioni SVG ────────────────────────────────────────────────────

const REGIONS: Partial<Record<District, { front?: string[]; back?: string[] }>> = {
  CHEST:      { front: ['chest-l', 'chest-r'] },
  SHOULDER:   { front: ['sh-f-l', 'sh-f-r'],    back: ['sh-b-l', 'sh-b-r'] },
  BICEP:      { front: ['bicep-l', 'bicep-r'] },
  TRICEP:     { back: ['tricep-l', 'tricep-r'] },
  CORE:       { front: ['core'] },
  UPPER_BACK: { back: ['traps', 'lat-l', 'lat-r'] },
  LOWER_BACK: { back: ['lback'] },
  QUAD:       { front: ['quad-l', 'quad-r'] },
  HAMSTRING:  { back: ['ham-l', 'ham-r'] },
  GLUTE:      { back: ['glute-l', 'glute-r'] },
  CALF:       { front: ['calf-f-l', 'calf-f-r'], back: ['calf-b-l', 'calf-b-r'] },
  KNEE:       { front: ['knee-l', 'knee-r'],     back: ['kneeb-l', 'kneeb-r'] },
}

// ── Colora le regioni ─────────────────────────────────────────────────────────

function getColor(
  id: string,
  view: 'front' | 'back',
  primary: Set<string>,
  secondary: Set<string>,
  complementary: Set<string>,
): string {
  if (primary.has(`${view}:${id}`)) return C.primary
  if (secondary.has(`${view}:${id}`)) return C.secondary
  if (complementary.has(`${view}:${id}`)) return C.complementary
  return C.inactive
}

function buildSets(districts: District[] = [], view: 'front' | 'back'): Set<string> {
  const s = new Set<string>()
  for (const d of districts) {
    const reg = REGIONS[d]
    if (!reg) continue
    const ids = view === 'front' ? reg.front : reg.back
    ids?.forEach(id => s.add(`${view}:${id}`))
  }
  return s
}

// ── SVG corpo frontale ────────────────────────────────────────────────────────
// viewBox="0 0 80 185" — testa in cima, piedi in fondo

function BodyFront({
  primary, secondary, complementary, uid,
}: {
  primary: Set<string>; secondary: Set<string>; complementary: Set<string>; uid: string
}) {
  const gc = (id: string) => getColor(id, 'front', primary, secondary, complementary)
  const clipId = `clip-front-${uid}`

  return (
    <svg viewBox="0 0 80 185" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Silhouette frontale */}
        <clipPath id={clipId}>
          <path d="
            M40,3 C34,3 31,7 31,13 C31,19 34,23 36,24
            L34,30 L22,30 L14,28 L10,34 L11,50 L14,70 L13,72 L11,108 L16,108 L17,70 L18,50
            L24,90 L26,90 L26,142 L24,142 L24,145 L24,178 L36,178 L36,145 L40,145
            L40,178 L44,178 L44,145 L54,145 L54,178 L56,178 L56,145 L54,142 L54,90 L56,90
            L62,50 L63,70 L64,108 L69,108 L67,72 L66,70 L69,50 L70,34 L66,28 L58,30 L46,24
            C49,23 49,19 49,13 C49,7 46,3 40,3 Z
          " />
        </clipPath>
      </defs>

      {/* Corpo di base */}
      <g clipPath={`url(#${clipId})`}>
        <rect width="80" height="185" fill={C.skin} />

        {/* SHOULDER front */}
        <path id="sh-f-l" d="M10,34 L22,30 L22,46 L12,44 Z" fill={gc('sh-f-l')} />
        <path id="sh-f-r" d="M58,30 L70,34 L68,44 L58,46 Z" fill={gc('sh-f-r')} />

        {/* CHEST */}
        <path id="chest-l" d="M24,30 L40,30 L40,54 L26,52 Z" fill={gc('chest-l')} />
        <path id="chest-r" d="M40,30 L56,30 L54,52 L40,54 Z" fill={gc('chest-r')} />

        {/* BICEP */}
        <path id="bicep-l" d="M12,46 L22,46 L20,70 L13,70 Z" fill={gc('bicep-l')} />
        <path id="bicep-r" d="M58,46 L68,44 L67,70 L60,70 Z" fill={gc('bicep-r')} />

        {/* CORE / ABS */}
        <rect id="core" x="26" y="54" width="28" height="34" rx="2" fill={gc('core')} />

        {/* QUAD */}
        <path id="quad-l" d="M26,90 L40,90 L40,142 L27,142 Z" fill={gc('quad-l')} />
        <path id="quad-r" d="M40,90 L54,90 L53,142 L40,142 Z" fill={gc('quad-r')} />

        {/* KNEE */}
        <rect id="knee-l" x="26" y="136" width="14" height="9" rx="1" fill={gc('knee-l')} />
        <rect id="knee-r" x="40" y="136" width="14" height="9" rx="1" fill={gc('knee-r')} />

        {/* CALF front */}
        <path id="calf-f-l" d="M26,145 L38,145 L37,177 L27,177 Z" fill={gc('calf-f-l')} />
        <path id="calf-f-r" d="M42,145 L54,145 L53,177 L43,177 Z" fill={gc('calf-f-r')} />
      </g>

      {/* Outline silhouette */}
      <path
        d="M40,3 C34,3 31,7 31,13 C31,19 34,23 36,24 L34,30 L22,30 L14,28 L10,34 L11,50 L14,70 L13,72 L11,108 L16,108 L17,70 L18,50 L24,90 L26,90 L26,142 L24,142 L24,145 L24,178 L36,178 L36,145 L40,145 L40,178 L44,178 L44,145 L54,145 L54,178 L56,178 L56,145 L54,142 L54,90 L56,90 L62,50 L63,70 L64,108 L69,108 L67,72 L66,70 L69,50 L70,34 L66,28 L58,30 L46,24 C49,23 49,19 49,13 C49,7 46,3 40,3 Z"
        stroke={C.outline}
        strokeWidth="1"
        fill="none"
      />

      {/* Separatore centrale (linea alba) */}
      <line x1="40" y1="30" x2="40" y2="88" stroke={C.outline} strokeWidth="0.5" />
    </svg>
  )
}

// ── SVG corpo posteriore ──────────────────────────────────────────────────────

function BodyBack({
  primary, secondary, complementary, uid,
}: {
  primary: Set<string>; secondary: Set<string>; complementary: Set<string>; uid: string
}) {
  const gc = (id: string) => getColor(id, 'back', primary, secondary, complementary)
  const clipId = `clip-back-${uid}`

  return (
    <svg viewBox="0 0 80 185" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={clipId}>
          <path d="
            M40,3 C34,3 31,7 31,13 C31,19 34,23 36,24
            L34,30 L22,30 L14,28 L10,34 L11,50 L14,70 L13,72 L11,108 L16,108 L17,70 L18,50
            L24,90 L26,90 L26,142 L24,142 L24,145 L24,178 L36,178 L36,145 L40,145
            L40,178 L44,178 L44,145 L54,145 L54,178 L56,178 L56,145 L54,142 L54,90 L56,90
            L62,50 L63,70 L64,108 L69,108 L67,72 L66,70 L69,50 L70,34 L66,28 L58,30 L46,24
            C49,23 49,19 49,13 C49,7 46,3 40,3 Z
          " />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect width="80" height="185" fill={C.skin} />

        {/* SHOULDER back */}
        <path id="sh-b-l" d="M10,34 L22,30 L22,46 L12,44 Z" fill={gc('sh-b-l')} />
        <path id="sh-b-r" d="M58,30 L70,34 L68,44 L58,46 Z" fill={gc('sh-b-r')} />

        {/* TRAPS */}
        <path id="traps" d="M26,30 L54,30 L52,46 L28,46 Z" fill={gc('traps')} />

        {/* LATS (upper back) */}
        <path id="lat-l" d="M24,46 L40,46 L40,72 L26,70 Z" fill={gc('lat-l')} />
        <path id="lat-r" d="M40,46 L56,46 L54,70 L40,72 Z" fill={gc('lat-r')} />

        {/* TRICEP */}
        <path id="tricep-l" d="M12,44 L22,46 L20,70 L13,70 Z" fill={gc('tricep-l')} />
        <path id="tricep-r" d="M58,46 L68,44 L67,70 L60,70 Z" fill={gc('tricep-r')} />

        {/* LOWER BACK */}
        <rect id="lback" x="28" y="70" width="24" height="18" rx="2" fill={gc('lback')} />

        {/* GLUTE */}
        <path id="glute-l" d="M26,90 L40,90 L40,114 L28,112 Z" fill={gc('glute-l')} />
        <path id="glute-r" d="M40,90 L54,90 L52,112 L40,114 Z" fill={gc('glute-r')} />

        {/* HAMSTRING */}
        <path id="ham-l" d="M26,114 L40,114 L40,142 L27,142 Z" fill={gc('ham-l')} />
        <path id="ham-r" d="M40,114 L54,114 L53,142 L40,142 Z" fill={gc('ham-r')} />

        {/* KNEE back */}
        <rect id="kneeb-l" x="26" y="136" width="14" height="9" rx="1" fill={gc('kneeb-l')} />
        <rect id="kneeb-r" x="40" y="136" width="14" height="9" rx="1" fill={gc('kneeb-r')} />

        {/* CALF back */}
        <path id="calf-b-l" d="M26,145 L38,145 L37,177 L27,177 Z" fill={gc('calf-b-l')} />
        <path id="calf-b-r" d="M42,145 L54,145 L53,177 L43,177 Z" fill={gc('calf-b-r')} />
      </g>

      <path
        d="M40,3 C34,3 31,7 31,13 C31,19 34,23 36,24 L34,30 L22,30 L14,28 L10,34 L11,50 L14,70 L13,72 L11,108 L16,108 L17,70 L18,50 L24,90 L26,90 L26,142 L24,142 L24,145 L24,178 L36,178 L36,145 L40,145 L40,178 L44,178 L44,145 L54,145 L54,178 L56,178 L56,145 L54,142 L54,90 L56,90 L62,50 L63,70 L64,108 L69,108 L67,72 L66,70 L69,50 L70,34 L66,28 L58,30 L46,24 C49,23 49,19 49,13 C49,7 46,3 40,3 Z"
        stroke={C.outline}
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

// ── Legenda ───────────────────────────────────────────────────────────────────

function Legend({ primary, secondary, complementary }: {
  primary: District[], secondary: District[], complementary: District[]
}) {
  const LABEL: Partial<Record<District, string>> = {
    CHEST: 'Petto', SHOULDER: 'Spalle', BICEP: 'Bicipiti', TRICEP: 'Tricipiti',
    CORE: 'Core', UPPER_BACK: 'Dorsali', LOWER_BACK: 'Lombari',
    QUAD: 'Quadricipiti', HAMSTRING: 'Bicipiti fem.', GLUTE: 'Glutei',
    CALF: 'Polpacci', KNEE: 'Ginocchio',
  }
  const entries: { label: string; color: string }[] = [
    ...primary.map(d => ({ label: LABEL[d] ?? d, color: C.primary })),
    ...secondary.map(d => ({ label: LABEL[d] ?? d, color: C.secondary })),
    ...complementary.map(d => ({ label: LABEL[d] ?? d, color: C.complementary })),
  ]
  if (!entries.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {entries.map(({ label, color }, i) => (
        <span key={i} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────────────────

let _uid = 0

export default function MuscleHeatmap({
  primaryMuscles = [],
  secondaryMuscles = [],
  complementaryMuscles = [],
  size = 'full',
  showLabels = true,
}: Props) {
  // uid stabile per clipPath IDs unici nel DOM
  const uid = String(++_uid)

  const frontPrimary      = buildSets(primaryMuscles,       'front')
  const frontSecondary    = buildSets(secondaryMuscles,     'front')
  const frontComplementary = buildSets(complementaryMuscles, 'front')
  const backPrimary       = buildSets(primaryMuscles,       'back')
  const backSecondary     = buildSets(secondaryMuscles,     'back')
  const backComplementary = buildSets(complementaryMuscles, 'back')

  const bodyW = size === 'compact' ? 60 : 90

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-3">
        {/* FRONT */}
        <div className="flex flex-col items-center gap-0.5">
          <div style={{ width: bodyW }}>
            <BodyFront
              primary={frontPrimary}
              secondary={frontSecondary}
              complementary={frontComplementary}
              uid={`f${uid}`}
            />
          </div>
          {size === 'full' && (
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-subtle)' }}>
              Fronte
            </span>
          )}
        </div>

        {/* BACK */}
        <div className="flex flex-col items-center gap-0.5">
          <div style={{ width: bodyW }}>
            <BodyBack
              primary={backPrimary}
              secondary={backSecondary}
              complementary={backComplementary}
              uid={`b${uid}`}
            />
          </div>
          {size === 'full' && (
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'var(--fg-subtle)' }}>
              Retro
            </span>
          )}
        </div>
      </div>

      {/* Legenda muscoli */}
      {showLabels && size === 'full' && (
        <Legend primary={primaryMuscles} secondary={secondaryMuscles} complementary={complementaryMuscles} />
      )}

      {/* Legenda colori (solo full) */}
      {size === 'full' && (primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
        <div className="flex items-center gap-3 mt-0.5">
          {primaryMuscles.length > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest" style={{ color: C.primary }}>
              <span className="w-2 h-2 rounded-full" style={{ background: C.primary }} /> Primari
            </span>
          )}
          {secondaryMuscles.length > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest" style={{ color: C.secondary }}>
              <span className="w-2 h-2 rounded-full" style={{ background: C.secondary }} /> Secondari
            </span>
          )}
          {complementaryMuscles.length > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest" style={{ color: C.complementary }}>
              <span className="w-2 h-2 rounded-full" style={{ background: C.complementary }} /> Complementari
            </span>
          )}
        </div>
      )}
    </div>
  )
}

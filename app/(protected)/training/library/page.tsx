import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { District, Equipment } from '@prisma/client'
import { Search, Dumbbell, ChevronDown, Languages, Info, Sparkles } from 'lucide-react'
import LibraryFilters from './LibraryFilters'
import ExerciseTranslator from './ExerciseTranslator'

const DISTRICT_LABELS: Record<District, string> = {
  QUAD:       'Quadricipiti',
  HAMSTRING:  'Femorali',
  GLUTE:      'Glutei',
  KNEE:       'Ginocchio',
  LOWER_BACK: 'Lombare',
  UPPER_BACK: 'Dorsali',
  SHOULDER:   'Spalle',
  CHEST:      'Petto',
  BICEP:      'Bicipiti',
  TRICEP:     'Tricipiti',
  CALF:       'Polpacci',
  CORE:       'Core',
}

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  BARBELL:         'Bilanciere',
  DUMBBELL:        'Manubri',
  CABLE:           'Cavi',
  MACHINE:         'Macchina',
  BODYWEIGHT:      'Corpo libero',
  KETTLEBELL:      'Kettlebell',
  RESISTANCE_BAND: 'Elastico',
  SMITH_MACHINE:   'Smith',
}

interface Props {
  searchParams: Promise<{ q?: string; district?: string; equipment?: string }>
}

export default async function ExerciseLibraryPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const q = params.q ?? ''
  const districtFilter = params.district as District | undefined
  const equipFilter = params.equipment as Equipment | undefined

  const exercises = await prisma.exerciseDefinition.findMany({
    where: {
      AND: [
        q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { nameIt: { contains: q, mode: 'insensitive' } }, { nameAlt: { contains: q, mode: 'insensitive' } }] } : {},
        districtFilter ? { OR: [{ primaryMuscles: { has: districtFilter } }, { secondaryMuscles: { has: districtFilter } }] } : {},
        equipFilter ? { equipment: equipFilter } : {},
      ]
    },
    orderBy: [{ isCompound: 'desc' }, { name: 'asc' }],
  })

  // Equipment colors using CSS vars for design-system consistency
  const equipColors: Record<string, string> = {
    BARBELL:         'bg-negative/10 text-negative border-negative/20',
    DUMBBELL:        'bg-accent/10 text-accent border-accent/20',
    CABLE:           'bg-accent2/10 text-accent2 border-accent2/20',
    MACHINE:         'bg-warning/10 text-warning border-warning/20',
    BODYWEIGHT:      'bg-positive/10 text-positive border-positive/20',
    KETTLEBELL:      'bg-positive/10 text-positive border-positive/20',
    RESISTANCE_BAND: 'bg-warning/10 text-warning border-warning/20',
    SMITH_MACHINE:   'bg-muted/10 text-muted border-border',
  }

  // District colors using CSS vars — semantic mapping per muscle group
  const districtColors: Record<string, string> = {
    QUAD:       'var(--warning)',
    HAMSTRING:  'var(--negative)',
    GLUTE:      'var(--accent2)',
    LOWER_BACK: 'var(--warning)',
    UPPER_BACK: 'var(--accent2)',
    SHOULDER:   'var(--accent)',
    CHEST:      'var(--positive)',
    BICEP:      'var(--accent)',
    TRICEP:     'var(--accent2)',
    CALF:       'var(--positive)',
    CORE:       'var(--warning)',
    KNEE:       'var(--fg-subtle)',
  }

  // Group by primary muscle (only when no district filter active)
  type ExDef = typeof exercises[0]
  const grouped: { district: District; label: string; color: string; items: ExDef[] }[] = []

  if (!districtFilter && !q && !equipFilter) {
    const DISTRICT_ORDER: District[] = ['CHEST', 'SHOULDER', 'TRICEP', 'BICEP', 'UPPER_BACK', 'LOWER_BACK', 'CORE', 'QUAD', 'HAMSTRING', 'GLUTE', 'CALF', 'KNEE']
    DISTRICT_ORDER.forEach(d => {
      const items = exercises.filter(ex => ex.primaryMuscles.includes(d))
      if (items.length > 0) grouped.push({ district: d, label: DISTRICT_LABELS[d], color: districtColors[d], items })
    })
    // Catch-all for exercises not in any group above
    const allGrouped = grouped.flatMap(g => g.items.map(i => i.id))
    const ungrouped = exercises.filter(ex => !allGrouped.includes(ex.id))
    if (ungrouped.length > 0) grouped.push({ district: 'CORE', label: 'Altri', color: 'var(--fg-muted)', items: ungrouped })
  }

  const renderExCard = (ex: ExDef, idx: number) => (
    <details
      key={ex.id}
      className="rounded-2xl overflow-hidden group transition-all"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        animationDelay: `${idx * 40}ms`,
      }}>
      <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none select-none">
        {/* Thumb or equipment icon */}
        {ex.mediaUrl
          ? <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-bg-elevated">
              <img src={ex.mediaUrl} alt={ex.nameIt || ex.name} className="w-full h-full object-cover" />
            </div>
          : <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${equipColors[ex.equipment]}`}>
              <Dumbbell className="w-5 h-5" />
            </div>
        }

        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate" style={{ color: 'var(--fg-primary)' }}>
            {ex.nameIt || ex.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide"
              style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
              {EQUIPMENT_LABELS[ex.equipment]}
            </span>
            {ex.isCompound && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                Multi
              </span>
            )}
          </div>
        </div>

        <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--fg-subtle)' }} />
      </summary>

      <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {/* Muscle chips */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {ex.primaryMuscles.map(m => (
            <span key={m} className="text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider"
              style={{ background: `color-mix(in srgb, ${districtColors[m]} 12%, transparent)`, color: districtColors[m] }}>
              {DISTRICT_LABELS[m]}
            </span>
          ))}
          {ex.secondaryMuscles.map(m => (
            <span key={m} className="text-[9px] font-medium px-2 py-1 rounded-lg uppercase tracking-wider"
              style={{ background: 'var(--bg-elevated)', color: 'var(--fg-subtle)' }}>
              {DISTRICT_LABELS[m]}
            </span>
          ))}
        </div>

        {(ex.descriptionIt || ex.description) && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
            {ex.descriptionIt || ex.description}
          </p>
        )}

        {(ex.tipsIt || ex.tips) && (
          <div className="px-3 py-2.5 rounded-xl"
            style={{ background: 'color-mix(in srgb, var(--positive) 8%, var(--bg-elevated))', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--positive)' }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--positive)' }}>Coach tip</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-primary)' }}>{ex.tipsIt || ex.tips}</p>
          </div>
        )}

        {ex.mediaUrls && ex.mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {ex.mediaUrls.slice(0, 2).map((url, i) => (
              <div key={i} className="rounded-xl overflow-hidden aspect-[4/3]">
                <img src={url} alt={`${ex.name} ${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  )

  return (
    <div className="max-w-2xl mx-auto pb-24">

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: 'var(--accent)' }}>
          Database
        </p>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>
            Libreria Esercizi
          </h1>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--fg-muted)' }}>
            {exercises.length}
          </span>
        </div>
      </div>

      {/* ExerciseTranslator */}
      <div className="px-4 mb-4">
        <ExerciseTranslator />
      </div>

      {/* Filters */}
      <div className="px-4 mb-5">
        <LibraryFilters
          districtLabels={DISTRICT_LABELS}
          equipmentLabels={EQUIPMENT_LABELS}
          activeDistrict={districtFilter}
          activeEquip={equipFilter}
          query={q}
        />
      </div>

      {/* Exercises */}
      {exercises.length === 0 ? (
        <div className="mx-4 text-center py-16 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)' }}>
          <Dumbbell className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--fg-subtle)', opacity: 0.4 }} />
          <p className="text-sm font-bold" style={{ color: 'var(--fg-muted)' }}>Nessun esercizio trovato.</p>
        </div>
      ) : grouped.length > 0 ? (
        /* Grouped view */
        <div className="px-4 space-y-6">
          {grouped.map(({ label, color, items }) => (
            <div key={label}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-5 rounded-full shrink-0" style={{ background: color }} />
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
                  {label}
                </p>
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--fg-subtle)' }}>
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((ex, idx) => renderExCard(ex, idx))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat search results */
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {exercises.map((ex, idx) => renderExCard(ex, idx))}
        </div>
      )}
    </div>
  )
}

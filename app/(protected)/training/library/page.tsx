import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { District, Equipment } from '@prisma/client'
import { Search, Dumbbell, ChevronDown } from 'lucide-react'
import LibraryFilters from './LibraryFilters'

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
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { nameAlt: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(districtFilter ? { OR: [{ primaryMuscles: { has: districtFilter } }, { secondaryMuscles: { has: districtFilter } }] } : {}),
      ...(equipFilter ? { equipment: equipFilter } : {}),
    },
    orderBy: [{ isCompound: 'desc' }, { name: 'asc' }],
  })

  const equipColors: Record<string, string> = {
    BARBELL: '#ef4444', DUMBBELL: '#3b82f6', CABLE: '#8b5cf6',
    MACHINE: '#f59e0b', BODYWEIGHT: '#10b981', KETTLEBELL: '#14b8a6',
    RESISTANCE_BAND: '#f97316', SMITH_MACHINE: '#64748b',
  }

  const districtColors: Record<string, string> = {
    QUAD: '#f59e0b', HAMSTRING: '#ef4444', GLUTE: '#ec4899',
    LOWER_BACK: '#f97316', UPPER_BACK: '#8b5cf6', SHOULDER: '#3b82f6',
    CHEST: '#10b981', BICEP: '#06b6d4', TRICEP: '#6366f1',
    CALF: '#84cc16', CORE: '#eab308', KNEE: '#94a3b8',
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent)' }}>Training</p>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>
            Libreria Esercizi
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
            {exercises.length} esercizi
          </p>
        </div>
      </div>

      {/* Filtri client-side */}
      <LibraryFilters
        districtLabels={DISTRICT_LABELS}
        equipmentLabels={EQUIPMENT_LABELS}
        activeDistrict={districtFilter}
        activeEquip={equipFilter}
        query={q}
      />

      {/* Grid esercizi */}
      {exercises.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)' }}>
          <Dumbbell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--fg-subtle)' }} />
          <p style={{ color: 'var(--fg-muted)' }}>Nessun esercizio trovato.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {exercises.map(ex => (
            <details
              key={ex.id}
              className="rounded-2xl overflow-hidden group"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none">
                {/* Equipment badge */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black"
                  style={{
                    background: `${equipColors[ex.equipment]}18`,
                    color: equipColors[ex.equipment],
                    border: `1px solid ${equipColors[ex.equipment]}30`,
                  }}>
                  {ex.equipment.slice(0, 2)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: 'var(--fg-primary)' }}>{ex.name}</p>
                    {ex.isCompound && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                        Compound
                      </span>
                    )}
                  </div>
                  {/* Primary muscles */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ex.primaryMuscles.map(m => (
                      <span key={m} className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                        style={{ background: `${districtColors[m]}15`, color: districtColors[m] }}>
                        {DISTRICT_LABELS[m]}
                      </span>
                    ))}
                    {ex.secondaryMuscles.slice(0, 2).map(m => (
                      <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-md"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--fg-subtle)' }}>
                        {DISTRICT_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </div>

                <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--fg-subtle)' }} />
              </summary>

              <div className="px-4 pb-4 pt-2 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span style={{ color: 'var(--fg-subtle)' }}>
                    <span className="font-bold" style={{ color: 'var(--fg-muted)' }}>Attrezzo:</span> {EQUIPMENT_LABELS[ex.equipment]}
                  </span>
                  <span style={{ color: 'var(--fg-subtle)' }}>
                    <span className="font-bold" style={{ color: 'var(--fg-muted)' }}>Livello:</span> {ex.difficulty}
                  </span>
                  {ex.nameAlt && (
                    <span style={{ color: 'var(--fg-subtle)' }}>aka <em>{ex.nameAlt}</em></span>
                  )}
                </div>
                {ex.description && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{ex.description}</p>
                )}
                {ex.tips && (
                  <div className="text-xs leading-relaxed p-3 rounded-xl"
                    style={{ background: 'var(--accent-dim)', color: 'var(--fg-muted)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                    <span className="font-bold block mb-1" style={{ color: 'var(--accent)' }}>Tecnica</span>
                    {ex.tips}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

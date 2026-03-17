import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { District, Equipment } from '@prisma/client'
import { Search, Dumbbell, ChevronDown, Languages, Info } from 'lucide-react'
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest mb-1 text-accent">Database</p>
          <h1 className="text-4xl font-black tracking-tight text-primary">
            Libreria Esercizi
          </h1>
          <p className="mt-1 text-muted font-medium">
            {exercises.length} movimenti catalogati per la tua performance.
          </p>
        </div>
      </div>

      <ExerciseTranslator />

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
        <div className="text-center py-20 rounded-3xl bg-surface border border-border-subtle border-dashed">
          <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted opacity-20" />
          <p className="text-muted font-medium">Nessun esercizio trovato per questi filtri.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exercises.map(ex => (
            <details
              key={ex.id}
              className="rounded-3xl overflow-hidden group transition-all duration-300 border border-border-subtle hover:border-border"
              style={{ background: 'var(--bg-surface)' }}
            >
              <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer list-none select-none">
                {/* Equipment badge */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-[10px] font-black shadow-lg border ${equipColors[ex.equipment]}`}>
                  <Dumbbell className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-base text-primary group-hover:text-accent transition-colors">
                      {ex.nameIt || ex.name}
                    </p>
                    {ex.isCompound && (
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                        Multiarticolare
                      </span>
                    )}
                  </div>
                  {/* Primary muscles */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {ex.primaryMuscles.map(m => (
                      <span key={m} className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                        style={{ background: `${districtColors[m]}15`, color: districtColors[m] }}>
                        {DISTRICT_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2 rounded-xl text-muted group-hover:bg-accent/10 group-hover:text-accent transition-all" style={{ background: 'var(--border-subtle)' }}>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" />
                </div>
              </summary>

              <div className="px-6 pb-6 pt-2 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="h-px w-full bg-border-subtle" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl bg-base border border-border-subtle">
                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest mb-1">Attrezzatura</p>
                    <p className="text-xs font-bold text-primary">{EQUIPMENT_LABELS[ex.equipment]}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-base border border-border-subtle">
                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest mb-1">Livello</p>
                    <p className="text-xs font-bold text-primary">{ex.difficulty}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Info className="w-4 h-4 text-accent" />
                    Esecuzione
                  </div>
                  <p className="text-xs leading-relaxed text-muted bg-base p-4 rounded-2xl border border-border-subtle">
                    {ex.descriptionIt || ex.description || "Nessuna istruzione dettagliata disponibile."}
                  </p>
                </div>

                {(ex.tipsIt || ex.tips) && (
                  <div className="text-xs leading-relaxed p-4 rounded-2xl bg-positive/5 border border-positive/20">
                    <span className="font-bold block mb-2 text-positive uppercase tracking-widest text-[10px]">Coach Tips</span>
                    <span className="text-primary opacity-80">{ex.tipsIt || ex.tips}</span>
                  </div>
                )}

                {ex.mediaUrls && ex.mediaUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {ex.mediaUrls.map((url, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden border border-border aspect-[3/4] relative group/img" style={{ background: 'var(--bg-base)' }}>
                        <img src={url} alt={`${ex.name} ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--fg-primary)' }}>
                          Pos. {i === 0 ? 'Start' : 'End'}
                        </div>
                      </div>
                    ))}
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

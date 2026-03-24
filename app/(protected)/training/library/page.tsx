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

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-24 animate-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 stagger">
        <div>
          <p className="divider-label mb-2">Database</p>
          <h1 className="text-5xl font-black tracking-tighter text-accent-gradient">
            Libreria Esercizi
          </h1>
          <p className="mt-2 text-fg-muted font-bold text-sm opacity-60">
            <span className="num text-accent">{exercises.length}</span> movimenti catalogati per la tua performance.
          </p>
        </div>
      </div>

      <div className="animate-rise-up" style={{ animationDelay: '100ms' }}>
        <ExerciseTranslator />
      </div>

      {/* Filtri client-side */}
      <div className="animate-rise-up" style={{ animationDelay: '200ms' }}>
        <LibraryFilters
          districtLabels={DISTRICT_LABELS}
          equipmentLabels={EQUIPMENT_LABELS}
          activeDistrict={districtFilter}
          activeEquip={equipFilter}
          query={q}
        />
      </div>

      {/* Grid esercizi */}
      {exercises.length === 0 ? (
        <div className="text-center py-24 rounded-[3rem] glass-sm border border-border/50 border-dashed mesh-bg animate-blur-in">
          <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mx-auto mb-6 opacity-20">
            <Dumbbell className="w-10 h-10" />
          </div>
          <p className="text-fg-muted font-black tracking-tight uppercase text-xs opacity-50">Nessun esercizio trovato per questi filtri.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 stagger">
          {exercises.map((ex, idx) => (
            <details
              key={ex.id}
              className="rounded-[2.5rem] overflow-hidden group transition-all duration-500 card-interactive surface-accent"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <summary className="flex items-center gap-5 px-6 py-5 cursor-pointer list-none select-none">
                {/* Equipment badge */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 transition-transform group-hover:scale-110 ${equipColors[ex.equipment]}`}>
                  <Dumbbell className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-black text-lg text-primary tracking-tight group-hover:text-accent transition-colors">
                      {ex.nameIt || ex.name}
                    </p>
                    {ex.isCompound && (
                      <span className="badge badge-accent scale-90 origin-left animate-glow-breathe">
                        Multiarticolare
                      </span>
                    )}
                  </div>
                  {/* Primary muscles */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ex.primaryMuscles.map(m => (
                      <span key={m} className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border"
                        style={{ background: `${districtColors[m]}15`, color: districtColors[m], borderColor: `${districtColors[m]}30` }}>
                        {DISTRICT_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-10 h-10 rounded-2xl glass-sm flex items-center justify-center text-fg-subtle group-hover:btn-primary transition-all">
                  <ChevronDown className="w-5 h-5 shrink-0 transition-transform group-open:rotate-180" />
                </div>
              </summary>

              <div className="px-6 pb-8 pt-2 space-y-6 animate-blur-in">
                <div className="h-px w-full bg-border-subtle" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-[1.5rem] glass-sm surface-accent border border-border/40">
                    <p className="text-[10px] uppercase font-black text-fg-subtle tracking-widest mb-1.5 opacity-60">Attrezzatura</p>
                    <p className="text-sm font-black text-primary tracking-tight">{EQUIPMENT_LABELS[ex.equipment]}</p>
                  </div>
                  <div className="p-4 rounded-[1.5rem] glass-sm surface-accent border border-border/40">
                    <p className="text-[10px] uppercase font-black text-fg-subtle tracking-widest mb-1.5 opacity-60">Livello</p>
                    <p className="text-sm font-black text-primary tracking-tight">{ex.difficulty}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="divider-label text-[9px]">Esecuzione Tecnica</div>
                  <div className="text-xs leading-relaxed text-fg-muted glass-sm p-5 rounded-[2rem] border border-border/40 italic opacity-80">
                    {ex.descriptionIt || ex.description || "Nessuna istruzione dettagliata disponibile."}
                  </div>
                </div>

                {(ex.tipsIt || ex.tips) && (
                  <div className="text-xs leading-relaxed p-5 rounded-[2rem] surface-accent border border-positive/30 relative overflow-hidden mesh-bg">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-positive" />
                      <span className="font-black uppercase tracking-widest text-[10px] text-positive">Coach Insights</span>
                    </div>
                    <span className="text-fg-primary font-bold opacity-80 leading-relaxed block">{ex.tipsIt || ex.tips}</span>
                  </div>
                )}

                {ex.mediaUrls && ex.mediaUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {ex.mediaUrls.map((url, i) => (
                      <div key={i} className="rounded-[2rem] overflow-hidden border-2 border-border/50 aspect-[3/4] relative group/img glass-heavy shadow-2xl">
                        <img src={url} alt={`${ex.name} ${i}`} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest glass shadow-xl" style={{ color: 'var(--fg-primary)' }}>
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

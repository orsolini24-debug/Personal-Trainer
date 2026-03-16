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
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest mb-1 text-[#3b82f6]">Database</p>
          <h1 className="text-4xl font-black tracking-tight text-[#f1f5f9]">
            Libreria Esercizi
          </h1>
          <p className="mt-1 text-[#64748b] font-medium">
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
        <div className="text-center py-20 rounded-3xl bg-[#111118] border border-white/5 border-dashed">
          <Dumbbell className="w-16 h-16 mx-auto mb-4 text-[#64748b] opacity-20" />
          <p className="text-[#64748b] font-medium">Nessun esercizio trovato per questi filtri.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exercises.map(ex => (
            <details
              key={ex.id}
              className="rounded-3xl overflow-hidden group transition-all duration-300 border border-white/5 hover:border-white/10"
              style={{ background: 'var(--bg-surface)' }}
            >
              <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer list-none select-none">
                {/* Equipment badge */}
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-[10px] font-black shadow-lg"
                  style={{
                    background: `${equipColors[ex.equipment]}15`,
                    color: equipColors[ex.equipment],
                    border: `1px solid ${equipColors[ex.equipment]}30`,
                  }}>
                  <Dumbbell className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-base text-[#f1f5f9] group-hover:text-[#3b82f6] transition-colors">
                      {ex.nameIt || ex.name}
                    </p>
                    {ex.isCompound && (
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">
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

                <div className="p-2 rounded-xl bg-white/5 text-[#64748b] group-hover:bg-[#3b82f6]/10 group-hover:text-[#3b82f6] transition-all">
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" />
                </div>
              </summary>

              <div className="px-6 pb-6 pt-2 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="h-px w-full bg-white/5" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl bg-[#0a0a0f] border border-white/5">
                    <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-widest mb-1">Attrezzatura</p>
                    <p className="text-xs font-bold text-[#f1f5f9]">{EQUIPMENT_LABELS[ex.equipment]}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0a0a0f] border border-white/5">
                    <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-widest mb-1">Livello</p>
                    <p className="text-xs font-bold text-[#f1f5f9]">{ex.difficulty}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#f1f5f9] font-bold text-sm">
                    <Info className="w-4 h-4 text-[#3b82f6]" />
                    Esecuzione
                  </div>
                  <p className="text-xs leading-relaxed text-[#94a3b8] bg-[#0a0a0f] p-4 rounded-2xl border border-white/5">
                    {ex.descriptionIt || ex.description || "Nessuna istruzione dettagliata disponibile."}
                  </p>
                </div>

                {ex.tipsIt || ex.tips && (
                  <div className="text-xs leading-relaxed p-4 rounded-2xl bg-[#10b981]/5 border border-[#10b981]/20">
                    <span className="font-bold block mb-2 text-[#10b981] uppercase tracking-widest text-[10px]">Coach Tips</span>
                    <span className="text-[#f1f5f9] opacity-80">{ex.tipsIt || ex.tips}</span>
                  </div>
                )}

                {ex.mediaUrls && ex.mediaUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {ex.mediaUrls.map((url, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden border border-white/10 aspect-[3/4] bg-black/40 relative group/img">
                        <img src={url} alt={`${ex.name} ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[8px] font-black text-white uppercase tracking-widest">
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

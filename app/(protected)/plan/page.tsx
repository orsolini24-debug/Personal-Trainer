import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format, addDays, startOfWeek } from "date-fns"
import { it } from "date-fns/locale"
import { 
  Calendar as CalendarIcon, CheckCircle2, Flag, 
  Milestone, Target, Dumbbell, Sparkles, Archive,
  ArrowRight, Info, AlertTriangle, PlayCircle,
  Utensils, Zap, BookOpen, Settings2
} from "lucide-react"
import AIPanButton from "./AIPanButton"
import ProposalSelector from "./ProposalSelector"
import PlanImportButton from "./PlanImportButton"
import { MesoStatus } from "@prisma/client"
import Link from "next/link"

export default async function PlanPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  // 1. Fetch Draft (Proposal)
  const draftMeso = await prisma.mesocycle.findFirst({
    where: { userId, status: MesoStatus.DRAFT },
    orderBy: { createdAt: 'desc' }
  })

  // 2. Fetch Active Mesocycle
  const activeMeso = await prisma.mesocycle.findFirst({
    where: { userId, status: MesoStatus.ACTIVE },
    include: {
      workoutPlans: {
        include: {
          planDays: {
            include: { planExercises: { orderBy: { orderIndex: 'asc' } } },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' }
  })

  // 3. Fetch Archive
  const archivedMesos = await prisma.mesocycle.findMany({
    where: { userId, status: { in: [MesoStatus.ARCHIVED, MesoStatus.COMPLETED] } },
    orderBy: { endDate: 'desc' },
    take: 10
  })

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 px-4 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#3b82f6] mb-1">Centro di Preparazione</p>
          <h1 className="text-4xl font-black tracking-tight text-primary">Plan Manager</h1>
        </div>
        <div className="flex items-center gap-3">
          {!activeMeso && !draftMeso && <AIPanButton label="Nuova Programmazione" />}
          <PlanImportButton />
          <a href="#archive" className="p-3 rounded-2xl bg-foreground/5 text-muted hover:text-primary transition-all border border-subtle group" title="Vai all'Archivio">
            <Archive className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>

      {/* ── PROPOSALS SECTION (If Draft Exists) ── */}
      {draftMeso && draftMeso.aiProposals && (
        <section className="bg-surface/50 rounded-[3rem] p-8 border border-[#3b82f6]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
            <Sparkles className="w-64 h-64 text-[#3b82f6]" />
          </div>
          <ProposalSelector mesoId={draftMeso.id} proposals={draftMeso.aiProposals as any} />
        </section>
      )}

      {/* ── ACTIVE MESOCYCLE ── */}
      {activeMeso ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Plan Card */}
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-surface rounded-[2.5rem] p-8 border border-subtle relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                <Target className="w-64 h-64" />
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center shadow-lg border border-[#3b82f6]/20">
                      <PlayCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-[10px] font-black uppercase tracking-widest border border-[#3b82f6]/20">
                        In Corso
                      </span>
                      <h2 className="text-3xl font-black text-primary mt-1">{activeMeso.name}</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Timeline</p>
                    <p className="text-sm font-bold text-primary">{format(new Date(activeMeso.startDate), "dd MMM")} — {activeMeso.endDate ? format(new Date(activeMeso.endDate), "dd MMM") : '4 sett.'}</p>
                  </div>
                </div>
                
                <div className="bg-base p-6 rounded-3xl border border-subtle mb-8">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#3b82f6] flex items-center gap-2">
                      <Info className="w-4 h-4" /> Focus Tecnico
                    </h3>
                    <button className="text-[10px] font-bold text-muted hover:text-primary flex items-center gap-1">
                      <Settings2 className="w-3 h-3" /> Modifica
                    </button>
                  </div>
                  <p className="text-[#94a3b8] text-sm leading-relaxed italic">{activeMeso.objectives}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeMeso.workoutPlans[0]?.planDays.map(pd => (
                    <div key={pd.id} className="bg-base p-5 rounded-[2rem] border border-subtle hover:border-[#3b82f6]/30 transition-all group/card">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center font-black text-[#3b82f6] group-hover/card:bg-[#3b82f6] group-hover/card:text-white transition-all">
                          {pd.dayLabel}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover/card:opacity-100 transition-all" />
                      </div>
                      <p className="font-black text-primary mb-1">{pd.focus}</p>
                      <p className="text-[10px] text-muted uppercase font-bold tracking-tighter mb-4">{pd.planExercises.length} Esercizi</p>
                      <div className="space-y-1.5 opacity-60 group-hover/card:opacity-100 transition-opacity">
                        {pd.planExercises.slice(0, 3).map(pe => (
                          <p key={pe.id} className="text-[10px] text-[#94a3b8] truncate flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#3b82f6]" /> {pe.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Side Content: Nutrition & KPIs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Nutritional Strategy Section */}
            <section className="bg-surface rounded-[2.5rem] p-6 border border-subtle group hover:border-[#10b981]/30 transition-all">
              <h2 className="text-lg font-black text-primary mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#10b981]/10 text-[#10b981]">
                  <Utensils className="w-4 h-4" />
                </div>
                Piano Alimentare
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-base border border-subtle">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Target Proteico</p>
                  <p className="text-2xl font-black text-primary">160g <span className="text-sm font-medium opacity-50">/ giorno</span></p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-base border border-subtle">
                    <p className="text-[10px] font-black text-[#3b82f6] uppercase mb-1">Allenamento</p>
                    <p className="text-lg font-black text-primary">2500 <span className="text-[10px] opacity-50">kcal</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-base border border-subtle">
                    <p className="text-[10px] font-black text-[#f59e0b] uppercase mb-1">Riposo</p>
                    <p className="text-lg font-black text-primary">2000 <span className="text-[10px] opacity-50">kcal</span></p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-foreground/5 border border-dashed border-default text-xs text-[#94a3b8] italic leading-relaxed">
                  "Priorità a carboidrati complessi pre-match e idratazione elettrolitica durante le sessioni outdoor."
                </div>
              </div>
            </section>

            {/* Performance Roadmap */}
            <section className="bg-surface rounded-[2.5rem] p-6 border border-subtle">
              <h2 className="text-lg font-black text-primary mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b]">
                  <Milestone className="w-4 h-4" />
                </div>
                Roadmap
              </h2>
              <div className="relative pl-6 border-l-2 border-subtle space-y-8">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#10b981] ring-8 ring-surface"></div>
                  <p className="text-[10px] text-[#10b981] font-black uppercase mb-1">Sett 1-2</p>
                  <p className="text-sm font-bold text-primary">Adattamento & Tecnica</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#3b82f6] ring-8 ring-surface animate-pulse"></div>
                  <p className="text-[10px] text-[#3b82f6] font-black uppercase mb-1">Sett 3</p>
                  <p className="text-sm font-bold text-primary">Peak Volume</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : !draftMeso && (
        <section className="bg-surface rounded-[3rem] p-12 border border-subtle text-center border-dashed group hover:border-[#3b82f6]/30 transition-all duration-700">
          <div className="w-20 h-20 rounded-3xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-primary mb-3">Nessuna Programmazione Attiva</h2>
          <p className="text-muted max-w-sm mx-auto mb-8 leading-relaxed font-medium">L'AI genererà 3 proposte strategiche basate sui tuoi sport primari e i tuoi obiettivi di performance.</p>
          <AIPanButton label="Genera Strategie AI" />
        </section>
      )}

      {/* ── ARCHIVE & HISTORY ── */}
      <div id="archive" className="pt-10 border-t border-subtle scroll-mt-20">
        <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-3">
          <Archive className="w-5 h-5 text-muted" /> Archivio Mesocicli
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedMesos.length === 0 ? (
            <div className="col-span-full p-12 rounded-[2rem] bg-surface border border-subtle text-center flex flex-col items-center justify-center">
              <BookOpen className="w-10 h-10 text-muted opacity-20 mb-4" />
              <p className="text-muted font-medium text-sm">Il tuo storico dei progressi apparirà qui.</p>
            </div>
          ) : (
            archivedMesos.map(m => (
              <Link key={m.id} href={`/plan/${m.id}`}>
                <div className="p-6 bg-surface rounded-[2rem] border border-subtle flex justify-between items-center group hover:bg-white/[0.02] transition-all cursor-pointer h-full">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-muted shrink-0 group-hover:bg-[#3b82f6]/10 group-hover:text-[#3b82f6] transition-all">
                      <Archive className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-primary truncate">{m.name}</p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">
                        {format(new Date(m.startDate), "MMM yyyy", { locale: it })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import {
  Milestone, Target, Sparkles, Archive,
  ArrowRight, Info, PlayCircle,
  Utensils, BookOpen, Settings2
} from "lucide-react"
import AIPanButton from "./AIPanButton"
import ProposalSelector from "./ProposalSelector"
import PlanImportButton from "./PlanImportButton"
import PlanWizard from "./PlanWizard"
import { MesoStatus } from "@prisma/client"
import Link from "next/link"
import OnboardingWizard from "@/app/(protected)/onboarding/OnboardingWizard"
import CoachInsights from "./CoachInsights"
import NutritionPlanSection from "./NutritionPlanSection"
import WeeklyCalendar from "@/app/components/WeeklyCalendar"
import { getWeekCalendarData } from "@/app/actions/plans"

export default async function PlanPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  // Check DB for the most up-to-date status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true }
  })

  const onboardingCompleted = user?.onboardingCompleted || false

  // 1. Fetch Draft (Proposal)
  const draftMeso = await prisma.mesocycle.findFirst({
    where: { userId, status: MesoStatus.DRAFT },
    orderBy: { createdAt: 'desc' }
  })

  // 2. Fetch Active Training Mesocycle (excludes NUTRITION_ONLY)
  const activeMeso = await prisma.mesocycle.findFirst({
    where: { userId, status: MesoStatus.ACTIVE, NOT: { planType: 'NUTRITION_ONLY' } },
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

  // 2b. Fetch Active Nutrition Plan (NUTRITION_ONLY)
  const activeNutritionMeso = await prisma.mesocycle.findFirst({
    where: { userId, status: MesoStatus.ACTIVE, planType: 'NUTRITION_ONLY' },
    orderBy: { startDate: 'desc' }
  })

  // 2c. Fetch current week sessions for calendar
  const todayMonday = (() => {
    const d = new Date()
    const day = d.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setUTCDate(d.getUTCDate() + diff)
    return d.toISOString().split('T')[0]
  })()
  const weekSessions = await getWeekCalendarData(todayMonday)

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
          <p className="text-sm font-black uppercase tracking-[0.2em] text-accent mb-1">Centro di Preparazione</p>
          <h1 className="text-4xl font-black tracking-tight text-primary">Plan Manager</h1>
        </div>
        {!onboardingCompleted ? null : (
          <div className="flex items-center gap-3">
            <AIPanButton label="Nuova Programmazione" />
            <PlanImportButton />
            <a href="#archive" className="p-3 rounded-2xl bg-elevated text-muted hover:text-primary transition-all border border-border group" title="Vai all'Archivio">
              <Archive className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        )}
      </div>

      {!onboardingCompleted ? (
        <section className="bg-surface rounded-[3rem] p-8 md:p-12 border border-accent/20 relative overflow-hidden">
          <OnboardingWizard embedded={true} userName={session.user.name || undefined} />
        </section>
      ) : (
        <>
          {/* ── PROPOSALS SECTION (If Draft Exists) ── */}
          {draftMeso && draftMeso.aiProposals && (
            <section className="bg-surface/50 rounded-[3rem] p-8 border border-accent/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                <Sparkles className="w-64 h-64 text-accent" />
              </div>
              <ProposalSelector mesoId={draftMeso.id} proposals={draftMeso.aiProposals as any} />
            </section>
          )}

          {/* ── COACH INSIGHTS (AI ADAPTATION) ── */}
          {activeMeso && (
            <CoachInsights mesoId={activeMeso.id} />
          )}

          {/* ── ACTIVE MESOCYCLE ── */}
          {activeMeso ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <section className="bg-surface rounded-[2.5rem] p-8 border border-border relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                    <Target className="w-64 h-64" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-lg border border-accent/20">
                          <PlayCircle className="w-8 h-8" />
                        </div>
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20">
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

                    <div className="bg-base p-6 rounded-3xl border border-border mb-8">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                          <Info className="w-4 h-4" /> Focus Tecnico
                        </h3>
                        <button className="text-[10px] font-bold text-muted hover:text-primary flex items-center gap-1">
                          <Settings2 className="w-3 h-3" /> Modifica
                        </button>
                      </div>
                      <p className="text-subtle text-sm leading-relaxed italic">{activeMeso.objectives}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeMeso.workoutPlans[0]?.planDays.map(pd => (
                        <Link
                          key={pd.id}
                          href={`/plan/day/${pd.id}`}
                          className="bg-base p-5 rounded-[2rem] border border-border hover:border-accent/30 transition-all group/card cursor-pointer block"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center font-black text-accent group-hover/card:bg-accent group-hover/card:text-white transition-all">
                              {pd.dayLabel}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-accent opacity-0 group-hover/card:opacity-100 transition-all uppercase tracking-widest">Inizia Sessione</span>
                              <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover/card:opacity-100 transition-all" />
                            </div>
                          </div>
                          <p className="font-black text-primary mb-1">{pd.focus}</p>
                          <p className="text-[10px] text-muted uppercase font-bold tracking-tighter mb-4">{pd.planExercises.length} Esercizi</p>
                          <div className="space-y-1.5 opacity-60 group-hover/card:opacity-100 transition-opacity">
                            {pd.planExercises.slice(0, 3).map(pe => (
                              <p key={pe.id} className="text-[10px] text-subtle truncate flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-accent inline-block" /> {pe.name}
                              </p>
                            ))}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* Side Content */}
              <div className="lg:col-span-4 space-y-6">
                <WeeklyCalendar
                  planId={activeMeso.workoutPlans[0]?.id}
                  initialSessions={weekSessions}
                />
                <NutritionPlanSection activeNutritionMeso={activeNutritionMeso} />

                <section className="bg-surface rounded-[2.5rem] p-6 border border-border">
                  <h2 className="text-lg font-black text-primary mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-warning/10 text-warning">
                      <Milestone className="w-4 h-4" />
                    </div>
                    Roadmap
                  </h2>
                  <div className="p-4 rounded-2xl bg-base border border-border text-center">
                    <p className="text-sm text-muted italic">
                      La roadmap dettagliata sarà disponibile prossimamente.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          ) : !draftMeso && (
            <section className="bg-surface rounded-[3rem] p-8 md:p-12 border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                <Sparkles className="w-64 h-64 text-accent" />
              </div>
              <div className="relative z-10">
                <PlanWizard />
              </div>
            </section>
          )}

          {/* Archive */}
          <div id="archive" className="pt-10 border-t border-border scroll-mt-20">
            <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-3">
              <Archive className="w-5 h-5 text-muted" /> Archivio Mesocicli
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedMesos.length === 0 ? (
                <div className="col-span-full p-12 rounded-[2rem] bg-surface border border-border text-center flex flex-col items-center justify-center">
                  <BookOpen className="w-10 h-10 text-muted opacity-20 mb-4" />
                  <p className="text-muted font-medium text-sm">Il tuo storico dei progressi apparirà qui.</p>
                </div>
              ) : (
                archivedMesos.map(m => (
                  <Link key={m.id} href={`/plan/${m.id}`}>
                    <div className="p-6 bg-surface rounded-[2rem] border border-border flex justify-between items-center group hover:bg-elevated transition-all cursor-pointer h-full">
                      <div className="flex items-center gap-4 min-w-0">
                        <Archive className="w-6 h-6 text-muted shrink-0" />
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
        </>
      )}
    </div>
  )
}

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
import MesoSettings from "./MesoSettings"
import BulkDeleteButton from "./BulkDeleteButton"
import type { PlanDayOption } from "@/app/components/WeeklyCalendar"
import { getWeekCalendarData } from "@/app/actions/plans"
import PlanChat from "./PlanChat"

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

  // 2. Fetch Active Training Mesocycle (excludes NUTRITION_ONLY, includes null planType)
  const activeMeso = await prisma.mesocycle.findFirst({
    where: {
      userId,
      status: MesoStatus.ACTIVE,
      OR: [{ planType: null }, { planType: 'TRAINING_ONLY' }, { planType: 'FULL' }]
    },
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
  let activeNutritionMeso = await prisma.mesocycle.findFirst({
    where: { userId, status: MesoStatus.ACTIVE, planType: 'NUTRITION_ONLY' },
    orderBy: { startDate: 'desc' }
  })

  // Se non c'è un piano di sola nutrizione, ma quello di allenamento è FULL, usiamo quello per la visualizzazione dieta
  if (!activeNutritionMeso && activeMeso?.planType === 'FULL') {
    activeNutritionMeso = activeMeso
  }

  // 2c. Fetch current week sessions for calendar
  const todayMonday = (() => {
    const d = new Date()
    const day = d.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setUTCDate(d.getUTCDate() + diff)
    return d.toISOString().split('T')[0]
  })()
  const weekSessions = await getWeekCalendarData(todayMonday)

  // 2d. Build plan day options for the calendar picker
  const planDaysForCalendar: PlanDayOption[] = activeMeso?.workoutPlans[0]?.planDays.map(pd => ({
    id: pd.id,
    dayLabel: pd.dayLabel,
    focus: pd.focus,
    exerciseCount: pd.planExercises.length,
  })) ?? []

  // 3. Fetch Archive
  const archivedMesos = await prisma.mesocycle.findMany({
    where: { userId, status: { in: [MesoStatus.ARCHIVED, MesoStatus.COMPLETED] } },
    orderBy: { endDate: 'desc' },
    take: 10
  })

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 px-4 animate-page">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 stagger">
        <div>
          <p className="divider-label mb-2">Centro di Preparazione</p>
          <h1 className="text-5xl font-black tracking-tighter text-accent-gradient">Plan Manager</h1>
        </div>
        {/* Mostra i pulsanti di azione solo quando l'onboarding è completato,
            per evitare che le overlay coprano i wizard di configurazione */}
        {onboardingCompleted && (
          <div className="flex items-center gap-3">
            <AIPanButton label="Nuova Programmazione" />
            <PlanImportButton />
            <a href="#archive" className="tap-target rounded-2xl glass-sm text-fg-muted hover:text-accent transition-all border border-border group" title="Vai all'Archivio">
              <Archive className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        )}
      </div>

      {!onboardingCompleted ? (
        <section className="bg-surface rounded-[3.5rem] p-10 md:p-14 border border-accent/20 relative overflow-hidden mesh-bg animate-glow-breathe">
          <OnboardingWizard embedded={true} userName={session.user.name || undefined} />
        </section>
      ) : (
        <>
          {/* ── PROPOSALS SECTION (If Draft Exists) ── */}
          {draftMeso && draftMeso.aiProposals && (
            <div className="space-y-10 animate-rise-up">
              <section className="bg-surface/50 rounded-[3rem] p-8 border border-accent/30 relative overflow-hidden glass-heavy">
                <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none animate-glow-breathe">
                  <Sparkles className="w-64 h-64 text-accent" />
                </div>
                <ProposalSelector mesoId={draftMeso.id} proposals={draftMeso.aiProposals as any} />
              </section>
            </div>
          )}

          {/* ── ACTIVE PLAN DASHBOARD (Training or Nutrition) ── */}
          {(activeMeso || activeNutritionMeso) ? (
            <div className="space-y-10">
              
              {/* ── COACH INSIGHTS (AI ADAPTATION) ── */}
              {activeMeso && (
                <div className="animate-rise-up" style={{ animationDelay: '100ms' }}>
                  <CoachInsights mesoId={activeMeso.id} />
                </div>
              )}

              {/* ── Full-width Weekly Calendar (Solo se c'è allenamento) ── */}
              {activeMeso && (
                <div className="animate-rise-up" style={{ animationDelay: '200ms' }}>
                  <WeeklyCalendar
                    planId={activeMeso.workoutPlans[0]?.id}
                    planDays={planDaysForCalendar}
                    initialSessions={weekSessions}
                    initialTrainingDays={activeMeso.workoutPlans[0]?.trainingDays || []}
                  />
                </div>
              )}

              {/* ── Main Content Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10 animate-rise-up" style={{ animationDelay: '300ms' }}>
                  
                  {/* 1. Training Section (Se esiste) */}
                  {activeMeso && (
                    <section className="rounded-[3rem] p-10 card-elevated mesh-bg border border-border relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.04] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-1000">
                        <Target className="w-72 h-72" />
                      </div>

                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl btn-primary flex items-center justify-center glow-accent">
                              <PlayCircle className="w-10 h-10" />
                            </div>
                            <div>
                              <span className="badge badge-accent mb-1.5 animate-glow-breathe">
                                Allenamento Attivo
                              </span>
                              <h2 className="text-4xl font-black text-primary tracking-tighter leading-none">{activeMeso.name}</h2>
                            </div>
                          </div>
                          <div className="text-right glass-sm p-4 rounded-2xl border border-border/50">
                            <p className="text-[10px] font-black uppercase text-fg-subtle tracking-widest mb-1.5">Timeline</p>
                            <p className="text-sm font-black text-primary num tracking-tight">
                              {format(new Date(activeMeso.startDate), "dd MMM")} — {activeMeso.endDate ? format(new Date(activeMeso.endDate), "dd MMM") : '4 sett.'}
                            </p>
                          </div>
                        </div>

                        <div className="glass-sm p-6 rounded-[2rem] border border-border/40 mb-10 surface-accent">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                              <Info className="w-4 h-4" /> Focus Tecnico
                            </h3>
                            <MesoSettings mesoId={activeMeso.id} mesoName={activeMeso.name} />
                          </div>
                          <p className="text-fg-muted text-sm leading-relaxed italic opacity-80">{activeMeso.objectives}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {activeMeso.workoutPlans[0]?.planDays.map((pd, idx) => (
                            <Link
                              key={pd.id}
                              href={`/plan/day/${pd.id}`}
                              className="p-6 rounded-[2.5rem] card-interactive surface-accent group/card"
                            >
                              <div className="flex justify-between items-start mb-5">
                                <div className="w-12 h-12 rounded-2xl glass-sm flex items-center justify-center font-black text-accent group-hover/card:btn-primary group-hover/card:text-white transition-all shadow-md">
                                  {pd.dayLabel}
                                </div>
                                <ArrowRight className="w-5 h-5 text-accent opacity-0 group-hover/card:opacity-100 transition-all" />
                              </div>
                              <p className="font-black text-lg text-primary mb-1 tracking-tight">{pd.focus}</p>
                              <p className="text-[10px] text-fg-subtle uppercase font-black tracking-widest mb-5 opacity-60">{pd.planExercises.length} Esercizi</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* 2. Nutrition Section (Sotto l'allenamento, o da sola se manca allenamento) */}
                  <div className="animate-rise-up" style={{ animationDelay: '400ms' }}>
                    <NutritionPlanSection activeNutritionMeso={activeNutritionMeso} />
                  </div>
                </div>

                {/* Sidebar Sidebar */}
                <div className="lg:col-span-4 space-y-8 animate-rise-up" style={{ animationDelay: '500ms' }}>
                  <section className="rounded-[2.5rem] p-8 card-elevated mesh-bg border border-border">
                    <div className="divider-label mb-8">Roadmap</div>
                    <div className="p-8 rounded-[2rem] glass-sm border border-dashed border-border/60 text-center flex flex-col items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-fg-subtle opacity-40">
                        <Milestone className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-fg-subtle font-bold italic tracking-tight opacity-60">
                        La roadmap dettagliata sarà disponibile prossimamente.
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          ) : !draftMeso && (
            /* ── EMPTY STATE / WIZARD ── */
            <section className="bg-surface rounded-[3.5rem] p-10 md:p-14 border border-border relative overflow-hidden glass-heavy">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none animate-glow-breathe">
                <Sparkles className="w-72 h-72 text-accent" />
              </div>
              <div className="relative z-10">
                {/* Alternativa rapida all'import sopra il wizard */}
                <div className="flex justify-end mb-6 gap-3">
                  <PlanImportButton />
                </div>
                <PlanWizard />
              </div>
            </section>
          )}

          {/* Archive */}
          <div id="archive" className="pt-16 border-t border-border scroll-mt-24 animate-rise-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-primary tracking-tighter flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl glass-sm flex items-center justify-center text-fg-muted">
                  <Archive className="w-5 h-5" />
                </div>
                Archivio Mesocicli
              </h2>
              <div className="flex items-center gap-3">
                <span className="badge badge-accent opacity-60">{archivedMesos.length} completati</span>
                {archivedMesos.length > 0 && <BulkDeleteButton />}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {archivedMesos.length === 0 ? (
                <div className="col-span-full p-20 rounded-[3rem] glass-sm border border-dashed border-border/50 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-3xl glass flex items-center justify-center opacity-20">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <p className="text-fg-subtle font-black tracking-tight uppercase text-xs opacity-50">Il tuo storico apparirà qui</p>
                </div>
              ) : (
                archivedMesos.map((m, idx) => (
                  <Link key={m.id} href={`/plan/${m.id}`}>
                    <div className="p-6 card-interactive surface-accent flex justify-between items-center group h-full" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-fg-subtle group-hover:btn-primary transition-all">
                          <Archive className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-primary truncate tracking-tight">{m.name}</p>
                          <p className="text-[10px] text-fg-subtle font-black uppercase tracking-widest mt-1 num">
                            {format(new Date(m.startDate), "MMM yyyy", { locale: it })}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full glass-sm flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── CONVERSATIONAL AI COACH (POST-GENERATION) ── */}
      {(draftMeso || activeMeso) && (
        <PlanChat mesoId={draftMeso?.id || activeMeso?.id || ""} />
      )}
    </div>
  )
}

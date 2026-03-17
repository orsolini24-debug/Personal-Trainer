import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { ChevronLeft, Calendar, Info, Dumbbell, Target } from "lucide-react"
import Link from "next/link"
import MesoDetailClient from "./MesoDetailClient"
import KPITracker from "@/app/components/KPITracker"
import { getActiveGoals } from "@/app/actions/athlete-goals"

export default async function MesoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const [meso, goals] = await Promise.all([
    prisma.mesocycle.findUnique({
      where: { id, userId: session.user.id },
      include: {
        workoutPlans: {
          include: {
            planDays: {
              include: { planExercises: { orderBy: { orderIndex: 'asc' } } },
            },
          },
        },
      }
    }),
    getActiveGoals()
  ])

  if (!meso) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 px-4 animate-in fade-in duration-700">
      
      {/* Header */}
      <div>
        <Link href="/plan" className="inline-flex items-center text-sm text-muted hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Torna al Manager
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${meso.status === 'ACTIVE' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-foreground/5 border-subtle text-muted'}`}>
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${meso.status === 'ACTIVE' ? 'bg-positive/10 text-positive border-positive/20' : 'bg-foreground/5 text-muted border-subtle'}`}>
                  {meso.status}
                </span>
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                  Creato il {format(new Date(meso.createdAt), "dd MMM yyyy", { locale: it })}
                </span>
              </div>
              <h1 className="text-3xl font-black text-primary mt-1">{meso.name}</h1>
            </div>
          </div>
          <MesoDetailClient id={meso.id} status={meso.status} />
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-surface rounded-[2.5rem] p-8 border border-subtle">
            <h3 className="text-sm font-black uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> Strategia e Obiettivi
            </h3>
            <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{meso.objectives}</p>
          </section>

          <section className="bg-surface rounded-[2.5rem] p-8 border border-subtle">
            <h3 className="text-sm font-black uppercase tracking-widest text-positive mb-6 flex items-center gap-2">
              <Target className="w-4 h-4" /> KPI del Mesociclo
            </h3>
            <KPITracker goals={goals} />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 ml-2">
              <Dumbbell className="w-4 h-4 text-accent" /> Struttura Allenamento
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meso.workoutPlans[0]?.planDays.map(pd => (
                <div key={pd.id} className="bg-surface p-6 rounded-[2rem] border border-subtle">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center font-black text-accent text-sm">
                      {pd.dayLabel}
                    </div>
                    <p className="font-black text-primary">{pd.focus}</p>
                  </div>
                  <div className="space-y-2">
                    {pd.planExercises.map(pe => (
                      <div key={pe.id} className="flex justify-between items-center text-xs">
                        <span className="text-primary font-medium">• {pe.name}</span>
                        <span className="text-muted">{pe.sets}x{pe.repsMin}-{pe.repsMax}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-surface rounded-[2.5rem] p-6 border border-subtle">
            <h3 className="text-sm font-black uppercase tracking-widest text-warning mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" /> Dettagli Periodo
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted">Inizio:</span>
                <span className="text-primary font-bold">{format(new Date(meso.startDate), "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Fine prevista:</span>
                <span className="text-primary font-bold">{meso.endDate ? format(new Date(meso.endDate), "dd MMM yyyy") : 'N/D'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-subtle pt-4 mt-4">
                <span className="text-muted">Fonte:</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-foreground/5 text-muted">
                  {meso.workoutPlans[0]?.source || 'MANUAL'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import { ChevronLeft, Zap, Activity } from "lucide-react"
import ExerciseList from "./exercise-list"
import DistrictStressForm from "./district-stress"
import CloseSessionForm from "./close-session"

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await auth()
  if (!sessionUser?.user?.id) redirect("/login")

  const { id } = await params

  const session = await prisma.workoutSession.findUnique({
    where: { id, userId: sessionUser.user.id },
    include: {
      exercises: { orderBy: { orderIndex: 'asc' } },
      districtStress: true
    }
  })

  if (!session) notFound()

  return (
    <div className="w-full space-y-6 pb-20 animate-page">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-surface/50 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-border-subtle shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/training" className="p-2.5 rounded-2xl bg-base hover:bg-elevated text-muted hover:text-primary transition-all border border-border shadow-sm">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${
                session.type === 'A' ? 'bg-accent/10 text-accent border-accent/20' :
                session.type === 'B' ? 'bg-accent2/10 text-accent2 border-accent2/20' :
                session.type === 'C' ? 'bg-positive/10 text-positive border-positive/20' :
                session.type === 'OUTDOOR' ? 'bg-warning/10 text-warning border-warning/20' :
                'bg-muted/10 text-muted border-border'
              }`}>
                Sessione {session.type}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-primary tracking-tight">
                Dettaglio Sessione
              </h1>
            </div>
            <p className="text-xs font-bold text-muted mt-1 uppercase tracking-widest">{format(new Date(session.date), "EEEE, dd MMMM yyyy")}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-4 mt-2">
          <div className="flex flex-col items-center justify-center px-3 py-2.5 bg-base rounded-2xl border border-border shadow-inner">
            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-0.5">Durata</p>
            <p className="text-sm font-black text-primary num">{session.durationMin ? `${session.durationMin}m` : '-'}</p>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-2.5 bg-base rounded-2xl border border-border shadow-inner">
            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-0.5">RPE</p>
            <p className="text-sm font-black text-primary num">{session.rpe || '-'}</p>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-2.5 bg-accent/5 rounded-2xl border border-accent/20 shadow-inner">
            <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-0.5">Load</p>
            <p className="text-sm font-black text-accent num">{session.trainingLoad || '-'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Esercizi - Full Width su Mobile */}
        <section className="surface-accent rounded-[32px] p-5 md:p-8 border border-border-subtle shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-primary flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10 text-accent">
                <Activity className="w-5 h-5" />
              </div>
              Esercizi
            </h2>
          </div>
          <ExerciseList sessionId={session.id} initialExercises={session.exercises} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tensione Distrettuale */}
          <section className="bg-surface mesh-bg rounded-[32px] p-6 border border-border shadow-lg">
            <h2 className="text-lg font-black mb-8 text-primary flex items-center gap-3">
              <div className="p-2 rounded-xl bg-warning/10 text-warning">
                <Zap className="w-5 h-5" />
              </div>
              Stress Distrettuale
            </h2>
            <DistrictStressForm sessionId={session.id} initialStress={session.districtStress} />
          </section>

          {/* Chiudi Sessione */}
          <section className="bg-surface rounded-[32px] p-6 border border-border shadow-md">
            <h2 className="text-lg font-black mb-6 text-primary">Note & Parametri</h2>
            <CloseSessionForm sessionId={session.id} initialData={{ rpe: session.rpe, durationMin: session.durationMin, notes: session.notes }} />
          </section>
        </div>
      </div>
    </div>
  )
}

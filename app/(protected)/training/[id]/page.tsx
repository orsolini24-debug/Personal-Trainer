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
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/50 backdrop-blur-md p-4 rounded-2xl border border-border-subtle shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/training" className="p-2 rounded-xl bg-base hover:bg-elevated text-muted hover:text-primary transition-all border border-border">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                session.type?.startsWith('A') ? 'bg-accent/10 text-accent border border-accent/20' :
                session.type?.startsWith('B') ? 'bg-accent2/10 text-accent2 border border-accent2/20' :
                session.type?.startsWith('C') ? 'bg-warning/10 text-warning border border-warning/20' :
                'bg-positive/10 text-positive border border-positive/20'
              }`}>
                Sessione {session.type}
              </span>
              <h1 className="text-xl font-black text-primary tracking-tight">
                Dettaglio Allenamento
              </h1>
            </div>
            <p className="text-xs font-medium text-muted mt-0.5">{format(new Date(session.date), "EEEE, dd MMMM yyyy")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-base rounded-xl border border-border text-center min-w-[70px]">
            <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">Durata</p>
            <p className="text-sm font-black text-primary num">{session.durationMin ? `${session.durationMin}m` : '-'}</p>
          </div>
          <div className="px-4 py-2 bg-base rounded-xl border border-border text-center min-w-[70px]">
            <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">RPE</p>
            <p className="text-sm font-black text-primary num">{session.rpe || '-'}</p>
          </div>
          <div className="px-4 py-2 bg-accent/5 rounded-xl border border-accent/20 text-center min-w-[70px]">
            <p className="text-[10px] font-bold text-accent uppercase tracking-tighter">Load</p>
            <p className="text-sm font-black text-accent num">{session.trainingLoad || '-'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Esercizi */}
          <section className="surface-accent rounded-3xl p-6 border border-border-subtle shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-primary flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" /> Esercizi
              </h2>
            </div>
            <ExerciseList sessionId={session.id} initialExercises={session.exercises} />
          </section>

          {/* Chiudi Sessione */}
          <section className="bg-surface rounded-3xl p-6 border border-border shadow-md">
            <h2 className="text-lg font-bold mb-4 text-primary">Parametri Sessione</h2>
            <CloseSessionForm sessionId={session.id} initialData={{ rpe: session.rpe, durationMin: session.durationMin, notes: session.notes }} />
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Tensione Distrettuale */}
          <section className="surface-accent mesh-bg rounded-3xl p-6 border border-border shadow-lg">
            <h2 className="text-lg font-bold mb-6 text-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" /> Stress Distrettuale
            </h2>
            <DistrictStressForm sessionId={session.id} initialStress={session.districtStress} />
          </section>
        </div>
      </div>
    </div>
  )
}

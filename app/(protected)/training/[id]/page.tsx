import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
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
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div>
        <Link href="/training" className="inline-flex items-center text-sm text-muted hover:text-primary mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna al Log
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Sessione {session.type}
              <span className="text-sm font-normal text-muted">{format(new Date(session.date), "dd MMM yyyy")}</span>
            </h1>
          </div>
          <div className="flex gap-4 text-sm bg-surface p-3 rounded-xl border border-border">
            <div><span className="text-muted">Durata:</span> <span className="text-primary font-medium">{session.durationMin ? `${session.durationMin}m` : '-'}</span></div>
            <div><span className="text-muted">RPE:</span> <span className="text-primary font-medium">{session.rpe || '-'}</span></div>
            <div><span className="text-muted">TL:</span> <span className="text-primary font-medium">{session.trainingLoad || '-'}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Esercizi */}
          <section className="bg-surface rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 text-primary">Esercizi</h2>
            <ExerciseList sessionId={session.id} initialExercises={session.exercises} />
          </section>

          {/* Chiudi Sessione */}
          <section className="bg-surface rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 text-primary">Chiudi Sessione</h2>
            <CloseSessionForm sessionId={session.id} initialData={{ rpe: session.rpe, durationMin: session.durationMin, notes: session.notes }} />
          </section>
        </div>

        <div className="space-y-8">
          {/* Tensione Distrettuale */}
          <section className="bg-surface rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 text-primary">Tensione Distrettuale</h2>
            <DistrictStressForm sessionId={session.id} initialStress={session.districtStress} />
          </section>
        </div>
      </div>
    </div>
  )
}

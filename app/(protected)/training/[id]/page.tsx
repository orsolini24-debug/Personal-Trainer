import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import ExerciseList from "./exercise-list"
import DistrictStressForm from "./district-stress"
import CloseSessionForm from "./close-session"

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const sessionUser = await auth()
  if (!sessionUser?.user?.id) redirect("/login")

  const session = await prisma.workoutSession.findUnique({
    where: { id: params.id, userId: sessionUser.user.id },
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
        <Link href="/training" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna al Log
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Sessione {session.type}
              <span className="text-sm font-normal text-zinc-500">{format(new Date(session.date), "dd MMM yyyy")}</span>
            </h1>
          </div>
          <div className="flex gap-4 text-sm bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div><span className="text-zinc-500">Durata:</span> {session.durationMin ? `${session.durationMin}m` : '-'}</div>
            <div><span className="text-zinc-500">RPE:</span> {session.rpe || '-'}</div>
            <div><span className="text-zinc-500">TL:</span> {session.trainingLoad || '-'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Esercizi */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Esercizi</h2>
            <ExerciseList sessionId={session.id} initialExercises={session.exercises} />
          </section>

          {/* Chiudi Sessione */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Chiudi Sessione</h2>
            <CloseSessionForm sessionId={session.id} initialData={{ rpe: session.rpe, durationMin: session.durationMin, notes: session.notes }} />
          </section>
        </div>

        <div className="space-y-8">
          {/* Tensione Distrettuale */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Tensione Distrettuale</h2>
            <DistrictStressForm sessionId={session.id} initialStress={session.districtStress} />
          </section>
        </div>
      </div>
    </div>
  )
}
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import NewSessionModal from "./new-session-modal"

export default async function TrainingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    include: {
      _count: {
        select: { exercises: true }
      }
    }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Training Log</h2>
        <NewSessionModal />
      </div>

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 dark:text-zinc-400">
            Nessuna sessione trovata. Creane una nuova!
          </div>
        ) : (
          sessions.map((s) => (
            <Link key={s.id} href={`/training/${s.id}`}>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-semibold rounded-md mb-2">
                      Tipo {s.type}
                    </span>
                    <h3 className="font-medium text-lg">{format(new Date(s.date), "dd MMM yyyy")}</h3>
                  </div>
                  <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                    <p>{s._count.exercises} esercizi</p>
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400 mt-4">
                  <div>
                    <span className="font-medium">RPE:</span> {s.rpe || '-'}
                  </div>
                  <div>
                    <span className="font-medium">TL:</span> {s.trainingLoad || '-'}
                  </div>
                  {s.durationMin && (
                    <div>
                      <span className="font-medium">Durata:</span> {s.durationMin} min
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
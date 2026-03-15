import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Plus, Activity, Flame, CalendarDays, Dumbbell } from "lucide-react"
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

  // Calculate stats
  const totalSessions = sessions.length
  
  const tlSessions = sessions.filter(s => s.trainingLoad != null)
  const avgTL = tlSessions.length > 0 
    ? Math.round(tlSessions.reduce((acc, s) => acc + (s.trainingLoad || 0), 0) / tlSessions.length)
    : 0

  // Simple streak calculation (consecutive days)
  let streak = 0
  const today = new Date()
  today.setHours(0,0,0,0)
  
  const sortedDates = Array.from(new Set(sessions.map(s => {
    const d = new Date(s.date)
    d.setHours(0,0,0,0)
    return d.getTime()
  }))).sort((a, b) => b - a)

  if (sortedDates.length > 0) {
    let currentCheck = today.getTime()
    if (sortedDates[0] === currentCheck || sortedDates[0] === currentCheck - 86400000) {
      streak = 1
      currentCheck = sortedDates[0]
      for (let i = 1; i < sortedDates.length; i++) {
        if (sortedDates[i] === currentCheck - 86400000) {
          streak++
          currentCheck -= 86400000
        } else {
          break
        }
      }
    }
  }

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'A': return 'border-l-[#3b82f6] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-[#3b82f6]'
      case 'B': return 'border-l-[#10b981] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-[#10b981]'
      case 'C': return 'border-l-[#8b5cf6] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-[#8b5cf6]'
      case 'D': return 'border-l-[#f59e0b] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-[#f59e0b]'
      default: return 'border-l-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:border-white/30'
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'A': return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20'
      case 'B': return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
      case 'C': return 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20'
      case 'D': return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20'
      default: return 'bg-white/5 text-zinc-300 border-white/10'
    }
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">Training Log</h1>
          <p className="text-[#64748b] mt-1">Il tuo storico di allenamento</p>
        </div>
        <NewSessionModal />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111118] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748b] uppercase tracking-wider font-semibold">Sessioni</p>
            <p className="text-xl font-bold text-[#f1f5f9]">{totalSessions}</p>
          </div>
        </div>
        <div className="bg-[#111118] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748b] uppercase tracking-wider font-semibold">TL Medio</p>
            <p className="text-xl font-bold text-[#f1f5f9]">{avgTL}</p>
          </div>
        </div>
        <div className="bg-[#111118] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748b] uppercase tracking-wider font-semibold">Streak</p>
            <p className="text-xl font-bold text-[#f1f5f9]">{streak} <span className="text-sm font-normal text-[#64748b]">giorni</span></p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="text-center py-16 bg-[#111118] rounded-2xl border border-white/5 border-dashed">
            <p className="text-[#64748b]">Nessuna sessione trovata. Creane una nuova!</p>
          </div>
        ) : (
          sessions.map((s) => (
            <Link key={s.id} href={`/training/${s.id}`}>
              <div className={`p-5 rounded-xl border border-y-white/5 border-r-white/5 border-l-4 bg-[#111118] transition-all duration-300 ${getTypeColors(s.type)}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${getTypeBadge(s.type)}`}>
                        Tipo {s.type}
                      </span>
                      <span className="text-sm font-medium text-[#f1f5f9] bg-white/5 px-2 py-0.5 rounded">
                        {format(new Date(s.date), "dd MMM yyyy", { locale: it })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] bg-[#0a0a0f] px-3 py-1 rounded-lg border border-white/5">
                      <Dumbbell className="w-4 h-4" /> {s._count.exercises}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-bold mb-0.5">RPE</span>
                    <span className="font-semibold text-[#f1f5f9]">{s.rpe || '-'}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-bold mb-0.5">Training Load</span>
                    <span className="font-semibold text-[#f1f5f9]">{s.trainingLoad || '-'}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-bold mb-0.5">Durata</span>
                    <span className="font-semibold text-[#f1f5f9]">{s.durationMin ? `${s.durationMin} min` : '-'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
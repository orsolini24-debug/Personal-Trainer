import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format, addDays, startOfWeek } from "date-fns"
import { it } from "date-fns/locale"
import { Calendar as CalendarIcon, CheckCircle2, Flag, Milestone, Target, Dumbbell } from "lucide-react"

export default async function PlanPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  // Fetch active mesocycle
  const activeMeso = await prisma.mesocycle.findFirst({
    where: { userId, isActive: true },
    orderBy: { startDate: 'desc' }
  })

  // Fetch past mesocycles
  const pastMesos = await prisma.mesocycle.findMany({
    where: { userId, isActive: false },
    orderBy: { endDate: 'desc' },
    take: 3
  })

  // Weekly Calendar (mock data for the week)
  const today = new Date()
  const start = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(start, i))
  
  // Let's assume we fetch sessions for the week to mark them
  const weekSessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      date: { gte: start, lt: addDays(start, 7) }
    }
  })

  const getDayPlan = (date: Date) => {
    const s = weekSessions.find(s => new Date(s.date).getDate() === date.getDate())
    if (s) return { type: s.type, done: true }
    
    // Mock plan
    const day = date.getDay()
    if (day === 1) return { type: 'A', done: false } // Lunedì
    if (day === 3) return { type: 'B', done: false } // Mercoledì
    if (day === 5) return { type: 'C', done: false } // Venerdì
    if (day === 0) return { type: 'OUTDOOR', done: false } // Domenica
    return null // Riposo
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">Plan Manager</h1>
          <p className="text-[#64748b] mt-1">Pianificazione e roadmap obiettivi.</p>
        </div>
        <button className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-sm font-medium transition-colors">
          Nuovo Mesociclo
        </button>
      </div>

      {/* Mesociclo Attivo & KPI */}
      {activeMeso ? (
        <section className="bg-[#111118] rounded-2xl p-6 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Target className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-full text-xs font-bold uppercase tracking-wider">
                Attivo
              </span>
              <h2 className="text-2xl font-bold text-[#f1f5f9]">{activeMeso.name}</h2>
            </div>
            
            <p className="text-[#64748b] mb-6 max-w-2xl">{activeMeso.objectives}</p>

            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f1f5f9] mb-4 flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#3b82f6]" /> KPI Tracker
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mock KPIs based on JSON */}
              <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-[#f1f5f9]">Stacco 130kg</span>
                  <span className="text-[#3b82f6] font-bold">118 / 130 kg</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#3b82f6] h-full" style={{ width: '91%' }}></div>
                </div>
                <p className="text-right text-xs text-[#64748b] mt-1">91%</p>
              </div>
              <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-[#f1f5f9]">Corsa 5km sub 25'</span>
                  <span className="text-[#10b981] font-bold">26:30 / 25:00</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#10b981] h-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-right text-xs text-[#64748b] mt-1">85%</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[#111118] rounded-2xl p-8 border border-white/5 text-center border-dashed">
          <Target className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#f1f5f9] mb-2">Nessun Mesociclo Attivo</h2>
          <p className="text-[#64748b]">Crea un nuovo piano per iniziare a tracciare i tuoi progressi.</p>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendario Settimanale */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold mb-6 text-[#f1f5f9] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#8b5cf6]" /> Settimana Corrente
            </h2>
            <div className="space-y-3">
              {weekDays.map((date, idx) => {
                const plan = getDayPlan(date)
                const isToday = date.getDate() === today.getDate()
                
                return (
                  <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border ${isToday ? 'bg-[#3b82f6]/5 border-[#3b82f6]/30' : 'bg-[#0a0a0f] border-white/5'}`}>
                    <div className="w-12 text-center shrink-0">
                      <p className="text-xs text-[#64748b] uppercase font-bold">{format(date, "EEE", { locale: it })}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-[#3b82f6]' : 'text-[#f1f5f9]'}`}>{format(date, "dd")}</p>
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      {plan ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${plan.done ? 'bg-[#10b981] text-white' : 'bg-white/10 text-white'}`}>
                              {plan.type === 'OUTDOOR' ? 'O' : plan.type}
                            </div>
                            <div>
                              <p className={`font-medium ${plan.done ? 'text-[#f1f5f9]' : 'text-[#f1f5f9]'}`}>
                                {plan.type === 'OUTDOOR' ? 'Corsa / Bici' : `Sessione ${plan.type}`}
                              </p>
                              {plan.done && <p className="text-xs text-[#10b981] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completata</p>}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#64748b]">
                            -
                          </div>
                          <p className="text-[#64748b] text-sm">Riposo</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Roadmap & Storico */}
        <div className="lg:col-span-5 space-y-8">
          
          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold mb-6 text-[#f1f5f9] flex items-center gap-2">
              <Milestone className="w-5 h-5 text-[#f59e0b]" /> Roadmap 2026
            </h2>
            <div className="relative pl-4 border-l-2 border-white/10 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#10b981] ring-4 ring-[#111118]"></div>
                <p className="text-xs text-[#10b981] font-bold uppercase tracking-wider mb-1">Aprile</p>
                <p className="text-sm font-medium text-[#f1f5f9]">100kg Panca Piana</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#3b82f6] ring-4 ring-[#111118] animate-pulse"></div>
                <p className="text-xs text-[#3b82f6] font-bold uppercase tracking-wider mb-1">Luglio</p>
                <p className="text-sm font-medium text-[#f1f5f9]">Margherita Trail 20km</p>
              </div>
              <div className="relative opacity-50">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#64748b] ring-4 ring-[#111118]"></div>
                <p className="text-xs text-[#64748b] font-bold uppercase tracking-wider mb-1">Ottobre</p>
                <p className="text-sm font-medium text-[#f1f5f9]">Massa Grassa &lt; 12%</p>
              </div>
            </div>
          </section>

          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold mb-4 text-[#f1f5f9] flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#64748b]" /> Storico Mesocicli
            </h2>
            <div className="space-y-3">
              {pastMesos.length === 0 ? (
                <p className="text-sm text-[#64748b]">Nessun ciclo passato.</p>
              ) : (
                pastMesos.map(m => (
                  <div key={m.id} className="p-3 bg-[#0a0a0f] rounded-xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-[#f1f5f9] group-hover:text-[#3b82f6] transition-colors">{m.name}</p>
                      <p className="text-xs text-[#64748b] mt-0.5">{format(new Date(m.startDate), "MMM yyyy", { locale: it })}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded text-[#64748b]">Concluso</span>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
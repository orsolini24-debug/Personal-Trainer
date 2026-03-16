import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { ChevronLeft, Calendar, Info, Dumbbell, Target } from "lucide-react"
import Link from "next/link"
import MesoDetailClient from "./MesoDetailClient"

export default async function MesoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const meso = await prisma.mesocycle.findUnique({
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
  })

  if (!meso) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 px-4 animate-in fade-in duration-700">
      
      {/* Header */}
      <div>
        <Link href="/plan" className="inline-flex items-center text-sm text-[#64748b] hover:text-[#f1f5f9] mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Torna al Manager
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${meso.status === 'ACTIVE' ? 'bg-[#3b82f6]/10 border-[#3b82f6]/20 text-[#3b82f6]' : 'bg-white/5 border-white/5 text-[#64748b]'}`}>
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${meso.status === 'ACTIVE' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : 'bg-white/5 text-[#64748b] border-white/5'}`}>
                  {meso.status}
                </span>
                <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">
                  Creato il {format(new Date(meso.createdAt), "dd MMM yyyy", { locale: it })}
                </span>
              </div>
              <h1 className="text-3xl font-black text-[#f1f5f9] mt-1">{meso.name}</h1>
            </div>
          </div>
          <MesoDetailClient id={meso.id} status={meso.status} />
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-[#111118] rounded-[2.5rem] p-8 border border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#3b82f6] mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> Strategia e Obiettivi
            </h3>
            <p className="text-[#94a3b8] text-sm leading-relaxed whitespace-pre-wrap">{meso.objectives}</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#f1f5f9] flex items-center gap-2 ml-2">
              <Dumbbell className="w-4 h-4 text-[#3b82f6]" /> Struttura Allenamento
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meso.workoutPlans[0]?.planDays.map(pd => (
                <div key={pd.id} className="bg-[#111118] p-6 rounded-[2rem] border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[#3b82f6] text-sm">
                      {pd.dayLabel}
                    </div>
                    <p className="font-black text-[#f1f5f9]">{pd.focus}</p>
                  </div>
                  <div className="space-y-2">
                    {pd.planExercises.map(pe => (
                      <div key={pe.id} className="flex justify-between items-center text-xs">
                        <span className="text-[#f1f5f9] font-medium">• {pe.name}</span>
                        <span className="text-[#64748b]">{pe.sets}x{pe.repsMin}-{pe.repsMax}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-[#111118] rounded-[2.5rem] p-6 border border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#f59e0b] mb-4 flex items-center gap-2">
              <Target className="w-4h-4" /> Dettagli Periodo
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#64748b]">Inizio:</span>
                <span className="text-[#f1f5f9] font-bold">{format(new Date(meso.startDate), "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748b]">Fine prevista:</span>
                <span className="text-[#f1f5f9] font-bold">{meso.endDate ? format(new Date(meso.endDate), "dd MMM yyyy") : 'N/D'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
                <span className="text-[#64748b]">Fonte:</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/5 text-[#64748b]">
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

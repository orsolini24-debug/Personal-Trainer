import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { 
  ArrowRight, Dumbbell, HeartPulse, Activity, Utensils, 
  Brain, Calendar, Zap, TrendingUp, Award, Clock
} from "lucide-react"
import RecoveryOrb from "@/components/RecoveryOrb"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Fetch data in parallel
  const [recovery, nutrition, workout, biometric, profile] = await Promise.all([
    prisma.recoveryLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.nutritionDay.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.workoutSession.findFirst({ where: { userId, date: { gte: today } }, orderBy: { date: 'asc' } }),
    prisma.biometricLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.userProfile.findUnique({ where: { userId } })
  ])

  // Macro calculations
  const kcalActual = nutrition?.kcalActual || 0
  const kcalTarget = nutrition?.kcalTarget || 2200
  const kcalPct = Math.min(100, Math.round((kcalActual / kcalTarget) * 100))
  
  const proActual = Math.round(nutrition?.proteinG || 0)
  const carbActual = Math.round(nutrition?.carbsG || 0)
  const fatActual = Math.round(nutrition?.fatG || 0)

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-primary">
            Ciao, {session.user.name?.split(' ')[0] || 'Atleta'}
          </h1>
          <p className="text-muted font-medium mt-1">Ecco il tuo Performance Snapshot per oggi.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-subtle rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Engine Active</span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        
        {/* 1. Recovery Orb (Large Widget) - Span 12 to 5 */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 bg-surface rounded-[2.5rem] border border-subtle p-8 relative overflow-hidden group hover:border-[#10b981]/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <HeartPulse className="w-32 h-32 text-[#10b981]" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                <div className="p-2 rounded-xl bg-[#10b981]/10 text-[#10b981]">
                  <Zap className="w-4 h-4" />
                </div>
                Recupero
              </h2>
              <Link href="/recovery" className="p-2 rounded-full bg-foreground/5 text-muted hover:text-primary transition-colors">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <RecoveryOrb score={recovery?.recoveryScore ?? 0} label="Status" />
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-3 rounded-2xl bg-base border border-subtle">
                <p className="text-[10px] uppercase font-bold text-muted tracking-widest">HRV</p>
                <p className="text-xl font-black text-primary">{recovery?.hrv || '--'}<span className="text-[10px] ml-1 opacity-50 font-medium">ms</span></p>
              </div>
              <div className="p-3 rounded-2xl bg-base border border-subtle">
                <p className="text-[10px] uppercase font-bold text-muted tracking-widest">TSB</p>
                <p className="text-xl font-black text-primary">{recovery?.tsb || '--'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Nutrition Circle (Middle Widget) - Span 12 to 7 */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 bg-surface rounded-[2.5rem] border border-subtle p-8 relative overflow-hidden group hover:border-[#3b82f6]/30 transition-all duration-500">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                <div className="p-2 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6]">
                  <Utensils className="w-4 h-4" />
                </div>
                Nutrizione
              </h2>
              <Link href="/nutrition" className="flex items-center gap-2 text-xs font-bold text-muted hover:text-[#3b82f6] transition-colors">
                Log Pasto <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Main Calories Circle */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="45" stroke="#3b82f6" strokeWidth="8" fill="transparent" 
                    strokeDasharray="283" strokeDashoffset={283 - (kcalPct / 100) * 283} 
                    strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-primary">{kcalActual}</span>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">/ {kcalTarget} kcal</span>
                </div>
              </div>

              {/* Progress Bars for Macros */}
              <div className="flex-1 w-full space-y-6">
                {[
                  { label: 'Proteine', val: proActual, target: 160, color: '#8b5cf6' },
                  { label: 'Carboidrati', val: carbActual, target: 250, color: '#f59e0b' },
                  { label: 'Grassi', val: fatActual, target: 70, color: '#ef4444' }
                ].map((m) => (
                  <div key={m.label} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-primary">{m.label}</span>
                      <span className="text-muted">{m.val} / {m.target}g</span>
                    </div>
                    <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (m.val / m.target) * 100)}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Training Session (Modern Card) - Span 12 to 6 */}
        <div className="col-span-12 md:col-span-6 bg-surface rounded-[2.5rem] border border-subtle p-8 hover:border-[#8b5cf6]/30 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
            <Dumbbell className="w-40 h-40" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="text-lg font-bold flex items-center gap-2 text-primary mb-6">
              <div className="p-2 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6]">
                <Calendar className="w-4 h-4" />
              </div>
              Allenamento
            </h2>
            
            {workout ? (
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6] text-[10px] font-black uppercase tracking-widest">
                  In programma
                </div>
                <h3 className="text-2xl font-black text-primary">Sessione {workout.type}</h3>
                <div className="flex items-center gap-6 text-sm text-muted font-medium">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 60 min</div>
                  <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> High Intensity</div>
                </div>
                <Link href="/training/active" className="mt-4 inline-flex items-center justify-center w-full py-4 bg-[#8b5cf6] text-white rounded-2xl font-bold transition-transform active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                  Inizia Sessione
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-default flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-muted" />
                </div>
                <p className="text-muted text-sm font-medium">Nessuna sessione per oggi.<br/>Riposo o attività libera.</p>
                <Link href="/training" className="mt-4 text-xs font-bold text-[#8b5cf6] hover:underline uppercase tracking-widest">Vedi Calendario</Link>
              </div>
            )}
          </div>
        </div>

        {/* 4. AI Coach Insight (Dynamic Card) - Span 12 to 6 */}
        <div className="col-span-12 md:col-span-6 bg-surface rounded-[2.5rem] border border-subtle p-8 hover:border-[#6366f1]/30 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366f1]/10 rounded-full blur-3xl group-hover:bg-[#6366f1]/20 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="text-lg font-bold flex items-center gap-2 text-primary mb-6">
              <div className="p-2 rounded-xl bg-[#6366f1]/10 text-[#6366f1]">
                <Brain className="w-4 h-4" />
              </div>
              Coach AI
            </h2>
            <div className="bg-base p-5 rounded-3xl border border-subtle flex-1 italic text-sm text-muted leading-relaxed relative">
              <div className="absolute top-0 left-6 -translate-y-1/2 w-4 h-4 bg-base border-l border-t border-subtle rotate-45"></div>
              "Il tuo HRV è leggermente sopra la media stamattina (+5ms). Hai un buon buffer di recupero. Ottimo momento per spingere sulla sessione di forza {workout?.type || ''} prevista oggi."
            </div>
            <Link href="/coach" className="mt-6 flex items-center justify-between group/btn">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Chiedi consiglio</span>
              <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover/btn:bg-[#6366f1] transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-muted group-hover/btn:text-white" />
              </div>
            </Link>
          </div>
        </div>

        {/* 5. Biometrics & Sports Snapshots (Bottom Row) */}
        <div className="col-span-12 lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Biometrics */}
          <Link href="/body" className="bg-surface p-6 rounded-[2rem] border border-subtle hover:bg-foreground/[0.02] transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b]">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Ultimo Peso</p>
                <p className="text-2xl font-black text-primary">{biometric?.weightKg || '--'} <span className="text-sm font-medium opacity-50">kg</span></p>
              </div>
            </div>
            <div className="w-16 h-8 opacity-30">
              <svg viewBox="0 0 100 40" className="w-full h-full"><polyline fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" points="0,30 20,25 40,32 60,15 80,20 100,5" /></svg>
            </div>
          </Link>

          {/* Sport Status (Soccer example) */}
          <div className="bg-surface p-6 rounded-[2rem] border border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Status Atleta</p>
              <p className="text-lg font-black text-primary">Semipro · Calcio</p>
            </div>
          </div>

          {/* Streak/Activity */}
          <div className="bg-surface p-6 rounded-[2rem] border border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Streak Settimanale</p>
              <p className="text-xl font-black text-primary">4 / 5 <span className="text-sm font-medium opacity-50 text-muted">Sessioni</span></p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

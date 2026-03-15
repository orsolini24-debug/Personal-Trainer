import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, Dumbbell, HeartPulse, Activity, Utensils } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Fetch data in parallel
  const [recovery, nutrition, workout, biometric] = await Promise.all([
    prisma.recoveryLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.nutritionDay.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.workoutSession.findFirst({ where: { userId, date: { gte: today } }, orderBy: { date: 'asc' } }),
    prisma.biometricLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } })
  ])

  // Semaforo Recupero
  let recoveryStatus = "Nessun dato"
  let recoveryColor = "bg-[#64748b]"
  let recoveryGlow = "shadow-none"
  if (recovery?.recoveryScore && recovery?.tsb) {
    const s = recovery.recoveryScore
    const t = recovery.tsb
    if (s >= 70 && t > -10) { recoveryStatus = "Ottimo"; recoveryColor = "bg-[#10b981]"; recoveryGlow = "shadow-[0_0_20px_rgba(16,185,129,0.4)]" }
    else if (s < 40 || t < -30) { recoveryStatus = "Critico"; recoveryColor = "bg-[#ef4444]"; recoveryGlow = "shadow-[0_0_20px_rgba(239,68,68,0.4)]" }
    else { recoveryStatus = "Medio"; recoveryColor = "bg-[#f59e0b]"; recoveryGlow = "shadow-[0_0_20px_rgba(245,158,11,0.4)]" }
  }

  // Macro
  const kcalActual = nutrition?.kcalActual || 0
  const kcalTarget = nutrition?.kcalTarget || 2500
  const proActual = Math.round(nutrition?.proteinG || 0)
  const proTarget = 150 // dummy
  const carbActual = Math.round(nutrition?.carbsG || 0)
  const carbTarget = 300 // dummy
  const fatActual = Math.round(nutrition?.fatG || 0)
  const fatTarget = 80 // dummy

  const getProgress = (actual: number, target: number) => {
    return target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0
  }

  const CircleRing = ({ pct, color, label, val }: { pct: number, color: string, label: string, val: number|string }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
            <circle cx="30" cy="30" r={radius} stroke={color} strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
          </svg>
          <span className="absolute text-xs font-bold text-[#f1f5f9]">{val}</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[#64748b]">{label}</span>
      </div>
    )
  }

  const sessionColors: Record<string, string> = {
    A: "bg-[#3b82f6] text-white",
    B: "bg-[#10b981] text-white",
    C: "bg-[#8b5cf6] text-white",
    D: "bg-[#f59e0b] text-white",
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[#64748b] mt-1">Bentornato, ecco il tuo stato oggi.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Recovery Card (Col 12 to md:6) */}
        <Link href="/recovery" className="col-span-12 md:col-span-6 bg-[#111118] p-6 rounded-2xl border border-white/5 hover:border-[#10b981]/50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <HeartPulse className="w-24 h-24 text-[#10b981]" />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#f1f5f9]"><HeartPulse className="w-5 h-5 text-[#10b981]" /> Recupero</h2>
            <ArrowRight className="w-5 h-5 text-[#64748b] group-hover:text-[#10b981] transition-transform group-hover:translate-x-1" />
          </div>
          <div className="flex flex-col items-center justify-center py-6 relative z-10">
            <div className={`w-20 h-20 rounded-full flex shrink-0 ${recoveryColor} ${recoveryGlow} animate-pulse`}></div>
            <p className="font-bold text-2xl mt-4 text-[#f1f5f9]">{recoveryStatus}</p>
            <p className="text-sm text-[#64748b] mt-1">Score: {recovery?.recoveryScore || '-'} • TSB: {recovery?.tsb || '-'}</p>
          </div>
        </Link>

        {/* Nutrition Card (Col 12 to md:6) */}
        <Link href="/nutrition" className="col-span-12 md:col-span-6 bg-[#111118] p-6 rounded-2xl border border-white/5 hover:border-[#3b82f6]/50 transition-colors group">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#f1f5f9]"><Utensils className="w-5 h-5 text-[#3b82f6]" /> Nutrizione</h2>
            <ArrowRight className="w-5 h-5 text-[#64748b] group-hover:text-[#3b82f6] transition-transform group-hover:translate-x-1" />
          </div>
          <div className="flex justify-around items-center pt-2">
            <CircleRing pct={getProgress(kcalActual, kcalTarget)} color="#3b82f6" label="Kcal" val={kcalActual} />
            <CircleRing pct={getProgress(proActual, proTarget)} color="#8b5cf6" label="Pro" val={`${proActual}g`} />
            <CircleRing pct={getProgress(carbActual, carbTarget)} color="#f59e0b" label="Carb" val={`${carbActual}g`} />
            <CircleRing pct={getProgress(fatActual, fatTarget)} color="#ef4444" label="Fat" val={`${fatActual}g`} />
          </div>
        </Link>

        {/* Training Card (Col 12 to md:7) */}
        <Link href="/training" className="col-span-12 md:col-span-7 bg-[#111118] p-6 rounded-2xl border border-white/5 hover:border-[#8b5cf6]/50 transition-colors group">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#f1f5f9]"><Dumbbell className="w-5 h-5 text-[#8b5cf6]" /> Sessione di Oggi</h2>
            <ArrowRight className="w-5 h-5 text-[#64748b] group-hover:text-[#8b5cf6] transition-transform group-hover:translate-x-1" />
          </div>
          {workout ? (
            <div className="flex items-center gap-4 bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
              <div className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg ${sessionColors[workout.type] || 'bg-white/10 text-white'}`}>
                {workout.type}
              </div>
              <div>
                <p className="font-semibold text-[#f1f5f9]">Allenamento {workout.type}</p>
                <p className="text-sm text-[#64748b]">Durata: {workout.durationMin || '-'} min • RPE: {workout.rpe || '-'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 bg-[#0a0a0f] rounded-xl border border-white/5 border-dashed">
              <p className="text-[#64748b] text-sm">Nessuna sessione registrata oggi.</p>
            </div>
          )}
        </Link>

        {/* Body Card (Col 12 to md:5) */}
        <Link href="/body" className="col-span-12 md:col-span-5 bg-[#111118] p-6 rounded-2xl border border-white/5 hover:border-[#f59e0b]/50 transition-colors group">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#f1f5f9]"><Activity className="w-5 h-5 text-[#f59e0b]" /> Ultimo Peso</h2>
            <ArrowRight className="w-5 h-5 text-[#64748b] group-hover:text-[#f59e0b] transition-transform group-hover:translate-x-1" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-4xl text-[#f1f5f9]">{biometric?.weightKg ? `${biometric.weightKg}` : '-'}</p>
              <p className="text-sm text-[#64748b] mt-1">kg • BF: {biometric?.fatPct ? `${biometric.fatPct}%` : '-'}</p>
            </div>
            <div className="w-24 h-12">
              {/* Dummy sparkline */}
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                <polyline fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points="0,30 20,25 40,28 60,15 80,20 100,10" />
              </svg>
            </div>
          </div>
        </Link>

      </div>
    </div>
  )
}
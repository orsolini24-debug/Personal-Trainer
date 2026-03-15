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
  let recoveryColor = "bg-zinc-200 dark:bg-zinc-800"
  if (recovery?.recoveryScore && recovery?.tsb) {
    const s = recovery.recoveryScore
    const t = recovery.tsb
    if (s >= 70 && t > -10) { recoveryStatus = "Ottimo"; recoveryColor = "bg-green-500" }
    else if (s < 40 || t < -30) { recoveryStatus = "Critico"; recoveryColor = "bg-red-500" }
    else { recoveryStatus = "Medio"; recoveryColor = "bg-yellow-500" }
  }

  // Macro
  const kcalActual = nutrition?.kcalActual || 0
  const kcalTarget = nutrition?.kcalTarget || 2500
  const kcalPct = Math.min(100, Math.round((kcalActual / kcalTarget) * 100))
  const kcalColor = kcalPct > 110 ? 'bg-red-500' : (kcalPct > 90 ? 'bg-green-500' : 'bg-yellow-500')

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Recovery Card */}
        <Link href="/recovery" className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-bold flex items-center gap-2"><HeartPulse className="w-5 h-5 text-zinc-500" /> Recupero</h2>
            <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex shrink-0 ${recoveryColor} shadow-lg shadow-black/10`}></div>
            <div>
              <p className="font-semibold text-lg">{recoveryStatus}</p>
              <p className="text-sm text-zinc-500">Score: {recovery?.recoveryScore || '-'} • TSB: {recovery?.tsb || '-'}</p>
            </div>
          </div>
        </Link>

        {/* Nutrition Card */}
        <Link href="/nutrition" className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-bold flex items-center gap-2"><Utensils className="w-5 h-5 text-zinc-500" /> Nutrizione Oggi</h2>
            <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{kcalActual} / {kcalTarget} kcal</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${kcalColor}`} style={{ width: `${kcalPct}%` }}></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>P: {Math.round(nutrition?.proteinG || 0)}g</span>
              <span>C: {Math.round(nutrition?.carbsG || 0)}g</span>
              <span>G: {Math.round(nutrition?.fatG || 0)}g</span>
            </div>
          </div>
        </Link>

        {/* Training Card */}
        <Link href="/training" className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-bold flex items-center gap-2"><Dumbbell className="w-5 h-5 text-zinc-500" /> Allenamento</h2>
            <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-blue-500 transition-colors" />
          </div>
          {workout ? (
            <div>
              <p className="font-semibold">Sessione {workout.type} oggi</p>
              <p className="text-sm text-zinc-500">Durata: {workout.durationMin || '-'} min • RPE: {workout.rpe || '-'}</p>
            </div>
          ) : (
            <div>
              <p className="text-zinc-500">Nessuna sessione registrata oggi.</p>
            </div>
          )}
        </Link>

        {/* Body Card */}
        <Link href="/body" className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-zinc-500" /> Ultimo Peso</h2>
            <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-blue-500 transition-colors" />
          </div>
          <div>
            <p className="font-semibold text-2xl">{biometric?.weightKg ? `${biometric.weightKg} kg` : '-'}</p>
            <p className="text-sm text-zinc-500">BF: {biometric?.fatPct ? `${biometric.fatPct}%` : '-'}</p>
          </div>
        </Link>

      </div>
    </div>
  )
}
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, Dumbbell, HeartPulse, Activity, Utensils, TrendingUp, Zap } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [recovery, nutrition, workout, biometric] = await Promise.all([
    prisma.recoveryLog.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.nutritionDay.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.workoutSession.findFirst({ where: { userId, date: { gte: today } }, orderBy: { date: "asc" } }),
    prisma.biometricLog.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
  ])

  let recoveryLabel = "Nessun dato"
  let recoveryColor = "#64748b"
  let recoveryBg = "rgba(100,116,139,0.12)"
  if (recovery?.recoveryScore) {
    const s = recovery.recoveryScore
    const t = recovery.tsb ?? 0
    if (s >= 70 && t > -10) { recoveryLabel = "Ottimo"; recoveryColor = "#10b981"; recoveryBg = "rgba(16,185,129,0.12)" }
    else if (s < 40 || t < -30) { recoveryLabel = "Critico"; recoveryColor = "#ef4444"; recoveryBg = "rgba(239,68,68,0.12)" }
    else { recoveryLabel = "Medio"; recoveryColor = "#f59e0b"; recoveryBg = "rgba(245,158,11,0.12)" }
  }

  const kcalActual = nutrition?.kcalActual || 0
  const kcalTarget = nutrition?.kcalTarget || 2500
  const proActual = Math.round(nutrition?.proteinG || 0)
  const carbActual = Math.round(nutrition?.carbsG || 0)
  const fatActual = Math.round(nutrition?.fatG || 0)

  const pct = (a: number, t: number) => Math.min(100, t > 0 ? Math.round((a / t) * 100) : 0)

  const userName = session.user.name || session.user.email || "Atleta"

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Welcome */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--accent)" }}>
            Benvenuto
          </p>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--fg-primary)" }}>
            {userName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent)" }}
        >
          <Zap className="w-4 h-4" />
          Performance Ecosystem
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Recovery", value: recovery?.recoveryScore ? `${recovery.recoveryScore}%` : "—", sub: recoveryLabel, color: recoveryColor },
          { label: "TSB", value: recovery?.tsb != null ? recovery.tsb : "—", sub: "Forma attuale", color: "var(--accent)" },
          { label: "Peso", value: biometric?.weightKg ? `${biometric.weightKg} kg` : "—", sub: biometric?.fatPct ? `${biometric.fatPct}% BF` : "–", color: "var(--fg-primary)" },
          { label: "Kcal oggi", value: kcalActual, sub: `target ${kcalTarget}`, color: "#f59e0b" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>
              {s.label}
            </p>
            <p className="text-2xl font-black" style={{ color: s.color as string }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--fg-subtle)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Recovery Card */}
        <Link
          href="/recovery"
          className="col-span-12 md:col-span-6 rounded-2xl p-6 relative overflow-hidden group transition-all duration-200"
          style={{
            background: "var(--bg-surface)",
            border: `1px solid var(--border-default)`,
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `radial-gradient(circle at top right, ${recoveryBg}, transparent 70%)` }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5" style={{ color: recoveryColor }} />
                <span className="font-bold" style={{ color: "var(--fg-primary)" }}>Recupero</span>
              </div>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-subtle)" }} />
            </div>
            <div className="flex items-center justify-center flex-col gap-3 py-4">
              <div
                className="w-16 h-16 rounded-full animate-pulse"
                style={{ backgroundColor: recoveryColor, boxShadow: `0 0 30px ${recoveryColor}60` }}
              />
              <p className="text-2xl font-black" style={{ color: "var(--fg-primary)" }}>{recoveryLabel}</p>
              <div className="flex gap-4 text-sm" style={{ color: "var(--fg-muted)" }}>
                <span>HRV: {recovery?.hrv || "—"}</span>
                <span>RHR: {recovery?.rhr || "—"}</span>
                <span>Sonno: {recovery?.sleepMin ? `${Math.round(recovery.sleepMin / 60)}h` : "—"}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Nutrition Card */}
        <Link
          href="/nutrition"
          className="col-span-12 md:col-span-6 rounded-2xl p-6 relative overflow-hidden group transition-all duration-200"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "radial-gradient(circle at top right, var(--accent-dim), transparent 70%)" }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5" style={{ color: "var(--accent)" }} />
                <span className="font-bold" style={{ color: "var(--fg-primary)" }}>Nutrizione</span>
              </div>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-subtle)" }} />
            </div>

            {/* Kcal bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "var(--fg-muted)" }}>Calorie</span>
                <span className="font-bold" style={{ color: "var(--fg-primary)" }}>
                  {kcalActual} / {kcalTarget} kcal
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct(kcalActual, kcalTarget)}%`, background: "var(--accent)" }}
                />
              </div>
            </div>

            {/* Macro pills */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Proteine", val: proActual, unit: "g", color: "#8b5cf6" },
                { label: "Carbo", val: carbActual, unit: "g", color: "#f59e0b" },
                { label: "Grassi", val: fatActual, unit: "g", color: "#ef4444" },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-3 text-center"
                  style={{ background: `${m.color}12`, border: `1px solid ${m.color}30` }}>
                  <p className="text-lg font-black" style={{ color: m.color }}>{m.val}<span className="text-xs font-normal ml-0.5">{m.unit}</span></p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--fg-subtle)" }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Training Card */}
        <Link
          href="/training"
          className="col-span-12 md:col-span-7 rounded-2xl p-6 group transition-all duration-200"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <span className="font-bold" style={{ color: "var(--fg-primary)" }}>Sessione di Oggi</span>
            </div>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-subtle)" }} />
          </div>
          {workout ? (
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
              <div
                className="w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg text-white shrink-0"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))" }}
              >
                {workout.type}
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--fg-primary)" }}>Allenamento {workout.type}</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  Durata: {workout.durationMin || "—"} min • RPE: {workout.rpe || "—"}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-24 rounded-xl"
              style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border-default)" }}
            >
              <TrendingUp className="w-6 h-6 mb-2" style={{ color: "var(--fg-subtle)" }} />
              <p className="text-sm" style={{ color: "var(--fg-subtle)" }}>Nessuna sessione registrata oggi</p>
            </div>
          )}
        </Link>

        {/* Body Card */}
        <Link
          href="/body"
          className="col-span-12 md:col-span-5 rounded-2xl p-6 group transition-all duration-200"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: "#f59e0b" }} />
              <span className="font-bold" style={{ color: "var(--fg-primary)" }}>Body</span>
            </div>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-subtle)" }} />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-5xl font-black" style={{ color: "var(--fg-primary)" }}>
                {biometric?.weightKg ?? "—"}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
                kg • BF: {biometric?.fatPct ? `${biometric.fatPct}%` : "—"}
              </p>
            </div>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-24 h-12 shrink-0">
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,30 20,25 40,28 60,15 80,20 100,10"
              />
            </svg>
          </div>
        </Link>

      </div>
    </div>
  )
}

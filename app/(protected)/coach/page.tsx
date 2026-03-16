import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ChatClient from "./chat-client"
import { Brain, Zap, Shield, Dumbbell } from "lucide-react"

export default async function CoachPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [activeInjuries, latestSync, activeMeso] = await Promise.all([
    prisma.injury.findMany({
      where: { userId: session.user.id, status: { not: 'RESOLVED' } },
      select: { district: true, description: true },
    }),
    prisma.recoveryLog.findFirst({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      select: { hrv: true, rhr: true, sleepScore: true, recoveryScore: true },
    }),
    prisma.mesocycle.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
      select: { name: true, objectives: true, startDate: true, endDate: true },
    }),
  ])

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4" style={{ height: 'calc(100dvh - 5rem)' }}>

      {/* Header */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent)' }}>Coach AI</p>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>
            Il tuo preparatore personale
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--fg-muted)' }}>
            30+ anni di esperienza agonistica · Nutrizione sportiva · Biomeccanica · Hyrox · Arrampicata
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)', boxShadow: '0 0 20px var(--glow-accent)' }}
        >
          <Brain className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-2 flex-wrap shrink-0">
        {activeMeso && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
          >
            <Dumbbell className="w-3 h-3" style={{ color: 'var(--accent)' }} />
            {activeMeso.name}
          </div>
        )}
        {latestSync?.recoveryScore != null && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: latestSync.recoveryScore > 66 ? '#10b981' : latestSync.recoveryScore > 33 ? '#f59e0b' : '#ef4444',
            }}
          >
            <Zap className="w-3 h-3" />
            Recovery {latestSync.recoveryScore}% · HRV {latestSync.hrv ?? '—'}
          </div>
        )}
        {activeInjuries.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: '#ef444412', border: '1px solid #ef444430', color: '#ef4444' }}
          >
            <Shield className="w-3 h-3" />
            {activeInjuries.length} infortun{activeInjuries.length === 1 ? 'io' : 'i'} attiv{activeInjuries.length === 1 ? 'o' : 'i'}
          </div>
        )}
      </div>

      {/* Chat */}
      <div
        className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <ChatClient />
      </div>
    </div>
  )
}

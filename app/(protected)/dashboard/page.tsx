import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, Dumbbell, Clock, TrendingUp, Award, Activity, ChevronRight } from "lucide-react"
import RecoveryOrb from "@/components/RecoveryOrb"
import KPITracker from "@/app/components/KPITracker"
import { getActiveGoals } from "@/app/actions/athlete-goals"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  let recovery, nutrition, workout, biometric, profile, goals;

  try {
    const results = await Promise.all([
      prisma.recoveryLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
      prisma.nutritionDay.findUnique({ where: { userId_date: { userId, date: today } } }),
      prisma.workoutSession.findFirst({ where: { userId, date: { gte: today } }, orderBy: { date: 'asc' } }),
      prisma.biometricLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
      prisma.userProfile.findUnique({ where: { userId } }),
      getActiveGoals()
    ])
    recovery = results[0]; nutrition = results[1]; workout = results[2]
    biometric = results[3]; profile = results[4]; goals = results[5]
  } catch (error) {
    console.error("Dashboard Data Fetch Error:", error)
    return (
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-black" style={{ color: 'var(--negative)' }}>Errore caricamento dati</h1>
        <p style={{ color: 'var(--fg-muted)' }}>{error instanceof Error ? error.message : "Errore database"}</p>
      </div>
    )
  }

  // Nutrition calcs
  const kcalActual = nutrition?.kcalActual || 0
  const kcalTarget = nutrition?.kcalTarget || 2200
  const kcalPct = Math.min(100, Math.round((kcalActual / kcalTarget) * 100))
  const proActual = Math.round(nutrition?.proteinG || 0)
  const carbActual = Math.round(nutrition?.carbsG || 0)
  const fatActual = Math.round(nutrition?.fatG || 0)
  const proteinTarget = profile?.weightKg ? Math.round(profile.weightKg * 2.0) : 160
  const fatTarget = profile?.weightKg ? Math.round(profile.weightKg * 0.8) : 70
  const carbsTarget = Math.round((kcalTarget - proteinTarget * 4 - fatTarget * 9) / 4)

  // Recovery score color
  const score = recovery?.recoveryScore ?? 0
  const scoreColor = score > 66 ? 'var(--positive)' : score > 33 ? 'var(--warning)' : 'var(--negative)'
  const scoreLabel = score > 66 ? 'OTTIMO' : score > 33 ? 'MODERATO' : score > 0 ? 'BASSO' : '--'

  // Athlete info
  const sportLevelMap = (profile?.sportLevels ?? {}) as Record<string, string>
  const primarySport = profile?.mainSports?.[0] ?? profile?.primarySport ?? null
  const sportLevel = primarySport ? (sportLevelMap[primarySport] ?? profile?.experienceLevel) : null
  const athleteStatusLabel = primarySport
    ? `${sportLevel ?? 'Atleta'} · ${String(primarySport).replace(/_/g, ' ')}`
    : (profile?.experienceLevel ?? 'Atleta')

  // Date
  const dayName = today.toLocaleDateString('it-IT', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })

  // Coach message
  const coachMsg = recovery?.recoveryScore != null
    ? score > 66
      ? `Recovery ${score}% — puoi spingere${workout?.type ? ` sulla sessione ${workout.type}` : ''} oggi.`
      : score > 33
      ? `Recovery ${score}% — allena con attenzione ai segnali del corpo.`
      : `Recovery ${score}% — valuta recupero attivo o intensità ridotta.`
    : `Sincronizza i dati di recupero per ricevere consigli personalizzati.`

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }} className="animate-page">

      {/* ── HEADER ── */}
      <div style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: '6px'
        }}>
          {dayName} · {dateStr}
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900,
          letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--fg-primary)',
          fontFamily: "'Sora', sans-serif"
        }}>
          {session.user.name?.split(' ')[0] || 'Atleta'}
        </h1>
      </div>

      {/* ── ROW 1: RECOVERY + TODAY'S SESSION ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}
        className="grid-responsive-1col">

        {/* Recovery */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '20px',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <p className="metric-label" style={{ marginBottom: '20px' }}>Recupero</p>

          {/* Giant score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: 'clamp(4rem, 10vw, 6rem)', fontWeight: 900, lineHeight: 1,
              letterSpacing: '-0.05em', color: scoreColor,
              fontFamily: "'Sora', sans-serif",
              fontVariantNumeric: 'tabular-nums',
            }}>
              {score > 0 ? score : '--'}
            </span>
            {score > 0 && (
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--fg-subtle)' }}>/100</span>
            )}
          </div>
          <p style={{
            fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: scoreColor, marginBottom: '28px'
          }}>
            {scoreLabel}
          </p>

          {/* HRV + TSB strip */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              { label: 'HRV', value: recovery?.hrv ? `${recovery.hrv}ms` : '--' },
              { label: 'TSB', value: recovery?.tsb != null ? String(recovery.tsb) : '--' },
              { label: 'Sonno', value: recovery?.sleepMin ? `${Math.round(recovery.sleepMin / 60)}h` : '--' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-subtle)' }}>{label}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{value}</p>
              </div>
            ))}
          </div>

          <Link href="/recovery" style={{
            position: 'absolute', top: '20px', right: '20px',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-muted)',
          }}>
            <ChevronRight size={15} />
          </Link>
        </div>

        {/* Today's Session */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '20px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <p className="metric-label" style={{ marginBottom: '20px' }}>Allenamento Oggi</p>

          {workout ? (
            <>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 10px', borderRadius: '999px', marginBottom: '12px',
                background: 'var(--accent-dim)',
                border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                width: 'fit-content',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  In programma
                </span>
              </div>

              <h2 style={{
                fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 900,
                letterSpacing: '-0.04em', lineHeight: 1.1,
                color: 'var(--fg-primary)', fontFamily: "'Sora', sans-serif",
                marginBottom: '12px', flex: 1,
              }}>
                {workout.type?.replace(/_/g, ' ')}
              </h2>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                {workout.durationMin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: 'var(--fg-subtle)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg-muted)', fontVariantNumeric: 'tabular-nums' }}>{workout.durationMin} min</span>
                  </div>
                )}
                {workout.trainingLoad && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={13} style={{ color: 'var(--fg-subtle)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg-muted)' }}>TL {workout.trainingLoad}</span>
                  </div>
                )}
              </div>

              <Link href="/training/active" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px 24px', borderRadius: '12px',
                background: 'var(--accent)', color: 'var(--accent-on)',
                fontWeight: 800, fontSize: '14px', letterSpacing: '-0.01em',
                textDecoration: 'none',
                boxShadow: '0 4px 20px var(--glow-accent)',
                transition: 'filter 0.2s, transform 0.2s',
              }}>
                Inizia Sessione <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 900, color: 'var(--fg-subtle)', letterSpacing: '-0.03em', fontFamily: "'Sora', sans-serif", marginBottom: '8px' }}>
                Riposo
              </p>
              <p style={{ fontSize: '13px', color: 'var(--fg-subtle)', lineHeight: 1.5, marginBottom: '20px' }}>
                Nessuna sessione pianificata per oggi.
              </p>
              <Link href="/training" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 700, color: 'var(--accent)',
                letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none',
              }}>
                Vedi programma <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2: NUTRITION STRIP ── */}
      <Link href="/nutrition" style={{
        display: 'block', textDecoration: 'none',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '20px',
        padding: '28px 32px',
        marginBottom: '16px',
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p className="metric-label">Nutrizione Oggi</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{
              fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em',
              color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums'
            }}>{kcalActual}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg-subtle)' }}>/ {kcalTarget} kcal</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{
            height: '100%', width: `${kcalPct}%`, borderRadius: '3px',
            background: kcalPct >= 90 ? 'var(--positive)' : 'var(--accent)',
            transition: 'width 1s var(--ease-expo-out)',
          }} />
        </div>

        {/* Macros row */}
        <div style={{ display: 'flex', gap: '32px' }}>
          {[
            { label: 'Proteine', val: proActual, target: proteinTarget, unit: 'g', color: 'var(--accent)' },
            { label: 'Carboidrati', val: carbActual, target: carbsTarget, unit: 'g', color: 'var(--warning)' },
            { label: 'Grassi', val: fatActual, target: fatTarget, unit: 'g', color: 'var(--negative)' },
          ].map(({ label, val, target, unit, color }) => (
            <div key={label}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-subtle)', marginBottom: '2px' }}>{label}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {val}<span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fg-subtle)', marginLeft: '2px' }}>/ {target}{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </Link>

      {/* ── ROW 3: COACH MESSAGE ── */}
      <Link href="/coach" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        textDecoration: 'none',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '20px',
        padding: '20px 28px',
        marginBottom: '16px',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent)', boxShadow: '0 0 8px var(--glow-accent)',
          }} />
          <p style={{
            fontSize: '13px', fontWeight: 500, color: 'var(--fg-muted)',
            lineHeight: 1.5, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>Coach AI · </span>
            {coachMsg}
          </p>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }} />
      </Link>

      {/* ── ROW 4: STATS STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '40px' }}>
        {[
          {
            label: 'Peso',
            value: biometric?.weightKg ? `${biometric.weightKg}` : '--',
            unit: 'kg',
            href: '/body',
            icon: Activity,
          },
          {
            label: 'Status Atleta',
            value: athleteStatusLabel.split('·')[0].trim(),
            unit: athleteStatusLabel.includes('·') ? athleteStatusLabel.split('·')[1].trim() : '',
            href: '/plan',
            icon: Award,
          },
          {
            label: 'Streak',
            value: '4',
            unit: '/ 5 sessioni',
            href: '/training',
            icon: TrendingUp,
          },
        ].map(({ label, value, unit, href, icon: Icon }) => (
          <Link key={label} href={href} style={{
            textDecoration: 'none',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-subtle)', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--fg-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </p>
            {unit && <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fg-subtle)', marginTop: '3px' }}>{unit}</p>}
          </Link>
        ))}
      </div>

      {/* ── ROW 5: OBJECTIVES ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.03em',
            color: 'var(--fg-primary)', fontFamily: "'Sora', sans-serif"
          }}>
            Obiettivi
          </h2>
          <Link href="/plan" style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--fg-subtle)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            Tutti <ChevronRight size={12} />
          </Link>
        </div>
        <KPITracker goals={goals} />
      </div>

    </div>
  )
}

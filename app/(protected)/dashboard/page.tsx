'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Trophy, TrendingUp, TrendingDown, Minus, Dumbbell, Utensils, Activity } from 'lucide-react'
import KPITracker from '@/app/components/KPITracker'
import { getDashboardData } from '@/app/actions/dashboard'

type DashData = Awaited<ReturnType<typeof getDashboardData>>

// ── Circular SVG Progress Ring ──
function ProgressRing({ value, max, size = 72, stroke = 5, color = 'var(--accent)', bg = 'var(--border-default)' }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; bg?: string
}) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circ * (1 - pct)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)

  useEffect(() => {
    getDashboardData().then(setData)
  }, [])

  if (!data) return <DashboardSkeleton />

  const {
    userName, dayName, dateStr,
    score, scoreLabel, scoreBg,
    hrv, tsb, sleepH,
    workout,
    kcalActual, kcalTarget, kcalPct,
    proActual, carbActual, fatActual,
    proteinTarget, carbsTarget, fatTarget,
    coachMsg,
    weightKg, athleteLabel, sportName,
    goals,
    streakValue,
    streakUnit,
    weekSessionDates,
    weekSessionsCount,
    weekSessionsTarget,
    recentPRs,
    currentWeight,
    weightDelta,
    lastReport,
  } = data

  // Build week strip
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekStart = new Date(today)
  const dow = today.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  weekStart.setDate(today.getDate() + diff)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
  const sessionDateTimes = (weekSessionDates ?? []).map((iso: string) => {
    const d = new Date(iso); d.setHours(0,0,0,0); return d.getTime()
  })

  // Recovery color
  const hasScore = score > 0
  const recBg      = hasScore ? scoreBg : 'var(--bg-elevated)'
  const recText    = hasScore ? 'rgba(0,0,0,0.88)' : 'var(--fg-primary)'
  const recMuted   = hasScore ? 'rgba(0,0,0,0.45)' : 'var(--fg-subtle)'
  const recDivider = hasScore ? 'rgba(0,0,0,0.12)' : 'var(--border-default)'

  const sessCount  = weekSessionsCount ?? 0
  const sessTgt    = weekSessionsTarget ?? 5
  const ringColor  = sessCount >= sessTgt ? 'var(--positive)' : sessCount > 0 ? 'var(--accent)' : 'var(--border-strong)'

  return (
    <div className="animate-page athletic-panel" style={{ maxWidth: '980px', margin: '0 auto', padding: '18px 20px 72px' }}>

      {/* ── HEADER ── */}
      <header style={{ padding: '4px 0 24px', animation: 'fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
        <p style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'var(--fg-subtle)',
          marginBottom: '10px', fontFamily: "'JetBrains Mono', monospace",
        }}>
          {dayName} · {dateStr}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 0.9,
            color: 'var(--fg-primary)', margin: 0,
          }}>
            {userName}
          </h1>
          {(athleteLabel || sportName) && (
            <div style={{ textAlign: 'right', paddingBottom: '4px', flexShrink: 0 }}>
              {sportName && (
                <p style={{
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--accent)',
                  fontFamily: "'JetBrains Mono', monospace", margin: 0,
                }}>
                  {sportName}
                </p>
              )}
              {athleteLabel && (
                <p style={{
                  fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--fg-subtle)',
                  fontFamily: "'JetBrains Mono', monospace", margin: '2px 0 0',
                }}>
                  {athleteLabel}
                </p>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Week Strip + Progress Ring ── */}
      <div
        style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'stretch', animation: 'fade-up 0.4s 60ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Week calendar */}
        <div style={{
          flex: 1,
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: '16px', padding: '12px 14px',
        }}>
          <p style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--fg-subtle)',
            fontFamily: "'JetBrains Mono', monospace", marginBottom: '10px',
          }}>
            Settimana
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
            {weekDays.map((day, idx) => {
              const isToday = day.getTime() === today.getTime()
              const hasSession = sessionDateTimes.includes(day.getTime())
              const isFuture = day > today
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
                    color: isToday ? 'var(--accent)' : 'var(--fg-subtle)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {DAY_LABELS[idx]}
                  </span>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800,
                    background: isToday
                      ? 'var(--accent)'
                      : hasSession
                        ? 'color-mix(in srgb, var(--positive) 18%, var(--bg-elevated))'
                        : 'var(--bg-elevated)',
                    border: isToday ? 'none'
                      : hasSession ? '1px solid rgba(52,211,153,0.35)'
                      : '1px solid var(--border-subtle)',
                    color: isToday ? 'var(--accent-on)' : hasSession ? 'var(--positive)' : 'var(--fg-subtle)',
                    opacity: isFuture && !isToday ? 0.4 : 1,
                    transition: 'all 0.2s ease',
                  }}>
                    {hasSession && !isToday ? '✓' : day.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress ring + stats column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Weekly ring */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            minWidth: '88px',
          }}>
            <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ProgressRing value={sessCount} max={sessTgt} size={64} stroke={5} color={ringColor} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '18px', fontWeight: 900, color: 'var(--fg-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {sessCount}
                </span>
                <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}>
                  /{sessTgt}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
              Sessioni
            </span>
          </div>

          {/* Weight chip */}
          {currentWeight != null && (
            <div style={{
              flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '14px', padding: '10px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
              minWidth: '88px',
            }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'Sora', sans-serif" }}>
                {currentWeight}<span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--fg-muted)' }}>kg</span>
              </span>
              {weightDelta != null && weightDelta !== 0 && (
                <span style={{
                  fontSize: '10px', fontWeight: 800,
                  color: weightDelta < 0 ? 'var(--positive)' : 'var(--warning)',
                }}>
                  {weightDelta > 0 ? `+${weightDelta}` : weightDelta}
                </span>
              )}
              <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fg-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
                Peso
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent PRs ── */}
      {recentPRs && recentPRs.length > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: '16px', marginBottom: '10px',
          background: 'color-mix(in srgb, var(--accent) 6%, var(--bg-surface))',
          border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
          animation: 'fade-up 0.4s 80ms cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
            🏆 Record questa settimana
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recentPRs.map((pr: { exerciseName: string; weightKg: number | null; repsActual: number | null }, i: number) => (
              <div key={i} style={{
                padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                background: 'color-mix(in srgb, var(--accent) 12%, var(--bg-elevated))',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                color: 'var(--fg-primary)',
              }}>
                {pr.exerciseName} {pr.weightKg ? `${pr.weightKg}kg` : ''}{pr.repsActual ? `×${pr.repsActual}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          RECOVERY — full-width hero band
      ═══════════════════════════════════════════ */}
      <Link href="/recovery" style={{ textDecoration: 'none', display: 'block', marginBottom: '8px', animation: 'fade-up 0.45s 100ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <div
          className="dash-card-hover"
          style={{
            background: recBg,
            borderRadius: '20px',
            padding: 'clamp(28px, 4vw, 48px)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle noise texture when no data */}
          {!hasScore && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 80% 60% at 20% 50%, color-mix(in srgb, var(--accent) 5%, transparent), transparent)',
              pointerEvents: 'none',
            }} />
          )}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '24px 40px',
            alignItems: 'center',
            position: 'relative',
          }}>
            {/* Score */}
            <div>
              <p style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: recMuted,
                marginBottom: '8px', fontFamily: "'JetBrains Mono', monospace",
              }}>
                Recupero
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', lineHeight: 1 }}>
                <span style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 'clamp(5rem, 14vw, 9rem)',
                  fontWeight: 900, letterSpacing: '-0.07em',
                  color: recText, fontVariantNumeric: 'tabular-nums',
                  lineHeight: 0.88,
                }}>
                  {hasScore ? score : '–'}
                </span>
                {hasScore && (
                  <span style={{
                    fontSize: 'clamp(1rem, 2vw, 1.4rem)',
                    fontWeight: 700, color: recMuted,
                    marginBottom: '8px', letterSpacing: '-0.02em',
                  }}>
                    /100
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '11px', fontWeight: 900, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: recMuted,
                marginTop: '10px', fontFamily: "'Sora', sans-serif",
              }}>
                {hasScore ? scoreLabel : 'Aggiungi recupero →'}
              </p>
            </div>

            {/* Biometric strip */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
              {[
                { label: 'HRV',   value: hrv    ? `${hrv}`      : '––', unit: 'ms' },
                { label: 'SLEEP', value: sleepH ? `${sleepH}`   : '––', unit: 'h'  },
                { label: 'TSB',   value: tsb != null ? String(tsb) : '––', unit: '' },
              ].map(({ label, value, unit }, i) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '16px',
                  padding: '10px 0',
                  borderBottom: i < 2 ? `1px solid ${recDivider}` : 'none',
                }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: recMuted,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '1.1rem', fontWeight: 700,
                      color: recText, fontVariantNumeric: 'tabular-nums',
                    }}>
                      {value}
                    </span>
                    {unit && (
                      <span style={{ fontSize: '9px', fontWeight: 600, color: recMuted }}>
                        {unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* ═══════════════════════════════════════════
          SESSION + NUTRITION
      ═══════════════════════════════════════════ */}
      <div
        className="dash-2col"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px', animation: 'fade-up 0.45s 140ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* SESSION */}
        <div
          className="dash-card-hover"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '20px',
            padding: 'clamp(22px, 3.5vw, 36px)',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', minHeight: '210px',
          }}
        >
          <p style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--fg-subtle)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Oggi
          </p>

          {workout ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '10px' }}>
              <h2 style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 'clamp(1.6rem, 4.5vw, 2.4rem)',
                fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.95,
                color: 'var(--fg-primary)', textTransform: 'uppercase', margin: 0,
              }}>
                {workout.type?.replace(/_/g, ' ')}
              </h2>
              <div>
                <div style={{ display: 'flex', gap: '14px', margin: '12px 0 14px' }}>
                  {workout.durationMin && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: 'var(--fg-subtle)',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {workout.durationMin}&thinsp;MIN
                    </span>
                  )}
                  {workout.trainingLoad && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: 'var(--fg-subtle)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      TL&thinsp;{workout.trainingLoad}
                    </span>
                  )}
                </div>
                <Link href="/training/active" className="cta-primary" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 18px', borderRadius: '10px',
                  fontWeight: 800, fontSize: '12px', letterSpacing: '0.06em',
                  textTransform: 'uppercase', textDecoration: 'none',
                  transition: 'filter 0.2s, transform 0.2s',
                }}>
                  Inizia ora <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <p style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 'clamp(2rem, 5.5vw, 3rem)',
                fontWeight: 900, letterSpacing: '-0.06em',
                color: 'var(--fg-primary)',
                textTransform: 'uppercase', lineHeight: 1, margin: '0 0 14px',
              }}>
                Riposo
              </p>
              <Link href="/training" style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--accent)',
                textDecoration: 'none',
              }}>
                Pianifica <ChevronRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* NUTRITION */}
        <Link href="/nutrition" style={{ textDecoration: 'none' }}>
          <div
            className="dash-card-hover"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '20px',
              padding: 'clamp(22px, 3.5vw, 36px)',
              minHeight: '210px',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <p style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'var(--fg-subtle)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Nutrizione
            </p>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '3px' }}>
                <span style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 'clamp(2.4rem, 5.5vw, 3.4rem)',
                  fontWeight: 900, letterSpacing: '-0.06em',
                  color: kcalActual > 0 ? 'var(--fg-primary)' : 'var(--fg-subtle)', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                }}>
                  {kcalActual > 0 ? kcalActual : '––'}
                </span>
                {kcalTarget > 0 && (
                  <span style={{
                    fontSize: '11px', fontWeight: 600, color: 'var(--fg-subtle)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    / {kcalTarget}
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--fg-subtle)',
                fontFamily: "'JetBrains Mono', monospace", margin: '0 0 14px',
              }}>
                kcal
              </p>

              {kcalTarget > 0 && (
                <div style={{
                  height: '4px', background: 'var(--border-default)',
                  borderRadius: '3px', overflow: 'hidden', marginBottom: '16px',
                }}>
                  <div style={{
                    height: '100%', width: `${Math.min(kcalPct, 100)}%`,
                    background: kcalPct >= 95 ? 'var(--positive)' : kcalPct >= 60 ? 'var(--accent)' : 'var(--warning)',
                    borderRadius: '3px',
                    transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                {[
                  { label: 'PRO',  val: proActual,  color: 'var(--accent)'   },
                  { label: 'CARB', val: carbActual, color: 'var(--warning)'  },
                  { label: 'FAT',  val: fatActual,  color: 'var(--fg-muted)' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: '10px', padding: '8px 6px', textAlign: 'center',
                  }}>
                    <p style={{
                      fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em',
                      color: 'var(--fg-subtle)', marginBottom: '3px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {label}
                    </p>
                    <p style={{
                      fontSize: '13px', fontWeight: 900, color: val > 0 ? color : 'var(--fg-subtle)',
                      fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                      fontFamily: "'Sora', sans-serif",
                    }}>
                      {val > 0 ? `${val}g` : '–'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ═══════════════════════════════════════════
          AI COACH
      ═══════════════════════════════════════════ */}
      <Link href="/coach" style={{ textDecoration: 'none', display: 'block', marginBottom: '8px', animation: 'fade-up 0.45s 180ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', borderRadius: '14px',
          background: 'var(--accent-dim)',
          border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
          transition: 'background 0.2s, border-color 0.2s',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent)',
            boxShadow: '0 0 8px var(--glow-accent)',
            animation: 'pulse 2s infinite',
          }} />
          <p style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: 'var(--fg-muted)', lineHeight: 1.55, margin: 0 }}>
            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>Coach · </span>
            {coachMsg}
          </p>
          <ChevronRight size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        </div>
      </Link>

      {/* ── WEEKLY REPORT SNIPPET ── */}
      {lastReport && (
        <Link href="/coach" style={{ textDecoration: 'none', display: 'block', marginBottom: '8px', animation: 'fade-up 0.45s 200ms cubic-bezier(0.16,1,0.3,1) both' }}>
          <div className="dash-card-hover" style={{
            padding: '24px', borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, var(--accent), var(--accent2, var(--accent)), transparent)',
            }} />
            <p style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'var(--accent)',
              marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace",
            }}>
              Weekly Report · {new Date(lastReport.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
            </p>
            <p style={{
              fontSize: '13px', lineHeight: 1.6, color: 'var(--fg-primary)',
              margin: 0, opacity: 0.9, fontWeight: 500,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {lastReport.content.replace(/[*#]/g, '')}
            </p>
            <div style={{
              marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)',
            }}>
              Leggi tutto <ArrowRight size={10} />
            </div>
          </div>
        </Link>
      )}

      {/* ═══════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════ */}
      <div
        className="dash-stats-strip"
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px', overflow: 'hidden',
          marginBottom: '36px',
          animation: 'fade-up 0.45s 220ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {[
          { href: '/body',     label: 'Peso',   value: weightKg ? String(weightKg) : '––', unit: weightKg ? 'kg' : '', shrink: false },
          { href: '/plan',     label: 'Livello', value: athleteLabel ?? '––',              unit: sportName ?? '',       shrink: true  },
          { href: '/training', label: 'Streak', value: streakValue,                         unit: streakUnit,        shrink: false },
        ].map(({ href, label, value, unit, shrink }, i) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div
              className="dash-stat-cell"
              style={{
                padding: '20px 18px',
                borderRight: i < 2 ? '1px solid var(--border-default)' : 'none',
              }}
            >
              <p style={{
                fontSize: '8px', fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--fg-subtle)',
                marginBottom: '7px', fontFamily: "'JetBrains Mono', monospace",
              }}>
                {label}
              </p>
              <p style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: shrink ? 'clamp(0.85rem, 2vw, 1.05rem)' : 'clamp(1.5rem, 3.5vw, 2rem)',
                fontWeight: 900, letterSpacing: '-0.04em',
                color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1, margin: 0,
                textTransform: shrink ? 'uppercase' : 'none',
              }}>
                {value}
              </p>
              {unit && (
                <p style={{
                  fontSize: '9px', fontWeight: 600, color: 'var(--fg-subtle)',
                  marginTop: '4px', fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {unit}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          OBIETTIVI
      ═══════════════════════════════════════════ */}
      <div style={{ animation: 'fade-up 0.45s 260ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '14px',
        }}>
          <h2 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '1rem', fontWeight: 900,
            letterSpacing: '-0.03em', color: 'var(--fg-primary)', margin: 0,
          }}>
            Obiettivi
          </h2>
          <Link href="/plan" style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--fg-subtle)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Tutti <ChevronRight size={10} />
          </Link>
        </div>
        <KPITracker goals={goals} />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '18px 20px 72px' }} className="animate-page athletic-panel">
      {/* Header skeleton */}
      <div style={{ padding: '4px 0 24px' }}>
        <div className="skeleton" style={{ height: '10px', width: '140px', marginBottom: '14px' }} />
        <div className="skeleton" style={{ height: '60px', width: '55%', borderRadius: '10px' }} />
      </div>
      {/* Week strip */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <div className="skeleton" style={{ flex: 1, height: '100px', borderRadius: '16px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ width: '88px', height: '100px', borderRadius: '16px' }} />
        </div>
      </div>
      {/* Recovery */}
      <div className="skeleton" style={{ height: '180px', borderRadius: '20px', marginBottom: '8px' }} />
      {/* Session + Nutrition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div className="skeleton" style={{ height: '210px', borderRadius: '20px' }} />
        <div className="skeleton" style={{ height: '210px', borderRadius: '20px' }} />
      </div>
      {/* Coach */}
      <div className="skeleton" style={{ height: '48px', borderRadius: '14px', marginBottom: '8px' }} />
      {/* Stats strip */}
      <div className="skeleton" style={{ height: '80px', borderRadius: '16px', marginBottom: '36px' }} />
      {/* Goals */}
      <div className="skeleton" style={{ height: '16px', width: '100px', borderRadius: '8px', marginBottom: '14px' }} />
      <div className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
    </div>
  )
}

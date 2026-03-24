'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import KPITracker from '@/app/components/KPITracker'
import { getDashboardData } from '@/app/actions/dashboard'

type DashData = Awaited<ReturnType<typeof getDashboardData>>

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
  } = data

  // Recovery color — only applies when data exists
  const hasScore = score > 0
  const recBg      = hasScore ? scoreBg : 'var(--bg-elevated)'
  const recText    = hasScore ? 'rgba(0,0,0,0.88)' : 'var(--fg-primary)'
  const recMuted   = hasScore ? 'rgba(0,0,0,0.45)' : 'var(--fg-subtle)'
  const recDivider = hasScore ? 'rgba(0,0,0,0.12)' : 'var(--border-default)'

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '72px' }}>

      {/* ── HEADER ── */}
      <header style={{ padding: '4px 0 28px' }}>
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

      {/* ═══════════════════════════════════════════
          RECOVERY — full-width hero band
      ═══════════════════════════════════════════ */}
      <Link href="/recovery" style={{ textDecoration: 'none', display: 'block', marginBottom: '8px' }}>
        <div
          className="dash-card-hover"
          style={{
            background: recBg,
            borderRadius: '20px',
            padding: 'clamp(28px, 4vw, 48px)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '24px 40px',
            alignItems: 'center',
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
                {hasScore ? scoreLabel : 'Nessun dato'}
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
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}
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
                <Link href="/training/active" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--accent)', color: '#fff',
                  padding: '13px 18px', borderRadius: '10px',
                  fontWeight: 800, fontSize: '12px', letterSpacing: '0.06em',
                  textTransform: 'uppercase', textDecoration: 'none',
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
                  color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                }}>
                  {kcalActual}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: 'var(--fg-subtle)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  / {kcalTarget}
                </span>
              </div>
              <p style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--fg-subtle)',
                fontFamily: "'JetBrains Mono', monospace", margin: '0 0 14px',
              }}>
                kcal
              </p>

              <div style={{
                height: '3px', background: 'var(--border-default)',
                borderRadius: '2px', overflow: 'hidden', marginBottom: '16px',
              }}>
                <div style={{
                  height: '100%', width: `${kcalPct}%`,
                  background: kcalPct >= 95 ? 'var(--positive)' : kcalPct >= 60 ? 'var(--accent)' : 'var(--warning)',
                  borderRadius: '2px',
                  transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                {[
                  { label: 'PRO',  val: proActual,  color: 'var(--accent)'   },
                  { label: 'CARB', val: carbActual, color: 'var(--warning)'  },
                  { label: 'FAT',  val: fatActual,  color: 'var(--fg-muted)' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px', padding: '7px 6px', textAlign: 'center',
                  }}>
                    <p style={{
                      fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em',
                      color: 'var(--fg-subtle)', marginBottom: '3px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {label}
                    </p>
                    <p style={{
                      fontSize: '13px', fontWeight: 900, color,
                      fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                      fontFamily: "'Sora', sans-serif",
                    }}>
                      {val}g
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
      <Link href="/coach" style={{ textDecoration: 'none', display: 'block', marginBottom: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', borderRadius: '14px',
          background: 'var(--accent-dim)',
          border: '1px solid color-mix(in srgb, var(--accent) 14%, transparent)',
          transition: 'background 0.2s',
        }}>
          <div style={{
            width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
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

      {/* ═══════════════════════════════════════════
          STATS STRIP — single bar, no separate cards
      ═══════════════════════════════════════════ */}
      <div
        className="dash-stats-strip"
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px', overflow: 'hidden',
          marginBottom: '36px',
        }}
      >
        {[
          { href: '/body',     label: 'Peso',   value: weightKg ? String(weightKg) : '––', unit: weightKg ? 'kg' : '', shrink: false },
          { href: '/plan',     label: 'Livello', value: athleteLabel ?? '––',              unit: sportName ?? '',       shrink: true  },
          { href: '/training', label: 'Streak', value: '4',                                unit: '/ 5 sessioni',        shrink: false },
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
      <div>
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
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '72px' }}>
      <div style={{ padding: '4px 0 28px' }}>
        <div style={{ height: '10px', width: '120px', borderRadius: '5px', background: 'var(--bg-elevated)', marginBottom: '12px' }} />
        <div style={{ height: '64px', width: '240px', borderRadius: '8px', background: 'var(--bg-elevated)' }} />
      </div>
      <div style={{ height: '180px', borderRadius: '20px', background: 'var(--bg-elevated)', marginBottom: '8px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        {[0, 1].map(i => <div key={i} style={{ height: '210px', borderRadius: '20px', background: 'var(--bg-elevated)' }} />)}
      </div>
      <div style={{ height: '44px', borderRadius: '14px', background: 'var(--bg-elevated)', marginBottom: '8px' }} />
      <div style={{ height: '80px', borderRadius: '16px', background: 'var(--bg-elevated)', marginBottom: '36px' }} />
    </div>
  )
}

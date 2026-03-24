'use client'

// NOTE: This is a client component to enable hover animations.
// Data fetching is done via server action imported below.
// If you prefer server component, move the data fetch back and remove useState/useEffect.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import KPITracker from '@/app/components/KPITracker'
import { getDashboardData } from '@/app/actions/dashboard'

export default function DashboardPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardData>> | null>(null)

  useEffect(() => {
    getDashboardData().then(setData)
  }, [])

  if (!data) return <DashboardSkeleton />

  const {
    userName, dayName, dateStr,
    score, scoreLabel, scoreColor, scoreBg,
    hrv, tsb, sleepH,
    workout,
    kcalActual, kcalTarget, kcalPct,
    proActual, carbActual, fatActual,
    proteinTarget, carbsTarget, fatTarget,
    coachMsg,
    weightKg, athleteLabel, sportName,
    goals,
  } = data

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* ── HEADER ── */}
      <header style={{ marginBottom: '32px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--fg-subtle)',
          marginBottom: '4px',
        }}>
          {dayName} · {dateStr}
        </p>
        <h1 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
          fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1,
          color: 'var(--fg-primary)',
        }}>
          {userName}
        </h1>
      </header>

      {/* ── HERO ROW: RECOVERY + SESSION ── */}
      <div className="dash-hero-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

        {/* RECOVERY — colored fill card */}
        <Link href="/recovery" style={{ textDecoration: 'none' }}>
          <div className="dash-card-hover" style={{
            background: scoreBg,
            borderRadius: '24px',
            padding: '32px 28px',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'transform 0.2s var(--ease-expo-out), box-shadow 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Label */}
            <p style={{
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: score > 0 ? 'rgba(0,0,0,0.45)' : 'var(--fg-subtle)',
            }}>Recupero</p>

            {/* Giant score */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', lineHeight: 1 }}>
                <span style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 'clamp(4.5rem, 12vw, 7rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.06em',
                  color: score > 0 ? '#000' : 'var(--fg-subtle)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {score > 0 ? score : '--'}
                </span>
                {score > 0 && (
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)' }}>/100</span>
                )}
              </div>
              <p style={{
                fontSize: '11px', fontWeight: 900, letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: score > 0 ? 'rgba(0,0,0,0.5)' : 'var(--fg-subtle)',
                marginTop: '4px',
              }}>
                {scoreLabel}
              </p>
            </div>

            {/* HRV / Sonno strip */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
              {[
                { label: 'HRV', value: hrv ? `${hrv}ms` : '--' },
                { label: 'Sonno', value: sleepH ? `${sleepH}h` : '--' },
                { label: 'TSB', value: tsb != null ? String(tsb) : '--' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: score > 0 ? 'rgba(0,0,0,0.4)' : 'var(--fg-subtle)' }}>{label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: score > 0 ? 'rgba(0,0,0,0.75)' : 'var(--fg-muted)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* SESSION — dark dramatic card */}
        <div className="dash-card-hover" style={{
          background: workout ? 'var(--fg-primary)' : 'var(--bg-elevated)',
          borderRadius: '24px',
          padding: '32px 28px',
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 0.2s var(--ease-expo-out)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <p style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: workout ? 'rgba(255,255,255,0.4)' : 'var(--fg-subtle)',
          }}>Oggi</p>

          {workout ? (
            <>
              {/* Session type huge */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <h2 style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  lineHeight: 1.05,
                  color: 'var(--bg-base)',
                  textTransform: 'uppercase',
                }}>
                  {workout.type?.replace(/_/g, '\n')}
                </h2>
              </div>

              {/* Meta + CTA */}
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  {workout.durationMin && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                      {workout.durationMin} min
                    </span>
                  )}
                  {workout.trainingLoad && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(0,0,0,0.4)' }}>
                      TL {workout.trainingLoad}
                    </span>
                  )}
                </div>
                <Link href="/training/active" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--accent)', color: '#fff',
                  padding: '13px 18px', borderRadius: '12px',
                  fontWeight: 800, fontSize: '13px', letterSpacing: '-0.01em',
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px var(--glow-accent)',
                }}>
                  Inizia <ArrowRight size={15} />
                </Link>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
                fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--fg-subtle)',
                textTransform: 'uppercase', lineHeight: 1,
              }}>Riposo</p>
              <p style={{ fontSize: '13px', color: 'var(--fg-subtle)', marginTop: '8px', marginBottom: '20px' }}>
                Nessuna sessione pianificata.
              </p>
              <Link href="/training" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'none',
              }}>
                Programma <ChevronRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── NUTRITION STRIP ── */}
      <Link href="/nutrition" style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
        <div className="dash-card-hover" style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '20px',
          padding: '24px 28px',
          transition: 'border-color 0.2s, transform 0.2s var(--ease-expo-out)',
        }}>
          {/* Top row: label + kcal */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-subtle)' }}>
              Nutrizione
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.04em',
                color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums',
              }}>{kcalActual}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fg-subtle)' }}>/ {kcalTarget} kcal</span>
            </div>
          </div>

          {/* Fat progress bar */}
          <div style={{ height: '5px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{
              height: '100%',
              width: `${kcalPct}%`,
              background: kcalPct >= 95 ? 'var(--positive)' : kcalPct >= 60 ? 'var(--accent)' : 'var(--warning)',
              borderRadius: '3px',
              transition: 'width 1.2s var(--ease-expo-out)',
            }} />
          </div>

          {/* Macros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
            {[
              { label: 'Proteine', val: proActual, target: proteinTarget, color: 'var(--accent)' },
              { label: 'Carboidrati', val: carbActual, target: carbsTarget, color: 'var(--warning)' },
              { label: 'Grassi', val: fatActual, target: fatTarget, color: 'var(--negative)' },
            ].map(({ label, val, target, color }) => {
              const pct = Math.min(100, Math.round((val / target) * 100))
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-subtle)' }}>{label}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fg-muted)', fontVariantNumeric: 'tabular-nums' }}>{val}g</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Link>

      {/* ── COACH STRIP ── */}
      <Link href="/coach" style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'var(--accent-dim)',
          border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
          transition: 'background 0.2s',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent)',
            boxShadow: '0 0 8px var(--glow-accent)',
            animation: 'pulse 2s infinite',
          }} />
          <p style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>
            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>Coach · </span>
            {coachMsg}
          </p>
          <ChevronRight size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        </div>
      </Link>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '40px' }}>
        {/* Weight */}
        <Link href="/body" style={{ textDecoration: 'none' }}>
          <div className="dash-card-hover" style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '16px', padding: '18px 16px',
            transition: 'transform 0.2s var(--ease-expo-out), border-color 0.2s',
          }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: '6px' }}>Peso</p>
            <p style={{
              fontFamily: "'Sora', sans-serif", fontSize: '1.6rem', fontWeight: 900,
              letterSpacing: '-0.05em', color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums',
            }}>
              {weightKg ?? '--'}
            </p>
            <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-subtle)', marginTop: '2px' }}>kg</p>
          </div>
        </Link>

        {/* Athlete */}
        <Link href="/plan" style={{ textDecoration: 'none' }}>
          <div className="dash-card-hover" style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '16px', padding: '18px 16px',
            transition: 'transform 0.2s var(--ease-expo-out), border-color 0.2s',
          }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: '6px' }}>Livello</p>
            <p style={{
              fontFamily: "'Sora', sans-serif", fontSize: '1.1rem', fontWeight: 900,
              letterSpacing: '-0.04em', color: 'var(--fg-primary)', lineHeight: 1.1,
              textTransform: 'uppercase',
            }}>
              {athleteLabel}
            </p>
            {sportName && <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-subtle)', marginTop: '4px' }}>{sportName}</p>}
          </div>
        </Link>

        {/* Streak dots */}
        <Link href="/training" style={{ textDecoration: 'none' }}>
          <div className="dash-card-hover" style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '16px', padding: '18px 16px',
            transition: 'transform 0.2s var(--ease-expo-out), border-color 0.2s',
          }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: '10px' }}>Streak</p>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '6px' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: i <= 4 ? 'var(--accent)' : 'var(--border-strong)',
                  boxShadow: i <= 4 ? '0 0 6px var(--glow-accent)' : 'none',
                }} />
              ))}
            </div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fg-muted)' }}>4 / 5 sessioni</p>
          </div>
        </Link>
      </div>

      {/* ── OBJECTIVES ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{
            fontFamily: "'Sora', sans-serif", fontSize: '1rem', fontWeight: 900,
            letterSpacing: '-0.03em', color: 'var(--fg-primary)',
          }}>Obiettivi</h2>
          <Link href="/plan" style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--fg-subtle)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            Tutti <ChevronRight size={11} />
          </Link>
        </div>
        <KPITracker goals={goals} />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '48px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ height: '11px', width: '120px', borderRadius: '6px', background: 'var(--bg-elevated)', marginBottom: '8px' }} />
        <div style={{ height: '48px', width: '200px', borderRadius: '10px', background: 'var(--bg-elevated)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {[0,1].map(i => (
          <div key={i} style={{ height: '220px', borderRadius: '24px', background: 'var(--bg-elevated)' }} />
        ))}
      </div>
      <div style={{ height: '130px', borderRadius: '20px', background: 'var(--bg-elevated)', marginBottom: '12px' }} />
      <div style={{ height: '48px', borderRadius: '16px', background: 'var(--bg-elevated)', marginBottom: '12px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ height: '90px', borderRadius: '16px', background: 'var(--bg-elevated)' }} />
        ))}
      </div>
    </div>
  )
}

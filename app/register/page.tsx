'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, ShieldCheck, Mail, Lock, User, Loader2, ArrowRight, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setPasswordError('')

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setPasswordError('Le password non coincidono')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password,
          name: formData.get('name'),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore durante la registrazione')
      setStep('success')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-base">
        <div className="bg-surface/40 backdrop-blur-xl p-10 rounded-[3rem] border border-default shadow-2xl max-w-md w-full text-center space-y-6">
          <CheckCircle className="mx-auto" size={48} style={{ color: 'var(--positive)' }} />
          <h2 className="text-2xl font-bold text-primary">Account creato!</h2>
          <p className="text-muted">Ora puoi accedere con le tue credenziali.</p>
          <Link
            href="/login"
            className="btn-primary block w-full py-4 rounded-2xl font-bold text-center transition-all hover:-translate-y-0.5"
          >
            Vai al Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden relative bg-base">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'var(--accent-dim)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'var(--accent2-dim)' }} />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-2">
          <div
            className="inline-flex p-4 rounded-[2rem] mb-4"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', boxShadow: '0 0 30px var(--glow-accent)' }}
          >
            <Dumbbell size={32} style={{ color: 'var(--accent-on)' }} />
          </div>
          <h1 className="text-5xl font-black text-primary tracking-tighter">
            Performance<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p className="text-muted font-medium tracking-wide uppercase text-[10px]">
            Crea il tuo account gratuito
          </p>
        </div>

        <div className="bg-surface/40 backdrop-blur-xl p-10 rounded-[3rem] border border-default shadow-2xl relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-1 opacity-50"
            style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
          />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Nome *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" name="name" required placeholder="Giorgio"
                  className="input-field w-full pl-12 pr-4 py-4 rounded-2xl font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="email" name="email" required placeholder="tu@email.com"
                  className="input-field w-full pl-12 pr-4 py-4 rounded-2xl font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="password" name="password" required minLength={8} placeholder="Minimo 8 caratteri"
                  className="input-field w-full pl-12 pr-4 py-4 rounded-2xl font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Conferma Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="password" name="confirmPassword" required placeholder="Ripeti la password"
                  className="input-field w-full pl-12 pr-4 py-4 rounded-2xl font-medium"
                  style={passwordError ? { borderColor: 'var(--negative)' } : {}}
                />
              </div>
              {passwordError && <p className="text-[11px] font-bold ml-1" style={{ color: 'var(--negative)' }}>{passwordError}</p>}
            </div>

            {error && (
              <div
                className="p-4 rounded-2xl flex items-center gap-3"
                style={{ background: 'var(--negative-dim)', border: '1px solid var(--negative)' }}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--negative)' }} />
                <p className="text-xs font-bold" style={{ color: 'var(--negative)' }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary group relative w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <><span>Crea Account</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-subtle text-center">
            <p className="text-xs text-muted font-medium">
              Hai già un account?{' '}
              <Link href="/login" className="font-bold hover:underline text-accent">Accedi</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

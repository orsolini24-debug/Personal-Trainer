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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0a0a0f]">
        <div className="bg-[#111118]/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl max-w-md w-full text-center space-y-6">
          <CheckCircle className="mx-auto text-[#10b981]" size={48} />
          <h2 className="text-2xl font-bold text-[#f1f5f9]">Account creato!</h2>
          <p className="text-[#64748b]">Ora puoi accedere con le tue credenziali.</p>
          <Link href="/login" className="block w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white py-4 rounded-2xl font-bold text-center hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all hover:-translate-y-0.5">
            Vai al Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden relative bg-[#0a0a0f]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3b82f6]/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6366f1]/10 rounded-full blur-[120px] animate-pulse" />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-gradient-to-br from-[#3b82f6] to-[#6366f1] rounded-[2rem] shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-4">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-[#f1f5f9] tracking-tighter">
            Performance<span className="text-[#3b82f6]">.</span>
          </h1>
          <p className="text-[#64748b] font-medium tracking-wide uppercase text-[10px]">
            Crea il tuo account gratuito
          </p>
        </div>

        <div className="bg-[#111118]/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-50" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Nome *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input type="text" name="name" required placeholder="Giorgio"
                  className="w-full pl-12 pr-4 py-4 bg-[#0a0a0f] border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f1f5f9] transition-all font-medium placeholder:text-[#64748b]/50" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input type="email" name="email" required placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-[#0a0a0f] border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f1f5f9] transition-all font-medium placeholder:text-[#64748b]/50" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input type="password" name="password" required minLength={8} placeholder="Minimo 8 caratteri"
                  className="w-full pl-12 pr-4 py-4 bg-[#0a0a0f] border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f1f5f9] transition-all font-medium placeholder:text-[#64748b]/50" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Conferma Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input type="password" name="confirmPassword" required placeholder="Ripeti la password"
                  className={`w-full pl-12 pr-4 py-4 bg-[#0a0a0f] border rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f1f5f9] transition-all font-medium placeholder:text-[#64748b]/50 ${passwordError ? 'border-[#ef4444]' : 'border-white/10'}`} />
              </div>
              {passwordError && <p className="text-[11px] text-[#ef4444] font-bold ml-1">{passwordError}</p>}
            </div>

            {error && (
              <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#ef4444] shrink-0" />
                <p className="text-xs text-[#ef4444] font-bold">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="group relative w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <><span>Crea Account</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-[#64748b] font-medium">
              Hai già un account?{' '}
              <Link href="/login" className="text-[#3b82f6] font-bold hover:underline">Accedi</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

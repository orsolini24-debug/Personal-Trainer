"use client"

import { signIn } from "next-auth/react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Credenziali non valide")
        setLoading(false)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("Si è verificato un errore")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-surface border border-subtle rounded-2xl shadow-2xl relative z-10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gradient">
          Bentornato
        </h2>
        <p className="text-muted mt-2">Accedi al tuo ecosistema di performance</p>
      </div>

      {registered && (
        <div
          className="mb-6 p-4 rounded-xl text-sm text-center"
          style={{ background: 'var(--positive-dim)', border: '1px solid var(--positive)', color: 'var(--positive)' }}
        >
          Registrazione completata! Ora puoi accedere.
        </div>
      )}

      {error && (
        <div
          className="mb-6 p-4 rounded-xl text-sm text-center"
          style={{ background: 'var(--negative-dim)', border: '1px solid var(--negative)', color: 'var(--negative)' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full px-4 py-3"
            placeholder="tu@email.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full px-4 py-3"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 px-4 disabled:opacity-50"
        >
          {loading ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Non hai un account?{" "}
        <Link href="/register" className="font-medium transition-colors text-accent hover:text-accent2">
          Registrati
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-base text-primary font-sans">
      {/* Hero Left Side */}
      <div
        className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center border-r border-subtle"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="relative z-10 p-12 max-w-lg">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 animate-pulse"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
            Performance Ecosystem
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight" style={{ color: 'var(--fg-primary)' }}>
            Eleva i tuoi <span className="text-gradient">standard</span>
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Monitora allenamento, nutrizione, recupero e biometria con il tuo AI Coach personale integrato.
          </p>
        </div>

        {/* Decorative glow */}
        <div className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen pointer-events-none" style={{ background: 'var(--accent-dim)' }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen pointer-events-none" style={{ background: 'var(--accent2-dim)' }} />
      </div>

      {/* Form Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <Suspense fallback={<div className="text-muted">Caricamento...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
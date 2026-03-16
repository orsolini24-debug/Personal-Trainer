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
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#6366f1]">
          Bentornato
        </h2>
        <p className="text-muted mt-2">Accedi al tuo ecosistema di performance</p>
      </div>

      {registered && (
        <div className="mb-6 p-4 bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] rounded-xl text-sm text-center">
          Registrazione completata! Ora puoi accedere.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] rounded-xl text-sm text-center">
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
            className="w-full px-4 py-3 rounded-xl border border-default bg-base text-primary placeholder:text-muted focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0)] focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
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
            className="w-full px-4 py-3 rounded-xl border border-default bg-base text-primary placeholder:text-muted focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0)] focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-xl font-medium transition-all transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Non hai un account?{" "}
        <Link href="/register" className="text-[#3b82f6] hover:text-[#6366f1] font-medium transition-colors">
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
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center border-r border-subtle">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f] z-0"></div>
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDB2MUgweiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNMTAgMHY0MGgxVjB6IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==')] z-0"></div>
        
        <div className="relative z-10 p-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] text-sm font-medium mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
            Performance Ecosystem
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
            Eleva i tuoi <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#6366f1]">standard</span>
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Monitora allenamento, nutrizione, recupero e biometria con il tuo AI Coach personale integrato.
          </p>
        </div>

        {/* Decorative glow */}
        <div className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#3b82f6]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-[#6366f1]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
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
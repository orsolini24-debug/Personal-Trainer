"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        name: fd.get("name"),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Errore durante la registrazione")
      setLoading(false)
      return
    }

    router.push("/login?registered=1")
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-[#f1f5f9] font-sans">
      {/* Hero Left Side */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f] z-0"></div>
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDB2MUgweiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNMTAgMHY0MGgxVjB6IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==')] z-0"></div>
        
        <div className="relative z-10 p-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] text-sm font-medium mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
            Performance Ecosystem
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
            Inizia il tuo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#6366f1]">percorso</span>
          </h1>
          <p className="text-lg text-[#64748b] leading-relaxed">
            Unisciti a noi e trasforma i tuoi dati in risultati tangibili.
          </p>
        </div>

        {/* Decorative glow */}
        <div className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#3b82f6]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-[#6366f1]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      </div>

      {/* Form Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md p-8 bg-[#111118] border border-white/5 rounded-2xl shadow-2xl relative z-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#6366f1]">
              Crea un account
            </h2>
            <p className="text-[#64748b] mt-2">Iscriviti per accedere alla piattaforma</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#f1f5f9] mb-1.5">Nome</label>
              <input
                name="name"
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0)] focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                placeholder="Il tuo nome"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#f1f5f9] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0)] focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#f1f5f9] mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0)] focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-xl font-medium transition-all transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:hover:translate-y-0 mt-2"
            >
              {loading ? "Creazione in corso..." : "Registrati"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#64748b]">
            Hai già un account?{" "}
            <Link href="/login" className="text-[#3b82f6] hover:text-[#6366f1] font-medium transition-colors">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
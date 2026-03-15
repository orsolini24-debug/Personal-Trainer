"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Dumbbell, Utensils, HeartPulse,
  MessageCircle, Activity, Calendar, BookOpen, LogOut
} from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Training", href: "/training", icon: Dumbbell },
  { name: "Nutrition", href: "/nutrition", icon: Utensils },
  { name: "Recovery", href: "/recovery", icon: HeartPulse },
  { name: "Coach", href: "/coach", icon: MessageCircle },
  { name: "Body", href: "/body", icon: Activity },
  { name: "Plan", href: "/plan", icon: Calendar },
  { name: "Guida", href: "/guida", icon: BookOpen },
]

const themes = [
  { id: "cobalt", color: "#3B82F6" },
  { id: "obsidian", color: "#FFFFFF" },
  { id: "sapphire", color: "#38BDF8" },
  { id: "forest", color: "#7BA05B" },
  { id: "sunset", color: "#F97316" },
  { id: "cyberpunk", color: "#00F2FF" },
  { id: "ocean", color: "#00BCD4" },
  { id: "rosegold", color: "#E879A0" },
  { id: "mono", color: "#888888" },
]

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [theme, setTheme] = useState("cobalt")
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("pe-theme") || "cobalt"
    setTheme(saved)
    document.documentElement.setAttribute("data-theme", saved)
  }, [])

  const applyTheme = (id: string) => {
    setTheme(id)
    localStorage.setItem("pe-theme", id)
    document.documentElement.setAttribute("data-theme", id)
    setShowPicker(false)
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-base)", color: "var(--fg-primary)" }}
    >
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col z-40 relative transition-[width] duration-300 ease-in-out overflow-hidden shrink-0"
        style={{
          width: expanded ? "220px" : "64px",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-default)",
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => { setExpanded(false); setShowPicker(false) }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-4 shrink-0 gap-3"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 text-white"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))",
              boxShadow: "0 0 16px var(--glow-accent)",
            }}
          >
            PE
          </div>
          <span
            className="font-black text-sm whitespace-nowrap transition-all duration-200"
            style={{
              opacity: expanded ? 1 : 0,
              transform: expanded ? "translateX(0)" : "translateX(-8px)",
              background: "linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ecosystem
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={item.name}
                    className="flex items-center rounded-xl transition-all duration-150"
                    style={{
                      padding: "8px",
                      color: active ? "var(--accent)" : "var(--fg-subtle)",
                      background: active ? "var(--accent-dim)" : "transparent",
                      borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span
                      className="ml-2 text-sm font-medium whitespace-nowrap transition-all duration-200"
                      style={{ opacity: expanded ? 1 : 0 }}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Theme picker + logout */}
        <div className="p-2 shrink-0" style={{ borderTop: "1px solid var(--border-default)" }}>
          {/* Theme dots */}
          {showPicker && (
            <div className="mb-2 px-1">
              <div className="flex flex-wrap gap-2 justify-center">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => applyTheme(t.id)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-125"
                    style={{
                      backgroundColor: t.color,
                      boxShadow: theme === t.id ? `0 0 0 2px var(--bg-sidebar), 0 0 0 4px ${t.color}` : "none",
                    }}
                    title={t.id}
                  />
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowPicker(v => !v)}
            className="w-full flex items-center rounded-xl p-2 gap-2 transition-colors"
            style={{ color: "var(--fg-subtle)" }}
            title="Tema"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: themes.find(t => t.id === theme)?.color }}
              />
            </div>
            <span className="text-xs font-medium whitespace-nowrap transition-opacity duration-200" style={{ opacity: expanded ? 1 : 0 }}>
              Tema: {theme}
            </span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center rounded-xl p-2 gap-2 mt-1 transition-colors"
            style={{ color: "var(--fg-subtle)" }}
            title="Esci"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium whitespace-nowrap transition-opacity duration-200" style={{ opacity: expanded ? 1 : 0 }}>
              Esci
            </span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--bg-base) 80%, transparent)",
          borderTop: "1px solid var(--border-default)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }}
        />
        <ul className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center min-w-[44px] py-1 transition-colors"
                  style={{ color: active ? "var(--accent)" : "var(--fg-subtle)" }}
                >
                  <item.icon className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

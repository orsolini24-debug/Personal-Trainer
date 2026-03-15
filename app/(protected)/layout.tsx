'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Dumbbell, Utensils, HeartPulse,
  MessageCircle, Activity, Calendar, LogOut,
  HelpCircle, Menu, X,
} from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import HelpPanel from '@/components/HelpPanel'
import ThemeToggle from '@/components/ThemeToggle'

const navItems = [
  { name: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { name: 'Training',   href: '/training',   icon: Dumbbell },
  { name: 'Nutrition',  href: '/nutrition',  icon: Utensils },
  { name: 'Recovery',   href: '/recovery',   icon: HeartPulse },
  { name: 'Coach',      href: '/coach',      icon: MessageCircle },
  { name: 'Body',       href: '/body',       icon: Activity },
  { name: 'Plan',       href: '/plan',       icon: Calendar },
]

function NavLink({ item, active, onClick }: { item: typeof navItems[0]; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 w-full"
      style={{
        background: active ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
        color: active ? 'var(--fg-primary)' : 'var(--fg-muted)',
        boxShadow: active ? '0 4px 12px var(--accent-dim)' : 'none',
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          background: active ? 'var(--accent)' : 'var(--bg-input)',
          border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
          color: active ? 'var(--accent-on)' : 'var(--fg-muted)',
        }}
      >
        <item.icon size={16} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-sm font-bold tracking-tight">{item.name}</span>
      {active && (
        <div
          className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}
        />
      )}
    </Link>
  )
}

function SidebarContent({ pathname, onHelp, onClose }: { pathname: string; onHelp: () => void; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8 shrink-0">
        <div
          className="w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-sm text-white shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))',
            boxShadow: '0 8px 20px -4px var(--glow-accent)',
          }}
        >
          PE
        </div>
        <div>
          <span
            className="font-black text-base tracking-tight block leading-none"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Performance
          </span>
          <span className="text-[9px] font-black uppercase" style={{ color: 'var(--fg-muted)', letterSpacing: '0.2em' }}>
            Ecosystem
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <NavLink key={item.href} item={item} active={active} onClick={onClose} />
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 pt-4 space-y-1" style={{ borderTop: '1px solid var(--border-default)' }}>
        <button
          onClick={onHelp}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group"
          style={{ color: 'var(--fg-muted)' }}
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <HelpCircle size={18} />
          </div>
          <span className="text-sm font-bold tracking-tight">Guida & Aiuto</span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group"
          style={{ color: 'var(--fg-muted)' }}
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <LogOut size={18} />
          </div>
          <span className="text-sm font-bold tracking-tight">Esci</span>
        </button>
      </div>
    </div>
  )
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showHelp, setShowHelp]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: 'var(--bg-base)', color: 'var(--fg-primary)' }}>

      {/* Help Panel */}
      <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} />

      {/* Desktop Sidebar */}
      <div
        className="hidden md:flex flex-col w-60 h-screen shrink-0"
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-default)' }}
      >
        <SidebarContent pathname={pathname} onHelp={() => setShowHelp(true)} />
      </div>

      {/* Mobile: hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--fg-primary)',
        }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile: overlay sidebar */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className="md:hidden fixed inset-y-0 left-0 z-50 flex flex-col"
        style={{
          width: 'min(288px, 85vw)',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl"
          style={{ color: 'var(--fg-muted)' }}
        >
          <X size={18} />
        </button>
        <SidebarContent pathname={pathname} onHelp={() => { setShowHelp(true); setMobileOpen(false) }} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="h-14 md:h-16 flex items-center justify-between pl-16 pr-4 md:px-6 shrink-0"
          style={{
            borderBottom: '1px solid var(--border-default)',
            backdropFilter: 'blur(32px)',
            background: 'color-mix(in srgb, var(--bg-base) 80%, transparent)',
          }}
        >
          <div />
          <ThemeToggle />
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 pb-28 md:pb-8 max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'color-mix(in srgb, var(--bg-sidebar) 92%, transparent)',
          borderTop: '1px solid var(--border-default)',
          backdropFilter: 'blur(40px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
        />
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-2xl min-w-[52px] transition-all"
                style={{
                  color: active ? 'var(--accent)' : 'var(--fg-subtle)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                }}
              >
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[9px] font-black uppercase" style={{ letterSpacing: '0.05em' }}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

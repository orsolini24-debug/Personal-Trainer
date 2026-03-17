'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Dumbbell, Utensils, HeartPulse,
  MessageCircle, Activity, Calendar, LogOut,
  HelpCircle, Menu, X, BookOpen, MoreHorizontal,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import HelpPanel from '@/components/HelpPanel'
import ThemeToggle from '@/components/ThemeToggle'

const navItems = [
  { name: 'Dashboard',  href: '/dashboard',         icon: LayoutDashboard, exact: false },
  { name: 'Training',   href: '/training',          icon: Dumbbell,        exact: true  },
  { name: 'Libreria',   href: '/training/library',  icon: BookOpen,        exact: false },
  { name: 'Nutrition',  href: '/nutrition',         icon: Utensils,        exact: false },
  { name: 'Recovery',   href: '/recovery',          icon: HeartPulse,      exact: false },
  { name: 'Coach',      href: '/coach',             icon: MessageCircle,   exact: false },
  { name: 'Body',       href: '/body',              icon: Activity,        exact: false },
  { name: 'Plan',       href: '/plan',              icon: Calendar,        exact: false },
]

const PRIMARY_NAV = navItems.slice(0, 4)
const MORE_NAV = navItems.slice(4)

function isActive(item: typeof navItems[0], pathname: string) {
  return item.exact
    ? pathname === item.href || pathname.startsWith(item.href + '/active')
    : pathname === item.href || pathname.startsWith(item.href + '/')
}

function NavLink({ item, active, onClick }: { item: typeof navItems[0]; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full group"
      style={{
        background: active ? 'var(--bg-elevated)' : 'transparent',
        color: active ? 'var(--fg-primary)' : 'var(--fg-muted)',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-300"
        style={{
          height: active ? '60%' : '0%',
          background: 'var(--accent)',
          boxShadow: active ? '0 0 8px var(--accent)' : 'none',
        }}
      />

      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          background: active ? 'var(--accent)' : 'transparent',
          color: active ? 'var(--accent-on, #fff)' : 'var(--fg-muted)',
        }}
      >
        <item.icon size={15} strokeWidth={active ? 2.5 : 1.8} />
      </div>

      <span className="text-sm font-semibold tracking-tight flex-1">{item.name}</span>

      {active && (
        <ChevronRight
          size={14}
          style={{ color: 'var(--fg-subtle)' }}
        />
      )}
    </Link>
  )
}

function UserAvatar({ onLogout }: { onLogout: () => void }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl"
      style={{ borderTop: '1px solid var(--border-default)' }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-xs"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))',
          color: '#fff',
          boxShadow: '0 0 0 2px var(--bg-sidebar), 0 0 0 3px var(--accent)',
        }}
      >
        G
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: 'var(--fg-primary)' }}>Giorgio</p>
        <p className="text-[10px] truncate" style={{ color: 'var(--fg-muted)' }}>Atleta</p>
      </div>
      <button
        onClick={onLogout}
        className="p-1.5 rounded-lg transition-all"
        style={{ color: 'var(--fg-muted)' }}
        title="Esci"
      >
        <LogOut size={14} />
      </button>
    </div>
  )
}

function SidebarContent({ pathname, onHelp, onClose }: { pathname: string; onHelp: () => void; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full py-5 px-3">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-7 shrink-0">
        <div
          className="w-9 h-9 rounded-[12px] flex items-center justify-center font-black text-xs text-white shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))',
            boxShadow: '0 6px 16px -2px var(--glow-accent, rgba(0,0,0,0.25))',
          }}
        >
          PE
        </div>
        <div className="leading-none">
          <span
            className="font-black text-sm tracking-tight block"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2, #6366f1))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Performance
          </span>
          <span
            className="text-[9px] font-black uppercase block mt-0.5"
            style={{ color: 'var(--fg-subtle)', letterSpacing: '0.18em' }}
          >
            Ecosystem
          </span>
        </div>
      </div>

      {/* Section label */}
      <p
        className="text-[9px] font-black uppercase px-3 mb-2 tracking-widest shrink-0"
        style={{ color: 'var(--fg-subtle)' }}
      >
        Menu
      </p>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto min-h-0 pr-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item, pathname)}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* Help */}
      <div
        className="shrink-0 pt-3 space-y-0.5"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        <button
          onClick={onHelp}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
          style={{ color: 'var(--fg-muted)' }}
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <HelpCircle size={15} strokeWidth={1.8} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Guida & Aiuto</span>
        </button>
      </div>

      {/* User avatar + logout */}
      <UserAvatar onLogout={() => signOut({ callbackUrl: '/login' })} />
    </div>
  )
}

function MobileMoreSheet({
  open,
  onClose,
  pathname,
}: {
  open: boolean
  onClose: () => void
  pathname: string
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{
          background: 'var(--bg-sidebar)',
          borderTop: '1px solid var(--border-default)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          transform: open ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'var(--border-default)' }}
          />
        </div>

        <div className="px-4 pt-2 pb-4">
          <p
            className="text-[10px] font-black uppercase tracking-widest px-1 mb-3"
            style={{ color: 'var(--fg-subtle)' }}
          >
            Altro
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MORE_NAV.map((item) => {
              const active = isActive(item, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                  style={{
                    background: active ? 'var(--bg-elevated)' : 'var(--bg-base)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
                    color: active ? 'var(--accent)' : 'var(--fg-muted)',
                  }}
                >
                  <item.icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-sm font-semibold">{item.name}</span>
                </Link>
              )
            })}
          </div>

          <div
            className="mt-4 pt-4"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
                color: 'var(--fg-muted)',
              }}
            >
              <LogOut size={18} strokeWidth={1.8} />
              <span className="text-sm font-semibold">Esci</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function getCurrentPageTitle(pathname: string): string {
  const found = navItems.find((item) =>
    item.exact
      ? pathname === item.href || pathname.startsWith(item.href + '/active')
      : pathname === item.href || pathname.startsWith(item.href + '/')
  )
  return found?.name ?? 'Performance Ecosystem'
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showHelp, setShowHelp] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const pageTitle = getCurrentPageTitle(pathname)

  return (
    <div
      className="flex h-[100dvh] overflow-hidden"
      style={{ background: 'var(--bg-base)', color: 'var(--fg-primary)' }}
    >
      {/* Help Panel */}
      <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} />

      {/* Desktop Sidebar */}
      <div
        className="hidden md:flex flex-col w-56 h-screen shrink-0"
        style={{
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
        }}
      >
        <SidebarContent pathname={pathname} onHelp={() => setShowHelp(true)} />
      </div>

      {/* Mobile: hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--fg-primary)',
        }}
      >
        <Menu size={19} />
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
          className="absolute top-4 right-4 p-1.5 rounded-xl"
          style={{ color: 'var(--fg-muted)' }}
        >
          <X size={17} />
        </button>
        <SidebarContent
          pathname={pathname}
          onHelp={() => { setShowHelp(true); setMobileOpen(false) }}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* More Sheet (mobile) */}
      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        pathname={pathname}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between shrink-0"
          style={{
            height: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingLeft: '4rem',
            paddingRight: '1rem',
            borderBottom: '1px solid var(--border-default)',
            backdropFilter: 'blur(32px)',
            background: 'color-mix(in srgb, var(--bg-base) 80%, transparent)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
          /* on md+, override padding */
        >
          {/* Page title shown on mobile */}
          <div className="md:hidden flex items-center">
            <span
              className="text-sm font-black tracking-tight"
              style={{ color: 'var(--fg-primary)' }}
            >
              {pageTitle}
            </span>
          </div>
          {/* Desktop: empty left div */}
          <div className="hidden md:block" />

          <ThemeToggle />
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 pb-28 md:pb-8 max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav — 4 primary + More button */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'color-mix(in srgb, var(--bg-sidebar) 94%, transparent)',
          borderTop: '1px solid var(--border-default)',
          backdropFilter: 'blur(40px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          }}
        />

        <div className="flex items-center justify-around px-1 pt-1.5 pb-2">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-2xl min-w-[56px] transition-all duration-200"
                style={{
                  color: active ? 'var(--accent)' : 'var(--fg-subtle)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                }}
              >
                <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span
                  className="text-[9px] font-black uppercase"
                  style={{ letterSpacing: '0.05em' }}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-2xl min-w-[56px] transition-all duration-200"
            style={{
              color: MORE_NAV.some((item) => isActive(item, pathname))
                ? 'var(--accent)'
                : 'var(--fg-subtle)',
              background: MORE_NAV.some((item) => isActive(item, pathname))
                ? 'var(--accent-dim)'
                : 'transparent',
            }}
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
            <span
              className="text-[9px] font-black uppercase"
              style={{ letterSpacing: '0.05em' }}
            >
              Altro
            </span>
          </button>
        </div>
      </nav>
    </div>
  )
}

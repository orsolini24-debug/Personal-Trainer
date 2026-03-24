'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Dumbbell, Utensils, HeartPulse,
  MessageCircle, Activity, Calendar, CalendarDays, LogOut,
  HelpCircle, Menu, X, BookOpen, MoreHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import HelpPanel from '@/components/HelpPanel'
import ThemeToggle from '@/components/ThemeToggle'
import { Session } from 'next-auth'

const navItems = [
  { name: 'Dashboard',  href: '/dashboard',         icon: LayoutDashboard, exact: false },
  { name: 'Training',   href: '/training',          icon: Dumbbell,        exact: true  },
  { name: 'Calendario', href: '/calendar',          icon: CalendarDays,    exact: false },
  { name: 'Nutrition',  href: '/nutrition',         icon: Utensils,        exact: false },
  { name: 'Recovery',   href: '/recovery',          icon: HeartPulse,      exact: false },
  { name: 'Coach',      href: '/coach',             icon: MessageCircle,   exact: false },
  { name: 'Body',       href: '/body',              icon: Activity,        exact: false },
  { name: 'Plan',       href: '/plan',              icon: Calendar,        exact: false },
  { name: 'Libreria',   href: '/training/library',  icon: BookOpen,        exact: false },
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
      className="relative flex items-center gap-2.5 px-3 py-2.5 w-full"
      style={{
        borderRadius: 'var(--r-md, 14px)',
        background: active
          ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-elevated))'
          : 'transparent',
        color: active ? 'var(--fg-primary)' : 'var(--fg-muted)',
        border: active
          ? '1px solid color-mix(in srgb, var(--accent) 22%, transparent)'
          : '1px solid transparent',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Icon — accent on active */}
      <item.icon
        size={16}
        strokeWidth={active ? 2.2 : 1.7}
        style={{
          color: active ? 'var(--accent)' : 'var(--fg-muted)',
          flexShrink: 0,
          transition: 'color 180ms ease',
        }}
      />

      <span
        className="text-sm flex-1 tracking-tight"
        style={{ fontWeight: active ? 600 : 500 }}
      >
        {item.name}
      </span>

      {/* Active dot indicator */}
      {active && (
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--glow-accent)',
          }}
        />
      )}
    </Link>
  )
}

function UserAvatar({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  const userName = session?.user?.name || 'Atleta'
  const initial = userName.charAt(0).toUpperCase()

  return (
    <div
      className="flex items-center gap-3 px-2 py-2.5 mt-1"
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'color-mix(in srgb, var(--bg-elevated) 40%, transparent)',
        borderRadius: 'var(--r-md, 14px)',
      }}
    >
      {/* Avatar with ring */}
      <div style={{ position: 'relative' }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-xs"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-on, #fff)',
            boxShadow: '0 2px 8px var(--glow-accent)',
            fontSize: '11px',
          }}
        >
          {initial}
        </div>
        {/* Online dot */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
          style={{
            background: 'var(--positive)',
            border: '2px solid var(--bg-sidebar)',
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate leading-none" style={{ color: 'var(--fg-primary)' }}>{userName}</p>
        <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--fg-subtle)' }}>Atleta · Pro</p>
      </div>
      <button
        onClick={onLogout}
        className="p-1.5 rounded-lg transition-all hover:bg-[var(--bg-elevated)]"
        style={{ color: 'var(--fg-subtle)' }}
        title="Esci"
      >
        <LogOut size={13} />
      </button>
    </div>
  )
}

function SidebarContent({ pathname, session, onHelp, onClose }: { pathname: string; session: Session | null; onHelp: () => void; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full py-4 px-3 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-5 shrink-0">
        <div
          className="w-9 h-9 flex items-center justify-center font-black text-white shrink-0"
          style={{
            borderRadius: '10px',
            background: 'var(--accent)',
            boxShadow: '0 2px 12px var(--glow-accent)',
            fontSize: '11px',
            letterSpacing: '-0.02em',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          PE
        </div>
        <div className="leading-none">
          <span
            className="font-black text-sm tracking-tight block"
            style={{
              color: 'var(--accent)',
              letterSpacing: '-0.04em',
              fontSize: '13px',
            }}
          >
            Performance
          </span>
          <span
            className="text-[9px] font-bold uppercase block mt-0.5"
            style={{ color: 'var(--fg-subtle)', letterSpacing: '0.15em' }}
          >
            Ecosystem
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto min-h-0 scrollbar-hide">
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
      <button
        onClick={onHelp}
        className="shrink-0 w-full flex items-center gap-2.5 px-3 py-2.5 transition-all"
        style={{
          borderRadius: 'var(--r-md, 14px)',
          color: 'var(--fg-subtle)',
          border: '1px solid transparent',
          transition: 'all 180ms var(--ease-expo-out)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-muted)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-subtle)'
        }}
      >
        <HelpCircle size={15} strokeWidth={1.7} />
        <span className="text-sm font-medium tracking-tight">Guida & Aiuto</span>
      </button>

      {/* User avatar + logout */}
      <UserAvatar session={session} onLogout={() => signOut({ callbackUrl: '/login' })} />
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          borderRadius: '28px 28px 0 0',
          background: 'color-mix(in srgb, var(--bg-elevated) 96%, transparent)',
          backdropFilter: 'blur(48px) saturate(180%)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%)',
          borderTop: '1px solid var(--border-default)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          transform: open ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3), 0 -1px 0 var(--border-subtle)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: 'var(--border-strong)' }}
          />
        </div>

        <div className="px-4 pt-1 pb-4">
          <p
            className="text-[9px] font-black uppercase tracking-widest px-1 mb-3"
            style={{ color: 'var(--fg-subtle)', letterSpacing: '0.14em' }}
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
                  className="flex items-center gap-3 px-3 py-3 transition-all"
                  style={{
                    borderRadius: 'var(--r-lg, 20px)',
                    background: active
                      ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-surface))'
                      : 'var(--bg-surface)',
                    border: `1px solid ${active
                      ? 'color-mix(in srgb, var(--accent) 28%, transparent)'
                      : 'var(--border-default)'}`,
                    color: active ? 'var(--accent)' : 'var(--fg-muted)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <item.icon size={17} strokeWidth={active ? 2.2 : 1.7} />
                  <span className="text-sm font-semibold tracking-tight">{item.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="mt-3">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-3 transition-all"
              style={{
                borderRadius: 'var(--r-md, 14px)',
                background: 'color-mix(in srgb, var(--negative) 8%, var(--bg-surface))',
                border: '1px solid color-mix(in srgb, var(--negative) 20%, transparent)',
                color: 'var(--negative)',
              }}
            >
              <LogOut size={16} strokeWidth={1.8} />
              <span className="text-sm font-semibold tracking-tight">Esci</span>
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

export default function ProtectedLayout({ children, session }: { children: React.ReactNode; session: Session | null }) {
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
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <SidebarContent pathname={pathname} session={session} onHelp={() => setShowHelp(true)} />
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
          session={session}
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
            height: 'calc(3.25rem + env(safe-area-inset-top, 0px))',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingLeft: '4rem',
            paddingRight: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            background: 'color-mix(in srgb, var(--bg-base) 78%, transparent)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          {/* Page title shown on mobile */}
          <div className="md:hidden flex items-center">
            <span
              className="text-sm font-bold tracking-tight"
              style={{ color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}
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

      {/* Mobile Bottom Nav — iOS 2026 pill tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'color-mix(in srgb, var(--bg-sidebar) 92%, transparent)',
          borderTop: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(48px) saturate(180%)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-stretch justify-around px-2 pt-2 pb-1">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 flex-1"
                style={{ color: active ? 'var(--accent)' : 'var(--fg-subtle)' }}
              >
                {/* Pill behind icon when active */}
                <div
                  style={{
                    padding: '5px 16px',
                    borderRadius: '12px',
                    background: active
                      ? 'color-mix(in srgb, var(--accent) 14%, var(--bg-elevated))'
                      : 'transparent',
                    transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon size={21} strokeWidth={active ? 2.3 : 1.7} />
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                    paddingBottom: '4px',
                  }}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}

          {/* More button */}
          {(() => {
            const moreActive = MORE_NAV.some((item) => isActive(item, pathname))
            return (
              <button
                onClick={() => setMoreOpen(true)}
                className="flex flex-col items-center gap-1 flex-1"
                style={{ color: moreActive ? 'var(--accent)' : 'var(--fg-subtle)' }}
              >
                <div
                  style={{
                    padding: '5px 16px',
                    borderRadius: '12px',
                    background: moreActive
                      ? 'color-mix(in srgb, var(--accent) 14%, var(--bg-elevated))'
                      : 'transparent',
                    transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MoreHorizontal size={21} strokeWidth={1.7} />
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: moreActive ? 700 : 500,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                    paddingBottom: '4px',
                  }}
                >
                  Altro
                </span>
              </button>
            )
          })()}
        </div>
      </nav>
    </div>
  )
}

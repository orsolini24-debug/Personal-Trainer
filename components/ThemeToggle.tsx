'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Moon, Sun, MonitorSmartphone } from 'lucide-react'

type BaseTheme = 'cobalt' | 'obsidian' | 'sapphire' | 'forest' | 'sunset' | 'cyberpunk' | 'ocean' | 'rosegold' | 'mono'
type Variant = 'dark' | 'light'

const BASE_THEMES: { id: BaseTheme; label: string; color: string }[] = [
  { id: 'cobalt',    label: 'Cobalt',   color: '#3B82F6' },
  { id: 'obsidian',  label: 'Obsidian', color: '#FFFFFF' },
  { id: 'sapphire',  label: 'Sapphire', color: '#38BDF8' },
  { id: 'forest',    label: 'Forest',   color: '#7BA05B' },
  { id: 'sunset',    label: 'Sunset',   color: '#F97316' },
  { id: 'cyberpunk', label: 'Cyber',    color: '#00F2FF' },
  { id: 'ocean',     label: 'Ocean',    color: '#00BCD4' },
  { id: 'rosegold',  label: 'Rose',     color: '#E879A0' },
  { id: 'mono',      label: 'Mono',     color: '#888888' },
]

export default function ThemeToggle() {
  const [base, setBase]       = useState<BaseTheme>('cobalt')
  const [variant, setVariant] = useState<Variant>('dark')
  const [isAuto, setIsAuto]   = useState(false)
  const [open, setOpen]       = useState(false)
  const [pos, setPos]         = useState({ top: 0, right: 0 })
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('pe-theme') ?? 'cobalt-dark'
    if (saved === 'auto') {
      setIsAuto(true)
      document.documentElement.setAttribute('data-theme', 'cobalt')
    } else {
      const parts = saved.split('-')
      const v = parts[parts.length - 1] as Variant
      const b = parts.slice(0, -1).join('-') as BaseTheme
      if (BASE_THEMES.find(t => t.id === b)) {
        setBase(b); setVariant(v)
        document.documentElement.setAttribute('data-theme', saved)
      } else {
        // fallback: treat whole saved value as base theme id
        const bt = saved as BaseTheme
        if (BASE_THEMES.find(t => t.id === bt)) {
          setBase(bt)
          document.documentElement.setAttribute('data-theme', bt)
        }
      }
    }
  }, [])

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    setOpen(p => !p)
  }

  const apply = (b: BaseTheme, v: Variant, auto: boolean) => {
    setIsAuto(auto)
    if (auto) {
      document.documentElement.setAttribute('data-theme', 'cobalt')
      localStorage.setItem('pe-theme', 'auto')
    } else {
      setBase(b); setVariant(v)
      const id = v === 'dark' ? b : `${b}-${v}`
      document.documentElement.setAttribute('data-theme', id)
      localStorage.setItem('pe-theme', id)
    }
  }

  const toggleVariant = (v: Variant) => {
    setIsAuto(false); setVariant(v)
    const id = v === 'dark' ? base : `${base}-${v}`
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem('pe-theme', id)
  }

  const currentDef = BASE_THEMES.find(t => t.id === base)
  const label = isAuto ? 'Auto' : currentDef?.label

  const dropdown = (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[9999] w-64 rounded-[2rem] p-5 shadow-2xl"
        style={{
          top: pos.top,
          right: pos.right,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <p
          className="text-[9px] font-black uppercase mb-4 px-1"
          style={{ color: 'var(--fg-subtle)', letterSpacing: '0.2em' }}
        >
          Stile Interfaccia
        </p>

        {/* Theme grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {BASE_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => apply(t.id, variant, false)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all"
              style={{
                background: !isAuto && base === t.id ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                border: `1px solid ${!isAuto && base === t.id ? 'var(--accent)' : 'var(--border-default)'}`,
              }}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: t.color, boxShadow: `0 0 8px ${t.color}60` }}
              />
              <span className="text-[8px] font-black uppercase" style={{ color: 'var(--fg-muted)', letterSpacing: '0.05em' }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* Dark / Light / Auto */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => toggleVariant('light')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all"
              style={{
                background: !isAuto && variant === 'light' ? '#ffffff' : 'var(--bg-input)',
                color: !isAuto && variant === 'light' ? '#000000' : 'var(--fg-muted)',
                border: `1px solid ${!isAuto && variant === 'light' ? '#ffffff' : 'var(--border-default)'}`,
                letterSpacing: '0.1em',
              }}
            >
              <Sun size={12} /> Chiaro
            </button>
            <button
              onClick={() => toggleVariant('dark')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all"
              style={{
                background: !isAuto && variant === 'dark' ? '#000000' : 'var(--bg-input)',
                color: !isAuto && variant === 'dark' ? '#ffffff' : 'var(--fg-muted)',
                border: `1px solid ${!isAuto && variant === 'dark' ? '#333' : 'var(--border-default)'}`,
                letterSpacing: '0.1em',
              }}
            >
              <Moon size={12} /> Scuro
            </button>
          </div>
          <button
            onClick={() => apply(base, variant, true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all"
            style={{
              background: isAuto ? 'var(--accent)' : 'var(--bg-input)',
              color: isAuto ? 'var(--accent-on)' : 'var(--fg-muted)',
              border: `1px solid ${isAuto ? 'var(--accent)' : 'var(--border-default)'}`,
              letterSpacing: '0.1em',
            }}
          >
            <MonitorSmartphone size={12} /> Auto Sistema
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={openDropdown}
        className="flex items-center gap-2 px-3 py-2 rounded-2xl transition-all"
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--border-default)'}`,
        }}
      >
        <div className="relative">
          {isAuto
            ? <MonitorSmartphone size={16} style={{ color: 'var(--fg-muted)' }} />
            : variant === 'light'
              ? <Sun size={16} className="text-amber-400" />
              : <Moon size={16} className="text-blue-400" />
          }
          {!isAuto && currentDef && (
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{
                backgroundColor: currentDef.color,
                border: '2px solid var(--bg-elevated)',
              }}
            />
          )}
        </div>
        <span className="text-[11px] font-black uppercase hidden md:inline" style={{ color: 'var(--fg-primary)', letterSpacing: '0.1em' }}>
          {label}
        </span>
      </button>
      {mounted && open && createPortal(dropdown, document.body)}
    </>
  )
}

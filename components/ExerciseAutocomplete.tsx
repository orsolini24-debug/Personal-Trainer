'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from 'use-debounce'
import { Dumbbell } from 'lucide-react'

interface ExerciseResult {
  id: string
  name: string
  nameIt: string | null
  nameAlt: string | null
  primaryMuscles: string[]
  equipment: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect?: (ex: ExerciseResult) => void
  placeholder?: string
  className?: string
}

export default function ExerciseAutocomplete({ value, onChange, onSelect, placeholder = 'Cerca esercizio...', className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [debouncedValue] = useDebounce(value, 300)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function search() {
      if (!debouncedValue || debouncedValue.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(debouncedValue)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setIsOpen(true)
          setActiveIndex(-1)
        }
      } catch (e) {
        console.error("Failed to search exercises", e)
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedValue])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) {
        handleSelect(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelect = (ex: ExerciseResult) => {
    onChange(ex.nameIt || ex.name)
    setIsOpen(false)
    if (onSelect) onSelect(ex)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setIsOpen(true) }}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-all ${className}`}
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-default)',
          color: 'var(--fg-primary)'
        }}
        placeholder={placeholder}
        required
      />
      
      {isOpen && (results.length > 0 || loading) && (
        <div 
          className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          {loading && results.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>Ricerca...</div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {results.map((ex, idx) => (
                <li 
                  key={ex.id}
                  onClick={() => handleSelect(ex)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className="px-3 py-2 cursor-pointer flex items-center justify-between transition-colors"
                  style={{
                    background: activeIndex === idx ? 'var(--bg-elevated)' : 'transparent',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--fg-primary)' }}>
                      {ex.nameIt || ex.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {ex.nameIt && <span className="text-[9px] text-[#64748b] truncate italic">({ex.name})</span>}
                      {ex.primaryMuscles.length > 0 && (
                        <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--accent)' }}>
                          {ex.primaryMuscles[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-1 rounded-md" style={{ background: 'var(--bg-base)', color: 'var(--fg-muted)', border: '1px solid var(--border-default)' }}>
                    <Dumbbell className="w-3 h-3" />
                    <span>{ex.equipment}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  districtLabels: Record<string, string>
  equipmentLabels: Record<string, string>
  activeDistrict?: string
  activeEquip?: string
  query: string
}

export default function LibraryFilters({
  districtLabels,
  equipmentLabels,
  activeDistrict,
  activeEquip,
  query,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const push = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      startTransition(() => router.push(`?${params.toString()}`))
    },
    [router, searchParams]
  )

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--fg-subtle)' }}
        />
        <input
          type="text"
          defaultValue={query}
          placeholder="Cerca esercizio…"
          onChange={e => push({ q: e.target.value || undefined })}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm font-medium outline-none transition"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--fg-primary)',
          }}
        />
        {query && (
          <button
            onClick={() => push({ q: undefined })}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--fg-subtle)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* District chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => push({ district: undefined })}
          className="px-3 py-1 rounded-full text-xs font-bold transition"
          style={{
            background: !activeDistrict ? 'var(--accent)' : 'var(--bg-surface)',
            color: !activeDistrict ? 'var(--accent-on)' : 'var(--fg-muted)',
            border: `1px solid ${!activeDistrict ? 'var(--accent)' : 'var(--border-default)'}`,
          }}
        >
          Tutti
        </button>
        {Object.entries(districtLabels).map(([k, label]) => (
          <button
            key={k}
            onClick={() => push({ district: activeDistrict === k ? undefined : k })}
            className="px-3 py-1 rounded-full text-xs font-bold transition"
            style={{
              background: activeDistrict === k ? 'var(--accent)' : 'var(--bg-surface)',
              color: activeDistrict === k ? 'var(--accent-on)' : 'var(--fg-muted)',
              border: `1px solid ${activeDistrict === k ? 'var(--accent)' : 'var(--border-default)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Equipment chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => push({ equipment: undefined })}
          className="px-3 py-1 rounded-full text-xs font-bold transition"
          style={{
            background: !activeEquip ? 'var(--bg-elevated)' : 'transparent',
            color: 'var(--fg-muted)',
            border: '1px solid var(--border-default)',
          }}
        >
          Tutti attrezzi
        </button>
        {Object.entries(equipmentLabels).map(([k, label]) => (
          <button
            key={k}
            onClick={() => push({ equipment: activeEquip === k ? undefined : k })}
            className="px-3 py-1 rounded-full text-xs font-bold transition"
            style={{
              background: activeEquip === k ? 'var(--bg-elevated)' : 'transparent',
              color: activeEquip === k ? 'var(--fg-primary)' : 'var(--fg-subtle)',
              border: `1px solid ${activeEquip === k ? 'var(--accent)' : 'var(--border-default)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active filters summary */}
      {(activeDistrict || activeEquip || query) && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
            Filtri attivi:
          </span>
          <button
            onClick={() => push({ q: undefined, district: undefined, equipment: undefined })}
            className="text-xs font-bold flex items-center gap-1"
            style={{ color: 'var(--accent)' }}
          >
            <X className="w-3 h-3" /> Rimuovi tutti
          </button>
        </div>
      )}

      {isPending && (
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div
            className="h-full animate-pulse"
            style={{ background: 'var(--accent)', width: '60%' }}
          />
        </div>
      )}
    </div>
  )
}

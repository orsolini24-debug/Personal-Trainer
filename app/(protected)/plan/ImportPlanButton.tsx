'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { importMesociclo1 } from '@/app/actions/import-plan'
import { Download, Loader2, CheckCircle2 } from 'lucide-react'

export default function ImportPlanButton({ large }: { large?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function handleImport() {
    setState('loading')
    try {
      const res = await importMesociclo1()
      if ('error' in res && res.error) {
        setMsg(res.error as string)
        setState('error')
      } else {
        setState('done')
        setTimeout(() => router.refresh(), 800)
      }
    } catch (e) {
      setMsg('Errore durante l\'importazione')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--positive)' }}>
        <CheckCircle2 className="w-4 h-4" />
        Importato!
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="text-sm font-bold" style={{ color: 'var(--negative)' }}>{msg}</div>
    )
  }

  if (large) {
    return (
      <button
        onClick={handleImport}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-on, white)',
          opacity: state === 'loading' ? 0.7 : 1,
        }}
      >
        {state === 'loading' ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Importazione...</>
        ) : (
          <><Download className="w-4 h-4" /> Importa Mesociclo 1</>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleImport}
      disabled={state === 'loading'}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all"
      style={{
        background: 'var(--accent)',
        color: 'var(--accent-on, white)',
        opacity: state === 'loading' ? 0.7 : 1,
      }}
    >
      {state === 'loading' ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Importazione...</>
      ) : (
        <><Download className="w-4 h-4" /> Importa Piano</>
      )}
    </button>
  )
}

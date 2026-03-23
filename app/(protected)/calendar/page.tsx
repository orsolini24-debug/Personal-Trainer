import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import MainCalendar from '@/app/components/MainCalendar'
import { CalendarDays, Activity, Bot, Plus } from 'lucide-react'

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-xl text-accent" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
              <CalendarDays className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent">Performance Log</p>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-primary leading-none">Calendario</h1>
          <p className="text-sm text-muted mt-2 max-w-md leading-relaxed">
            Pianifica, registra e analizza ogni giornata. Importa dati da orologio, carica screenshot e lascia che l'AI adatti il piano.
          </p>
        </div>
      </div>

      {/* ── Feature pills ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { icon: CalendarDays, label: 'Piano integrato', color: 'var(--accent)' },
          { icon: Activity, label: 'Import Suunto / Garmin', color: '#10B981' },
          { icon: Bot, label: 'Analisi AI serale', color: '#EC4899' },
          { icon: Plus, label: 'Attività extra', color: '#EAB308' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-xs font-bold text-muted">
            <Icon className="w-3.5 h-3.5" style={{ color }} />
            {label}
          </div>
        ))}
      </div>

      {/* ── Calendar ── */}
      <MainCalendar />
    </div>
  )
}

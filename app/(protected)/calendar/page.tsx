import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import MainCalendar from '@/app/components/MainCalendar'
import { CalendarDays, Activity, Bot, Plus } from 'lucide-react'

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-6 py-4 animate-in fade-in duration-500 athletic-panel">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-xl text-accent" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
              <CalendarDays className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent">BuiltDifferent Calendar</p>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-primary leading-none">Calendario</h1>
          <p className="text-sm text-muted mt-2 max-w-md leading-relaxed">
            Pianifica, registra e analizza ogni giornata. Importa dati da orologio, carica screenshot e lascia che l'AI adatti il piano.
          </p>
        </div>
      </div>

      {/* ── Mission Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-8">
        <section className="lg:col-span-8 rounded-2xl p-5"
          style={{ background: 'linear-gradient(120deg, color-mix(in srgb, var(--accent) 14%, var(--bg-surface)), var(--bg-surface))', border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--accent)' }}>Mission Control</p>
          <h2 className="text-2xl font-black tracking-tight text-primary mb-2">Organizza settimana, adatta carico, sincronizza tutto</h2>
          <p className="text-sm text-muted max-w-2xl">Usa il calendario come cabina di regia: pianificazione, import attività, note recovery e analisi AI in un unico flusso.</p>
        </section>
        <section className="lg:col-span-4 grid grid-cols-2 gap-2">
          {[
            { icon: CalendarDays, label: 'Piano integrato', color: 'var(--accent)' },
            { icon: Activity, label: 'Import device', color: '#10B981' },
            { icon: Bot, label: 'Analisi AI', color: '#EC4899' },
            { icon: Plus, label: 'Extra session', color: '#EAB308' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="rounded-xl border p-3 bg-surface" style={{ borderColor: 'var(--border-default)' }}>
              <Icon className="w-4 h-4 mb-1.5" style={{ color }} />
              <p className="text-xs font-bold text-primary leading-tight">{label}</p>
            </div>
          ))}
        </section>
      </div>

      {/* ── Calendar ── */}
      <MainCalendar />
    </div>
  )
}

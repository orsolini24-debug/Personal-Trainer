import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import MainCalendar from '@/app/components/MainCalendar'
import { Calendar } from 'lucide-react'

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 px-4 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent">Performance Log</p>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-primary">Calendario Attività</h1>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-subtle rounded-2xl text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-positive"></div>
            <span className="text-muted uppercase">Completato</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-subtle rounded-2xl text-xs font-bold">
            <div className="w-2 h-2 rounded-full border-2 border-dashed border-accent"></div>
            <span className="text-muted uppercase">Pianificato</span>
          </div>
        </div>
      </div>

      {/* Calendario Principale */}
      <MainCalendar />
      
      {/* Legenda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-subtle">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-warning mt-1" />
          <div>
            <p className="text-xs font-black text-primary uppercase">Nutrizione</p>
            <p className="text-[10px] text-muted">Indica che hai loggato i pasti della giornata.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-positive mt-1" />
          <div>
            <p className="text-xs font-black text-primary uppercase">Recupero</p>
            <p className="text-[10px] text-muted">Indica che hai sincronizzato i dati HRV/Sonno.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-accent mt-1" />
          <div>
            <p className="text-xs font-black text-primary uppercase">Biometria</p>
            <p className="text-[10px] text-muted">Indica che hai inserito il peso o altre misure.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

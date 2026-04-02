'use client'

import { useState } from 'react'
import { Trash2, Trash, Settings2, X, AlertTriangle, CalendarX } from 'lucide-react'
import { deleteMesocycle } from '@/app/actions/mesocycle-management'
import { deleteSkippedSessions, deletePastPendingSessions } from '@/app/actions/calendar'

interface MesoSettingsProps {
  mesoId: string
  mesoName: string
}

export default function MesoSettings({ mesoId, mesoName }: MesoSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDeleteMeso = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    
    setLoading(true)
    try {
      const res = await deleteMesocycle(mesoId)
      if (res.success) {
        window.location.reload()
      } else {
        alert('Errore: ' + res.error)
      }
    } catch (err) {
      alert('Errore imprevisto')
    } finally {
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  const handleCleanCalendar = async () => {
    if (!confirm('Vuoi eliminare tutte le sessioni saltate e quelle passate non completate?')) return
    
    setLoading(true)
    try {
      await deleteSkippedSessions()
      await deletePastPendingSessions()
      alert('Calendario pulito con successo')
      window.location.reload()
    } catch (err) {
      alert('Errore durante la pulizia del calendario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-accent transition-colors"
      >
        <Settings2 className="w-4 h-4" />
        Gestione
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" 
            onClick={() => { setIsOpen(false); setConfirmDelete(false); }} 
          />
          <div className="absolute right-0 top-full mt-2 w-64 glass-heavy rounded-2xl border border-border p-2 z-50 shadow-2xl animate-blur-in origin-top-right">
            <div className="flex items-center justify-between p-3 border-b border-border/50 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Opzioni Piano</span>
              <button onClick={() => setIsOpen(false)} className="text-fg-subtle hover:text-accent">
                <X size={14} />
              </button>
            </div>
            
            <div className="space-y-1">
              <button
                onClick={handleCleanCalendar}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-xs font-bold"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <CalendarX size={16} />
                </div>
                <div>
                  <p>Pulisci Calendario</p>
                  <p className="text-[9px] font-medium opacity-50">Rimuovi sessioni saltate</p>
                </div>
              </button>

              <button
                onClick={handleDeleteMeso}
                disabled={loading}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left text-xs font-bold ${
                  confirmDelete ? 'bg-negative text-white' : 'hover:bg-negative/10 text-negative'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  confirmDelete ? 'bg-white/20' : 'bg-negative/10'
                }`}>
                  {confirmDelete ? <AlertTriangle size={16} /> : <Trash2 size={16} />}
                </div>
                <div>
                  <p>{confirmDelete ? 'Conferma?' : 'Elimina Mesociclo'}</p>
                  <p className={`text-[9px] font-medium ${confirmDelete ? 'text-white/80' : 'opacity-50'}`}>
                    {confirmDelete ? 'Azione irreversibile' : 'Cancella piano in corso'}
                  </p>
                </div>
              </button>
            </div>

            {confirmDelete && (
              <div className="mt-2 p-2 bg-negative/10 rounded-xl border border-negative/20">
                <p className="text-[8px] text-negative font-black uppercase tracking-tighter text-center">
                  Verranno rimossi anche i relativi Workout Plan
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

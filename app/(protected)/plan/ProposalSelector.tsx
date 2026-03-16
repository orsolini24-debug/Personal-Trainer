'use client'

import { useState } from 'react'
import { Check, ArrowRight, Shield, Zap, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { selectProposal } from '@/app/actions/deep-onboarding'
import { useRouter } from 'next/navigation'

interface Proposal {
  id: number
  name: string
  strategy: string
  pros: string[]
  cons: string[]
  isRecommended: boolean
  mesocycle: any
}

export default function ProposalSelector({ mesoId, proposals }: { mesoId: string, proposals: Proposal[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleConfirm = async () => {
    if (selected === null) return
    setLoading(true)
    const res = await selectProposal(mesoId, selected)
    setLoading(false)
    if (res.success) {
      router.refresh()
    } else {
      alert("Errore: " + res.error)
    }
  }

  return (
    <div className="space-y-8 py-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-black text-primary tracking-tight">Le tue Strategie AI</h2>
        <p className="text-muted">Ho analizzato il tuo profilo. Ecco 3 percorsi distinti per il prossimo mesociclo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {proposals.map((p) => (
          <div 
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`relative p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer group flex flex-col h-full ${selected === p.id ? 'bg-[#3b82f6]/5 border-[#3b82f6] shadow-[0_0_40px_rgba(59,130,246,0.15)]' : 'bg-surface border-subtle hover:border-white/20'}`}
          >
            {p.isRecommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                Consigliato
              </div>
            )}

            <div className="mb-6">
              <h3 className={`text-xl font-black mb-2 transition-colors ${selected === p.id ? 'text-[#3b82f6]' : 'text-primary'}`}>{p.name}</h3>
              <p className="text-sm text-muted leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">{p.strategy}</p>
            </div>

            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-[#10b981] tracking-widest">Vantaggi</p>
                {p.pros.map((pro, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-primary/80">
                    <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-[#ef4444] tracking-widest">Considerazioni</p>
                {p.cons.map((con, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted">
                    <div className="w-1 h-1 rounded-full bg-[#ef4444] shrink-0 mt-2" />
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`mt-8 w-full py-3 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${selected === p.id ? 'bg-[#3b82f6] text-white' : 'bg-foreground/5 text-muted'}`}>
              {selected === p.id ? 'Selezionato' : 'Scegli questa opzione'}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <button 
          onClick={handleConfirm}
          disabled={selected === null || loading}
          className="px-12 py-4 rounded-3xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-black text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-20 active:scale-95 transition-all flex items-center gap-3"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
          Attiva Mesociclo
        </button>
      </div>
    </div>
  )
}

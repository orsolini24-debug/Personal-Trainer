'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { chatPlanWizard, generatePlanFromWizard } from '@/app/actions/plan-wizard'
import { Send, Loader2, Brain, User, Sparkles, CheckCircle2, Dumbbell, Utensils, Zap } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

export default function PlanWizard() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [planType, setPlanType] = useState<'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY'>('FULL')
  const [planTypeSelected, setPlanTypeSelected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const startWizard = async (type: 'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY') => {
    setPlanType(type)
    setPlanTypeSelected(true)
    setLoading(true)

    const welcomeMsg: Message = {
      role: 'assistant',
      content: type === 'TRAINING_ONLY'
        ? 'Perfetto, costruiamo il tuo piano di allenamento. Partiamo dagli obiettivi: cosa vuoi raggiungere nei prossimi mesi? Pensa in modo ampio — forza, performance sportiva, composizione corporea, gare in programma...'
        : type === 'NUTRITION_ONLY'
        ? 'Ottimo, costruiamo la tua strategia nutrizionale. Dimmi tutto: obiettivi di composizione corporea, sport che pratichi, eventuali gare in calendario, e qualsiasi vincolo alimentare.'
        : 'Perfetto, costruiamo il tuo ecosistema completo. Dimmi tutto sui tuoi obiettivi — non solo quello principale, ma tutti: forza, sport specifici, gare, composizione corporea. Più sei dettagliato, più il piano sarà preciso.'
    }

    const res = await chatPlanWizard([welcomeMsg])
    if (res.response) {
      setMessages([{ role: 'assistant', content: res.response.replace('###READY###', '') }])
    }
    setLoading(false)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const res = await chatPlanWizard(newMessages)

    if (res.response) {
      const isReady = res.response.includes('###READY###')
      const clean = res.response.replace('###READY###', '')
      setMessages([...newMessages, { role: 'assistant', content: clean }])

      if (isReady) {
        setLoading(false)
        setIsGenerating(true)
        const result = await generatePlanFromWizard(newMessages, planType)
        if (result && 'success' in result && result.success) {
          router.refresh()
        } else {
          const errorMsg = (result && 'error' in result) ? result.error : 'Sconosciuto'
          alert('Errore generazione piano: ' + errorMsg)
          setIsGenerating(false)
        }
        return
      }
    }
    setLoading(false)
  }

  if (!planTypeSelected) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-black text-primary mb-2">Performance Planner AI</h2>
          <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
            Racconterò al nostro AI coach i tuoi obiettivi reali — non categorie predefinite, ma tutto ciò che vuoi raggiungere. Genererà 3 strategie personalizzate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              type: 'FULL' as const,
              icon: Zap,
              label: 'Piano Completo',
              desc: 'Allenamento + Nutrizione integrati',
              color: 'var(--accent)',
            },
            {
              type: 'TRAINING_ONLY' as const,
              icon: Dumbbell,
              label: 'Solo Allenamento',
              desc: 'Programmazione training su misura',
              color: 'var(--accent2)',
            },
            {
              type: 'NUTRITION_ONLY' as const,
              icon: Utensils,
              label: 'Solo Nutrizione',
              desc: 'Strategia alimentare personalizzata',
              color: 'var(--positive)',
            },
          ].map(({ type, icon: Icon, label, desc, color }) => (
            <button
              key={type}
              onClick={() => startWizard(type)}
              className="p-6 rounded-[2rem] border border-border bg-surface hover:bg-elevated transition-all text-left group"
              style={{ '--hover-color': color } as React.CSSProperties}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all"
                style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="font-black text-primary mb-1">{label}</p>
              <p className="text-xs text-muted font-medium">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[620px] rounded-[2.5rem] border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-elevated/50">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-sm font-black text-primary">Performance Planner</p>
          <p className="text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse">
            {planType === 'FULL' ? 'Piano Completo' : planType === 'TRAINING_ONLY' ? 'Solo Allenamento' : 'Solo Nutrizione'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
              }}>
              {m.role === 'user'
                ? <User className="w-4 h-4 text-white" />
                : <Brain className="w-4 h-4 text-accent" />
              }
            </div>
            <div className="px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: m.role === 'user' ? 'var(--accent-on, white)' : 'var(--fg-primary)',
                borderRadius: m.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                border: m.role === 'user' ? 'none' : '1px solid var(--border-default)',
              }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-elevated border border-border">
              <Brain className="w-4 h-4 text-accent" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-elevated border border-border flex items-center gap-1.5">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-14 h-14 rounded-full bg-positive/10 border border-positive/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-positive" />
            </div>
            <div className="text-center">
              <p className="font-black text-primary">Generando le tue strategie...</p>
              <p className="text-sm text-muted mt-1">L&apos;AI sta costruendo 3 proposte personalizzate</p>
            </div>
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          </div>
        )}
      </div>

      {/* Input */}
      {!isGenerating && (
        <div className="shrink-0 p-4 border-t border-border">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Racconta i tuoi obiettivi..."
              className="flex-1 h-11 px-4 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--fg-primary)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-on, white)' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

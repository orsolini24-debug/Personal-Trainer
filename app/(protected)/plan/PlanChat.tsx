'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, X, Sparkles, User, Bot } from 'lucide-react'
import { chatAboutPlan } from '@/app/actions/plan-chat'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PlanChatProps {
  mesoId: string
  title?: string
}

export default function PlanChat({ mesoId, title = "Discuti con il Coach AI" }: PlanChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatAboutPlan(mesoId, input, messages)
      if (res.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.content }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Spiacente, si è verificato un errore nella comunicazione con il coach." }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed bottom-10 right-10 items-center gap-3 pl-5 pr-4 h-14 rounded-full btn-primary glow-accent shadow-2xl z-50 animate-bounce-slow group"
        title="Rivedi il piano con il Coach AI"
      >
        <MessageSquare className="w-5 h-5 shrink-0" />
        <span className="text-[11px] font-black uppercase tracking-widest pr-1 whitespace-nowrap">
          Rivedi con il Coach
        </span>
      </button>
    )
  }

  return (
    <div className="fixed md:bottom-6 md:right-6 bottom-20 right-3 left-3 md:left-auto md:w-[400px] h-[600px] max-w-[90vw] max-h-[80vh] bg-surface border border-accent/20 rounded-[2.5rem] shadow-2xl z-[60] flex flex-col overflow-hidden animate-rise-up glass-heavy">
      {/* Header */}
      <div className="p-6 border-b border-border bg-accent/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-primary tracking-tight">{title}</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-accent/60">Expert Mode Active</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-full hover:bg-border/50 flex items-center justify-center text-fg-subtle transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="py-8 space-y-5">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-black text-primary tracking-tight">Rivedi il piano con me</p>
                <p className="text-[11px] text-fg-muted mt-1 px-4 leading-relaxed">
                  Posso analizzare il tuo piano attuale, spiegare le scelte metodologiche e aiutarti a modificarlo insieme.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 px-2">
              <button
                onClick={() => setInput("Analizza il mio piano attuale e dimmi cosa ne pensi.")}
                className="p-3 rounded-xl text-[11px] font-black uppercase tracking-tight text-accent hover:bg-accent/10 transition-all text-left border border-border/50"
                style={{ background: 'var(--bg-elevated)' }}
              >
                🔍 Analizza il mio piano
              </button>
              <button
                onClick={() => setInput("Cosa posso migliorare nel mio piano?")}
                className="p-3 rounded-xl text-[11px] font-black uppercase tracking-tight text-accent hover:bg-accent/10 transition-all text-left border border-border/50"
                style={{ background: 'var(--bg-elevated)' }}
              >
                ⚡ Cosa posso migliorare?
              </button>
              <button
                onClick={() => setInput("Spiegami la struttura del piano e i principi metodologici seguiti.")}
                className="p-3 rounded-xl text-[11px] font-black uppercase tracking-tight text-accent hover:bg-accent/10 transition-all text-left border border-border/50"
                style={{ background: 'var(--bg-elevated)' }}
              >
                📚 Spiega la metodologia
              </button>
              <button
                onClick={() => setInput("Come gestisco il recupero e il carico nelle prossime settimane?")}
                className="p-3 rounded-xl text-[11px] font-black uppercase tracking-tight text-accent hover:bg-accent/10 transition-all text-left border border-border/50"
                style={{ background: 'var(--bg-elevated)' }}
              >
                🔄 Gestione recupero e carico
              </button>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-accent/20 text-accent'}`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${m.role === 'user' ? 'bg-accent text-white shadow-lg' : 'bg-elevated text-primary border border-border/50'}`}>
              <ReactMarkdown className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-code:text-accent">
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-elevated border border-border/50 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span className="text-xs text-fg-subtle italic">Il Coach sta riflettendo...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-border bg-surface">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Chiedi al coach..."
            className="w-full bg-elevated border border-border/60 rounded-2xl p-4 pr-14 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none h-20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[9px] text-center text-fg-subtle mt-4 uppercase font-black tracking-widest opacity-40">
          Powered by Apex AI Intelligence
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { chatWithPT, extractProfileData } from '@/app/actions/ai-onboarding'
import {
  Zap, Send, Loader2, User, Bot,
  ChevronRight, Sparkles, CheckCircle2, MessageCircle
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function OnboardingWizard({ userName, embedded = false }: { userName?: string, embedded?: boolean }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initial Greeting
  useEffect(() => {
    const start = async () => {
      setLoading(true)
      const res = await chatWithPT([
        { role: 'assistant', content: `Ciao ${userName?.split(' ')[0] || 'Atleta'}! Sono il tuo Personal Trainer AI d'élite. Per creare il tuo piano di allenamento e nutrizione perfetto, ho bisogno di conoscerti a fondo. Cominciamo dalle basi: qual è il tuo sesso biologico, la tua età e il tuo peso attuale?` }
      ])
      if (res.response) {
        setMessages([{ role: 'assistant', content: res.response }])
      }
      setLoading(false)
    }
    start()
  }, [userName])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    const newMessages = [...messages, { role: 'user', content: userMsg } as Message]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const res = await chatWithPT(newMessages)

    if (res.response) {
      const cleanResponse = res.response.replace('###FINISH###', '')
      setMessages([...newMessages, { role: 'assistant', content: cleanResponse }])

      if (res.response.includes('###FINISH###')) {
        handleFinish(newMessages)
      }
    }
    setLoading(false)
  }

  const handleFinish = async (chatHistory: Message[]) => {
    setIsFinishing(true)
    const res = await extractProfileData(chatHistory)

    if ('success' in res && res.success) {
      router.push('/dashboard')
    } else {
      const errorMsg = 'error' in res ? res.error : "Errore sconosciuto"
      alert("Errore durante la finalizzazione: " + errorMsg)
      setIsFinishing(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-surface rounded-[2.5rem] border border-border shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="p-6 bg-base border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-primary uppercase tracking-widest">Intake Assistito</h2>
            <p className="text-[10px] font-bold text-accent uppercase tracking-tighter animate-pulse">PT AI d'élite Online</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-elevated text-[10px] font-black text-muted uppercase tracking-widest">
          Consulenza Live
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-base/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              m.role === 'user'
                ? 'bg-accent text-accent-on shadow-xl rounded-tr-none'
                : 'bg-elevated border border-border text-primary shadow-sm rounded-tl-none'
            }`}>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-elevated border border-border p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
            </div>
          </div>
        )}
        {isFinishing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-full bg-positive/10 flex items-center justify-center text-positive">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <p className="font-black text-primary uppercase text-center leading-tight">
              Ottimo! Sto processando i tuoi dati<br/><span className="text-accent">per generare il tuo ecosistema...</span>
            </p>
          </div>
        )}
      </div>

      {/* Input Area */}
      {!isFinishing && (
        <div className="p-6 bg-surface border-t border-border">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Scrivi qui la tua risposta..."
              className="w-full h-14 bg-elevated border-2 border-border rounded-2xl px-6 pr-16 font-bold text-primary outline-none focus:border-accent focus:bg-input transition-all placeholder:text-muted"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:opacity-90 active:scale-90 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[9px] text-center text-muted mt-4 uppercase font-bold tracking-widest italic">
            Parla con me come faresti con un vero allenatore. Più sei specifico, migliore sarà il piano.
          </p>
        </div>
      )}
    </div>
  )
}

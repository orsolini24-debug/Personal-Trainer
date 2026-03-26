"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Send, Brain, User, Trash2, ChevronRight, Sparkles } from "lucide-react"

type Message = { role: "user" | "assistant", content: string }

const SUGGESTED = [
  "Come sto recuperando questa settimana?",
  "Analizza le mie ultime sessioni",
  "Cosa mangio oggi per allenarmi meglio?",
  "Qual è il mio rischio infortuni attuale?",
  "Suggerisci integratori per il mio profilo",
]

function renderMarkdown(text: string) {
  let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-black text-sm mt-4 mb-1 brand-text">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-black text-base mt-5 mb-1 brand-text">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-black text-lg mt-6 mb-2 brand-text">$1</h1>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal mb-1">$1</li>')
  html = html.replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul class="space-y-1 my-2">${m}</ul>`)
  html = html.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded-md text-[11px] font-mono surface-accent" style="color:var(--accent)">$1</code>')
  html = html.replace(/\n\n/g, '</p><p class="mb-3">')
  html = html.replace(/\n/g, '<br/>')
  return `<p class="mb-3 leading-relaxed text-balance" style="color:var(--fg-primary)">${html}</p>`
}

export default function ChatClient() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''
  const storageKey = `coach_chat_${userId}`

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  // Previene la sovrascrittura di localStorage durante l'idratazione iniziale
  const [hydrated, setHydrated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ① Carica dalla localStorage non appena l'userId è disponibile
  useEffect(() => {
    if (!userId) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setMessages(JSON.parse(saved))
    } catch { /* storage corrotto — ricomincia da capo */ }
    setHydrated(true)
  }, [userId, storageKey])

  // ② Salva nella localStorage SOLO dopo l'idratazione iniziale, per non
  //    sovrascrivere i messaggi precedenti con l'array vuoto iniziale
  useEffect(() => {
    if (!userId || !hydrated) return
    localStorage.setItem(storageKey, JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, userId, hydrated, storageKey])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const newMsgs: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMsgs)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      })
      if (!res.ok) throw new Error("Errore API")

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMsg = ""

      if (!reader) {
        // Caso raro: risposta senza body stream
        setMessages(prev => [...prev, { role: "assistant", content: "Risposta non ricevuta. Riprova." }])
        setLoading(false)
        return
      }

      // Placeholder per il messaggio dell'assistente che verrà popolato in streaming
      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      if (reader) {
        let streamActive = true
        // Timeout di sicurezza: se non riceviamo nulla per 15s, interrompiamo
        const timeout = setTimeout(() => {
          if (assistantMsg === "") {
            streamActive = false
            reader.cancel()
            setMessages(prev => [
              ...prev.slice(0, -1),
              { role: "assistant", content: "REI sta riscontrando un ritardo nella risposta. Prova a scriverle di nuovo tra un istante." }
            ])
          }
        }, 15000)

        while (streamActive) {
          const { done, value } = await reader.read()
          if (done) {
            clearTimeout(timeout)
            break
          }
          assistantMsg += decoder.decode(value, { stream: true })
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: "assistant", content: assistantMsg },
          ])
        }
      }
    } catch (err) {
      console.error("Chat error:", err)
      setMessages(prev => [...prev, { role: "assistant", content: "Errore di connessione con REI. Riprova tra un momento." }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-h-0 custom-scrollbar">

        {/* Empty state — BD-style coach intro card */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-6 px-4 animate-blur-in">
            {/* Coach card */}
            <div className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              {/* Top accent bar */}
              <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2), transparent)' }} />
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  {/* Coach avatar */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                      boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent)',
                    }}>
                    <Brain className="w-7 h-7" style={{ color: 'var(--accent-on)' }} />
                    {/* Online dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--positive)', border: '2px solid var(--bg-elevated)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight" style={{ color: 'var(--fg-primary)' }}>REI</p>
                    <p className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>Coach AI · Online</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>Performance & Nutrizione</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                  Ciao! Sono REI, il tuo coach AI. Analizzo i tuoi dati biometrici, allenamenti e nutrizione per guidarti verso i tuoi obiettivi.
                </p>
              </div>
            </div>

            {/* Quick questions */}
            <div className="w-full max-w-sm space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest px-1" style={{ color: 'var(--fg-subtle)' }}>
                Domande frequenti
              </p>
              {SUGGESTED.map((s, i) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-98"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    animationDelay: `${i * 60}ms`,
                  }}>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list — BD-style bubbles */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={m.role === 'user'
                ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                : { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--accent)' }
              }>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            </div>
            {/* Bubble */}
            <div
              className="px-4 py-3 max-w-[82%] text-sm leading-relaxed"
              style={m.role === 'user'
                ? {
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    borderRadius: '18px 4px 18px 18px',
                    fontWeight: 500,
                  }
                : {
                    background: 'var(--bg-surface)',
                    color: 'var(--fg-primary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '4px 18px 18px 18px',
                  }
              }
            >
              {m.role === 'assistant' ? (
                <div className="prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 glass surface-accent">
              <Brain className="w-4 h-4 text-accent" />
            </div>
            <div className="px-6 py-4 rounded-[4px_20px_20px_20px] flex items-center gap-2 glass-sm surface-accent border-subtle">
              {[0, 150, 300].map(d => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--accent)', animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — Frosted Floating Bar */}
      <div className="shrink-0 p-4 md:p-6 pt-2">
        <div
          className="max-w-3xl mx-auto p-2 pr-3 flex gap-2 items-end shadow-2xl"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
          }}
        >
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => { if(confirm('Cancellare la chat?')) { setMessages([]); localStorage.removeItem(storageKey); } }}
              className="tap-target rounded-xl transition-all hover:bg-negative/10 hover:text-negative text-fg-subtle shrink-0"
              title="Nuova conversazione"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi al coach…"
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl text-sm resize-none outline-none transition bg-transparent border-none"
            style={{
              color: 'var(--fg-primary)',
              minHeight: '44px',
              maxHeight: '160px',
            }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 160) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`tap-target rounded-xl transition-all shrink-0 ${loading || !input.trim() ? 'opacity-30' : 'btn-primary glow-accent'}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 opacity-40">
          <Sparkles size={10} className="text-accent" />
          <p className="text-[9px] font-bold uppercase tracking-widest">
            AI Coach · 2026 Engine
          </p>
        </div>
      </div>
    </>
  )
}


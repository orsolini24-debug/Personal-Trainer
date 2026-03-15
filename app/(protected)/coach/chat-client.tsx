"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Brain, User, Trash2, ChevronRight } from "lucide-react"

type Message = { role: "user" | "assistant", content: string }

const SUGGESTED = [
  "Come sto recuperando questa settimana?",
  "Analizza le mie ultime sessioni e dimmi cosa migliorare",
  "Cosa mangio oggi per ottimizzare l'allenamento stasera?",
  "Qual è il rischio infortuni attuale e come lo gestisco?",
  "Progredisco come previsto nel Mesociclo 1?",
  "Suggerisci integratori per il mio profilo attuale",
]

function renderMarkdown(text: string) {
  // Bold
  let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-black text-sm mt-3 mb-1">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-black text-base mt-4 mb-1">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-black text-lg mt-4 mb-2">$1</h1>')
  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
  // Bullet lists
  html = html.replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
  // Wrap <li> groups
  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul class="space-y-0.5 my-1">${m}</ul>`)
  // Code inline
  html = html.replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded text-[11px] font-mono" style="background:var(--bg-elevated);color:var(--accent)">$1</code>')
  // Newlines
  html = html.replace(/\n\n/g, '</p><p class="mb-2">')
  html = html.replace(/\n/g, '<br/>')
  return `<p class="mb-2">${html}</p>`
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("coach_chat_v2")
    if (saved) setMessages(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem("coach_chat_v2", JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
      setMessages([...newMsgs, { role: "assistant", content: "" }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantMsg += decoder.decode(value, { stream: true })
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: "assistant", content: assistantMsg },
          ])
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Errore di connessione. Riprova." }])
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Empty state with suggested prompts */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)' }}
              >
                <Brain className="w-7 h-7" style={{ color: 'var(--accent)' }} />
              </div>
              <p className="font-black text-base" style={{ color: 'var(--fg-primary)' }}>Ciao, sono il tuo coach.</p>
              <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
                Ho accesso completo ai tuoi dati. Chiedi qualsiasi cosa.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--fg-muted)',
                  }}
                >
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
              }}
            >
              {m.role === 'user'
                ? <User className="w-4 h-4" style={{ color: 'var(--accent-on, white)' }} />
                : <Brain className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              }
            </div>
            <div
              className="px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed"
              style={{
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: m.role === 'user' ? 'var(--accent-on, white)' : 'var(--fg-primary)',
                borderRadius: m.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                border: m.role === 'user' ? 'none' : '1px solid var(--border-default)',
              }}
            >
              {m.role === 'assistant' ? (
                <div
                  className="prose-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                />
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <Brain className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
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

      {/* Input */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => { setMessages([]); localStorage.removeItem("coach_chat_v2") }}
              className="p-2.5 rounded-xl transition shrink-0"
              style={{ color: 'var(--fg-subtle)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              title="Nuova conversazione"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi al coach… (Invio per inviare, Shift+Invio per andare a capo)"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm resize-none outline-none transition"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--fg-primary)',
              minHeight: '42px',
              maxHeight: '120px',
            }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl transition shrink-0"
            style={{
              background: loading || !input.trim() ? 'var(--bg-elevated)' : 'var(--accent)',
              color: loading || !input.trim() ? 'var(--fg-subtle)' : 'var(--accent-on, white)',
              border: '1px solid var(--border-default)',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--fg-subtle)' }}>
          Il coach legge i tuoi dati in tempo reale · Le risposte sono basate sul tuo profilo specifico
        </p>
      </div>
    </>
  )
}

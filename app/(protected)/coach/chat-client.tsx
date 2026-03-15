"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User } from "lucide-react"

type Message = { role: "user" | "assistant", content: string }

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("coach_chat")
    if (saved) setMessages(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem("coach_chat", JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const newMsgs = [...messages, { role: "user" as const, content: input }]
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
          
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: assistantMsg }
          ])
        }
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: "assistant", content: "Errore di connessione." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-zinc-500">
            Chiedimi della tua sessione, recupero o alimentazione!
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`p-3 rounded-xl max-w-[80%] whitespace-pre-wrap text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-100 dark:bg-zinc-800 rounded-tl-none'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 rounded-tl-none text-sm text-zinc-500 flex items-center gap-2">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-75">●</span>
              <span className="animate-pulse delay-150">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e=>setInput(e.target.value)}
            placeholder="Scrivi al coach..."
            className="flex-1 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </>
  )
}
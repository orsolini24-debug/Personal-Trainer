"use client"

import { useState, useEffect } from "react"
import { closeSession } from "@/app/actions/training"
import { useRouter } from "next/navigation"
import { Mic, MicOff } from "lucide-react"

export default function CloseSessionForm({ sessionId, initialData }: { sessionId: string, initialData: any }) {
  const [rpe, setRpe] = useState(initialData.rpe?.toString() || "")
  const [duration, setDuration] = useState(initialData.durationMin?.toString() || "")
  const [notes, setNotes] = useState(initialData.notes || "")
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'it-IT'

      rec.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        setNotes((prev: string) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + currentTranscript)
      }

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsRecording(false)
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      setRecognition(rec)
    }
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop()
      setIsRecording(false)
    } else {
      recognition?.start()
      setIsRecording(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await closeSession(sessionId, {
      rpe: rpe ? parseInt(rpe) : undefined,
      durationMin: duration ? parseInt(duration) : undefined,
      notes: notes || undefined
    })
    setLoading(false)
    if (res.success) {
      alert("Sessione salvata!")
      router.push("/training")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1.5">RPE (1-10)</label>
          <input
            type="number"
            min="1" max="10"
            value={rpe}
            onChange={e => setRpe(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1.5">Durata (min)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50"
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-medium text-[#f1f5f9]">Note</label>
          {recognition && (
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-1.5 rounded-full ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-[#64748b] hover:text-[#f1f5f9]'}`}
            >
              {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          )}
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] resize-none focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50"
          placeholder="Come ti sei sentito? Premi il microfono per dettare."
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
      >
        {loading ? "Salvataggio..." : "Salva & Chiudi Sessione"}
      </button>
    </form>
  )
}
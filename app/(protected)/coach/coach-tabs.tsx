"use client"

import { useState } from "react"
import { MessageSquare, BarChart2, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import ChatClient from "./chat-client"

interface AIReport {
  id: string
  date: string
  content: string
}

function renderMarkdownLight(text: string) {
  let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/^### (.+)$/gm, '<p class="font-black text-sm mt-3 mb-1 text-primary">$1</p>')
  html = html.replace(/^## (.+)$/gm, '<p class="font-black text-base mt-3 mb-1 text-primary">$1</p>')
  html = html.replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul class="space-y-0.5 my-1">${m}</ul>`)
  html = html.replace(/\n\n/g, '</p><p class="mb-2">')
  html = html.replace(/\n/g, '<br/>')
  return `<p class="mb-2 text-sm leading-relaxed">${html}</p>`
}

function ReportCard({ report }: { report: AIReport }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(report.date)
  const dateLabel = date.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const preview = report.content.slice(0, 200).replace(/[*#]/g, '') + (report.content.length > 200 ? '…' : '')

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 text-left group"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--accent-dim, color-mix(in srgb, var(--accent) 10%, transparent))', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
          <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
            Report Settimanale
          </p>
          <p className="text-sm font-bold capitalize" style={{ color: 'var(--fg-primary)' }}>{dateLabel}</p>
          {!expanded && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--fg-muted)' }}>{preview}</p>
          )}
        </div>
        <div className="shrink-0 mt-1" style={{ color: 'var(--fg-subtle)' }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--fg-primary)',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdownLight(report.content) }}
          />
        </div>
      )}
    </div>
  )
}

export default function CoachTabs({ reports }: { reports: AIReport[] }) {
  const [tab, setTab] = useState<'chat' | 'reports'>('chat')

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div
        className="flex shrink-0 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        {([
          { key: 'chat', label: 'Chat', Icon: MessageSquare },
          { key: 'reports', label: `Report${reports.length > 0 ? ` (${reports.length})` : ''}`, Icon: BarChart2 },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all relative"
            style={{
              color: tab === key ? 'var(--accent)' : 'var(--fg-muted)',
              background: 'transparent',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {tab === key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Contenuto tab */}
      {tab === 'chat' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ChatClient />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <BarChart2 className="w-6 h-6" style={{ color: 'var(--fg-subtle)' }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--fg-primary)' }}>Nessun report ancora</p>
                <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--fg-muted)' }}>
                  Il primo report settimanale verrà generato automaticamente ogni lunedì, riepilogando allenamenti, recupero e nutrizione della settimana.
                </p>
              </div>
            </div>
          ) : (
            <>
              {reports.map(r => <ReportCard key={r.id} report={r} />)}
              <p className="text-xs text-center pb-2" style={{ color: 'var(--fg-subtle)' }}>
                Mostra gli ultimi 4 report · Generati automaticamente ogni lunedì
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

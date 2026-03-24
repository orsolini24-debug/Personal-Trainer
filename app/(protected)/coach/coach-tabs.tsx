"use client"

import { useState } from "react"
import { MessageSquare, BarChart2, ChevronDown, ChevronUp, Calendar, Sparkles } from "lucide-react"
import ChatClient from "./chat-client"

interface AIReport {
  id: string
  date: string
  content: string
}

function renderMarkdownLight(text: string) {
  let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/^### (.+)$/gm, '<p class="font-black text-sm mt-4 mb-2 text-accent-gradient">$1</p>')
  html = html.replace(/^## (.+)$/gm, '<p class="font-black text-base mt-5 mb-2 text-accent-gradient">$1</p>')
  html = html.replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal mb-1">$1</li>')
  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul class="space-y-1 my-2">${m}</ul>`)
  html = html.replace(/\n\n/g, '</p><p class="mb-3">')
  html = html.replace(/\n/g, '<br/>')
  return `<p class="mb-3 text-sm leading-relaxed text-balance">${html}</p>`
}

function ReportCard({ report, index }: { report: AIReport; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(report.date)
  const dateLabel = date.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const preview = report.content.slice(0, 180).replace(/[*#]/g, '') + (report.content.length > 180 ? '…' : '')

  return (
    <div
      className={`group overflow-hidden transition-all duration-500 animate-rise-up card-interactive ${expanded ? 'ring-accent' : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{ 
            background: 'var(--accent-dim)', 
            border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 15%, transparent)'
          }}>
          <Calendar className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-accent scale-90 origin-left">Weekly Report</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">AI Analysis</span>
          </div>
          <p className="text-base font-bold capitalize tracking-tight" style={{ color: 'var(--fg-primary)' }}>{dateLabel}</p>
          {!expanded && (
            <p className="text-xs mt-1.5 line-clamp-1 opacity-60" style={{ color: 'var(--fg-muted)' }}>{preview}</p>
          )}
        </div>
        <div className={`shrink-0 transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} style={{ color: 'var(--fg-subtle)' }}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-6 pt-0 animate-blur-in">
          <div
            className="rounded-2xl p-5 text-sm glass-sm surface-accent"
            dangerouslySetInnerHTML={{ __html: renderMarkdownLight(report.content) }}
          />
          <div className="mt-4 flex justify-end">
            <button className="btn-ghost px-4 py-2 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
              <Sparkles size={12} className="text-accent" />
              Chiedi approfondimenti al coach
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CoachTabs({ reports }: { reports: AIReport[] }) {
  const [tab, setTab] = useState<'chat' | 'reports'>('chat')

  return (
    <div className="flex flex-col h-full min-h-0 animate-page">
      {/* Tab bar — Premium Pill Switcher */}
      <div className="px-4 py-3 shrink-0">
        <div 
          className="flex p-1.5 gap-1 rounded-2xl glass-sm"
          style={{ background: 'color-mix(in srgb, var(--bg-elevated) 60%, transparent)' }}
        >
          {([
            { key: 'chat', label: 'Chat Coach', Icon: MessageSquare },
            { key: 'reports', label: `Report${reports.length > 0 ? ` Settimanali` : ''}`, Icon: BarChart2 },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                fontFamily: 'var(--font-sora), sans-serif',
                color: tab === key ? 'var(--accent)' : 'var(--fg-muted)',
                background: tab === key ? 'color-mix(in srgb, var(--accent) 12%, var(--bg-surface))' : 'transparent',
                boxShadow: tab === key ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.1)' : 'none',
                border: tab === key ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' : '1px solid transparent',
              }}
            >
              <Icon className={`w-3.5 h-3.5 transition-transform ${tab === key ? 'scale-110' : ''}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenuto tab */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {tab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ChatClient />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar stagger">
            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-12 animate-blur-in">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mesh-bg animate-glow-breathe"
                  style={{ border: '1px solid var(--border-default)' }}
                >
                  <BarChart2 className="w-8 h-8" style={{ color: 'var(--fg-subtle)' }} />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight text-accent-gradient">Nessun report generato</h3>
                  <p className="text-sm mt-2 max-w-xs mx-auto opacity-70 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                    Il tuo coach AI analizza i tuoi progressi ogni settimana. Il primo report apparirà lunedì mattina.
                  </p>
                </div>
                <div className="p-4 rounded-2xl glass-sm text-xs border border-dashed border-border-default opacity-60">
                  <p>Includerà analisi su HRV, carichi, nutrizione e trend di recupero.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 mb-2">
                  <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Storico Analisi</h2>
                  <span className="badge badge-accent opacity-60">{reports.length} report</span>
                </div>
                {reports.map((r, i) => <ReportCard key={r.id} report={r} index={i} />)}
                <div className="pt-6 pb-4">
                  <p className="divider-label">Fine dello storico</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


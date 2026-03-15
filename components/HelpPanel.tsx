'use client'

import { X, Dumbbell, Utensils, HeartPulse, Bot, Scale, CalendarDays, ChevronRight, BookOpen } from 'lucide-react'

const SECTIONS = [
  {
    label: 'Allenamento',
    items: [
      {
        icon: <Dumbbell size={18} />,
        color: '#3b82f6',
        title: 'Training Log',
        href: '/training',
        desc: 'Registra ogni sessione di allenamento con esercizi, carichi e RPE. Il Training Load si calcola automaticamente.',
        tips: [
          "Tap 'Nuova Sessione' e scegli il tipo (A/B/C/D) — la scheda si precompila.",
          'Inserisci kg e RIR per ogni serie mentre alleni.',
          'A fine sessione: slider tensione per ogni distretto muscolare.',
          'Inserisci RPE e durata per calcolare il Training Load.',
        ],
      },
    ],
  },
  {
    label: 'Alimentazione',
    items: [
      {
        icon: <Utensils size={18} />,
        color: '#f59e0b',
        title: 'Nutrition Log',
        href: '/nutrition',
        desc: 'Traccia ogni pasto e monitora calorie e macro in tempo reale. Target diversi per giorni di allenamento e riposo.',
        tips: [
          'Seleziona il pasto: Colazione / Pranzo / Pre-workout / Cena.',
          'Aggiungi alimenti con nome e grammi.',
          'La barra calorie e macro si aggiorna in tempo reale.',
          'Il sistema mostra target differenziati per giorno di allenamento o riposo.',
        ],
      },
    ],
  },
  {
    label: 'Recupero',
    items: [
      {
        icon: <HeartPulse size={18} />,
        color: '#10b981',
        title: 'Recovery Dashboard',
        href: '/recovery',
        desc: 'Inserisci HRV, RHR, sonno e recovery score dalla tua app fitness. Il semaforo ti dice se puoi spingere oggi.',
        tips: [
          'Ogni mattina copia i valori dalla tua app (Suunto/Garmin/ecc.) — 30 secondi.',
          'Semaforo verde = puoi spingere · giallo = prudenza · rosso = recupero.',
          'ACWR > 1.5 = rischio infortuni. Rallenta.',
          'Controlla la matrice distretti per i muscoli più affaticati.',
        ],
      },
    ],
  },
  {
    label: 'AI & Dati',
    items: [
      {
        icon: <Bot size={18} />,
        color: '#6366f1',
        title: 'AI Coach',
        href: '/coach',
        desc: 'Il tuo PT personale conosce tutte le tue sessioni, i macro e il recovery. Chiedigli qualsiasi cosa.',
        tips: [
          "Chiedi: 'Come sto recuperando questa settimana?'",
          "Chiedi: 'Cosa mangio dopo l'allenamento di oggi?'",
          "Chiedi: 'Dammi la sessione di oggi con i carichi'",
          'Ogni lunedì genera automaticamente il report settimanale.',
        ],
      },
      {
        icon: <Scale size={18} />,
        color: '#ec4899',
        title: 'Body Metrics',
        href: '/body',
        desc: 'Traccia peso, % grasso e misure corporee nel tempo. Il grafico mostra il trend degli ultimi 30 giorni.',
        tips: [
          'Inserisci il peso ogni mattina a digiuno per dati affidabili.',
          'Aggiungi % grasso e misure (vita, braccia, cosce).',
          'Il sistema correla peso con Training Load e calorie.',
        ],
      },
      {
        icon: <CalendarDays size={18} />,
        color: '#8b5cf6',
        title: 'Plan Manager',
        href: '/plan',
        desc: 'Gestisci il mesociclo, KPI e obiettivi con timeline e milestone.',
        tips: [
          'Vista calendario settimana con sessioni pianificate.',
          'KPI del mesociclo con avanzamento visivo (es. Stacco 118/130 kg).',
          'Storico mesocicli — confronta le performance tra cicli.',
        ],
      },
    ],
  },
]

interface HelpPanelProps {
  open: boolean
  onClose: () => void
}

export default function HelpPanel({ open, onClose }: HelpPanelProps) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[90]"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/* Sliding panel */}
      <div
        className="fixed top-0 right-0 h-full z-[100] w-full flex flex-col"
        style={{
          maxWidth: '480px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 shrink-0"
          style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: 'var(--accent)', boxShadow: '0 0 15px var(--glow-accent)' }}
            >
              <BookOpen size={18} color="white" />
            </div>
            <div>
              <h2 className="font-black text-lg" style={{ color: 'var(--fg-primary)' }}>
                Guida alle funzionalità
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>
                Come usare ogni modulo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--fg-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p
                className="text-[9px] font-black uppercase mb-4 px-1"
                style={{ color: 'var(--fg-subtle)', letterSpacing: '0.2em' }}
              >
                {section.label}
              </p>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="p-5 rounded-2xl transition-all duration-200"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-xl shrink-0"
                          style={{ background: `${item.color}20`, color: item.color }}
                        >
                          {item.icon}
                        </div>
                        <h4 className="font-bold text-sm" style={{ color: 'var(--fg-primary)' }}>
                          {item.title}
                        </h4>
                      </div>
                      <a
                        href={item.href}
                        onClick={onClose}
                        className="shrink-0 p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--fg-subtle)' }}
                      >
                        <ChevronRight size={14} />
                      </a>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--fg-muted)' }}>
                      {item.desc}
                    </p>
                    <ul className="space-y-1.5">
                      {item.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px]" style={{ color: 'var(--fg-subtle)' }}>
                          <span className="shrink-0 mt-0.5" style={{ color: item.color }}>•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

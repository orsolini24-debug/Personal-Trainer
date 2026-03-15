import { Dumbbell, Utensils, HeartPulse, Bot, Scale, CalendarDays, ChevronRight } from "lucide-react"

const modules = [
  {
    icon: Dumbbell,
    color: "#3b82f6",
    title: "Training Log",
    path: "/training",
    desc: "Registra ogni sessione di allenamento.",
    steps: [
      "Tap su 'Nuova Sessione' e scegli il tipo (A/B/C/D/V1/V2)",
      "La scheda si precompila con gli esercizi del tuo piano",
      "Inserisci kg e RIR per ogni serie mentre alleni",
      "A fine sessione: slider tensione per ogni distretto muscolare",
      "Inserisci RPE e durata — il Training Load si calcola automaticamente",
      "Opzionale: nota vocale a fine sessione",
    ],
  },
  {
    icon: Utensils,
    color: "#f59e0b",
    title: "Nutrition Log",
    path: "/nutrition",
    desc: "Traccia ogni pasto con il minimo sforzo.",
    steps: [
      "Seleziona il pasto (Colazione / Pranzo / Pre-workout / Cena)",
      "Aggiungi alimenti manualmente con nome e grammi",
      "Salva i pasti frequenti come template — applica con 1 tap",
      "La barra calorie e macro si aggiorna in tempo reale",
      "Il sistema mostra i target corretti in base al tipo di giornata (allenamento / riposo)",
      "Alert serale se mancano proteine rispetto al target",
    ],
  },
  {
    icon: HeartPulse,
    color: "#10b981",
    title: "Recovery Dashboard",
    path: "/recovery",
    desc: "Monitora il recupero giornaliero da screenshot.",
    steps: [
      "Ogni mattina apri la tua app fitness (Suunto/Garmin/ecc.)",
      "Copia i valori: HRV, RHR, ore di sonno, recovery score, CTL/ATL/TSB",
      "Inseriscili nel form Recovery — 30 secondi",
      "Il semaforo verde/giallo/rosso ti dice subito se puoi spingere",
      "Controlla la matrice distretti per vedere i muscoli più affaticati",
      "ACWR > 1.5 = rischio infortuni — rallenta",
    ],
  },
  {
    icon: Bot,
    color: "#6366f1",
    title: "AI Coach",
    path: "/coach",
    desc: "Il tuo PT personale conosce tutti i tuoi dati.",
    steps: [
      "Scrivi qualsiasi domanda — risponde in pochi secondi",
      "Conosce già le tue ultime sessioni, i macro di oggi, il recovery",
      "Chiedi: "Come sto recuperando questa settimana?"",
      "Chiedi: "Cosa mangio dopo l'allenamento di oggi?"",
      "Chiedi: "Dammi la sessione di oggi con i carichi"",
      "Ogni lunedì genera automaticamente il report settimanale",
    ],
  },
  {
    icon: Scale,
    color: "#ec4899",
    title: "Body Metrics",
    path: "/body",
    desc: "Traccia la composizione corporea nel tempo.",
    steps: [
      "Inserisci il peso ogni mattina a digiuno",
      "Aggiungi % grasso e misure corporee (vita, braccia, cosce)",
      "Il grafico mostra il trend degli ultimi 30 giorni",
      "Carica foto di progresso settimanali (galleria privata)",
      "Il sistema correla peso con Training Load e calorie",
    ],
  },
  {
    icon: CalendarDays,
    color: "#8b5cf6",
    title: "Plan Manager",
    path: "/plan",
    desc: "Gestisci il mesociclo e tieni traccia dei KPI.",
    steps: [
      "Vista calendario settimana con sessioni pianificate",
      "KPI del mesociclo con avanzamento visivo (es. Stacco 118/130 kg)",
      "Roadmap obiettivi con timeline e milestone",
      "Storico mesocicli — confronta le performance tra cicli",
    ],
  },
]

export default function GuidaPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#f1f5f9]">Guida all'app</h1>
        <p className="text-[#64748b] mt-1">Come usare ogni modulo del Performance Ecosystem.</p>
      </div>

      {modules.map((mod) => {
        const Icon = mod.icon
        return (
          <div key={mod.title} className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${mod.color}18` }}>
                <Icon className="w-5 h-5" style={{ color: mod.color }} />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-[#f1f5f9]">{mod.title}</h2>
                <p className="text-sm text-[#64748b]">{mod.desc}</p>
              </div>
              <a href={mod.path}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-[#64748b] hover:text-[#f1f5f9] hover:border-white/20 transition-all">
                Apri <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            {/* Steps */}
            <div className="p-5 space-y-3">
              {mod.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                    style={{ backgroundColor: `${mod.color}20`, color: mod.color }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

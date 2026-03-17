import { Dumbbell, Utensils, HeartPulse, Bot, Scale, CalendarDays, ChevronRight, BookOpen } from "lucide-react"

const modules = [
  {
    icon: Dumbbell,
    color: "var(--accent)",
    title: "Training Log",
    path: "/training",
    desc: "Registra ogni sessione di allenamento.",
    steps: [
      "Tap su 'Nuova Sessione' e scegli il tipo (A/B/C/D)",
      "La scheda si precompila con gli esercizi del piano",
      "Inserisci kg e RIR per ogni serie mentre alleni",
      "A fine sessione: slider tensione per ogni distretto muscolare",
      "Inserisci RPE e durata — il Training Load si calcola automaticamente",
    ],
  },
  {
    icon: Utensils,
    color: "var(--warning)",
    title: "Nutrition Log",
    path: "/nutrition",
    desc: "Traccia ogni pasto con il minimo sforzo.",
    steps: [
      "Seleziona il pasto (Colazione / Pranzo / Pre-workout / Cena)",
      "Aggiungi alimenti manualmente con nome e grammi",
      "Salva i pasti frequenti come template — applica con 1 tap",
      "La barra calorie e macro si aggiorna in tempo reale",
      "Il sistema mostra i target in base al tipo di giornata (allenamento / riposo)",
    ],
  },
  {
    icon: HeartPulse,
    color: "var(--positive)",
    title: "Recovery Dashboard",
    path: "/recovery",
    desc: "Monitora il recupero giornaliero da screenshot.",
    steps: [
      "Ogni mattina apri la tua app fitness (Suunto/Garmin/ecc.)",
      "Copia i valori: HRV, RHR, ore di sonno, recovery score, CTL/ATL/TSB",
      "Inseriscili nel form Recovery — 30 secondi",
      "Il semaforo verde/giallo/rosso ti dice subito se puoi spingere",
      "ACWR > 1.5 = rischio infortuni — rallenta",
    ],
  },
  {
    icon: Bot,
    color: "var(--accent2)",
    title: "AI Coach",
    path: "/coach",
    desc: "Il tuo PT personale conosce tutti i tuoi dati.",
    steps: [
      "Scrivi qualsiasi domanda — risponde in pochi secondi",
      "Conosce le tue ultime sessioni, i macro di oggi, il recovery",
      "Chiedi: 'Come sto recuperando questa settimana?'",
      "Chiedi: 'Cosa mangio dopo l'allenamento di oggi?'",
      "Chiedi: 'Dammi la sessione di oggi con i carichi'",
    ],
  },
  {
    icon: Scale,
    color: "var(--accent2)",
    title: "Body Metrics",
    path: "/body",
    desc: "Traccia la composizione corporea nel tempo.",
    steps: [
      "Inserisci il peso ogni mattina a digiuno",
      "Aggiungi % grasso e misure corporee (vita, braccia, cosce)",
      "Il grafico mostra il trend degli ultimi 30 giorni",
      "Il sistema correla peso con Training Load e calorie",
    ],
  },
  {
    icon: CalendarDays,
    color: "var(--accent2)",
    title: "Plan Manager",
    path: "/plan",
    desc: "Gestisci il mesociclo e tieni traccia dei KPI.",
    steps: [
      "Vista calendario settimana con sessioni pianificate",
      "KPI del mesociclo con avanzamento visivo",
      "Roadmap obiettivi con timeline e milestone",
      "Storico mesocicli — confronta le performance tra cicli",
    ],
  },
]

export default function GuidaPage() {
  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-dim)", border: "1px solid var(--accent)" }}
        >
          <BookOpen className="w-6 h-6" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: "var(--fg-primary)" }}
          >
            Guida
          </h1>
          <p style={{ color: "var(--fg-muted)" }} className="mt-0.5">
            Come usare ogni modulo del Performance Ecosystem.
          </p>
        </div>
      </div>

      {/* Module cards */}
      {modules.map((mod) => {
        const Icon = mod.icon
        return (
          <div
            key={mod.title}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center gap-4 p-5"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${mod.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: mod.color }} />
              </div>
              <div className="flex-1">
                <h2 className="font-bold" style={{ color: "var(--fg-primary)" }}>
                  {mod.title}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  {mod.desc}
                </p>
              </div>
              <a
                href={mod.path}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--fg-muted)",
                }}
              >
                Apri <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            {/* Steps */}
            <div className="p-5 space-y-3">
              {mod.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                    style={{ backgroundColor: `${mod.color}20`, color: mod.color }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { X, Dumbbell, Utensils, HeartPulse, Bot, Scale, CalendarDays, ChevronDown, BookOpen, Info } from 'lucide-react'
import { useState } from 'react'

interface Metric {
  name: string
  what: string
  values?: { range: string; meaning: string; color: string }[]
  howToRead?: string
  tips?: string[]
}

interface SectionItem {
  icon: React.ReactNode
  color: string
  title: string
  href: string
  desc: string
  metrics?: Metric[]
  steps?: string[]
}

interface Section {
  label: string
  items: SectionItem[]
}

const SECTIONS: Section[] = [
  {
    label: 'Training Log',
    items: [
      {
        icon: <Dumbbell size={18} />,
        color: '#3b82f6',
        title: 'Come usare il Training Log',
        href: '/training',
        desc: 'Registra ogni sessione con esercizi, carichi, RIR e RPE. Il sistema calcola automaticamente il Training Load e tiene traccia del volume per ogni distretto muscolare.',
        steps: [
          "Tap 'Nuova Sessione' → scegli il tipo (A/B/C/D) → la scheda si precompila con gli esercizi del piano.",
          'Per ogni esercizio inserisci: peso in kg, numero di serie completate, RIR (Reps In Reserve = quante ripetizioni avresti ancora potuto fare).',
          'A fine allenamento: muovi gli slider per indicare la tensione percepita in ogni distretto muscolare (0 = niente, 10 = massimo).',
          'Chiudi la sessione inserendo RPE globale e durata → il Training Load si calcola in automatico.',
        ],
        metrics: [
          {
            name: 'RIR — Reps In Reserve',
            what: 'Indica quante ripetizioni extra avresti potuto fare prima del cedimento. È una misura dell\'intensità relativa dell\'esercizio. Più basso è il RIR, più vicino al cedimento stai lavorando.',
            values: [
              { range: 'RIR 0', meaning: 'Cedimento tecnico — ultima ripetizione possibile. Alta risposta ormonale ma rischio maggiore di infortunio e recupero lungo.', color: '#ef4444' },
              { range: 'RIR 1–2', meaning: 'Zona ipertrofia ottimale. Stimolo elevato con gestione del recupero ancora sostenibile.', color: '#f59e0b' },
              { range: 'RIR 3–4', meaning: 'Zona forza/tecnica. Usato nei periodi di accumulo o per esercizi tecnici come Squat e Stacco.', color: '#10b981' },
              { range: 'RIR 5+', meaning: 'Lavoro leggero, deload o riscaldamento. Poco stimolo ipertrofico.', color: '#64748b' },
            ],
            howToRead: 'Annota il RIR a fine serie mentre l\'impressione è fresca. Con l\'esperienza diventa uno strumento preciso quanto i % di 1RM.',
          },
          {
            name: 'RPE — Rate of Perceived Exertion',
            what: 'Scala di percezione dello sforzo globale della sessione (1–10). Sviluppata da Mike Tuchscherer per il powerlifting, è oggi usata in tutti gli sport di forza. Correla direttamente con il carico effettivo sul sistema nervoso centrale.',
            values: [
              { range: 'RPE 6–7', meaning: 'Sessione leggera. Recupero rapido, adatto a deload o giorni di volume basso.', color: '#10b981' },
              { range: 'RPE 7–8', meaning: 'Intensità moderata. Zona di lavoro ottimale per la maggior parte delle sessioni di un mesociclo di accumulo.', color: '#3b82f6' },
              { range: 'RPE 8–9', meaning: 'Sessione intensa. Richiede 48–72h di recupero completo. Tipico delle fasi di intensificazione.', color: '#f59e0b' },
              { range: 'RPE 9–10', meaning: 'Massimale o quasi. Usare raramente — picchi di performance, test di 1RM, gare.', color: '#ef4444' },
            ],
          },
          {
            name: 'Training Load (TL)',
            what: 'Carico di allenamento calcolato come: RPE × Durata in minuti. Misura il "costo" totale della sessione per il tuo sistema. È il dato grezzo che alimenta il calcolo di CTL, ATL e TSB nel modulo Recovery.',
            howToRead: 'Una sessione da 60 min a RPE 8 produce TL = 480. Una da 90 min a RPE 7 produce TL = 630. A parità di durata, l\'intensità conta più del volume.',
            tips: [
              'Mantieni un diario del TL settimanale per identificare i picchi che precedono affaticamento o infortuni.',
              'Il TL ideale cresce del 5–10% a settimana in fase di accumulo.',
            ],
          },
          {
            name: 'Distretto muscolare & Tensione percepita',
            what: 'Dopo ogni sessione indica (0–10) quanto ogni distretto muscolare è stato sollecitato. Questi dati alimentano la matrice di recupero nel modulo Recovery, permettendo di vedere quali muscoli sono ancora affaticati nei giorni successivi.',
            values: [
              { range: '0–2', meaning: 'Non coinvolto o minimo. Muscolo fresco, disponibile per carichi elevati.', color: '#10b981' },
              { range: '3–5', meaning: 'Lavoro moderato. Leggero affaticamento, recupero in 24–36h.', color: '#3b82f6' },
              { range: '6–8', meaning: 'Stimolo elevato. DOMS probabile, recupero 48–72h.', color: '#f59e0b' },
              { range: '9–10', meaning: 'Massimale. Evita di ricaricare questo distretto per 72–96h.', color: '#ef4444' },
            ],
          },
        ],
      },
    ],
  },
  {
    label: 'Nutrition Log',
    items: [
      {
        icon: <Utensils size={18} />,
        color: '#f59e0b',
        title: 'Come usare Nutrition Log',
        href: '/nutrition',
        desc: 'Traccia ogni pasto con calorie e macronutrienti. Il sistema differenzia i target tra giorni di allenamento e giorni di riposo per ottimizzare composizione corporea e performance.',
        steps: [
          "Seleziona il pasto: Colazione / Pranzo / Pre-workout / Cena / Snack.",
          'Aggiungi gli alimenti con peso in grammi — usa nomi semplici come "Petto di pollo 200g" o "Riso 80g crudo".',
          'La barra calorie e i cerchi macro si aggiornano in tempo reale.',
          'Il sistema confronta i tuoi totali con i target del giorno (diversi tra Training Day e Rest Day).',
        ],
        metrics: [
          {
            name: 'Calorie & TDEE',
            what: 'Le calorie totali giornaliere (kcal) determinano se sei in surplus (guadagno massa), mantenimento o deficit (perdita grasso). Il TDEE (Total Daily Energy Expenditure) è la tua spesa energetica totale e varia in base a BMR, attività fisica e NEAT.',
            values: [
              { range: 'Deficit −300/−500 kcal', meaning: 'Perdita grasso ottimale. Preserva la massa muscolare se le proteine sono adeguate.', color: '#3b82f6' },
              { range: 'Mantenimento ±100 kcal', meaning: 'Ricomposizione corporea o fasi di picco performance senza variazioni di peso.', color: '#10b981' },
              { range: 'Surplus +200/+400 kcal', meaning: 'Lean bulk. Crescita muscolare con accumulo minimo di grasso.', color: '#f59e0b' },
              { range: 'Surplus +500 kcal+', meaning: 'Bulk aggressivo. Crescita rapida ma con accumulo significativo di grasso.', color: '#ef4444' },
            ],
          },
          {
            name: 'Proteine',
            what: 'I macronutrienti più importanti per un atleta. Le proteine costruiscono e riparano il tessuto muscolare (sintesi proteica muscolare, MPS). La distribuzione durante il giorno conta quasi quanto il totale giornaliero.',
            values: [
              { range: '1.6–2.2 g/kg peso corporeo', meaning: 'Range ottimale per la maggior parte degli atleti di forza. La soglia alta è utile in deficit calorico per preservare la massa magra.', color: '#10b981' },
              { range: '2.2–3.0 g/kg', meaning: 'Utile in fasi di deficit aggressivo o per atleti drug-free con alto volume di training.', color: '#3b82f6' },
              { range: '< 1.6 g/kg', meaning: 'Insufficiente per supportare l\'ipertrofia. Rischio di perdita di massa magra.', color: '#ef4444' },
            ],
            tips: [
              'Distribuisci le proteine in 4–5 pasti da almeno 30–40g per massimizzare la MPS.',
              'La finestra anabolica post-allenamento dura 2–4 ore, non 30 minuti come si credeva un tempo.',
            ],
          },
          {
            name: 'Carboidrati',
            what: 'Il carburante principale per gli allenamenti ad alta intensità. Il glicogeno muscolare (stoccato dai carboidrati) è la fonte energetica primaria per sollevamento pesi e sprint. Un basso intake di carbo riduce la performance prima di ridurre la massa grassa.',
            values: [
              { range: '3–5 g/kg (training day)', meaning: 'Adeguato per sessioni di forza di media intensità.', color: '#10b981' },
              { range: '5–7 g/kg (training day pesante)', meaning: 'Supporta sessioni ad alto volume o doppi allenamenti.', color: '#3b82f6' },
              { range: '1–3 g/kg (rest day)', meaning: 'Riduzione strategica nei giorni di riposo per ottimizzare la composizione corporea.', color: '#f59e0b' },
            ],
          },
          {
            name: 'Grassi',
            what: 'Essenziali per la produzione ormonale (testosterone, GH, cortisolo) e l\'assorbimento delle vitamine liposolubili (A, D, E, K). Non scendere mai sotto il minimo fisiologico, anche in deficit calorico.',
            values: [
              { range: '0.8–1.2 g/kg', meaning: 'Range funzionale. Supporta la salute ormonale senza eccedere in calorie.', color: '#10b981' },
              { range: '< 0.5 g/kg', meaning: 'Insufficiente. Rischio di calo del testosterone e compromissione del recupero ormonale.', color: '#ef4444' },
            ],
          },
        ],
      },
    ],
  },
  {
    label: 'Recovery Dashboard',
    items: [
      {
        icon: <HeartPulse size={18} />,
        color: '#10b981',
        title: 'Come usare Recovery Dashboard',
        href: '/recovery',
        desc: 'Ogni mattina inserisci i dati dalla tua app fitness (Suunto, Garmin, Polar, Oura). Il sistema elabora un semaforo di prontezza e una matrice muscolare per guidare le tue decisioni di allenamento.',
        steps: [
          'Apri la tua app fitness appena sveglio (prima di alzarti per avere dati HRV accurati).',
          'Inserisci: HRV, RHR, ore di sonno (o minuti), Sleep Score, Recovery Score, CTL, ATL, TSB.',
          'Il semaforo si aggiorna automaticamente — verde: spingiti, giallo: moderati, rosso: recupero attivo.',
          'Consulta la matrice distretti per vedere i muscoli ancora affaticati dai giorni precedenti.',
        ],
        metrics: [
          {
            name: 'HRV — Heart Rate Variability',
            what: 'La variabilità della frequenza cardiaca misura le fluttuazioni millisecondo per millisecondo tra un battito e l\'altro. Un HRV alto indica che il sistema nervoso autonomo è ben bilanciato e il corpo è pronto allo stress. È il migliore indicatore oggettivo di recupero disponibile senza laboratorio.',
            values: [
              { range: 'HRV molto alto (> baseline +20%)', meaning: 'Sistema nervoso parasimpatico dominante. Condizione ottimale: puoi allenarti a piena intensità.', color: '#10b981' },
              { range: 'HRV nella norma (±10% baseline)', meaning: 'Recupero nella norma. Allenamento regolare pianificato.', color: '#3b82f6' },
              { range: 'HRV basso (−10/−20% baseline)', meaning: 'Leggero stress fisiologico. Riduci volume o intensità del 20–30%.', color: '#f59e0b' },
              { range: 'HRV molto basso (< −20% baseline)', meaning: 'Sistema nervoso stressato: malattia, overtraining o stress emotivo elevato. Riposo o recupero attivo.', color: '#ef4444' },
            ],
            howToRead: 'L\'HRV assoluto varia enormemente tra individui (range 20–200ms). Quello che conta è il tuo trend personale. Il sistema usa la tua media mobile a 7 giorni come baseline. Misura sempre la mattina, stessa posizione, stessa durata (es. 3 minuti supino).',
            tips: [
              'Alcool, sonno scarso e stress emotivo abbassano l\'HRV più di una sessione pesante.',
              'L\'HRV migliora con l\'allenamento aerobico a bassa intensità (Zone 2) e il lavoro di respirazione (4-7-8, coerenza cardiaca).',
              'Garmin usa RMSSD come metrica base; Polar usa PNS Index; Suunto usa Recovery Score basato su modello proprietario.',
            ],
          },
          {
            name: 'RHR — Resting Heart Rate',
            what: 'La frequenza cardiaca a riposo (battiti al minuto misurati al mattino prima di alzarsi). Un RHR elevato rispetto alla tua baseline segnala stress fisiologico, infezione, disidratazione o recupero incompleto. Atleticamente correlato con il VO2max: più sei allenato, più è basso.',
            values: [
              { range: '< 40 bpm', meaning: 'Atleta élite ben allenato. Normale per atleti endurance di alto livello.', color: '#10b981' },
              { range: '40–55 bpm', meaning: 'Ottimo. Associato a buona capacità aerobica e recupero efficiente.', color: '#3b82f6' },
              { range: '55–70 bpm', meaning: 'Nella media. Accettabile per atleti amatori o in fase di costruzione.', color: '#f59e0b' },
              { range: '> baseline +5–8 bpm', meaning: 'Segnale di allerta: possibile affaticamento, malattia in arrivo o recupero incompleto. Riduci il carico.', color: '#ef4444' },
            ],
            tips: [
              'Monitora le variazioni rispetto alla tua baseline, non i valori assoluti.',
              'Un RHR elevato il mattino dopo una sessione pesante è normale; se persiste 2–3 giorni, è un segnale di overreaching.',
            ],
          },
          {
            name: 'Recovery Score (0–100)',
            what: 'Indice composito calcolato dalle app fitness (Suunto, Garmin, Polar, Oura) che combina HRV, RHR, qualità del sonno e a volte parametri aggiuntivi. Ogni brand usa un algoritmo proprietario, ma il significato è analogo: misura quanto sei recuperato rispetto al tuo stato ottimale.',
            values: [
              { range: '75–100', meaning: 'Recupero ottimale. Corpo pronto per allenamenti ad alta intensità.', color: '#10b981' },
              { range: '50–74', meaning: 'Recupero parziale. Allenamento a intensità moderata consigliato.', color: '#3b82f6' },
              { range: '25–49', meaning: 'Recupero insufficiente. Preferisci sessioni leggere o recupero attivo.', color: '#f59e0b' },
              { range: '0–24', meaning: 'Recupero critico. Riposo completo o mobilità leggera. Non aggiungere stress.', color: '#ef4444' },
            ],
          },
          {
            name: 'CTL — Chronic Training Load',
            what: 'Il "fitness" accumulato. Rappresenta la media pesata esponenziale del Training Load degli ultimi 42 giorni (6 settimane). Un CTL alto significa un alto livello di forma fisica acquisita nel tempo. È la "base" su cui costruisci la performance.',
            howToRead: 'CTL cresce lentamente (settimane/mesi) e cala lentamente. Non puoi alzarlo rapidamente senza rischiare l\'overtraining. Pensa a esso come al "conto in banca" della tua forma fisica.',
            tips: [
              'Aumentare CTL del 5–7 TSS/settimana è considerato sicuro per la maggior parte degli atleti.',
              'Un CTL alto non significa essere pronti a gareggiare — serve anche un TSB positivo.',
            ],
          },
          {
            name: 'ATL — Acute Training Load',
            what: 'L\'affaticamento accumulato di recente. Rappresenta la media pesata esponenziale del Training Load degli ultimi 7 giorni. Un ATL alto significa che hai allenato molto di recente e sei affaticato. Si abbassa rapidamente con il riposo (2–5 giorni).',
            howToRead: 'ATL reagisce velocemente ai carichi. Dopo una settimana di duro allenamento sale; dopo 3 giorni di scarico scende. È il "debito" fisico che stai portando.',
          },
          {
            name: 'TSB — Training Stress Balance',
            what: 'La "forma" o "prontezza" attuale. Si calcola come TSB = CTL − ATL. Un TSB positivo indica più fitness che affaticamento (pronto a performare); negativo indica più affaticamento che fitness (recupero necessario). Questo è il numero da guardare prima di una gara o di un test di forza.',
            values: [
              { range: 'TSB > +15', meaning: 'Forma ottimale. Picco di performance. Ideale prima di gare o test massimali.', color: '#10b981' },
              { range: 'TSB 0 / +15', meaning: 'Buona prontezza. Puoi esprimere il meglio del tuo fitness attuale.', color: '#3b82f6' },
              { range: 'TSB −10 / 0', meaning: 'Leggero affaticamento. Allenamento produttivo ma non al massimo della performance.', color: '#f59e0b' },
              { range: 'TSB < −30', meaning: 'Affaticamento eccessivo. Rischio di overtraining. Riduci il carico immediatamente.', color: '#ef4444' },
            ],
            howToRead: 'La maggior parte degli atleti di endurance lavora con TSB tra −10 e +5 durante l\'accumulo e cerca TSB +10/+20 per le gare. Nello sport di forza i valori sono simili ma le scale variano in base al metodo di calcolo.',
          },
          {
            name: 'ACWR — Acute:Chronic Workload Ratio',
            what: 'Il rapporto tra il carico acuto (ultima settimana) e il carico cronico (ultime 4 settimane). È il principale indicatore di rischio infortuni secondo la ricerca scientifica. Un ACWR troppo alto significa che hai aumentato il carico troppo rapidamente rispetto a quanto il tuo corpo è abituato.',
            values: [
              { range: 'ACWR 0.8–1.3', meaning: 'Zona sicura ("sweet spot"). Carico ben bilanciato con il fitness accumulato.', color: '#10b981' },
              { range: 'ACWR 1.3–1.5', meaning: 'Zona di attenzione. Rischio di infortuni moderatamente aumentato.', color: '#f59e0b' },
              { range: 'ACWR > 1.5', meaning: 'Zona rossa. Rischio infortuni significativamente aumentato. Riduci immediatamente il carico acuto.', color: '#ef4444' },
              { range: 'ACWR < 0.8', meaning: 'Sottoallenato o in deload. Forma in calo, ma rischio infortuni basso.', color: '#64748b' },
            ],
            tips: [
              'Fonte: Gabbett (2016) — "The training-injury prevention paradox", British Journal of Sports Medicine.',
              'Non aumentare mai il volume settimanale di più del 10% rispetto alla settimana precedente.',
            ],
          },
          {
            name: 'Sleep Score & Qualità del Sonno',
            what: 'Il sonno è il principale fattore di recupero. Durante il sonno profondo (NREM fase 3–4) si verifica il picco di secrezione del GH (ormone della crescita), la riparazione muscolare e il consolidamento della memoria motoria. La qualità del sonno impatta HRV, RHR e performance cognitiva.',
            values: [
              { range: '7–9 ore + score alto', meaning: 'Recupero ottimale. Massima sintesi proteica notturna e riparazione tissutale.', color: '#10b981' },
              { range: '6–7 ore', meaning: 'Sufficiente ma non ottimale. Performance cognitiva e fisica leggermente ridotta.', color: '#f59e0b' },
              { range: '< 6 ore', meaning: 'Privazione del sonno. HRV basso, cortisolo elevato, ridotta toleranza al dolore. Non allenarti ad alta intensità.', color: '#ef4444' },
            ],
            tips: [
              'La privazione del sonno riduce il testosterone del 10–15% già dopo 5 notti da 5 ore.',
              'Evita luci blu (schermi) nelle 2 ore prima di dormire — abbassano la melatonina del 22%.',
              'La temperatura ideale per dormire è 16–19°C.',
            ],
          },
        ],
      },
    ],
  },
  {
    label: 'AI Coach',
    items: [
      {
        icon: <Bot size={18} />,
        color: '#6366f1',
        title: 'Come usare AI Coach',
        href: '/coach',
        desc: 'Il coach AI ha accesso in tempo reale a tutte le tue sessioni, macro, recovery score e metriche corporee. Puoi chiedergli analisi, consigli e programmazione personalizzata.',
        steps: [
          'Scrivi la domanda in linguaggio naturale — italiano o inglese.',
          'Il coach conosce le ultime 7 sessioni, i macro degli ultimi 3 giorni, il recovery di oggi e il peso attuale.',
          'Puoi chiedere analisi specifiche, modifiche al piano, ricette, strategie di recupero.',
          'Ogni lunedì mattina genera automaticamente il report settimanale con KPI e raccomandazioni.',
        ],
        metrics: [
          {
            name: 'Cosa puoi chiedere al Coach',
            what: 'Il coach è addestrato su fisiologia dello sport, nutrizione sportiva, programmazione dell\'allenamento e recupero. Risponde con dati alla mano.',
            tips: [
              '"Analizza il mio recupero questa settimana e dimmi se posso fare una sessione pesante domani."',
              '"Il mio HRV è sceso del 20% in 3 giorni, cosa potrebbe causarlo?"',
              '"Crea un pasto pre-workout con 80g carbo e 30g proteine."',
              '"Ho saltato 2 sessioni questa settimana. Come recupero il volume perso?"',
              '"Dammi la progressione dei carichi per lo Squat nelle prossime 4 settimane."',
              '"Il mio ACWR è 1.6. Cosa devo fare questa settimana?"',
            ],
          },
        ],
      },
    ],
  },
  {
    label: 'Body & Plan',
    items: [
      {
        icon: <Scale size={18} />,
        color: '#ec4899',
        title: 'Body Metrics',
        href: '/body',
        desc: 'Traccia composizione corporea nel tempo. Il grafico mostra trend di peso, % grasso e misure per valutare la risposta al training e alla dieta.',
        steps: [
          'Pesa ti ogni mattina appena sveglio, dopo aver urinato, prima di mangiare o bere.',
          'Usa sempre la stessa bilancia, sulla stessa superficie, stessa ora.',
          'Aggiungi % BF (body fat) se hai una bilancia impedenziometrica o fai plicometria periodica.',
          'Inserisci misure corporee mensilmente: vita, fianchi, braccia, cosce, petto.',
        ],
        metrics: [
          {
            name: 'Peso corporeo & Trend',
            what: 'Il peso giornaliero fluttua di 1–3 kg per ritenzione idrica, glicogeno e contenuto intestinale. Il dato rilevante è la media mobile a 7 giorni, non il singolo giorno. Usa il trend di 4 settimane per valutare se stai perdendo o guadagnando massa.',
            tips: [
              'Una perdita di 0.3–0.7 kg/settimana è ottimale per preservare la massa muscolare.',
              'Un guadagno di 0.2–0.4 kg/settimana è ottimale per un lean bulk.',
              'Se il peso scende rapidamente (>1 kg/settimana) probabilmente stai perdendo anche muscolo.',
            ],
          },
          {
            name: 'Body Fat % (% Grasso Corporeo)',
            what: 'La percentuale di grasso sul peso totale. I metodi di misurazione variano in accuratezza: plicometria (±3%), DEXA (±1–2%), impedenziometria (±3–5%). Quello che conta è la tendenza nel tempo con lo stesso metodo.',
            values: [
              { range: '6–12% (uomini)', meaning: 'Atleta competitivo in forma da gara. Non sostenibile a lungo termine.', color: '#3b82f6' },
              { range: '12–18% (uomini)', meaning: 'Fisico atletico. Ottimale per performance e salute a lungo termine.', color: '#10b981' },
              { range: '18–25% (uomini)', meaning: 'Nella media. Buona base di partenza per un programma di ricomposizione.', color: '#f59e0b' },
              { range: '14–20% (donne)', meaning: 'Atletico. Range ottimale per la salute ormonale femminile.', color: '#10b981' },
            ],
          },
        ],
      },
      {
        icon: <CalendarDays size={18} />,
        color: '#8b5cf6',
        title: 'Plan Manager',
        href: '/plan',
        desc: 'Gestisci il mesociclo attivo, monitora i KPI di forza e pianifica obiettivi con timeline e milestone.',
        steps: [
          'Crea un nuovo mesociclo con nome, durata (es. 6 settimane) e obiettivo (ipertrofia / forza / picco).',
          'Aggiungi i KPI di forza che vuoi raggiungere (es. Squat 120 kg per 5 rip).',
          'Il calendario mostra le sessioni pianificate e quelle completate.',
          'A fine mesociclo confronta KPI iniziali e finali per misurare la progressione.',
        ],
        metrics: [
          {
            name: 'Struttura del Mesociclo',
            what: 'Un mesociclo è un blocco di allenamento di 4–8 settimane con un obiettivo specifico. Si articola in microcicli (settimane) che tipicamente seguono la sequenza: Accumulo → Intensificazione → Realizzazione → Deload.',
            values: [
              { range: 'Accumulo (sett. 1–3)', meaning: 'Volume alto, intensità moderata. Costruisci la base. RPE 7–8, RIR 2–4.', color: '#3b82f6' },
              { range: 'Intensificazione (sett. 4–5)', meaning: 'Volume moderato, intensità alta. Aumenti i carichi. RPE 8–9, RIR 1–2.', color: '#f59e0b' },
              { range: 'Realizzazione / Peak (sett. 6)', meaning: 'Volume basso, intensità massima. Test o gara. RPE 9–10.', color: '#ef4444' },
              { range: 'Deload (sett. 7)', meaning: 'Volume ridotto al 40–50%. Recupero attivo. TSB sale, sei pronto per il ciclo successivo.', color: '#10b981' },
            ],
          },
        ],
      },
    ],
  },
]

function MetricCard({ metric }: { metric: Metric }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}
    >
      <button
        className="w-full flex items-center justify-between p-3 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Info size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span className="text-xs font-bold" style={{ color: 'var(--fg-primary)' }}>{metric.name}</span>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--fg-subtle)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{metric.what}</p>
          {metric.values && (
            <div className="space-y-1.5">
              {metric.values.map((v, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: v.color }} />
                  <div>
                    <span className="text-[10px] font-black" style={{ color: v.color }}>{v.range}</span>
                    <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{v.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {metric.howToRead && (
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)' }}>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--fg-primary)' }}>
                <span className="font-black">Come leggerlo: </span>{metric.howToRead}
              </p>
            </div>
          )}
          {metric.tips && metric.tips.length > 0 && (
            <ul className="space-y-1">
              {metric.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px]" style={{ color: 'var(--fg-subtle)' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

interface HelpPanelProps {
  open: boolean
  onClose: () => void
}

export default function HelpPanel({ open, onClose }: HelpPanelProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[90]"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}
      <div
        className="fixed top-0 right-0 h-full z-[100] w-full flex flex-col"
        style={{
          maxWidth: '520px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'var(--accent)', boxShadow: '0 0 15px var(--glow-accent)' }}>
              <BookOpen size={18} color="white" />
            </div>
            <div>
              <h2 className="font-black text-base" style={{ color: 'var(--fg-primary)' }}>Guida & Metriche</h2>
              <p className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>Espandi ogni metrica per spiegazioni dettagliate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: 'var(--fg-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[9px] font-black uppercase mb-4 px-1" style={{ color: 'var(--fg-subtle)', letterSpacing: '0.2em' }}>
                {section.label}
              </p>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                  >
                    {/* Item header */}
                    <div className="flex items-start justify-between gap-3 p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl shrink-0" style={{ background: `${item.color}20`, color: item.color }}>
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm" style={{ color: 'var(--fg-primary)' }}>{item.title}</h4>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{item.desc}</p>
                        </div>
                      </div>
                      <a href={item.href} onClick={onClose} className="shrink-0 p-1.5 rounded-lg" style={{ color: 'var(--fg-subtle)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </a>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Steps */}
                      {item.steps && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase" style={{ color: 'var(--fg-subtle)', letterSpacing: '0.15em' }}>Come si usa</p>
                          {item.steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5"
                                style={{ background: `${item.color}20`, color: item.color }}
                              >
                                {i + 1}
                              </span>
                              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{step}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metrics */}
                      {item.metrics && item.metrics.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase" style={{ color: 'var(--fg-subtle)', letterSpacing: '0.15em' }}>Metriche & Valori</p>
                          {item.metrics.map((metric) => (
                            <MetricCard key={metric.name} metric={metric} />
                          ))}
                        </div>
                      )}
                    </div>
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

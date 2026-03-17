# AI_HANDOVER.md — Performance Ecosystem

---

## 📜 STORIA DEL PROGETTO

### Fondazione — Febbraio/Marzo 2026
Progetto creato da zero seguendo le specifiche di `PerformanceEcosystem_Specifiche_v1.pdf`. Stack scelto: Next.js 16 + Prisma 6 + Neon + NextAuth v5 + Groq + Anthropic Vision + Tailwind CSS. Deploy attivo su Vercel.

---

## 📌 STATO BASELINE — Marzo 2026

**App deployata e funzionante su Vercel.**

### ✅ Feature operative al momento di questo documento

**Modulo 1 — Training Log**
- ✅ Inserimento sessioni (A/B/C/D/V1/V2/OUTDOOR) con esercizi, carichi, RIR
- ✅ Active Tracker real-time (815 righe) — gestisce set-per-set con SetLog
- ✅ District stress slider dopo sessione
- ✅ Storico sessioni con dettaglio esercizi
- ✅ Libreria esercizi con filtri (muscolo, equipment, difficoltà)
- ✅ Traduttore nomi esercizi IT↔EN
- ✅ Exercise history con trend (su/giù/stabile) — ultimi 3 allenamenti per esercizio
- ❌ Grafici progressione carico nel tempo (dati ci sono, chart mancante)
- ❌ Timer recuperi integrato nel tracker
- ❌ Note vocali (campo `voiceNoteUrl` in schema, trascrizione non implementata)
- ❌ Sync Suunto Race (nessuna integrazione API)

**Modulo 2 — Nutrition Log**
- ✅ Log giornaliero pasti (colazione/pranzo/pre-wk/post-wk/cena/snack)
- ✅ Food scan con Claude Vision (foto piatto → stima macro)
- ✅ FoodItem manuale con kcal/proteine/carbo/grassi
- ✅ Totale giornaliero calorie + macros
- ❌ Database alimenti (Open Food Facts o simile non integrato)
- ❌ Barcode scanner (food-scan API esiste ma solo vision, non barcode)
- ✅ Template pasti (salva/applica pasto con 1-tap — CP-004)
- ❌ Alert intelligenti (es. "Ti mancano 40g di proteine a cena")
- ❌ Ciclo carbo automatico (target diversi giorno allenamento vs riposo)

**Modulo 3 — Recovery Dashboard**
- ✅ Log manuale CTL, ATL, TSB, HRV, RHR, sonno, recovery score
- ✅ RecoveryOrb visiva nel dashboard
- ✅ Storico recovery con grafici base
- ✅ Form device (aggiungi Suunto/Garmin/ecc. come device)
- ✅ Cron job daily-sync (struttura pronta, sync effettivo da implementare)
- ❌ Sync automatico Suunto Race API (ACWR, HRV, sonno — manuale ora)
- ❌ ACWR e Monotony calcolati automaticamente
- ❌ Matrice stress distrettuale settimanale
- ❌ Confronto TL pianificato vs TL effettivo

**Modulo 4 — AI Coach**
- ✅ Chat con Groq `llama-3.3-70b-versatile` con contesto utente
- ✅ Cron weekly report ogni lunedì (genera AIReport per tutti gli utenti)
- ✅ Contesto AI (`lib/ai/context.ts`) carica profilo, sessioni, recovery
- ❌ Analisi automatica post-sessione (non triggera automaticamente dopo ogni log)
- ❌ Adattamento piano real-time (Coach non modifica i PlanDay)
- ❌ Alert proattivi push (no notifiche push)
- ❌ Visualizzazione report settimanali nella UI (AIReport salvato ma non mostrato)

**Modulo 5 — Body Metrics**
- ✅ Log peso corporeo giornaliero
- ✅ Misure corporee (vita, fianchi, petto, braccia, cosce)
- ✅ Grafico peso nel tempo
- ✅ Foto progresso (photo-upload)
- ❌ Correlazioni automatiche (peso vs TL, calorie, sonno)
- ❌ Composizione corporea avanzata (% grasso, massa magra) con grafici
- ❌ Sync bilancia smart (Withings/Xiaomi)
- ❌ Target composizione con proiezione temporale

**Modulo 6 — Plan Manager**
- ✅ PlanWizard AI — genera 3 proposte mesociclo con Groq
- ✅ Dettaglio mesociclo con PlanDay e PlanExercise
- ✅ Import piano da PDF (parsing AI)
- ✅ Sezione nutrizione nel piano
- ✅ Calendario settimanale con PlannedSession (CP-002)
- ❌ KPI tracker con avanzamento visivo (campo `kpi` in Mesocycle è Json ma non mostrato)
- ❌ Roadmap obiettivi (AthleteGoal model esiste, UI mancante)
- ❌ Storico mesocicli con confronto performance

**Infrastruttura**
- ✅ PWA (manifest.ts installabile)
- ✅ Auth NextAuth v5
- ✅ Deploy Vercel
- ❌ Push notifications (ServiceWorker non configurato)
- ❌ APEX Protocol (CLAUDE.md + AI_HANDOVER.md — creati il 17 Mar 2026)
- ❌ Git backup (`stable-*` tag non ancora creato)

---

## 🎯 BACKLOG PRIORITIZZATO

### SPRINT 1 — Completamento MVP critico

---

### CHECKPOINT CP-001 — Grafici progressione esercizi
**Stato:** ✅ COMPLETATO DA CLAUDE (17 Marzo 2026)
**Risk tier:** LOW

**Completion Notes:**
- Riscritto il modal chart in `app/(protected)/training/[id]/exercise-list.tsx`
- Aggregazione per sessione (max peso per data), non più per singolo set
- Aggiunto trend badge (↑↓→) con delta kg vs sessione precedente
- SVG con area gradient fill, griglia orizzontale, etichette date sull'asse X
- Stile coerente con CSS variables del tema

**Contesto:**
`exercise-history.ts` già restituisce dati storici con trend. Mancano i grafici nella UI del dettaglio sessione e nell'Active Tracker. Questo è il differenziale più alto-valore per l'allenamento.

**Task:**

Creare `app/components/ExerciseProgressChart.tsx` — Client Component.

Usa solo SVG puro (niente librerie esterne) come già fatto nel dashboard per il cerchio calorie.

```typescript
interface Props {
  exerciseName: string
  // entries: array di { date: string, maxWeightKg: number, totalReps: number }
  // recuperato da getExerciseHistory già esistente
}
```

Il grafico deve mostrare:
- Asse X: date delle ultime 6 sessioni con quell'esercizio
- Asse Y: peso massimo usato (riga principale) + volume totale (riga secondaria, colore diverso)
- Punto evidenziato per sessione corrente
- Badge in alto: "↑ +2.5kg rispetto alla scorsa volta" oppure "→ Stabile" oppure "↓ -2.5kg"

Integrare il componente in:
1. `app/(protected)/training/[id]/exercise-list.tsx` — sotto ogni esercizio, collassabile
2. `app/(protected)/training/active/ActiveTracker.tsx` — come drawer laterale, si apre toccando il nome dell'esercizio

**File da modificare/creare:**
- `app/components/ExerciseProgressChart.tsx` — NUOVO
- `app/(protected)/training/[id]/exercise-list.tsx` — aggiungi il componente
- `app/(protected)/training/active/ActiveTracker.tsx` — aggiungi drawer

**Vincoli:**
- Nessuna libreria chart esterna (recharts, chart.js, etc.) — SVG puro o Canvas
- Usa CSS variables del tema (`--accent`, `--accent2`, `--positive`, `--negative`)
- Dati da `getExerciseHistory(exerciseName, 6)` già disponibile

**Acceptance criteria:**
- [ ] Il grafico mostra le ultime 6 sessioni con quell'esercizio
- [ ] Badge trend visibile (↑↓→) con delta peso
- [ ] Collassabile nel dettaglio sessione (click sul nome esercizio)
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] `npm run build` → successo

---

### CHECKPOINT CP-002 — Calendario settimanale PlannedSession
**Stato:** ✅ COMPLETATO DA CLAUDE (17 Marzo 2026)
**Risk tier:** MEDIUM

**Completion Notes:**
- Aggiunte `getWeekCalendarData(weekStartISO)` e `schedulePlanForWeek(planId, weekStartISO)` in `app/actions/plans.ts`
- Creato `app/components/WeeklyCalendar.tsx` — Client Component: griglia 7 giorni (Lun-Dom), navigazione settimana, stato PENDING/COMPLETED/SKIPPED con colori, link al giorno o alla sessione completata, bottone "Pianifica questa settimana" che chiama `schedulePlanForWeek`
- Integrato in `app/(protected)/plan/page.tsx` nella sidebar (col-span-4)

**Data:** 17 Marzo 2026

**Contesto:**
Il modello `PlannedSession` esiste già in schema (link tra WorkoutPlan e WorkoutSession + data pianificata). La pagina `/plan` mostra il piano ma non un calendario settimanale interattivo. Il dashboard mostra solo "la prossima sessione" ma non una vista a 7 giorni.

**Task — Step 1: generazione PlannedSession**
In `app/actions/plans.ts`, aggiungere funzione `schedulePlanForWeek(planId, startDate)`:
- Per ogni `PlanDay` del piano, crea un `PlannedSession` per la settimana corrente
- Usa `trainingDays` del `WorkoutPlan` (es. [1,3,5] = lun/mer/ven) per assegnare le date
- Skip se esiste già una PlannedSession per quella data (upsert safe)

**Task — Step 2: componente CalendarioSettimana**
Creare `app/components/WeeklyCalendar.tsx` — Client Component.

Vista 7 colonne (Lun → Dom), ogni colonna mostra:
- Nome giornata + data
- Se c'è una `PlannedSession`:
  - Nome/tipo sessione (es. "Sessione A — Upper")
  - Status badge: PENDING (grigio) / COMPLETED (verde) / SKIPPED (rosso)
  - Bottone "Inizia" → naviga a `/training/active`
- Se giorno di riposo: icona riposo + testo "Recupero"

Integrare in `app/(protected)/plan/page.tsx` in cima alla pagina.

**File da modificare/creare:**
- `app/components/WeeklyCalendar.tsx` — NUOVO
- `app/actions/plans.ts` — aggiungi `schedulePlanForWeek`
- `app/(protected)/plan/page.tsx` — integra WeeklyCalendar

**Acceptance criteria:**
- [ ] Vista 7 giorni visibile nella pagina Piano
- [ ] PlannedSession create automaticamente per la settimana
- [ ] Status aggiornato quando la sessione è completata
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] `npm run build` → successo

---

### CHECKPOINT CP-003 — Report settimanale AI: UI di visualizzazione
**Stato:** ✅ COMPLETATO DA CLAUDE (17 Marzo 2026)
**Risk tier:** LOW

**Completion Notes:**
- Creato `app/(protected)/coach/coach-tabs.tsx` — Client Component con tab Chat | Report
- `coach/page.tsx` aggiornato: fetch ultimi 4 AIReport + passa a CoachTabs
- Ogni report: card con header data, expand/collapse, render markdown leggero
- Stato vuoto con spiegazione "generato ogni lunedì"
- ChatClient invariato, ora incapsulato in CoachTabs

**Contesto:**
Il cron `/api/cron` genera già `AIReport` ogni settimana e li salva nel DB. Ma non c'è nessuna pagina/sezione nell'app dove l'utente li può leggere. Gli AIReport esistono nel DB ma sono "invisibili".

**Task:**
Aggiungere sezione "Report Settimanali" nella pagina `/coach`:
- Fetch degli ultimi 4 AIReport dell'utente (tipo WEEKLY, orderBy date desc)
- Card per ogni report con: data, anteprima (primi 200 caratteri), expand per leggere tutto
- Stile coerente con il resto del Coach (dark card, bordi sottili, font monospace per il testo)
- Se non ci sono report ancora: stato vuoto con spiegazione ("Il tuo primo report verrà generato lunedì")

**File da modificare:**
- `app/(protected)/coach/page.tsx` — aggiungi fetch AIReport e sezione UI
- `app/(protected)/coach/chat-client.tsx` — aggiungere tab "Report" accanto alla chat

**Acceptance criteria:**
- [ ] Ultimi 4 report visibili nella pagina Coach
- [ ] Expand/collapse funzionante
- [ ] Stato vuoto gestito
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] `npm run build` → successo

---

### CHECKPOINT CP-004 — Template pasti Nutrizione
**Stato:** ✅ COMPLETATO DA CLAUDE (17 Marzo 2026)
**Risk tier:** MEDIUM

**Completion Notes:**
- Schema `MealTemplate` aggiunto in `prisma/schema.prisma` (dopo FoodItem, sezione NUTRITION) + `mealTemplates MealTemplate[]` nel modello User — `prisma db push` eseguito con successo
- Aggiunte 4 server actions in `app/actions/nutrition.ts`: `saveMealAsTemplate`, `getMealTemplates`, `applyTemplate`, `deleteMealTemplate`
- UI in `app/(protected)/nutrition/nutrition-client.tsx`: MealSection ha ora due bottoni "Usa template" e "Salva template" (inline, senza modal), pannello inline per salvare con nome personalizzato, pannello inline per listare/applicare/eliminare template per tipo pasto

**Data:** 17 Marzo 2026

**Contesto:**
La spec indica che i pasti tipo (colazione yogurt+muesli, pranzo farro+pollo) devono essere salvabili e riapplicabili con 1 tap. Attualmente ogni pasto si inserisce da zero. È il punto di attrito maggiore per il log nutrizionale quotidiano.

**Task — Step 1: Schema**
Aggiungere alla migration (tramite Claude — NON Gemini tocca lo schema):
```prisma
model MealTemplate {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name       String    // "Colazione proteica", "Pranzo pre-gara"
  mealType   MealType
  items      Json      // Array di { name, quantityG, kcal, proteinG, carbsG, fatG }
  totalKcal  Int
  totalProtein Float
  createdAt  DateTime  @default(now())
}
```

**Task — Step 2: Actions**
In `app/actions/nutrition.ts`:
- `saveMealAsTemplate(mealId, templateName)` — salva i FoodItem di un pasto come template
- `applyTemplate(templateId, nutritionDayId, mealType)` — crea un nuovo Meal dal template

**Task — Step 3: UI**
In `app/(protected)/nutrition/nutrition-client.tsx`:
- Bottone "Salva come template" accanto a ogni pasto loggato
- Sezione "I miei template" con lista + bottone "Applica" per ogni pasto del giorno
- Modal/drawer leggero per selezionare quale template applicare

**Acceptance criteria:**
- [ ] Si può salvare un pasto come template con nome personalizzato
- [ ] I template sono listati e applicabili con 1 bottone
- [ ] Il totale giornaliero si aggiorna dopo l'applicazione
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] `npm run build` → successo

**NOTA PER CLAUDE (non Gemini):** Lo schema `MealTemplate` va aggiunto e migrato da Claude nella prossima sessione prima che Gemini implementi la UI.

---

### SPRINT 2 — Differenziali chiave

---

### CHECKPOINT CP-005 — KPI Tracker mesociclo con avanzamento visivo
**Stato:** ✅ COMPLETATO (17 Marzo 2026)
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Completion Notes:**
- Creato `app/actions/athlete-goals.ts` con `updateGoalProgress` e `getActiveGoals`.
- Creato `app/components/KPITracker.tsx` con barre di avanzamento colorate e aggiornamento inline.
- Integrato in `app/(protected)/dashboard/page.tsx` (widget bento grid) e `app/(protected)/plan/[id]/page.tsx` (sezione KPI).

**Contesto:**
Il modello `Mesocycle` ha un campo `kpi: Json` e il modello `AthleteGoal` esiste già. Mancava la UI per visualizzarli.

---

### CHECKPOINT CP-006 — Alert nutrizione intelligenti
**Stato:** ✅ COMPLETATO (17 Marzo 2026)
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Completion Notes:**
- Creato componente `SmartAlerts` in `app/(protected)/nutrition/nutrition-client.tsx`.
- Implementati alert per: Proteine insufficienti la sera, Calorie sopra target (>110%), Carboidrati bassi in training day.
- Gestione dismissibile con `localStorage` (validità 2 ore).

**Contesto:**
L'app sa i gap nutrizionali ma non avvisava proattivamente.

---

### SPRINT 3 — Integrazione Suunto (HIGH complexity)

---

### CHECKPOINT CP-007 — Import manuale dati wearable (Suunto, Garmin, Apple, ecc.)
**Stato:** COMPLETATO ✅
**Data:** 17 Marzo 2026
**Risk tier:** MEDIUM

**Contesto:**
L'integrazione diretta via API con i wearable (Suunto Race, Garmin, Apple Health) richiede permessi OAuth complessi per ogni ecosistema. Approccio scelto: **import manuale da parte dell'utente** — l'utente copia i dati dall'app del suo orologio e li incolla/inserisce nel sistema. Questo funziona con qualsiasi ecosistema senza nessuna integrazione specifica.

**Modalità di import implementate:**

**Modalità 1 — Inserimento manuale veloce**
Campo per campo: HRV, RHR, recovery score, sonno, CTL/ATL/TSB.
Migliorato il form con:
- Campi messi in evidenza (i 3 più usati: Recovery Score, HRV, Sonno)
- Campi avanzati collassabili (CTL, ATL, TSB, ACWR)
- Hint testuali: "Trovi questo dato nella schermata Recovery dell'app Suunto/Garmin"

**Modalità 2 — Incolla testo AI-parsed**
Textarea dove l'utente incolla il testo copiato dall'app.
AI (Groq `llama-3.3-70b-versatile`) estrae i campi numerici e pre-compila il form.

Server Action: `parseWearableText(text: string)` → chiama Groq per estrarre hrv, rhr, recoveryScore, sleepMin, sleepScore, ctl, atl, tsb.

**Acceptance criteria:**
- [x] Form recovery ha sezione "Incolla testo dal tuo orologio"
- [x] AI estrae i valori e pre-popola i campi
- [x] Salva normalmente con `saveRecoveryLog`
- [x] `npx tsc --noEmit` → 0 errori
- [x] `npm run build` → successo

---

### CHECKPOINT CP-008 — Timer recuperi nell'Active Tracker
**Stato:** ✅ COMPLETATO (17 Marzo 2026)
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Completion Notes:**
- Implementato timer di recupero automatico in `ActiveTracker.tsx`.
- Aggiunti pulsanti per aggiustare il tempo (+30s / -15s) e skip.
- Feedback visivo (progress bar) e sonoro (beep Web Audio) al termine.

**Contesto:**
Mancava la logica inter-set per il recupero durante l'allenamento.

---

### CHECKPOINT CP-009 — Prisma Migration Baseline
**Stato:** IN ATTESA DI CLAUDE
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Contesto:**
Creare il file di migration iniziale da zero per avere una storia pulita dello schema. Lavoro di Claude, non Gemini.

---

### CHECKPOINT CP-010 — Stable tag backup
**Stato:** ✅ COMPLETATO (17 Marzo 2026)
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Completion Notes:**
- Creato tag `stable-2026-03-17` e pushato su origin.

---

### CHECKPOINT CP-011 — Review qualità Adaptive AI Coach
**Stato:** ✅ COMPLETATO (17 Marzo 2026)
**Data:** 17 Marzo 2026
**Risk tier:** MEDIUM

**Completion Notes:**
- Verificata la logica di costruzione del contesto.
- Implementata `summarizeUserContext` in `lib/ai/context.ts` per ridurre drasticamente il peso del prompt (token) e i costi API, pur mantenendo tutte le informazioni chiave per il coaching.
- Semplificato il system prompt in `app/api/chat/route.ts` per maggiore efficienza.

**Contesto:**
La vecchia implementazione passava oggetti JSON enormi e ridondanti ad ogni messaggio.

---

### CHECKPOINT CP-012 — Redesign pagina dettaglio sessione allenamento
**Stato:** IN ATTESA DI GEMINI
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Contesto:**
La pagina `/training/[id]` (dettaglio sessione) ha un aspetto molto piatto e datato. La sezione "Tensione Distrettuale" mostra bottoni 0/1/2/3 senza personalità visiva. La UI non usa il design system correttamente e fa una brutta impressione.

**File da modificare:**
- `app/(protected)/training/[id]/page.tsx`
- `app/(protected)/training/[id]/district-stress.tsx`
- `app/(protected)/training/[id]/exercise-list.tsx`

**Task:**

**1. Redesign layout generale (`page.tsx`)**
- Header compatto con badge colorato per tipo sessione (A=accent, B=accent2, C=positive, OUTDOOR=warning)
- Stats strip (Durata / RPE / TL) come pills colorate invece di testo piatto su sfondo grigio
- Layout mobile-first: esercizi a full width, district stress sotto (non side-by-side)

**2. Redesign District Stress (`district-stress.tsx`)**
- Sostituisci i bottoni numerici 0/1/2/3 con pill/chip visivamente rotondi
- 0 = sfondo trasparente + testo muted, 1 = verde tenue, 2 = giallo medio, 3 = rosso pieno con glow
- Nome distretto in italiano (es. QUAD→Quadricipiti, HAMSTRING→Ischiocrurali, GLUTE→Glutei, KNEE→Ginocchio, LOWER_BACK→Lombari, UPPER_BACK→Dorsali, SHOULDER→Spalle, CHEST→Petto, BICEP→Bicipiti, TRICEP→Tricipiti, CALF→Polpacci, CORE→Core)
- Layout 2 colonne su mobile, leggenda colorata in basso

**3. Esercizi (`exercise-list.tsx`)**
- Ogni card esercizio: bordo sinistro colorato per gruppo muscolare principale
- Nome esercizio in bold, set/RIR come pill compatta
- Icona trend (↑↓→) sempre visibile anche senza aprire il grafico

**Vincoli:**
- Usa SOLO CSS variables del design system (no colori hardcoded)
- NON toccare la logica server actions (solo UI)
- Testa su viewport mobile (375px)

**Acceptance criteria:**
- [ ] Layout mobile-first fluido
- [ ] District stress con nomi italiani e colori pill
- [ ] Badge tipo sessione colorato nell'header
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] `npm run build` → successo

---

### CHECKPOINT CP-013 — Redesign pagina Recovery
**Stato:** IN ATTESA DI GEMINI
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Contesto:**
La pagina Recovery ha form molto piatti, senza gerarchia visiva. I campi HRV/RHR/Sleep/Recovery Score sembrano un form HTML grezzo. La sezione "Tensione Muscolare" mostra solo outline senza dati visualizzati.

**File da modificare:**
- `app/(protected)/recovery/recovery-form.tsx`
- `app/(protected)/recovery/page.tsx`
- `app/(protected)/recovery/recovery-history.tsx`

**Task:**

**1. Redesign Recovery Form (`recovery-form.tsx`)**
- I 4 campi principali (Recovery Score, HRV, RHR, Sonno) come card a sé stante con icona colorata e valore digitato grande al centro
- Layout a grid 2x2 per i 4 campi principali (non form lineare)
- Recovery Score: mostra anche un ring circolare di anteprima mentre si digita (come la calorie ring nella Nutrition)
- Campi avanzati CTL/ATL/TSB collassabili con accordion ben stilizzato
- Tab "Manuale" / "Incolla testo" con pill switcher (sostituire l'attuale tab bar piatta)
- Bottone Salva prominente con glow accent

**2. Redesign History (`recovery-history.tsx`)**
- Mini sparkline SVG per mostrare trend HRV e Recovery Score degli ultimi 7 giorni
- Invece di lista testo, mostra grafico linea semplice

**Vincoli:**
- Usa CSS variables, niente hardcoded
- Non toccare le server actions (solo UI e visualizzazione)

**Acceptance criteria:**
- [ ] I 4 campi principali come grid card
- [ ] Tab switcher Manuale/AI pill-style
- [ ] Recovery Score ring preview
- [ ] History con mini sparkline
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] `npm run build` → successo

---

### CHECKPOINT CP-014 — Fix calorie ring bug Nutrition
**Stato:** IN ATTESA DI CLAUDE
**Data:** 17 Marzo 2026
**Risk tier:** MEDIUM

**Contesto:**
La pagina Nutrizione mostra `kcalActual = 0` anche quando i macro (proteinG, carbsG, fatG) hanno valori reali. Questo indica che il campo `kcalActual` del NutritionDay non viene aggiornato correttamente quando si aggiungono alimenti senza specificare le calorie (o quando vengono importati da template).

**Task (CLAUDE):**
1. Verificare la funzione `updateDayTotals` in `app/actions/nutrition.ts`
2. Se `fi.kcal` è null/0 ma `fi.proteinG/carbsG/fatG` hanno valori, calcolare le kcal stimate: `kcal = (protein * 4) + (carbs * 4) + (fat * 9)`
3. Aggiungere calcolo fallback automatico in `updateDayTotals`
4. Verificare che `addFoodItem` → `updateDayTotals` aggiorni correttamente tutti i campi

**Acceptance criteria:**
- [ ] CalorieRing mostra valore corretto anche se kcal non specificato manualmente
- [ ] `proteinG`, `carbsG`, `fatG` del NutritionDay coincidono con somma foodItems
- [ ] `npx tsc --noEmit` → 0 errori

---

### CHECKPOINT CP-014 — Fix calorie ring bug (COMPLETATO)
**Stato:** COMPLETATO
**Data:** 17 Marzo 2026
**Da:** CLAUDE
- Aggiunta formula fallback in `updateDayTotals`: se `fi.kcal` è 0/null usa `protein*4 + carbs*4 + fat*9`
- CalorieRing ora mostra valore corretto anche senza kcal esplicito

---

### CHECKPOINT CP-015 — Redesign Design System v5.0 (Visual 2026)
**Stato:** COMPLETATO
**Data:** 17 Marzo 2026
**Da:** CLAUDE
**Risk tier:** LOW (nessuna logica di business toccata)

**Contesto:**
L'utente ha richiesto un visual upgrade completo: "la grafica e i temi in generale sono brutti vecchi non da 2026".

**Cosa è stato fatto:**

**`app/globals.css` — Design System v5.0:**
- Nuovi token CSS: `--r-xs` (6px) → `--r-2xl` (36px) + `--r-full`. Durations: `--dur-fast/normal/slow/xslow`
- `.card` / `.card-elevated`: border-radius 20px, `inset 0 1px 0 rgba(255,255,255,0.06)` inner highlight
- `.card-interactive`: hover lift + border brighten + active press
- `.card-accent-border`: gradient border via CSS mask technique (accent glow)
- `.frosted`: floating panel per modal/tooltip (48px blur, `--r-xl`)
- `.btn-primary`: gradient `accent → mix(accent,accent2)`, letter-spacing, better shadow + glow on hover
- `.btn-ghost`: `--r-md` radius, `color-mix` hover bg, `--ease-expo-out` transition
- `.badge`: pillola con uppercase, `font-weight: 700`, border colorato con `color-mix`
- `.glass` / `.glass-sm` / `.glass-heavy`: inner highlight rafforzato (`rgba(255,255,255,0.09)`)
- `.input-field`: `--r-md` radius, inner inset shadow on focus
- Nuove keyframes: `blur-in`, `rise-up`, `pop-in`, `slide-right`, `glow-breathe`
- Nuove utilities: `.animate-blur-in`, `.animate-rise-up`, `.animate-pop-in`, `.animate-glow-breathe`
- Nuove utilities: `.surface-accent`, `.ring-accent/positive/negative`, `.num`, `.chip`, `.chip-active`
- Nuova utility: `.divider-label`, `.text-accent-gradient`, `.mesh-bg`, `.tap-target`, `.line-clamp-1/2/3`

**`app/(protected)/ClientLayout.tsx` — Navigation 2026:**
- `NavLink`: eliminato left-bar + square icon bg. Sostituito con pill bg (`color-mix accent 10%`) + accent border + dot indicator a destra
- `UserAvatar`: avatar con `inset` highlight, online dot verde, "Atleta · Pro" subtitle
- `SidebarContent`: logo più premium (14px radius, `inset 0 1px 0 rgba(255,255,255,0.22)`), `scrollbar-hide` su nav, help button con hover mouse events
- Mobile bottom nav: stile **iOS tab bar 2026** — pill bg dietro icona su active (`border-radius: 12px`), font-weight dinamico
- `MobileMoreSheet`: frosted glass (blur 48px), `border-radius: 28px 28px 0 0`, exit button rosso accent
- Header: `border-subtle` più sottile, `saturate(160%)` nel backdrop, `font-weight: 700` su page title

**Acceptance criteria:**
- [x] `npx tsc --noEmit --skipLibCheck` → 0 errori
- [x] Nessuna rottura di componenti esistenti (token backward-compatible)
- [x] Tutti i 9 temi supportano le nuove classi (uso `color-mix` e variabili relative)

---

## 🔒 REGOLE BACKUP (vigenti da 17 Mar 2026)

- Backup creato SOLO su dichiarazione esplicita di Giorgio ("versione stabile")
- Tag formato: `stable-YYYY-MM-DD_HH-mm`
- Massimo 3 tag `stable-*` attivi. Al 4°, eliminare il più vecchio (locale + remoto)
- **Backup attivi:** nessuno ancora — da creare al primo milestone stabile

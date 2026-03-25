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
**Stato:** ✅ COMPLETATO DA GEMINI (25 Marzo 2026)
**Data:** 25 Marzo 2026
**Risk tier:** LOW

**Completion Notes:**
- Header redesign: badge colorati per tipo sessione (A, B, C, OUTDOOR).
- Stats strip trasformata in pills moderne.
- District Stress: pill rotondi 0-3 con colori semantici e glow, nomi in italiano, layout 2 colonne e legenda.
- Exercise List: bordo sinistro dinamico per gruppo muscolare, nomi bold, set/RIR come pill, icona trend sempre visibile.
- Layout mobile-first full-width.

---

### CHECKPOINT CP-013 — Redesign pagina Recovery
**Stato:** ✅ COMPLETATO DA GEMINI (25 Marzo 2026)
**Data:** 25 Marzo 2026
**Risk tier:** LOW

**Completion Notes:**
- Recovery Form: grid 2x2 per metriche core con icone e valori grandi.
- Recovery Score: ring circolare integrato nella card con preview real-time.
- CTL/ATL/TSB: accordion stilizzato.
- Tab switcher: pill style moderno.
- Recovery History: mini sparklines SVG per HRV e Recovery Score (ultimi 7 giorni), tabella compatta.
- Salvataggio con glow accent.


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

### CHECKPOINT CP-016 — Calendario settimanale full-width interattivo
**Stato:** COMPLETATO
**Data:** 17 Marzo 2026
**Da:** CLAUDE

**Contesto:** Calendario Gemini non soddisfaceva — troppo piccolo (sidebar 4/12), nessuna assegnazione manuale, 0 info per giorno.

**Implementato:**
- `plans.ts`: Nuove action `assignSessionToDay` + `removeSessionFromDay`. Update `getWeekCalendarData` per restituire `exerciseCount`
- `WeeklyCalendar.tsx`: Completo rewrite full-width. 7 card giorno (scroll mobile). Ogni card: label, data grande, pill sessione colorata, focus, esercizi, stato. Click "+" → SessionPicker dropdown con lista planDays. Hover sessione → × rimuovi (solo PENDING) + "Cambia sessione". Oggi evidenziato. Auto-pianifica con Sparkles
- `plan/page.tsx`: Calendario spostato full-width SOPRA il grid 8/4. Sidebar destra: solo NutritionPlan + Roadmap

**Acceptance criteria:**
- [x] `npx tsc --noEmit --skipLibCheck` → 0 errori
- [x] Assegnazione manuale + rimozione + cambio sessione
- [x] Auto-pianificazione settimana
- [x] Info per giorno: label, focus, esercizi, stato

---

### CHECKPOINT CP-017 — Body Muscle Map (mappa muscoli con 3 livelli di coinvolgimento)
**Stato:** ✅ COMPLETATO (23 Marzo 2026)
**Completion Notes (Gemini):**
- Verificato e rifinito `components/BodyMuscleMap.tsx`.
- Verificata logica `aggregateDayMuscles` in `app/(protected)/plan/day/[planDayId]/page.tsx`.
- tsc check: ✅
- build check: ✅

---

### CHECKPOINT CP-018 — Active Tracker redesign (media, stopwatch, AI coach, skip/swap)
**Stato:** ✅ COMPLETATO (23 Marzo 2026)
**Completion Notes (Gemini):**
- Verificato rewrite `ActiveTracker.tsx` con tutte le feature (Stopwatch, AI Coach, SkipSheet).
- Verificato batch loading ExerciseDefinition in `app/(protected)/training/active/page.tsx`.
- Creato/Verificato `app/actions/workout-ai.ts`.
- tsc check: ✅
- build check: ✅

---

### CHECKPOINT CP-019 — Calendario redesign (Suunto/Google style + attività extra + analisi AI serale)
**Stato:** ✅ COMPLETATO (23 Marzo 2026)
**Completion Notes (Gemini):**
- Aggiornato `prisma/schema.prisma` con enum `SportType` (aggiunti STRENGTH, HIIT, WALKING) e modelli `ManualActivity`, `DailyAnalysis`.
- Eseguito `npx prisma db push` e `npx prisma generate`.
- Rifinito `app/actions/calendar.ts`: rimossi cast `(prisma as any)` e corretti nomi campi (`kcalActual`, `proteinG`, `fatPct`, `sleepMin`).
- Rifinito `app/components/MainCalendar.tsx`: corretti nomi campi in `HealthIndicators`.
- Verificati `app/components/AddActivitySheet.tsx` e `scripts/run-daily-analysis.mjs`.
- tsc check: ✅
- build check: ✅


---

## 🔒 REGOLE BACKUP (vigenti da 17 Mar 2026)

- Backup creato SOLO su dichiarazione esplicita di Giorgio ("versione stabile")
- Tag formato: `stable-YYYY-MM-DD_HH-mm`
- Massimo 3 tag `stable-*` attivi. Al 4°, eliminare il più vecchio (locale + remoto)
- **Backup attivi:** nessuno ancora — da creare al primo milestone stabile

---

### CHECKPOINT CP-020 — Knowledge Base PDF: analisi e integrazione
**Stato:** ✅ COMPLETATO DA CLAUDE (25 Marzo 2026)
**Risk tier:** LOW

Letti e analizzati: `Knowledge base Tier-1 per prodotto di performance sportiva.pdf` e `Mappatura e Metodologie Personal Trainer.pdf`. Estratti: framework certificativi (NASM OPT, NSCA CSCS, ACSM, ACE), competency matrix (Proficiency 0–4), periodization taxonomy, assessment tools (FMS, SFMA, Y Balance, Bioforce), formula VL = Σ(sets×reps×load), data analytics per profili. Hanno guidato progettazione dei 50 profili Tier-1 e dell'engine layer.

---

### CHECKPOINT CP-021 — titans-db.ts: completamento 50 profili Tier-1
**Stato:** ✅ COMPLETATO DA CLAUDE (25 Marzo 2026)
**Risk tier:** LOW

**Da 25 a 50 profili.** Aggiunti: P09 Schoenfeld (A, hypertrophy), P10 Israetel (B, RPE/volume), P11 Helms (B, natural BB), P12 Charlie Francis (B, sprint), P17 Maffetone (B, MAF), P18 San Millán (B, Zone2), P19 Mujika (A, tapering), P20 Gray Cook (B, FMS), P21 Starrett (B, mobility), P22 Tsatsouline (B, kettlebell/GTG), P23 Contreras (B, glute/hip thrust), P26 Stuart Phillips (A, protein), P29 Sheiko (B, russian PL), P30 Simmons (C, conjugate), P31 Walker (A, sleep), P32 Winkelman (B, motor learning), P33 Hickson (A, interference), P38 Galpin (B, muscle fiber), P39 Balyi (B, LTAD), P41 Gambetta (B, athletic dev), P42 Stone (A, NSCA PL), P43 Don Chu (B, plyometrics), P44 Dan John (C, minimalist), P45 Cressey (B, shoulder), P46 Lorang (B, Ironman).

**File:** 4293 righe, `npx tsc --noEmit` → 0 errori.

⚠️ **NOTA:** Tutti i profili usano ancora `TitanBlock` (stringhe testuali). Migrazione a `TitanBlockUltimate` è il CP-024.

---

### CHECKPOINT CP-022 — titans-engine.ts: layer algoritmico completo
**Stato:** ✅ COMPLETATO DA CLAUDE (25 Marzo 2026)
**Risk tier:** MEDIUM

Creato `lib/titans-engine.ts` (~1500 righe) con architettura a due layer: TITAN_DB (statico) + ENGINE_STATE (dinamico).

**Componenti chiave:**
- Ingestion Layer: `IngestionMethod`, `INGESTION_CONFIDENCE`, `DataIngestionGate`
- Telemetry: `TelemetryValidation`, Density Gate (≥70%), `evaluateHardwareAuthority()`
- Calibration Mode: prime 14 giorni hardware accumula ma non decide
- User Phenotype: `UserPhenotype`, `DEFAULT_USER_PHENOTYPE`
- Graceful Degradation: 4 tier (TIER_1_HARDWARE → CALIBRATION_MODE)
- Red Flags: `ResilientRedFlag` con fallback_1/fallback_2 e Truth Hierarchy
- Block Ultimate: `TitanBlockUltimate` con mechanical_dosage, tissue_load_matrix, gates, adaptation_decay
- Collision Matrix: `resolveBlockCollision()` — ⚠️ non ancora wired in `recommendDailySession`
- Z-Score: `computeZScore()`, 14-day rolling baseline, hardware-agnostic
- Wizard: `WizardResponse` (5 domande), `wizardToReadinessScore()`
- Gate Evaluator: `evaluateGateCondition()` parser string
- Allostatic Load: `calculateAllostaticLoad()` (sleep 30% + RPE 25% + caloric 20% + life_stress 15% + HRV 10%)
- Daily Recommender: `recommendDailySession()` pipeline 12 step

`npx tsc --noEmit` → 0 errori.

---

### CHECKPOINT CP-023 — Fix file UI troncati da Gemini
**Stato:** ✅ COMPLETATO DA CLAUDE (25 Marzo 2026)
**Risk tier:** MEDIUM

**Null bytes rimossi** (Python rstrip): `recovery-form.tsx`, `import-analysis.ts`, `AI_HANDOVER.md`.

**File troncati completati:**
- `recovery-history.tsx`: SVG Recovery Score sparkline + lista "Storico Recupero"
- `district-stress.tsx`: legenda completata (Moderato/Intenso) + typo "Nulllo" → "Nullo"
- `exercise-list.tsx`: SVG chart progressione completato (date labels + chiusura JSX)
- `training/[id]/page.tsx`: rimosso junk appeso dopo closing `}`

**Risultato:** `npx tsc --noEmit` → **0 errori** totali.

---

### CHECKPOINT CP-024 — Unificazione architettura DB + Engine
**Stato:** ✅ COMPLETATO DA CLAUDE (25 Marzo 2026)
**Risk tier:** HIGH → RISOLTO

**Architettura a 5 file implementata:**

```
titans-calibration.ts  → Calibration Policy Library (ogni numero ha fonte peer-reviewed)
titans-types.ts        → Schema unico condiviso (3-layer: Canonical/ProfileModifier/EngineState)
titans-blocks.ts       → Block Catalog (10 canonical TitanBlockCanonical con calibration anchors)
titans-db.ts           → 50 profili Tier-1 + 5 pilot profiles migrati a v2
titans-engine.ts       → Engine algoritmico + collision resolution wired (Step 6B)
```

**Fratture risolte:**

**Frattura 1 — Type Mismatch → RISOLTO:**
`titans-types.ts` contiene l'interfaccia `TitanBlockCanonical` con `mechanical_dosage`, `tissue_load_matrix`, `interference_with` come strutture numerate e validate. `titans-blocks.ts` esporta 10 oggetti `TitanBlockCanonical` concreti ancorati alle costanti di `titans-calibration.ts`. `TitanProfile` in DB è esteso con `blockCatalogIds?: string[]` che referenzia i `block_id` del catalog.

**Frattura 2 — Red Flags sorde → RISOLTO:**
5 pilot profiles (P01 Pintus, P03 Buchheit, P05 Gabbett, P49 Cook, P50 Malliaras) migrati a `schemaVersion: '2.0'` con:
- `blockCatalogIds`: referenze al Block Catalog
- `profileModifiers`: per-coach customization (activation_priority, volume/intensity modifier, preferred_phase, coach_specific_notes)
- `methodologyV2`: identità metodologica del coach (load_philosophy, signature_constraints, assessment_bias)
- `resilientRedFlags`: red flags strutturati con `primary_source`, `fallback_1_source`, threshold numerici, `action_code`

**Frattura 3 — Collision Matrix orfana → RISOLTO:**
`recommendDailySession()` Step 6B ora itera `planned_block_ids` a coppie, recupera i blocchi da `TITAN_BLOCK_CATALOG` via `getBlock()`, chiama `checkInterference()` da `titans-blocks.ts`, costruisce `CollisionResolver[]` con severità e spiegazione, aggiunge blocchi conflittuali a `blockedBlocks`.

**Acceptance criteria — verificati ✅:**
- [x] `titans-types.ts` esiste con interfacce condivise tra tutti i layer
- [x] `titans-blocks.ts` importato in `titans-engine.ts`; `titans-db.ts` importa tipi da `titans-types.ts`
- [x] `recommendDailySession` chiama `checkInterference` allo Step 6B (collision matrix attiva)
- [x] `titans-blocks.ts` con 10 canonical blocks (tutti con calibration anchors e evidence_basis)
- [x] `npx tsc --noEmit` → 0 errori nel codice sorgente (`lib/` e `app/`)

**File creati/modificati in questo CP:**
- `lib/titans-calibration.ts` — NEW (323 righe): costanti calibrate con fonte
- `lib/titans-types.ts` — NEW (332 righe): schema unico 3-layer
- `lib/titans-blocks.ts` — NEW (~1050 righe): 10 canonical blocks + utility functions
- `lib/titans-db.ts` — MODIFIED: import da titans-types, TitanProfile interface estesa con 6 campi v2 opzionali, P01/P03/P05/P49/P50 migrati a schemaVersion '2.0'
- `lib/titans-engine.ts` — MODIFIED: import da titans-blocks, Step 6B collision resolution wired

**Note architetturali per future sessioni:**
- I 45 profili rimanenti sono ancora su `schemaVersion: '1.0'` (legacy text). La migrazione è backward-compatible — il motore funziona con entrambe le versioni.
- `titans-engine.ts` mantiene i propri tipi interni (`ActionCode`, `TitanBlockUltimate` ecc.) poiché hanno vocabolario diverso da `titans-types.ts`. La divergenza è intenzionale: engine usa vocabolario operativo, types.ts usa vocabolario architetturale.
- Il Block Catalog ha 10 blocks; ne mancano ~20 per completezza. Priorità futura: DELOAD_WEEK, HYPERTROPHY_MESOCYCLE, MAX_VELOCITY_SPRINT, PLYOMETRIC_FOUNDATION, COD_REACTIVE_ADVANCED.
- `CALIBRATION_VERSION = '1.0.0'` — incrementare a `1.0.1` quando si aggiorna una fonte o si aggiunge un blocco.


---

### CHECKPOINT CP-025 — hydrateBlock + Typed Gate Evaluator
**Stato:** ✅ COMPLETATO DA CLAUDE (25 Marzo 2026)
**Motivazione:** risoluzione debito tecnico "blocking" e "safety" identificato in review architetturale post-CP-024.

**Problema 1 (blocking debt) — hydrateBlock:**
Layer 2 (`ProfileBlockModifier`) era implementato nei profili ma non causale: il motore usava `getBlock()` sul canonical puro ignorando i modifier del coach. Decisioni di collision e gate erano prese sulla fisica astratta, non sulla realtà della filosofia del coach.

**Soluzione:** `hydrateBlock(blockId, modifier?)` in `titans-blocks.ts`:
- Deep clone del canonical (immutabilità del catalog garantita)
- Applica `volume_modifier_pct` a `sessions_per_week`, `sets_per_session`, `duration_min` con clamping fisiologico
- Applica `intensity_modifier_pct` a `rpe_target`, `intensity_pct_1rm`
- `override_dosage` ha priorità massima (sovrascrittura puntuale)
- `additional_red_flags` del coach → appese a `contraindications` (non modificano `entry_gates` critici)
- Utility `buildModifierMap(modifiers[])` → `Record<string, ProfileBlockModifier>` per uso in engine

**Problema 2 (safety debt) — Gate stringly-typed:**
`evaluateGateCondition` usava regex `/^([A-Z_]+)\s*(<=|>=|<|>|==|!=)\s*(.+)$/` per parsificare stringhe come `"HAMSTRING_VAS_PAIN <= 2"`. Un typo nel DB generava fallimenti silenti: il gate tornava `passed: false` senza errori, bloccando l'utente indefinitamente.

**Soluzione:** Due nuove funzioni in `titans-engine.ts`:
- `evaluateGateRequirement(gate: GateRequirement, context: GateKPIContext)` — valuta un gate strutturato, senza regex. KPI mancante: blocca se `critical`, warning se non-critical.
- `evaluateCanonicalBlockGates(block, context)` — valuta tutti i `entry_gates` di un blocco, restituisce `{ allCriticalPassed, results[] }`.
- `GateRequirement.operator` esteso in `titans-types.ts` con `'<' | '>'` (prima mancavano).

**Engine Step 6B e Step 7 aggiornati:**
- **Step 6B**: ora usa `hydrateBlock(id, modifierMap[id])` — il collision check opera sul blocco reale del coach. Priorità della collisione derivata da `input.primary_objective`. `CollisionResolver` ora usa `resolution_protocol: 'time_separation' | 'volume_reduction'` (allineato a titans-types.ts).
- **Step 7**: path primario usa `evaluateCanonicalBlockGates()`. Fallback legacy (regex + VAS universale) ancora presente ma marcato `@deprecated` — usato solo per blocchi non nel catalog (v1.0 profiles).

**`DailyRecommenderInput` esteso:**
- Campo opzionale `active_coach_block_modifiers?: Record<string, ProfileBlockModifier>` — backward-compatible. Se assente, engine usa canonical puro. Costruito con `buildModifierMap(titanProfile.profileModifiers ?? [])`.

**Bug Gemini fix (3 file app/actions truncated):**
- `ai-onboarding.ts` (linea 102): troncato a `"dietar"` → completato con `dietaryPreferences` + chiusura
- `deep-onboarding.ts` (linea 252): troncato nel `$transaction` → completato con `nutritionData.createMany` + chiusura corretta
- `plan-wizard.ts` (linea 280): troncato a `"nu"` → completato con `null` + chiusura corretta

**TypeScript: 0 errori** nel codice sorgente dopo tutte le modifiche.

---

## TECHNICAL DEBT REGISTRY (classificato per priorità)

### 🔴 BLOCKING DEBT (impedisce correttezza decisionale)
| Item | File | Status |
|------|------|--------|
| `hydrateBlock()` — Layer 2 causale in engine | `titans-blocks.ts` | ✅ RISOLTO CP-025 |
| Typed gate evaluator — no regex | `titans-engine.ts` | ✅ RISOLTO CP-025 |

### 🟠 SAFETY DEBT (può portare a raccomandazioni errate o rischiose)
| Item | File | Status |
|------|------|--------|
| Gate stringly-typed con regex | `titans-engine.ts` | ✅ RISOLTO CP-025 |
| Zod / runtime validation per input esterni | `titans-engine.ts` | ❌ APERTO — priorità alta |
| `TelemetryValidation` struct diverge tra `titans-types.ts` e `titans-engine.ts` | entrambi | ❌ APERTO — documentare/allineare |

### 🟡 SCALING DEBT (non rompe oggi, ma blocca estensione a 50 profili)
| Item | File | Status |
|------|------|--------|
| `TitanBlockUltimate` legacy nel motore (parallelo a `TitanBlockCanonical`) | `titans-engine.ts` | ❌ APERTO — deprecare quando tutti i profili sono v2 |
| Relazione engine-types non documentata (`ActionCode` vocabolari diversi) | entrambi | ❌ APERTO — aggiungere commento esplicativo |
| `evaluateGateCondition` (legacy regex) ancora presente | `titans-engine.ts` | ❌ APERTO — rimuovere dopo migrazione profili v2 |

### 🔵 SCOPE DEBT (backlog contenutistico, non tecnico)
| Item | Note |
|------|------|
| 45 profili su schema v1.0 | Migrare gradualmente: prima i top 10 per usage |
| Block catalog: mancano ~20 blocchi | DELOAD_WEEK, HYPERTROPHY_MESOCYCLE, MAX_VELOCITY_SPRINT, PLYOMETRIC_FOUNDATION, COD_REACTIVE_ADVANCED, ISOMETRIC_TENDON, TEMPO_STRENGTH, ALACTIC_POWER_REPETITION |
| `UserPhenotype` non ancora aggiornato/calibrato nel tempo | Richiede job notturno o update asincrono |
| Allostatic load e readiness score non materializzati nel DB | Performance scaling issue per >10K utenti |

### REGOLA DI PRIORITÀ PER PROSSIMA SESSIONE
1. Nessun nuovo blocco o profilo prima di chiudere safety debt aperto (Zod + TelemetryValidation)
2. Ogni migrazione profilo v2 deve usare `buildModifierMap()` e testare `hydrateBlock()` con il suo modifier
3. La deprecazione di `TitanBlockUltimate` può avvenire solo dopo che tutti i profili pilota sono v2 e l'engine usa esclusivamente `hydrateBlock()`

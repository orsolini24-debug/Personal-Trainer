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
**Stato:** IN ATTESA DI GEMINI
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Contesto:**
Il modello `Mesocycle` ha un campo `kpi: Json` che può contenere obiettivi numerici (es. `{ squat: { target: 130, unit: "kg", current: 115 }, run5k: { target: "23:00", current: "24:30" } }`). E il modello `AthleteGoal` esiste già con campi `targetValue`, `currentValue`, `unit`. Non c'è nessuna UI che mostra questi KPI con barre di avanzamento.

**Task:**
Creare `app/components/KPITracker.tsx`:
- Legge `AthleteGoal` dell'utente attivi (isActive: true)
- Per ogni goal: barra orizzontale con percentuale completamento, target, valore attuale, unità
- Colore barra: verde se > 80%, giallo se > 50%, rosso se < 50%
- Pulsante "Aggiorna valore" → input inline per aggiornare `currentValue`

Integrare in:
1. `app/(protected)/plan/[id]/page.tsx` — sezione KPI del mesociclo
2. `app/(protected)/dashboard/page.tsx` — piccolo widget in fondo al bento grid

Creare `app/actions/athlete-goals.ts` (probabilmente esiste già — verificare) server action `updateGoalProgress(goalId, newValue)`.

**Acceptance criteria:**
- [ ] KPI visibili con barra di avanzamento nella pagina Piano
- [ ] Aggiornamento valore funzionante
- [ ] Widget compatto nel dashboard
- [ ] `npx tsc --noEmit` → 0 errori

---

### CHECKPOINT CP-006 — Alert nutrizione intelligenti
**Stato:** IN ATTESA DI GEMINI
**Data:** 17 Marzo 2026
**Risk tier:** LOW

**Contesto:**
L'app sa quante proteine/calorie hai consumato e quante ne mancano. Ma non avvisa. La spec prevede alert come "Ti mancano 40g di proteine — aggiungi una fonte proteica a cena".

**Task:**
In `app/(protected)/nutrition/nutrition-client.tsx`:
- Calcola i gap rispetto ai target (proteine mancanti, calorie mancanti/eccedenti)
- Mostra un banner/alert contestuale se:
  - Proteine < 80% del target E sono le 19:00 o più → "Aggiungi proteina a cena"
  - Calorie > 110% del target → "Hai superato il target calorico di X kcal"
  - È un giorno di allenamento E carboidrati < 70% → "Carboidrati bassi per sessione di allenamento"
- Gli alert sono dismissibili e non appaiono più per 2 ore (localStorage)
- Stile: banner colorato in cima alla pagina nutrizione, con suggerimento specifico

**Acceptance criteria:**
- [ ] Alert proteina visibile la sera se proteine insufficienti
- [ ] Alert calorie visibile se si supera il target
- [ ] Alert carboidrati per giorni di allenamento
- [ ] Dismissibile con localStorage
- [ ] `npx tsc --noEmit` → 0 errori

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

## 🔒 REGOLE BACKUP (vigenti da 17 Mar 2026)

- Backup creato SOLO su dichiarazione esplicita di Giorgio ("versione stabile")
- Tag formato: `stable-YYYY-MM-DD_HH-mm`
- Massimo 3 tag `stable-*` attivi. Al 4°, eliminare il più vecchio (locale + remoto)
- **Backup attivi:** nessuno ancora — da creare al primo milestone stabile

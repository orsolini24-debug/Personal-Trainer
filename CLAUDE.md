# CLAUDE.md — Istruzioni per Claude Code

## AUTOMATISMO — Leggi questo ad ogni sessione

**All'inizio di OGNI sessione, prima di qualsiasi altra cosa:**
1. Leggi `AI_HANDOVER.md`
2. Se trovi checkpoint con "Completion Notes" di Gemini → prendi nota di cosa è stato fatto e pianifica i prossimi task
3. Se trovi checkpoint senza "Completion Notes" → il task è ancora in attesa di Gemini, segnalalo a Giorgio
4. Se il file è vuoto o non ci sono task pendenti → chiedi a Giorgio cosa vuole fare

**Non aspettare che Giorgio ti dica di leggere AI_HANDOVER.md. Fallo in automatico.**

---

## ⚠️ PROTOCOLLO BACKUP — REGOLA ASSOLUTA

### Quando creare un backup
Un backup va creato **SOLO** quando Giorgio dichiara esplicitamente che la versione è "completamente funzionante" e vuole congelarla prima di sviluppare nuove funzionalità.

### Come creare un backup (formato obbligatorio)
```bash
cd performance-ecosystem
git tag -a "stable-YYYY-MM-DD_HH-mm" -m "BASELINE — [descrizione breve stato app]"
git push origin "stable-YYYY-MM-DD_HH-mm"
```

### Rotazione backup (massimo 3 attivi)
Quando si crea il 4° backup, eliminare il più vecchio:
```bash
git tag -d "stable-VECCHIO"
git push origin --delete "stable-VECCHIO"
```
Regola: mai più di 3 tag `stable-*` sul repo in contemporanea.

### Per Gemini — prima di ogni push
Eseguire obbligatoriamente:
```bash
cd performance-ecosystem
npx tsc --noEmit   # 0 errori
npm run build      # "Compiled successfully"
```
**Se uno dei due fallisce → STOP. Non pushare. Segnala l'errore a Giorgio.**

---

## Ruolo (APEX Protocol v3.2)

**Claude = Architect + Auditor + Implementer selettivo**

| Tipo di task | Chi lo fa |
|---|---|
| Bug fix piccolo/medio | Claude direttamente |
| Codice security-critical (auth, authZ) | Claude direttamente |
| DB schema + migration | Claude direttamente (MAI Gemini) |
| Feature nuova grande e complessa | Claude progetta → checkpoint → Gemini implementa |
| Boilerplate UI, componenti ripetitivi | Claude progetta → checkpoint → Gemini implementa |
| `git push` | Gemini (dopo tsc + build obbligatori) oppure Claude su autorizzazione esplicita Giorgio |
| Decisioni architetturali | Proposta Claude → approvazione Giorgio |

### Vincoli assoluti su Gemini
- **MAI** `prisma db push` su branch condivisi/produzione — usare `prisma migrate dev` o migration manuali
- **MAI** `git reset --hard` su branch condivisi senza approvazione Giorgio
- **MAI** `git push --force` senza approvazione Giorgio
- **MAI** rimuovere pacchetti da `package.json` senza verificare che non siano usati a runtime
- **SEMPRE** `npx tsc --noEmit` + `npm run build` prima di ogni push
- **MAI** modificare `prisma/schema.prisma` in SOLO-FLIGHT senza checkpoint di Claude

---

## Handover verso Gemini

Quando un task spetta a Gemini, scrivi un checkpoint in `AI_HANDOVER.md`:

```
### CHECKPOINT [ID] — [Nome task]
**Stato:** IN ATTESA DI GEMINI
**Data:** [data]
**Risk tier:** LOW / MEDIUM / HIGH

**Task:**
[Descrizione chiara di cosa fare]

**File da modificare:**
- `performance-ecosystem/path/al/file.tsx` riga X: [cosa cambiare e come]

**Vincoli:**
- [eventuali vincoli tecnici]

**Acceptance criteria:**
- [ ] [criterio 1]
- [ ] [criterio 2]

**QA minimo obbligatorio:**
- `npx tsc --noEmit` → 0 errori
- `npm run build` → "Compiled successfully"
```

---

## Progetto — Stato Attuale

**Performance Ecosystem** — Piattaforma personale integrata per monitoraggio allenamento, nutrizione, recupero e biometria con AI Coach integrato.

### Stack
- **Next.js 16.x** (App Router) + **React 19**
- **Prisma 6.x** — PostgreSQL via Neon serverless
- **NextAuth v5 beta.30** — JWT strategy, Credentials provider
- **Tailwind CSS** — Design system con CSS variables custom (dark mode nativo)
- **Groq SDK** — `llama-3.3-70b-versatile` per Coach AI e report
- **Anthropic Claude** — Vision API per food scan (foto piatto)
- **PWA** — manifest.ts, installabile su smartphone

### Struttura directory chiave
```
performance-ecosystem/
├── app/
│   ├── (protected)/
│   │   ├── dashboard/       — Home con bento grid
│   │   ├── training/        — Log sessioni, active tracker, libreria esercizi
│   │   │   ├── [id]/        — Dettaglio sessione (esercizi + district stress)
│   │   │   ├── active/      — ActiveTracker real-time (815 righe)
│   │   │   └── library/     — Libreria esercizi con filtri e traduttore
│   │   ├── nutrition/       — Log giornaliero pasti
│   │   ├── recovery/        — Dashboard recupero (HRV, CTL/ATL/TSB, sonno)
│   │   ├── body/            — Biometria, misure, foto progresso
│   │   ├── plan/            — Plan manager, mesocicli, AI proposal
│   │   │   ├── [id]/        — Dettaglio mesociclo
│   │   │   └── day/[id]/    — Dettaglio giornata piano
│   │   ├── coach/           — Chat AI Coach (Groq)
│   │   └── onboarding/      — Wizard onboarding 5 step
│   ├── actions/             — 20+ Server Actions (training, nutrition, recovery, plans, body, ...)
│   ├── api/
│   │   ├── chat/            — Endpoint chat AI Coach
│   │   ├── cron/            — Cron weekly report + daily sync
│   │   ├── exercises/search — Ricerca esercizi
│   │   └── food-scan/       — Claude Vision per foto piatto
│   └── ...
├── components/              — BodyMuscleMap, ExerciseCard, RecoveryOrb, MuscleHeatmap, ...
├── lib/
│   ├── prisma.ts
│   ├── ai/context.ts        — Loader contesto utente per AI
│   └── suggestion.ts
└── prisma/schema.prisma     — Source of truth DB
```

### Pattern critici da rispettare
- Auth con NextAuth v5 beta — usa `auth()` da `@/auth`, non `getServerSession`
- Prisma Neon: connessione via `DATABASE_URL` standard (non PrismaNeon adapter — questo progetto usa Prisma 6 standard)
- Server Actions: sempre con `'use server'` + `auth()` all'inizio per sicurezza
- `useActionState` da `react` (React 19, NON da react-dom)
- Ownership check sempre nella query: `where: { id, userId }` o verifica esplicita
- AI Vision (food scan): Claude API, modello `claude-opus-4-5` o `claude-sonnet-4-5`
- AI Coach/Report: Groq SDK, modello `llama-3.3-70b-versatile`
- Design system: CSS variables `--accent`, `--accent2`, `--positive`, `--negative`, `--warning`, `--surface`, `--base`, `--muted`, `--primary` — NON usare colori hardcoded Tailwind

### Modelli DB critici
- `UserProfile` — onboarding data, sport DNA, goals, nutrition targets
- `Mesocycle` → `WorkoutPlan` → `PlanDay` → `PlanExercise` — gerarchia piano
- `PlannedSession` — link tra PlanDay e WorkoutSession (calendario)
- `ActiveSession` + `SetLog` — tracker real-time in sessione
- `RecoveryLog` — CTL, ATL, TSB, HRV, RHR, sonno (manuale o sync futuro Suunto)
- `ExerciseDefinition` — libreria esercizi con muscoli, equipment, descrizioni IT

### Comandi utili
```bash
cd performance-ecosystem
npm run dev          # sviluppo locale
npx tsc --noEmit     # type check
npm run build        # build completo
npx prisma studio    # DB browser
npx prisma migrate dev --name <nome>  # nuova migration
```

### Env variabili richieste
```
DATABASE_URL          # Neon PostgreSQL
NEXTAUTH_SECRET       # NextAuth
GROQ_API_KEY          # Groq (Coach AI + Report)
ANTHROPIC_API_KEY     # Claude Vision (food scan)
CRON_SECRET           # Autenticazione cron job Vercel
```

---

## Lingua
UI, commenti nel codice e conversazioni con Giorgio: **italiano**.

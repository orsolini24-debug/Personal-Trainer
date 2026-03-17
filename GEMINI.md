# GEMINI.md — Performance Ecosystem (Fitness)

> Questo file viene caricato automaticamente da Gemini CLI all'avvio della sessione.
> Leggi tutto prima di qualsiasi operazione.

## Il tuo ruolo in questo progetto

Sei l'**Implementer** del team APEX Protocol. Claude è l'Architect. Giorgio è il Product Owner.

**Prima di fare qualsiasi cosa:** leggi `AI_HANDOVER.md` e identifica il/i checkpoint `IN ATTESA DI GEMINI` assegnati a te.

---

## Progetto

**Performance Ecosystem** — Piattaforma PWA personale per:
- Tracking allenamenti (sessioni, esercizi, set, progressione)
- Nutrizione (log pasti, food scan AI, target macro)
- Recupero (HRV, CTL/ATL/TSB, sonno, recovery score)
- Biometria (peso, misure corporee, foto progresso)
- Coach AI (chat Groq, report settimanali automatici)
- Piano di allenamento (mesocicli, WorkoutPlan, calendario)

**Deploy**: Vercel (production)
**URL locale**: `npm run dev` (porta 3000)

---

## Stack tecnico

- **Next.js 16.x** App Router + **React 19**
- **TypeScript** strict
- **Prisma 6.x** — PostgreSQL via Neon serverless
- **NextAuth v5 beta.30** — JWT strategy, Credentials provider
- **Tailwind CSS** + CSS Variables custom (design system)
- **Groq SDK** — `llama-3.3-70b-versatile` (Coach AI, report, wearable parser)
- **Anthropic Claude** — Vision API (food scan foto piatto)
- **PWA** — manifest.ts, service worker, installabile su smartphone

---

## Regole obbligatorie

### Auth pattern (SEMPRE)
```typescript
'use server'
import { auth } from '@/auth'  // NON getServerSession
export async function action() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorizzato')
  // query sempre con: where: { id, userId: session.user.id }
}
```

### CSS Variables (NON colori hardcoded)
```
--accent, --accent2, --positive, --negative, --warning
--fg-primary, --fg-muted, --fg-subtle
--bg-base, --bg-surface, --bg-elevated
--border-default, --border-subtle, --glow-accent
```

### useActionState
```typescript
import { useActionState } from 'react'  // React 19, NON da react-dom
```

### Prisma
- MAI `prisma db push`
- SEMPRE `prisma migrate dev --name nome-migration`
- Connessione: `import { prisma } from '@/lib/prisma'`

---

## QA obbligatorio prima di ogni push

```bash
cd /path/to/performance-ecosystem
npx tsc --noEmit    # DEVE dare 0 errori
npm run build       # DEVE dare "Compiled successfully"
```

**Se uno fallisce → STOP. Non pushare. Segnala a Giorgio.**

---

## Vincoli assoluti

- ❌ MAI `prisma db push`
- ❌ MAI `git reset --hard` su branch condivisi
- ❌ MAI `git push --force` senza approvazione Giorgio
- ❌ MAI modificare `prisma/schema.prisma` senza checkpoint Claude
- ❌ MAI rimuovere pacchetti senza verifica usage
- ❌ MAI pushare con tsc/build che falliscono

---

## Lingua

UI, commenti e risposte: **italiano**

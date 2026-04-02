# 💎 GEMINI_ANALISI — Performance Ecosystem (Audit 2026)

Documento di analisi tecnica e strategica redatto dalla task force Gemini. Questo file serve come base per le future implementazioni e ottimizzazioni del protocollo APEX.

---

## 🏗️ AREA 1: TRAINING & PROGRESSION
*Focus: Logica di allenamento, Active Tracker e progressione sovraccarico.*

### 1.1 Stato Attuale
- L'Active Tracker gestisce sessioni in tempo reale con salvataggio set-per-set.
- Lo Smart Import unifica Allenamento e Dieta in un Mesociclo `FULL`.
- Il sistema di rotazione asincrona (Wizard) gestisce correttamente il mismatch giorni/sessioni.

### 1.2 Punti di debolezza (Bugs/Gaps)
- **Timer de-sync:** Se si cambia esercizio rapidamente, il timer di recupero può sovrapporsi o mostrare dati dell'esercizio precedente.
- **Visual Feedback:** Mancano indicatori di "Personal Best" (PR) durante l'inserimento dei carichi nel tracker.
- **Exercise Library:** I video demo sono assenti, costringendo l'utente a cercare esternamente.

### 1.3 Proposta di Miglioramento: Auto-Regolazione Carico (RPE-Driven)
- **Cosa cambia:** Aggiunta di una logica di calcolo post-sessione che analizza il delta tra RPE target e RPE effettivo.
- **Perché:** Per implementare il Progressive Overload scientifico senza intervento manuale del coach.
- **File toccati:** `app/actions/training.ts`, `app/(protected)/training/active/ActiveTracker.tsx`.

---

## 🍏 AREA 2: NUTRITION & AI VISION
*Focus: Logging alimentare, precisione macro e automazione.*

### 2.1 Stato Attuale
- Importazione da foto (Claude Vision) funzionante.
- Gestione template pasti per inserimento rapido (1-tap).
- Target dinamici basati sul piano attivo.

### 2.2 Punti di debolezza
- **Precisione:** L'AI Vision a volte allucina le quantità (grammi).
- **Mancanza Barcode:** Mancanza di uno scanner per prodotti confezionati (standard 2026).
- **Sync Totali:** In alcuni casi il reset giornaliero delle calorie non è immediato nella Dashboard.

### 2.3 Proposta: Barcode Scanner + Smart Shopping List
- **Cosa cambia:** Integrazione `html5-qrcode` nel client e API `OpenFoodFacts` nel server.
- **Perché:** Aumenta drasticamente la velocità di logging per l'utente "on-the-go".
- **File toccati:** `app/(protected)/nutrition/page.tsx`, nuova action `app/actions/import-barcode.ts`.

---

## 🔋 AREA 3: RECOVERY & BIOMETRICS
*Focus: Integrazione wearable, HRV, sonno e stress muscolare.*

### 3.1 Stato Attuale
- Dashboard con RecoveryOrb (visualizzazione estetica dello stato di forma).
- Log manuale dei dati Suunto/Garmin.
- Calcolo base di ACWR e TSB.

### 3.2 Punti di debolezza
- **Data Entry:** Troppo attrito nel dover copiare i dati dall'app orologio all'app PT.
- **Stress Distrettuale:** La heatmap muscolare è statica e non riflette il volume di lavoro reale degli ultimi giorni.

### 3.3 Proposta: Heatmap Muscolare Dinamica 3D
- **Cosa cambia:** Algoritmo che calcola il "fatigue score" per ogni gruppo muscolare basandosi sui Set Totali x RPE degli ultimi 3-5 giorni.
- **Perché:** Permette all'atleta di capire visivamente se sta sovra-allenando un distretto (es. "Spalle in rosso, meglio riposare").
- **File toccati:** `components/MuscleHeatmap.tsx`, `lib/ai/context.ts`.

---

## 🤖 AREA 4: AI COACH & INFRASTRUCTURE
*Focus: Groq, report settimanali e performance PWA.*

### 4.1 Stato Attuale
- Chat interattiva con contesto utente completo.
- Cron-job per report settimanali automatici.
- NextAuth v5 e Prisma 6 (stack all'avanguardia).

### 4.2 Punti di debolezza
- **Engagement:** L'utente riceve poca interazione proattiva dall'AI (solo se apre la chat).
- **Offline:** Senza internet l'app smette di funzionare (critico in palestre interrate).

### 4.3 Proposta: Notifiche Push Proattive + Voice Notes
- **Cosa cambia:** Configurazione Web Push API e trascrizione Whisper per note vocali.
- **Perché:** Le note vocali permettono di loggare sensazioni "a caldo" senza digitare, fornendo dati qualitativi preziosi all'AI Coach.
- **File toccati:** `public/sw.js`, `app/api/chat/route.ts`.

---

## 🚀 PRIORITÀ DI IMPLEMENTAZIONE (Roadmap)

1.  **[P1] Auto-Regolazione Carico:** Impatto massimo sulla performance. (Rischio: 2/5)
2.  **[P1] Barcode Scanner:** Riduzione attrito logging. (Rischio: 1/5)
3.  **[P2] Heatmap Dinamica:** Differenziatore estetico e tecnico. (Rischio: 3/5)
4.  **[P3] Notifiche Push:** Miglioramento ritenzione. (Rischio: 4/5)

---
*Analisi prodotta dal sistema APEX Protocol / Gemini Engine.*

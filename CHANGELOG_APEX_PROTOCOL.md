# 💎 CHANGELOG — APEX Protocol (Evolution Phase)

## 🕒 Sessione: 24 Marzo 2026 (Last 2 Hours)
**Obiettivo**: Trasformazione del sistema da app commerciale a Protocollo di Elite Performance multisport.

---

### 1. 🏗️ INFRASTRUTTURA & UI MULTI-UTENTE
- **Layout Dinamico**: Sostituito il nome fisso "Giorgio" con `{session.user.name}` in tutto il `ClientLayout`.
- **Avatar Engine**: Implementata generazione automatica dell'iniziale atleta basata sul nome della sessione.
- **Clean Registration**: Rimozione dei placeholder hardcoded nel form di registrazione.
- **Z-Index Overhaul**: Forzato `z-[9999]` sul `PlanScheduleWizard` per garantire visibilità sopra ogni bento-grid o componente elevato.

### 2. 🧠 REI: IL CERVELLO DI APEX (AI Identity)
Riprogrammata l'IA Coach con un "Consilium" di Titani della performance:
- **Antonio Pintus**: Logica ACWR (Acute:Chronic Workload Ratio) per prevenzione infortuni e gestione carichi metabolici.
- **Carlo Vittori**: Protocollo di resistenza neurale e qualità del gesto (metodo Mennea).
- **Firas Zahabi**: Filosofia del "Volume Consistente" (Consistency over Intensity) per la longevità atletica.
- **Bob Bowman**: Periodizzazione a blocchi bioenergetici per atleti multisport.
- **Tom Brady**: Integrazione della "Pliability" e salute dei tessuti connettivi.
- **Novak Djokovic**: Nutrizione anti-infiammatoria e gestione HRV.
- **Mike Tyson**: Potenza rotazionale e core torque.
- **Kobe Bryant**: Mamba Mentality (focus sulla precisione ossessiva).
- **Eliud Kipchoge**: Regola 80/20 per la costruzione della base mitocondriale.
- **Francielle Mattos**: Ingegneria estetica femminile (focalizzazione catena posteriore).
- **Dr. Stacy Sims**: Fisiologia femminile specifica (ciclo mestruale e termoregolazione).

### 3. 🧪 APEX SYNTHESIZER (Generatore di Piani)
Il motore di generazione piani è passato da "Template-Based" a **"Synthesis-Based"**:
- **Audit Psicofisico**: Il Wizard ora interroga l'atleta su **Grit** (resilienza mentale), **Capacity** (tolleranza fisica) e **Time Sync** (logica temporale).
- **Logica di Fusione**: L'IA non propone più piani standard, ma dichiara la sintesi tecnica (es. "Sintesi: Yates + Brady" per chi ha poco tempo ma alta determinazione).
- **Integrazione Biometrica**: Peso reale, grasso corporeo e infortuni storici vengono iniettati nel prompt prima della generazione.

### 4. 📅 SMART IMPORT 2.0
- **Flessibilità Semantica**: L'importatore ora mappa automaticamente i giorni della settimana (Lunedì, Martedì...) in etichette di sessione (A, B, C), evitando errori di formato.
- **Auto-Scheduling**: Implementata la rotazione asincrona che adatta i piani (es. 5 sessioni) su disponibilità diverse (es. 3 giorni) senza rompere la sequenza.

### 5. 💬 ROBUSTEZZA CHAT (REI Dialog)
- **Timeout Management**: Inserito limite di 15s per il feedback dell'utente (fine del bug rotellina infinita).
- **Context Truncation**: Limitata la memoria agli ultimi 10 messaggi per evitare crash di memoria su Groq.
- **Streaming Safe**: Migliorata la gestione dei flussi dati per risposte parziali.

---
*Documento redatto dal sistema APEX Protocol / Gemini Engine.*

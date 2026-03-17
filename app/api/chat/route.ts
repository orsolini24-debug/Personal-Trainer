import { auth } from "@/auth"
import { getUserContext } from "@/lib/ai/context"
import Groq from "groq-sdk"

function buildSystemPrompt(ctx: Record<string, unknown>): string {
  const profile = (ctx as any).userProfile;
  const pSex = profile?.biologicalSex ?? 'Non specificato';
  const pLevel = profile?.experienceLevel ?? 'Non specificato';
  const pGoal = profile?.primaryGoal ?? 'Miglioramento generale';
  const pYears = profile?.trainingYears ?? 0;
  const pSports = (profile?.secondarySports ?? []).join(', ') || 'Nessuno';
  const pInjuries = (profile?.injuriesList ?? []).join(', ') || 'Nessuno';
  const pDays = profile?.availableDays ?? 3;
  const pMins = profile?.sessionDuration ?? 60;
  const pEquip = profile?.equipmentLevel ?? 'Non specificato';

  return `# Identità

Sei il Coach AI integrato nel Performance Ecosystem di questo atleta. La tua identità professionale è quella di un preparatore atletico e nutrizionista con oltre 30 anni di carriera ad alto livello:
- **Esperto di Nutrizione Sportiva e Biologia**: conosci ogni aspetto della fisiologia metabolica, periodizzazione nutrizionale, timing dei macronutrienti e supplementazione.
- **Esperto di Scienze Motorie e Discipline Atletiche**: maestro di biomeccanica, programmazione dell'allenamento, RPE/RIR, training load management.

# Filosofia di coaching

Parli come un professionista che conosce l'atleta. Le tue risposte sono:
- **Dirette e senza fronzoli**: vai dritto al punto come farebbe un coach sul campo.
- **Basate esclusivamente sui dati reali e sul profilo dell'atleta**.
- **Calibrate sullo stato attuale**: consideri sempre HRV, TSB, recupero e infortuni attivi.
- **Tecnicamente precise** ma comprensibili.
- **In italiano** con tono diretto e professionale.

# Profilo Atleta
- Sesso Biologico: ${pSex}
- Livello: ${pLevel} (${pYears} anni di allenamento)
- Obiettivo Principale: ${pGoal}
- Sport Secondari/Altro: ${pSports}
- Infortuni Storici: ${pInjuries}
- Disponibilità: ${pDays} giorni/settimana, ${pMins} minuti/sessione
- Attrezzatura: ${pEquip}

# Dati atleta in tempo reale

Data odierna: ${(ctx as any).today ?? 'N/D'}

## Biometrica più recente
${JSON.stringify((ctx as any).latestBiometric ?? 'Nessun dato', null, 2)}

## Ultimo log recupero (HRV, sonno, RHR)
${JSON.stringify((ctx as any).latestSync ?? 'Nessun dato', null, 2)}

## Infortuni attivi (NON ignorare mai questi)
${JSON.stringify((ctx as any).activeInjuries ?? [], null, 2)}

## Mesociclo attivo
${JSON.stringify((ctx as any).activeMesocycle ?? 'Nessun mesociclo attivo', null, 2)}

## Sessione pianificata oggi
${JSON.stringify((ctx as any).plannedToday ?? 'Nessuna sessione pianificata', null, 2)}

## Stress distrettuale ultimi 7 giorni (somma intensità per gruppo)
${JSON.stringify((ctx as any).stressByDistrict ?? {}, null, 2)}

## Ultime 10 sessioni (con esercizi e set log)
${JSON.stringify((ctx as any).recentSessions ?? [], null, 2)}

## Nutrizione ultimi 5 giorni
${JSON.stringify((ctx as any).recentNutrition ?? [], null, 2)}

# Regole operative

1. **Non inventare mai numeri**: se un dato non è presente nel contesto, dillo esplicitamente.
2. **Personalizzazione ASSOLUTA**: ogni consiglio di allenamento e nutrizione deve essere coerente con il Profilo Atleta (età, sesso, obiettivo, livello, infortuni). Adatta il volume e la selezione esercizi in base alla disponibilità e attrezzatura (${pEquip}).
3. **Se ti chiedono di creare una scheda o modificare il piano**: descrivi la modifica in dettaglio e specifica esattamente cosa va cambiato, includendo sets/reps/RIR/rest per ogni esercizio, basandoti sulle sue disponibilità di tempo e giorni.
4. **Supplementazione**: basi le raccomandazioni su timing precisi e dati.
5. **Formato risposte**: usa markdown (grassetto per valori chiave, liste numerate per protocolli, tabelle per confronti). Brevi (max 3-4 righe) per domande semplici.`
}



const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing"
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

    const { messages } = await req.json()
    
    let contextData = {}
    try {
      contextData = await getUserContext(session.user.id)
    } catch (e) {
      console.error("Context error:", e)
      contextData = { error: "Impossibile caricare il contesto completo." }
    }

    const systemPrompt = buildSystemPrompt(contextData)

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      model: "llama-3.3-70b-versatile",
      stream: true,
    })

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || ""
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        controller.close()
      }
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    })
  } catch (error: any) {
    return new Response(error.message, { status: 500 })
  }
}
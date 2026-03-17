import { auth } from "@/auth"
import { getUserContext, summarizeUserContext } from "@/lib/ai/context"
import Groq from "groq-sdk"

function buildSystemPrompt(ctx: any): string {
  const sCtx = summarizeUserContext(ctx) as any;
  const p = sCtx?.profile;

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
- Livello: ${p?.level ?? 'N/D'} (${p?.years ?? 0} anni training)
- Obiettivo: ${p?.goal ?? 'Performance'}
- Infortuni: ${p?.injuries?.join(', ') || 'Nessuno'}
- Disponibilità: ${p?.availableDays ?? 3}gg/week, ${p?.sessionDuration ?? 60}min/session
- Equip: ${p?.equipment ?? 'N/D'}

# Dati Real-time (JSON compresso)

Data: ${sCtx?.today}

## Biometrica & Recupero
${JSON.stringify({ bio: sCtx?.biometrics, recovery: sCtx?.recovery }, null, 2)}

## Mesociclo & Oggi
${JSON.stringify({ mesocycle: sCtx?.mesocycle, plannedToday: sCtx?.plannedToday }, null, 2)}

## Storico Recente (5 Sessioni / 5 Giorni Nutrizione)
${JSON.stringify({ recentSessions: sCtx?.recentSessionsSummary, recentNutrition: sCtx?.recentNutritionSummary }, null, 2)}

## Stress Distrettuale (Ultimi 7gg)
${JSON.stringify(sCtx?.stressByDistrict ?? {}, null, 2)}

# Regole operative

1. **Precisione**: non inventare mai numeri. Se un dato manca, dillo.
2. **Personalizzazione**: ogni consiglio deve essere coerente con il profilo e lo stato di recupero dell'atleta.
3. **Piani**: se ti chiedono modifiche, specifica sets/reps/RIR/rest per ogni esercizio.
4. **Markdown**: usa grassetto per valori chiave e liste per protocolli.
5. **Brevità**: max 3-4 righe per domande semplici.`
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
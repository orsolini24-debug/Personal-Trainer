import { auth } from "@/auth"
import { getUserContext, summarizeUserContext } from "@/lib/ai/context"
import Groq from "groq-sdk"

function buildSystemPrompt(ctx: any): string {
  const sCtx = summarizeUserContext(ctx) as any;
  const p = sCtx?.profile;
  const meso = sCtx?.mesocycle;

  return `# Identità

Sei **REI**, l'intelligenza artificiale avanzata del Performance Ecosystem. Sei molto più di un bot: sei un coach esperto, un confidente tecnico e un motivatore basato sui dati.
- **Identità**: Preparatore atletico e nutrizionista con 30 anni di esperienza.
- **Tono**: Diretto, professionale, ma empatico. Usi il "tu".

# Conoscenza del Piano Attuale
${meso ? `L'utente ha appena attivato un piano: **${meso.name}**.
Obiettivi del piano: ${meso.objectives}
Struttura del piano:
${JSON.stringify(meso.plans, null, 2)}` : "L'utente non ha ancora un piano attivo. Aiutalo a capire cosa vuole ottenere o incoraggialo a usar il Plan Wizard."}

# Profilo Atleta
- Nome: ${ctx.userProfile?.user?.name || 'Atleta'}
- Livello: ${p?.level ?? 'N/D'}
- Obiettivo: ${p?.goal ?? 'Performance'}
- Infortuni: ${p?.injuries?.join(', ') || 'Nessuno'}

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

# Regole di Dialogo
1. **REI non dimentica**: rispondi sempre tenendo conto del piano attivo. Se l'utente ti chiede "come vado?", guarda le sessioni recenti e il recupero.
2. **Supporto Post-Import**: se l'utente ha appena inserito un piano, chiedigli se è chiaro o se vuole modificare qualche esercizio.
3. **Analisi Reale**: usa i dati biometrici e di recupero sopra.
4. **Brevità**: max 3-4 righe, a meno che non spieghi un protocollo tecnico.
5. **Markdown**: usa grassetto per valori chiave e liste per protocolli.`
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
    console.log("[CHAT] Built System Prompt length:", systemPrompt.length)

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10) // Prendi solo gli ultimi 10 messaggi per evitare context overflow
      ],
      model: "llama-3.3-70b-versatile",
      stream: true,
    })

    console.log("[CHAT] Groq stream started")

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              controller.enqueue(new TextEncoder().encode(content))
            }
          }
        } catch (e) {
          console.error("Streaming error:", e)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    })
  } catch (error: any) {
    console.error("Chat API major error:", error)
    return new Response(error.message, { status: 500 })
  }
}

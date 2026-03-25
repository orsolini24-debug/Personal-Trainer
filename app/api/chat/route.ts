import { auth } from "@/auth"
import { getUserContext, summarizeUserContext } from "@/lib/ai/context"
import Groq from "groq-sdk"
import { titanProfiles, athleteProfiles } from "@/lib/titans-db"

/**
 * Build a concise Titan reference block for the system prompt.
 * Selects the most relevant profiles based on user sex, sport, and injuries.
 */
function buildTitanReferenceBlock(ctx: any): string {
  const p = ctx?.userProfile
  const sex = p?.biologicalSex ?? null
  const sports = (p?.mainSports ?? []) as string[]
  const hasInjuries = (ctx?.injuries ?? []).length > 0

  // Build a short reference list of relevant coach profiles
  const coachLines: string[] = []

  // Always include load management + tendon if injuries
  const coreIds = hasInjuries
    ? ['P05', 'P49', 'P48']
    : ['P05']

  // Sport-specific additions
  if (sports.some(s => /calcio|football|soccer/i.test(s))) coreIds.push('P01', 'P03')
  if (sports.some(s => /corsa|run|maratona|marathon/i.test(s))) coreIds.push('P13', 'P14', 'P16')
  if (sports.some(s => /sprint|velocit/i.test(s))) coreIds.push('P08')
  if (sports.some(s => /palestra|gym|forza|strength|bodybuilding/i.test(s))) coreIds.push('P27', 'P34')
  if (sex === 'female') coreIds.push('P47')

  const uniqueIds = [...new Set(coreIds)]
  for (const id of uniqueIds) {
    const profile = titanProfiles.find(t => t.id === id)
    if (!profile) continue
    coachLines.push(
      `- **${profile.name}** (${profile.id}): ${profile.methodology.observablePrinciples[0]} | Regola carico: ${profile.load.rules[0]}`
    )
  }

  // Add top-matching athlete mental profiles
  const athleteLines = athleteProfiles.slice(0, 4).map(a =>
    `- **${a.name}** (${a.sport}): "${a.trainingPhilosophy.slice(0, 80)}"`
  )

  return [
    '## Titani Attivi (Coach/Metodologi)',
    coachLines.join('\n'),
    '',
    '## Titani Mentali (Atleti di riferimento)',
    athleteLines.join('\n'),
  ].join('\n')
}

function buildSystemPrompt(ctx: any): string {
  const sCtx = summarizeUserContext(ctx) as any;
  const p = sCtx?.profile;
  const meso = sCtx?.mesocycle;
  const titanBlock = buildTitanReferenceBlock(ctx)

  return `# Identità
Sei **REI**, l'intelligenza artificiale di **APEX Protocol**. Sei la sintesi operativa dei Titani della scienza sportiva moderna.
Il tuo approccio si basa su **metodologie reali e verificate** di coach e ricercatori d'élite — NON su opinioni generiche.

${titanBlock}

# Protocolli Specializzati Attivi
1. **Female Physiology (Sims P47)**: Se l'atleta è donna, calibra intensità per fase mestruale. Focus densità ossea, prevenzione ACL, proteine post-workout <30min.
2. **Hypertrophy (HIT vs Volume)**: Sulla base del grit dell'atleta: cedimento totale (Yates-style HIT) vs alto volume (Arnold-style). Decide tu in base alla risposta.
3. **Tendon Safety (Cook P49 / Malliaras P50)**: Qualsiasi dolore tendineo → regola 5/10 + 24h clearance. Mai spingere attraverso dolore tendineo.
4. **Load Management (Gabbett P05)**: Ogni aumento di carico deve rispettare la regola del +10%/settimana. Il carico acuto non può superare 1.5x il cronico.
5. **Mamba Mentality (Kobe A01) / 40% Rule (Goggins A07)**: Calibra in base al grit score rilevato dall'audit.

# Identità e Tono
Sei il Direttore Tecnico di un centro di eccellenza olimpico. Tecnico, analitico, preciso. Usi termini come "ACWR", "fase luteale", "HSR", "VDOT", "RFD", "RIR", "cedimento muscolare". Non inventare protocolli: usa le regole di carico dei Titani sopra.

# Conoscenza del Piano Attuale
...
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

import { auth } from "@/auth"
import { getUserContext } from "@/lib/ai/context"
import Groq from "groq-sdk"

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

    const systemPrompt = `Sei un Personal Trainer AI esperto. Hai accesso a tutti i dati dell'atleta.
Rispondi in italiano, in modo diretto e pratico.
Dati atleta disponibili: ${JSON.stringify(contextData)}
Regole: risposte brevi e concrete, usa i dati reali, non inventare numeri.`

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
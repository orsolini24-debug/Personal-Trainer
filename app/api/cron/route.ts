import { prisma } from "@/lib/prisma"
import { getUserContext } from "@/lib/ai/context"
import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing"
})

export async function GET(request: Request) {
  // Verifichiamo un token segreto per il cron job per sicurezza
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    for (const user of users) {
      const context = await getUserContext(user.id);
      
      const prompt = `Sei un AI Coach sportivo. Scrivi un report settimanale di 3 paragrafi per l'atleta analizzando il seguente contesto:
      ${JSON.stringify(context)}
      Includi:
      1. Riepilogo Allenamenti e Carico (TL)
      2. Feedback sul Recupero e Nutrizione
      3. Focus per la prossima settimana`

      const completion = await groq.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "llama-3.3-70b-versatile",
      })

      const content = completion.choices[0]?.message?.content || "Nessun report generato."

      await prisma.aIReport.create({
        data: {
          userId: user.id,
          type: 'WEEKLY',
          date: new Date(),
          content: content
        }
      })
    }

    return NextResponse.json({ success: true, message: "Weekly reports generated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
"use server"

import { auth } from "@/auth"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing"
})

export async function extractTextFromImage(base64Image: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Estrai tutto il testo leggibile da questa immagine di un piano di allenamento. Mantieni la struttura di giorni ed esercizi. Ritorna solo il testo estratto." },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      model: "llama-3.2-11b-vision-preview",
    })

    return { success: true, text: response.choices[0]?.message?.content || "" }
  } catch (error: any) {
    console.error("Vision extraction error:", error)
    return { success: false, error: error.message }
  }
}

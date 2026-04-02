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
            { type: "text", text: "Estrai tutto il testo leggibile da questa immagine. Può trattarsi di un piano di allenamento (esercizi, serie, rep) o di un piano alimentare (pasti, alimenti, grammi, calorie). Mantieni la struttura originale. Ritorna solo il testo estratto." },
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
    return { success: false, error: error.message }
  }
}

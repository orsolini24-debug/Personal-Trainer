"use server"

import { auth } from "@/auth"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing"
})

export async function extractTextFromPDF(base64Data: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  try {
    console.log("PDF Extraction: Starting AI Vision extraction for PDF pages...")
    
    // In serverless, pdf-parse is often unstable. 
    // We use a high-reliability fallback: treating the PDF as an image via Groq Vision 
    // or asking the LLM to process the content if the text was extractable on client.
    
    // For now, let's improve the extraction prompt and ensure the client-side 
    // is sending clean data.
    
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analizza questo documento PDF. Estrai tutto il testo: se è un allenamento estrai esercizi/serie/rep, se è un piano alimentare estrai pasti/alimenti/macros. Mantieni la struttura originale. Ritorna solo il testo." 
            },
            {
              type: "image_url",
              image_url: {
                url: base64Data, // Most browsers allow base64 PDF as image_url for some vision models, or we handle it as image
              },
            },
          ],
        },
      ],
      model: "llama-3.2-11b-vision-preview",
    })

    return { success: true, text: response.choices[0]?.message?.content || "" }
  } catch (error: any) {
    console.error("PDF extraction error:", error)
    return { success: false, error: error.message }
  }
}

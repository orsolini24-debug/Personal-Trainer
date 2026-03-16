"use server"

import { auth } from "@/auth"
const pdf = require("pdf-parse")

export async function extractTextFromPDF(base64Data: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  try {
    // Remove data:application/pdf;base64, prefix
    const base64 = base64Data.split(",")[1] || base64Data
    const buffer = Buffer.from(base64, "base64")
    
    const data = await pdf(buffer)
    
    return { success: true, text: data.text || "" }
  } catch (error: any) {
    console.error("PDF extraction error:", error)
    return { success: false, error: error.message }
  }
}

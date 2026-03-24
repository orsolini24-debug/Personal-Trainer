import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/food-vision
 * Body: { image: string (base64), mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }
 *
 * Usa Google Gemini 2.0 Flash — GRATUITO (1500 req/giorno, 15 RPM, nessuna carta).
 * Ottieni la chiave gratis su https://aistudio.google.com/app/apikey
 */

const PROMPT = `Sei un nutrizionista esperto. Analizza questa foto di cibo e rispondi SOLO con un oggetto JSON valido, senza markdown, senza testo aggiuntivo.

Schema richiesto:
{"name":"nome del cibo in italiano (specifico)","qty":<grammi interi stimati>,"kcal":<kcal intere totali>,"p":<proteine g float>,"c":<carboidrati g float>,"f":<grassi g float>}

Regole:
- Valori per la QUANTITÀ TOTALE nella foto, non per 100g
- Se ci sono più alimenti, descrivi il piatto completo e somma i macro
- Usa tabelle nutrizionali INRAN/USDA standard
- Se non è cibo: {"name":"","qty":0,"kcal":0,"p":0,"c":0,"f":0}
- Solo JSON, niente altro`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY non configurata. Ottienila gratis su aistudio.google.com' },
      { status: 500 }
    )
  }

  let body: { image?: string; mimeType?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }) }

  const { image, mimeType = 'image/jpeg' } = body
  if (!image) return NextResponse.json({ error: 'Immagine mancante' }, { status: 400 })

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: image } },
              { text: PROMPT },
            ],
          }],
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.1,   // bassa temperatura → JSON più stabile
          },
        }),
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) {
      const err = await res.text()
      console.error('[food-vision] Gemini error:', res.status, err)
      return NextResponse.json({ error: `Errore AI: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    const match = text.match(/\{[\s\S]*?\}/)
    if (!match) {
      console.error('[food-vision] no JSON in response:', text)
      return NextResponse.json({ error: 'Risposta AI non valida' }, { status: 502 })
    }

    const food = JSON.parse(match[0])
    return NextResponse.json({ food })

  } catch (err) {
    console.error('[food-vision] exception:', err)
    return NextResponse.json({ error: 'Errore di rete o timeout' }, { status: 500 })
  }
}

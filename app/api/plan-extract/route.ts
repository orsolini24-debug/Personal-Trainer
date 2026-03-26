import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? 'missing' })

// ─────────────────────────────────────────────────────────────────────────────
// Simple PDF text extractor (no external deps) — covers most non-encrypted PDFs
// Reads BT...ET text blocks and TJ/Tj operators from the PDF stream
// ─────────────────────────────────────────────────────────────────────────────
function extractTextFromPDF(buffer: Buffer): string {
  const raw = buffer.toString('latin1')
  const parts: string[] = []

  // Match BT...ET blocks
  const btEtRe = /BT([\s\S]*?)ET/g
  let m: RegExpExecArray | null
  while ((m = btEtRe.exec(raw)) !== null) {
    const block = m[1]
    // Extract strings in parentheses followed by Tj or TJ
    const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|TJ)?/g
    let s: RegExpExecArray | null
    while ((s = strRe.exec(block)) !== null) {
      const txt = s[1]
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, '')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
        .trim()
      if (txt.length > 1) parts.push(txt)
    }
  }

  // Also try raw string extraction outside BT/ET (fallback)
  if (parts.length < 5) {
    const fallbackRe = /\(([A-Za-z0-9 ,.;:\-\/'àèéìòù]{4,})\)/g
    while ((m = fallbackRe.exec(raw)) !== null) {
      parts.push(m[1].trim())
    }
  }

  return parts.join(' ').replace(/\s{2,}/g, ' ').trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/plan-extract
// Body: multipart/form-data with field "file"
// Returns: { success: true, description: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Nessun file ricevuto' }, { status: 400 })
    }

    const name = file.name.toLowerCase()
    const mime = file.type

    let rawText = ''

    // ── Image: use Groq vision ───────────────────────────────────────────────
    if (
      mime.startsWith('image/') ||
      name.endsWith('.jpg') || name.endsWith('.jpeg') ||
      name.endsWith('.png') || name.endsWith('.webp')
    ) {
      const bytes = await file.arrayBuffer()
      const b64 = Buffer.from(bytes).toString('base64')
      const imgMime = mime || 'image/jpeg'

      const vision = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${imgMime};base64,${b64}` },
              },
              {
                type: 'text',
                text: 'Trascrivi fedelmente tutto il testo visibile in questa immagine. Sembra un piano di allenamento. Includi tutti gli esercizi, serie, ripetizioni, giorni e qualsiasi altra informazione presente.',
              },
            ],
          },
        ],
        max_tokens: 2000,
      })
      rawText = vision.choices[0]?.message?.content ?? ''
    }
    // ── PDF: extract text from binary ────────────────────────────────────────
    else if (name.endsWith('.pdf')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      rawText = extractTextFromPDF(buffer)
      if (rawText.length < 40) {
        // PDF is encrypted / image-only — inform AI
        rawText = `[PDF: ${file.name} — contenuto non estraibile automaticamente. L'utente ha fornito un piano in formato PDF.]`
      }
    }
    // ── Plain text / markdown ────────────────────────────────────────────────
    else {
      rawText = await file.text()
    }

    // ── Ask Groq to parse and summarise the plan ────────────────────────────
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Sei un coach di fitness esperto. Analizza il documento fornito e crea un riassunto strutturato del piano di allenamento in italiano. Sii preciso e conciso.',
        },
        {
          role: 'user',
          content: `Analizza questo piano di allenamento estratto dal documento "${file.name}" e crea un riassunto strutturato:

${rawText.substring(0, 4000)}

Restituisci un testo strutturato (massimo 300 parole) che includa:
- Tipo/struttura del piano (es: Push/Pull/Legs, Upper/Lower, Full Body, ecc.)
- Frequenza settimanale
- Esercizi principali per ogni giornata (se presenti)
- Obiettivi principali
- Eventuali note su carichi, intensità, riposo

Se il testo è illeggibile o troppo scarso, descrivi genericamente che si tratta di un piano fornito dall'utente.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    const description =
      completion.choices[0]?.message?.content ??
      `Piano caricato da ${file.name}. Documento ricevuto ma contenuto non completamente interpretabile.`

    return NextResponse.json({ success: true, description })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    console.error('[plan-extract]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

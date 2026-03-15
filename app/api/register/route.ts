import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email già registrata" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { email, password: hashed, name },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

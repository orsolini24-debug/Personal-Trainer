import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Enhanced validation
    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "La password deve essere di almeno 8 caratteri" }, { status: 400 })
    }

    // Password complexity check
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    if (!hasNumber || !hasSpecial) {
      return NextResponse.json({ error: "La password deve contenere almeno un numero e un carattere speciale" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Small delay to prevent timing attacks/enumeration
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.json({ error: "Email già registrata" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { 
        email, 
        password: hashed, 
        name,
        onboardingCompleted: false // Ensure explicit default
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("REGISTER ERROR:", err)
    return NextResponse.json({ error: err?.message ?? "Errore del server" }, { status: 500 })
  }
}

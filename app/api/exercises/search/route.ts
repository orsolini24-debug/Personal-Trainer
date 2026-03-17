import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const exercises = await prisma.exerciseDefinition.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { nameIt: { contains: q, mode: 'insensitive' } },
          { nameAlt: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 8,
      select: {
        id: true,
        name: true,
        nameIt: true,
        nameAlt: true,
        primaryMuscles: true,
        equipment: true
      }
    })

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Error searching exercises:', error)
    return NextResponse.json({ error: 'Failed to search exercises' }, { status: 500 })
  }
}

import { prisma } from "@/lib/prisma"

export async function getUserContext(userId: string) {
  const [
    userProfile,
    recentSessions,
    recentNutrition,
    latestSync,
    activeInjuries,
    latestBiometric,
    activeMesocycle,
    plannedToday,
    districtStressWeek,
  ] = await Promise.all([
    // Profilo utente
    prisma.userProfile.findUnique({
      where: { userId }
    }),
    // Ultime 10 sessioni con esercizi e set
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        exercises: {
          include: { setLogs: { where: { isWarmup: false }, orderBy: { setNumber: 'asc' } } },
        },
        districtStress: true,
      },
    }),
    // Ultimi 5 giorni nutrizione
    prisma.nutritionDay.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { meals: { include: { foodItems: true } } },
    }),
    // Ultimo log recupero
    prisma.recoveryLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    }),
    // Infortuni non risolti
    prisma.injury.findMany({
      where: { userId, status: { not: 'RESOLVED' } },
      orderBy: { createdAt: 'desc' },
    }),
    // Ultima biometrica
    prisma.biometricLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    }),
    // Mesociclo attivo con piano completo
    prisma.mesocycle.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        workoutPlans: {
          include: {
            planDays: {
              include: { planExercises: { orderBy: { orderIndex: 'asc' } } },
            },
          },
        },
      },
    }),
    // Sessione pianificata oggi
    prisma.plannedSession.findFirst({
      where: {
        userId,
        scheduledDate: (() => { const d = new Date(); d.setUTCHours(0,0,0,0); return d })(),
      },
      include: {
        planDay: { include: { planExercises: { orderBy: { orderIndex: 'asc' } } } },
      },
    }),
    // Stress distrettuale ultimi 7 giorni
    prisma.districtStress.findMany({
      where: {
        session: {
          userId,
          date: { gte: new Date(Date.now() - 7 * 86400000) },
        },
      },
      include: { session: { select: { date: true, type: true } } },
    }),
  ])

  // Aggrega stress per distretto
  const stressByDistrict: Record<string, number> = {}
  for (const ds of districtStressWeek) {
    stressByDistrict[ds.district] = (stressByDistrict[ds.district] ?? 0) + ds.intensity
  }

  return {
    userProfile,
    recentSessions,
    recentNutrition,
    latestSync,
    activeInjuries,
    latestBiometric,
    activeMesocycle,
    plannedToday,
    stressByDistrict,
    today: new Date().toISOString(),
  }
}


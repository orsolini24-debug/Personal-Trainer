import { prisma } from "@/lib/prisma"

// Raccoglie tutto il contesto utente per l'AI Coach
// Chiamato prima di ogni richiesta alla chat AI
export async function getUserContext(userId: string) {
  const [recentSessions, recentNutrition, latestSync, activeInjuries, latestBiometric] =
    await Promise.all([
      // Ultime 7 sessioni
      prisma.workoutSession.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 7,
        include: { exercises: true, districtStress: true },
      }),
      // Ultimi 3 giorni nutrizione
      prisma.nutritionDay.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 3,
        include: { meals: { include: { foodItems: true } } },
      }),
      // Ultimo sync Suunto
      prisma.suuntoSync.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      // Infortuni attivi
      prisma.injury.findMany({
        where: { userId, status: { not: "RESOLVED" } },
      }),
      // Ultima biometrica
      prisma.biometricLog.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      }),
    ])

  return {
    recentSessions,
    recentNutrition,
    latestSync,
    activeInjuries,
    latestBiometric,
  }
}

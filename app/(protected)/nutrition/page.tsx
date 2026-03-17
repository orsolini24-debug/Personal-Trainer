import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getOrCreateNutritionDay } from "@/app/actions/nutrition"
import NutritionClient from "./nutrition-client"

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams
  const dateParam = params.date || new Date().toISOString().split('T')[0]
  const date = new Date(dateParam)

  const result = await getOrCreateNutritionDay(date)
  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="card px-6 py-5 flex items-center gap-3 text-sm"
          style={{ color: 'var(--negative)' }}
        >
          <span className="text-base">⚠</span>
          Errore caricamento dati: {result.error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-28 animate-page">
      <NutritionClient initialDay={result.data} currentDate={dateParam} />
    </div>
  )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getOrCreateNutritionDay } from "@/app/actions/nutrition"
import NutritionClient from "./nutrition-client"

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const dateParam = searchParams.date || new Date().toISOString().split('T')[0]
  const date = new Date(dateParam)
  
  const result = await getOrCreateNutritionDay(date)
  if (!result.success || !result.data) {
    return <div>Errore caricamento dati: {result.error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Nutrition Log</h1>
      <NutritionClient initialDay={result.data} currentDate={dateParam} />
    </div>
  )
}
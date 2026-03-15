"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addFoodItem, deleteFoodItem } from "@/app/actions/nutrition"
import { MealType } from "@prisma/client"
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"

export default function NutritionClient({ initialDay, currentDate }: { initialDay: any, currentDate: string }) {
  const router = useRouter()
  const [date, setDate] = useState(currentDate)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    router.push(`/nutrition?date=${e.target.value}`)
  }

  const kcalActual = initialDay.kcalActual || 0
  const kcalTarget = initialDay.kcalTarget || 2500
  const pct = Math.min(100, Math.round((kcalActual / kcalTarget) * 100))
  const colorClass = pct > 110 ? 'bg-red-500' : (pct > 90 ? 'bg-green-500' : 'bg-yellow-500')

  return (
    <div className="space-y-8">
      {/* Date Selector */}
      <div>
        <input 
          type="date" 
          value={date} 
          onChange={handleDateChange}
          className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
        />
      </div>

      {/* Macros Progress */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1 font-medium">
            <span>Calorie</span>
            <span>{kcalActual} / {kcalTarget} kcal</span>
          </div>
          <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }}></div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between mb-1"><span>Pro</span><span>{Math.round(initialDay.proteinG || 0)}g</span></div>
            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (initialDay.proteinG || 0) / 150 * 100)}%` }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-1"><span>Carbo</span><span>{Math.round(initialDay.carbsG || 0)}g</span></div>
            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (initialDay.carbsG || 0) / 300 * 100)}%` }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-1"><span>Grassi</span><span>{Math.round(initialDay.fatG || 0)}g</span></div>
            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (initialDay.fatG || 0) / 80 * 100)}%` }}></div></div>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        {initialDay.meals.map((meal: any) => (
          <MealSection key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  )
}

function MealSection({ meal }: { meal: any }) {
  const [isOpen, setIsOpen] = useState(true)

  const mealNames: Record<string, string> = {
    [MealType.BREAKFAST]: "Colazione",
    [MealType.LUNCH]: "Pranzo",
    [MealType.PRE_WORKOUT]: "Pre-workout",
    [MealType.POST_WORKOUT]: "Post-workout",
    [MealType.DINNER]: "Cena",
    [MealType.SNACK]: "Spuntino"
  }

  const mealTotal = meal.foodItems.reduce((acc: number, item: any) => acc + (item.kcal || 0), 0)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2 font-medium">
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          {mealNames[meal.type] || meal.type}
        </div>
        <span className="text-sm font-semibold">{Math.round(mealTotal)} kcal</span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4">
          <ul className="space-y-2">
            {meal.foodItems.map((item: any) => (
              <li key={item.id} className="flex justify-between items-center text-sm p-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div>
                  <div className="font-medium">{item.name} {item.quantityG ? `(${item.quantityG}g)` : ''}</div>
                  <div className="text-xs text-zinc-500">P:{item.proteinG||0} C:{item.carbsG||0} G:{item.fatG||0}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{item.kcal||0} kcal</span>
                  <button onClick={() => deleteFoodItem(item.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          <AddFoodForm mealId={meal.id} />
        </div>
      )}
    </div>
  )
}

function AddFoodForm({ mealId }: { mealId: string }) {
  const [name, setName] = useState("")
  const [qty, setQty] = useState("")
  const [kcal, setKcal] = useState("")
  const [p, setP] = useState("")
  const [c, setC] = useState("")
  const [f, setF] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setLoading(true)

    await addFoodItem(mealId, {
      name,
      quantityG: qty ? parseFloat(qty) : undefined,
      kcal: kcal ? parseFloat(kcal) : undefined,
      proteinG: p ? parseFloat(p) : undefined,
      carbsG: c ? parseFloat(c) : undefined,
      fatG: f ? parseFloat(f) : undefined
    })

    setName(""); setQty(""); setKcal(""); setP(""); setC(""); setF("")
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg grid grid-cols-2 md:grid-cols-7 gap-2 items-end">
      <div className="col-span-2">
        <label className="block text-[10px] uppercase text-zinc-500">Alimento</label>
        <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full p-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" placeholder="es. Pollo" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-zinc-500">Grammi</label>
        <input type="number" value={qty} onChange={e=>setQty(e.target.value)} className="w-full p-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-zinc-500">Kcal</label>
        <input type="number" value={kcal} onChange={e=>setKcal(e.target.value)} className="w-full p-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-zinc-500">Pro (g)</label>
        <input type="number" value={p} onChange={e=>setP(e.target.value)} className="w-full p-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-zinc-500">Carbo (g)</label>
        <input type="number" value={c} onChange={e=>setC(e.target.value)} className="w-full p-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-zinc-500">Grassi (g)</label>
        <input type="number" value={f} onChange={e=>setF(e.target.value)} className="w-full p-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
      </div>
      <div className="col-span-2 md:col-span-7 mt-2">
        <button type="submit" disabled={loading} className="w-full py-1.5 text-sm bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded font-medium disabled:opacity-50">
          Aggiungi
        </button>
      </div>
    </form>
  )
}
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addFoodItem, deleteFoodItem } from "@/app/actions/nutrition"
import { MealType } from "@prisma/client"
import { ChevronDown, ChevronRight, Plus, Trash2, AlertCircle, Zap } from "lucide-react"

export default function NutritionClient({ initialDay, currentDate }: { initialDay: any, currentDate: string }) {
  const router = useRouter()
  const [date, setDate] = useState(currentDate)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    router.push(`/nutrition?date=${e.target.value}`)
  }

  const kcalActual = initialDay.kcalActual || 0
  const kcalTarget = initialDay.kcalTarget || 2200
  const pct = Math.min(100, Math.round((kcalActual / kcalTarget) * 100))
  const colorClass = pct > 110 ? 'bg-red-500' : (pct > 90 ? 'bg-green-500' : 'bg-blue-500')

  const proActual = Math.round(initialDay.proteinG || 0)
  const proTarget = initialDay.targetProtein || 150
  
  const carbActual = Math.round(initialDay.carbsG || 0)
  const carbTarget = initialDay.targetCarbs || 200

  const fatActual = Math.round(initialDay.fatG || 0)
  const fatTarget = initialDay.targetFat || 70

  const proMissing = proTarget - proActual

  return (
    <div className="space-y-8">
      {/* Date Selector */}
      <div className="flex justify-between items-center bg-[#111118] p-4 rounded-xl border border-white/5">
        <input 
          type="date" 
          value={date} 
          onChange={handleDateChange}
          className="p-2 border border-white/10 rounded-lg bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50"
        />
        {initialDay.isTrainingDay && (
          <div className="flex items-center gap-2 text-sm text-[#f59e0b] bg-[#f59e0b]/10 px-3 py-1.5 rounded-lg border border-[#f59e0b]/20">
            <Zap className="w-4 h-4" /> Giorno di Allenamento (+400 kcal, +100g Carbo)
          </div>
        )}
      </div>

      {/* Macros Progress */}
      <div className="bg-[#111118] p-6 rounded-2xl border border-white/5 space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2 font-medium text-[#f1f5f9]">
            <span>Calorie</span>
            <span>{kcalActual} / {kcalTarget} kcal</span>
          </div>
          <div className="h-4 w-full bg-[#0a0a0f] rounded-full overflow-hidden border border-white/5">
            <div className={`h-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }}></div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6 text-xs">
          <div>
            <div className="flex justify-between mb-1.5 text-[#f1f5f9]"><span>Proteine</span><span>{proActual} / {proTarget}g</span></div>
            <div className="h-2 w-full bg-[#0a0a0f] rounded-full overflow-hidden border border-white/5"><div className="h-full bg-[#8b5cf6] transition-all" style={{ width: `${Math.min(100, proActual / proTarget * 100)}%` }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-1.5 text-[#f1f5f9]"><span>Carboidrati</span><span>{carbActual} / {carbTarget}g</span></div>
            <div className="h-2 w-full bg-[#0a0a0f] rounded-full overflow-hidden border border-white/5"><div className="h-full bg-[#f59e0b] transition-all" style={{ width: `${Math.min(100, carbActual / carbTarget * 100)}%` }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-1.5 text-[#f1f5f9]"><span>Grassi</span><span>{fatActual} / {fatTarget}g</span></div>
            <div className="h-2 w-full bg-[#0a0a0f] rounded-full overflow-hidden border border-white/5"><div className="h-full bg-[#ef4444] transition-all" style={{ width: `${Math.min(100, fatActual / fatTarget * 100)}%` }}></div></div>
          </div>
        </div>
      </div>

      {/* Protein Alert at Dinner */}
      {proMissing > 10 && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[#ef4444]">Obiettivo Proteine a rischio</h4>
            <p className="text-xs text-[#ef4444]/80 mt-1">Ti mancano {proMissing}g di proteine per raggiungere il target. Aggiungi una fonte proteica magra a cena o uno spuntino post-cena (es. yogurt greco o whey).</p>
          </div>
        </div>
      )}

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
    <div className="bg-[#111118] rounded-xl border border-white/5 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#111118] hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 font-medium text-[#f1f5f9]">
          {isOpen ? <ChevronDown className="h-5 w-5 text-[#64748b]" /> : <ChevronRight className="h-5 w-5 text-[#64748b]" />}
          {mealNames[meal.type] || meal.type}
        </div>
        <span className="text-sm font-semibold text-[#3b82f6]">{Math.round(mealTotal)} kcal</span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-white/5 space-y-4 bg-[#0a0a0f]/50">
          <ul className="space-y-2">
            {meal.foodItems.map((item: any) => (
              <li key={item.id} className="flex justify-between items-center text-sm p-3 bg-[#0a0a0f] rounded-lg border border-white/5">
                <div>
                  <div className="font-medium text-[#f1f5f9]">{item.name} {item.quantityG ? `(${item.quantityG}g)` : ''}</div>
                  <div className="text-xs text-[#64748b] mt-0.5 flex gap-2">
                    <span className="text-[#8b5cf6]">P: {item.proteinG||0}</span>
                    <span className="text-[#f59e0b]">C: {item.carbsG||0}</span>
                    <span className="text-[#ef4444]">G: {item.fatG||0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-[#f1f5f9]">{item.kcal||0} kcal</span>
                  <button onClick={() => deleteFoodItem(item.id)} className="text-red-500/70 hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors">
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

  // DB Alimenti Mock (Template)
  const quickFoods = [
    { name: "Pollo", qty: 100, kcal: 165, p: 31, c: 0, f: 3.6 },
    { name: "Riso", qty: 100, kcal: 130, p: 2.7, c: 28, f: 0.3 },
    { name: "Uova", qty: 100, kcal: 155, p: 13, c: 1.1, f: 11 },
  ]

  const applyTemplate = (food: any) => {
    setName(food.name)
    setQty(food.qty.toString())
    setKcal(food.kcal.toString())
    setP(food.p.toString())
    setC(food.c.toString())
    setF(food.f.toString())
  }

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
    <div className="space-y-3">
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
        {quickFoods.map(food => (
          <button key={food.name} onClick={() => applyTemplate(food)} type="button" className="text-xs px-3 py-1.5 bg-[#111118] border border-white/5 rounded-full text-[#64748b] hover:text-[#f1f5f9] hover:border-white/20 whitespace-nowrap transition-colors">
            + {food.name}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="bg-[#111118] p-4 rounded-xl border border-white/5 grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
        <div className="col-span-2">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#64748b] mb-1">Alimento *</label>
          <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 text-sm rounded-lg border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50" placeholder="es. Pollo" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#64748b] mb-1">Grammi</label>
          <input type="number" value={qty} onChange={e=>setQty(e.target.value)} className="w-full p-2 text-sm rounded-lg border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#64748b] mb-1">Kcal</label>
          <input type="number" value={kcal} onChange={e=>setKcal(e.target.value)} className="w-full p-2 text-sm rounded-lg border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#8b5cf6] mb-1">Pro (g)</label>
          <input type="number" step="0.1" value={p} onChange={e=>setP(e.target.value)} className="w-full p-2 text-sm rounded-lg border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/50" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#f59e0b] mb-1">Carbo (g)</label>
          <input type="number" step="0.1" value={c} onChange={e=>setC(e.target.value)} className="w-full p-2 text-sm rounded-lg border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#f59e0b]/50 focus:ring-1 focus:ring-[#f59e0b]/50" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#ef4444] mb-1">Grassi (g)</label>
          <input type="number" step="0.1" value={f} onChange={e=>setF(e.target.value)} className="w-full p-2 text-sm rounded-lg border border-white/10 bg-[#0a0a0f] text-[#f1f5f9] focus:outline-none focus:border-[#ef4444]/50 focus:ring-1 focus:ring-[#ef4444]/50" />
        </div>
        <div className="col-span-2 md:col-span-7 mt-2">
          <button type="submit" disabled={loading} className="w-full py-2.5 text-sm bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-lg font-medium disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
        </div>
      </form>
    </div>
  )
}
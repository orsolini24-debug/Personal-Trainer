"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { addFoodItem, deleteFoodItem, saveMealAsTemplate, getMealTemplates, applyTemplate, deleteMealTemplate, addMeal } from "@/app/actions/nutrition"
import { MealType } from "@prisma/client"
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertTriangle,
  Zap,
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  Apple,
  Dumbbell,
  Bookmark,
  BookmarkCheck,
  X,
  Loader2,
  Droplets,
  GlassWater,
  CheckCircle2,
  Camera,
  Sparkles,
} from "lucide-react"
import { updateWater } from "@/app/actions/nutrition"

// ── TypeScript interfaces ─────────────────────────────────────────────────────

interface FoodItem {
  id: string
  name: string
  quantityG?: number | null
  kcal?: number | null
  proteinG?: number | null
  carbsG?: number | null
  fatG?: number | null
}

interface Meal {
  id: string
  type: MealType
  suggestedFoods?: string[]
  foodItems: FoodItem[]
}

interface NutritionDay {
  id: string
  kcalActual?: number | null
  kcalTarget?: number | null
  proteinG?: number | null
  carbsG?: number | null
  fatG?: number | null
  waterL?: number
  targetProtein?: number | null
  targetCarbs?: number | null
  targetFat?: number | null
  isTrainingDay?: boolean | null
  meals?: Meal[]
}

interface QuickFood {
  name: string
  qty: number
  kcal: number
  p: number
  c: number
  f: number
}

// ── Quick food templates ──────────────────────────────────────────────────────

const QUICK_FOODS: QuickFood[] = [
  { name: "Pollo",          qty: 100, kcal: 165, p: 31,  c: 0,   f: 3.6 },
  { name: "Riso",           qty: 100, kcal: 130, p: 2.7, c: 28,  f: 0.3 },
  { name: "Uova",           qty: 100, kcal: 155, p: 13,  c: 1.1, f: 11  },
  { name: "Salmone",        qty: 100, kcal: 208, p: 20,  c: 0,   f: 13  },
  { name: "Yogurt Greco",   qty: 150, kcal: 100, p: 17,  c: 6,   f: 0.7 },
  { name: "Avena",          qty: 80,  kcal: 296, p: 11,  c: 51,  f: 5.2 },
  { name: "Petto Tacchino", qty: 100, kcal: 135, p: 30,  c: 0,   f: 1   },
  { name: "Pane Integrale", qty: 60,  kcal: 148, p: 5.5, c: 28,  f: 1.8 },
  { name: "Whey Protein",   qty: 30,  kcal: 114, p: 24,  c: 2,   f: 1.5 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function clampPositive(value: string): string {
  const n = parseFloat(value)
  if (isNaN(n)) return value
  return Math.max(0, n).toString()
}

// Meal icon mapping
const mealIcons: Record<string, React.ReactNode> = {
  [MealType.BREAKFAST]:    <Coffee    className="w-4 h-4" />,
  [MealType.LUNCH]:        <Sun       className="w-4 h-4" />,
  [MealType.PRE_WORKOUT]:  <Dumbbell  className="w-4 h-4" />,
  [MealType.POST_WORKOUT]: <Dumbbell  className="w-4 h-4" />,
  [MealType.DINNER]:       <Moon      className="w-4 h-4" />,
  [MealType.SNACK]:        <Apple     className="w-4 h-4" />,
}

// Meal colour accents (bg/border tokens via inline CSS vars)
const mealAccents: Record<string, string> = {
  [MealType.BREAKFAST]:    "var(--warning)",
  [MealType.LUNCH]:        "var(--accent)",
  [MealType.PRE_WORKOUT]:  "var(--positive)",
  [MealType.POST_WORKOUT]: "var(--positive)",
  [MealType.DINNER]:       "var(--accent2)",
  [MealType.SNACK]:        "var(--warning)",
}

const mealNames: Record<string, string> = {
  [MealType.BREAKFAST]:    "Colazione",
  [MealType.LUNCH]:        "Pranzo",
  [MealType.PRE_WORKOUT]:  "Pre-workout",
  [MealType.POST_WORKOUT]: "Post-workout",
  [MealType.DINNER]:       "Cena",
  [MealType.SNACK]:        "Spuntino",
}

// ── Circular progress SVG ─────────────────────────────────────────────────────

function CalorieRing({
  actual,
  target,
  pct,
}: {
  actual: number
  target: number
  pct: number
}) {
  const size = 180
  const r = 70
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  const ringColor =
    pct > 110 ? "var(--negative)" : pct > 90 ? "var(--positive)" : "var(--accent)"

  return (
    <div className="relative flex items-center justify-center animate-scale-in" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={12}
          stroke="var(--border-subtle)"
          className="opacity-50"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={12}
          stroke={ringColor}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s var(--ease-expo-out)",
            filter: `drop-shadow(0 0 12px ${ringColor}60)`,
          }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="text-4xl font-black tabular-nums leading-none num"
          style={{ color: "var(--fg-primary)" }}
        >
          {actual}
        </span>
        <span className="text-[10px] font-black mt-1.5 uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>
          Kcal residui
        </span>
        <div 
          className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black border"
          style={{ 
            background: `${ringColor}15`, 
            borderColor: `${ringColor}30`,
            color: ringColor
          }}
        >
          {pct}% DEL TARGET
        </div>
      </div>
    </div>
  )
}

// ── Macro progress bar ────────────────────────────────────────────────────────

function MacroBar({
  label,
  actual,
  target,
  color,
}: {
  label: string
  actual: number
  target: number
  color: string
}) {
  const pct = Math.min(100, Math.round((actual / target) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
        <span className="text-xs tabular-nums" style={{ color: "var(--fg-muted)" }}>
          {actual}
          <span style={{ color: "var(--fg-subtle)" }}>/{target}g</span>
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ background: "var(--border-subtle)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 8px ${color}80`,
            transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  )
}

// ── Smart Alerts ──────────────────────────────────────────────────────────────

function SmartAlerts({
  kcalActual,
  kcalTarget,
  proActual,
  proTarget,
  carbActual,
  carbTarget,
  isTrainingDay,
}: {
  kcalActual: number
  kcalTarget: number
  proActual: number
  proTarget: number
  carbActual: number
  carbTarget: number
  isTrainingDay: boolean
}) {
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("nutrition_alerts_dismissed")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const now = Date.now()
        // Filtra i dismiss più vecchi di 2 ore
        const filtered = Object.entries(parsed)
          .filter(([_, timestamp]) => now - (timestamp as number) < 2 * 60 * 60 * 1000)
        
        setDismissed(filtered.map(([id]) => id))
        // Pulisci il localStorage se necessario
        const cleanObj = Object.fromEntries(filtered)
        localStorage.setItem("nutrition_alerts_dismissed", JSON.stringify(cleanObj))
      } catch (e) {
        localStorage.removeItem("nutrition_alerts_dismissed")
      }
    }
  }, [])

  const handleDismiss = (id: string) => {
    const now = Date.now()
    const stored = localStorage.getItem("nutrition_alerts_dismissed")
    const parsed = stored ? JSON.parse(stored) : {}
    parsed[id] = now
    localStorage.setItem("nutrition_alerts_dismissed", JSON.stringify(parsed))
    setDismissed((prev) => [...prev, id])
  }

  const alerts = []
  const now = new Date()
  const hour = now.getHours()

  // 1. Protein alert: proteine < 80% del target E sono le 19:00 o più
  if (proActual < proTarget * 0.8 && hour >= 19 && !dismissed.includes("low_protein")) {
    alerts.push({
      id: "low_protein",
      type: "negative",
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Aggiungi proteine a cena",
      text: `Ti mancano ancora ${Math.round(proTarget - proActual)}g di proteine per raggiungere il target.`,
    })
  }

  // 2. Calorie alert: calorie > 110% del target
  if (kcalActual > kcalTarget * 1.1 && !dismissed.includes("high_calories")) {
    alerts.push({
      id: "high_calories",
      type: "negative",
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Target calorico superato",
      text: `Hai superato il target di ${Math.round(kcalActual - kcalTarget)} kcal.`,
    })
  }

  // 3. Carbs training alert: giorno di allenamento E carboidrati < 70%
  if (isTrainingDay && carbActual < carbTarget * 0.7 && !dismissed.includes("low_carbs_training")) {
    alerts.push({
      id: "low_carbs_training",
      type: "warning",
      icon: <Zap className="w-4 h-4" />,
      title: "Carboidrati bassi",
      text: "Giorno di allenamento: aumenta i carboidrati per supportare la performance.",
    })
  }

  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl animate-slide-up relative group"
          style={{
            background: `var(--${alert.type}-dim)`,
            border: `1px solid var(--${alert.type})`,
          }}
        >
          <div style={{ color: `var(--${alert.type})` }} className="mt-0.5 shrink-0">
            {alert.icon}
          </div>
          <div className="flex-1 pr-6">
            <p className="text-sm font-bold" style={{ color: `var(--${alert.type})` }}>
              {alert.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {alert.text}
            </p>
          </div>
          <button
            onClick={() => handleDismiss(alert.id)}
            className="absolute top-3 right-3 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--fg-subtle)" }}
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Date navigator ────────────────────────────────────────────────────────────

function DateNavigator({
  date,
  onChange,
}: {
  date: string
  onChange: (d: string) => void
}) {
  const today = new Date().toISOString().split("T")[0]
  const current = new Date(date + "T00:00:00")
  const isToday = date === today

  const shift = (days: number) => {
    const d = new Date(current)
    d.setDate(d.getDate() + days)
    onChange(d.toISOString().split("T")[0])
  }

  const label = isToday
    ? "Oggi"
    : current.toLocaleDateString("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => shift(-1)}
        className="btn-ghost w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
        aria-label="Giorno precedente"
      >
        ‹
      </button>

      <div className="flex-1 flex items-center justify-center gap-2">
        {/* Native date picker hidden behind the label pill */}
        <label
          className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full cursor-pointer transition-all"
          style={{
            background: isToday ? "var(--accent-dim)" : "var(--bg-elevated)",
            border: `1px solid ${isToday ? "var(--accent)" : "var(--border-default)"}`,
            color: isToday ? "var(--accent)" : "var(--fg-primary)",
          }}
        >
          <span className="text-sm font-semibold">{label}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        </label>

        {!isToday && (
          <button
            onClick={() => onChange(today)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
          >
            Oggi
          </button>
        )}
      </div>

      <button
        onClick={() => shift(1)}
        className="btn-ghost w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
        aria-label="Giorno successivo"
      >
        ›
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NutritionClient({
  initialDay,
  currentDate,
}: {
  initialDay: NutritionDay
  currentDate: string
}) {
  const router = useRouter()
  const [date, setDate] = useState(currentDate)

  const handleDateChange = (d: string) => {
    setDate(d)
    router.push(`/nutrition?date=${d}`)
  }

  const kcalActual = initialDay.kcalActual || 0
  const kcalTarget = initialDay.kcalTarget || 2200
  const pct = Math.min(110, Math.round((kcalActual / kcalTarget) * 100))

  const proActual  = Math.round(initialDay.proteinG || 0)
  const proTarget  = initialDay.targetProtein || 150
  const carbActual = Math.round(initialDay.carbsG  || 0)
  const carbTarget = initialDay.targetCarbs  || 200
  const fatActual  = Math.round(initialDay.fatG    || 0)
  const fatTarget  = initialDay.targetFat    || 70
  const proMissing = proTarget - proActual

  return (
    <div className="space-y-5 px-2 md:px-4 pt-3">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black tracking-[0.18em] uppercase" style={{ color: "var(--accent)" }}>
            BuiltDifferent Nutrition
          </p>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--fg-primary)" }}>
            Diario alimentare
          </h1>
        </div>
        {initialDay.isTrainingDay && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{
              background: "var(--warning-dim)",
              border: "1px solid var(--warning)",
              color: "var(--warning)",
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            Training day
          </div>
        )}
      </div>

      {/* ── Date navigator ── */}
      <DateNavigator date={date} onChange={handleDateChange} />

      {/* ── Water Tracker ── */}
      <WaterTracker 
        dayId={initialDay.id} 
        currentL={initialDay.waterL || 0} 
        onUpdate={() => router.refresh()} 
      />

      {/* ── Hero: calorie ring + macro bars ── */}
      <div className="athletic-panel surface-accent mesh-bg p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-10 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Ring */}
        <CalorieRing actual={kcalActual} target={kcalTarget} pct={pct} />

        {/* Macro bars */}
        <div className="flex-1 w-full space-y-5 relative z-10">
          <MacroBar
            label="Proteine"
            actual={proActual}
            target={proTarget}
            color="var(--accent2)"
          />
          <MacroBar
            label="Carboidrati"
            actual={carbActual}
            target={carbTarget}
            color="var(--warning)"
          />
          <MacroBar
            label="Grassi"
            actual={fatActual}
            target={fatTarget}
            color="var(--negative)"
          />
        </div>
      </div>

      {/* ── Smart Alerts ── */}
      <SmartAlerts
        kcalActual={kcalActual}
        kcalTarget={kcalTarget}
        proActual={proActual}
        proTarget={proTarget}
        carbActual={carbActual}
        carbTarget={carbTarget}
        isTrainingDay={!!initialDay.isTrainingDay}
      />

      {/* ── Meal sections with dividers ── */}
      <div className="space-y-12 pt-6 stagger">
        {(initialDay.meals ?? []).map((meal) => (
          <div key={meal.id} className="space-y-4">
            <div className="divider-label mx-2">
              <span className="flex items-center gap-2">
                <span style={{ color: mealAccents[meal.type] }}>{mealIcons[meal.type]}</span>
                {mealNames[meal.type] || meal.type}
              </span>
            </div>
            <MealSection meal={meal} />
          </div>
        ))}
      </div>

      {/* ── Aggiungi pasto picker ── */}
      <AddMealPicker
        dayId={initialDay.id}
        existingTypes={(initialDay.meals ?? []).map(m => m.type)}
        isTrainingDay={!!initialDay.isTrainingDay}
        onAdded={() => router.refresh()}
      />
    </div>
  )
}

// ── WaterTracker ──────────────────────────────────────────────────────────────

function WaterTracker({
  dayId,
  currentL,
  onUpdate,
}: {
  dayId: string
  currentL: number
  onUpdate: () => void
}) {
  const [loading, setLoading] = useState(false)
  const targetL = 2.5
  const pct = Math.min(100, Math.round((currentL / targetL) * 100))

  const handleAddWater = async (amount: number) => {
    setLoading(true)
    await updateWater(dayId, Math.max(0, currentL + amount))
    setLoading(false)
    onUpdate()
  }

  return (
    <div className="bg-surface rounded-3xl p-6 border border-border flex items-center justify-between gap-6 group">
      <div className="flex items-center gap-4 flex-1">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
          style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
        >
          <Droplets className="w-6 h-6 text-accent relative z-10" />
          <div 
            className="absolute bottom-0 left-0 right-0 bg-accent/20 transition-all duration-700"
            style={{ height: `${pct}%` }}
          />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-0.5">Idratazione</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-primary num">{currentL.toFixed(1)}</span>
            <span className="text-xs font-bold text-fg-subtle uppercase">/ {targetL}L</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAddWater(0.25)}
          disabled={loading}
          className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all active:scale-90"
          title="+250ml"
        >
          <GlassWater size={18} />
        </button>
        <button
          onClick={() => handleAddWater(-0.25)}
          disabled={loading || currentL <= 0}
          className="w-10 h-10 rounded-xl bg-base border border-border flex items-center justify-center text-fg-subtle hover:text-negative hover:border-negative/30 transition-all active:scale-90 disabled:opacity-30"
          title="-250ml"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// ── AddMealPicker ──────────────────────────────────────────────────────────────

const ALL_MEAL_TYPES: { type: MealType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: MealType.BREAKFAST,    label: "Colazione",    icon: <Coffee   className="w-4 h-4" />, color: "var(--warning)" },
  { type: MealType.LUNCH,        label: "Pranzo",       icon: <Sun      className="w-4 h-4" />, color: "var(--accent)" },
  { type: MealType.PRE_WORKOUT,  label: "Pre-workout",  icon: <Dumbbell className="w-4 h-4" />, color: "var(--positive)" },
  { type: MealType.POST_WORKOUT, label: "Post-workout", icon: <Dumbbell className="w-4 h-4" />, color: "var(--positive)" },
  { type: MealType.DINNER,       label: "Cena",         icon: <Moon     className="w-4 h-4" />, color: "var(--accent2)" },
  { type: MealType.SNACK,        label: "Spuntino",     icon: <Apple    className="w-4 h-4" />, color: "var(--warning)" },
]

function AddMealPicker({
  dayId,
  existingTypes,
  isTrainingDay,
  onAdded,
}: {
  dayId: string
  existingTypes: MealType[]
  isTrainingDay: boolean
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<MealType | null>(null)

  const available = ALL_MEAL_TYPES.filter(m => !existingTypes.includes(m.type))

  const handleAdd = async (type: MealType) => {
    setAdding(type)
    await addMeal(dayId, type)
    setAdding(null)
    setOpen(false)
    onAdded()
  }

  // Se non ci sono pasti e nessun tipo disponibile → tutto aggiunto
  if (available.length === 0 && existingTypes.length > 0) return null

  return (
    <div>
      {/* Bottone principale */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] cta-secondary"
          style={{
            border: "2px dashed var(--accent)",
            color: "var(--accent)",
          }}
        >
          <Plus className="w-4 h-4" />
          Aggiungi pasto
        </button>
      ) : (
        <div
          className="rounded-2xl overflow-hidden animate-scale-in"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          {/* Header picker */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <p className="text-sm font-bold" style={{ color: "var(--fg-primary)" }}>
              Scegli tipo pasto
            </p>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
              style={{ color: "var(--fg-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista tipi disponibili */}
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {available.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => handleAdd(type)}
                disabled={!!adding}
                className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-60"
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                  color: "var(--fg-primary)",
                }}
              >
                <span style={{ color }}>{adding === type ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Empty state — tutti i pasti già aggiunti */}
          {available.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                Tutti i pasti sono già stati aggiunti per oggi
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── MealSection ───────────────────────────────────────────────────────────────

function MealSection({ meal }: { meal: Meal }) {
  const [isOpen, setIsOpen] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; totalKcal: number; totalProtein: number }>>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const mealTotal = meal.foodItems.reduce((acc, item) => acc + (item.kcal || 0), 0)
  const accent = mealAccents[meal.type] || "var(--accent)"
  const icon   = mealIcons[meal.type]

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return
    setSavingTemplate(true)
    await saveMealAsTemplate(meal.id, templateName.trim())
    setTemplateName("")
    setShowSave(false)
    setSavingTemplate(false)
  }

  const handleOpenTemplates = async () => {
    setShowTemplates(true)
    setLoadingTemplates(true)
    const res = await getMealTemplates(meal.type)
    if (res.success) setTemplates(res.data as typeof templates)
    setLoadingTemplates(false)
  }

  const handleApplyTemplate = async (templateId: string) => {
    setApplyingId(templateId)
    await applyTemplate(meal.id, templateId)
    setApplyingId(null)
    setShowTemplates(false)
  }

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteMealTemplate(templateId)
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  return (
    <div
      className="rounded-2xl overflow-hidden animate-scale-in"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3.5 transition-all"
        style={{ background: isOpen ? "transparent" : "transparent" }}
      >
        {/* Colour dot + icon */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}22`, color: accent }}
        >
          {icon}
        </div>

        <div className="flex-1 text-left">
          <p className="text-sm font-bold" style={{ color: "var(--fg-primary)" }}>
            {mealNames[meal.type] || meal.type}
          </p>
          <p className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
            {meal.foodItems.length} aliment{meal.foodItems.length === 1 ? "o" : "i"}
          </p>
        </div>

        <span className="text-sm font-black tabular-nums mr-2" style={{ color: accent }}>
          {Math.round(mealTotal)} kcal
        </span>
        {isOpen
          ? <ChevronUp   className="w-4 h-4 shrink-0" style={{ color: "var(--fg-subtle)" }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--fg-subtle)" }} />
        }
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {/* Suggested Foods from Plan */}
          {meal.suggestedFoods && meal.suggestedFoods.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-accent/5 border border-accent/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Consigliati dal piano</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {meal.suggestedFoods.map((food, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-base border border-border text-muted">
                    {food}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Food items */}
          <div className="space-y-2">
            {meal.foodItems.length === 0 ? (
              <p
                className="text-xs py-3 text-center"
                style={{ color: "var(--fg-subtle)" }}
              >
                Nessun alimento registrato — aggiungine uno qui sotto
              </p>
            ) : (
              <ul className="space-y-1.5 pt-1">
                {meal.foodItems.map((item) => (
                  <FoodItemRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </div>

          {/* Add food toggle */}
          {showForm ? (
            <div className="pt-2">
              <AddFoodForm mealId={meal.id} onClose={() => setShowForm(false)} />
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all btn-squishy"
              style={{
                background: `${accent}18`,
                border: `1px dashed ${accent}60`,
                color: accent,
              }}
            >
              <Plus className="w-4 h-4" />
              Aggiungi alimento
            </button>
          )}

          {/* Template actions */}
          {!showForm && !showSave && !showTemplates && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleOpenTemplates}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all btn-squishy"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--fg-muted)" }}
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                Usa template
              </button>
              {meal.foodItems.length > 0 && (
                <button
                  onClick={() => { setShowSave(true); setTemplateName(mealNames[meal.type] || meal.type) }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all btn-squishy"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--fg-muted)" }}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Salva template
                </button>
              )}
            </div>
          )}

          {/* Save template inline panel */}
          {showSave && (
            <div className="rounded-xl p-3 space-y-2 mt-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Nome template</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="input-field flex-1 px-3 py-2 text-sm"
                  placeholder="es. Colazione proteica"
                  onKeyDown={e => e.key === "Enter" && handleSaveTemplate()}
                  autoFocus
                />
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate || !templateName.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  style={{ background: accent, color: "#fff" }}
                >
                  {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salva"}
                </button>
                <button onClick={() => setShowSave(false)} className="p-2 rounded-xl" style={{ background: "var(--bg-surface)", color: "var(--fg-muted)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Apply template inline panel */}
          {showTemplates && (
            <div className="rounded-xl p-3 space-y-2 mt-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Template salvati</p>
                <button onClick={() => setShowTemplates(false)} style={{ color: "var(--fg-subtle)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {loadingTemplates ? (
                <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--fg-subtle)" }} /></div>
              ) : templates.length === 0 ? (
                <p className="text-xs text-center py-2" style={{ color: "var(--fg-subtle)" }}>Nessun template salvato per questo pasto</p>
              ) : (
                <div className="space-y-1.5">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => handleApplyTemplate(t.id)}
                        disabled={!!applyingId}
                        className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                      >
                        <div>
                          <p className="text-xs font-bold" style={{ color: "var(--fg-primary)" }}>{t.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>{t.totalKcal} kcal · {t.totalProtein}g prot</p>
                        </div>
                        {applyingId === t.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: accent }} />
                          : <Plus className="w-3.5 h-3.5" style={{ color: accent }} />
                        }
                      </button>
                      <button
                        onClick={e => handleDeleteTemplate(t.id, e)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: "var(--negative)", background: "var(--negative-dim)" }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── FoodItemRow ───────────────────────────────────────────────────────────────

function FoodItemRow({ item }: { item: FoodItem }) {
  return (
    <li
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--fg-primary)" }}>
          {item.name}
          {item.quantityG ? (
            <span className="font-normal ml-1" style={{ color: "var(--fg-muted)" }}>
              {item.quantityG}g
            </span>
          ) : null}
        </p>
        {/* Macro chips */}
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {item.proteinG != null && item.proteinG > 0 && (
            <span
              className="badge"
              style={{ background: "var(--accent2-dim)", color: "var(--accent2)" }}
            >
              P {item.proteinG}g
            </span>
          )}
          {item.carbsG != null && item.carbsG > 0 && (
            <span
              className="badge"
              style={{ background: "var(--warning-dim)", color: "var(--warning)" }}
            >
              C {item.carbsG}g
            </span>
          )}
          {item.fatG != null && item.fatG > 0 && (
            <span
              className="badge"
              style={{ background: "var(--negative-dim)", color: "var(--negative)" }}
            >
              G {item.fatG}g
            </span>
          )}
        </div>
      </div>

      <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: "var(--fg-primary)" }}>
        {item.kcal || 0} kcal
      </span>

      <button
        onClick={() => deleteFoodItem(item.id)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg transition-all btn-squishy"
        style={{ color: "var(--negative)", background: "var(--negative-dim)" }}
        aria-label="Rimuovi alimento"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  )
}

// ── AddFoodForm ───────────────────────────────────────────────────────────────

// ── Food search result type ───────────────────────────────────────────────────
type OFFProduct = {
  id: string
  name: string
  kcal: number   // per 100 g/ml
  p: number
  c: number
  f: number
  source?: 'local' | 'usda'
}

function round1(n: number) { return Math.round(n * 10) / 10 }

/** Ridimensiona l'immagine a maxPx lato lungo e restituisce base64 senza prefisso data: */
async function resizeAndEncode(file: File, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve(dataUrl.split(',')[1])   // solo la parte base64
    }
    img.onerror = reject
    img.src = url
  })
}

function AddFoodForm({
  mealId,
  onClose,
}: {
  mealId: string
  onClose?: () => void
}) {
  const [name, setName]       = useState("")
  const [qty,  setQty]        = useState("")
  const [kcal, setKcal]       = useState("")
  const [p,    setP]          = useState("")
  const [c,    setC]          = useState("")
  const [f,    setF]          = useState("")
  const [loading, setLoading] = useState(false)

  // Autocomplete
  const [suggestions,  setSuggestions]  = useState<OFFProduct[]>([])
  const [showSugg,     setShowSugg]     = useState(false)
  const [isSearching,  setIsSearching]  = useState(false)
  // Stores per-100g base values of the selected food so we can rescale on qty change
  const [basePer100g,  setBasePer100g]  = useState<OFFProduct | null>(null)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipSearchRef = useRef(false)  // prevents search when name is set programmatically
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  // Photo / AI vision
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [visionError, setVisionError] = useState<string | null>(null)

  const handlePhoto = async (file: File) => {
    setVisionError(null)
    setIsAnalyzing(true)
    try {
      // Ridimensiona a max 1024px lato lungo per ridurre payload
      const base64 = await resizeAndEncode(file, 1024)
      const mimeType = file.type || 'image/jpeg'

      const res = await fetch('/api/food-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok || !data.food) {
        setVisionError(data.error ?? 'Errore analisi foto')
        return
      }
      const food = data.food
      if (!food.name) { setVisionError('Cibo non riconoscibile'); return }

      skipSearchRef.current = true
      setBasePer100g(null)
      setName(food.name)
      setQty(String(food.qty || 100))
      setKcal(String(food.kcal || 0))
      setP(String(food.p || 0))
      setC(String(food.c || 0))
      setF(String(food.f || 0))
      setSuggestions([]); setShowSugg(false)
    } catch {
      setVisionError('Errore di rete')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ── Search OpenFoodFacts ──────────────────────────────────────────────────
  useEffect(() => {
    if (skipSearchRef.current) { skipSearchRef.current = false; return }
    if (name.trim().length < 2) { setSuggestions([]); setShowSugg(false); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Proxy server-side → evita CORS / throttling da browser
        const res  = await fetch(`/api/food-search?q=${encodeURIComponent(name.trim())}`)
        const data = await res.json()
        const prods: OFFProduct[] = data.products ?? []
        setSuggestions(prods)
        setShowSugg(prods.length > 0)
      } catch { /* silently ignore network errors */ }
      setIsSearching(false)
    }, 450)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [name])

  // ── Rescale macros when qty changes (only when a DB food is selected) ─────
  useEffect(() => {
    if (!basePer100g) return
    const g = parseFloat(qty) || 100
    const r = g / 100
    setKcal(String(Math.round(basePer100g.kcal * r)))
    setP(String(round1(basePer100g.p * r)))
    setC(String(round1(basePer100g.c * r)))
    setF(String(round1(basePer100g.f * r)))
  }, [qty, basePer100g])

  // ── Select a suggestion ───────────────────────────────────────────────────
  const selectSuggestion = (prod: OFFProduct) => {
    skipSearchRef.current = true
    setBasePer100g(prod)
    setName(prod.name)
    const g = parseFloat(qty) || 100
    if (!qty) setQty("100")
    const r = g / 100
    setKcal(String(Math.round(prod.kcal * r)))
    setP(String(round1(prod.p * r)))
    setC(String(round1(prod.c * r)))
    setF(String(round1(prod.f * r)))
    setSuggestions([])
    setShowSugg(false)
  }

  const applyTemplate = (food: QuickFood) => {
    skipSearchRef.current = true
    setBasePer100g(null)
    setName(food.name)
    setQty(food.qty.toString())
    setKcal(food.kcal.toString())
    setP(food.p.toString())
    setC(food.c.toString())
    setF(food.f.toString())
    setSuggestions([])
    setShowSugg(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setLoading(true)

    await addFoodItem(mealId, {
      name,
      quantityG: qty  ? Math.max(0, parseFloat(qty))  : undefined,
      kcal:      kcal ? Math.max(0, parseFloat(kcal)) : undefined,
      proteinG:  p    ? Math.max(0, parseFloat(p))    : undefined,
      carbsG:    c    ? Math.max(0, parseFloat(c))    : undefined,
      fatG:      f    ? Math.max(0, parseFloat(f))    : undefined,
    })

    setName(""); setQty(""); setKcal(""); setP(""); setC(""); setF("")
    setBasePer100g(null); setSuggestions([]); setShowSugg(false)
    setLoading(false)
    onClose?.()
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
    >

      {/* Input file nascosto per foto */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = '' }}
      />

      {/* Bottone analisi foto AI */}
      <button
        type="button"
        onClick={() => photoInputRef.current?.click()}
        disabled={isAnalyzing}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: 'white',
          boxShadow: '0 2px 12px color-mix(in srgb, var(--accent) 35%, transparent)',
        }}
      >
        {isAnalyzing ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Analisi in corso…
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            Scatta / carica foto
            <Sparkles className="w-3.5 h-3.5 opacity-80" />
          </>
        )}
      </button>

      {visionError && (
        <p className="text-[11px] text-center font-medium" style={{ color: 'var(--negative)' }}>
          {visionError}
        </p>
      )}

      {/* Quick-food chip grid */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-subtle)" }}>
          Inserimento rapido
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_FOODS.map((food) => (
            <button
              key={food.name}
              onClick={() => applyTemplate(food)}
              type="button"
              className="text-xs px-3 py-1.5 rounded-full transition-all btn-squishy font-medium"
              style={{
                background: name === food.name ? "var(--accent-dim)" : "var(--bg-surface)",
                border: `1px solid ${name === food.name ? "var(--accent)" : "var(--border-default)"}`,
                color: name === food.name ? "var(--accent)" : "var(--fg-muted)",
              }}
            >
              {food.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Alimento row — con autocomplete */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 relative">
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-muted)" }}
            >
              Alimento *
              {isSearching && (
                <span className="ml-2 inline-block w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin align-middle" />
              )}
              {basePer100g && (
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'var(--positive-dim, rgba(16,185,129,0.15))', color: 'var(--positive)' }}>
                  ✓ database
                </span>
              )}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setBasePer100g(null) }}
              onFocus={() => { if (suggestions.length > 0) setShowSugg(true) }}
              onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              className="input-field w-full px-3 py-2.5 text-sm"
              placeholder="Cerca alimento (es. Caffè espresso, Pollo…)"
              autoComplete="off"
            />

            {/* Dropdown suggerimenti */}
            {showSugg && suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-xl z-50"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                {suggestions.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onMouseDown={() => selectSuggestion(prod)}
                    className="w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-[var(--bg-elevated)]"
                    style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--fg-primary)' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold truncate flex-1">{prod.name}</span>
                      {prod.source === 'local' && (
                        <span className="shrink-0 text-[8px] font-black px-1 py-0.5 rounded uppercase tracking-wide"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>IT</span>
                      )}
                      {prod.source === 'usda' && (
                        <span className="shrink-0 text-[8px] font-black px-1 py-0.5 rounded uppercase tracking-wide"
                          style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--positive)' }}>DB</span>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>
                      {prod.kcal} kcal · P {prod.p}g · C {prod.c}g · F {prod.f}g
                      <span className="ml-1" style={{ color: 'var(--fg-subtle)' }}>/100g</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-muted)" }}
            >
              Grammi / ml
            </label>
            <input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(clampPositive(e.target.value))}
              className="input-field w-full px-3 py-2.5 text-sm"
              placeholder="100"
            />
          </div>

          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-muted)" }}
            >
              Kcal
            </label>
            <input
              type="number"
              min="0"
              value={kcal}
              onChange={(e) => { setBasePer100g(null); setKcal(clampPositive(e.target.value)) }}
              className="input-field w-full px-3 py-2.5 text-sm"
              placeholder="0"
            />
          </div>
        </div>

        {/* Macro chips row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Proteine */}
          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--accent2)" }}
            >
              Pro (g)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={p}
              onChange={(e) => setP(clampPositive(e.target.value))}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--accent2)",
                color: "var(--fg-primary)",
              }}
              placeholder="0"
            />
          </div>

          {/* Carboidrati */}
          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--warning)" }}
            >
              Carbo (g)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={c}
              onChange={(e) => setC(clampPositive(e.target.value))}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--warning)",
                color: "var(--fg-primary)",
              }}
              placeholder="0"
            />
          </div>

          {/* Grassi */}
          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--negative)" }}
            >
              Grassi (g)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={f}
              onChange={(e) => setF(clampPositive(e.target.value))}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--negative)",
                color: "var(--fg-primary)",
              }}
              placeholder="0"
            />
          </div>
        </div>

        {/* Rescaling hint */}
        {basePer100g && qty && (
          <p className="text-[10px]" style={{ color: 'var(--fg-subtle)' }}>
            Valori ricalcolati per {qty} g/ml (base: {basePer100g.kcal} kcal/100g)
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-2.5 text-sm font-semibold"
            >
              Annulla
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Aggiunta…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Aggiungi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

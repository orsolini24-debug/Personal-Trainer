"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addFoodItem, deleteFoodItem, saveMealAsTemplate, getMealTemplates, applyTemplate, deleteMealTemplate } from "@/app/actions/nutrition"
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
} from "lucide-react"

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
  foodItems: FoodItem[]
}

interface NutritionDay {
  kcalActual?: number | null
  kcalTarget?: number | null
  proteinG?: number | null
  carbsG?: number | null
  fatG?: number | null
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
  const r = 56
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  const ringColor =
    pct > 110 ? "var(--negative)" : pct > 90 ? "var(--positive)" : "var(--accent)"

  return (
    <div className="relative flex items-center justify-center" style={{ width: 144, height: 144 }}>
      <svg width={144} height={144} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={72}
          cy={72}
          r={r}
          fill="none"
          strokeWidth={10}
          stroke="var(--border-default)"
        />
        {/* Progress */}
        <circle
          cx={72}
          cy={72}
          r={r}
          fill="none"
          strokeWidth={10}
          stroke={ringColor}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1)",
            filter: `drop-shadow(0 0 8px ${ringColor})`,
          }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="text-2xl font-black tabular-nums leading-none"
          style={{ color: ringColor }}
        >
          {actual}
        </span>
        <span className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--fg-subtle)" }}>
          / {target} kcal
        </span>
        <span
          className="text-[11px] font-bold mt-1"
          style={{ color: "var(--fg-muted)" }}
        >
          {pct}%
        </span>
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
    <div className="space-y-5 px-4 pt-5">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
            Nutrition
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

      {/* ── Hero: calorie ring + macro bars ── */}
      <div
        className="card p-5 flex flex-col sm:flex-row items-center gap-6"
        style={{ background: "var(--bg-surface)" }}
      >
        {/* Ring */}
        <CalorieRing actual={kcalActual} target={kcalTarget} pct={pct} />

        {/* Macro bars */}
        <div className="flex-1 w-full space-y-4">
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

      {/* ── Protein alert ── */}
      {proMissing > 10 && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl animate-slide-up"
          style={{
            background: "var(--negative-dim)",
            border: "1px solid var(--negative)",
          }}
        >
          <AlertTriangle
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: "var(--negative)" }}
          />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--negative)" }}>
              Obiettivo proteine a rischio
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              Ti mancano ancora{" "}
              <span className="font-bold" style={{ color: "var(--negative)" }}>
                {proMissing}g
              </span>{" "}
              — aggiungi yogurt greco, whey o petto di pollo.
            </p>
          </div>
        </div>
      )}

      {/* ── Meal cards ── */}
      <div className="space-y-3 stagger">
        {(initialDay.meals ?? []).map((meal) => (
          <MealSection key={meal.id} meal={meal} />
        ))}
      </div>

      {/* Empty meals message */}
      {(initialDay.meals ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
          >
            <UtensilsCrossed className="w-6 h-6" style={{ color: "var(--fg-subtle)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
            Nessun pasto per questo giorno
          </p>
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

  const mealNames: Record<string, string> = {
    [MealType.BREAKFAST]:    "Colazione",
    [MealType.LUNCH]:        "Pranzo",
    [MealType.PRE_WORKOUT]:  "Pre-workout",
    [MealType.POST_WORKOUT]: "Post-workout",
    [MealType.DINNER]:       "Cena",
    [MealType.SNACK]:        "Spuntino",
  }

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
          className="px-4 pb-4 space-y-2"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {/* Food items */}
          {meal.foodItems.length === 0 ? (
            <p
              className="text-xs py-3 text-center"
              style={{ color: "var(--fg-subtle)" }}
            >
              Nessun alimento — aggiungine uno qui sotto
            </p>
          ) : (
            <ul className="space-y-1.5 pt-3">
              {meal.foodItems.map((item) => (
                <FoodItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}

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

  const applyTemplate = (food: QuickFood) => {
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
      quantityG: qty  ? Math.max(0, parseFloat(qty))  : undefined,
      kcal:      kcal ? Math.max(0, parseFloat(kcal)) : undefined,
      proteinG:  p    ? Math.max(0, parseFloat(p))    : undefined,
      carbsG:    c    ? Math.max(0, parseFloat(c))    : undefined,
      fatG:      f    ? Math.max(0, parseFloat(f))    : undefined,
    })

    setName(""); setQty(""); setKcal(""); setP(""); setC(""); setF("")
    setLoading(false)
    onClose?.()
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
    >

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

        {/* Alimento row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-muted)" }}
            >
              Alimento *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full px-3 py-2.5 text-sm"
              placeholder="es. Pollo arrosto"
            />
          </div>

          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-muted)" }}
            >
              Grammi
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
              onChange={(e) => setKcal(clampPositive(e.target.value))}
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

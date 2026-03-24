import { NextRequest, NextResponse } from 'next/server'
import { searchFoods } from '@/lib/italian-foods'

const USDA_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY'

type FoodResult = {
  id: string
  name: string
  kcal: number
  p: number
  c: number
  f: number
  source: 'local' | 'usda'
}

/**
 * GET /api/food-search?q=<query>
 *
 * Ricerca ibrida:
 *  1. DB italiano locale  → risultati istantanei, nomi in italiano
 *  2. USDA FoodData Central → database enorme, copre prodotti branded/lavorati
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ products: [] })

  // ── 1. Ricerca locale (sincrona, sempre disponibile) ─────────────────────
  const localResults: FoodResult[] = searchFoods(q, 4).map((f, i) => ({
    id:     `local-${i}`,
    name:   f.name,
    kcal:   f.kcal,
    p:      f.p,
    c:      f.c,
    f:      f.f,
    source: 'local',
  }))

  // ── 2. USDA FoodData Central ──────────────────────────────────────────────
  let usdaResults: FoodResult[] = []
  try {
    const url =
      `https://api.nal.usda.gov/fdc/v1/foods/search` +
      `?query=${encodeURIComponent(q)}` +
      `&api_key=${USDA_KEY}` +
      `&pageSize=12` +
      `&dataType=Foundation,SR%20Legacy,Branded`   // esclude dati survey incompleti

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    let res: Response
    try {
      res = await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }

    if (res.ok) {
      const data = await res.json()

      type UsdaNutrient = { nutrientId: number; value: number }
      type UsdaFood    = { fdcId: number; description: string; foodNutrients: UsdaNutrient[] }

      const localNames = new Set(localResults.map(r => r.name.toLowerCase()))

      usdaResults = ((data.foods ?? []) as UsdaFood[])
        .map((food, i) => {
          const get = (id: number) =>
            food.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0
          return {
            id:     `usda-${i}`,
            name:   titleCase(food.description),
            kcal:   Math.round(get(1008)),
            p:      round1(get(1003)),
            c:      round1(get(1005)),
            f:      round1(get(1004)),
            source: 'usda' as const,
          }
        })
        // Filtra risultati senza nome o kcal assurde
        .filter(r => r.name && r.kcal > 0 && r.kcal < 1000)
        // Rimuovi duplicati già presenti nel DB locale
        .filter(r => !localNames.has(r.name.toLowerCase()))
        .slice(0, 5)
    }
  } catch {
    // USDA non disponibile — si mostra solo il DB locale
  }

  // Locale prima, poi USDA; max 8 totali
  const products = [...localResults, ...usdaResults].slice(0, 8)

  return NextResponse.json({ products })
}

function round1(n: number) { return Math.round(n * 10) / 10 }

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

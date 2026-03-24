import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/food-search?q=<query>
 *
 * Proxy server-side verso OpenFoodFacts per evitare CORS e rate-limiting
 * dal browser. Restituisce max 6 prodotti con nome + macro per 100 g.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ products: [] })

  try {
    const url =
      `https://world.openfoodfacts.org/cgi/search.pl` +
      `?search_terms=${encodeURIComponent(q)}` +
      `&search_simple=1&action=process&json=1` +
      `&fields=product_name,nutriments&page_size=12&lc=it`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'PerformanceEcosystem/1.0 (fitness app)' },
      next: { revalidate: 3600 },   // cache 1h per query identica
    })

    if (!res.ok) return NextResponse.json({ products: [] })

    const data = await res.json()

    type RawProduct = {
      product_name?: string
      nutriments?: Record<string, number>
    }

    // Filtra prodotti senza nome o kcal, normalizza, max 6
    const products = (data.products as RawProduct[] ?? [])
      .filter(p =>
        p.product_name &&
        p.nutriments != null &&
        // accetta sia energy-kcal_100g che energy_kcal_100g (varianti OFF)
        (p.nutriments['energy-kcal_100g'] != null || p.nutriments['energy_kcal_100g'] != null)
      )
      .slice(0, 6)
      .map((p, i) => {
        const nut = p.nutriments!
        const kcalPer100 =
          nut['energy-kcal_100g'] ?? nut['energy_kcal_100g'] ??
          Math.round((nut['energy_100g'] ?? 0) / 4.184)

        return {
          id:   String(i),
          name: p.product_name,
          kcal: Math.round(kcalPer100),
          p:    Math.round((nut['proteins_100g']      ?? 0) * 10) / 10,
          c:    Math.round((nut['carbohydrates_100g'] ?? 0) * 10) / 10,
          f:    Math.round((nut['fat_100g']           ?? 0) * 10) / 10,
        }
      })

    return NextResponse.json({ products })
  } catch (err) {
    console.error('[food-search] error:', err)
    return NextResponse.json({ products: [] })
  }
}

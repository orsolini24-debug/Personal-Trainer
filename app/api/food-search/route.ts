import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/food-search?q=<query>
 *
 * Proxy server-side verso OpenFoodFacts v2 API.
 * Restituisce max 6 prodotti con nome + macro per 100 g.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ products: [] })

  try {
    // v2 API — più affidabile del vecchio search.pl
    const url =
      `https://world.openfoodfacts.org/api/v2/search` +
      `?search_terms=${encodeURIComponent(q)}` +
      `&fields=product_name,nutriments` +
      `&page_size=15` +
      `&sort_by=unique_scans_n`   // prodotti più scansionati prima (più affidabili)

    console.log('[food-search] fetching:', url)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    let res: Response
    try {
      res = await fetch(url, {
        headers: {
          'User-Agent': 'PerformanceEcosystem/1.0 (orsolini24@gmail.com)',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        // NO next.revalidate — evita cache stale che nasconde errori
      })
    } finally {
      clearTimeout(timeout)
    }

    console.log('[food-search] OFF status:', res.status)

    if (!res.ok) {
      console.error('[food-search] OFF non-ok:', res.status, res.statusText)
      return NextResponse.json({ products: [] })
    }

    const data = await res.json()
    console.log('[food-search] OFF products count:', data.products?.length ?? 0)

    type RawProduct = {
      product_name?: string
      nutriments?: Record<string, number | undefined>
    }

    const raw: RawProduct[] = data.products ?? []

    // Più permissivo: accetta qualsiasi prodotto con nome
    // Se manca kcal, calcoliamo da kJ o mettiamo 0
    const products = raw
      .filter(p => p.product_name && p.product_name.trim().length > 0)
      .slice(0, 6)
      .map((p, i) => {
        const nut = p.nutriments ?? {}
        const kcalRaw =
          (nut['energy-kcal_100g'] as number | undefined) ??
          (nut['energy_kcal_100g'] as number | undefined) ??
          Math.round(((nut['energy_100g'] as number | undefined) ?? 0) / 4.184)

        return {
          id:   String(i),
          name: p.product_name!.trim(),
          kcal: Math.round(kcalRaw),
          p:    Math.round(((nut['proteins_100g']      as number | undefined) ?? 0) * 10) / 10,
          c:    Math.round(((nut['carbohydrates_100g'] as number | undefined) ?? 0) * 10) / 10,
          f:    Math.round(((nut['fat_100g']           as number | undefined) ?? 0) * 10) / 10,
        }
      })

    console.log('[food-search] returning', products.length, 'products')
    return NextResponse.json({ products })

  } catch (err) {
    console.error('[food-search] exception:', err)
    return NextResponse.json({ products: [] })
  }
}

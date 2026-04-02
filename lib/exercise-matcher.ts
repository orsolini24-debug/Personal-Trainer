/**
 * exercise-matcher.ts
 * Matches AI-generated exercise names to ExerciseDefinition records.
 *
 * Strategy (in order of priority):
 *   1. Exact match after normalization
 *   2. Library name contained inside AI name (longest match wins)
 *   3. AI name contained inside library name
 *
 * Normalization strips articles, equipment words and accents so that
 * "Squat al bilanciere" matches "Squat", "Panca piana con manubri" matches
 * "Panca Manubri", etc.
 */

import { prisma } from '@/lib/prisma'

// ─── Normalization ────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // Italian articles / prepositions
  'al', 'allo', 'alla', 'alle', 'agli', 'ai',
  'con', 'col', 'coi',
  'del', 'dello', 'della', 'delle', 'degli', 'dei',
  'dal', 'dallo', 'dalla', 'dalle', 'dagli', 'dai',
  'il', 'lo', 'la', 'le', 'gli', 'i',
  'un', 'uno', 'una',
  'di', 'da', 'in', 'su', 'per', 'a', 'e',
  // English articles
  'the', 'a', 'an', 'with', 'on', 'at', 'of',
  // Common equipment words (already encoded in nameIt)
  'bilanciere', 'manubri', 'manubrio', 'kettlebell',
  'cavo', 'cavi', 'macchina', 'barra', 'sbarra',
  'banda', 'elastico', 'corporelibero', 'bodyweight',
  'smith', 'parallele', 'sbarra',
])

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    // Remove accents: è→e, à→a, etc.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove punctuation
    .replace(/[^a-z0-9\s]/g, ' ')
    // Tokenize, filter stop words, rejoin
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t))
    .join(' ')
    .trim()
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Given a list of AI-generated exercise names, returns a mapping
 *   { originalName → ExerciseDefinition.id }
 * for every name that could be matched. Unmatched names are omitted.
 *
 * Fetches the library in a single DB call so this is safe to call once
 * per plan creation (not per exercise).
 */
export async function matchExerciseNames(
  names: string[]
): Promise<Record<string, string>> {
  if (names.length === 0) return {}

  const library = await prisma.exerciseDefinition.findMany({
    select: { id: true, name: true, nameIt: true },
  })

  // Build normalized index: normalizedKey → id
  // If two entries normalize to the same key, last writer wins (acceptable)
  const index = new Map<string, string>()
  for (const ex of library) {
    const normName = normalize(ex.name)
    if (normName) index.set(normName, ex.id)
    if (ex.nameIt && ex.nameIt !== ex.name) {
      const normIt = normalize(ex.nameIt)
      if (normIt) index.set(normIt, ex.id)
    }
  }

  const result: Record<string, string> = {}

  for (const name of names) {
    const normInput = normalize(name)
    if (!normInput) continue

    // 1 — Exact match
    if (index.has(normInput)) {
      result[name] = index.get(normInput)!
      continue
    }

    // 2 — Library key contained inside AI name (longest key wins to avoid
    //     "curl" matching "curl bilanciere" when "curl bilanciere" is more specific)
    let bestId: string | null = null
    let bestLen = 0
    for (const [libKey, id] of index) {
      if (normInput.includes(libKey) && libKey.length > bestLen) {
        bestId = id
        bestLen = libKey.length
      }
    }
    if (bestId) {
      result[name] = bestId
      continue
    }

    // 3 — AI name contained inside library key
    for (const [libKey, id] of index) {
      if (libKey.includes(normInput) && normInput.length > 3) {
        result[name] = id
        break
      }
    }

    // No match → exerciseDefId stays null (graceful degradation)
  }

  return result
}

/**
 * Shared plan utilities — single source of truth for day label sanitization.
 * Used by: deep-onboarding.ts, import-analysis.ts, plan-wizard.ts
 */

export type SessionType = 'A' | 'B' | 'C' | 'D' | 'V1' | 'V2' | 'OUTDOOR' | 'OTHER'

export const VALID_DAY_LABELS: SessionType[] = ['A', 'B', 'C', 'D', 'V1', 'V2', 'OUTDOOR']

/** Maps non-standard AI-generated labels to valid SessionType values */
const DAY_NAME_MAP: Record<string, SessionType> = {
  // Extra letters the AI sometimes generates for 5-7 day plans
  'E': 'V1',
  'F': 'V2',
  'G': 'OUTDOOR',
  'H': 'OTHER',
  // Italian day names
  'LUNEDÌ': 'A', 'LUNEDI': 'A',
  'MARTEDÌ': 'B', 'MARTEDI': 'B',
  'MERCOLEDÌ': 'C', 'MERCOLEDI': 'C',
  'GIOVEDÌ': 'D', 'GIOVEDI': 'D',
  'VENERDÌ': 'V1', 'VENERDI': 'V1',
  'SABATO': 'V2',
  'DOMENICA': 'OUTDOOR',
  // English day names
  'MONDAY': 'A',
  'TUESDAY': 'B',
  'WEDNESDAY': 'C',
  'THURSDAY': 'D',
  'FRIDAY': 'V1',
  'SATURDAY': 'V2',
  'SUNDAY': 'OUTDOOR',
  // Verbose labels
  'DAY1': 'A', 'DAY 1': 'A', 'GIORNO1': 'A', 'GIORNO 1': 'A',
  'DAY2': 'B', 'DAY 2': 'B', 'GIORNO2': 'B', 'GIORNO 2': 'B',
  'DAY3': 'C', 'DAY 3': 'C', 'GIORNO3': 'C', 'GIORNO 3': 'C',
  'DAY4': 'D', 'DAY 4': 'D', 'GIORNO4': 'D', 'GIORNO 4': 'D',
  'DAY5': 'V1', 'DAY 5': 'V1', 'GIORNO5': 'V1', 'GIORNO 5': 'V1',
  'DAY6': 'V2', 'DAY 6': 'V2', 'GIORNO6': 'V2', 'GIORNO 6': 'V2',
  'DAY7': 'OUTDOOR', 'DAY 7': 'OUTDOOR',
}

/**
 * Converts any string to a valid SessionType.
 * @param raw   The raw value from AI output or JSON
 * @param index Fallback position index (used when value is unrecognised)
 */
export function sanitizeDayLabel(raw: string | undefined, index: number): SessionType {
  const val = (raw ?? '').toString().toUpperCase().trim()
  if (VALID_DAY_LABELS.includes(val as SessionType)) return val as SessionType
  if (DAY_NAME_MAP[val]) return DAY_NAME_MAP[val]
  // Last resort: cycle through valid labels based on position
  return VALID_DAY_LABELS[index % VALID_DAY_LABELS.length] ?? 'A'
}

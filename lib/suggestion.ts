export interface SuggestionResult {
  suggestedWeight: number
  rationale: string
}

export function computeSuggestion(
  lastWeight: number,
  lastReps: number | null,
  lastRir: number | null,
  targetRir: number,
  repsMin: number,
  repsMax: number,
  feelingScore: number | null
): SuggestionResult {
  const actualRir = lastRir ?? targetRir
  const feeling = feelingScore ?? 3
  let suggestedWeight = lastWeight
  let rationale = ''

  if (feeling <= 2) {
    suggestedWeight = Math.round(lastWeight * 0.95 / 2.5) * 2.5
    rationale = 'Recupero conservativo — sessione precedente difficile'
  } else if (actualRir > targetRir + 1) {
    const increment = lastWeight >= 60 ? 5 : 2.5
    suggestedWeight = lastWeight + increment
    rationale = `Margine RIR disponibile (${actualRir}→${targetRir}): +${increment}kg`
  } else if (actualRir < targetRir - 1) {
    suggestedWeight = Math.round(lastWeight * 0.975 / 2.5) * 2.5
    rationale = 'Riduzione lieve per rispettare il target RIR'
  } else if (feeling >= 4) {
    suggestedWeight = lastWeight + 2.5
    rationale = 'Sessione fluida → progressione lineare +2.5kg'
  } else {
    suggestedWeight = lastWeight
    rationale = `Mantieni ${lastWeight}kg, ottimizza la tecnica`
  }

  return { suggestedWeight, rationale }
}

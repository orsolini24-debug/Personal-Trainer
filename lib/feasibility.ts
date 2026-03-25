/**
 * FEASIBILITY ENGINE
 * ==================
 * Evaluates whether a user's stated objective is achievable given:
 *   - Current fitness level & biometric state
 *   - Available training time (days/week + hours/session)
 *   - Grit score (0–100, from psychophysical audit)
 *   - Constraints (injuries, age, experience, time to target date)
 *   - Objective type and required adaptations
 *
 * Returns:
 *   - Feasibility score 0–100
 *   - If FEASIBLE: selected Titan profiles + fusion weights
 *   - If NOT FEASIBLE: explanation + 3 calibrated alternatives (easier / similar / harder)
 *   - IMPOSSIBLE detection: goals that are fundamentally unachievable for non-elite amateurs
 */

import { getTitansForObjective, buildFusionWeights, getTitanById, titanProfiles } from './titans-db'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ObjectiveType =
  | 'STRENGTH'
  | 'HYPERTROPHY'
  | 'ENDURANCE'
  | 'WEIGHT_LOSS'
  | 'WEIGHT_GAIN'
  | 'BODY_RECOMPOSITION'
  | 'SPORT_PERFORMANCE'
  | 'RACE_PREP'
  | 'MOBILITY'
  | 'INJURY_PREVENTION'
  | 'CUSTOM'

export interface FeasibilityInput {
  // Objective
  objectiveType: ObjectiveType
  objectiveDescription: string          // e.g. "run a sub-3h marathon"
  targetValue?: number                  // e.g. 3.0 (hours) or 100 (kg squat)
  currentValue?: number                 // e.g. 3.5 (hours) or 60 (kg squat)
  unit?: string                         // e.g. "hours", "kg", "km"
  weeksAvailable: number                // weeks until target date

  // User state
  experienceYears: number               // total training years (0 = untrained)
  trainingDaysPerWeek: number           // realistic days available
  hoursPerSession: number               // realistic time per session
  gritScore: number                     // 0–100 from audit
  ageYears?: number
  biologicalSex?: 'male' | 'female' | 'other'
  bodyFatPct?: number
  weightKg?: number

  // Constraints
  activeInjuries?: string[]             // e.g. ["hamstring", "knee"]
  hasGymAccess?: boolean
  hasCoach?: boolean
  sleepHoursAvg?: number                // average nightly sleep
  nutritionCompliance?: number          // 0–100 self-reported
}

export interface AlternativeObjective {
  label: string                         // e.g. "Sub 3:30 marathon"
  description: string
  feasibilityScore: number
  requiredWeeks: number
  mainSacrifice: string                 // what you have to give up
}

export interface FeasibilityResult {
  score: number                         // 0–100
  isFeasible: boolean                   // score >= FEASIBILITY_THRESHOLD
  isImpossible: boolean                 // fundamentally not achievable (pro-level, physics, etc.)

  // If feasible
  selectedTitanIds?: string[]
  fusionWeights?: Record<string, number>
  rationale?: string

  // If not feasible or impossible
  explanation?: string
  limitingFactors?: string[]
  alternatives?: AlternativeObjective[] // 3 options: easier / similar / harder

  // Always present
  warnings: string[]                    // non-blocking concerns
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FEASIBILITY_THRESHOLD = 55 // minimum score to generate a plan

/** Goals that are fundamentally impossible for non-elite amateurs */
const IMPOSSIBLE_GOALS = [
  { pattern: /ballon.?d.?or/i, reason: 'Il Pallone d\'Oro richiede di essere un calciatore professionista d\'élite mondiale. Non è un obiettivo di allenamento personale.' },
  { pattern: /world.?(record|record mondiale)/i, reason: 'I record mondiali richiedono genetica, decenni di preparazione e talento d\'élite che non sono controllabili.' },
  { pattern: /olimpi(c|a|adi)/i, reason: 'La qualificazione olimpica richiede anni di percorso federativo. Non è un obiettivo di 4-16 settimane.' },
  { pattern: /nba|serie a|champions league/i, reason: 'Giocare in leghe professionistiche richiede un percorso di carriera, non un piano di allenamento.' },
  { pattern: /sub.?2.*(maratona|marathon)/i, reason: 'Una maratona sub-2h richiede caratteristiche fisiologiche di élite assoluta (VO2max 85+). Solo 1 persona l\'ha mai fatto in condizioni controllate.' },
]

// ─── OBJECTIVE-SPECIFIC SCORING RULES ────────────────────────────────────────

interface ObjectiveRule {
  minWeeks: number
  minDaysPerWeek: number
  minGrit: number
  minExperienceYears: number
  injuryBlockers: string[]   // injuries that block this objective
  titanIds: string[]          // compatible Titan profiles
  adaptationRate: number      // realistic % improvement per week
  description: string
}

const OBJECTIVE_RULES: Partial<Record<ObjectiveType, ObjectiveRule>> = {
  STRENGTH: {
    minWeeks: 8,
    minDaysPerWeek: 2,
    minGrit: 30,
    minExperienceYears: 0,
    injuryBlockers: [],
    titanIds: ['P27', 'P34', 'P36'],
    adaptationRate: 2.5,  // ~2.5% per week for novice, less for advanced
    description: 'Aumento della forza massimale (1RM)',
  },
  HYPERTROPHY: {
    minWeeks: 10,
    minDaysPerWeek: 3,
    minGrit: 35,
    minExperienceYears: 0,
    injuryBlockers: [],
    titanIds: ['P27', 'P34', 'P32'],
    adaptationRate: 0.5,  // ~0.5% body mass/week (lean)
    description: 'Aumento massa muscolare',
  },
  ENDURANCE: {
    minWeeks: 8,
    minDaysPerWeek: 3,
    minGrit: 30,
    minExperienceYears: 0,
    injuryBlockers: ['knee', 'shin', 'foot'],
    titanIds: ['P14', 'P16', 'P05'],
    adaptationRate: 1.5,
    description: 'Miglioramento capacità aerobica / resistenza',
  },
  RACE_PREP: {
    minWeeks: 12,
    minDaysPerWeek: 4,
    minGrit: 45,
    minExperienceYears: 1,
    injuryBlockers: ['knee', 'shin', 'achilles', 'hamstring'],
    titanIds: ['P13', 'P14', 'P16', 'P05'],
    adaptationRate: 1.0,
    description: 'Preparazione gara (running / endurance)',
  },
  SPORT_PERFORMANCE: {
    minWeeks: 12,
    minDaysPerWeek: 4,
    minGrit: 50,
    minExperienceYears: 0,
    injuryBlockers: [],
    titanIds: ['P01', 'P03', 'P05', 'P08'],
    adaptationRate: 1.5,
    description: 'Miglioramento performance sportiva specifica',
  },
  WEIGHT_LOSS: {
    minWeeks: 8,
    minDaysPerWeek: 3,
    minGrit: 25,
    minExperienceYears: 0,
    injuryBlockers: [],
    titanIds: ['P16', 'P05', 'P14'],
    adaptationRate: 0.5,  // ~0.5kg/week sustainable fat loss
    description: 'Dimagrimento / riduzione massa grassa',
  },
  WEIGHT_GAIN: {
    minWeeks: 12,
    minDaysPerWeek: 3,
    minGrit: 25,
    minExperienceYears: 0,
    injuryBlockers: [],
    titanIds: ['P27', 'P34'],
    adaptationRate: 0.25,  // ~0.25kg/week lean mass
    description: 'Aumento peso / massa muscolare',
  },
  BODY_RECOMPOSITION: {
    minWeeks: 16,
    minDaysPerWeek: 4,
    minGrit: 50,
    minExperienceYears: 0.5,
    injuryBlockers: [],
    titanIds: ['P27', 'P16', 'P47'],
    adaptationRate: 0.3,
    description: 'Ricomposizione corporea (perdi grasso + guadagna muscolo)',
  },
  INJURY_PREVENTION: {
    minWeeks: 6,
    minDaysPerWeek: 2,
    minGrit: 20,
    minExperienceYears: 0,
    injuryBlockers: [],
    titanIds: ['P49', 'P50', 'P48', 'P05'],
    adaptationRate: 2.0,
    description: 'Prevenzione infortuni / prehab',
  },
  MOBILITY: {
    minWeeks: 6,
    minDaysPerWeek: 3,
    minGrit: 20,
    minExperienceYears: 0,
    injuryBlockers: [],
    titanIds: ['P48', 'P49'],
    adaptationRate: 2.0,
    description: 'Miglioramento mobilità / flessibilità',
  },
}

// ─── CORE FEASIBILITY SCORER ──────────────────────────────────────────────────

export function assessFeasibility(input: FeasibilityInput): FeasibilityResult {
  const warnings: string[] = []

  // ── 1. Impossibility Check ──────────────────────────────────────────────────
  for (const impossible of IMPOSSIBLE_GOALS) {
    if (impossible.pattern.test(input.objectiveDescription)) {
      return {
        score: 0,
        isFeasible: false,
        isImpossible: true,
        explanation: impossible.reason,
        limitingFactors: ['Obiettivo strutturalmente fuori portata per un atleta non professionista'],
        alternatives: generateAlternatives(input, 0),
        warnings,
      }
    }
  }

  // ── 2. Get Rules for Objective Type ────────────────────────────────────────
  const rules = OBJECTIVE_RULES[input.objectiveType]
  if (!rules) {
    // CUSTOM objective: basic scoring only
    return assessCustomObjective(input, warnings)
  }

  let score = 100
  const limitingFactors: string[] = []

  // ── 3. Time Availability ────────────────────────────────────────────────────
  if (input.weeksAvailable < rules.minWeeks) {
    const timePenalty = Math.round(((rules.minWeeks - input.weeksAvailable) / rules.minWeeks) * 40)
    score -= timePenalty
    limitingFactors.push(`Tempo insufficiente: servono almeno ${rules.minWeeks} settimane, disponibili ${input.weeksAvailable}`)
  }

  if (input.trainingDaysPerWeek < rules.minDaysPerWeek) {
    const dayPenalty = Math.round(((rules.minDaysPerWeek - input.trainingDaysPerWeek) / rules.minDaysPerWeek) * 25)
    score -= dayPenalty
    limitingFactors.push(`Giorni di allenamento insufficienti: servono ${rules.minDaysPerWeek}/settimana, disponibili ${input.trainingDaysPerWeek}`)
  }

  // ── 4. Grit / Motivation ────────────────────────────────────────────────────
  if (input.gritScore < rules.minGrit) {
    const gritPenalty = Math.round(((rules.minGrit - input.gritScore) / rules.minGrit) * 15)
    score -= gritPenalty
    warnings.push(`Motivazione/grit potrebbe essere un freno: obiettivo richiede grit score ≥${rules.minGrit}, rilevato ${input.gritScore}`)
  }

  // ── 5. Experience / Base Fitness ────────────────────────────────────────────
  if (input.experienceYears < rules.minExperienceYears) {
    const expPenalty = Math.round(((rules.minExperienceYears - input.experienceYears) / Math.max(rules.minExperienceYears, 1)) * 15)
    score -= expPenalty
    limitingFactors.push(`Base di allenamento insufficiente: servono almeno ${rules.minExperienceYears} anni di esperienza`)
  }

  // ── 6. Injury Conflicts ─────────────────────────────────────────────────────
  const blockingInjuries = (input.activeInjuries ?? []).filter(injury =>
    rules.injuryBlockers.some(blocker => injury.toLowerCase().includes(blocker))
  )
  if (blockingInjuries.length > 0) {
    score -= blockingInjuries.length * 20
    limitingFactors.push(`Infortuni attivi incompatibili: ${blockingInjuries.join(', ')}`)
  }

  // ── 7. Delta to Target ──────────────────────────────────────────────────────
  if (input.currentValue !== undefined && input.targetValue !== undefined && input.currentValue > 0) {
    const deltaPercent = Math.abs(input.targetValue - input.currentValue) / input.currentValue * 100
    const maxAchievable = rules.adaptationRate * input.weeksAvailable
    if (deltaPercent > maxAchievable * 1.5) {
      const deltaPenalty = Math.min(30, Math.round((deltaPercent - maxAchievable) / maxAchievable * 20))
      score -= deltaPenalty
      limitingFactors.push(`Salto richiesto troppo elevato: ${deltaPercent.toFixed(0)}% di miglioramento in ${input.weeksAvailable} settimane (stimato fattibile: ${maxAchievable.toFixed(0)}%)`)
    }
  }

  // ── 8. Recovery / Sleep ─────────────────────────────────────────────────────
  if (input.sleepHoursAvg !== undefined && input.sleepHoursAvg < 6) {
    score -= 10
    warnings.push('Sonno insufficiente (< 6h): gli adattamenti saranno compromessi')
  }

  if (input.nutritionCompliance !== undefined && input.nutritionCompliance < 40) {
    score -= 10
    warnings.push('Compliance nutrizionale bassa: i risultati saranno significativamente ridotti')
  }

  // ── 9. Age Adjustment ───────────────────────────────────────────────────────
  if (input.ageYears !== undefined) {
    if (input.ageYears > 60 && ['HYPERTROPHY', 'STRENGTH', 'RACE_PREP'].includes(input.objectiveType)) {
      score -= 5
      warnings.push('Over 60: progressione più lenta richiesta; priorità a recupero e prehab')
    }
    if (input.ageYears < 16) {
      warnings.push('Under 16: protocolli specifici per crescita; evitare carichi massimali')
    }
  }

  // ── 10. Female-specific ─────────────────────────────────────────────────────
  if (input.biologicalSex === 'female' && !rules.titanIds.includes('P47')) {
    warnings.push('Atleta donna: considera di integrare i principi di fisiologia femminile (P47 - Dr. Stacy Sims)')
  }

  score = Math.max(0, Math.min(100, score))

  // ── 11. Build Result ────────────────────────────────────────────────────────
  const isFeasible = score >= FEASIBILITY_THRESHOLD

  let selectedTitanIds: string[] | undefined
  let fusionWeights: Record<string, number> | undefined
  let rationale: string | undefined

  if (isFeasible) {
    // Add P47 for female athletes
    let ids = [...rules.titanIds]
    if (input.biologicalSex === 'female' && !ids.includes('P47')) {
      ids.push('P47')
    }
    // Add P05 (load management) if not present
    if (!ids.includes('P05')) {
      ids.push('P05')
    }
    // Add prehab if active injuries
    if ((input.activeInjuries ?? []).length > 0) {
      if (!ids.includes('P49')) ids.push('P49')
      if (!ids.includes('P48')) ids.push('P48')
    }

    selectedTitanIds = ids
    fusionWeights = buildFusionWeights(ids)
    rationale = `Piano fattibile con score ${score}/100. ${limitingFactors.length > 0 ? 'Attenzione a: ' + limitingFactors.join('; ') + '.' : 'Ottimo profilo per l\'obiettivo selezionato.'}`
  }

  return {
    score,
    isFeasible,
    isImpossible: false,
    selectedTitanIds,
    fusionWeights,
    rationale,
    explanation: !isFeasible ? buildExplanation(limitingFactors) : undefined,
    limitingFactors: limitingFactors.length > 0 ? limitingFactors : undefined,
    alternatives: !isFeasible ? generateAlternatives(input, score) : undefined,
    warnings,
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function assessCustomObjective(input: FeasibilityInput, warnings: string[]): FeasibilityResult {
  // Generic scoring for custom objectives
  let score = 70
  if (input.weeksAvailable < 8) score -= 20
  if (input.trainingDaysPerWeek < 3) score -= 15
  if ((input.activeInjuries ?? []).length > 0) score -= 10
  score = Math.max(0, Math.min(100, score))

  const isFeasible = score >= FEASIBILITY_THRESHOLD
  const titanIds = getTitansForObjective(input.objectiveDescription)
    .slice(0, 4)
    .map(t => t.id)

  return {
    score,
    isFeasible,
    isImpossible: false,
    selectedTitanIds: isFeasible ? (titanIds.length > 0 ? titanIds : ['P05', 'P34']) : undefined,
    fusionWeights: isFeasible ? buildFusionWeights(titanIds.length > 0 ? titanIds : ['P05', 'P34']) : undefined,
    alternatives: !isFeasible ? generateAlternatives(input, score) : undefined,
    warnings,
  }
}

function buildExplanation(limitingFactors: string[]): string {
  if (limitingFactors.length === 0) {
    return 'L\'obiettivo non raggiunge la soglia di fattibilità minima. Considera le alternative proposte.'
  }
  return `L'obiettivo non è raggiungibile nelle condizioni attuali. Fattori limitanti:\n${limitingFactors.map(f => `• ${f}`).join('\n')}`
}

function generateAlternatives(input: FeasibilityInput, currentScore: number): AlternativeObjective[] {
  const alternatives: AlternativeObjective[] = []
  const weeksNeeded = OBJECTIVE_RULES[input.objectiveType]?.minWeeks ?? 12
  const daysNeeded = OBJECTIVE_RULES[input.objectiveType]?.minDaysPerWeek ?? 3

  // Alternative 1: EASIER — reduce target, shorter timeline
  alternatives.push({
    label: `Versione accessibile dell'obiettivo`,
    description: getEasierVersion(input),
    feasibilityScore: Math.min(95, currentScore + 30),
    requiredWeeks: Math.max(6, weeksNeeded - 4),
    mainSacrifice: 'Riduzione dell\'ambizione del target; più accessibile per il tuo livello attuale',
  })

  // Alternative 2: SIMILAR — same goal but with extended timeline
  alternatives.push({
    label: `Stesso obiettivo, timeline estesa`,
    description: `${input.objectiveDescription} con ${input.weeksAvailable + 8} settimane invece di ${input.weeksAvailable}`,
    feasibilityScore: Math.min(90, currentScore + 20),
    requiredWeeks: input.weeksAvailable + 8,
    mainSacrifice: 'Più pazienza richiesta; il target rimane lo stesso ma con margine temporale maggiore',
  })

  // Alternative 3: HARDER — aspirational but realistic with right conditions
  alternatives.push({
    label: `Obiettivo ambizioso (con le condizioni giuste)`,
    description: getAmbitiousVersion(input),
    feasibilityScore: Math.min(75, currentScore + 10),
    requiredWeeks: weeksNeeded + 8,
    mainSacrifice: `${daysNeeded + 1} giorni/settimana richiesti; massima compliance nutrizionale; coach consigliato`,
  })

  return alternatives
}

function getEasierVersion(input: FeasibilityInput): string {
  const easyVersions: Partial<Record<ObjectiveType, string>> = {
    RACE_PREP: input.objectiveDescription.includes('maratona')
      ? 'Prepara una mezza maratona in modo solido e sano'
      : 'Corri la stessa distanza senza obiettivo di tempo; completa e goditi la gara',
    STRENGTH: 'Costruisci una solida base di forza su squat, deadlift e press (+10–15% in 8 settimane)',
    HYPERTROPHY: 'Guadagna 1–2 kg di massa magra in 12 settimane con progressione lineare',
    ENDURANCE: 'Migliora il tuo VO2max del 5–10% in 8 settimane con allenamento polarizzato',
    SPORT_PERFORMANCE: 'Migliora la tua condizione fisica generale per il tuo sport in 10 settimane',
    WEIGHT_LOSS: 'Perdi 2–3 kg di grasso in 8 settimane con deficit calorico moderato',
  }
  return easyVersions[input.objectiveType] ?? `Una versione più accessibile di "${input.objectiveDescription}" in un arco temporale ridotto`
}

function getAmbitiousVersion(input: FeasibilityInput): string {
  const ambitiousVersions: Partial<Record<ObjectiveType, string>> = {
    RACE_PREP: 'Con 20+ settimane, 5 uscite/settimana e piano nutrizionale: stessa gara con target ambizioso',
    STRENGTH: 'Con 16 settimane e 4 sessioni/settimana: periodizzazione completa e picco di forza per gara',
    HYPERTROPHY: 'Con 20 settimane, 4 sessioni + dieta ottimizzata: trasformazione corporea significativa',
    ENDURANCE: 'Con un macrociclo completo (20+ sett.) e sonno ottimizzato: il tuo potenziale reale',
    SPORT_PERFORMANCE: 'Con una preparazione strutturata su 20 settimane: performance di livello agonistico reale',
    WEIGHT_LOSS: 'Con 16 settimane, dieta ottimizzata e 4–5 sessioni: ricomposizione corporea completa',
  }
  return ambitiousVersions[input.objectiveType] ?? `"${input.objectiveDescription}" con condizioni ottimali (5 giorni/sett., nutrizione pro, coach)`
}

// ─── PLAN SELECTOR ────────────────────────────────────────────────────────────

/**
 * Given a feasibility result, return a summary prompt context for plan generation.
 * This gets injected into the plan-wizard generatePlanFromWizard prompt.
 */
export function buildTitanContextForPrompt(result: FeasibilityResult): string {
  if (!result.isFeasible || !result.selectedTitanIds) {
    return 'Piano non generabile: obiettivo non fattibile.'
  }

  const profiles = result.selectedTitanIds
    .map(id => getTitanById(id))
    .filter(Boolean)

  const lines: string[] = [
    `## Titan Fusion (score: ${result.score}/100)`,
    '',
    '### Coach/Metodologi selezionati e pesi:',
  ]

  for (const p of profiles) {
    if (!p) continue
    const weight = result.fusionWeights?.[p.id] ?? p.fusionWeight.recommendedPercent
    lines.push(`- **${p.name}** (${p.id}, ${weight}%): ${p.methodology.observablePrinciples[0]}`)
  }

  lines.push('')
  lines.push('### Regole di carico da rispettare:')
  for (const p of profiles) {
    if (!p) continue
    lines.push(`**${p.name}**: ${p.load.rules[0]}`)
  }

  lines.push('')
  lines.push('### Red flags da monitorare:')
  for (const p of profiles) {
    if (!p) continue
    const flag = p.redFlags[0]
    if (flag) lines.push(`- [${p.name}] Se "${flag.trigger}" → ${flag.action}`)
  }

  if (result.warnings.length > 0) {
    lines.push('')
    lines.push('### Warning:')
    for (const w of result.warnings) lines.push(`- ${w}`)
  }

  return lines.join('\n')
}

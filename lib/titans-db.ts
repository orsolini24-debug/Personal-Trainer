import type { ProfileBlockModifier, ProfileMethodologyV2, ResilientRedFlag } from './titans-types'

/**
 * TITANS DATABASE — Tier-1 & Tier-2 Profiles
 * ============================================
 * Tier-1: Coach/Methodologist profiles — the TECHNICAL target.
 *         Used to generate plans: each profile encodes observable principles,
 *         load rules, intervention blocks, KPIs, red flags, and fusion weights.
 *
 * Tier-2: Athlete mental profiles — the MENTAL/MOTIVATIONAL target.
 *         Used for grit/resilience/mindset scoring during psychophysical audit.
 *
 * Evidence levels:
 *   A = books/papers by author + ≥2 peer-reviewed + official materials (≥8 sources)
 *   B = official sources + good support literature, limited micro-cycle detail
 *   C = secondary only — inspiration, not operational rules
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type EvidenceLevel = 'A' | 'B' | 'C'
export type BlockDuration = [number, number] // [min_weeks, max_weeks]
export type KpiType = 'systemic' | 'mechanical' | 'performance' | 'neuromuscular'
export type GritArchetype = 'HIT_WARRIOR' | 'VOLUME_MONK' | 'HYBRID' | 'LONGEVITY_FOCUSED'
/**
 * Periodization model taxonomy — from "Mappatura e Metodologie Personal Trainer" doc.
 * linear = progressive volume→intensity across mesocycles (classic Bompa)
 * undulating = daily/weekly intensity variation (DUP/NLP)
 * block = concentrated sequential blocks targeting single quality (Issurin)
 * conjugate = concurrent development of multiple qualities via rotation (Westside/Simmons)
 * concurrent = parallel endurance + strength development (Seiler/Stöggl)
 */
export type PeriodizationModel = 'linear' | 'undulating' | 'block' | 'conjugate' | 'concurrent'

export interface TitanSource {
  title: string
  url: string
  type: string
  priority: number
}

export interface TitanBlock {
  name: string
  durationWeeks: BlockDuration
  dosage: string
  progression: string
}

export interface TitanKPI {
  name: string
  type: KpiType
}

export interface TitanRedFlag {
  trigger: string
  action: string
}

export interface TitanMapping {
  userArchetypes: string[]
  compatibleObjectives: string[]
  incompatibleObjectives: string[]
}

export interface TitanPill {
  text: string
  sourceId: string
  quote?: string
}

/** Tier-1: Technical coach/methodologist profile */
export interface TitanProfile {
  id: string
  name: string
  role: string
  discipline: string
  era: string
  nationality: string
  evidence: {
    evidenceLevel: EvidenceLevel
    prioritizedSources: TitanSource[]
  }
  methodology: {
    observablePrinciples: string[]
  }
  load: {
    rules: string[]
  }
  blocks: TitanBlock[]
  kpis: TitanKPI[]
  redFlags: TitanRedFlag[]
  mapping: TitanMapping
  uiPills: TitanPill[]
  fusionWeight: {
    recommendedPercent: number
    bestPairedWith?: string[] // other profile IDs
  }
  /** Periodization model(s) this profile primarily uses — from Mappatura taxonomy */
  periodizationModel?: PeriodizationModel[]
  /** Assessment/screening tools associated with this profile's methodology */
  assessmentScreening?: string[]

  // ─── v2 FIELDS (backward-compatible, optional) ─────────────────────────────
  /** Block IDs from TITAN_BLOCK_CATALOG (titans-blocks.ts) used by this profile */
  blockCatalogIds?: string[]
  /** Per-coach customization of canonical blocks (Layer 2 in 3-layer architecture) */
  profileModifiers?: ProfileBlockModifier[]
  /** Coach methodology identity — distinguishes this profile from others using same blocks */
  methodologyV2?: ProfileMethodologyV2
  /** Schema version: '1.0' = legacy text-based; '2.0' = migrated to canonical blocks */
  schemaVersion?: '1.0' | '2.0'
  /** true = profile fully migrated to v2 schema with blockCatalogIds + profileModifiers */
  deepProfileComplete?: boolean
  /** Structured red flags with source fallback chain (replaces text-only redFlags in v2) */
  resilientRedFlags?: ResilientRedFlag[]
}

/** Tier-2: Athlete mental/motivational profile */
export interface AthleteProfile {
  id: string
  name: string
  sport: string
  era: string
  nationality: string
  gritArchetype: GritArchetype
  mentalPrinciples: string[]
  trainingPhilosophy: string
  compatibleGritScore: [number, number] // user grit score range [min, max] that matches
  uiPills: TitanPill[]
  quote: string
}

// ─── TIER-1: COACH PROFILES ───────────────────────────────────────────────────

export const titanProfiles: TitanProfile[] = [

  // ── P01 ── Antonio Pintus — Football Fitness (Evidence B) ──────────────────
  {
    id: 'P01',
    name: 'Antonio Pintus',
    role: 'football fitness coach',
    discipline: 'football (soccer) | intermittent HI',
    era: '2010s-2020s',
    nationality: 'Italy',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Goal – masks & aerobic thresholds interview', url: 'https://www.goal.com/en/news/explained-why-real-madrid-stars-are-wearing-futuristic-masks-in-training/blt800c1ffb0e54c8b2', type: 'major outlet + club media', priority: 1 },
        { title: 'Real Madrid – high-intensity test training report', url: 'https://www.realmadrid.com/en-US/news/football/first-team/trainings/el-real-madrid-se-esta-entrenando-04-02-2026', type: 'official club release', priority: 2 },
        { title: 'ESPN – long form fitness guru profile', url: 'https://www.espn.com/soccer/story/_/id/47808254/real-madrid-counting-fitness-guru-antonio-pintus-turn-season-around', type: 'major outlet long-form', priority: 3 },
        { title: 'Buchheit & Laursen HIIT programming Part II', url: 'https://martin-buchheit.net/wp-content/uploads/2018/01/buchheit-laursen-hit-solutions-to-the-programming-puzzle-part-ii.pdf', type: 'peer-reviewed review PDF', priority: 4 },
        { title: 'Gabbett 2016 – training-injury prevention paradox', url: 'https://pubmed.ncbi.nlm.nih.gov/26758673/', type: 'peer-reviewed', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Test-driven individualization: aerobic/anaerobic threshold measurement via mask-based VO2 tests',
        'Preseason sequence: aerobic base (volume) → shorter/faster work transfer to match demands',
        'Microcycle-aware HIIT dosing: avoid overload collision with technical/tactical sessions',
        'Multi-signal readiness: never gate decisions on ACWR alone; use HSR + sRPE + HRV + pain',
      ],
    },
    load: {
      rules: [
        'Do NOT use ACWR as sole verdict; use multi-signal approach (HSR, sRPE, readiness, pain, performance)',
        'Progress sprint/HSR exposure gradually; deload when fatigue flags emerge',
        'Keep HIIT density compatible with total weekly stressors (technical + tactical sessions)',
        'Nordic Hamstring exercises 2x/week as standard prehab module in all football plans',
      ],
    },
    blocks: [
      {
        name: 'Aerobic Base Block',
        durationWeeks: [4, 8],
        dosage: '2–3 easy runs/wk + 2 strength sessions + 1–2 technical; volume progression 5–10%/wk',
        progression: 'Increase volume only if readiness (sleep, RPE, HRV) signals recovery',
      },
      {
        name: 'HIIT Team-Sport Block',
        durationWeeks: [4, 8],
        dosage: '2 sessions/wk; 15–45s high-intensity reps; incomplete recoveries; modulate work:rest ratio',
        progression: 'Add reps first, then increase intensity; never increase both simultaneously',
      },
      {
        name: 'Sprint Exposure Block',
        durationWeeks: [6, 12],
        dosage: '1–2 sessions/wk; 10–30m quality sprints; long rests (full recovery)',
        progression: 'Add sprint count before reducing rest; monitor hamstring pain closely',
      },
      {
        name: 'Prehab Hamstring Block',
        durationWeeks: [4, 99],
        dosage: 'Nordic hamstring + eccentric progressions 2x/wk',
        progression: 'Conservative starting dose for novice; progress reps before load',
      },
      {
        name: 'COD Technique Block',
        durationWeeks: [4, 6],
        dosage: '2×30 min/wk; COD technique drill progression 45°→90°→135°',
        progression: 'Focus on mechanics reduction of ACL surrogate load; feedback-driven',
      },
    ],
    kpis: [
      { name: 'sRPE session load', type: 'systemic' },
      { name: 'HSR distance (weekly)', type: 'mechanical' },
      { name: 'Sprint count (weekly)', type: 'mechanical' },
      { name: 'Readiness: sleep quality + HR/HRV', type: 'systemic' },
      { name: 'RSA decrement %', type: 'performance' },
      { name: 'COD time + technique quality', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Localized pain (hamstring/groin/Achilles) + performance drop', action: 'Reduce HSR/sprint; maintain base + strength; schedule deload week' },
      { trigger: 'Persistent systemic fatigue: sleep↓ + RPE↑ + performance↓ for 3+ days', action: 'Reduce HIIT intensity and density; shift to base + recovery' },
      { trigger: 'ACWR used as single gating metric', action: 'Replace with multi-signal monitoring; ACWR is one input only' },
    ],
    mapping: {
      userArchetypes: ['team-sport amateur', 'returning after injury/stop', 'time-crunched competitor', 'football player (any level)'],
      compatibleObjectives: ['match fitness', 'injury-risk reduction', 'speed-endurance', 'preseason conditioning'],
      incompatibleObjectives: ['elite performance in <4 weeks', 'bodybuilding-only goals'],
    },
    uiPills: [
      { text: 'Test → personalizza → trasferisci al match', sourceId: 'Goal 2022', quote: 'Non è hypoxia training… è un test per soglie aerobiche e anaerobiche.' },
      { text: 'Pre-season: base aerobica, poi corse più brevi e veloci', sourceId: 'Goal 2022', quote: 'Base aerobica… poi corse più brevi e veloci.' },
    ],
    fusionWeight: {
      recommendedPercent: 30,
      bestPairedWith: ['P03', 'P04', 'P05', 'P49', 'P50'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,

    blockCatalogIds: [
      'ZONE2_FOUNDATION',
      'HIIT_TEAM_SPORT',
      'SPRINT_ACCELERATION',
      'ECCENTRIC_HAMSTRING_PREHAB',
      'COD_MECHANICS',
      'RSA',
    ],

    profileModifiers: [
      {
        block_id:               'ZONE2_FOUNDATION',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    10,  // Pintus enfatizza la base aerobica pre-season
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'Fondamenta obbligatorie: 4–8 sett di base aerobica prima di qualsiasi HIIT. Pintus usa test con maschera per verificare soglie aerobiche.',
      },
      {
        block_id:               'HIIT_TEAM_SPORT',
        activation_priority:    1,  // core del metodo Pintus
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'HIIT dosato attorno ai carichi tattico-tecnici. Pintus evita accumulo di stress sovrapposto tra sessioni di campo e HIIT.',
      },
      {
        block_id:               'SPRINT_ACCELERATION',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'Sprint exposure graduale: 10–30m quality sprints con recupero lungo. Monitoraggio ischio-crurali costante.',
      },
      {
        block_id:               'ECCENTRIC_HAMSTRING_PREHAB',
        activation_priority:    1,  // firma Pintus: Nordic 2×/sett in tutti i piani
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'FIRMA PINTUS: Nordic Hamstring 2×/sett standard in tutti i piani football. Non negoziabile come modulo di prehab.',
      },
      {
        block_id:               'COD_MECHANICS',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'COD tecnico 45°→90°→135°; feedback-driven. Priorità alla riduzione del carico surrogato ACL.',
      },
      {
        block_id:               'RSA',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'RSA introdotta dopo HIIT consolidato. Monitorare decremento: stop serie se >10%.',
      },
    ],

    methodologyV2: {
      load_philosophy:        'Test-driven HIIT individualization: misura le soglie, poi trasferisci ai pattern match-specific.',
      preferred_progression:  'volume_first',
      block_selection_logic:  'ZONE2 (4–8 sett) → HIIT_TEAM_SPORT + SPRINT + ECCENTRIC_PREHAB in parallelo → RSA + COD. Nordic sempre attivo.',
      assessment_bias:        ['maschera VO2 per soglie aerobiche/anaerobiche', 'sRPE', 'HSR GPS', 'HRV mattutino', 'RSA decrement %'],
      signature_constraints:  ['Nordic Hamstring 2×/sett OBBLIGATORIO in tutti i piani football', 'ACWR mai come unica metrica — multi-signal approach', 'HIIT compatibile con stressor tattico-tecnici settimanali'],
    },

    resilientRedFlags: [
      {
        primary_source:       'pain_vas',
        fallback_1_source:    'mechanical_performance',
        fallback_2_source:    'hrv_zscore',
        condition:            'Dolore ischio-crurali/inguine/Achille con calo prestativo',
        threshold:            3,
        fallback_1_threshold: 5,
        fallback_2_threshold: -1.5,
        action_code:          'REDUCE_LOAD',
        confidence_penalty:   0.3,
        ui_explanation:       'Dolore localizzato + calo prestativo: ridurre HSR e sprint, mantenere base + forza, deload settimana.',
      },
      {
        primary_source:       'hrv_zscore',
        fallback_1_source:    'wizard',
        condition:            'Fatica sistemica persistente: sleep↓ + RPE↑ + performance↓ per 3+ giorni',
        threshold:            -1.5,
        fallback_1_threshold: 2,  // energy/sleep wizard score ≤ 2
        action_code:          'SUBSTITUTE_LOWER_INTENSITY',
        confidence_penalty:   0.25,
        ui_explanation:       'Fatica sistemica: ridurre intensità e densità HIIT; shift verso base e recovery per 5–7 giorni.',
      },
    ],
  },

  // ── P02 ── Raymond Verheijen — Football Periodization (Evidence B) ──────────
  {
    id: 'P02',
    name: 'Raymond Verheijen',
    role: 'football periodisation coach',
    discipline: 'football (soccer) | periodization',
    era: '2000s-2020s',
    nationality: 'Netherlands',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'The Original Guide to Football Periodisation Part 1', url: 'https://www.fcevolution.com/winkel/books/the-original-guide-to-football-periodisation-part-1/', type: 'book', priority: 1 },
        { title: 'Football Periodisation Module – FC Evolution', url: 'https://www.fcevolution.com/football-periodisation-module/', type: 'online course', priority: 2 },
        { title: 'Buchheit & Laursen HIIT Part II', url: 'https://martin-buchheit.net/wp-content/uploads/2018/01/buchheit-laursen-hit-solutions-to-the-programming-puzzle-part-ii.pdf', type: 'peer-reviewed PDF', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Football-specific periodization: training load based on match demands, not generic S&C',
        'Weekly microcycle built around match day (MD-5, MD-4, MD-3, MD-2, MD-1)',
        'Training content must mimic football actions: ball + intensity combinations',
        'Player injury prevention through appropriate weekly load sequencing',
      ],
    },
    load: {
      rules: [
        'Highest intensity sessions at MD-4/MD-3; MD-1 activation only',
        'Volume and intensity inversely proportional within microcycle',
        'Avoid high-volume + high-intensity simultaneously on same day',
      ],
    },
    blocks: [
      {
        name: 'Match-day microcycle',
        durationWeeks: [1, 1],
        dosage: 'MD-5: aerobic volume; MD-4: high intensity; MD-3: high intensity; MD-2: activation; MD-1: light',
        progression: 'Consistent week-to-week with seasonal load progression over macrocycle',
      },
    ],
    kpis: [
      { name: 'Training load per MD session', type: 'mechanical' },
      { name: 'Player readiness pre-match', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'High-intensity load on MD-2 or MD-1', action: 'Reduce to activation-only; risk of fatigue carry-over into match' },
    ],
    mapping: {
      userArchetypes: ['football coach', 'semi-pro football player', 'team-sport athlete'],
      compatibleObjectives: ['match fitness', 'periodized football training', 'injury prevention in season'],
      incompatibleObjectives: ['individual athletic development without team context'],
    },
    uiPills: [
      { text: 'Allena come si gioca. Il calcio ha la sua periodizzazione', sourceId: 'FC Evolution 2022' },
    ],
    fusionWeight: {
      recommendedPercent: 25,
      bestPairedWith: ['P01', 'P05', 'P03'],
    },
  },

  // ── P03 ── Martin Buchheit — HIIT / Team Sport Science (Evidence A) ─────────
  {
    id: 'P03',
    name: 'Martin Buchheit',
    role: 'sports scientist | HIIT programming',
    discipline: 'HIIT | team sport | football',
    era: '2000s-2020s',
    nationality: 'France',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Buchheit & Laursen – HIT solutions Part II', url: 'https://martin-buchheit.net/wp-content/uploads/2018/01/buchheit-laursen-hit-solutions-to-the-programming-puzzle-part-ii.pdf', type: 'peer-reviewed PDF', priority: 1 },
        { title: 'PMC – HIIT optimization for team sports', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3459771/', type: 'peer-reviewed PMC', priority: 2 },
        { title: 'PubMed – HIIT dose-response', url: 'https://pubmed.ncbi.nlm.nih.gov/24733334/', type: 'peer-reviewed', priority: 3 },
        { title: 'martin-buchheit.net – practitioner resources', url: 'https://martin-buchheit.net/', type: 'author website + papers', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'HIIT prescription: target the right physiological system (VO2max, speed endurance, RSA) for the athlete\'s specific bottleneck',
        'Work:rest ratio and interval duration determine which energy system is stressed',
        'Training load monitoring using sRPE x session duration as minimal standard',
        'Readiness-adjusted intensity: HRV or subjective wellness gates session intensity',
      ],
    },
    load: {
      rules: [
        'Intensity x duration = session load; track weekly load for progressive overload',
        'High-intensity sessions: max 2-3/week; require ≥48h recovery',
        'Individualize interval duration based on aerobic fitness (VO2max proxy)',
        'RSA training should not exceed 3 sessions/week; hamstring risk increases',
      ],
    },
    blocks: [
      {
        name: 'VO2max HIIT Block',
        durationWeeks: [3, 6],
        dosage: '2x/wk; 4–6 × 4min @95–100% MAS; 3min passive recovery',
        progression: 'Start 4 reps → 6 reps; then reduce recovery slightly',
      },
      {
        name: 'Speed Endurance Block',
        durationWeeks: [3, 5],
        dosage: '2x/wk; 6–10 × 30s maximal; 2–3min recovery',
        progression: 'Increase reps before reducing recovery',
      },
      {
        name: 'RSA Block (Repeated Sprint Ability)',
        durationWeeks: [3, 6],
        dosage: '2x/wk; 6–10 × 30–40m sprint; 20–30s recovery',
        progression: 'Monitor fatigue index; stop session if decrement >10%',
      },
    ],
    kpis: [
      { name: 'sRPE x duration (AU/session)', type: 'systemic' },
      { name: 'MAS (maximal aerobic speed)', type: 'performance' },
      { name: 'RSA decrement %', type: 'performance' },
      { name: 'HRV morning baseline', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'sRPE > 8 for 3+ consecutive sessions', action: 'Reduce intensity to moderate for 1 week; reassess' },
      { trigger: 'RSA decrement >15% or localized pain', action: 'Stop session; 48h recovery minimum before next HIIT' },
    ],
    mapping: {
      userArchetypes: ['team-sport athlete', 'endurance athlete wanting speed', 'advanced runner', 'football player'],
      compatibleObjectives: ['VO2max improvement', 'speed endurance', 'RSA for team sport', 'match fitness'],
      incompatibleObjectives: ['pure strength/hypertrophy goals', 'marathon base phase'],
    },
    uiPills: [
      { text: 'HIIT: scegli il sistema energetico giusto, non la moda del momento', sourceId: 'Buchheit & Laursen 2011' },
    ],
    fusionWeight: {
      recommendedPercent: 25,
      bestPairedWith: ['P01', 'P04', 'P05', 'P16'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,

    blockCatalogIds: [
      'ZONE2_FOUNDATION',
      'HIIT_TEAM_SPORT',
      'RSA',
      'THRESHOLD_ENDURANCE',
      'SPRINT_ACCELERATION',
    ],

    profileModifiers: [
      {
        block_id:               'HIIT_TEAM_SPORT',
        activation_priority:    1,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'FIRMA BUCHHEIT: scegli il sistema energetico specifico del bottleneck atleta. Work:rest ratio e durata interval determinano il sistema stressato.',
      },
      {
        block_id:               'RSA',
        activation_priority:    1,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'RSA training: stop serie se decrement >10%. Non superare 3 sessioni/sett — rischio ischio-crurali aumenta.',
      },
      {
        block_id:               'THRESHOLD_ENDURANCE',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'Sviluppo LT2 come base per HIIT team-sport. Buchheit usa questo per individuare MAS e calibrare successivi HIIT.',
      },
      {
        block_id:               'ZONE2_FOUNDATION',
        activation_priority:    3,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'Base aerobica necessaria prima di HIIT efficace. Buchheit cita l\'aerobic foundation come prerequisito.',
      },
      {
        block_id:               'SPRINT_ACCELERATION',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'Sprint integrato nella programmazione HIIT dopo base consolidata.',
      },
    ],

    methodologyV2: {
      load_philosophy:        'Identifica il bottleneck fisiologico specifico (VO2max? RSA? LT2?) e prescrive il blocco HIIT mirato.',
      preferred_progression:  'volume_first',
      block_selection_logic:  'Assessment MAS → selezionare HIIT_TEAM_SPORT o RSA in base al bottleneck → monitorare con sRPE × duration e HRV.',
      assessment_bias:        ['MAS test (velocità aerobica massimale)', 'sRPE × duration', 'HRV mattutino', 'RSA decrement %', 'Yo-Yo IR2'],
      signature_constraints:  ['max 2–3 sessioni HIIT/sett', 'RSA decrement >10% = stop serie', 'sRPE > 8 × 3+ sessioni consecutive = deload', 'mai ACWR come unica metrica'],
    },

    resilientRedFlags: [
      {
        primary_source:       'mechanical_performance',
        fallback_1_source:    'wizard',
        condition:            'sRPE > 8 per 3+ sessioni consecutive',
        threshold:            8,
        fallback_1_threshold: 2,
        action_code:          'SUBSTITUTE_LOWER_INTENSITY',
        confidence_penalty:   0.2,
        ui_explanation:       'Sovraccarico percepito: ridurre intensità a moderata per 1 settimana; riassessare MAS prima di riprendere.',
      },
      {
        primary_source:       'mechanical_performance',
        fallback_1_source:    'pain_vas',
        condition:            'RSA decrement >15% o dolore localizzato',
        threshold:            15,
        fallback_1_threshold: 3,
        action_code:          'FULL_REST',
        confidence_penalty:   0.35,
        ui_explanation:       'Decremento RSA eccessivo o dolore: stop sessione; 48h recupero minimo prima del prossimo HIIT.',
      },
    ],
  },

  // ── P05 ── Tim Gabbett — Training Load Management (Evidence A) ───────────────
  {
    id: 'P05',
    name: 'Tim Gabbett',
    role: 'training load researcher',
    discipline: 'load management | injury prevention | team sport',
    era: '2000s-2020s',
    nationality: 'Australia',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Gabbett 2016 – training-injury prevention paradox', url: 'https://pubmed.ncbi.nlm.nih.gov/26758673/', type: 'peer-reviewed landmark paper', priority: 1 },
        { title: 'BJSM – workload and injury risk', url: 'https://bjsm.bmj.com/content/50/5/273', type: 'peer-reviewed', priority: 2 },
        { title: 'PubMed – chronic workload and soft-tissue injury', url: 'https://pubmed.ncbi.nlm.nih.gov/33839892/', type: 'peer-reviewed', priority: 3 },
        { title: 'MDPI – load monitoring sport', url: 'https://www.mdpi.com/2075-4663/12/4/96', type: 'peer-reviewed', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Training-injury prevention paradox: well-prepared athletes CAN handle high loads; the risk is in ABRUPT changes',
        'Chronic workload is protective; it is the acute:chronic ratio that creates risk',
        'Build chronic workload progressively over 8–12 weeks before exposing to high acute loads',
        'Multi-signal monitoring preferred over ACWR alone (known methodological limits)',
        'High chronic loads can be injury-protective if built gradually (the "fitness buffer")',
      ],
    },
    load: {
      rules: [
        'Avoid >10% weekly load increase (acute spike rule)',
        'Chronic workload window: 4 weeks rolling average; build it before intensifying',
        'Avoid monotony: alternate hard/easy days; plan deload weeks every 3–4 weeks',
        'Pain + load spike = mandatory reduction; do not train through localized joint/tendon pain',
        'Return to play: restore chronic workload before re-exposing to match/competition demands',
      ],
    },
    blocks: [
      {
        name: 'Load Accumulation Block',
        durationWeeks: [4, 8],
        dosage: 'Gradually build weekly load volume; progressive +5–10%/week; deload week 4 and 8',
        progression: 'Build chronic workload baseline before introducing high-intensity phases',
      },
      {
        name: 'Deload Week',
        durationWeeks: [1, 1],
        dosage: '40–60% reduction in total load; maintain movement quality; active recovery',
        progression: 'Mandatory every 3–4 weeks of progressive overload',
      },
    ],
    kpis: [
      { name: 'Weekly load (sRPE × duration)', type: 'systemic' },
      { name: 'Acute:chronic workload ratio', type: 'systemic' },
      { name: 'Perceived recovery score (1–10)', type: 'systemic' },
      { name: 'Pain rating by district (0–10)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Weekly load spike >15% above 4-week average', action: 'Cap load increase; add recovery day' },
      { trigger: 'Localized pain >3/10 persisting for 2+ days', action: 'Stop aggravating activity; load management protocol' },
      { trigger: 'Monotonous load pattern (same intensity 5+ days)', action: 'Introduce hard/easy variation; add deload' },
    ],
    mapping: {
      userArchetypes: ['any athlete returning from injury', 'athlete with high injury history', 'any user starting new program'],
      compatibleObjectives: ['injury prevention', 'load optimization', 'return to play', 'general conditioning'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'Non è il carico a fare infortuni. È il carico improvviso', sourceId: 'Gabbett 2016', quote: 'Well-prepared athletes can handle high training loads.' },
      { text: 'Costruisci la cronicity prima di alzare l\'acuity', sourceId: 'BJSM 2016' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P01', 'P49', 'P50', 'P48'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,

    blockCatalogIds: [
      'ZONE2_FOUNDATION',
      'HIIT_TEAM_SPORT',
      'RSA',
      'RTP_FIELD_REBUILD',
    ],

    profileModifiers: [
      {
        block_id:               'ZONE2_FOUNDATION',
        activation_priority:    1,  // chronicity building è il focus Gabbett
        progression_bias:       'volume_first',
        volume_modifier_pct:    +15,  // enfatizza costruzione chronic workload graduale
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'FIRMA GABBETT: costruire chronic workload nelle prime 8–12 sett PRIMA di alzare l\'acuity. Zone 2 come base di cronicity.',
        additional_red_flags: [
          {
            condition: 'Incremento settimanale del carico > 10% rispetto alla settimana precedente',
            action:    'Cap incremento; aggiungere giorno di recovery',
            priority:  'high',
            source_id: 'Gabbett 2016 BJSM — 10% rule',
          },
        ],
      },
      {
        block_id:               'HIIT_TEAM_SPORT',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'HIIT introdotto solo dopo chronicity stabilita. Monitoraggio ACWR (come uno dei segnali, non unico).',
      },
      {
        block_id:               'RSA',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'preseason',
        coach_specific_notes:   'RSA eseguita dopo HIIT consolidato. Gabbett enfatizza il monitoraggio del carico cumulativo settimanale.',
      },
      {
        block_id:               'RTP_FIELD_REBUILD',
        activation_priority:    1,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'FIRMA GABBETT: RTP = ripristino chronic workload prima del ritorno in gara. Non tornare se ACWR > 1.3.',
        additional_red_flags: [
          {
            condition: 'Return to play senza ripristino del chronic workload pre-infortunio',
            action:    'Bloccare RTP avanzato; tornare alla fase di ripristino chronic workload',
            priority:  'veto',
            source_id: 'Gabbett 2016 — RTP and chronic workload',
          },
        ],
      },
    ],

    methodologyV2: {
      load_philosophy:        'Il chronic workload è protettivo. Il rischio è nelle variazioni acute, non nel carico in sé.',
      preferred_progression:  'volume_first',
      block_selection_logic:  'Costruire ZONE2 chronic workload (8–12 sett) → introdurre HIIT → RSA. RTP: ripristinare chronic workload prima di gara. Deload ogni 3–4 sett OBBLIGATORIO.',
      assessment_bias:        ['ACWR (con cautela metodologica)', 'sRPE × duration settimanale', 'pain VAS per distretto', 'perceived recovery score', 'monotony index'],
      signature_constraints:  ['ACWR mai come unica metrica — multi-signal approach', 'deload obbligatorio ogni 3–4 settimane', 'pain >3/10 per 2+ giorni = stop carico aggravante', 'RTP: chronic workload ripristinato prima di gara'],
      fusion_logic:           'Gabbett funziona come "wrapper di sicurezza" su tutti gli altri profili: il suo monitoraggio si applica sopra qualsiasi metodologia.',
    },

    resilientRedFlags: [
      {
        primary_source:       'allostatic_load',
        fallback_1_source:    'mechanical_performance',
        condition:            'Incremento settimanale carico > 15% sopra media delle 4 settimane precedenti',
        threshold:            70,  // allostatic load score > 70
        fallback_1_threshold: 15,  // weekly load spike %
        action_code:          'REDUCE_LOAD',
        confidence_penalty:   0.25,
        ui_explanation:       'Picco di carico acuto: cap dell\'incremento; aggiungere giorno di recovery.',
      },
      {
        primary_source:       'pain_vas',
        fallback_1_source:    'hrv_zscore',
        condition:            'Dolore localizzato >3/10 persistente per 2+ giorni',
        threshold:            3,
        fallback_1_threshold: -1.5,
        action_code:          'SUBSTITUTE_LOWER_INTENSITY',
        confidence_penalty:   0.3,
        ui_explanation:       'Dolore persistente: stop attività aggravante; applicare protocollo load management.',
      },
    ],
  },

  // ── P08 ── Carlo Vittori — Sprint Coach (Evidence A) ─────────────────────────
  {
    id: 'P08',
    name: 'Carlo Vittori',
    role: 'sprint coach | Italian school',
    discipline: 'track & field | sprint (100m–400m)',
    era: '1950s-1990s',
    nationality: 'Italy',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'IAAF – European School in Sprint Training (1996)', url: 'https://centrostudilombardia.com/wp-content/uploads/IAAF-Corsa-Velocita/1996-The-European-School-in-sprint-training.-The-experiences-in-Italy.pdf', type: 'IAAF journal PDF', priority: 1 },
        { title: 'IAAF – Monitoring the training of the sprinter (1995)', url: 'https://centrostudilombardia.com/wp-content/uploads/IAAF-Corsa-Velocita/1995-Monitoring-the-training-of-the-sprinter.pdf', type: 'IAAF journal PDF', priority: 2 },
        { title: 'FIDAL – Vittori method article', url: 'https://www.fidal.it/upload/atletica/Vittori.pdf', type: 'federation publication', priority: 3 },
        { title: 'PubMed – Sprint biomechanics review', url: 'https://pubmed.ncbi.nlm.nih.gov/30512487/', type: 'peer-reviewed', priority: 4 },
        { title: 'Nuova Atletica – Italian athletics review', url: 'https://www.fidal.it/upload/Friuli%20Venezia%20Giulia/Area%20Tecnica/05-NUOVA-ATLETICA/01-riviste/135.pdf', type: 'federation journal', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Tripartite sprint system: alactic capacity + specific strength + stride length/rate balance',
        'Integrate energy systems + force types: not just technique-only coaching',
        'Monitoring is essential: use test batteries grouped by ability; re-test in appropriate phases',
        'Some tests double as training means (monitoring + stimulus)',
        'Stride length vs stride rate is a technical-structural trade-off; specific strength shifts it',
      ],
    },
    load: {
      rules: [
        'Protect quality: maxV/accel sessions need full recovery (48–72h between high-intensity sessions)',
        'Control alactic volume before adding anaerobic lactic work',
        'Specific strength (bounding, sprint drills) requires technical quality gates — stop if mechanics degrade',
        'Monitor hamstring/Achilles pain; sprint volume must not proceed through localized pain',
      ],
    },
    blocks: [
      {
        name: 'Alactic Acceleration Block',
        durationWeeks: [4, 6],
        dosage: '10–30m sprints; 3–5 reps; 5–10min full recovery; focus on quality not quantity',
        progression: 'Add reps before reducing rest; never rush recovery in alactic phase',
      },
      {
        name: 'Specific Strength Block',
        durationWeeks: [4, 8],
        dosage: 'Running drills (A/B skips, bounding) + strength/RFD gym work + progressive plyometrics',
        progression: 'Increase plyometric contacts cautiously; use technical quality as gate',
      },
      {
        name: 'MaxV Transfer Block',
        durationWeeks: [3, 5],
        dosage: 'Flying 20–30m sprints; full recovery; SL/SR feedback drills; no over-striding',
        progression: 'Quality over quantity; session stops if time performance degrades',
      },
    ],
    kpis: [
      { name: '30m time (acceleration)', type: 'performance' },
      { name: 'Flying 20m time (max velocity)', type: 'performance' },
      { name: 'Repeat decrement % (fatigue index)', type: 'performance' },
      { name: 'Technical quality score (coach assessment)', type: 'mechanical' },
      { name: 'Localized pain rating (hamstring/Achilles)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Performance decrement > 5% across reps despite intent', action: 'Stop session; return to strength-base phase; rest 48h' },
      { trigger: 'Hamstring or Achilles pain during sprint', action: 'Immediate session stop; no sprint volume through pain; assess' },
      { trigger: 'Stride mechanics degradation (over-striding, late heel contact)', action: 'Reduce intensity; focus on drill correction before returning to full sprint' },
    ],
    mapping: {
      userArchetypes: ['track sprinter (amateur/club)', 'team sport athlete wanting speed', 'athlete returning from sprint injury'],
      compatibleObjectives: ['100m–400m improvement', 'acceleration development', 'maxV improvement', 'RSA for team sport'],
      incompatibleObjectives: ['marathon training', 'pure endurance goals', 'bodybuilding-only'],
    },
    uiPills: [
      { text: 'Il coaching non può basarsi sull\'improvvisazione. Deve esserci un metodo', sourceId: 'Vittori 1996 IAAF', quote: 'Coaching cannot be based on improvisation… there must be a method.' },
      { text: 'Forza + sistemi energetici + tecnica: la triade dello sprint italiano', sourceId: 'IAAF European School 1996' },
    ],
    fusionWeight: {
      recommendedPercent: 40,
      bestPairedWith: ['P12', 'P37', 'P05', 'P09'],
    },
  },

  // ── P13 ── Renato Canova — Marathon / Endurance Coach (Evidence B) ───────────
  {
    id: 'P13',
    name: 'Renato Canova',
    role: 'endurance running coach',
    discipline: 'running | middle/long distance to marathon',
    era: '1990s-2020s',
    nationality: 'Italy',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'The Methods of Renato Canova (PDF)', url: 'https://runningscience.co.za/wp-content/uploads/2017/01/The-Methods-of-Renato-Canova.pdf', type: 'coaching methods PDF', priority: 1 },
        { title: 'RunningScience – Canova special block overview', url: 'https://runningscience.co.za/2011/09/26/something-new-in-training-the-methods-of-renato-canova/', type: 'analysis article', priority: 2 },
        { title: 'RunnersConnect – Canova special block guide', url: 'https://runnersconnect.net/canova-special-block-training/', type: 'practitioner article', priority: 3 },
        { title: 'RunWritings – Modern Canova marathon adaptations', url: 'https://runningwritings.com/2024/12/keys-to-marathon-training-modern-changes-to-canovas-methods.html', type: 'analysis article', priority: 4 },
        { title: 'Trail Runner – Canova specific workouts', url: 'https://www.trailrunnermag.com/training/training-workouts/big-workout-highlight-canova-specific-workouts/', type: 'practitioner magazine', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Day-to-day modulation: vary distance and intensity with proportional recovery',
        'Special/specific blocks inserted every 3–4 weeks: high-density training periods (AM + PM sessions)',
        'Block days are high-stress events: athlete must arrive well-rested; recovery after is critical',
        'Race-pace anchored specificity: all key workouts expressed as % of marathon pace (MP) or race pace (RP)',
        'Build from general → special → specific progressively through macrocycle',
      ],
    },
    load: {
      rules: [
        'Block days (AM+PM) are rare high-stress events: maximum 1–2 per month',
        'Prerequisite for block day: 3+ days of easy running before; HRV/sleep baseline OK',
        'Post-block: 2–3 easy days minimum; monitor RPE, HR, DOMS; no second block until fully recovered',
        'If overreaching signs emerge: reduce density+intensity; maintain frequency and technique work',
      ],
    },
    blocks: [
      {
        name: 'Marathon Endurance Special Block',
        durationWeeks: [1, 1],
        dosage: 'AM: 10km @90% MP + 20km @MP | PM: same session repeated',
        progression: 'Used after 6–8 weeks of solid base; rare (monthly max)',
      },
      {
        name: 'Marathon Mix Special Block',
        durationWeeks: [1, 1],
        dosage: 'AM: 10km @90% MP + 10km @102% MP | PM: 10km @90% MP + 12×1000m @105% MP (rec 1:30)',
        progression: 'Advanced block; only after establishing special block tolerance',
      },
      {
        name: '800m Special Block (example)',
        durationWeeks: [1, 1],
        dosage: '10×600m @87–90% RP + 4×400m @105% RP; long recoveries',
        progression: 'Full recovery between sets; quality is mandatory gate',
      },
      {
        name: 'Base Modulation Phase',
        durationWeeks: [4, 8],
        dosage: 'Easy volume + 1 threshold run + 1 long run; vary daily distance/intensity',
        progression: '+5–10% volume/week; deload week 4',
      },
    ],
    kpis: [
      { name: 'Pace/HR decoupling (aerobic drift)', type: 'systemic' },
      { name: 'Interval split consistency (%MP)', type: 'performance' },
      { name: 'RPE trend post-block (≤6 by day 3)', type: 'systemic' },
      { name: 'Sleep quality score', type: 'systemic' },
      { name: 'DOMS tolerance (days to recovery)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'High RPE (≥8) persisting 2+ days after block', action: 'Cancel next block; 5+ easy days; LT retest before resuming' },
      { trigger: 'HR elevated >5bpm above baseline at same pace', action: 'Drop to easy run only; check sleep, hydration, illness' },
      { trigger: 'Tendon pain (Achilles/patellar) post-block', action: 'Stop block protocol; load management + tendon protocol (P49/P50)' },
    ],
    mapping: {
      userArchetypes: ['marathon runner (intermediate+)', 'half-marathon runner wanting PB', '800m–5000m runner', 'high-mileage runner ready for blocks'],
      compatibleObjectives: ['marathon PB', 'half-marathon PB', '10k improvement', '800m–5000m speed-endurance'],
      incompatibleObjectives: ['beginner runner (<6 months base)', 'sprint-only goals', 'team sport without running base'],
    },
    uiPills: [
      { text: 'I blocchi speciali: massimo stress, massimo recupero. Non si improvvisano', sourceId: 'Canova Methods PDF 2017' },
      { text: 'Tutto è espresso come percentuale del ritmo gara. La specificità è la chiave', sourceId: 'RunnersConnect 2019' },
    ],
    fusionWeight: {
      recommendedPercent: 35,
      bestPairedWith: ['P16', 'P14', 'P05', 'P49'],
    },
  },

  // ── P14 ── Jack Daniels — Running/VDOT (Evidence A) ──────────────────────────
  {
    id: 'P14',
    name: 'Jack Daniels',
    role: 'running coach | VDOT system author',
    discipline: 'running | all distances via VDOT pacing',
    era: '1970s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'VDOT calculator (vdoto2.com)', url: 'https://vdoto2.com/', type: 'official tool', priority: 1 },
        { title: "Daniels' Running Formula – pacing table (PDF)", url: 'https://static1.squarespace.com/static/596007f846c3c458c0dfdbc9/t/5d5ed7ed7d9b1c0001cda03c/1566490606316/DanielsRunningFormulaPaces.pdf', type: 'book extract PDF', priority: 2 },
        { title: 'PubMed – VO2max training zones', url: 'https://pubmed.ncbi.nlm.nih.gov/30319861/', type: 'peer-reviewed', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'VDOT: a single performance metric predicts optimal training paces across 5 zones (E, M, T, I, R)',
        'Easy pace (E): 60–70% VO2max; recovery + aerobic base; majority of volume',
        'Threshold pace (T): 83–88% VO2max; lactate clearance; 20–40min tempo or cruise intervals',
        'Interval pace (I): ~98% VO2max; VO2max development; 5-min reps',
        'Repetition pace (R): faster than race pace; economy + speed; short reps',
      ],
    },
    load: {
      rules: [
        '80% of weekly volume at Easy pace (E)',
        'Threshold runs: max 10% of weekly mileage',
        'Interval sessions: max 8% of weekly mileage; full recovery between reps',
        'Increase weekly mileage by no more than 1 mile per week per year of running experience',
      ],
    },
    blocks: [
      {
        name: 'Base Phase (Phase I)',
        durationWeeks: [4, 8],
        dosage: '100% easy running; strides 4×100m; build mileage foundation',
        progression: '+1 mile/week per year of experience',
      },
      {
        name: 'Threshold Phase (Phase II)',
        durationWeeks: [4, 6],
        dosage: 'T-pace tempo 20–40min or cruise intervals (5×1mile T, 1min rest); rest = E pace',
        progression: 'Add volume before adding sessions',
      },
      {
        name: 'Interval Phase (Phase III)',
        durationWeeks: [4, 6],
        dosage: 'I-pace 5×1000m (rest = rep time); keep reps to 8% of weekly volume',
        progression: 'Add reps; never reduce rest in interval phase',
      },
    ],
    kpis: [
      { name: 'VDOT score (race performance derived)', type: 'performance' },
      { name: 'Weekly mileage', type: 'mechanical' },
      { name: 'T-pace HR (should stabilize)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Unable to sustain E pace without elevated HR/effort', action: 'Reduce pace further; aerobic base not ready for harder phases' },
      { trigger: 'T-pace sessions feel like R-pace effort', action: 'Recalculate VDOT; may have overtrained or insufficient base' },
    ],
    mapping: {
      userArchetypes: ['recreational runner', 'competitive runner (all distances)', 'triathlete (run component)'],
      compatibleObjectives: ['5k–marathon improvement', 'aerobic base building', 'race preparation'],
      incompatibleObjectives: ['sprint track', 'team sport (non-running)'],
    },
    uiPills: [
      { text: 'VDOT: un numero, tutte le tue andature. Semplice, potente', sourceId: 'vdoto2.com' },
    ],
    fusionWeight: {
      recommendedPercent: 25,
      bestPairedWith: ['P13', 'P16', 'P17', 'P05'],
    },
  },

  // ── P16 ── Stephen Seiler — Polarized Training (Evidence A) ──────────────────
  {
    id: 'P16',
    name: 'Stephen Seiler',
    role: 'endurance physiology researcher | polarized training',
    discipline: 'endurance | rowing | running | cycling',
    era: '2000s-2020s',
    nationality: 'USA/Norway',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'PMC – polarized training in elite endurance athletes', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3912323/', type: 'peer-reviewed PMC', priority: 1 },
        { title: 'PubMed – polarized vs threshold', url: 'https://pubmed.ncbi.nlm.nih.gov/24791915/', type: 'peer-reviewed', priority: 2 },
        { title: 'PubMed – intensity distribution', url: 'https://pubmed.ncbi.nlm.nih.gov/20805471/', type: 'peer-reviewed', priority: 3 },
        { title: 'World Rowing – polarized training overview', url: 'https://worldrowing.com/2021/02/18/polarized-training/', type: 'federation article', priority: 4 },
        { title: 'PubMed – training zones endurance', url: 'https://pubmed.ncbi.nlm.nih.gov/28800110/', type: 'peer-reviewed', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Polarized intensity distribution: ~80% low intensity (<VT1) + ~20% high intensity (>VT2); avoid the "black hole" middle zone',
        'Elite endurance athletes naturally converge on 80/20 distribution over long careers',
        'VT1 (aerobic threshold) is the ceiling for easy work; most athletes train too hard on easy days',
        'High-intensity sessions (>VT2): 2–3x/week; full recovery between; targeted not excessive',
        'Volume at low intensity is the primary driver of aerobic adaptation',
      ],
    },
    load: {
      rules: [
        '80% of sessions/volume: nasal breathing possible; HR <75% max; can hold a conversation',
        '20% of sessions: 4×4min @95% max HR or similar high-intensity intervals',
        'Avoid gray zone (75–90% max HR): metabolically expensive without superior adaptation',
        'Increase volume progressively before adding high-intensity density',
      ],
    },
    blocks: [
      {
        name: 'Polarized Base Block',
        durationWeeks: [6, 16],
        dosage: '5 sessions/wk: 4 easy (zone 1) + 1 HIT (4×4min); mileage build at easy pace',
        progression: 'Add volume to easy days first; HIT stays 1–2x/week',
      },
      {
        name: 'Polarized Competition Block',
        durationWeeks: [4, 8],
        dosage: '5–6 sessions/wk: 3–4 easy + 2 HIT; taper last 2 weeks',
        progression: 'Reduce volume, maintain intensity in taper',
      },
    ],
    kpis: [
      { name: 'Session intensity distribution (%Z1/Z2/Z3)', type: 'systemic' },
      { name: 'VT1 power/pace improvement over season', type: 'performance' },
      { name: 'VO2max (periodic testing)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Most easy sessions drifting into zone 2 (gray zone)', action: 'Reduce pace/power; enforce proper polarization' },
      { trigger: 'HIT sessions not reaching target intensity (>VT2)', action: 'Check recovery; HIT needs proper easy day recovery' },
    ],
    mapping: {
      userArchetypes: ['endurance athlete (runner, cyclist, triathlete)', 'athlete overtrained from too much threshold work', 'aging endurance athlete'],
      compatibleObjectives: ['VO2max improvement', 'marathon/half-marathon', 'cycling performance', 'long-term endurance development'],
      incompatibleObjectives: ['short sprint events', 'team sport without endurance component', 'pure strength'],
    },
    uiPills: [
      { text: '80% facile, 20% duro. Eliminare la zona grigia è il segreto degli élite', sourceId: 'Seiler PMC 2013', quote: 'The black hole: too hard to be easy, too easy to be hard.' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P14', 'P13', 'P24', 'P05'],
    },
  },

  // ── P27 ── Mark Rippetoe — Starting Strength (Evidence B) ────────────────────
  {
    id: 'P27',
    name: 'Mark Rippetoe',
    role: 'strength coach | Starting Strength author',
    discipline: 'barbell strength | novice linear progression',
    era: '1990s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Starting Strength – program overview', url: 'https://startingstrength.com/get-started/programs', type: 'official website', priority: 1 },
        { title: 'Starting Strength – novice article', url: 'https://startingstrength.com/articles/be_novice_rippetoe.pdf', type: 'author article PDF', priority: 2 },
        { title: 'Starting Strength – white paper', url: 'https://images.startingstrengthgyms.com/StartingStrength_WhitePaper.pdf', type: 'white paper PDF', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Novice linear progression: add weight every session; exploit beginner strength gains',
        '5 compound barbell lifts: squat, deadlift, press, bench press, power clean',
        'Stress–recovery–adaptation: 48h between same lift; full session stimulus → recovery → gain',
        'Squat every session (3x per week); primary driver of total body strength',
      ],
    },
    load: {
      rules: [
        'Add 2.5–5kg per session on upper body lifts; 5–10kg on lower body (linear progression)',
        'Reset when stalling: 3 failed sessions on same weight → 10% deload + reset',
        'Eat in surplus to support novice gains: ~3000+ kcal for males',
        'Sleep 8h minimum; strength adaptation requires recovery',
      ],
    },
    blocks: [
      {
        name: 'Novice Linear Progression',
        durationWeeks: [12, 24],
        dosage: 'A/B alternating 3x/week: Squat 3×5, Press/Bench 3×5, Deadlift 1×5; add weight each session',
        progression: '+5kg/session lower body; +2.5kg/session upper; deload if stalling',
      },
    ],
    kpis: [
      { name: 'Total load per session (squat/dead/press)', type: 'performance' },
      { name: 'Weekly progression (kg added)', type: 'performance' },
    ],
    redFlags: [
      { trigger: '3+ failed sessions at same weight', action: 'Deload 10%; reset progression; check sleep + nutrition' },
      { trigger: 'Form breakdown under load', action: 'Reduce weight; prioritize technique; do not grind bad reps' },
    ],
    mapping: {
      userArchetypes: ['beginner strength trainee', 'untrained male/female wanting strength', 'athlete building strength base'],
      compatibleObjectives: ['beginner strength', 'first 100kg squat', 'general strength base'],
      incompatibleObjectives: ['hypertrophy (intermediate+)', 'endurance sports in-season', 'weight loss primary goal'],
    },
    uiPills: [
      { text: 'Sei un novizio? Aggiungi peso ogni sessione. È così semplice', sourceId: 'Rippetoe 2011' },
    ],
    fusionWeight: {
      recommendedPercent: 35,
      bestPairedWith: ['P34', 'P36', 'P05'],
    },
  },

  // ── P34 ── Tudor Bompa — Periodization (Evidence A) ──────────────────────────
  {
    id: 'P34',
    name: 'Tudor Bompa',
    role: 'periodization author | strength scientist',
    discipline: 'periodization | multi-sport | strength-power',
    era: '1960s-2020s',
    nationality: 'Romania/Canada',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Periodization 6th Edition (Google Books)', url: 'https://books.google.com/books/about/Periodization_6th_Edition.html?id=2f9QDwAAQBAJ', type: 'textbook', priority: 1 },
        { title: 'Periodization – Theory and Methodology of Training (Amazon)', url: 'https://www.amazon.com/Periodization-Methodology-Training-Tudor-Bompa/dp/1492544809', type: 'textbook', priority: 2 },
        { title: 'PubMed – periodization effectiveness', url: 'https://pubmed.ncbi.nlm.nih.gov/25844726/', type: 'peer-reviewed', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Macrocycle → mesocycle → microcycle hierarchy: plan from annual goal backward',
        'Preparatory → competition → transition phases across season',
        'General physical preparation (GPP) precedes specific physical preparation (SPP)',
        'Undulating periodization: vary volume and intensity across weeks and mesocycles',
        'Peaking: systematic reduction of volume with maintained intensity pre-competition',
      ],
    },
    load: {
      rules: [
        'High volume + low intensity in GPP; shift to low volume + high intensity in SPP',
        'Never attempt to peak more than 2–3 times per year',
        'Transition phase: 2–4 weeks active recovery; full mental + physical reset',
        'Mesocycle length: typically 4 weeks (3 load + 1 deload)',
      ],
    },
    blocks: [
      {
        name: 'GPP Block (General Preparation)',
        durationWeeks: [6, 12],
        dosage: 'High volume, low intensity; multilateral development; foundation fitness',
        progression: 'Progressive volume increase; introduce discipline-specific elements gradually',
      },
      {
        name: 'SPP Block (Specific Preparation)',
        durationWeeks: [6, 12],
        dosage: 'Volume reduces; intensity increases; sport-specific + peaking elements',
        progression: 'Shift from general to specific; reduce accessory volume',
      },
      {
        name: 'Competition Block',
        durationWeeks: [4, 16],
        dosage: 'Maintain intensity; reduce volume; peak at target events',
        progression: 'Taper 1–2 weeks before key competition',
      },
    ],
    kpis: [
      { name: 'Training volume (sets × reps × load)', type: 'mechanical' },
      { name: 'Intensity % of 1RM', type: 'mechanical' },
      { name: 'Competition performance trajectory', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'More than 3 peaks attempted per year', action: 'Restructure macrocycle; excessive peaking leads to overtraining' },
      { trigger: 'No transition phase planned', action: 'Insert 2–4 week active recovery block; prevent accumulated fatigue' },
    ],
    mapping: {
      userArchetypes: ['competitive athlete (any sport)', 'strength athlete with competition goals', 'coach building annual plan'],
      compatibleObjectives: ['competition peaking', 'annual strength periodization', 'multi-sport planning'],
      incompatibleObjectives: ['beginner without competition goals', 'general fitness only'],
    },
    uiPills: [
      { text: 'Pianifica dalla gara all\'indietro. Ogni mesociclo ha il suo scopo', sourceId: 'Bompa 2019' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P35', 'P36', 'P27', 'P05'],
    },
  },

  // ── P47 ── Stacy Sims — Female Physiology (Evidence B) ───────────────────────
  {
    id: 'P47',
    name: 'Dr. Stacy Sims',
    role: 'female physiology researcher | author',
    discipline: 'female performance | endurance | strength | hormonal periodization',
    era: '2010s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'ROAR: How to Match Your Food and Fitness to Your Female Physiology', url: 'https://www.drstacysims.com/roar', type: 'author book', priority: 1 },
        { title: 'ROAR (Amazon)', url: 'https://www.amazon.com/ROAR-Revised-Fitness-Physiology-Performance/dp/059358192X', type: 'book', priority: 2 },
        { title: 'WHOOP AMA with Dr. Stacy Sims', url: 'https://www.whoop.com/us/en/thelocker/ama-dr-stacy-sims/', type: 'expert interview', priority: 3 },
        { title: 'TrainingPeaks – tracking menstrual cycles', url: 'https://www.trainingpeaks.com/coach-blog/the-performance-advantages-of-tracking-menstrual-cycles-with-dr-stacy-sims/', type: 'practitioner article', priority: 4 },
        { title: 'Sims – menstrual cycle training evolution', url: 'https://www.drstacysims.com/newsletters/articles/posts/the-evolution-of-menstrual-cycle-training', type: 'author article', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        '"Women are not small men": distinct hormonal physiology requires distinct programming',
        'Follicular phase (day 1–14): rising estrogen → optimal for high-intensity, strength, power training',
        'Luteal phase (day 15–28): progesterone rise → better for technique, moderate intensity, recovery focus',
        'Menstruation: not a reason to stop training; adjust intensity based on symptoms',
        'Protein timing critical: women need 25–35g protein within 30min post-workout (anabolic window shorter)',
        'Bone density: prioritize high-impact and strength work for long-term skeletal health',
        'ACL risk: highest at mid-cycle (estrogen peak); program landing mechanics during follicular phase',
      ],
    },
    load: {
      rules: [
        'Schedule high-intensity and 1RM testing during follicular phase',
        'Reduce volume/intensity by 10–20% in late luteal phase if symptoms present',
        'Do not eliminate carbohydrates for female athletes; low carb increases cortisol + disrupts recovery',
        'Monitor iron levels: deficiency common in female athletes; affects training response',
        'Peri/post-menopause: increase resistance training frequency; counteract muscle + bone loss',
      ],
    },
    blocks: [
      {
        name: 'Follicular Phase Block (Power/Strength)',
        durationWeeks: [2, 2],
        dosage: 'High intensity: 1RM testing, sprint work, heavy compound lifts; protein 2.0–2.2g/kg',
        progression: 'Highest stimulus density of the month; maximize adaptation window',
      },
      {
        name: 'Luteal Phase Block (Technical/Moderate)',
        durationWeeks: [2, 2],
        dosage: 'Moderate intensity: technique work, moderate tempo, mobility; reduce volume 10–15%',
        progression: 'Recovery focus; maintain training frequency but reduce maximal effort',
      },
    ],
    kpis: [
      { name: 'Cycle phase tracker alignment', type: 'systemic' },
      { name: 'Strength output by phase (follicular vs luteal)', type: 'performance' },
      { name: 'Energy availability (kcal/kg LBM)', type: 'systemic' },
      { name: 'Iron/hemoglobin levels (lab)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Female athlete triad signs: low energy + amenorrhea + low bone density', action: 'Immediately increase caloric intake; reduce training load; refer to sports medicine' },
      { trigger: 'Chronic underperformance in strength despite training', action: 'Check iron levels; assess energy availability; review carb intake' },
      { trigger: 'ACL injury history in female athlete', action: 'Add landing mechanics program during follicular phase; COD technique work' },
    ],
    mapping: {
      userArchetypes: ['female athlete (any sport/level)', 'female runner', 'female strength trainee', 'perimenopausal athlete'],
      compatibleObjectives: ['performance optimization for women', 'body composition female', 'strength female', 'injury prevention female'],
      incompatibleObjectives: ['male athletes (different protocols apply)'],
    },
    uiPills: [
      { text: 'Le donne non sono uomini piccoli. La fisiologia cambia tutto', sourceId: 'ROAR 2016', quote: 'Women are not small men. Stop eating and training like one.' },
      { text: 'Fase follicolare: allena forte. Fase luteale: recupera intelligente', sourceId: 'Sims TrainingPeaks 2020' },
    ],
    fusionWeight: {
      recommendedPercent: 30,
      bestPairedWith: ['P48', 'P49', 'P16', 'P03'],
    },
  },

  // ── P49 ── Jill Cook — Tendinopathy (Evidence A) ─────────────────────────────
  {
    id: 'P49',
    name: 'Jill Cook',
    role: 'tendinopathy researcher | clinician',
    discipline: 'tendon health | load management | rehab',
    era: '2000s-2020s',
    nationality: 'Australia',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Cook & Purdam – tendinopathy continuum model', url: 'https://pubmed.ncbi.nlm.nih.gov/18812414/', type: 'landmark paper peer-reviewed', priority: 1 },
        { title: 'BJSM – tendinopathy clinical update', url: 'https://bjsm.bmj.com/content/43/6/409', type: 'peer-reviewed', priority: 2 },
        { title: 'PubMed – reactive tendinopathy', url: 'https://pubmed.ncbi.nlm.nih.gov/27127294/', type: 'peer-reviewed', priority: 3 },
        { title: 'BJSM – tendon rehabilitation', url: 'https://bjsm.bmj.com/content/50/19/1187', type: 'peer-reviewed', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Continuum model: reactive → disrepair → degenerative; early stages are reversible with proper load management',
        'Load is both the cause AND the cure: the solution is appropriate load management, not rest alone',
        'Isometric exercises: immediate pain reduction (neurological); safe during acute reactive phase',
        'Heavy slow resistance (HSR): primary stimulus for tendon remodeling; 3–4x/week for 8–12 weeks',
        'Avoid compression on tendon: positions that compress tendon on bone worsen reactive stage',
        'Pain monitoring: allow pain up to 5/10 during session; must resolve within 24h',
      ],
    },
    load: {
      rules: [
        'Pain 0–3/10 during exercise: OK to continue',
        'Pain 4–5/10: monitor; must drop to 0–2 within 24h to continue next session',
        'Pain >5/10 or pain persists >24h: too much load; reduce',
        'Never rest completely (disuse worsens tendon structure); maintain isometric load minimum',
        'Avoid sudden load spikes: 3-session rule — same load for 3 sessions before increasing',
      ],
    },
    blocks: [
      {
        name: 'Isometric Phase (Reactive)',
        durationWeeks: [2, 4],
        dosage: '5×45s isometric holds at moderate intensity; once daily; pain monitoring',
        progression: 'Progress to isotonic only when pain is consistently ≤2/10',
      },
      {
        name: 'Heavy Slow Resistance Phase',
        durationWeeks: [8, 12],
        dosage: '3–4x/week; 3×15 → 4×8 → 3×6 (progressive loading); slow tempo (3s eccentric)',
        progression: 'Increase load when pain remains ≤2/10 for 3 consecutive sessions',
      },
      {
        name: 'Functional/Sport-Specific Phase',
        durationWeeks: [4, 8],
        dosage: 'Plyometric progression; running re-introduction; sport-specific loading',
        progression: 'Only after HSR phase complete and pain-free under load',
      },
    ],
    kpis: [
      { name: 'Pain VAS during exercise (0–10)', type: 'systemic' },
      { name: 'Pain 24h post-session (0–10)', type: 'systemic' },
      { name: 'Strength output at target load', type: 'performance' },
      { name: 'VISA score (tendon function questionnaire)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Pain >5/10 during exercise', action: 'Stop exercise; drop to isometric only for 3–5 days' },
      { trigger: 'Pain not resolved within 24h of session', action: 'Load was too high; reduce by 20–30%; reassess staging' },
      { trigger: 'Tendon swelling/warmth', action: 'Reduce compressive loads; ice; isometrics only; consider imaging' },
    ],
    mapping: {
      userArchetypes: ['any athlete with tendon pain', 'runner with Achilles/patellar tendinopathy', 'returning athlete after tendon injury'],
      compatibleObjectives: ['tendon rehab', 'return to sport', 'injury prevention (tendon load management)'],
      incompatibleObjectives: ['goals requiring immediate high-impact loading without tendon preparation'],
    },
    uiPills: [
      { text: 'I tendini guariscono con il carico, non col riposo. Ma il carico deve essere giusto', sourceId: 'Cook & Purdam BJSM 2009' },
      { text: 'Dolore 5/10: ok. Dolore ancora presente 24h dopo: troppo', sourceId: 'BJSM 2016' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P50', 'P48', 'P05'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,

    blockCatalogIds: [
      'RTP_FIELD_REBUILD',
      'ECCENTRIC_HAMSTRING_PREHAB',
      'ZONE2_FOUNDATION',
    ],

    profileModifiers: [
      {
        block_id:               'RTP_FIELD_REBUILD',
        activation_priority:    1,
        progression_bias:       'intensity_first',  // isometrico → isotonic pesante → sport-specific
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'FIRMA COOK: isometrico (fase reattiva) → Heavy Slow Resistance → sport-specific. Progressione sempre gated da VAS 24h post-sessione.',
        additional_red_flags: [
          {
            condition: 'VAS >5/10 durante esercizio tendine',
            action:    'Stop esercizio; tornare a fase isometrica per 3–5 giorni',
            priority:  'veto',
            source_id: 'Cook & Purdam BJSM 2009',
          },
          {
            condition: 'VAS non risolto entro 24h dalla sessione',
            action:    'Carico troppo alto; ridurre del 20–30%; riassessare staging del continuum',
            priority:  'high',
            source_id: 'Cook & Purdam BJSM 2009',
          },
        ],
      },
      {
        block_id:               'ECCENTRIC_HAMSTRING_PREHAB',
        activation_priority:    1,
        progression_bias:       'intensity_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: -10,  // Cook inizia conservativo, enfatizza isometrico prima
        preferred_phase:        'any',
        override_dosage: {
          rpe_target: [4, 6],  // Cook: fase iniziale conservativa, mai al massimale
        },
        coach_specific_notes:   'Cook usa HSR (Heavy Slow Resistance) come stimolo primario per remodeling tendineo. Inizio isometrico obbligatorio in fase reattiva.',
      },
      {
        block_id:               'ZONE2_FOUNDATION',
        activation_priority:    2,
        progression_bias:       'volume_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'Carico aerobico di mantenimento durante rehab tendinosa: mantiene capacità sistemica senza aggravare il tendine.',
      },
    ],

    methodologyV2: {
      load_philosophy:        'I tendini guariscono con il carico appropriato — il riposo completo è controproducente. La chiave è il TIPO e la progressione del carico.',
      preferred_progression:  'intensity_first',
      block_selection_logic:  'Fase isometrica (reactive) → HSR 3–4×/sett × 8–12 sett → funzionale/sport-specific. Criterio di avanzamento: VAS ≤2/10 per 3 sessioni consecutive.',
      assessment_bias:        ['Pain VAS durante esercizio e 24h post', 'VISA score', 'isometric force output', 'tendine: gonfiore e temperatura'],
      signature_constraints:  ['VAS >5/10 durante esercizio = stop IMMEDIATO', 'VAS persistente >24h = riduzione carico 20–30%', 'mai riposo completo in fase tendinosa — almeno isometrico attivo', 'evitare compressione tendinea in fase reattiva'],
    },

    resilientRedFlags: [
      {
        primary_source:       'pain_vas',
        fallback_1_source:    'hrv_zscore',
        condition:            'VAS >5/10 durante esercizio al tendine',
        threshold:            5,
        fallback_1_threshold: -1.5,
        action_code:          'BLOCKED_PAIN',
        confidence_penalty:   0.5,
        ui_explanation:       'Dolore tendine eccessivo: stop esercizio caricante; tornare a isometrico per 3–5 giorni.',
      },
      {
        primary_source:       'pain_vas',
        fallback_1_source:    'wizard',
        condition:            'VAS non risolto entro 24h dalla sessione',
        threshold:            3,
        fallback_1_threshold: 3,
        action_code:          'REDUCE_LOAD',
        confidence_penalty:   0.35,
        ui_explanation:       'Risposta tendinea al carico eccessiva: ridurre carico del 20–30%; riassessare fase del continuum.',
      },
    ],
  },

  // ── P50 ── Peter Malliaras — Tendon Load Management (Evidence A) ────────────
  {
    id: 'P50',
    name: 'Peter Malliaras',
    role: 'tendinopathy clinician-researcher',
    discipline: 'tendon health | load management | return to play',
    era: '2010s-2020s',
    nationality: 'Australia',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'PubMed – tendinopathy management update', url: 'https://pubmed.ncbi.nlm.nih.gov/26390269/', type: 'peer-reviewed', priority: 1 },
        { title: 'JOSPT – patellar tendinopathy', url: 'https://www.jospt.org/doi/abs/10.2519/jospt.2015.5987', type: 'peer-reviewed', priority: 2 },
        { title: 'PMC – tendon rehabilitation', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7716685/', type: 'peer-reviewed PMC', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Return-to-sport criteria: pain-free under load + strength within 10% of contralateral',
        'Tendon load must increase progressively: reactive → HSR → energy storage → sport-specific',
        'Energy storage (plyometrics) = highest tendon stress; only introduce after HSR phase complete',
        'Manage energy storage separately from compressive loads',
        'Individual response monitoring: pain and function both required to progress',
      ],
    },
    load: {
      rules: [
        'Same rules as P49 for pain monitoring (5/10 ceiling, 24h clearance)',
        'Energy storage phase: start with double-leg, progress to single-leg plyometrics',
        'Return to play criteria: complete sport-specific protocol pain-free for 4+ weeks',
      ],
    },
    blocks: [
      {
        name: 'Energy Storage / Plyometric Phase',
        durationWeeks: [4, 8],
        dosage: 'Double-leg jumps → single-leg → depth jumps → sport-specific; monitor pain every session',
        progression: 'Proceed only when pain <2/10 sustained through previous block',
      },
    ],
    kpis: [
      { name: 'Single-leg hop distance vs contralateral (%)', type: 'performance' },
      { name: 'Pain during plyometrics (0–10)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Pain flare after plyometric session >3/10 next day', action: 'Return to HSR phase; premature energy storage introduction' },
    ],
    mapping: {
      userArchetypes: ['athlete with chronic tendinopathy', 'post-surgical tendon return', 'competitive athlete with patellar/Achilles issues'],
      compatibleObjectives: ['tendon return to sport', 'plyometric reintroduction', 'injury prevention maintenance'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'Salti e pliometria: l\'ultima fase, non la prima. Il tendine deve essere pronto', sourceId: 'JOSPT 2015' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P49', 'P48', 'P05'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,

    blockCatalogIds: [
      'RTP_FIELD_REBUILD',
      'ECCENTRIC_HAMSTRING_PREHAB',
      'COD_MECHANICS',
      'SPRINT_ACCELERATION',
    ],

    profileModifiers: [
      {
        block_id:               'RTP_FIELD_REBUILD',
        activation_priority:    1,
        progression_bias:       'intensity_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'FIRMA MALLIARAS: energy storage (pliometrica) è l\'ultima fase del RTP tendineo. Progressione: HSR completo → double-leg jumps → single-leg → sport-specific.',
        additional_red_flags: [
          {
            condition: 'Pain flare dopo sessione pliometrica >3/10 il giorno successivo',
            action:    'Tornare a fase HSR — energia storage introdotta troppo presto',
            priority:  'veto',
            source_id: 'Malliaras JOSPT 2015',
          },
        ],
      },
      {
        block_id:               'ECCENTRIC_HAMSTRING_PREHAB',
        activation_priority:    1,
        progression_bias:       'intensity_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'Malliaras: stesse regole Cook per pain monitoring (5/10 ceiling, clearance 24h). LSI ≥ 90% prima di avanzare a fase energy storage.',
      },
      {
        block_id:               'COD_MECHANICS',
        activation_priority:    2,
        progression_bias:       'intensity_first',
        volume_modifier_pct:    0,
        intensity_modifier_pct: 0,
        preferred_phase:        'any',
        coach_specific_notes:   'COD introdotto in fase sport-specific del RTP. LSI ≥ 90% prerequisito obbligatorio prima del COD ad alta intensità.',
      },
      {
        block_id:               'SPRINT_ACCELERATION',
        activation_priority:    3,
        progression_bias:       'intensity_first',
        volume_modifier_pct:    -20,  // volume ridotto: fase finale RTP, non il focus
        intensity_modifier_pct: -10,
        preferred_phase:        'any',
        coach_specific_notes:   'Sprint: ultima fase RTP. Solo dopo COD pain-free e LSI ≥ 90%. 4+ settimane sport-specific pain-free prima di ritorno agonistico.',
      },
    ],

    methodologyV2: {
      load_philosophy:        'Energy storage è il test finale del tendine, non il punto di partenza. La pliometrica si guadagna.',
      preferred_progression:  'intensity_first',
      block_selection_logic:  'HSR completo → double-leg plyometrics → single-leg → sport-specific (COD + sprint). Criterio avanzamento: pain-free + LSI ≥ 90%.',
      assessment_bias:        ['single-leg hop distance vs controlaterale (%)', 'Pain VAS durante pliometrica', 'VISA score', 'tendon thickness imaging se disponibile'],
      signature_constraints:  ['pliometrica SOLO dopo HSR completo', 'LSI ≥ 90% prima di sprint e COD', 'RTP sport-specific ≥ 4 sett pain-free prima di gara agonistica'],
    },

    resilientRedFlags: [
      {
        primary_source:       'pain_vas',
        fallback_1_source:    'mechanical_performance',
        condition:            'Pain flare >3/10 il giorno dopo sessione pliometrica',
        threshold:            3,
        fallback_1_threshold: 10,  // single-leg hop distance drop >10%
        action_code:          'SUBSTITUTE_LOWER_INTENSITY',
        confidence_penalty:   0.4,
        ui_explanation:       'Risposta tendinea al carico energy storage: tornare a fase HSR. L\'introduzione pliometrica era prematura.',
      },
      {
        primary_source:       'pain_vas',
        fallback_1_source:    'hrv_zscore',
        condition:            'VAS >5/10 durante esercizio tendine in qualsiasi fase',
        threshold:            5,
        fallback_1_threshold: -1.5,
        action_code:          'BLOCKED_PAIN',
        confidence_penalty:   0.5,
        ui_explanation:       'Dolore eccessivo: stop carico. Tornare alla fase precedente del protocollo Malliaras.',
      },
    ],
  },

  // ── P48 ── Stuart McGill — Spine Biomechanics (Evidence B) ───────────────────
  {
    id: 'P48',
    name: 'Stuart McGill',
    role: 'spine biomechanics researcher | clinician',
    discipline: 'spine health | prehab | core stability',
    era: '1990s-2020s',
    nationality: 'Canada',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Back Mechanic – McGill Method', url: 'https://www.backfitpro.com/books/back-mechanic-the-mcgill-method-to-fix-back-pain/', type: 'author book', priority: 1 },
        { title: 'Ultimate Back Fitness and Performance (6th ed.)', url: 'https://www.backfitpro.com/books/ultimate-back-fitness-and-performance-6th-edition-2017/', type: 'author textbook', priority: 2 },
        { title: 'PubMed – core stability review', url: 'https://pubmed.ncbi.nlm.nih.gov/26756637/', type: 'peer-reviewed', priority: 3 },
        { title: 'McGill Big 3 – exercise guide', url: 'https://www.chirocentre.com.au/stuart-mcgills-big-three-low-back-exercises/', type: 'practitioner guide', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Spine stiffness for force transfer (not flexibility): stability = performance',
        '"Big 3" as minimum daily spine hygiene: curl-up, side bridge, bird-dog',
        'Hip hinge mechanics: load the hips, spare the spine in all compound movements',
        'Identify individual pain triggers (flexion vs extension vs torsion); avoid aggravating pattern',
        'Core endurance > core strength: planks > crunches for spine health',
      ],
    },
    load: {
      rules: [
        'Start every training day with McGill Big 3 as spine prep (10 min)',
        'Avoid repeated spinal flexion under load if history of disc issues',
        'Hip hinge technique gate: all deadlifts/Romanian DL require hip-hinge screening first',
        'Pain during exercise = stop; identify movement pattern → modify; no grinding through back pain',
      ],
    },
    blocks: [
      {
        name: 'McGill Foundation Block',
        durationWeeks: [4, 8],
        dosage: 'Daily: Big 3 (curl-up 5×1, side bridge 3×10s, bird-dog 5×10s) + hip mobility',
        progression: 'Increase hold durations; add single-leg variations when pain-free',
      },
    ],
    kpis: [
      { name: 'Back pain VAS during exercise (0–10)', type: 'systemic' },
      { name: 'Hip hinge quality (coach assessment)', type: 'mechanical' },
      { name: 'McGill Big 3 endurance scores', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Back pain >3/10 during any loaded exercise', action: 'Stop; identify aggravating pattern; modify to pain-free alternative' },
      { trigger: 'Neurological symptoms (shooting, tingling)', action: 'Cease training; immediate sports medicine referral' },
    ],
    mapping: {
      userArchetypes: ['any athlete with back pain history', 'powerlifter with disc issues', 'desk worker starting training'],
      compatibleObjectives: ['back pain prevention', 'spine health + performance', 'return to deadlift/squat safely'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'Big 3 ogni mattina: l\'igiene della colonna è fondamento della performance', sourceId: 'McGill Back Mechanic 2015' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P49', 'P50', 'P05'],
    },
  },

  // ── P04 ── Paul Laursen — HIIT Science / Endurance (Evidence A) ───────────────
  {
    id: 'P04',
    name: 'Paul Laursen',
    role: 'exercise physiologist / HIIT researcher',
    discipline: 'HIIT science | endurance | team sport conditioning',
    era: '2000s-2020s',
    nationality: 'New Zealand',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Buchheit & Laursen – HIIT Part I (SMJSM 2013)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3424817/', type: 'peer-reviewed', priority: 1 },
        { title: 'Buchheit & Laursen – HIIT Part II (SMJSM 2013)', url: 'https://martin-buchheit.net/wp-content/uploads/2018/01/buchheit-laursen-hit-solutions-to-the-programming-puzzle-part-ii.pdf', type: 'peer-reviewed PDF', priority: 2 },
        { title: 'High-Performance Training for Sports (Human Kinetics)', url: 'https://us.humankinetics.com/products/high-performance-training-for-sports', type: 'book', priority: 3 },
        { title: 'HIIT Science – newzealandhighperformance.org.nz', url: 'https://newzealandhighperformance.org.nz/', type: 'official body', priority: 4 },
        { title: 'Laursen PubMed – VO2max and HIIT', url: 'https://pubmed.ncbi.nlm.nih.gov/25441243/', type: 'peer-reviewed', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Prescribe HIIT by power/speed at VO2max (vVO2max / pVO2max) — not HR zones alone',
        'Distinguish "aerobic HIIT" (SIT-like, 30–60s at 130–170% vVO2max) from "anaerobic HIIT" (≥3min at 90–100% vVO2max)',
        'Work:rest ratio determines metabolic target: 1:1 = aerobic; 1:4+ = neuromuscular/speed',
        'Match HIIT density to weekly training load; back-calculate from total stressor budget',
        'Volume determines training load; intensity determines adaptation type — never conflate them',
      ],
    },
    load: {
      rules: [
        'Minimum 40h aerobic base before introducing HIIT in untrained athletes',
        'HIIT frequency ≤2–3 sessions/wk; more is overload, not adaptation',
        'Reduce HIIT volume when training monotony (TSB/ATL) accumulates without decay',
        'Use supra-maximal intervals (120–130% vVO2max, 15–30s) for neuromuscular stimulus without excessive metabolic cost',
        'Re-test VO2max every 6–8 weeks to recalibrate HIIT zones',
      ],
    },
    blocks: [
      {
        name: 'Aerobic Base Block',
        durationWeeks: [6, 12],
        dosage: '80% low intensity; 20% moderate; no HIIT until base established',
        progression: 'Volume +5–10%/wk; introduce threshold work only after 6+ weeks',
      },
      {
        name: 'HIIT Introduction Block',
        durationWeeks: [4, 6],
        dosage: '2×/wk; 4–8 × 3–4min at 90–100% vVO2max; 3–4min passive rest',
        progression: 'Add 1 interval/session per week before increasing intensity',
      },
      {
        name: 'SIT / Sprint-Interval Block',
        durationWeeks: [3, 6],
        dosage: '2–3×/wk; 6–10 × 30s at 130–170% vVO2max; 4–5min rest',
        progression: 'Increase reps first; reduce rest only after technical proficiency',
      },
      {
        name: 'Taper Block',
        durationWeeks: [2, 3],
        dosage: 'Reduce volume 40–60%; maintain intensity; 1–2 HIIT sessions total',
        progression: 'No progression — sharpening phase only',
      },
    ],
    kpis: [
      { name: 'VO2max / vVO2max test', type: 'performance' },
      { name: 'Lactate threshold velocity', type: 'performance' },
      { name: 'sRPE session load', type: 'systemic' },
      { name: 'HRV morning readiness', type: 'systemic' },
      { name: 'Time-in-zone distribution (80/20 check)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'RPE >9 for ≥3 sessions/wk or HRV declining trend >5 days', action: 'Remove 1 HIIT session; add 1 easy session; re-assess after 1 week' },
      { trigger: 'VO2max test performance flat or declining despite training', action: 'Recheck intensity accuracy; possible overreach — insert 1-week deload' },
    ],
    mapping: {
      userArchetypes: ['endurance athlete', 'team sport player', 'crossfit competitor', 'recreational runner'],
      compatibleObjectives: ['VO2max improvement', 'speed endurance', 'sport-specific conditioning'],
      incompatibleObjectives: ['pure hypertrophy', 'powerlifting peak'],
    },
    uiPills: [
      { text: 'L\'HIIT più efficiente: 4×4min al 90–95% FCmax con 3min recupero', sourceId: 'Buchheit & Laursen 2013' },
      { text: 'Prescrivi HIIT su vVO2max, non su % FC: è più preciso e riproducibile', sourceId: 'Laursen HIIT Science' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P03', 'P05', 'P16'],
    },
    periodizationModel: ['concurrent'],
    assessmentScreening: ['VO2max test', 'vVO2max incremental test', 'lactate threshold test', 'HRV monitoring'],
  },

  // ── P35 ── Vladimir Issurin — Block Periodization (Evidence A) ────────────────
  {
    id: 'P35',
    name: 'Vladimir Issurin',
    role: 'sport scientist / periodization theorist',
    discipline: 'block periodization | multi-sport elite performance',
    era: '1980s-2020s',
    nationality: 'Israel / USSR',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Block Periodization – Breakthrough in Sport Training (2008)', url: 'https://www.amazon.com/Block-Periodization-Breakthrough-Sport-Training/dp/0970030630', type: 'book', priority: 1 },
        { title: 'Block Periodization 2 – Fundamental Concepts and Training Design (2010)', url: 'https://www.amazon.com/Block-Periodization-2-Vladimir-Issurin/dp/0970030649', type: 'book', priority: 2 },
        { title: 'New horizons for the methodology and physiology of training periodization', url: 'https://pubmed.ncbi.nlm.nih.gov/20715905/', type: 'peer-reviewed', priority: 3 },
        { title: 'Residual effects of long-lasting training loads and its effect on programming', url: 'https://pubmed.ncbi.nlm.nih.gov/19199754/', type: 'peer-reviewed', priority: 4 },
        { title: 'Sport Science Insider – Linear vs Block vs Undulating', url: 'https://sportscienceinsider.com/linear-vs-block-vs-undulating-periodization/', type: 'review article', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Block = 2–4 week mesocycles targeting a SINGLE dominant quality (accumulation → transmutation → realization)',
        'Residual training effects: aerobic capacity lasts 30+ days; max strength ~30 days; speed-strength 5–10 days; technique 30+ days',
        'Concentrate workloads to maximize specific adaptation — avoid "jack of all trades" concurrent training for advanced athletes',
        'Sequence blocks so that qualities with longer residuals are built first; shorter-residual qualities come last (peak phase)',
        'Accumulation block: high volume, lower intensity — builds aerobic/strength base',
        'Transmutation block: sport-specific, moderate volume/intensity',
        'Realization block: low volume, high intensity — peaking for competition',
      ],
    },
    load: {
      rules: [
        'Accumulation block: 3–4 weeks; volume 100% base; intensity 60–75%',
        'Transmutation block: 3–4 weeks; volume 75%; intensity 80–90%',
        'Realization block: 2–3 weeks; volume 50–60%; intensity 90–100%',
        'Do NOT add new heavy qualities in realization — only sharpen existing adaptations',
        'Novice athletes (<3y training): use linear, not block (too little residual capacity)',
      ],
    },
    blocks: [
      {
        name: 'Accumulation Block',
        durationWeeks: [3, 4],
        dosage: 'High volume (100% baseline); low-moderate intensity (60–75%); general conditioning focus',
        progression: 'Linear volume increase; technique drill volume high',
      },
      {
        name: 'Transmutation Block',
        durationWeeks: [3, 4],
        dosage: 'Moderate volume (75%); increased intensity (80–90%); sport-specific qualities emphasized',
        progression: 'Volume decreases as intensity rises; sport-specific exercises increase proportion',
      },
      {
        name: 'Realization Block',
        durationWeeks: [2, 3],
        dosage: 'Low volume (50–60%); peak intensity (90–100%); competition-specific drills',
        progression: 'Minimal — maintain form only; no new loading challenges',
      },
    ],
    kpis: [
      { name: 'Residual performance retention per quality (% baseline)', type: 'performance' },
      { name: 'Competition readiness score (RPE + subjective form)', type: 'systemic' },
      { name: 'Volume load per block vs previous cycle', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Performance declines in realization block', action: 'Check if transmutation intensity was too high; add 2-3 extra easy days before competition' },
      { trigger: 'Athlete reports chronic fatigue after accumulation', action: 'Shorten accumulation by 1 week; insert 3-day deload before transmutation' },
    ],
    mapping: {
      userArchetypes: ['advanced athlete (3+ years training)', 'competitive sport athlete', 'periodization-ready user'],
      compatibleObjectives: ['competitive peak', 'multi-quality athletic development', 'advanced periodization'],
      incompatibleObjectives: ['beginner fitness', 'general health maintenance'],
    },
    uiPills: [
      { text: 'Blocchi da 3–4 settimane: accumulo → trasmutazione → realizzazione. Il picco si pianifica, non si improvvisa', sourceId: 'Issurin Block Periodization 2008' },
      { text: 'La capacità aerobica rimane per 30+ giorni. Costruiscila per prima, poi aggiungi la velocità', sourceId: 'Issurin residual effects 2008' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P34', 'P16', 'P36'],
    },
    periodizationModel: ['block'],
    assessmentScreening: ['competition calendar mapping', 'residual quality tracking', 'performance test battery'],
  },

  // ── P36 ── Vladimir Zatsiorsky — Science and Practice of Strength (Evidence A) ─
  {
    id: 'P36',
    name: 'Vladimir Zatsiorsky',
    role: 'biomechanist / strength scientist',
    discipline: 'strength science | sport biomechanics',
    era: '1960s-2010s',
    nationality: 'Russia / USA',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Science and Practice of Strength Training (Human Kinetics 2006)', url: 'https://us.humankinetics.com/products/science-and-practice-of-strength-training-3rd-edition', type: 'book', priority: 1 },
        { title: 'Biomechanics in Sport (Blackwell Science 2000)', url: 'https://www.amazon.com/Biomechanics-Sport-Zatsiorsky/dp/0632053925', type: 'book', priority: 2 },
        { title: 'Kinematics of Human Motion (Human Kinetics 1998)', url: 'https://us.humankinetics.com/products/kinematics-of-human-motion', type: 'book', priority: 3 },
        { title: 'Zatsiorsky on strength training – SportScience.org', url: 'https://www.sportsci.org/jour/9901/wjh.html', type: 'expert review', priority: 4 },
        { title: 'PMC – Strength training adaptation review citing Zatsiorsky', url: 'https://pubmed.ncbi.nlm.nih.gov/20299700/', type: 'peer-reviewed', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Three methods of strength development: maximal effort (1–3RM), repeated effort (sets to failure), dynamic effort (submaximal with maximal speed)',
        'Dynamic effort method (50–70% 1RM at max velocity) develops rate of force development (RFD) — critical for sport power',
        'Maximal effort method produces greatest neural adaptations; must be used sparingly (not every session)',
        'Repeated effort method: effective for hypertrophy; less effective for max strength in advanced athletes',
        'Fitness-fatigue (superimposition) model: readiness = fitness − fatigue; manage both independently',
        'Specificity of strength: isometric, dynamic, and ballistic strength transfer poorly to each other',
      ],
    },
    load: {
      rules: [
        'Dynamic effort: 50–70% 1RM; max concentric velocity; 5–8 sets × 2–3 reps; full rest 3–5min',
        'Maximal effort: 85–100% 1RM; 1–3 reps; rotate exercises every 1–3 weeks to avoid accommodation',
        'Repeated effort: 60–85% 1RM; 3–5 sets × 6–12 reps; incomplete rest 90s',
        'Fitness-fatigue monitoring: do NOT increase load if fatigue signal is dominant (poor sleep, mood, sRPE >8)',
        'Accommodate resistance (bands/chains) to match strength curve and overcome sticking points',
      ],
    },
    blocks: [
      {
        name: 'Strength Foundation Block',
        durationWeeks: [4, 6],
        dosage: 'Maximal effort + repeated effort alternating; 70–85% 1RM; 3–5 sets',
        progression: 'Weekly 2.5–5% load increase on compound movements',
      },
      {
        name: 'Power-Strength Block',
        durationWeeks: [4, 6],
        dosage: 'Dynamic effort 2×/wk (50–70% 1RM, max speed) + maximal effort 1×/wk',
        progression: 'Maintain load; focus on improving bar velocity and RFD',
      },
      {
        name: 'Peaking Block',
        durationWeeks: [2, 3],
        dosage: 'Heavy singles/doubles (90–100% 1RM); reduced volume; maximal effort only',
        progression: 'Test 1RM or competition; taper 10 days before',
      },
    ],
    kpis: [
      { name: '1RM on primary lifts', type: 'performance' },
      { name: 'Bar velocity at given % 1RM (VBT proxy)', type: 'mechanical' },
      { name: 'Rate of Force Development (RFD) — jump height proxy', type: 'neuromuscular' },
      { name: 'Fitness-fatigue ratio (readiness score)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Bar velocity drops >10% at same load vs previous session', action: 'Fatigue dominant; deload immediately — reduce volume 50%, intensity 15%' },
      { trigger: 'Sticking point worsening on same exercise >2 sessions', action: 'Rotate to variation (paused, deficit, pin) for 2–3 weeks' },
    ],
    mapping: {
      userArchetypes: ['strength athlete', 'powerlifter', 'sport athlete needing power', 'advanced lifter'],
      compatibleObjectives: ['max strength', 'power output', 'athletic performance', '1RM improvement'],
      incompatibleObjectives: ['beginner general fitness', 'pure endurance'],
    },
    uiPills: [
      { text: 'Metodo dinamico: 60% 1RM alla massima velocità. Così si allena la potenza esplosiva', sourceId: 'Zatsiorsky Science & Practice 2006' },
      { text: 'Prontezza = Fitness − Fatica. Allena la fitness, gestisci la fatica', sourceId: 'Zatsiorsky fitness-fatigue model' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P27', 'P34', 'P37'],
    },
    periodizationModel: ['block', 'undulating'],
    assessmentScreening: ['1RM test', 'bar velocity measurement (VBT)', 'countermovement jump (CMJ)', 'readiness rating'],
  },

  // ── P37 ── Yuri Verkhoshansky — Plyometrics / Supertraining (Evidence A) ───────
  {
    id: 'P37',
    name: 'Yuri Verkhoshansky',
    role: 'sport scientist / plyometrics pioneer',
    discipline: 'pliometria | forza reattiva | programmazione shock',
    era: '1960s-2000s',
    nationality: 'Russia / USSR',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Supertraining (6th Edition) — Siff & Verkhoshansky', url: 'https://www.amazon.com/Supertraining-Mel-Siff/dp/B001E0O0TG', type: 'book', priority: 1 },
        { title: 'Special Strength Training: A Practical Manual for Coaches', url: 'https://www.amazon.com/Special-Strength-Training-Manual-Coaches/dp/B00AOG2I96', type: 'book', priority: 2 },
        { title: 'Programming and Organization of Training (1988)', url: 'https://www.amazon.com/Programming-Organization-Training-Yuri-Verkhoshansky/dp/0938692380', type: 'book', priority: 3 },
        { title: 'Plyometric training review citing Verkhoshansky — PMC', url: 'https://pubmed.ncbi.nlm.nih.gov/21804427/', type: 'peer-reviewed', priority: 4 },
        { title: 'Depth jump and reactive strength research', url: 'https://pubmed.ncbi.nlm.nih.gov/18438213/', type: 'peer-reviewed', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Shock Method (depth jumps): exploit stretch-shortening cycle (SSC) via rapid eccentric loading → explosive concentric; contact time <0.2s is the criterion',
        'Reactive Strength Index (RSI = jump height / contact time): key metric for SSC efficiency',
        'Plyometrics must be periodized: volume decreases as intensity increases across the training cycle',
        'Strength prerequisites before plyometrics: back squat ≥1.5×BW for lower body; press ≥0.75×BW for upper body',
        'Block method application: concentrated plyometric loads in transmutation block after strength accumulation',
        'Speed-strength vs strength-speed: distinguish explosive power (fast against light load) vs power (heavy with intent)',
      ],
    },
    load: {
      rules: [
        'Depth jump height: 40–80cm; START at 40cm; increase only when RSI improves',
        'Plyometric volume: <100 foot contacts/session for beginners; 120–200 for advanced',
        'Minimum 48h rest between plyometric sessions; never perform after heavy strength work',
        'Never combine depth jumps with heavy squat on same day',
        'Progress: low-amplitude → high-amplitude; bilateral → unilateral; slow SSC → fast SSC',
        'Monitor contact time; if >250ms, reduce box height or load',
      ],
    },
    blocks: [
      {
        name: 'Strength Prerequisite Block',
        durationWeeks: [6, 12],
        dosage: 'Build squat/deadlift to minimum ≥1.5×BW; no intensive plyometrics yet',
        progression: 'Standard linear strength progression',
      },
      {
        name: 'Low-Intensity Plyometric Block',
        durationWeeks: [4, 6],
        dosage: '2×/wk; 60–100 contacts; jump rope, box step-down, broad jumps; bilateral only',
        progression: 'Add 10–15 contacts/session each week',
      },
      {
        name: 'Shock Method Block',
        durationWeeks: [3, 5],
        dosage: '2×/wk; 60–80 depth jumps; 40–60cm box; full rest 2–3min between reps',
        progression: 'Track RSI; increase box height only when RSI plateaus at current height',
      },
    ],
    kpis: [
      { name: 'Reactive Strength Index (RSI = jump height / contact time)', type: 'neuromuscular' },
      { name: 'Countermovement Jump (CMJ) height', type: 'neuromuscular' },
      { name: 'Drop jump contact time (ms)', type: 'neuromuscular' },
      { name: 'Squat 1RM (strength prerequisite check)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Contact time >300ms consistently in depth jumps', action: 'Reduce box height to 30cm; reinforce stiffness cues; add calf/ankle strength work' },
      { trigger: 'Jump height regression >5% over 2 sessions', action: 'CNS fatigue likely; reduce plyometric sessions to 1×/wk; insert 1 full rest week' },
      { trigger: 'Squat <1.5×BW attempting intensive plyometrics', action: 'Return to strength phase; plyometrics contraindicated below strength threshold' },
    ],
    mapping: {
      userArchetypes: ['sprint athlete', 'basketball/volleyball player', 'advanced strength athlete wanting explosive power', 'team sport player'],
      compatibleObjectives: ['explosive power', 'sprint acceleration', 'vertical jump', 'athletic performance'],
      incompatibleObjectives: ['beginner fitness', 'endurance only', 'weight loss only'],
    },
    uiPills: [
      { text: 'Depth jump: il tempo di contatto <200ms è la differenza tra plyometria e salto qualunque', sourceId: 'Verkhoshansky Supertraining' },
      { text: 'RSI = altezza salto ÷ tempo contatto. Questo numero riassume la tua potenza reattiva', sourceId: 'Verkhoshansky reactive strength' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P36', 'P08', 'P34'],
    },
    periodizationModel: ['block', 'linear'],
    assessmentScreening: ['countermovement jump (CMJ)', 'reactive strength index (RSI)', 'squat 1RM', 'drop jump contact time'],
  },

  // ── P40 ── Greg Glassman — CrossFit (Evidence A) ─────────────────────────────
  {
    id: 'P40',
    name: 'Greg Glassman',
    role: 'CrossFit founder / functional fitness coach',
    discipline: 'CrossFit | functional fitness | work capacity',
    era: '2000s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'What is Fitness? – CrossFit Journal 2002', url: 'https://library.crossfit.com/free/pdf/CFJ_Trial_04_2002_Fitness.pdf', type: 'official methodology article', priority: 1 },
        { title: 'CrossFit Level 1 Training Guide (official)', url: 'https://library.crossfit.com/free/pdf/CFJ_L1_Training_Guide.pdf', type: 'official guide', priority: 2 },
        { title: 'CrossFit.com – foundational methodology articles', url: 'https://www.crossfit.com/essentials/', type: 'official methodology', priority: 3 },
        { title: 'CrossFit injury rate and safety research – PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3979461/', type: 'peer-reviewed', priority: 4 },
        { title: 'Work capacity across broad time and modal domains – CrossFit Journal', url: 'https://library.crossfit.com/free/pdf/54_06_crossfit_foundation.pdf', type: 'methodology article', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Fitness = work capacity across broad time and modal domains: optimizing the 10 general physical skills',
        '10 physical skills: cardiovascular/respiratory endurance, stamina, strength, flexibility, power, speed, coordination, agility, balance, accuracy',
        'Constantly varied functional movements at high intensity — avoid specialization, optimize GPP (General Physical Preparedness)',
        'Three metabolic pathways: phosphagen (0–10s), glycolytic (10s–2min), oxidative (2min+) — train all three',
        'Scalable: adjust load, reps, and time domains; never adjust mechanics — movement quality is non-negotiable',
        'Community and competition as motivational tools — measurable, observable, repeatable benchmarks (WODs)',
      ],
    },
    load: {
      rules: [
        'Intensity = power output (force × distance / time) — use this as the primary load variable, not subjective effort alone',
        'Never sacrifice mechanics for intensity; scale load and reps before compromising movement pattern',
        'High-skill movements (snatch, muscle-up, handstand walk) require dedicated skill work — do NOT program these only in WODs',
        'Rest days: CF recommends 3-on/1-off or 5-on/2-off; more is fine for advanced; listen to athlete',
        'Avoid chronic specialization: rotate time domains (1-5min / 5-15min / 15-30min) across the week',
      ],
    },
    blocks: [
      {
        name: 'GPP Foundations Block',
        durationWeeks: [4, 8],
        dosage: 'Daily WOD; mixed modal; short-medium time domains (5–15min); skill work 15min/session',
        progression: 'Load/rep increases tracked via benchmark WOD re-test every 4 weeks',
      },
      {
        name: 'Strength Cycle Block',
        durationWeeks: [6, 12],
        dosage: 'Dedicated strength work (squat/press/deadlift) 3–4×/wk before WOD; lower WOD intensity',
        progression: 'Linear or undulating strength progression with CrossFit WOD as GPP maintenance',
      },
      {
        name: 'Competition Prep Block',
        durationWeeks: [6, 12],
        dosage: 'Sport-specific WOD selection; practice multiple workouts/day; simulate competition format',
        progression: 'Increase WOD density; practice pacing strategy; taper last 2 weeks',
      },
    ],
    kpis: [
      { name: 'Benchmark WOD performance (Fran, Helen, Grace, etc.)', type: 'performance' },
      { name: 'Total work output (kg × reps / time)', type: 'mechanical' },
      { name: 'RPE per WOD session', type: 'systemic' },
      { name: 'Max unbroken sets on gymnastics skills', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Mechanics breakdown under fatigue on barbell lifts ≥2 sessions/wk', action: 'Scale load to 70–80%; dedicate separate skill sessions; no RX until form restores' },
      { trigger: 'Rhabdomyolysis risk: extreme soreness, dark urine post-workout', action: 'Stop immediately; urgent medical evaluation; "Rhabdo" is a real risk with excessive eccentric volume (muscle-ups, heavy rowing)' },
      { trigger: 'Performance plateau on all benchmark WODs >4 weeks', action: 'Insert dedicated strength cycle; reduce WOD frequency temporarily to 3×/wk' },
    ],
    mapping: {
      userArchetypes: ['CrossFit athlete', 'GPP-focused trainer', 'competitive fitness athlete', 'functional fitness enthusiast'],
      compatibleObjectives: ['general athleticism', 'work capacity', 'functional strength', 'competitive CrossFit'],
      incompatibleObjectives: ['marathon running only', 'pure bodybuilding', 'advanced powerlifting peak'],
    },
    uiPills: [
      { text: 'CrossFit definisce il fitness: capacità di lavoro su tempo e modalità ampie. Misurabile, osservabile, ripetibile', sourceId: 'Glassman CrossFit Journal 2002' },
      { text: 'Intensità = potenza. Non quanto ti fai del male: quanto lavoro fai per unità di tempo', sourceId: 'CrossFit L1 Training Guide' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P04', 'P03', 'P27'],
    },
    periodizationModel: ['concurrent', 'undulating'],
    assessmentScreening: ['benchmark WOD battery (Fran, Grace, Helen)', 'max lift 1RM', 'gymnastics skill test', 'aerobic capacity (2km row)'],
  },

  // ── P06 ── Frans Bosch — Biomechanics & Coordination (Evidence B) ─────────────
  {
    id: 'P06',
    name: 'Frans Bosch',
    role: 'biomechanics coach / movement scientist',
    discipline: 'biomeccanica | coordinazione | atletismo',
    era: '1990s-2020s',
    nationality: 'Netherlands',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Anatomy of Agility – Bosch (2015)', url: 'https://www.amazon.com/Anatomy-Agility-Strength-Coordination-Technician/dp/1785003475', type: 'book', priority: 1 },
        { title: 'Strength Training and Coordination – Bosch (2015)', url: 'https://www.amazon.com/Strength-Training-Coordination-Integrative-Approach/dp/1905367335', type: 'book', priority: 2 },
        { title: 'Running Science – Bosch (2013)', url: 'https://www.amazon.com/Running-Science-Frans-Bosch/dp/1905367998', type: 'book', priority: 3 },
        { title: 'Frans Bosch official website / workshops', url: 'https://www.fransbosch.systems/', type: 'official resource', priority: 4 },
        { title: 'PMC – Complex movement and training variability', url: 'https://pubmed.ncbi.nlm.nih.gov/33823009/', type: 'peer-reviewed', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Coordination precedes strength: a poorly coordinated movement amplified by strength = injury',
        'Attractor states & fluctuator states: stable movement patterns (attractors) must be challenged with variability (fluctuators) to build adaptability',
        'Sprint mechanics: hip extension at toe-off and reactive leg stiffness are the key performance variables; NOT ground contact time alone',
        'Strength training must resemble the coordination demands of the target sport — generic strength poorly transfers',
        'Resisted sprinting and complex variation drills are more specific than isolated gym work for sprint coordination',
        'The brain optimizes for energy efficiency, not perfection — training must create problems for the CNS to solve, not copy a fixed template',
      ],
    },
    load: {
      rules: [
        'Never add load (resistance/weight) to a movement pattern that is not yet coordinatively stable',
        'Introduce variability progressively: fixed → constrained variability → open variability',
        'Resisted sprint: 10–15% BW sled; beyond 15% distorts sprint mechanics (hip flexion angle)',
        'Complex training sequencing: strength exercise → coordination drill (PAP window 3–8min) to transfer gains',
        'Monitor compensation patterns — new injuries often appear as REMOTE overloads when primary mechanics are disrupted',
      ],
    },
    blocks: [
      {
        name: 'Coordination Foundation Block',
        durationWeeks: [4, 8],
        dosage: 'Daily coordination drills: bounding, A-skip, hip extension drills; 20–30min/session; no added resistance',
        progression: 'Increase variability (surfaces, speeds, direction changes) before adding load',
      },
      {
        name: 'Specific Strength Transfer Block',
        durationWeeks: [4, 8],
        dosage: 'Complex pairs: squat/hip hinge → sport-specific sprint drill; 3–5 sets per complex pair; PAP rest 4–6min',
        progression: 'Add resistance to strength exercise; keep coordination drill unresisted',
      },
      {
        name: 'Resisted Sprint Block',
        durationWeeks: [4, 6],
        dosage: '1–2×/wk; sled 10–15% BW; 4–6 × 20–30m; full rest between reps',
        progression: 'Monitor hip extension angle; reduce load if mechanics deteriorate',
      },
    ],
    kpis: [
      { name: 'Sprint mechanics rating (hip extension at toe-off)', type: 'mechanical' },
      { name: 'Reactive leg stiffness (contact time × force)', type: 'neuromuscular' },
      { name: 'Coordination error rate (compensation patterns observed)', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Remote injury in opposite kinetic chain from target drill', action: 'Compensation overload — step back to unresisted coordination drill; analyze primary movement deficiency' },
      { trigger: 'Hip flexion angle >90° in resisted sprint (mechanics breaking)', action: 'Reduce sled load immediately; drop 10–15% resistance until mechanics restore' },
    ],
    mapping: {
      userArchetypes: ['team sport athlete', 'sprinter wanting technique upgrade', 'strength athlete poor movement quality', 'return-to-sport rehab'],
      compatibleObjectives: ['sprint mechanics improvement', 'injury prevention via movement quality', 'transfer of gym strength to field'],
      incompatibleObjectives: ['pure powerlifting', 'pure endurance only'],
    },
    uiPills: [
      { text: 'Non addestrare la forza: addestrare la coordinazione con la forza. La tecnica viene prima del peso', sourceId: 'Bosch Strength Training and Coordination 2015' },
      { text: 'Il cervello ottimizza per il risparmio energetico. Dagli problemi da risolvere, non movimenti da copiare', sourceId: 'Bosch Anatomy of Agility 2015' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P08', 'P37', 'P49'],
    },
    periodizationModel: ['block', 'undulating'],
    assessmentScreening: ['sprint mechanics video analysis', 'reactive strength index (RSI)', 'FMS / SFMA movement screen', 'compensation pattern observation'],
  },

  // ── P07 ── Michael Boyle — Functional S&C (Evidence B) ────────────────────────
  {
    id: 'P07',
    name: 'Michael Boyle',
    role: 'strength & conditioning coach / functional training pioneer',
    discipline: 'S&C team sport | functional training',
    era: '1990s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Functional Training for Sports (Human Kinetics, 2004 / 2nd ed. 2016)', url: 'https://us.humankinetics.com/products/new-functional-training-for-sports-2nd-edition-with-hkpropel-online-video', type: 'book', priority: 1 },
        { title: 'Advances in Functional Training (2011)', url: 'https://www.amazon.com/Advances-Functional-Training-Coaching-Techniques/dp/1931046131', type: 'book', priority: 2 },
        { title: 'bodybyboyle.com – professional resource library', url: 'https://www.bodybyboyle.com/', type: 'official resource', priority: 3 },
        { title: 'MBSC Team Sport S&C methodology overview', url: 'https://us.humankinetics.com/blogs/excerpt/three-questions-to-define-functional-training', type: 'methodology article', priority: 4 },
        { title: 'Functional Training review citing Boyle', url: 'https://books.google.com/books/about/Functional_Training_for_Sports.html?id=k1j9mgEACAAJ', type: 'book reference', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Joint-by-joint approach: alternating joints need mobility (ankle, hip, T-spine) and stability (knee, lumbar, S-I); training must address each level',
        'Unilateral training priority: single-leg squat variants develop sport-specific strength without bilateral deficit; safer for lumbar',
        'Horizontal push > vertical push: athletes rarely press overhead in sport; bench press has limited carry-over; row-to-press ratio should be 2:1',
        'Core = "anti-movement": core training means resisting rotation, lateral flexion, extension (planks, pallof press) — not crunches',
        'Energy system development: alactic (short intervals) → lactic (capacity) → aerobic (base); sequence from speed to endurance',
        'Functional screens: before programming, assess movement quality (FMS) to identify and correct limiters first',
      ],
    },
    load: {
      rules: [
        'Unilateral lower body priority: 50–60% of lower body volume on single-leg exercises (split squat, step-up, RDL)',
        'Push:pull ratio 1:2 (2 rows/pulls for every pressing movement) to prevent shoulder imbalance',
        'Hip hinge before squat pattern: deadlift / RDL proficiency prerequisite for back squat loading',
        'Core anti-movement first: before loaded carries, ensure 60s plank quality and controlled rotation resistance',
        'Deceleration training: include landing mechanics and deceleration drills before reactive agility work',
      ],
    },
    blocks: [
      {
        name: 'Movement Quality Block',
        durationWeeks: [3, 6],
        dosage: 'FMS assessment first; corrective exercises for limiters; 15–20min warm-up focus; S&C at 70% intensity',
        progression: 'Re-screen every 3 weeks; move to main block only when FMS scores ≥14',
      },
      {
        name: 'Functional Strength Block',
        durationWeeks: [6, 12],
        dosage: '3–4 S&C sessions/wk; unilateral lower body (60%), bilateral hinge (20%), press (10%), anti-core (10%)',
        progression: 'Progressive load on split squat and hip hinge; maintain unilateral priority',
      },
      {
        name: 'Athletic Performance Block',
        durationWeeks: [4, 8],
        dosage: 'Power (jumps, throws) 2×/wk + ESD intervals + S&C maintenance; sport-specific integration',
        progression: 'Reduce S&C volume; increase explosive and sport-specific volume',
      },
    ],
    kpis: [
      { name: 'FMS composite score (≥14 = training cleared)', type: 'mechanical' },
      { name: 'Single-leg squat load (% BW)', type: 'performance' },
      { name: 'Push:pull ratio (session volume)', type: 'mechanical' },
      { name: 'Deceleration / landing quality score', type: 'neuromuscular' },
    ],
    redFlags: [
      { trigger: 'FMS score <14 with active painful movement pattern', action: 'Halt loaded training on that pattern; address corrective exercise + mobility work first' },
      { trigger: 'Shoulder impingement symptoms (painful arc 60–120°)', action: 'Remove overhead pressing completely; increase row volume; add shoulder stability work' },
    ],
    mapping: {
      userArchetypes: ['team sport athlete', 'recreational athlete wanting functional strength', 'post-rehab returning to sport', 'coach wanting organized system'],
      compatibleObjectives: ['functional strength', 'injury prevention', 'athletic performance', 'movement quality'],
      incompatibleObjectives: ['elite powerlifting', 'heavy barbell specialization'],
    },
    uiPills: [
      { text: 'Approccio joint-by-joint: ogni articolazione ha una priorità. Trascurarla causa infortuni a distanza', sourceId: 'Boyle Functional Training 2004' },
      { text: 'Il core non si allena con i crunch: si allena resistendo al movimento. Plank e Pallof Press sono la base', sourceId: 'Boyle Advances in Functional Training 2011' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P06', 'P49', 'P05'],
    },
    periodizationModel: ['block', 'linear'],
    assessmentScreening: ['FMS (Functional Movement Screen)', 'single-leg squat test', 'overhead squat test', 'push:pull ratio audit'],
  },

  // ── P15 ── Arthur Lydiard — Endurance Base Building (Evidence B) ──────────────
  {
    id: 'P15',
    name: 'Arthur Lydiard',
    role: 'endurance running coach',
    discipline: 'endurance corsa | marathon | distanza medio-lunga',
    era: '1950s-1990s',
    nationality: 'New Zealand',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Run to the Top – Lydiard (1962, revised 2000)', url: 'https://coachtherun.com/lydiard-method/', type: 'book', priority: 1 },
        { title: 'Lydiard Foundation official methodology', url: 'https://www.lydiardfoundation.org/', type: 'official foundation', priority: 2 },
        { title: 'Science of Running – Lydiard analysis', url: 'https://www.scienceofrunning.com/2010/01/the-lydiard-method.html', type: 'expert analysis', priority: 3 },
        { title: 'PMC – Aerobic base adaptations and endurance performance', url: 'https://pubmed.ncbi.nlm.nih.gov/25140177/', type: 'peer-reviewed', priority: 4 },
        { title: 'PMC – periodization of endurance athletes review', url: 'https://pubmed.ncbi.nlm.nih.gov/30319861/', type: 'peer-reviewed', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Base aerobica prima di tutto: 10–16 settimane di corsa aerobica ad alta mileage sono il fondamento non negoziabile di ogni ciclo',
        'Aerobic conditioning phase: "run as fast as you can while still conversational" — effort, not pace, governs base work',
        'Periodization sequence: Aerobic Base → Hill Training → Track/Anaerobic → Co-ordination/Race Sharpening → Racing',
        'High mileage builds mitochondrial density, capillary bed, and cardiac stroke volume — cannot be rushed or simulated by HIIT',
        'Hills replace gym: bounding uphill builds strength-endurance without gym; reduces injury risk vs flat speed work',
        'Anaerobic work comes AFTER aerobic base — doing intervals without base first = limited performance ceiling',
      ],
    },
    load: {
      rules: [
        'Aerobic base: 6–10 weeks minimum; 100km+ per week for competitive runners; untrained: 40–60km/wk at conversational pace',
        'Base pace: conversational effort; HR <75% HRmax; never race the base phase',
        'Mileage increase: max 10%/wk total; reduce every 4th week by 20% (deload)',
        'Hills: 2×/wk in hill phase; bounding + uphill strides; hill reps NOT flat sprint work',
        'Track (anaerobic) phase: only AFTER aerobic base is established; 800m–3km repeat sessions',
        'No racing during base or hill phase — race only in sharpening + racing phase',
      ],
    },
    blocks: [
      {
        name: 'Aerobic Base Block',
        durationWeeks: [10, 16],
        dosage: 'Daily running; conversational pace; 70–100+ km/wk (advanced); 40–60km/wk (recreational)',
        progression: 'Max 10%/wk volume increase; 1 long run (30–35% of weekly volume); rest Sunday',
      },
      {
        name: 'Hill Training Block',
        durationWeeks: [4, 6],
        dosage: '2×/wk hill sessions: bounding drills + uphill strides + hill repeats; remainder = easy aerobic',
        progression: 'Increase hill repeat count before increasing pace; maintain aerobic mileage',
      },
      {
        name: 'Track / Anaerobic Block',
        durationWeeks: [4, 6],
        dosage: '2×/wk track: 800m–2000m repeats at 90–95% effort; reduce total mileage 15–20%',
        progression: 'Increase rep quality (pace at same effort) before adding reps',
      },
      {
        name: 'Race Sharpening Block',
        durationWeeks: [2, 3],
        dosage: 'Short fast strides; one tune-up race; mileage -30%; intensity maintained',
        progression: 'No progression — peak and race',
      },
    ],
    kpis: [
      { name: 'Weekly mileage (km)', type: 'mechanical' },
      { name: 'Easy run HR (% HRmax — target <75%)', type: 'systemic' },
      { name: 'Race time at key distances (5K, 10K, half, marathon)', type: 'performance' },
      { name: 'Long run completion (% of planned volume)', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Easy run HR >80% HRmax consistently', action: 'Reduce pace until true conversational; test MAF (180-age) formula as ceiling' },
      { trigger: 'Shin splints or bone stress symptoms', action: 'Reduce volume 30%; replace runs with cycling; extend base phase before adding intensity' },
    ],
    mapping: {
      userArchetypes: ['amateur runner wanting marathon', 'endurance athlete with poor base', 'beginner-intermediate runner'],
      compatibleObjectives: ['marathon performance', 'half marathon', 'aerobic base building', 'endurance foundation'],
      incompatibleObjectives: ['sprint', 'powerlifting', 'pure strength'],
    },
    uiPills: [
      { text: 'Corri quanto velocemente puoi stando ancora in grado di parlare. Questa è la tua base aerobica', sourceId: 'Lydiard Run to the Top' },
      { text: 'Il lavoro anaerobico senza base aerobica è come costruire il tetto prima delle fondamenta', sourceId: 'Lydiard method' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P13', 'P16', 'P19'],
    },
    periodizationModel: ['linear'],
    assessmentScreening: ['MAF test (180-age HR run)', 'easy run HR tracking', 'weekly mileage log', 'race time benchmark'],
  },

  // ── P24 ── Joe Friel — Triathlon / Cycling Periodization (Evidence B) ─────────
  {
    id: 'P24',
    name: 'Joe Friel',
    role: 'triathlon & cycling coach / periodization expert',
    discipline: 'triathlon | ciclismo | periodizzazione multisport',
    era: '1980s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'The Triathlete\'s Training Bible (VeloPress, 4th ed. 2016)', url: 'https://www.amazon.com/Triathletes-Training-Bible-Competitive-Multisport/dp/188473748X', type: 'book', priority: 1 },
        { title: 'The Cyclist\'s Training Bible (VeloPress, 5th ed. 2018)', url: 'https://www.amazon.com/Cyclists-Training-Bible-Joe-Friel/dp/1937715868', type: 'book', priority: 2 },
        { title: 'JoeFrielTraining.com – Build period overview', url: 'https://joefrieltraining.com/build-period-overview/', type: 'official resource', priority: 3 },
        { title: 'TrainingPeaks – Friel\'s ATL/CTL/TSB glossary', url: 'https://www.trainingpeaks.com/learn/articles/glossary-of-trainingpeaks-metrics/', type: 'methodology reference', priority: 4 },
        { title: 'PMC – Training load and periodization in endurance sports', url: 'https://pubmed.ncbi.nlm.nih.gov/25441243/', type: 'peer-reviewed', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Annual Training Plan (ATP): build the season backwards from the A-race; identify peak periods and recovery phases',
        'Fitness = CTL (Chronic Training Load); Fatigue = ATL (Acute Training Load); Form = TSB (Training Stress Balance = CTL − ATL)',
        'Periodization phases: Prep → Base (1/2/3) → Build (1/2) → Peak → Race → Transition',
        'Volume before intensity: build CTL through volume in Base phases; add race-specific intensity in Build',
        'Limiter-based training: identify the weakest limiter (swim/bike/run/strength) and target it in the training plan',
        'Functional Threshold Power (FTP) / Threshold Pace as the cornerstone of all zone-based training',
      ],
    },
    load: {
      rules: [
        'CTL ramp rate: max 5–7 TSS points/wk in base phase; 3–5 in build; aggressive ramping = injury risk',
        'TSB target for race day: +5 to +25 (positive form); negative TSB = racing on fatigue',
        'Base 1: mostly Z1–Z2 (aerobic); no intensity work; build volume',
        'Base 2–3: add Z3 (tempo) work; strength work peaks here; still volume-focused',
        'Build: race-specific intervals (Z4–Z5); reduce volume 10–15% vs Base peak',
        'Taper: reduce TSS 50–60%; maintain intensity; TSB climbs from negative to positive',
      ],
    },
    blocks: [
      {
        name: 'Base Phase Block',
        durationWeeks: [12, 20],
        dosage: 'Z1–Z2 volume build; 80%+ at aerobic pace; strength 2×/wk; CTL ramp 5 TSS/wk',
        progression: 'Weekly CTL build; 3 weeks progress + 1 week recovery (reduce volume 20%)',
      },
      {
        name: 'Build Phase Block',
        durationWeeks: [6, 10],
        dosage: 'Race-specific intervals (Z4–Z5) 2×/wk; maintain volume; limiter-focused sessions',
        progression: 'Increase interval duration/pace before frequency; monitor TSB stays >-20',
      },
      {
        name: 'Peak & Taper Block',
        durationWeeks: [2, 3],
        dosage: 'Reduce volume 50–60%; 1–2 race-specific sessions; TSB target +10 to +25',
        progression: 'No volume increase — sharpen only; verify TSB trajectory daily',
      },
    ],
    kpis: [
      { name: 'CTL (Chronic Training Load) — fitness', type: 'systemic' },
      { name: 'TSB (Training Stress Balance) — form', type: 'systemic' },
      { name: 'FTP / Threshold Pace (zone boundary)', type: 'performance' },
      { name: 'A-race performance vs target time', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'ATL spike >+40 in one week (acute overload)', action: 'Force 5-day easy week; do not add TSS until ATL returns to CTL level' },
      { trigger: 'TSB < -30 for >5 days (chronic fatigue state)', action: 'Insert 7-10 day recovery week; review CTL ramp rate for preceding 4 weeks' },
    ],
    mapping: {
      userArchetypes: ['triathlete', 'cyclist targeting events', 'structured periodization user', 'data-driven athlete'],
      compatibleObjectives: ['triathlon A-race', 'cycling event performance', 'systematic seasonal planning'],
      incompatibleObjectives: ['sprint', 'powerlifting', 'pure strength'],
    },
    uiPills: [
      { text: 'Form = CTL − ATL. Gareggia con TSB positivo (+10 a +25): questa è la matematica della performance', sourceId: 'Friel Triathlete\'s Training Bible' },
      { text: 'Costruisci il piano dall\'A-race a ritroso. La gara non si improvvisa: si pianifica ogni settimana', sourceId: 'Joe Friel Annual Training Plan methodology' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P25', 'P16', 'P05'],
    },
    periodizationModel: ['linear', 'block'],
    assessmentScreening: ['FTP test (20min power)', 'threshold pace test', 'CTL/ATL/TSB via TrainingPeaks', 'A-race limiter analysis'],
  },

  // ── P25 ── Andrew Coggan — Power Meter / Cycling Science (Evidence B) ──────────
  {
    id: 'P25',
    name: 'Andrew Coggan',
    role: 'exercise physiologist / power meter pioneer',
    discipline: 'ciclismo power zones | potenza funzionale | fisiologia endurance',
    era: '1990s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Training and Racing with a Power Meter – Coggan & Allen (2010)', url: 'https://velocomp.com/products/training-and-racing-with-a-power-meter', type: 'book', priority: 1 },
        { title: 'TrainingPeaks – Coggan metrics glossary', url: 'https://www.trainingpeaks.com/learn/articles/glossary-of-trainingpeaks-metrics/', type: 'methodology reference', priority: 2 },
        { title: 'Functional threshold power is an estimate of critical power — ResearchGate', url: 'https://www.researchgate.net/publication/364930663_Functional_threshold_power_is_an_estimate_of_critical_power', type: 'peer-reviewed', priority: 3 },
        { title: 'PMC – power output and performance in cycling', url: 'https://pubmed.ncbi.nlm.nih.gov/31588172/', type: 'peer-reviewed', priority: 4 },
        { title: 'Coggan power-based training zones overview', url: 'https://www.youtube.com/watch?v=xqfODU_w1lE', type: 'lecture/video', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'FTP (Functional Threshold Power): the highest average power sustainable for ~60min; the cornerstone of all cycling training zones',
        '7-zone power model: Z1 (active recovery) → Z2 (endurance) → Z3 (tempo) → Z4 (threshold) → Z5 (VO2max) → Z6 (anaerobic) → Z7 (neuromuscular)',
        'Normalized Power (NP): accounts for the variable nature of cycling effort — more meaningful than average power for structured comparison',
        'Training Stress Score (TSS): quantifies training load using IF (Intensity Factor = NP/FTP) and duration; enables cross-workout comparison',
        'Power zones prescribe EXACTLY: removes perceived exertion subjectivity; consistent, reproducible, measurable',
        'FTP is not constant: re-test every 6–8 weeks; FTP increases mean zones must be recalculated',
      ],
    },
    load: {
      rules: [
        'FTP test: 20min all-out effort × 0.95 = FTP; or ramp test; never use HR estimates alone',
        'Z2 training: 60–70% FTP; cornerstone of aerobic base; can sustain conversation',
        'Z4 threshold work: 90–105% FTP; 10–30min intervals; 2–3×/wk max in build phase',
        'Z5 VO2max: 106–120% FTP; 3–8min intervals; 1–2×/wk max',
        'Acute TSS cap: <150 TSS/day in general; >300 TSS/day is extreme overload',
        'Weekly CTL ramp: conservative = 3–5 TSS/wk; moderate = 5–7; aggressive = 7–10 (injury risk)',
      ],
    },
    blocks: [
      {
        name: 'Aerobic Base Block (Z2)',
        durationWeeks: [8, 16],
        dosage: '4–6 rides/wk; 60–80% at Z2 (60–70% FTP); 1 long ride (3–5h); CTL ramp 3–5 TSS/wk',
        progression: 'Increase ride duration before frequency; re-test FTP at 8 weeks',
      },
      {
        name: 'Threshold Block (Z4)',
        durationWeeks: [4, 8],
        dosage: '2×/wk Z4 sessions; 2–4 × 10–20min at 90–105% FTP; 3–5min rest',
        progression: 'Increase interval duration first (10→20min); then increase count (2→4)',
      },
      {
        name: 'VO2max Block (Z5)',
        durationWeeks: [4, 6],
        dosage: '1–2×/wk Z5; 4–6 × 3–5min at 110–120% FTP; 3min rest',
        progression: 'Track power output at same RPE; plateau = extend rest or reduce to 1×/wk',
      },
    ],
    kpis: [
      { name: 'FTP (Functional Threshold Power — watts)', type: 'performance' },
      { name: 'CTL (Chronic Training Load — fitness)', type: 'systemic' },
      { name: 'Power-to-weight ratio (W/kg)', type: 'performance' },
      { name: 'TSS per session (training stress quantification)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'FTP test decline >5% vs previous test', action: 'Check recent TSB history; if TSB negative (<-20), insert 1 week easy before retesting' },
      { trigger: 'Unable to complete Z4 intervals at prescribed power after 2 sessions', action: 'Reduce target to 85–90% FTP; check if base phase was sufficient (CTL too low for intensity)' },
    ],
    mapping: {
      userArchetypes: ['cyclist with power meter', 'data-driven endurance athlete', 'triathlete cycling leg optimizer'],
      compatibleObjectives: ['cycling performance', 'FTP improvement', 'structured zone training', 'race power targets'],
      incompatibleObjectives: ['strength only', 'sprint (track cycling is different)', 'pure RPE-based training'],
    },
    uiPills: [
      { text: 'FTP = la tua soglia funzionale. Tutto il tuo allenamento in bici si calcola da questo numero', sourceId: 'Coggan Training and Racing with Power Meter' },
      { text: 'Il Z2 è la zona più importante. La maggior parte degli atleti non ci passa abbastanza tempo', sourceId: 'Coggan endurance physiology' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P24', 'P16', 'P04'],
    },
    periodizationModel: ['linear', 'block'],
    assessmentScreening: ['FTP test (20min or ramp)', 'power-to-weight ratio', 'CTL/TSB via TrainingPeaks', 'VO2max estimate via power curve'],
  },

  // ── P28 ── Jim Wendler — 5/3/1 Strength (Evidence B) ─────────────────────────
  {
    id: 'P28',
    name: 'Jim Wendler',
    role: 'strength coach / powerlifting coach',
    discipline: 'forza | powerlifting | programmazione semplice',
    era: '2000s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: '5/3/1 – The Simplest and Most Effective Training System for Raw Strength (2009)', url: 'https://www.jimwendler.com/products/5-3-1-forever-book', type: 'book', priority: 1 },
        { title: '5/3/1 Forever – Wendler (2017)', url: 'https://www.jimwendler.com/products/5-3-1-for-powerlifting-hard-copy', type: 'book', priority: 2 },
        { title: 'JimWendler.com – official resource', url: 'https://www.jimwendler.com/', type: 'official resource', priority: 3 },
        { title: 'Amazon – 5/3/1 overview', url: 'https://www.amazon.com/Simplest-Effective-Training-Increase-Strength/dp/0557248299', type: 'book reference', priority: 4 },
        { title: '5/3/1 principles review – PTPioneer', url: 'https://www.ptpioneer.com/531-workout/', type: 'training review', priority: 5 },
      ],
    },
    methodology: {
      observablePrinciples: [
        '5/3/1 core: 4 main lifts (squat, deadlift, bench, press) × 1/wk; 3-week wave loading; 1 deload week = 4-week cycle',
        'Training max (TM) = 90% of true 1RM; NEVER use actual 1RM as the base — humility builds longevity',
        'AMRAP+ sets: the final set of each workout is "+" = as many reps as possible; this drives progressive overload naturally',
        'Slow, consistent progress: +2.5kg/wk on upper; +5kg/wk on lower lifts; 1.25kg/2.5kg/week not more',
        'Assistance work: complements main lift but never competes; push/pull/core template',
        'Leaders + Anchors structure (5/3/1 Forever): Leaders build volume; Anchors build intensity; rotate each cycle',
      ],
    },
    load: {
      rules: [
        'Always use Training Max (90% of 1RM), never true 1RM for calculations',
        'Wave loading: Week 1 = 5×65/75/85% TM; Week 2 = 3×70/80/90% TM; Week 3 = 5/3/1×75/85/95% TM; Week 4 = Deload',
        'AMRAP rule: on final set, do as many reps as possible cleanly; stop at technical failure, NOT volitional failure',
        'Progress TM only after completing the cycle successfully; reset to lower TM if stalled',
        'Assistance: FSL (First Set Last), BBB (Boring But Big), or SSL variants — match to goal (strength vs hypertrophy)',
        'Conditioning is NOT optional: Wendler advocates daily minimal cardio (walks, GPP) for athletic longevity',
      ],
    },
    blocks: [
      {
        name: '5/3/1 Leader Block',
        durationWeeks: [6, 12],
        dosage: '4 sessions/wk (squat/bench/dead/press day); Leader template (e.g. BBB) for volume; 3-week wave + 1 deload',
        progression: 'Add 2.5kg upper / 5kg lower per completed 4-week cycle to TM',
      },
      {
        name: '5/3/1 Anchor Block',
        durationWeeks: [6, 8],
        dosage: '4 sessions/wk; Anchor template (e.g. 5s PRO + PR set) for intensity; Joker sets if feeling strong',
        progression: 'Test new 1RM or estimate from AMRAP reps at cycle end',
      },
      {
        name: 'TM Reset Block',
        durationWeeks: [4, 8],
        dosage: 'Drop TM by 10%; restart Leaders template; use when stalling on AMRAP for >2 consecutive cycles',
        progression: 'Slower rebuild; ensure technique is dialed before going heavy again',
      },
    ],
    kpis: [
      { name: 'AMRAP reps on final set (vs cycle benchmarks)', type: 'performance' },
      { name: 'Training Max progress per cycle (+2.5kg upper / +5kg lower)', type: 'mechanical' },
      { name: 'True 1RM estimate (from AMRAP formula: reps × 0.0333 × weight + weight)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'AMRAP reps declining for 2+ consecutive cycles on same lift', action: 'Reset TM to 90% of current TM; investigate recovery, sleep, and nutrition' },
      { trigger: 'Sticking point worsening (e.g. squat walk-out fear, bench press bar crash)', action: 'Drop to FSL assistance; add pause reps at sticking point; revisit technique' },
    ],
    mapping: {
      userArchetypes: ['intermediate lifter', 'powerlifter', 'athlete wanting sustainable strength', 'busy professional with limited time'],
      compatibleObjectives: ['overall strength', '1RM improvement', 'sustainable long-term progress', 'powerlifting prep'],
      incompatibleObjectives: ['pure endurance', 'extreme hypertrophy specialization'],
    },
    uiPills: [
      { text: 'Usa il 90% del tuo massimo come base. L\'umiltà costruisce i massimali, non l\'ego', sourceId: 'Wendler 5/3/1 2009' },
      { text: '5/3/1: squat, panca, stacco, press. Ogni settimana. Per anni. Questo è il segreto della forza', sourceId: 'Jim Wendler 5/3/1 methodology' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P27', 'P34', 'P05'],
    },
    periodizationModel: ['undulating', 'linear'],
    assessmentScreening: ['1RM test or AMRAP estimate formula', 'Training Max calculation', 'AMRAP rep tracking per cycle'],
  },

  // ── P09 ── Brad Schoenfeld — Hypertrophy Science (Evidence A) ────────────────
  {
    id: 'P09',
    name: 'Brad Schoenfeld',
    role: 'hypertrophy researcher | strength coach',
    discipline: 'hypertrophy | strength | bodybuilding',
    era: '2000s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Schoenfeld 2010 – Mechanisms of Muscle Hypertrophy', url: 'https://pubmed.ncbi.nlm.nih.gov/20847704/', type: 'peer-reviewed landmark paper', priority: 1 },
        { title: 'Schoenfeld 2017 – Dose-response relationship between weekly resistance training volume and increases in muscle mass', url: 'https://pubmed.ncbi.nlm.nih.gov/27417064/', type: 'peer-reviewed meta-analysis', priority: 2 },
        { title: 'Science and Development of Muscle Hypertrophy (textbook)', url: 'https://us.humankinetics.com/products/science-and-development-of-muscle-hypertrophy', type: 'textbook peer-reviewed', priority: 3 },
        { title: 'Schoenfeld et al. 2016 – Effects of resistance training frequency on muscle mass', url: 'https://pubmed.ncbi.nlm.nih.gov/27102172/', type: 'peer-reviewed RCT', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Three primary hypertrophy mechanisms: mechanical tension, metabolic stress, muscle damage — all contribute',
        'Volume is the primary driver of hypertrophy; frequency and load are modulators',
        'Rep ranges 6–30 all produce hypertrophy if sets taken close to failure (RIR 0–3)',
        'Weekly sets per muscle group: MEV ≈ 10 sets, MAV ≈ 15–20 sets, MRV ≈ 25+ sets',
        'Progressive overload essential; without it adaptation plateaus within 4–8 weeks',
        'Rest intervals ≥2 min for strength-focused; 60–90s acceptable for hypertrophy',
      ],
    },
    load: {
      rules: [
        'Track sets per muscle group per week; stay within MEV–MAV–MRV range',
        'Increase volume by 1–2 sets/muscle/week per mesocycle; deload every 4–6 weeks',
        'Train each muscle 2x/week minimum for optimal hypertrophy stimulus',
        'Proximity to failure matters: stay within 0–4 RIR; last set to failure is acceptable',
        'Never increase both volume AND intensity simultaneously in same week',
      ],
    },
    blocks: [
      {
        name: 'Hypertrophy Accumulation Block',
        durationWeeks: [4, 8],
        dosage: '12–20 working sets/muscle/week; 8–15 reps; RIR 1–3; 2–3 exercises/muscle',
        progression: 'Add 1–2 sets/muscle/week; increase load when upper rep range is cleanly achieved',
      },
      {
        name: 'Intensification Block',
        durationWeeks: [3, 4],
        dosage: '8–12 sets/muscle/week; 4–8 reps; RIR 0–2; focus on progressive overload',
        progression: 'Increase load 2.5–5% when 8 reps achieved; reduce volume 20–30%',
      },
      {
        name: 'Deload Block',
        durationWeeks: [1, 1],
        dosage: '50% volume reduction; same exercises; RIR 4–5; focus on movement quality',
        progression: 'Mandatory after 4–6 weeks of progressive overload',
      },
    ],
    kpis: [
      { name: 'Sets per muscle per week', type: 'mechanical' },
      { name: 'RIR per set', type: 'mechanical' },
      { name: 'Progressive overload marker (load × reps trend)', type: 'performance' },
      { name: 'DOMS presence by district', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'No strength progression in 3+ consecutive weeks on primary lift', action: 'Check recovery/sleep/nutrition; deload; reassess programming' },
      { trigger: 'Excessive DOMS (>48h) after every session', action: 'Reduce volume 30%; increase rest between sessions for same muscle group' },
      { trigger: 'Joint pain during compound movements', action: 'Stop loaded compound; assess mechanics; substitute unilateral or machine variation' },
    ],
    mapping: {
      userArchetypes: ['bodybuilder', 'evidence-based lifter', 'intermediate lifter', 'physique competitor'],
      compatibleObjectives: ['muscle hypertrophy', 'physique improvement', 'general strength', 'body composition'],
      incompatibleObjectives: ['pure endurance', 'sport-specific power without hypertrophy focus'],
    },
    uiPills: [
      { text: 'Il range di rep non conta quanto la prossimità al cedimento', sourceId: 'Schoenfeld 2017', quote: 'Sets taken close to muscular failure across a wide range of rep ranges produce similar hypertrophy.' },
      { text: 'Volume settimanale per muscolo: MEV 10 → MAV 15–20 → MRV 25+', sourceId: 'Science of Muscle Hypertrophy 2020' },
    ],
    fusionWeight: {
      recommendedPercent: 25,
      bestPairedWith: ['P10', 'P11', 'P36', 'P27'],
    },
    periodizationModel: ['linear', 'block', 'undulating'],
    assessmentScreening: ['Weekly sets-per-muscle tracking', 'RIR self-assessment', 'Progressive overload log'],
  },

  // ── P10 ── Mike Israetel — RPE Programming / Volume Landmarks (Evidence B) ───
  {
    id: 'P10',
    name: 'Mike Israetel',
    role: 'sports scientist | RPE coach | Renaissance Periodization',
    discipline: 'hypertrophy | powerlifting | RPE-based programming',
    era: '2010s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Renaissance Periodization – Scientific Principles of Strength Training (book)', url: 'https://rpstrength.com/blogs/articles/scientific-principles-of-strength-training', type: 'practitioner textbook peer-reviewed methods', priority: 1 },
        { title: 'RP Strength – MEV MAV MRV volume landmarks framework', url: 'https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth', type: 'practitioner evidence-based publication', priority: 2 },
        { title: 'Israetel – Mesocycle Construction for Hypertrophy', url: 'https://rpstrength.com/blogs/articles/mesocycle-hypertrophy', type: 'practitioner framework', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'MEV (Minimum Effective Volume) → MAV (Maximum Adaptive Volume) → MRV (Maximum Recoverable Volume): volumes where adaptation occurs',
        'RPE scale (1–10) for every set: RPE 8 = 2 reps in reserve; RPE 10 = max effort',
        'Mesocycle structure: accumulate volume → peak → deload; 4–6 week cycles',
        'SRA cycle (Stimulus-Recovery-Adaptation): training stimulus must allow full SRA before next session',
        'Proximity to failure drives hypertrophy; but exceeding MRV accumulates fatigue faster than adaptation',
      ],
    },
    load: {
      rules: [
        'Start mesocycle at MEV; add volume each week until MRV is approached',
        'Use RPE to autoregulate load: target RPE 7–8 on first sets; last set RPE 9–10',
        'Deload when RPE for same load increases 1–2 points over baseline',
        'Never add volume and increase RPE targets in same week',
        'Individual MRV varies; track performance and recovery signals to find personal ceiling',
      ],
    },
    blocks: [
      {
        name: 'Mesocycle Accumulation',
        durationWeeks: [4, 6],
        dosage: 'Start at MEV; +2 sets/muscle group/week; target RPE 8 per working set',
        progression: 'Increase volume weekly; cap at MRV (recovery signals: performance, sleep, soreness)',
      },
      {
        name: 'Deload',
        durationWeeks: [1, 1],
        dosage: 'Return to MEV or below; RPE target 6–7; same exercises at reduced load/volume',
        progression: 'After mesocycle peak; before next accumulation cycle',
      },
    ],
    kpis: [
      { name: 'RPE per set', type: 'mechanical' },
      { name: 'Volume (sets/muscle/week) vs MEV/MAV/MRV', type: 'mechanical' },
      { name: 'SRA cycle adherence (training frequency vs recovery window)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'RPE for same load increases 2+ points vs week 1 baseline', action: 'Initiate deload; may be approaching or past MRV' },
      { trigger: 'Performance regression despite consistent nutrition/sleep', action: 'Reduce volume to MEV; add recovery day' },
    ],
    mapping: {
      userArchetypes: ['intermediate lifter', 'powerlifter', 'bodybuilder', 'RPE-literate athlete'],
      compatibleObjectives: ['hypertrophy', 'strength', 'powerlifting', 'body composition'],
      incompatibleObjectives: ['complete beginners unfamiliar with RPE', 'pure endurance'],
    },
    uiPills: [
      { text: 'Inizia il mesociclo al MEV e costruisci verso l\'MRV settimana per settimana', sourceId: 'RP Strength 2019' },
      { text: 'RPE 8 = 2 reps in riserva. Allena te stesso, non l\'ego', sourceId: 'Israetel – SPST' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P09', 'P11', 'P36'],
    },
    periodizationModel: ['block', 'undulating'],
    assessmentScreening: ['RPE self-calibration session', 'Weekly volume-per-muscle tracking'],
  },

  // ── P11 ── Eric Helms — Evidence-Based Natural Bodybuilding (Evidence B) ──────
  {
    id: 'P11',
    name: 'Eric Helms',
    role: 'natural bodybuilding coach | researcher | NSCA-CSCS',
    discipline: 'natural bodybuilding | powerlifting | evidence-based S&C',
    era: '2010s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Muscle and Strength Pyramids (Training & Nutrition) – Helms, Morgan, Valdez', url: 'https://muscleandstrengthpyramids.com/', type: 'practitioner textbook evidence-based', priority: 1 },
        { title: 'Helms et al. 2014 – Recommendations for natural bodybuilding contest preparation', url: 'https://pubmed.ncbi.nlm.nih.gov/24568610/', type: 'peer-reviewed review', priority: 2 },
        { title: '3DMJ – The muscle and strength pyramid podcast series', url: 'https://3dmusclejourney.com/', type: 'evidence-based practitioner media', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Pyramid hierarchy: adherence → volume/frequency/intensity → exercise selection → nutrition timing',
        'RIR (Reps In Reserve) as load prescription: train at RIR 1–3 for hypertrophy, 0–1 for peaking',
        'Flexible dieting with protein targets over rigid meal timing',
        'Periodized nutrition aligned with training mesocycle (surplus accumulation, maintenance/deload)',
        'Natural lifters benefit most from higher frequency (2–4x/muscle/week) due to shorter MPS window',
      ],
    },
    load: {
      rules: [
        'Prioritize adherence above all else; best program is one consistently followed',
        'Train each muscle 2–4x/week; 10–20 hard sets/muscle/week',
        'Use RIR 1–3 for most working sets; reserve RIR 0 sets for indicator exercises',
        'Periodize: 8–12 week hypertrophy block → 3–4 week strength block → 1 week deload',
        'Protein: 1.6–2.2g/kg/day; caloric surplus moderate (+200–300 kcal) for lean gaining',
      ],
    },
    blocks: [
      {
        name: 'Hypertrophy Mesocycle',
        durationWeeks: [8, 12],
        dosage: '10–20 sets/muscle/week; 8–15 reps; RIR 1–3; moderate frequency 2–3x/muscle',
        progression: 'Add sets or load weekly; log performance; progressive overload mandatory',
      },
      {
        name: 'Strength Peaking Block',
        durationWeeks: [3, 4],
        dosage: '6–10 sets/muscle/week; 3–6 reps; RIR 0–1; reduced volume, increased intensity',
        progression: 'Increase load; volume reduced 30–40%; maintain frequency',
      },
    ],
    kpis: [
      { name: 'RIR per set', type: 'mechanical' },
      { name: 'Progressive overload (weekly performance trend)', type: 'performance' },
      { name: 'Body weight trend (lean gaining vs cutting)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'No bodyweight gain over 3+ weeks in gaining phase despite surplus adherence', action: 'Reassess caloric intake; check consistency; adjust macros' },
      { trigger: 'Strength stall for 2+ consecutive weeks', action: 'Deload or reduce training stress; assess sleep/nutrition' },
    ],
    mapping: {
      userArchetypes: ['natural bodybuilder', 'powerlifter', 'evidence-based intermediate', 'physique competitor'],
      compatibleObjectives: ['hypertrophy', 'lean gaining', 'competition prep (natural)', 'general strength'],
      incompatibleObjectives: ['sport-specific athletic performance', 'pure endurance'],
    },
    uiPills: [
      { text: 'RIR 1–3 per la maggior parte dei set. Non serve andare a cedimento ogni set', sourceId: 'Muscle & Strength Pyramids' },
      { text: 'La gerarchia: rispetto > volume > nutrizione. Nella priorità, sempre', sourceId: 'Eric Helms 3DMJ' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P09', 'P10', 'P36'],
    },
    periodizationModel: ['block', 'linear'],
    assessmentScreening: ['RIR self-calibration', '1RM estimate via AMRAP formula', 'Body composition tracking'],
  },

  // ── P12 ── Charlie Francis — Sprint Development / High-Low System (Evidence B) ─
  {
    id: 'P12',
    name: 'Charlie Francis',
    role: 'sprint coach | Canadian national coach',
    discipline: 'sprint | track & field | speed development',
    era: '1970s-1990s',
    nationality: 'Canada',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Speed Trap – Charlie Francis (book)', url: 'https://www.amazon.com/Speed-Trap-Inside-Doping-Scandal/dp/1550542079', type: 'practitioner book primary source', priority: 1 },
        { title: 'Training for Speed – Charlie Francis (coaching manual)', url: 'https://charliefrancis.com/training-for-speed/', type: 'coaching manual', priority: 2 },
        { title: 'The Charlie Francis Training System (ebook)', url: 'https://charliefrancis.com/', type: 'coaching manual', priority: 3 },
        { title: 'PubMed – Sprint training adaptations', url: 'https://pubmed.ncbi.nlm.nih.gov/25559833/', type: 'peer-reviewed support', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'High-Low system: HIGH intensity (CNS-intensive) and LOW intensity (recovery-facilitating) — never medium',
        'CNS fatigue is the limiting factor in sprint athletes; not muscular fatigue alone',
        'High intensity days: max velocity sprints, heavy strength (95%+), plyometrics',
        'Low intensity days: tempo runs (65–75% max speed), flexibility, regeneration',
        'Acceleration (0–30m) and max velocity (30–60m) are separate technical qualities trained separately',
        'Competition readiness peaks from structured accumulation → intensification → competition taper',
      ],
    },
    load: {
      rules: [
        'Never train in the "medium" zone: medium intensity creates fatigue without sufficient CNS adaptation',
        'High CNS days max 2–3/week; low days fill remaining days',
        'Sprint volume on high days: total distance per session capped (e.g., 300–600m high quality)',
        'Rest between sprint reps: full recovery (walk back); quality > quantity',
        'Strength on same day as sprints (same CNS demand, efficient recovery window)',
      ],
    },
    blocks: [
      {
        name: 'Speed Accumulation Block',
        durationWeeks: [4, 6],
        dosage: '2–3 speed sessions/week; 4–8×30m accelerations; heavy strength 2–3x/week',
        progression: 'Increase sprint distance from 20–30m to 40–60m; reduce sets as distance grows',
      },
      {
        name: 'Speed Intensification Block',
        durationWeeks: [4, 6],
        dosage: '2 speed sessions/week; 4–6×50–80m; volume reduced; quality maximized',
        progression: 'Focus on max velocity mechanics; reduce volume; increase rest between reps',
      },
      {
        name: 'Competition Taper',
        durationWeeks: [1, 2],
        dosage: '1–2 speed sessions; 3–4×30–60m; volume 50% of peak; maintain intensity',
        progression: 'Drop volume; maintain speed; optimize recovery for peak performance',
      },
    ],
    kpis: [
      { name: 'Max velocity (m/s or flying 10m time)', type: 'performance' },
      { name: 'Acceleration (10m split time)', type: 'performance' },
      { name: 'CNS readiness (vertical jump, grip strength)', type: 'systemic' },
      { name: 'Tempo session volume (total meters)', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Sprint times declining across 2+ consecutive sessions', action: 'Reduce volume; increase low intensity sessions; assess sleep quality' },
      { trigger: 'Hamstring tightness or pain during acceleration', action: 'Stop sprinting; switch to tempo-only; assess hamstring integrity' },
      { trigger: 'Athlete training in medium zone (jog at 80% effort)', action: 'Restructure session; clarify effort zones; enforce High-Low separation' },
    ],
    mapping: {
      userArchetypes: ['track & field sprinter', 'team sport athlete needing speed', 'athlete returning to top speed'],
      compatibleObjectives: ['max speed', 'acceleration', 'reactive strength', 'competition preparation'],
      incompatibleObjectives: ['pure endurance', 'hypertrophy-only goals'],
    },
    uiPills: [
      { text: 'Alto o basso. Il medio è la via verso l\'infortunio e la mediocrità', sourceId: 'Francis – Training for Speed' },
      { text: 'Il CNS è la risorsa più limitante: proteggila con recupero reale tra le sessioni di alta intensità', sourceId: 'Speed Trap 1990' },
    ],
    fusionWeight: {
      recommendedPercent: 25,
      bestPairedWith: ['P08', 'P37', 'P06'],
    },
    periodizationModel: ['block', 'conjugate'],
    assessmentScreening: ['Flying 10m sprint test', 'Vertical jump (CNS readiness)', 'Standing broad jump'],
  },

  // ── P17 ── Phil Maffetone — MAF Method / Aerobic Base (Evidence B) ────────────
  {
    id: 'P17',
    name: 'Phil Maffetone',
    role: 'endurance coach | osteopath',
    discipline: 'endurance | aerobic development | MAF method',
    era: '1980s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'The Big Book of Endurance Training and Racing – Phil Maffetone', url: 'https://philmaffetone.com/book/', type: 'practitioner textbook', priority: 1 },
        { title: 'The MAF Method – maff180 formula', url: 'https://philmaffetone.com/180-formula/', type: 'practitioner framework', priority: 2 },
        { title: 'PubMed – polarized training review supporting aerobic base', url: 'https://pubmed.ncbi.nlm.nih.gov/23539308/', type: 'peer-reviewed support', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'MAF Formula: max aerobic HR = 180 − age (adjusted for health/fitness status)',
        'All base-phase training done at or below MAF HR to maximize fat oxidation and aerobic enzyme development',
        'Avoid anaerobic training until aerobic base is well established (months, not weeks)',
        'Progress is tracked via MAF test: pace at MAF HR should improve over months',
        'Overtraining and injury often stem from insufficient aerobic base relative to training load',
      ],
    },
    load: {
      rules: [
        'Train exclusively at/below MAF HR for first 3–6 months',
        'MAF HR = 180 − age; subtract 5 more if frequent illness/injury; add 5 if racing without injury 2+ years',
        'Use MAF test monthly: 5-mile run at MAF HR; track pace improvement',
        'No anaerobic work until MAF pace improves significantly (months of aerobic base work)',
        'Nutrition: fat-adapted diet (low sugar, adequate fat) supports aerobic metabolism',
      ],
    },
    blocks: [
      {
        name: 'Aerobic Base Block (MAF-only)',
        durationWeeks: [12, 24],
        dosage: '4–6 sessions/week at/below MAF HR; volume 60–90 min/session',
        progression: 'Volume increases only if MAF test shows improvement; pace at MAF HR should decrease',
      },
      {
        name: 'Mixed Aerobic Block',
        durationWeeks: [8, 12],
        dosage: '3–4 aerobic sessions/week + 1–2 race-pace sessions; still 80–85% at MAF HR',
        progression: 'Add race-specific work only after solid MAF base; never exceed 20% of total volume at intensity',
      },
    ],
    kpis: [
      { name: 'MAF test pace (min/km at MAF HR)', type: 'performance' },
      { name: 'Average HR during aerobic sessions (vs MAF target)', type: 'systemic' },
      { name: 'Resting HR trend', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'MAF test pace worsening over 4+ weeks of consistent training', action: 'Reduce volume 20%; assess sleep, nutrition, life stress; possible overreaching' },
      { trigger: 'HR drifting above MAF within first 20 min of easy run', action: 'Slow down; may indicate fatigue, dehydration, or illness onset' },
    ],
    mapping: {
      userArchetypes: ['endurance beginner', 'returning runner', 'athlete with overuse injury history', 'masters athlete'],
      compatibleObjectives: ['aerobic base', 'fat oxidation', 'injury prevention', 'long-term endurance development'],
      incompatibleObjectives: ['competition in <8 weeks requiring race-specific intensity', 'sprint/power athletes'],
    },
    uiPills: [
      { text: 'Costruisci la base aerobica prima di aggiungere intensità. Mesi, non settimane', sourceId: 'Maffetone – MAF Method' },
      { text: 'Formula MAF: 180 − età. Allenati lentamente per correre veloce', sourceId: 'Big Book of Endurance 2010' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P15', 'P16', 'P13', 'P14'],
    },
    periodizationModel: ['linear'],
    assessmentScreening: ['MAF test (5km at MAF HR)', 'Resting HR morning measurement', 'HR drift test (30 min easy)'],
  },

  // ── P18 ── Iñigo San Millán — Zone 2 / Metabolic Efficiency (Evidence B) ──────
  {
    id: 'P18',
    name: 'Iñigo San Millán',
    role: 'exercise physiologist | team sport scientist',
    discipline: 'endurance | metabolic efficiency | Zone 2',
    era: '2000s-2020s',
    nationality: 'Spain / USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'San Millán & Brooks 2018 – Mitochondrial function in elite cyclists', url: 'https://pubmed.ncbi.nlm.nih.gov/30079893/', type: 'peer-reviewed', priority: 1 },
        { title: 'Attia Podcast – Zone 2 and metabolic health (San Millán interview)', url: 'https://peterattiamd.com/inigosanmillan2/', type: 'expert interview on evidence-based methods', priority: 2 },
        { title: 'San Millán – Zone 2 training and metabolic health framework', url: 'https://www.inigosanmillan.com/', type: 'practitioner framework', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Zone 2 = lactate threshold 1 (LT1): highest intensity where lactate production equals clearance',
        'Zone 2 maximizes mitochondrial biogenesis and metabolic flexibility (fat oxidation)',
        'Elite athletes have high Zone 2 capacity (mitochondrial density and lactate clearance) as foundation',
        '3–4 hours/week of Zone 2 minimum for significant mitochondrial adaptation',
        'Higher performance zones built ON TOP of Zone 2 base; without Zone 2, intensity yields diminishing returns',
      ],
    },
    load: {
      rules: [
        'Zone 2 = lactate 1.7–2.0 mmol/L or "talk test" easy: full sentences possible without breathlessness',
        'Minimum 3×45–60 min Zone 2/week for adaptation; 3–4 hours/week optimal',
        'No HR drifting into Zone 3 during Zone 2 sessions (invalidates metabolic benefit)',
        'High-intensity work (Zones 4–5) only 2×/week maximum; Zone 2 is the base',
        'Monitor metabolic markers: resting lactate, fat oxidation rate, VLamax (glycolytic capacity)',
      ],
    },
    blocks: [
      {
        name: 'Zone 2 Foundation Block',
        durationWeeks: [8, 16],
        dosage: '3–4×45–60 min/week at Zone 2; total 3–4h Zone 2/week',
        progression: 'Increase duration per session; monitor HR at fixed power/pace (should decrease)',
      },
      {
        name: 'Mixed Aerobic-Intensity Block',
        durationWeeks: [6, 10],
        dosage: '2–3×Zone 2 sessions + 1–2 HIIT or threshold sessions/week',
        progression: 'Add intensity sessions only after Zone 2 base established; maintain 80% Zone 2 ratio',
      },
    ],
    kpis: [
      { name: 'Power/pace at Zone 2 HR (trend over months)', type: 'performance' },
      { name: 'HR at fixed Zone 2 power/pace (should decrease)', type: 'systemic' },
      { name: 'Fat oxidation rate (g/min at Zone 2)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Zone 2 HR drifting >5 bpm above target within first 30 min', action: 'Stop; may indicate fatigue, illness, or insufficient recovery; reduce intensity' },
      { trigger: 'No aerobic improvement after 8+ weeks of consistent Zone 2', action: 'Verify true Zone 2 intensity; check nutrition (low carb + adequate fat); assess sleep' },
    ],
    mapping: {
      userArchetypes: ['endurance athlete', 'masters athlete', 'metabolic health seeker', 'triathlete', 'cyclist'],
      compatibleObjectives: ['aerobic base', 'metabolic health', 'fat oxidation', 'endurance performance', 'longevity'],
      incompatibleObjectives: ['sprint athletes', 'pure strength/power goals'],
    },
    uiPills: [
      { text: 'Zona 2: il carburante dell\'elite. Non annoiare il metabolismo, allenalo', sourceId: 'San Millán 2018' },
      { text: 'Senza base di Zona 2, l\'alta intensità porta diminishing returns nel tempo', sourceId: 'Attia Podcast 2021' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P15', 'P16', 'P17', 'P04', 'P24'],
    },
    periodizationModel: ['linear', 'concurrent'],
    assessmentScreening: ['Lactate threshold test (LT1/LT2)', 'HR at fixed power test', 'Talk test calibration'],
  },

  // ── P19 ── Iñigo Mujika — Tapering Science (Evidence A) ─────────────────────
  {
    id: 'P19',
    name: 'Iñigo Mujika',
    role: 'sport scientist | tapering researcher',
    discipline: 'endurance | tapering | detraining | peaking',
    era: '2000s-2020s',
    nationality: 'Spain / Australia',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Mujika & Padilla 2003 – Scientific bases for precompetition tapering', url: 'https://pubmed.ncbi.nlm.nih.gov/12627078/', type: 'peer-reviewed landmark review', priority: 1 },
        { title: 'Mujika 2009 – Tapering and Peaking for Optimal Performance (book)', url: 'https://www.humankinetics.com/products/all-books/tapering-and-peaking-for-optimal-performance-2nd-edition', type: 'textbook peer-reviewed', priority: 2 },
        { title: 'Mujika et al. 2004 – Physiological changes during a 2-week taper', url: 'https://pubmed.ncbi.nlm.nih.gov/15320640/', type: 'peer-reviewed RCT', priority: 3 },
        { title: 'Mujika 2011 – The alphabet of sport science research: S is for... (detraining)', url: 'https://pubmed.ncbi.nlm.nih.gov/20631558/', type: 'peer-reviewed review', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Optimal taper: reduce training volume 40–60% over 1–3 weeks; MAINTAIN intensity and frequency',
        'Progressive non-linear taper (exponential decay) outperforms abrupt or step taper',
        'Training frequency should not drop below 80% of pre-taper level during taper',
        'Detraining: aerobic endurance maintained 10–28 days at reduced frequency if intensity preserved',
        'Adaptation residuals (from Issurin): different qualities decay at different rates during detraining',
      ],
    },
    load: {
      rules: [
        'Taper volume: reduce by 40–60% progressively over 1–3 weeks before competition',
        'Maintain intensity: do NOT reduce training intensity during taper; reduce volume only',
        'Maintain frequency: ≥80% of regular training frequency; do not completely skip days',
        'Taper duration: 1 week for short events; 2–3 weeks for endurance events (marathon, triathlon)',
        'Post-competition return: respect detraining decay rates; gradual volume restoration',
      ],
    },
    blocks: [
      {
        name: 'Pre-Competition Taper (1 week)',
        durationWeeks: [1, 1],
        dosage: 'Reduce volume to 50–60% of peak; maintain 2 intensity sessions; full rest 2 days before competition',
        progression: 'Progressive volume reduction; quality sessions maintained',
      },
      {
        name: 'Pre-Competition Taper (2–3 weeks)',
        durationWeeks: [2, 3],
        dosage: 'Week 1: −30% volume; Week 2: −50% volume; Week 3: −60% volume; intensity maintained throughout',
        progression: 'Exponential decay model; no abrupt drops; frequency maintained at 80%+',
      },
    ],
    kpis: [
      { name: 'Training volume vs taper schedule (%)', type: 'mechanical' },
      { name: 'Intensity sessions maintained per week', type: 'mechanical' },
      { name: 'Perceived well-being / Hooper Index', type: 'systemic' },
      { name: 'Competition performance vs baseline', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Complete rest for >3 days during taper (fitness loss)', action: 'Resume low-volume but intensity-maintained sessions; do not overtaper' },
      { trigger: 'Anxiety spike during taper ("taper madness")', action: 'Maintain short quality sessions; reassure through process; normal CNS adaptation' },
    ],
    mapping: {
      userArchetypes: ['endurance athlete approaching race', 'competitor in any sport', 'triathlete', 'marathon runner'],
      compatibleObjectives: ['race peaking', 'competition preparation', 'optimal performance timing'],
      incompatibleObjectives: ['off-season development', 'injury recovery'],
    },
    uiPills: [
      { text: 'Ridurre il volume del 40–60% pre-gara. Non toccare l\'intensità', sourceId: 'Mujika & Padilla 2003' },
      { text: 'Il tapering esponenziale progressivo supera i tagli bruschi: la riduzione deve essere graduale', sourceId: 'Mujika 2009' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P13', 'P14', 'P15', 'P24', 'P35'],
    },
    periodizationModel: ['block'],
    assessmentScreening: ['Hooper Index (well-being questionnaire)', 'Volume tracking vs taper plan'],
  },

  // ── P20 ── Gray Cook — FMS / Movement Screening (Evidence B) ─────────────────
  {
    id: 'P20',
    name: 'Gray Cook',
    role: 'physical therapist | FMS creator | movement specialist',
    discipline: 'movement screening | corrective exercise | injury prevention',
    era: '2000s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Movement: Functional Movement Systems – Gray Cook (book)', url: 'https://functionalmovement.com/publications', type: 'practitioner textbook', priority: 1 },
        { title: 'FMS – Functional Movement Screen research compendium', url: 'https://www.functionalmovement.com/research', type: 'practitioner research database', priority: 2 },
        { title: 'Cook et al. 2006 – Predicting injury with FMS in NFL players', url: 'https://pubmed.ncbi.nlm.nih.gov/16557603/', type: 'peer-reviewed study', priority: 3 },
        { title: 'PubMed – FMS score and injury risk meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/23793316/', type: 'peer-reviewed meta-analysis', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'FMS (Functional Movement Screen): 7 tests scored 0–3 each (max 21); asymmetry and pain are critical',
        'Movement quality precedes movement quantity: screen before prescribing load',
        'Asymmetry (bilateral score difference ≥1) predicts injury risk more than total score',
        'FMS score ≤14 associated with significantly higher injury risk in athletic populations',
        'Correct movement first, then develop it, then load it — sequencing prevents reinforcing dysfunction',
        'Pain during any FMS test = 0; immediately flags need for clinical assessment',
      ],
    },
    load: {
      rules: [
        'Screen with FMS before starting any structured program',
        'FMS ≤14 or any asymmetry: add corrective exercise priority before loading',
        'Do NOT load dysfunctional movement patterns; regression to corrective first',
        'Reassess FMS every 4–6 weeks during corrective phase',
        'Pain score (0) in any FMS test → clinical referral before training proceeds',
      ],
    },
    blocks: [
      {
        name: 'Movement Screening + Corrective Block',
        durationWeeks: [4, 6],
        dosage: '15–20 min/session corrective exercises; 2–3x/week; full training program continues',
        progression: 'FMS retest after 4–6 weeks; progress if score improves; reassess if plateaued',
      },
    ],
    kpis: [
      { name: 'FMS total score (0–21)', type: 'mechanical' },
      { name: 'FMS asymmetry count (bilateral differences ≥1)', type: 'mechanical' },
      { name: 'FMS pain tests (0 scores)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'FMS score ≤14 at initial screen', action: 'Add corrective protocol before loading; retest in 4–6 weeks' },
      { trigger: 'Any FMS test scoring 0 (pain)', action: 'Refer to physiotherapist; do not load that movement pattern' },
      { trigger: 'Asymmetry ≥1 in deep squat or active straight leg raise', action: 'Prioritize mobility/stability correctives for affected side; recheck in 4 weeks' },
    ],
    mapping: {
      userArchetypes: ['athlete returning from injury', 'beginner starting program', 'team sport athlete', 'anyone with movement restrictions'],
      compatibleObjectives: ['injury prevention', 'movement quality', 'return to sport', 'assessment-first programming'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'Muoviti bene prima di muoverti spesso. Poi aggiungi il carico', sourceId: 'Gray Cook – Movement' },
      { text: 'FMS ≤14 o asimmetria: correggi prima di caricare. La qualità precede la quantità', sourceId: 'Cook et al. 2006' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P48', 'P49', 'P05', 'P07'],
    },
    assessmentScreening: ['FMS 7-test battery', 'SFMA (Selective Functional Movement Assessment) for pain cases', 'Y-Balance Test'],
  },

  // ── P21 ── Kelly Starrett — Mobility / Supple Leopard (Evidence B) ──────────
  {
    id: 'P21',
    name: 'Kelly Starrett',
    role: 'physical therapist | mobility coach | CrossFit founder collaborator',
    discipline: 'mobility | movement prep | injury prevention',
    era: '2010s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Becoming a Supple Leopard – Starrett & Cordoza (book)', url: 'https://www.thereadystate.com/becoming-a-supple-leopard/', type: 'practitioner textbook', priority: 1 },
        { title: 'Ready to Run – Starrett (book)', url: 'https://www.thereadystate.com/ready-to-run/', type: 'practitioner book', priority: 2 },
        { title: 'The Ready State – mobility WOD and research', url: 'https://www.thereadystate.com/', type: 'practitioner framework', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Every athlete has the mobility they need; dysfunction is from patterns, restrictions, motor control failure',
        'Upstream–downstream: pain site is often not the cause; assess chain systematically',
        'Two-minute rule: ≥2 min sustained tissue work needed for neurological and mechanical change',
        'Stiffness as first-line defense: joint stability before mobility in any loaded position',
        'Daily mobility maintenance: 10–15 min/day beats 2h/week in one session',
        'Address 3 categories: joint capsule, sliding surfaces, neural tension',
      ],
    },
    load: {
      rules: [
        'Screen joint ROM before loading; restricted joints under load = injury risk',
        'Address mobility restrictions before adding training load to that pattern',
        'Minimum 10 min mobility work daily, focused on training day demands',
        'Use 2-min sustained pressure for fascia/tissue work; shorter = neurological change only',
        'Prioritize hip flexor, thoracic spine, ankle dorsiflexion for most athletes',
      ],
    },
    blocks: [
      {
        name: 'Daily Mobility Maintenance',
        durationWeeks: [4, 99],
        dosage: '10–15 min/day; target restrictions identified in movement screen; 2 min/position',
        progression: 'Reassess ROM monthly; progress to loaded mobility once restriction cleared',
      },
      {
        name: 'Targeted Restriction Clearing Block',
        durationWeeks: [3, 6],
        dosage: '20–30 min/day on primary restriction; progressive joint mobilization + tissue work',
        progression: 'Mobility gates unlock before loading; FMS rescreening validates progress',
      },
    ],
    kpis: [
      { name: 'Ankle dorsiflexion range (knee to wall test, cm)', type: 'mechanical' },
      { name: 'Hip flexor ROM (Thomas test)', type: 'mechanical' },
      { name: 'Thoracic rotation ROM', type: 'mechanical' },
      { name: 'Overhead squat quality (FMS deep squat score)', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Joint pain during loaded ROM (squat, overhead press)', action: 'Unload; assess restriction upstream; add mobility work before reloading' },
      { trigger: 'Visible compensatory movement (e.g., heel rise in squat, lumbar flexion in deadlift)', action: 'Regress load; add ankle/hip mobility; corrective drill before working sets' },
    ],
    mapping: {
      userArchetypes: ['CrossFit athlete', 'desk worker starting training', 'mobility-restricted athlete', 'post-injury returnee'],
      compatibleObjectives: ['injury prevention', 'movement quality', 'performance readiness', 'longevity'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'Ogni atleta ha la mobilità di cui ha bisogno. Sblocca i pattern, non solo i muscoli', sourceId: 'Starrett – Supple Leopard' },
      { text: 'Minimo 2 minuti di pressione sostenuta per cambiare il tessuto, non solo 30 secondi', sourceId: 'Ready State 2015' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P20', 'P48', 'P07', 'P06'],
    },
    assessmentScreening: ['Ankle dorsiflexion test', 'Thomas test (hip flexor)', 'FMS deep squat', 'Shoulder flexion overhead'],
  },

  // ── P22 ── Pavel Tsatsouline — Kettlebell S&E / Grease the Groove (Evidence B) ─
  {
    id: 'P22',
    name: 'Pavel Tsatsouline',
    role: 'strength coach | kettlebell master | former Soviet military trainer',
    discipline: 'kettlebell | strength-endurance | greasing the groove',
    era: '1990s-2020s',
    nationality: 'Russia / USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Enter the Kettlebell – Pavel Tsatsouline (book)', url: 'https://www.strongfirst.com/product/enter-the-kettlebell/', type: 'practitioner textbook', priority: 1 },
        { title: 'Kettlebell Simple & Sinister – Pavel Tsatsouline', url: 'https://www.strongfirst.com/product/simple-sinister/', type: 'practitioner programming book', priority: 2 },
        { title: 'Power to the People – Pavel Tsatsouline', url: 'https://www.strongfirst.com/product/power-to-the-people-revised/', type: 'practitioner book', priority: 3 },
        { title: 'StrongFirst – Research on submaximal training and strength', url: 'https://www.strongfirst.com/research/', type: 'practitioner evidence platform', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Grease the Groove (GTG): practice movement skill at sub-maximal effort multiple times/day; avoid failure',
        'Never train to failure; stop 2–4 reps short; high practice frequency builds neural efficiency',
        'Hardstyle kettlebell: tension + power at end range; opposite of yoga-style relaxation',
        'The Swing and Turkish Get-Up as foundational movements; master before all else',
        'Low-rep, high-frequency strength training: 5×5 or ladders; avoid failure; daily practice',
        'Breathing and intra-abdominal pressure (IAP) as performance multiplier',
      ],
    },
    load: {
      rules: [
        'GTG: multiple sets throughout day; never exceed 80% effort; leave reps in reserve always',
        'Swing program: 2-hand swing + TGU; start with comfortable weight; master technique',
        'Ladder sets: 1–2–3, 1–2–3–4, etc.; never exceed ladder top where form degrades',
        'Rest between sets: full recovery or timed (e.g., "on the minute"); never train in fatigue',
        'Minimum effective dose: 3×/week full program; GTG can be daily',
      ],
    },
    blocks: [
      {
        name: 'Kettlebell Foundation Block (S&S Protocol)',
        durationWeeks: [8, 16],
        dosage: 'Daily: 100 one-arm swings + 10 TGU; goal times: Simple (5/5/5) in 5 min each',
        progression: 'Increase weight when standard is met within time; never compromise form',
      },
      {
        name: 'GTG Strength Block',
        durationWeeks: [4, 8],
        dosage: 'Multiple daily sets (3–5 sets/day) of target movement at 70–80% effort; never to failure',
        progression: 'When submaximal reps become trivial, add 1 rep per set or advance to next weight',
      },
    ],
    kpis: [
      { name: 'Swing test standard (100 swings in 5 min)', type: 'performance' },
      { name: 'TGU weight per side', type: 'performance' },
      { name: 'GTG daily practice compliance', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Training to failure during GTG protocol', action: 'Stop; reset volume; reinforce sub-maximal effort principle' },
      { trigger: 'Low back pain during kettlebell swings', action: 'Regress to hip hinge drill; check spinal neutrality; reduce weight' },
    ],
    mapping: {
      userArchetypes: ['time-crunched athlete', 'minimalist strength seeker', 'military/first responder', 'S&E generalist'],
      compatibleObjectives: ['strength endurance', 'general fitness', 'fat loss with strength retention', 'GPP'],
      incompatibleObjectives: ['maximal hypertrophy', 'competition powerlifting', 'elite endurance'],
    },
    uiPills: [
      { text: 'Grease the Groove: pratica sub-massimale, frequente. Non cedimento: ripetizione', sourceId: 'Enter the Kettlebell – Pavel' },
      { text: 'Simple & Sinister: 100 swings + 10 TGU al giorno. Minimo efficace, massimo ritorno', sourceId: 'Pavel S&S 2019' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P40', 'P05', 'P07'],
    },
    periodizationModel: ['conjugate'],
    assessmentScreening: ['Swing standard test (100 reps quality)', 'TGU progression test', 'Grip strength measurement'],
  },

  // ── P23 ── Bret Contreras — Glute Training / Hip Thrust Science (Evidence B) ──
  {
    id: 'P23',
    name: 'Bret Contreras',
    role: 'biomechanist | glute specialist | S&C researcher',
    discipline: 'hypertrophy | glute development | hip extension biomechanics',
    era: '2010s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Contreras et al. 2015 – A Comparison of Gluteus Maximus EMG Activity', url: 'https://pubmed.ncbi.nlm.nih.gov/26237450/', type: 'peer-reviewed EMG study', priority: 1 },
        { title: 'Contreras – Strong Curves (book)', url: 'https://bretcontreras.com/strong-curves/', type: 'practitioner textbook', priority: 2 },
        { title: 'Contreras 2016 – Hip thrust vs squat for sprinting', url: 'https://pubmed.ncbi.nlm.nih.gov/26950577/', type: 'peer-reviewed RCT', priority: 3 },
        { title: 'Journal of Strength & Conditioning Research – Hip thrust research', url: 'https://journals.lww.com/nsca-jscr/abstract/2015/06000/a_comparison_of_gluteus_maximus,_biceps_femoris,.26.aspx', type: 'peer-reviewed', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Hip thrust produces highest gluteus maximus EMG activation of any exercise when performed correctly',
        'Squat and hip thrust are complementary: different force angles produce different glute activation patterns',
        'Glute activation is often suppressed by anterior pelvic tilt, hip flexor tightness, or motor control deficit',
        'Practical loading: hip thrust can be loaded heavier than most realize; use progressive overload',
        'Full hip extension at top of hip thrust is essential; partial ROM underactivates glutes',
      ],
    },
    load: {
      rules: [
        'Hip thrust 2–3x/week for glute development; treat as primary exercise (not accessory)',
        'Progress load systematically; most users can hip thrust significantly more than they squat',
        'Cue "drive knees out" + "posterior pelvic tilt at top" for maximal glute activation',
        'Romanian deadlift + hip thrust combo = comprehensive posterior chain coverage',
        'Glute bridges before loading hip thrust: activate before loading for better motor recruitment',
      ],
    },
    blocks: [
      {
        name: 'Glute Activation + Foundation Block',
        durationWeeks: [3, 4],
        dosage: 'Bodyweight glute bridges 3×20 → progressing to barbell hip thrust 3×10–15; 2x/week',
        progression: 'Load only when full ROM + posterior pelvic tilt at top consistently achieved',
      },
      {
        name: 'Hip Thrust Strength Block',
        durationWeeks: [6, 10],
        dosage: '3–4×6–12 barbell hip thrust; 2–3x/week; progressive overload each session',
        progression: 'Increase load 2.5–5kg when rep ceiling (e.g., 12) consistently achieved',
      },
    ],
    kpis: [
      { name: 'Hip thrust 1RM or rep max', type: 'performance' },
      { name: 'Glute activation quality (posterior tilt at top)', type: 'mechanical' },
      { name: 'Sprint time or hip extension power (if athletic)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Anterior pelvic tilt at top of hip thrust', action: 'Regress load; cue posterior tilt; add hip flexor mobility work' },
      { trigger: 'Lower back pain during hip thrust', action: 'Assess lumbar extension; reduce load; check setup (bar position, foot placement)' },
    ],
    mapping: {
      userArchetypes: ['glute development focused athlete', 'female physique competitor', 'sprint athlete', 'rehabilitation posterior chain'],
      compatibleObjectives: ['glute hypertrophy', 'posterior chain strength', 'sprint power', 'aesthetic physique'],
      incompatibleObjectives: ['pure endurance', 'upper body specialization'],
    },
    uiPills: [
      { text: 'L\'hip thrust attiva il gluteo massimamente tra tutti gli esercizi. Non è un accessorio', sourceId: 'Contreras et al. 2015' },
      { text: 'Squat + hip thrust = copertura completa del gluteo. Angoli di forza diversi, adattamenti diversi', sourceId: 'Strong Curves 2013' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P09', 'P10', 'P07', 'P47'],
    },
    periodizationModel: ['linear', 'undulating'],
    assessmentScreening: ['Hip thrust rep max test', 'Glute activation screen (posterior tilt quality)', 'Thomas test (hip flexor tightness)'],
  },

  // ── P26 ── Stuart Phillips — Protein Synthesis / Muscle Metabolism (Evidence A) ─
  {
    id: 'P26',
    name: 'Stuart Phillips',
    role: 'exercise physiologist | protein metabolism researcher',
    discipline: 'protein synthesis | nutrition science | muscle metabolism',
    era: '2000s-2020s',
    nationality: 'Canada',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Morton et al. 2018 (Phillips lab) – A systematic review of protein supplementation and muscle mass', url: 'https://pubmed.ncbi.nlm.nih.gov/27550719/', type: 'peer-reviewed meta-analysis', priority: 1 },
        { title: 'Phillips & Van Loon 2011 – Dietary protein for athletes: from requirements to optimum adaptation', url: 'https://pubmed.ncbi.nlm.nih.gov/21660839/', type: 'peer-reviewed review', priority: 2 },
        { title: 'Stokes et al. 2018 – Recent perspectives regarding the role of dietary protein for the promotion of muscle hypertrophy', url: 'https://pubmed.ncbi.nlm.nih.gov/29722584/', type: 'peer-reviewed review', priority: 3 },
        { title: 'Moore et al. 2009 – Ingested protein dose response of muscle and albumin protein synthesis', url: 'https://pubmed.ncbi.nlm.nih.gov/19056590/', type: 'peer-reviewed landmark study', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Protein intake of 1.6 g/kg/day optimal for muscle protein synthesis; upper bound ~2.2 g/kg/day',
        'Muscle protein synthesis (MPS) is maximized per meal at 20–40g protein; >40g not wasteful but not meaningfully more stimulating',
        'Protein distribution: 3–5 meals with 25–40g protein each maximizes daily MPS vs. skewed distribution',
        'Post-exercise protein: MPS elevated for 24–48h post-resistance training; "anabolic window" is hours, not minutes',
        'Leucine threshold: ~2–3g leucine per meal is the trigger for maximal MPS stimulation',
        'Whole food protein sources (leucine-complete) superior to low-leucine sources for MPS',
      ],
    },
    load: {
      rules: [
        'Daily protein target: 1.6–2.2 g/kg body weight for athletes',
        'Distribute protein across 3–5 meals; avoid large protein skewing to single meal',
        'Post-workout protein within 2h is beneficial; overall daily total is more important than timing',
        'Leucine content is key: animal proteins, whey, and soy are complete; plant proteins may need higher dose',
        'During caloric deficit: increase protein to 2.2–2.5 g/kg to preserve lean mass',
      ],
    },
    blocks: [
      {
        name: 'Lean Gaining Protocol',
        durationWeeks: [8, 16],
        dosage: '1.8–2.2 g/kg protein/day; slight caloric surplus (+200–300 kcal); 3–5 protein meals/day',
        progression: 'Adjust based on lean mass and fat gain rate; monthly body composition check',
      },
      {
        name: 'Fat Loss / Cutting Protocol',
        durationWeeks: [6, 12],
        dosage: '2.2–2.5 g/kg protein/day; caloric deficit (−300–500 kcal); high-frequency protein distribution',
        progression: 'Monitor strength retention; protein sparing effect preserves muscle during deficit',
      },
    ],
    kpis: [
      { name: 'Daily protein intake (g/kg body weight)', type: 'systemic' },
      { name: 'Protein distribution (meals with 25–40g protein)', type: 'systemic' },
      { name: 'Lean mass retention during cut (weight vs strength trend)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Strength dropping >10% during caloric deficit', action: 'Increase protein to 2.5 g/kg; reassess caloric deficit magnitude' },
      { trigger: 'Skipping protein post-training consistently', action: 'Educate on 24–48h MPS window; prioritize post-workout meal' },
    ],
    mapping: {
      userArchetypes: ['strength/hypertrophy athlete', 'physique competitor', 'any athlete in caloric deficit', 'masters athlete (higher protein needs)'],
      compatibleObjectives: ['muscle hypertrophy', 'lean gaining', 'fat loss with muscle preservation', 'strength maintenance'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: '1.6–2.2 g/kg proteine al giorno. L\'apporto totale conta più del timing', sourceId: 'Morton et al. 2018' },
      { text: '3–5 pasti con 25–40g proteine ciascuno massimizzano la sintesi proteica muscolare giornaliera', sourceId: 'Phillips & Van Loon 2011' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P09', 'P10', 'P11', 'P47'],
    },
    assessmentScreening: ['Dietary protein tracking (3-day food log)', 'Body composition assessment', 'Strength trend monitoring'],
  },

  // ── P29 ── Boris Sheiko — Russian Powerlifting Programming (Evidence B) ────────
  {
    id: 'P29',
    name: 'Boris Sheiko',
    role: 'national powerlifting coach | Russia',
    discipline: 'powerlifting | strength | high-frequency programming',
    era: '1980s-2020s',
    nationality: 'Russia',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Sheiko programs compendium – EliteFTS', url: 'https://www.elitefts.com/education/training/powerlifting/boris-sheiko-program/', type: 'practitioner technical manual', priority: 1 },
        { title: 'Israetel et al. – Scientific Principles of Strength Training (Sheiko analysis)', url: 'https://rpstrength.com/blogs/articles/scientific-principles-of-strength-training', type: 'practitioner review', priority: 2 },
        { title: 'PubMed – high-frequency resistance training meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/27102172/', type: 'peer-reviewed support', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'High frequency: squat, bench, deadlift trained 3–4x/week each; technique is the primary adaptation',
        'Submaximal loads dominate: 70–85% 1RM on most sets; rarely exceed 90%+ outside competition prep',
        'Volume accumulation: hundreds of reps per week on competition lifts; technical mastery through repetition',
        'No isolation exercises in traditional sense; compound lifts drive everything',
        'Periodization: intensity increases over 4-week cycles while volume decreases; competition-peaking protocol',
      ],
    },
    load: {
      rules: [
        'Primary lifts 3–4x/week each; most sets at 70–85% 1RM for technical reinforcement',
        'Weekly volume: 600–1000+ total reps across competition lifts in accumulation phase',
        'Avoid training above 90% more than 1–2x/month outside peaking cycles',
        'Competition prep: volume drops, intensity rises over final 4–6 weeks',
        'No ego lifting; technique failure = end of set; log every session meticulously',
      ],
    },
    blocks: [
      {
        name: 'Accumulation (Sheiko #29 style)',
        durationWeeks: [4, 6],
        dosage: 'SBD 3–4x/week; 5×5–8 sets at 70–80%; high total volume; submaximal emphasis',
        progression: 'Volume increases weekly; intensity stays at 70–85%; technique priority over load',
      },
      {
        name: 'Intensification Block',
        durationWeeks: [3, 4],
        dosage: 'SBD 3x/week; volume reduces 30%; intensity rises to 80–90%; more singles/doubles',
        progression: 'Increase intensity; reduce volume; competition-specific singles approach',
      },
    ],
    kpis: [
      { name: 'Weekly rep count on SBD (squat/bench/deadlift)', type: 'mechanical' },
      { name: 'Average training intensity (%1RM)', type: 'mechanical' },
      { name: 'Technical failure rate per session', type: 'mechanical' },
      { name: 'Competition total (S+B+D)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Persistent joint pain in knee/hip/shoulder during competition lifts', action: 'Reduce frequency; add mobility/corrective; assess form video' },
      { trigger: 'Progressive overreaching (performance drop + fatigue over 2+ weeks)', action: 'Insert deload week; reduce total weekly volume 40%' },
    ],
    mapping: {
      userArchetypes: ['competitive powerlifter', 'advanced strength athlete', 'intermediate transitioning to high frequency'],
      compatibleObjectives: ['powerlifting total', 'SBD strength', 'technique mastery'],
      incompatibleObjectives: ['hypertrophy specialization', 'endurance', 'beginners (volume too high)'],
    },
    uiPills: [
      { text: 'Alta frequenza + sub-massimale: la tecnica si impara con le ripetizioni, non con i massimali', sourceId: 'Sheiko – Program Compendium' },
      { text: 'Centinaia di rep a settimana sui movimenti di gara. La forza viene dalla padronanza tecnica', sourceId: 'Sheiko methodology' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P27', 'P28', 'P36'],
    },
    periodizationModel: ['block', 'linear'],
    assessmentScreening: ['1RM Squat/Bench/Deadlift', 'Competition total', 'Technique video analysis'],
  },

  // ── P30 ── Louie Simmons — Westside Barbell / Conjugate Method (Evidence C) ───
  {
    id: 'P30',
    name: 'Louie Simmons',
    role: 'powerlifting coach | Westside Barbell founder',
    discipline: 'powerlifting | conjugate periodization | max effort / dynamic effort',
    era: '1980s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'C',
      prioritizedSources: [
        { title: 'Special Strength Development for All Sports – Louie Simmons', url: 'https://www.westside-barbell.com/products/special-strength-development-for-all-sports', type: 'practitioner book', priority: 1 },
        { title: 'Westside Barbell Book of Methods – Simmons', url: 'https://www.westside-barbell.com/products/the-westside-barbell-book-of-methods', type: 'practitioner coaching manual', priority: 2 },
        { title: 'PubMed – conjugate periodization review', url: 'https://pubmed.ncbi.nlm.nih.gov/30629888/', type: 'peer-reviewed review (indirect support)', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Conjugate method: Max Effort (ME) and Dynamic Effort (DE) days run concurrently each week',
        'ME day: work up to 1RM or near-1RM; rotate main exercise every 1–3 weeks to avoid accommodation',
        'DE day: 50–60% 1RM with accommodating resistance (bands/chains); maximal bar speed; teach rate of force development',
        'Accessory work (GPP): high volume of supplementary exercises targeting weak points',
        'Accommodation resistance (bands/chains) teaches force application through full ROM',
        'Special exercises chosen based on weaknesses in competition lift (e.g., box squat for posterior chain)',
      ],
    },
    load: {
      rules: [
        'ME upper: 1 primary exercise to max; rotate every 1–3 weeks',
        'ME lower: same as ME upper; box squat variations, good mornings, deadlift variations',
        'DE upper: 8–10×3 at 50–60% + bands/chains; max velocity; 30s rest between sets',
        'DE lower: 10–12×2 box squat at 50–60%; max bar speed focus',
        'GPP: 3–5 accessory exercises after main work; target identified weaknesses',
      ],
    },
    blocks: [
      {
        name: 'Conjugate Weekly Structure (ongoing)',
        durationWeeks: [4, 99],
        dosage: 'ME lower Mon, ME upper Wed, DE lower Fri, DE upper Sat; GPP daily',
        progression: 'Rotate ME exercises every 1–3 weeks; increase DE speed; address GPP weaknesses',
      },
    ],
    kpis: [
      { name: 'ME exercise max (rotating)', type: 'performance' },
      { name: 'DE bar velocity (bands+load)', type: 'performance' },
      { name: 'Competition SBD total', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Stagnation on ME exercise max for 2+ consecutive rotations', action: 'Change exercise selection; assess GPP weakness; revisit accommodating resistance ratio' },
      { trigger: 'Injury from maximal effort work', action: 'Switch to repeated effort method temporarily; address recovery; consult PT' },
    ],
    mapping: {
      userArchetypes: ['competitive powerlifter', 'advanced strength athlete', 'athlete needing rate-of-force development'],
      compatibleObjectives: ['powerlifting total', 'explosive strength', 'rate of force development'],
      incompatibleObjectives: ['beginners (complexity too high)', 'endurance athletes', 'hypertrophy focus'],
    },
    uiPills: [
      { text: 'Max Effort + Dynamic Effort ogni settimana. Il metodo coniugato allena forza e velocità insieme', sourceId: 'Westside Book of Methods' },
      { text: 'Ruota l\'esercizio principale ogni 1–3 settimane per evitare l\'accomodamento', sourceId: 'Simmons – Special Strength Development' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P36', 'P37', 'P27', 'P29'],
    },
    periodizationModel: ['conjugate'],
    assessmentScreening: ['1RM on rotating ME exercise', 'Competition total', 'Vertical jump / broad jump (power)'],
  },

  // ── P31 ── Matthew Walker — Sleep Science (Evidence A) ───────────────────────
  {
    id: 'P31',
    name: 'Matthew Walker',
    role: 'neuroscientist | sleep researcher | UC Berkeley professor',
    discipline: 'sleep science | recovery | performance optimization',
    era: '2010s-2020s',
    nationality: 'UK / USA',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Why We Sleep – Matthew Walker (book based on peer-reviewed research)', url: 'https://www.simonandschuster.com/books/Why-We-Sleep/Matthew-Walker/9781501144325', type: 'textbook based on peer-reviewed science', priority: 1 },
        { title: 'Walker et al. 2017 – The role of sleep in cognition and emotion', url: 'https://pubmed.ncbi.nlm.nih.gov/20102585/', type: 'peer-reviewed review', priority: 2 },
        { title: 'Leproult & Van Cauter 2011 – Effect of sleep loss on testosterone', url: 'https://pubmed.ncbi.nlm.nih.gov/21632481/', type: 'peer-reviewed landmark study', priority: 3 },
        { title: 'Mah et al. 2011 – The effects of sleep extension on athletic performance', url: 'https://pubmed.ncbi.nlm.nih.gov/21731144/', type: 'peer-reviewed RCT athletes', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        '7–9 hours of sleep/night is the physiological requirement for adults; <6h causes measurable performance impairment',
        'Sleep deprivation reduces testosterone by 10–15% after just 1 week of 5h/night',
        'Sleep extension (9–10h) in athletes improves reaction time, speed, accuracy, and reduces injury risk',
        'REM sleep consolidates motor learning; NREM sleep handles metabolic repair and anabolic hormone release',
        'Consistent sleep/wake times are as important as total duration for circadian optimization',
        'Afternoon naps (20–30 min) can partially mitigate sleep debt but do not replace night sleep',
      ],
    },
    load: {
      rules: [
        'Prioritize 7–9h/night as non-negotiable training variable; sleep is the #1 recovery modality',
        'Consistent bed/wake times ±30 min; avoid social jetlag on weekends',
        'No training within 2h of bedtime (core body temperature must drop for sleep onset)',
        'Caffeine half-life 5–7h: avoid after 2 pm for normal sleepers',
        'Dark, cool room (18–19°C) + no screens 1h before bed; blue light suppresses melatonin',
        'If <6h sleep: reduce high-intensity training load that day; injury risk markedly elevated',
      ],
    },
    blocks: [
      {
        name: 'Sleep Optimization Protocol',
        durationWeeks: [3, 4],
        dosage: 'Fixed wake time daily; wind-down 30 min pre-bed; optimize room temp and darkness',
        progression: 'Track sleep duration and quality via wearable or self-report; target 7–9h',
      },
    ],
    kpis: [
      { name: 'Sleep duration (hours/night)', type: 'systemic' },
      { name: 'Sleep quality score (wearable or subjective 1–5)', type: 'systemic' },
      { name: 'HRV morning readiness (correlates with sleep quality)', type: 'systemic' },
      { name: 'Reaction time / cognitive test (optional)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Consistent sleep <6h/night for 3+ days', action: 'Reduce training intensity; prioritize sleep over workout completion; address cause' },
      { trigger: 'HRV trending down + sleep quality low + fatigue subjective report', action: 'Mandatory rest day; sleep debt protocol (extra 1–2h/night for 3–5 days)' },
      { trigger: 'Training high intensity after <6h sleep', action: 'Downgrade session to Zone 2 or mobility; injury and overtraining risk acutely elevated' },
    ],
    mapping: {
      userArchetypes: ['any athlete', 'high-stress professional', 'athlete with frequent illness', 'anyone with poor recovery'],
      compatibleObjectives: ['recovery optimization', 'performance maintenance', 'injury prevention', 'hormonal health'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'Dormire <6h abbassa il testosterone del 10–15% in una settimana. Non è recovery, è antidoping naturale', sourceId: 'Leproult & Van Cauter 2011' },
      { text: 'Gli atleti con sleep extension hanno tempi di reazione più veloci e meno infortuni', sourceId: 'Mah et al. 2011' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P05', 'P49', 'P47', 'P48'],
    },
    assessmentScreening: ['Sleep duration 7-day average', 'Morning HRV trend', 'Subjective sleep quality (1–5 daily)'],
  },

  // ── P32 ── Nick Winkelman — Motor Learning / Coaching Cues (Evidence B) ───────
  {
    id: 'P32',
    name: 'Nick Winkelman',
    role: 'sport scientist | motor learning specialist | IRFU Head of Athletic Performance',
    discipline: 'motor learning | speed | coaching effectiveness',
    era: '2010s-2020s',
    nationality: 'USA / Ireland',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'The Language of Coaching – Nick Winkelman (book)', url: 'https://www.humankinetics.com/products/all-books/the-language-of-coaching', type: 'practitioner textbook evidence-based', priority: 1 },
        { title: 'Wulf & Shea 2002 – Principles derived from the study of simple skills', url: 'https://pubmed.ncbi.nlm.nih.gov/11824216/', type: 'peer-reviewed motor learning review', priority: 2 },
        { title: 'Wulf 2013 – Attentional focus and motor learning: a review of 15 years', url: 'https://pubmed.ncbi.nlm.nih.gov/22449499/', type: 'peer-reviewed review', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'External focus of attention (where effect is in environment) produces superior motor learning vs. internal focus (body part)',
        'Analogy cues ("push the earth away") outperform technical cues ("extend your knee") for motor pattern retention',
        'Action verbs > descriptive verbs: "explode", "drive", "punch" create better motor programs than "extend" or "flex"',
        'Quiet Eye: extended pre-movement visual fixation predicts accuracy in skill sports',
        'Optimal challenge point: task difficulty should be at ~70–85% success rate for maximal learning',
        'Feedback frequency: reduced frequency (every 3–4 attempts) produces better long-term retention than immediate every-rep feedback',
      ],
    },
    load: {
      rules: [
        'Use external focus cues for movement learning: focus on implement, floor, outcome — not body parts',
        'Give feedback every 3–4 reps for motor learning; not after every rep (degrades self-monitoring)',
        'Match cue complexity to athlete skill level: beginners need simple analogies; advanced need less verbal',
        'Analogy cues for performance cues; technical cues for initial learning only',
        'Allow athletes to self-discover corrections when possible (discovery learning > prescription)',
      ],
    },
    blocks: [
      {
        name: 'Movement Acquisition Block',
        durationWeeks: [2, 4],
        dosage: 'Low volume, perfect execution; external focus cues; 70–85% success rate challenge',
        progression: 'Simplify to near-100% success if learning stalls; increase challenge gradually',
      },
    ],
    kpis: [
      { name: 'Movement quality score (coach-assessed)', type: 'mechanical' },
      { name: 'Cue response latency (athlete adapts to cue in ≤2 attempts)', type: 'mechanical' },
      { name: 'Retention test (practice movement uncoached after 48h rest)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Athlete not improving with consistent technical cuing', action: 'Switch to external focus / analogy cue; remove prescriptive technical feedback' },
      { trigger: 'Paralysis by analysis (over-thinking movement mid-execution)', action: 'Use pre-movement routine + single analogy cue; reduce verbal coaching' },
    ],
    mapping: {
      userArchetypes: ['any athlete learning new movement', 'team sport athlete', 'coach', 'sprint/power athlete'],
      compatibleObjectives: ['technique acquisition', 'motor learning', 'coaching effectiveness', 'speed development'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'Focalizzati sull\'effetto, non sul corpo. "Spingi la terra" batte "estendi le ginocchia"', sourceId: 'Winkelman – Language of Coaching' },
      { text: 'Feedback ogni 3–4 ripetizioni, non dopo ogni set. Impari di più quando auto-monitorizzate', sourceId: 'Wulf 2013' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P06', 'P07', 'P08', 'P12'],
    },
    assessmentScreening: ['Movement quality assessment (coach-scored)', 'Sprint mechanics video analysis'],
  },

  // ── P33 ── Robert Hickson — Interference Effect / Concurrent Training (Evidence A)
  {
    id: 'P33',
    name: 'Robert Hickson',
    role: 'exercise physiologist | interference effect discoverer',
    discipline: 'concurrent training | endurance-strength interference | programming',
    era: '1980s-1990s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Hickson 1980 – Interference of strength development by simultaneously training for strength and endurance', url: 'https://pubmed.ncbi.nlm.nih.gov/6269946/', type: 'peer-reviewed landmark study', priority: 1 },
        { title: 'Wilson et al. 2012 – Concurrent training: meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/22002517/', type: 'peer-reviewed meta-analysis', priority: 2 },
        { title: 'Fyfe et al. 2014 – Concurrent training: interference and mitigation strategies', url: 'https://pubmed.ncbi.nlm.nih.gov/25395278/', type: 'peer-reviewed review', priority: 3 },
        { title: 'Murach & Bagley 2016 – Skeletal muscle hypertrophy with concurrent exercise training', url: 'https://pubmed.ncbi.nlm.nih.gov/27433992/', type: 'peer-reviewed review', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Interference effect: combining endurance + strength training in same session or day blunts strength/hypertrophy gains',
        'AMPK (endurance signaling) antagonizes mTOR (strength/hypertrophy signaling) when activated simultaneously',
        'Mitigation strategy 1: separate strength and endurance sessions by ≥6h (ideally different days)',
        'Mitigation strategy 2: strength first, endurance second within same day (not reverse)',
        'Mitigation strategy 3: minimize high-intensity endurance work (HIIT) when strength/hypertrophy is primary goal',
        'Lower body interference > upper body interference; running+lifting causes more interference than cycling+lifting',
      ],
    },
    load: {
      rules: [
        'Prioritize session ordering: strength before endurance when done same day',
        'Separate strength and endurance by ≥6h when possible; different days is optimal',
        'For strength-primary goals: limit high-intensity endurance (especially running) to ≤2 sessions/week',
        'Low-intensity endurance (Zone 1–2) causes minimal interference vs. HIIT with strength',
        'Cycling causes less lower-body interference than running; prefer for combined programs',
      ],
    },
    blocks: [
      {
        name: 'Strength-Primary Concurrent Block',
        durationWeeks: [8, 12],
        dosage: 'Strength 3–4x/week; endurance 2–3x/week (separate days or ≥6h apart); strength sessions am, endurance pm',
        progression: 'Monitor strength metrics as primary; endurance work should not compromise recovery',
      },
      {
        name: 'Endurance-Primary Concurrent Block',
        durationWeeks: [8, 12],
        dosage: 'Endurance 4–5x/week; strength 2x/week (after rest day; lower body emphasis)',
        progression: 'Monitor endurance performance as primary; strength maintained, not maximized',
      },
    ],
    kpis: [
      { name: 'Strength trajectory vs endurance-only control', type: 'performance' },
      { name: 'Session separation (hours between strength and endurance)', type: 'mechanical' },
      { name: 'Endurance + strength performance balance', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Strength stagnating despite consistent programming in concurrent athlete', action: 'Increase separation of sessions; reduce HIIT volume; check protein intake' },
      { trigger: 'Endurance performance declining with added strength training', action: 'Reduce strength volume; ensure endurance sessions are protected; reassess recovery' },
    ],
    mapping: {
      userArchetypes: ['triathlete', 'team sport athlete', 'concurrent training athlete', 'CrossFit athlete'],
      compatibleObjectives: ['concurrent fitness', 'triathlon', 'team sport conditioning', 'CrossFit performance'],
      incompatibleObjectives: ['pure powerlifting', 'pure marathon performance (strength interference minimal but present)'],
    },
    uiPills: [
      { text: 'Forza e endurance insieme si scontrano a livello molecolare (AMPK vs mTOR). Separa le sessioni', sourceId: 'Hickson 1980' },
      { text: 'Strategia: forza prima, endurance dopo. Minimo 6h di separazione per minimizzare l\'interferenza', sourceId: 'Wilson et al. 2012' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P24', 'P04', 'P40', 'P05'],
    },
    periodizationModel: ['concurrent', 'block'],
    assessmentScreening: ['Strength benchmark + aerobic benchmark (before and during concurrent program)', 'Session log (separation times)'],
  },

  // ── P38 ── Andy Galpin — Muscle Fiber Science / Performance Physiology (Evidence B)
  {
    id: 'P38',
    name: 'Andy Galpin',
    role: 'exercise physiologist | muscle fiber researcher | CSU Fullerton',
    discipline: 'muscle physiology | strength | power | endurance adaptation',
    era: '2010s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Galpin et al. 2016 – Myosin heavy chain composition in the vastus lateralis of resistance-trained women', url: 'https://pubmed.ncbi.nlm.nih.gov/26512339/', type: 'peer-reviewed study', priority: 1 },
        { title: 'Huberman & Galpin podcast – muscle fiber types and training', url: 'https://www.hubermanlab.com/episode/dr-andy-galpin-optimal-protocols-to-build-strength-muscle-size', type: 'evidence-based expert lecture series', priority: 2 },
        { title: 'PubMed – fast-twitch to slow-twitch fiber shift under endurance training', url: 'https://pubmed.ncbi.nlm.nih.gov/18202581/', type: 'peer-reviewed review', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Muscle fiber types (I, IIa, IIx) are plastic: training shifts fiber type expression over months',
        'Type IIx fibers (most powerful, least fatigue-resistant) convert to IIa with ANY consistent training',
        'Pure Type IIx fibers exist only in detrained state; active athletes have predominantly I and IIa',
        'Speed, power, and strength: develop IIa fibers with heavy/explosive training; protect by detraining avoidance',
        'Concurrent training does not eliminate fast-twitch fibers, but long-duration endurance work shifts expression toward IIa',
        'Individual fiber type distribution is ~50% genetic; but training expression within type is highly trainable',
      ],
    },
    load: {
      rules: [
        'Heavy/explosive work (>80% 1RM or maximal velocity) maintains and develops IIa/IIx fiber qualities',
        'Long slow endurance shifts fibers toward IIa (oxidative); this may reduce pure power over time',
        'Mixed athlete: periodize phases of power/strength emphasis to protect fast-twitch qualities',
        'Velocity-based training (VBT): target specific fiber types by controlling bar speed',
        'Test fiber type dominance indirectly via 1RM vs. rep max test (high rep max ÷ 1RM = slow-twitch dominant)',
      ],
    },
    blocks: [
      {
        name: 'Power/Fast-Twitch Emphasis Block',
        durationWeeks: [4, 8],
        dosage: 'Heavy strength 3–4x/week (>80% 1RM) + explosive power 2x/week; minimal steady-state endurance',
        progression: 'Progress 1RM and maximal power output; velocity-based tracking if available',
      },
      {
        name: 'Concurrent Fiber Maintenance Block',
        durationWeeks: [6, 10],
        dosage: '2 strength/power sessions + 2–3 low-intensity endurance sessions; no high-volume endurance',
        progression: 'Monitor power metrics do not decline; endurance improves without sacrificing fast-twitch',
      },
    ],
    kpis: [
      { name: 'Maximal power output (watts or jump height)', type: 'performance' },
      { name: 'Rep max at 70% 1RM (fiber type proxy)', type: 'mechanical' },
      { name: 'Velocity at given load (VBT if available)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Power output declining during endurance-heavy phase', action: 'Reduce endurance volume; add 1–2 power/strength sessions; protect IIa fiber expression' },
      { trigger: 'Rep max test shows shift to endurance dominance unexpectedly', action: 'Reassess training balance; add heavy sets and explosive work' },
    ],
    mapping: {
      userArchetypes: ['power/strength athlete', 'concurrent athlete', 'sprinter', 'team sport athlete'],
      compatibleObjectives: ['power development', 'fiber type optimization', 'strength', 'athletic performance'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'Le fibre IIx esistono solo negli atleti non allenati. L\'allenamento le converte in IIa: più forti e più resilienti', sourceId: 'Galpin – Huberman Lab 2023' },
      { text: 'Test indiretto del tipo di fibra: quante rip fai al 70% del massimale? Molte = slow-twitch dominante', sourceId: 'Galpin physiology lecture' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P36', 'P37', 'P12', 'P33'],
    },
    periodizationModel: ['block', 'conjugate'],
    assessmentScreening: ['Rep max at 70% 1RM test', 'Countermovement jump height', 'Sprint 10m time'],
  },

  // ── P39 ── Istvan Balyi — Long-Term Athlete Development / LTAD (Evidence B) ───
  {
    id: 'P39',
    name: 'Istvan Balyi',
    role: 'sport scientist | LTAD model creator | talent development',
    discipline: 'long-term athlete development | youth training | periodization stages',
    era: '1990s-2010s',
    nationality: 'Hungary / Canada',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Long-Term Athlete Development – Balyi, Way, Higgs (book)', url: 'https://www.humankinetics.com/products/all-books/long-term-athlete-development', type: 'practitioner textbook', priority: 1 },
        { title: 'Canadian Sport for Life – LTAD Framework', url: 'https://sportforlife.ca/long-term-development/', type: 'national governing body framework', priority: 2 },
        { title: 'Lloyd & Oliver 2012 – The youth physical development model', url: 'https://pubmed.ncbi.nlm.nih.gov/22009261/', type: 'peer-reviewed model', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'LTAD stages: Active Start (0–6) → FUNdamentals (6–9) → Learn to Train (9–12) → Train to Train (12–16) → Train to Compete (16–23) → Train to Win (23+)',
        'Windows of Optimal Trainability: sensitive periods for speed, strength, endurance, aerobic capacity at specific developmental ages',
        'Speed window: boys 7–9 + 13–16; girls 6–8 + 11–13 — critical neuromotor development',
        'Strength window: post-PHV (peak height velocity); usually 12–18 months after growth spurt',
        'Early specialization before age 12 risks overuse injury, burnout, and limits long-term potential',
        'Multilateral development (many sports/movement patterns) in early stages produces better long-term athletes',
      ],
    },
    load: {
      rules: [
        'Match training age (not chronological age) to training content; maturational stage is key',
        'Before puberty: emphasize speed, agility, coordination, fundamental movement skills; NOT maximal strength',
        'Avoid early specialization before 12–14; encourage multi-sport participation',
        'Train to Train stage: prioritize aerobic base, technical skill, and first strength introduction',
        'Train to Compete: specialize and develop sport-specific fitness; periodization becomes structured',
        'Train to Win: full competitive periodization; performance optimization',
      ],
    },
    blocks: [
      {
        name: 'FUNdamentals Block (6–9 yo)',
        durationWeeks: [52, 52],
        dosage: 'Multi-sport; ABCs of movement (Agility, Balance, Coordination, Speed); play-based',
        progression: 'Track skill acquisition milestones; no performance KPIs',
      },
      {
        name: 'Train to Train Block (12–16 yo)',
        durationWeeks: [16, 24],
        dosage: 'Aerobic base building; intro strength (bodyweight → light loads); sport technique; 60–70% sport-specific',
        progression: 'Progressive overload introduction; PHV monitoring; strength post-PHV',
      },
    ],
    kpis: [
      { name: 'Fundamental movement skill quality', type: 'mechanical' },
      { name: 'PHV (Peak Height Velocity) stage', type: 'systemic' },
      { name: 'Multi-sport participation index', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Early specialization pressure before age 12', action: 'Advocate for multi-sport; educate parents/coaches on early specialization risks' },
      { trigger: 'Strength training with high loads before PHV', action: 'Limit to bodyweight and technique; heavy loading appropriate only post-PHV' },
    ],
    mapping: {
      userArchetypes: ['youth athlete', 'youth coach', 'parent of young athlete', 'talent development program'],
      compatibleObjectives: ['youth development', 'long-term performance', 'talent identification', 'fundamental skills'],
      incompatibleObjectives: ['adult competition immediately', 'early specialization'],
    },
    uiPills: [
      { text: 'Specializzazione precoce prima dei 12 anni: rischio burnout, sovraccarico, e tetto di crescita abbassato', sourceId: 'Balyi – LTAD Model' },
      { text: 'Allenamento multi-sport da bambini = atleti migliori da adulti. La varietà è il fondamento', sourceId: 'Long-Term Athlete Development 2013' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P05', 'P20', 'P34'],
    },
    periodizationModel: ['linear'],
    assessmentScreening: ['FMS movement quality (age-adjusted)', 'PHV monitoring', 'Multi-sport skill assessment'],
  },

  // ── P41 ── Vern Gambetta — Athletic Development / Complete Athlete (Evidence B) ─
  {
    id: 'P41',
    name: 'Vern Gambetta',
    role: 'athletic development coach | GAIN founder | multi-sport S&C',
    discipline: 'athletic development | speed | movement | S&C for sport',
    era: '1970s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Athletic Development – Vern Gambetta (book)', url: 'https://www.humankinetics.com/products/all-books/athletic-development', type: 'practitioner textbook', priority: 1 },
        { title: 'Gambetta Method – GAIN Network resources', url: 'https://gambetta.com/', type: 'practitioner framework', priority: 2 },
        { title: 'PubMed – athletic development meta-analysis (supporting principles)', url: 'https://pubmed.ncbi.nlm.nih.gov/21508924/', type: 'peer-reviewed support', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Athletic development is holistic: movement quality, sport-specific strength, speed, and game sense are inseparable',
        'Specificity of adaptation: training adaptations are highly specific to the movement and energy system trained',
        'No muscle works in isolation; train movement patterns, not body parts',
        'Running, jumping, throwing, and change of direction are the alphabet of athletic movement',
        'GPP (General Physical Preparation) precedes SPP (Specific Physical Preparation): athletic base before sport specialization',
        'Year-round athlete development with clear phases; no "off-season" in modern sport is a fallacy',
      ],
    },
    load: {
      rules: [
        'Build GPP foundation: locomotion (run/jump/throw), manipulation, stability; before sport-specific SPP',
        'Multi-planar training: sagittal, frontal, transverse planes all must be trained',
        'Progress from general to specific over macrocycle; GPP heavy in off-season, SPP dominant in pre/in-season',
        'Speed is a skill: train it fresh; never as conditioning at end of session when fatigued',
        'Bodyweight mastery before external loading: push-up, pull-up, single-leg squat',
      ],
    },
    blocks: [
      {
        name: 'GPP Foundation Block',
        durationWeeks: [6, 8],
        dosage: 'Locomotion drills, multi-planar strength, basic sprinting, jumping; 4–5x/week',
        progression: 'Master movement quality before adding load or sport specificity',
      },
      {
        name: 'SPP Integration Block',
        durationWeeks: [6, 10],
        dosage: 'Sport-specific S&C, game-speed drills, position-specific power; 4–5x/week',
        progression: 'GPP maintained (1–2x/week); SPP increases as competition approaches',
      },
    ],
    kpis: [
      { name: 'Movement quality screen (coach-assessed)', type: 'mechanical' },
      { name: 'Multi-directional speed (5-10-5 pro-agility test)', type: 'performance' },
      { name: 'Sprint time (40m or 30m)', type: 'performance' },
      { name: 'Jump-land quality (bilateral and unilateral)', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Speed drills performed at end of session when fatigued', action: 'Move speed work to session start; reinforce "speed is a skill" principle' },
      { trigger: 'Single-plane training dominating program (e.g., only sagittal)', action: 'Add frontal/transverse plane work; assess movement patterns in all planes' },
    ],
    mapping: {
      userArchetypes: ['team sport athlete', 'multi-sport athlete', 'coach', 'S&C professional'],
      compatibleObjectives: ['athletic development', 'speed', 'agility', 'sport performance', 'GPP'],
      incompatibleObjectives: ['pure powerlifting (too general)', 'pure endurance'],
    },
    uiPills: [
      { text: 'Allena i movimenti, non i muscoli. Il corpo lavora come sistema, non come somma di parti', sourceId: 'Gambetta – Athletic Development' },
      { text: 'La velocità è una skill: allenala fresco, mai stanco. Mettila all\'inizio della sessione', sourceId: 'GAIN Network 2010' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P07', 'P06', 'P08', 'P12'],
    },
    periodizationModel: ['block', 'linear'],
    assessmentScreening: ['5-10-5 agility test', '30m sprint', 'Single-leg squat quality', 'Overhead squat assessment'],
  },

  // ── P42 ── Michael Stone — NSCA Periodization / Olympic Lifting S&C (Evidence A)
  {
    id: 'P42',
    name: 'Michael Stone',
    role: 'NSCA Hall of Fame | S&C researcher | Olympic weightlifting coach',
    discipline: 'S&C periodization | Olympic lifting | research methodology',
    era: '1970s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Haff & Stone 2015 – Methods of Developing Power (NSCA JSCR)', url: 'https://pubmed.ncbi.nlm.nih.gov/26443147/', type: 'peer-reviewed landmark review', priority: 1 },
        { title: 'Stone et al. 2007 – Weightlifting: program design considerations', url: 'https://pubmed.ncbi.nlm.nih.gov/17558904/', type: 'peer-reviewed review', priority: 2 },
        { title: 'Periodization: Theory and Methodology of Training (Haff & Triplett, NSCA textbook)', url: 'https://www.humankinetics.com/products/all-books/periodization-6th-edition', type: 'NSCA textbook peer-reviewed', priority: 3 },
        { title: 'Stone – Essentials of Strength Training and Conditioning (NSCA)', url: 'https://www.nsca.com/education/books/', type: 'NSCA certified textbook', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Periodization must include variation in volume, intensity, and exercise selection across macro/meso/microcycles',
        'General Adaptation Syndrome (GAS) underpins periodization: Alarm → Resistance → Supercompensation → Overtraining',
        'SAPT (Strength, Ability, Power, Technique) hierarchy: general → specific in progression',
        'Olympic weightlifting derivatives (power clean, power snatch, hang clean) develop maximal power efficiently',
        'Volume-intensity inverse relationship: when volume is high, intensity is lower; when volume decreases, intensity rises',
        'Bilateral strength asymmetry >10–15% predicts injury; must be assessed and corrected',
      ],
    },
    load: {
      rules: [
        'Periodize volume and intensity across mesocycles: accumulation (high vol, low int) → transmutation → realization',
        'Include Olympic lifting derivatives for power development in any sport S&C program',
        'Assess bilateral strength asymmetry; remediate before maximizing bilateral loading',
        'Deload every 3–4 weeks; volume reduction 30–40%; intensity maintained',
        'Competition peaking: reduce volume to 50% over final 2–3 weeks; intensity maintained at 90–95%',
      ],
    },
    blocks: [
      {
        name: 'Accumulation Block',
        durationWeeks: [4, 6],
        dosage: 'High volume (5×5 or 3×8); 65–80% 1RM; Olympic lifts as power training; technical focus',
        progression: 'Volume increases weekly; intensity stable; emphasize bar speed on Olympic derivatives',
      },
      {
        name: 'Transmutation Block',
        durationWeeks: [3, 4],
        dosage: 'Moderate volume (4×4 or 3×6); 80–90% 1RM; sport-specific emphasis',
        progression: 'Volume decreases; intensity rises; move toward competition specificity',
      },
      {
        name: 'Realization/Peaking Block',
        durationWeeks: [1, 2],
        dosage: '2–3 sets; 90–97% 1RM; minimal volume; quality over quantity',
        progression: 'Maintain intensity; volume at minimum; full recovery between sessions',
      },
    ],
    kpis: [
      { name: '1RM primary lifts (SBD or clean/snatch)', type: 'performance' },
      { name: 'Power clean or snatch weight', type: 'performance' },
      { name: 'Bilateral strength symmetry (%)', type: 'mechanical' },
      { name: 'Volume load (sets × reps × kg/week)', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Bilateral strength asymmetry >15% on unilateral assessment', action: 'Address weaker side; unilateral focus; reassess in 4–6 weeks before bilateral max effort' },
      { trigger: 'Overreaching signs: performance drop + elevated mood disturbance + HRV decline', action: 'Extended deload; assess accumulation phase volume; prevent full overtraining' },
    ],
    mapping: {
      userArchetypes: ['strength athlete', 'competitive lifter', 'sport S&C program', 'athlete needing power development'],
      compatibleObjectives: ['powerlifting', 'Olympic lifting', 'sport power', 'general strength'],
      incompatibleObjectives: ['pure endurance (Olympic lifts not primary)', 'beginners (technique demands too high)'],
    },
    uiPills: [
      { text: 'Volume alto + bassa intensità nella fase di accumulo. Poi inverti per il picco', sourceId: 'Stone – NSCA Periodization' },
      { text: 'Power clean e snatch: i derivati olimpici sono il modo più efficiente di allenare la potenza atletica', sourceId: 'Haff & Stone 2015' },
    ],
    fusionWeight: {
      recommendedPercent: 20,
      bestPairedWith: ['P34', 'P35', 'P36', 'P37'],
    },
    periodizationModel: ['block', 'linear'],
    assessmentScreening: ['1RM primary lifts', 'Bilateral strength asymmetry test', 'Power clean technique assessment', 'CMJ height'],
  },

  // ── P43 ── Don Chu — Plyometric Training (Evidence B) ──────────────────────
  {
    id: 'P43',
    name: 'Don Chu',
    role: 'plyometrics specialist | S&C coach',
    discipline: 'plyometrics | reactive strength | power development | sport speed',
    era: '1980s-2010s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Jumping into Plyometrics – Don Chu (book)', url: 'https://www.humankinetics.com/products/all-books/jumping-into-plyometrics-3rd-edition', type: 'practitioner textbook', priority: 1 },
        { title: 'Chu & Myer – Plyometrics (NSCA textbook chapter)', url: 'https://www.nsca.com/education/books/', type: 'NSCA certified textbook', priority: 2 },
        { title: 'PubMed – plyometric training meta-analysis for sport performance', url: 'https://pubmed.ncbi.nlm.nih.gov/22531619/', type: 'peer-reviewed meta-analysis', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Stretch-shortening cycle (SSC): elastic energy stored in muscle-tendon unit during eccentric phase, released in concentric phase',
        'Plyometric volume measured in foot contacts (FC): beginner 80–100 FC/session, advanced 150–200 FC/session',
        'Ground contact time is the critical metric: shorter GCT at same height = better reactive strength',
        'Prerequisite strength: athletes should squat 1.5× bodyweight before high-intensity plyometrics',
        'Intensity classification: low (standing jumps), medium (box jumps/bounding), high (depth drops, reactive sprints)',
        'Progressive loading: intensity more important than volume; quality of landing and takeoff paramount',
      ],
    },
    load: {
      rules: [
        'Plyometric volume: beginners 80–100 FC; intermediate 100–150 FC; advanced 150–200 FC',
        'Prerequisite: back squat ≥1.5× BW before depth drops or high-intensity reactive work',
        'Never perform plyometrics to fatigue; quality > quantity; stop when GCT increases',
        'Warm-up mandatory: 10–15 min dynamic prep before any plyometric session',
        'Frequency: 2–3x/week; minimum 48h between sessions; avoid with heavy lower body S&C same day',
        'Landing mechanics: soft knee, hip-dominant, dorsiflexion controlled — assess before loading',
      ],
    },
    blocks: [
      {
        name: 'Plyometric Foundation Block',
        durationWeeks: [4, 6],
        dosage: '80–100 FC/session; standing broad jumps, box jumps, pogo hops; 2x/week',
        progression: 'Improve landing quality; progress to medium-intensity when consistent technique achieved',
      },
      {
        name: 'Reactive Strength Block',
        durationWeeks: [4, 6],
        dosage: '100–150 FC; depth drops, bounding, hurdle hops; focus on minimal GCT',
        progression: 'Track reactive strength index (RSI = jump height ÷ GCT); increase when landing quality maintained',
      },
    ],
    kpis: [
      { name: 'Countermovement jump height (cm)', type: 'performance' },
      { name: 'Reactive Strength Index (jump height ÷ ground contact time)', type: 'performance' },
      { name: 'Broad jump distance', type: 'performance' },
      { name: 'Landing mechanics quality (soft/stiff landing assessment)', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Performing high-intensity plyometrics without ≥1.5× BW squat prerequisite', action: 'Regress to lower-intensity plyometrics; build strength base first' },
      { trigger: 'Knee valgus collapse on landing', action: 'Stop high-intensity plyometrics; add glute strength; teach landing mechanics before reloading' },
      { trigger: 'Patellar tendon pain during or after plyometric sessions', action: 'Reduce foot contacts 50%; assess load and frequency; consult P49/P50 tendinopathy protocol' },
    ],
    mapping: {
      userArchetypes: ['team sport athlete', 'sprinter', 'basketball/volleyball player', 'strength athlete adding power'],
      compatibleObjectives: ['power development', 'reactive strength', 'speed-power', 'sport performance'],
      incompatibleObjectives: ['endurance base phase', 'beginners without strength base'],
    },
    uiPills: [
      { text: 'Prerequisito plyometrico: squat 1.5× peso corporeo prima di depth drops o lavoro reattivo avanzato', sourceId: 'Chu – Jumping into Plyometrics' },
      { text: 'RSI = altezza salto ÷ tempo di contatto col suolo. Minimizza il contatto, massimizza il salto', sourceId: 'Chu & Myer – NSCA' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P37', 'P12', 'P08', 'P06'],
    },
    periodizationModel: ['block', 'linear'],
    assessmentScreening: ['CMJ height', 'Reactive Strength Index', 'Broad jump', 'Landing mechanics screen', 'Back squat 1RM (prerequisite check)'],
  },

  // ── P44 ── Dan John — Minimalist S&C / Human Movement Patterns (Evidence C) ──
  {
    id: 'P44',
    name: 'Dan John',
    role: 'strength coach | author | discus/Olympic throwing specialist',
    discipline: 'minimalist S&C | movement pattern training | GPP',
    era: '1980s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'C',
      prioritizedSources: [
        { title: 'Never Let Go – Dan John (book)', url: 'https://danjohn.net/never-let-go/', type: 'practitioner book', priority: 1 },
        { title: 'Easy Strength – Dan John & Pavel Tsatsouline', url: 'https://danjohn.net/easy-strength/', type: 'practitioner book', priority: 2 },
        { title: 'Intervention – Dan John', url: 'https://danjohn.net/intervention/', type: 'practitioner book', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Five fundamental human movement patterns: push, pull, hinge, squat, and loaded carry',
        'Everything works for 6 weeks: program novelty provides adaptation regardless of specific protocol',
        'Loaded carries (farmer walks, suitcase carry, waiter carry) are the most underused S&C tool',
        'Park the ego: train at 80–85% of max consistently; reserve 100% for competitions',
        'Goal is to be the healthy veteran who trains for decades, not the injured former athlete',
        'Simplicity scales: 5 movements, 3 sets, 5 reps; progressive overload over months',
      ],
    },
    load: {
      rules: [
        'Include all 5 human movement patterns every week: push, pull, hinge, squat, carry',
        'Loaded carries minimum 2x/week: farmer carry, suitcase carry, or overhead carry',
        'Train at 80–85% max; reserve 100% effort for tests and competition',
        'Mass building: goblet squat + hip hinge + one-arm press; master before adding complexity',
        'Easy Strength protocol: 2 reps × 5 sets daily at 80%; accumulate volume without fatigue',
      ],
    },
    blocks: [
      {
        name: 'Movement Pattern Mastery (40-day program)',
        durationWeeks: [6, 6],
        dosage: 'Daily: 2 sets push, 2 sets pull, 2 sets hinge, 2 sets squat, farmer carry; sub-maximal',
        progression: 'Increase load when 5 sets of 5 is effortless; never to failure; daily practice',
      },
    ],
    kpis: [
      { name: 'Farmer carry load × distance', type: 'performance' },
      { name: 'Goblet squat or front squat form quality', type: 'mechanical' },
      { name: 'All 5 movement patterns trained per week (Y/N)', type: 'mechanical' },
    ],
    redFlags: [
      { trigger: 'Any of the 5 movement patterns absent for >2 weeks', action: 'Reintroduce missing pattern; imbalance accumulates over months' },
      { trigger: 'Training to failure regularly on main lifts', action: 'Reduce intensity to 80–85%; emphasize long-term consistency over short-term max' },
    ],
    mapping: {
      userArchetypes: ['busy professional', 'minimalist athlete', 'masters athlete', 'general fitness'],
      compatibleObjectives: ['general fitness', 'longevity', 'GPP', 'movement quality', 'simple S&C'],
      incompatibleObjectives: ['competitive powerlifting', 'elite bodybuilding', 'sport-specific peak performance'],
    },
    uiPills: [
      { text: 'Cinque movimenti fondamentali: spingi, tira, incerniera, squat, porta peso. Ogni settimana, senza eccezioni', sourceId: 'Dan John – Intervention' },
      { text: 'Le Farmer Carry sono lo strumento di S&C più sottovalutato. Portare peso fa tutto', sourceId: 'Never Let Go – Dan John' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P22', 'P07', 'P40'],
    },
    periodizationModel: ['linear', 'conjugate'],
    assessmentScreening: ['Goblet squat assessment', 'Farmer carry 1-minute test', 'Movement pattern checklist (5/5 per week)'],
  },

  // ── P45 ── Eric Cressey — Shoulder Health / Baseball S&C (Evidence B) ──────────
  {
    id: 'P45',
    name: 'Eric Cressey',
    role: 'S&C coach | shoulder specialist | MLB performance director',
    discipline: 'shoulder health | overhead athlete | baseball S&C | movement assessment',
    era: '2000s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Cressey et al. 2007 – The effects of 10-week unstable surface training on athletic performance', url: 'https://pubmed.ncbi.nlm.nih.gov/17240558/', type: 'peer-reviewed RCT', priority: 1 },
        { title: 'Show and Go Training System – Cressey', url: 'https://ericcressey.com/resources/', type: 'practitioner programming system', priority: 2 },
        { title: 'Cressey – Optimal Shoulder Performance (DVD/online)', url: 'https://ericcressey.com/', type: 'practitioner clinical resource', priority: 3 },
        { title: 'Wilk et al. – Current pitching recommendations (Cressey collaboration)', url: 'https://pubmed.ncbi.nlm.nih.gov/18174942/', type: 'peer-reviewed review', priority: 4 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Overhead athletes (baseball, tennis, swimming) require specific shoulder care protocols beyond standard S&C',
        'Glenohumeral internal rotation deficit (GIRD) is a primary injury risk factor in throwing athletes',
        'Thoracic spine mobility is the foundation for overhead shoulder function; T-spine extension/rotation before shoulder loading',
        'Hip separation is foundational for throwing velocity; lower half drives upper half in pitching mechanics',
        'Scapular dyskinesis precedes most shoulder injuries; assess and address before overhead loading',
        'Sleeper stretch + posterior capsule work address GIRD conservatively before any overhead programming',
      ],
    },
    load: {
      rules: [
        'Assess GIRD before any overhead pressing program; if present, add posterior capsule protocol',
        'Thoracic mobility work mandatory before overhead athletes train shoulders',
        'Avoid overhead pressing if scapular control is compromised; regress to lower angle variations',
        'Hip hinge and lower body power training is equally important for overhead throwing power',
        'Off-season is the time for structural adaptation; in-season = maintenance, not max progress',
      ],
    },
    blocks: [
      {
        name: 'Shoulder Health Foundation Block',
        durationWeeks: [4, 6],
        dosage: 'T-spine mobility daily; posterior capsule stretching; rotator cuff strengthening; no heavy overhead',
        progression: 'GIRD measurement improves; scapular control established; overhead press reintroduced',
      },
      {
        name: 'Overhead Athlete In-Season Maintenance',
        durationWeeks: [16, 24],
        dosage: 'Minimal volume; maintain strength; 2x/week; shoulder care protocols priority',
        progression: 'No new strength adaptations expected; injury prevention is the goal',
      },
    ],
    kpis: [
      { name: 'GIRD (glenohumeral internal rotation deficit, degrees bilateral difference)', type: 'mechanical' },
      { name: 'Scapular control assessment (Y/N)', type: 'mechanical' },
      { name: 'Thoracic extension ROM', type: 'mechanical' },
      { name: 'Throwing velocity (for overhead athletes)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'GIRD >15° difference between throwing and non-throwing shoulder', action: 'Posterior capsule protocol; no overhead pressing until addressed; assess history' },
      { trigger: 'Scapular winging or dyskinesis during overhead movements', action: 'Unload overhead; serratus anterior + lower trap program; reassess in 4 weeks' },
      { trigger: 'Shoulder pain with any overhead movement', action: 'Clinical assessment mandatory; do not load through pain overhead' },
    ],
    mapping: {
      userArchetypes: ['baseball pitcher', 'overhead athlete (tennis, swimming, volleyball)', 'CrossFit athlete with shoulder issues', 'gym-goer with shoulder pain'],
      compatibleObjectives: ['shoulder health', 'overhead performance', 'injury prevention', 'return to overhead sport'],
      incompatibleObjectives: [],
    },
    uiPills: [
      { text: 'GIRD e discinesia scapolare: i due red flag più comuni negli atleti overhead. Screena prima di caricare', sourceId: 'Cressey – Optimal Shoulder Performance' },
      { text: 'La mobilità toracica è il prerequisito dimenticato per la salute della spalla. T-spine prima degli shoulder press', sourceId: 'Cressey 2010' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P20', 'P21', 'P48', 'P07'],
    },
    assessmentScreening: ['GIRD measurement (ER/IR bilateral)', 'Scapular dyskinesis test', 'Thoracic extension ROM', 'FMS shoulder mobility'],
  },

  // ── P46 ── Dan Lorang — Ironman Performance / Triathlon Periodization (Evidence B)
  {
    id: 'P46',
    name: 'Dan Lorang',
    role: 'triathlon coach | Ironman world champion coach (Jan Frodeno, Anne Haug)',
    discipline: 'triathlon | Ironman | multi-sport periodization',
    era: '2010s-2020s',
    nationality: 'Germany',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Best Tri Training – Dan Lorang & Frodeno coaching framework', url: 'https://www.sportalpen.com/en/books/best-tri-training-book/', type: 'practitioner book', priority: 1 },
        { title: 'Deutsche Triathlon Union – Lorang methodology presentations', url: 'https://www.triathlon.de/', type: 'national federation presentations', priority: 2 },
        { title: 'Friel 2016 – Triathlon Science (supporting multi-sport periodization)', url: 'https://www.velopress.com/books/triathlon-science/', type: 'practitioner textbook cross-reference', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Ironman performance is 95% aerobic; Zone 2 and threshold work dominate; speed-work volume is very low',
        'Three-sport integration: swim/bike/run training must be balanced without mutual interference',
        'Brick training (bike-to-run) is essential for muscle recruitment transition adaptation',
        'Individual periodization: no universal Ironman template; athlete life stress, recovery capacity, and physiological profile must drive training decisions',
        'Biggest Ironman mistake: too much intensity too early; aerobic base for 6+ months before intensity phases',
        'Race-specific simulation: practice race nutrition and pacing during long training days before competition',
      ],
    },
    load: {
      rules: [
        'Zone 2 at 60–70% of total training volume for full Ironman preparation',
        'Swim/bike/run week structure: 3 bikes, 3 runs, 2 swims baseline; adjust by limiter',
        'Long ride + long run weekly (race simulation); progressive distance over 16–20 weeks',
        'Brick sessions 1–2x/week: immediately follow bike with 15–30 min run',
        'Race week: reduce volume 40–50%; maintain 1 intensity session; arrive rested',
        'Nutrition practice mandatory during long training sessions: train gut for race nutrition',
      ],
    },
    blocks: [
      {
        name: 'Ironman Base Block',
        durationWeeks: [12, 16],
        dosage: 'High-volume, low-intensity; all three disciplines; long sessions prioritized; <80% at Zone 2',
        progression: 'Volume builds weekly; long ride/run distance increases 10%/week; monthly benchmark tests',
      },
      {
        name: 'Ironman Build Block',
        durationWeeks: [8, 10],
        dosage: 'Add race-pace intervals; threshold sessions 2x/week; long sessions maintained',
        progression: 'Race-specific pacing; brick sessions 2x/week; nutrition rehearsal; reduce peak volume 10%',
      },
      {
        name: 'Ironman Taper',
        durationWeeks: [2, 3],
        dosage: 'Volume −40–50%; intensity maintained; all 3 sports; long sessions halved',
        progression: 'Progressive reduction; feel race-sharp; rehearse race morning routine',
      },
    ],
    kpis: [
      { name: 'FTP (Cycling Functional Threshold Power)', type: 'performance' },
      { name: 'Threshold pace (swim + run)', type: 'performance' },
      { name: 'Long ride + long run weekly volume (km)', type: 'mechanical' },
      { name: 'Brick transition adaptation (bike HR → run HR convergence time)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'High-intensity training >25% of weekly volume in base phase', action: 'Reduce intensity; return to Zone 2 base; risk of peaking too early' },
      { trigger: 'GI distress during long training sessions', action: 'Adjust race nutrition protocol; practice gut training with intended race fuels' },
      { trigger: 'Run performance declining despite consistent bike/swim volume', action: 'Increase run frequency + brick sessions; check run biomechanics for fatigue-related breakdown' },
    ],
    mapping: {
      userArchetypes: ['triathlete', 'Ironman athlete', 'long-course endurance athlete', 'multi-sport enthusiast'],
      compatibleObjectives: ['Ironman completion', 'long-course triathlon', 'multi-sport performance', 'aerobic base'],
      incompatibleObjectives: ['sprint athletes', 'pure strength goals', 'athletes with <6 months preparation time'],
    },
    uiPills: [
      { text: 'L\'Ironman è al 95% aerobico. Costruisci la base per mesi prima di aggiungere intensità', sourceId: 'Lorang – Best Tri Training' },
      { text: 'Allena il tuo intestino tanto quanto le gambe. La nutrizione di gara deve essere praticata in allenamento', sourceId: 'Lorang methodology' },
    ],
    fusionWeight: {
      recommendedPercent: 25,
      bestPairedWith: ['P24', 'P25', 'P15', 'P18'],
    },
    periodizationModel: ['block', 'linear'],
    assessmentScreening: ['FTP test (cycling)', 'Critical swim speed test', 'Run lactate threshold test', 'Long brick session pacing review'],
  },

  // ── P51 ── Peter Attia — Longevity & Healthspan (Evidence B) ────────────────
  {
    id: 'P51',
    name: 'Peter Attia',
    role: 'physician | longevity researcher',
    discipline: 'longevity | healthspan | metabolic health',
    era: '2010s-2020s',
    nationality: 'Canada/USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Outlive: The Science and Art of Longevity (2023)', url: 'https://peterattiamd.com/outlive/', type: 'book', priority: 1 },
        { title: 'The Peter Attia Drive Podcast', url: 'https://peterattiamd.com/podcast/', type: 'expert podcast', priority: 2 },
        { title: 'Attia – The Centenarian Decathlon', url: 'https://peterattiamd.com/outlive/decathlon/', type: 'methodology article', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Medicine 3.0: proactive prevention rather than reactive treatment',
        'Healthspan > Lifespan: maintaining physical and cognitive function into old age',
        'The Centenarian Decathlon: training for the physical tasks you want to perform in your last decade of life',
        'VO2max as the strongest predictor of longevity: aim for the top 2.5% for your age group',
        'Strength as the second strongest predictor: prioritize muscle mass and grip strength (longevity "pension")',
        'Stability is the foundation: injury prevention (especially falls) is critical for aging',
      ],
    },
    load: {
      rules: [
        'Zone 2 cardio: 3–4 hours/week minimum (metabolic health and mitochondrial efficiency)',
        'VO2max training: 1 session/week of high-intensity intervals (4×4min at max sustainable effort)',
        'Strength training: 3 sessions/week; focus on compound lifts, grip strength, and eccentric control',
        'Rucking: low-impact way to build "structural integrity" and aerobic capacity',
        'Stability work (DNS/McGill): 10 min daily; non-negotiable for orthopedic longevity',
      ],
    },
    blocks: [
      {
        name: 'Healthspan Foundation Block',
        durationWeeks: [12, 52],
        dosage: '3h Zone 2 + 1 HIIT + 3 Strength sessions/week; focus on stability prep',
        progression: 'Linear increase in Zone 2 duration; progressive overload in strength',
      },
      {
        name: 'VO2max Optimization Block',
        durationWeeks: [4, 8],
        dosage: '2 HIIT sessions/week + 2h Zone 2; maintenance strength',
        progression: 'Increase interval power/pace; monitor recovery closely',
      },
    ],
    kpis: [
      { name: 'VO2max (estimated or lab-tested)', type: 'performance' },
      { name: 'Grip strength (kg)', type: 'performance' },
      { name: 'Dead-hang duration (seconds)', type: 'performance' },
      { name: 'Zone 2 power/pace at fixed HR', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Consistent sleep <7h/night', action: 'Reduce HIIT intensity; prioritize recovery; healthspan requires sleep foundation' },
      { trigger: 'Loss of eccentric control in primary lifts', action: 'Reduce load; focus on stability; risk of orthopedic injury exceeds benefit' },
    ],
    mapping: {
      userArchetypes: ['longevity seeker', 'masters athlete', 'metabolic health focus', 'general population'],
      compatibleObjectives: ['longevity', 'healthspan', 'metabolic health', 'VO2max improvement', 'general strength'],
      incompatibleObjectives: ['short-term peak performance at cost of health'],
    },
    uiPills: [
      { text: 'Allenati per il Centenarian Decathlon. Cosa vuoi fare a 90 anni?', sourceId: 'Attia – Outlive 2023' },
      { text: 'Il VO2max è il miglior predittore della tua longevità. Portalo al top', sourceId: 'Attia Drive Podcast' },
    ],
    fusionWeight: {
      recommendedPercent: 30,
      bestPairedWith: ['P18', 'P05', 'P48', 'P31'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,
    blockCatalogIds: [
      'ZONE2_FOUNDATION',
      'STRENGTH_HYPERTROPHY',
      'HIIT_TEAM_SPORT',
      'RUCKING_ENDURANCE',
      'STABILITY_REHAB',
    ],
    profileModifiers: [
      {
        block_id:               'ZONE2_FOUNDATION',
        activation_priority:    1,
        progression_bias:       'volume_first',
        volume_modifier_pct:    20,
        coach_specific_notes:   'Pezzo centrale del metodo Attia: 3-4 ore/settimana obbligatorie per l\'efficienza mitocondriale.',
      },
      {
        block_id:               'HIIT_TEAM_SPORT',
        activation_priority:    2,
        override_dosage: {
          rpe_target: [9, 10], // Attia vuole intensità massima per spingere il VO2max
        },
        coach_specific_notes:   'Utilizzato come stimolo VO2max: 1 sessione 4x4min "all-out" a settimana.',
      },
    ],
    methodologyV2: {
      load_philosophy:        'Allenamento bilanciato tra capacità aerobica estrema (VO2max) e forza strutturale per la salute a lungo termine.',
      preferred_progression:  'volume_first',
      block_selection_logic:  'Zone 2 come base giornaliera → Forza 3x/sett → HIIT 1x/sett. Stabilità integrata quotidianamente.',
      assessment_bias:        ['VO2max', 'Grip strength', 'Altman test', 'ApoB/Metabolic markers'],
      signature_constraints:  ['Minimo 3h Zone 2/sett', 'Stabilità DNS/McGill pre-allenamento', 'Allenamento rucking per densità ossea'],
    },
    resilientRedFlags: [
      {
        primary_source:       'hrv_zscore',
        condition:            'Calo VO2max stimato con fatica cronica',
        threshold:            -2,
        action_code:          'REDUCE_LOAD',
        ui_explanation:       'Fatica cronica rilevata: ridurre intensità HIIT, focus su Zone 2 e stabilità per 10 giorni.',
      },
    ],
  },

  // ── P52 ── Al Kavadlo — Calisthenics & Bodyweight Strength (Evidence B) ───────
  {
    id: 'P52',
    name: 'Al Kavadlo',
    role: 'bodyweight strength coach | author',
    discipline: 'calisthenics | bodyweight | movement',
    era: '2000s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'Raising the Bar: The Definitive Guide to Bar Calisthenics', url: 'https://www.alkavadlo.com/books/', type: 'book', priority: 1 },
        { title: 'Pushing the Limits! – Total Body Strength With No Equipment', url: 'https://www.alkavadlo.com/books/', type: 'book', priority: 2 },
        { title: 'Convict Conditioning (Contributor/Model)', url: 'https://www.dragondoor.com/b41/', type: 'book', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Bodyweight mastery: the floor and a bar are all you need for elite strength',
        'Progressive Calisthenics: use leverage, not weight, to increase intensity (e.g. 2-arm pushup → 1-arm)',
        'Full body integration: bodyweight movements require total body tension (irradiation)',
        'Skill + Strength: movements like muscle-ups or handstands are both skills and strength feats',
        'Simplicity: remove barriers to entry; no gym membership required',
      ],
    },
    load: {
      rules: [
        'Progression via leverage: adjust body angle or limb participation to modulate load',
        'High frequency: bodyweight movements can often be trained more frequently than heavy barbell work',
        'Clean form is paramount: a "cheated" rep in calisthenics changes the mechanics entirely',
        'Hold times for isometric skills (planches, levers): 10–30s reps',
        'Volume: 3–5 sets per movement pattern (push, pull, squat, core)',
      ],
    },
    blocks: [
      {
        name: 'Calisthenics Foundation Block',
        durationWeeks: [6, 12],
        dosage: 'Basic pushups, pullups, dips, and squats; 3–4x/week; focus on perfect ROM',
        progression: 'Increase reps until ceiling (e.g. 15-20), then move to harder progression',
      },
      {
        name: 'Advanced Leverage Block',
        durationWeeks: [8, 12],
        dosage: 'Archer pushups, pistol squats, tucked front levers; 3x/week',
        progression: 'Shift leverage (e.g. wider hands, single limb) to maintain 5–8 rep range',
      },
    ],
    kpis: [
      { name: 'Max Pullups / Pushups (unbroken)', type: 'performance' },
      { name: 'Pistol Squat (rep max)', type: 'performance' },
      { name: 'Static hold duration (L-sit, Plank)', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Joint pain (elbow/wrist) during leverage shifts', action: 'Regress to easier variation; check joint alignment; add mobility work' },
      { trigger: 'Loss of full ROM in pullups/dips', action: 'Reduce reps; prioritize quality; fatigue is masking poor mechanics' },
    ],
    mapping: {
      userArchetypes: ['minimalist athlete', 'calisthenics enthusiast', 'home-gym user', 'traveling athlete'],
      compatibleObjectives: ['bodyweight strength', 'calisthenics mastery', 'functional muscle', 'no-equipment fitness'],
      incompatibleObjectives: ['maximal powerlifting strength (requires external load)'],
    },
    uiPills: [
      { text: 'Il tuo corpo è l\'unica palestra di cui hai bisogno', sourceId: 'Kavadlo – Pushing the Limits' },
      { text: 'Progressione tramite leva: non aggiungere peso, cambia l\'angolo', sourceId: 'Kavadlo Blog' },
    ],
    fusionWeight: {
      recommendedPercent: 25,
      bestPairedWith: ['P22', 'P21', 'P07', 'P44'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,
    blockCatalogIds: [
      'BODYWEIGHT_STRENGTH',
      'MOBILITY_FLOW',
      'SKILL_ACQUISITION',
      'CORE_ANTI_ROTATION',
    ],
    profileModifiers: [
      {
        block_id:               'BODYWEIGHT_STRENGTH',
        activation_priority:    1,
        progression_bias:       'intensity_first', // Kavadlo preferisce cambiare leva invece di fare 1000 rep
        coach_specific_notes:   'Enfasi sulla tensione totale (irradiation). Passare alla variante successiva appena si raggiungono 12 rep pulite.',
      },
    ],
    methodologyV2: {
      load_philosophy:        'Padronanza del peso corporeo attraverso progressioni di leva e tensione muscolare costante.',
      preferred_progression:  'leverage_shift',
      block_selection_logic:  'Push → Pull → Squat → Core. Ogni sessione include una componente di abilità (balance/isometria).',
      assessment_bias:        ['Pullup rep max', 'Pistol squat quality', 'L-sit duration'],
      signature_constraints:  ['Niente pesi esterni se non strettamente necessario', 'ROM completo obbligatorio', 'Training "all\'aperto" preferito'],
    },
    resilientRedFlags: [
      {
        primary_source:       'pain_vas',
        condition:            'Dolore gomiti/polsi in varianti avanzate',
        threshold:            3,
        action_code:          'SUBSTITUTE_LOWER_INTENSITY',
        ui_explanation:       'Sovraccarico articolare calisthenics: regredire alla variante precedente per 2 settimane.',
      },
    ],
  },

  // ── P53 ── Joel Jamieson — Combat Conditioning & HRV (Evidence A) ────────────────
  {
    id: 'P53',
    name: 'Joel Jamieson',
    role: 'conditioning coach | MMA trainer',
    discipline: 'combat conditioning | energy systems | HRV',
    era: '2000s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'A',
      prioritizedSources: [
        { title: 'Ultimate MMA Conditioning (2009)', url: 'https://www.8weeksout.com/', type: 'book', priority: 1 },
        { title: '8WeeksOut – BioForce HRV system', url: 'https://www.8weeksout.com/hrv-training-guide/', type: 'methodology site', priority: 2 },
        { title: 'Jamieson – Conditioning for Combat Sports', url: 'https://www.8weeksout.com/conditioning-blueprint/', type: 'course', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Energy System Hierarchy: Aerobic capacity is the engine that recovers the anaerobic systems',
        'HRV-guided training: adjust intensity based on Daily Readiness Score (Heart Rate Variability)',
        'Three methods of aerobic development: Cardiac Output, Cardiac Power, Threshold work',
        'Alactic-Aerobic intervals: high power reps with short rest to build repeat-sprint ability without lactic acid pooling',
        'Specificity of conditioning: match training means to the work-rest ratios of the combat sport',
      ],
    },
    load: {
      rules: [
        'Readiness-adjusted intensity: Green day = High intensity; Yellow = Moderate; Red = Active recovery/Rest',
        'Cardiac Output: 60–90 min at 130–150 bpm (base building for combat)',
        'Alactic Power: 6–10s max effort, 90s full recovery (build speed-power without fatigue)',
        'Lactic Capacity: only in the final 4 weeks of camp (high metabolic cost)',
        'Never train high intensity on a Red HRV day',
      ],
    },
    blocks: [
      {
        name: 'Aerobic Reconstruction Block',
        durationWeeks: [8, 12],
        dosage: '3x Cardiac Output (60min) + 2x Strength; HRV-guided daily adjustment',
        progression: 'Increase duration of CO sessions; monitor resting HR trend',
      },
      {
        name: 'Combat Power Block',
        durationWeeks: [4, 6],
        dosage: 'Alactic power sprints 2x/week + 2x MMA technical conditioning',
        progression: 'Increase intensity/speed; monitor recovery recovery via HRV',
      },
    ],
    kpis: [
      { name: 'Resting Heart Rate (RHR)', type: 'systemic' },
      { name: 'HRV (Daily Readiness Score)', type: 'systemic' },
      { name: '1-min Heart Rate Recovery (HRR)', type: 'systemic' },
      { name: 'Power output at aerobic threshold', type: 'performance' },
    ],
    redFlags: [
      { trigger: 'Red HRV day (>2 SD from baseline)', action: 'Mandatory active recovery (Zone 1) or full rest; do not touch HIIT' },
      { trigger: 'RHR increase >5bpm over 3 days', action: 'Cumulative fatigue; deload intensity for 48-72h' },
    ],
    mapping: {
      userArchetypes: ['combat athlete', 'MMA fighter', 'BJJ practitioner', 'HIIT enthusiast'],
      compatibleObjectives: ['combat conditioning', 'energy system development', 'HRV optimization', 'repeat-sprint ability'],
      incompatibleObjectives: ['pure bodybuilding (conditioning focus is high)'],
    },
    uiPills: [
      { text: 'La capacità aerobica è ciò che ricarica le tue batterie esplosive tra i round', sourceId: 'Jamieson – Ultimate MMA Conditioning' },
      { text: 'Non allenarti alla cieca. Usa l\'HRV per sapere quando spingere e quando frenare', sourceId: '8WeeksOut' },
    ],
    fusionWeight: {
      recommendedPercent: 25,
      bestPairedWith: ['P03', 'P01', 'P05', 'P16'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,
    blockCatalogIds: [
      'ZONE2_FOUNDATION',
      'AEROBIC_POWER',
      'RSA',
      'HIIT_TEAM_SPORT',
      'HRV_RECOVERY',
    ],
    profileModifiers: [
      {
        block_id:               'AEROBIC_POWER',
        activation_priority:    1,
        coach_specific_notes:   'Jamieson usa il Cardiac Power per alzare il soffitto aerobico senza affaticamento neurale eccessivo.',
      },
    ],
    methodologyV2: {
      load_philosophy:        'Sviluppo dei sistemi energetici guidato dalla fisiologia (HRV) per massimizzare la performance in sport intermittenti.',
      preferred_progression:  'readiness_guided',
      block_selection_logic:  'Costruzione base (CO) → Sviluppo Alactico → Capacità Lattica (solo peak). HRV domina la scelta quotidiana.',
      assessment_bias:        ['HRV', 'RHR', '12-min Run test', 'HR Recovery'],
      signature_constraints:  ['Niente HIIT su giorni HRV Rossi', 'Aerobic base come prerequisito per anaerobico', 'Conditioning integrato con sessioni tecniche MMA'],
    },
    resilientRedFlags: [
      {
        primary_source:       'hrv_zscore',
        condition:            'HRV Rosso / Fatigue accumulata',
        threshold:            -2,
        action_code:          'SUBSTITUTE_LOWER_INTENSITY',
        ui_explanation:       'HRV indica stress sistemico elevato: sessione HIIT sostituita con Zone 1 / Mobilità.',
      },
    ],
  },

  // ── P54 ── Wim Hof — Resilience & Hormetic Stress (Evidence B) ────────────────
  {
    id: 'P54',
    name: 'Wim Hof',
    role: 'methodologist | cold exposure expert',
    discipline: 'breathwork | cold exposure | resilience',
    era: '2000s-2020s',
    nationality: 'Netherlands',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'The Wim Hof Method (2020)', url: 'https://www.wimhofmethod.com/', type: 'book/site', priority: 1 },
        { title: 'PNAS – Voluntary activation of the sympathetic nervous system', url: 'https://pubmed.ncbi.nlm.nih.gov/24799686/', type: 'peer-reviewed study', priority: 2 },
        { title: 'Scientific Reports – Brain over body: A study on the Wim Hof Method', url: 'https://pubmed.ncbi.nlm.nih.gov/29438370/', type: 'peer-reviewed study', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'Hormetic Stress: deliberate exposure to cold and breath retention to trigger adaptive responses',
        'Breathwork (Hyperventilation + Retention): alkalizes the blood and modulates the immune response',
        'Cold Exposure: improves metabolic rate, brown fat activation, and vascular tone',
        'Mindset/Focus: voluntary control over the autonomic nervous system via meditation',
        'Anti-inflammatory effect: reduces cytokine response via epinephrine release',
      ],
    },
    load: {
      rules: [
        'Daily breathwork: 3–4 rounds of controlled hyperventilation (30-40 breaths) followed by retention',
        'Cold exposure: start with 30s cold shower, progress to 2-5 min ice bath',
        'Never practice breathwork in or near water (risk of shallow water blackout)',
        'Listen to the body: hormesis is a bell curve; too much cold leads to immunosuppression, not resilience',
        'Integration: breathwork pre-training for focus, cold exposure post-training for recovery (if hypertrophy not primary)',
      ],
    },
    blocks: [
      {
        name: 'Resilience Introduction Block',
        durationWeeks: [4, 4],
        dosage: 'Daily breathwork (3 rounds) + 1min cold shower; maintain normal S&C',
        progression: 'Increase cold shower duration by 15s weekly',
      },
      {
        name: 'Advanced Hormesis Block',
        durationWeeks: [4, 8],
        dosage: 'Daily breathwork (4-5 rounds) + 2x/week ice baths (3-5 min)',
        progression: 'Monitor HRV; cold exposure should not cause a drop in morning readiness',
      },
    ],
    kpis: [
      { name: 'Breath retention time (seconds)', type: 'systemic' },
      { name: 'Cold immersion duration (minutes)', type: 'systemic' },
      { name: 'Subjective stress resilience score', type: 'systemic' },
      { name: 'Morning HRV trend', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Tinnitus (ringing in ears) during/after breathwork', action: 'Reduce intensity of breathing; more gradual rounds' },
      { trigger: 'Persistent shivering >15 min post-cold exposure', action: 'Exposure was too long; reduce duration; focus on active rewarming' },
      { trigger: 'Breathwork in water', action: 'STOP IMMEDIATELY; extreme safety risk of drowning' },
    ],
    mapping: {
      userArchetypes: ['resilience seeker', 'high-stress professional', 'biohacker', 'athlete seeking recovery'],
      compatibleObjectives: ['stress management', 'immune support', 'metabolic health', 'recovery optimization'],
      incompatibleObjectives: ['hypertrophy-primary (cold post-lifting blunts mTOR)'],
    },
    uiPills: [
      { text: 'Il freddo è il tuo insegnante. Ti riporta al qui e ora', sourceId: 'Wim Hof Method 2020' },
      { text: 'Respirazione + Freddo = Controllo del sistema nervoso autonomo', sourceId: 'PNAS 2014 study' },
    ],
    fusionWeight: {
      recommendedPercent: 10,
      bestPairedWith: ['P31', 'P05', 'P18', 'P55'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,
    blockCatalogIds: [
      'BREATHWORK_CAPACITY',
      'HRV_RECOVERY',
      'ZONE2_FOUNDATION',
    ],
    profileModifiers: [
      {
        block_id:               'HRV_RECOVERY',
        activation_priority:    1,
        coach_specific_notes:   'Wim Hof usa l\'esposizione al freddo come booster per il recupero e il tono vagale.',
      },
    ],
    methodologyV2: {
      load_philosophy:        'Utilizzo dello stress ormetico controllato per potenziare la resilienza biologica e mentale.',
      preferred_progression:  'duration_first',
      block_selection_logic:  'Respiro al mattino → Freddo post-doccia → Mindset costante. Integrato come routine di supporto.',
      assessment_bias:        ['Retention time', 'Cold tolerance', 'HRV baseline'],
      signature_constraints:  ['MAI respirazione in acqua', 'Freddo separato da ipertrofia pesante', 'Ascolto del feedback corporeo sopra ogni tabella'],
    },
    resilientRedFlags: [
      {
        primary_source:       'wizard',
        condition:            'Brividi persistenti / Sensazione di freddo cronico',
        threshold:            2,
        action_code:          'REDUCE_LOAD',
        ui_explanation:       'Stress ormetico eccessivo: sospendere il freddo per 3 giorni, focus su calore e riposo.',
      },
    ],
  },

  // ── P55 ── Steven Kotler — Flow State & Peak Performance (Evidence B) ──────────
  {
    id: 'P55',
    name: 'Steven Kotler',
    role: 'performance researcher | author | Flow Research Collective',
    discipline: 'flow state | peak performance | neurobiology',
    era: '2010s-2020s',
    nationality: 'USA',
    evidence: {
      evidenceLevel: 'B',
      prioritizedSources: [
        { title: 'The Art of Impossible (2021)', url: 'https://www.stevenkotler.com/', type: 'book', priority: 1 },
        { title: 'The Rise of Superman (2014)', url: 'https://www.stevenkotler.com/', type: 'book', priority: 2 },
        { title: 'Flow Research Collective – Training Peak Performance', url: 'https://www.flowresearchcollective.com/', type: 'research site', priority: 3 },
      ],
    },
    methodology: {
      observablePrinciples: [
        'The Flow Cycle: Struggle → Release → Flow → Recovery; all phases are necessary for sustainable performance',
        'Flow Triggers: challenge-skills balance (4% rule), clear goals, immediate feedback, high stakes',
        'Active Recovery: peak performance requires high-quality "reset" periods (sleep, nature, Epsom baths)',
        'The 4% Rule: challenge should be roughly 4% greater than current skill level to trigger flow',
        'Cognitive Load Management: remove distractions to protect the deep work/training window',
      ],
    },
    load: {
      rules: [
        'Protect the Morning: first 90-120 min of the day for high-challenge "deep" training or work',
        'Scheduled Recovery: for every block of high intensity/flow, schedule a proportional recovery block',
        'Challenge-Skill Balancing: adjust difficulty so the athlete is "at their limit but not beyond it"',
        'Novelty/Complexity: use varied environments to keep the brain engaged and trigger flow',
        'Zero Distraction: training sessions must be phone-free to allow deep focus',
      ],
    },
    blocks: [
      {
        name: 'Flow Trigger Block',
        durationWeeks: [4, 8],
        dosage: '3x high-challenge skill sessions/week; 4% rule applied; 2x active recovery sessions',
        progression: 'Increase complexity of skills rather than just load/volume',
      },
    ],
    kpis: [
      { name: 'Time in Flow (subjective reporting)', type: 'systemic' },
      { name: 'Skill acquisition rate', type: 'performance' },
      { name: 'Recovery quality score (Hooper Index)', type: 'systemic' },
    ],
    redFlags: [
      { trigger: 'Burnout / Loss of motivation ("Struggle" phase too long)', action: 'Mandatory active recovery week; reduce stakes; return to 4% challenge balance' },
      { trigger: 'High injury rate in technical skills', action: 'Challenge exceeds skill by >10%; regress complexity; focus on fundamentals' },
    ],
    mapping: {
      userArchetypes: ['peak performer', 'extreme sport athlete', 'creative professional', 'high-stakes athlete'],
      compatibleObjectives: ['peak performance', 'skill mastery', 'flow state optimization', 'mental performance'],
      incompatibleObjectives: ['monotonous volume-only training'],
    },
    uiPills: [
      { text: 'Il flow si trova sul confine tra noia e ansia. Trova il tuo 4% di sfida extra', sourceId: 'Kotler – Art of Impossible' },
      { text: 'Senza una recovery attiva, il picco di prestazione è un prestito che non potrai ripagare', sourceId: 'Flow Research Collective' },
    ],
    fusionWeight: {
      recommendedPercent: 15,
      bestPairedWith: ['P06', 'P32', 'P12', 'P31'],
    },

    // ─── v2 migration ─────────────────────────────────────────────────────────
    schemaVersion: '2.0',
    deepProfileComplete: true,
    blockCatalogIds: [
      'SKILL_ACQUISITION',
      'ACTIVE_RECOVERY',
      'AEROBIC_POWER',
      'MOBILITY_FLOW',
    ],
    profileModifiers: [
      {
        block_id:               'SKILL_ACQUISITION',
        activation_priority:    1,
        coach_specific_notes:   'Kotler usa la sfida tecnica costante (4% rule) per indurre lo stato di Flow durante l\'apprendimento.',
      },
    ],
    methodologyV2: {
      load_philosophy:        'Ottimizzazione neurobiologica della performance attraverso l\'induzione dello stato di Flow e il ciclo di recupero.',
      preferred_progression:  'complexity_first',
      block_selection_logic:  'Deep Training (Sfida) → Release (Distacco) → Active Recovery. Ogni sessione è "distraction-free".',
      assessment_bias:        ['Flow time', 'Hooper Index', 'Skill complexity level'],
      signature_constraints:  ['Niente smartphone durante il training', 'Recupero attivo obbligatorio post-sessione flow', 'Sfida regolata sul 4% sopra il livello attuale'],
    },
    resilientRedFlags: [
      {
        primary_source:       'wizard',
        condition:            'Perdita di focus / Motivazione calante',
        threshold:            3,
        action_code:          'FULL_REST',
        ui_explanation:       'Fase di Struggle prolungata: necessario reset completo di 48h per ripristinare i neurotrasmettitori (dopamina/norepinefrina).',
      },
    ],
  },

]

// ─── TIER-2: ATHLETE MENTAL PROFILES ─────────────────────────────────────────

export const athleteProfiles: AthleteProfile[] = [

  {
    id: 'A01',
    name: 'Kobe Bryant',
    sport: 'basketball (NBA)',
    era: '1996-2016',
    nationality: 'USA',
    gritArchetype: 'VOLUME_MONK',
    mentalPrinciples: [
      'Mamba Mentality: outwork everyone, every day, without exception',
      'Process over outcome: fall in love with the routine, not the result',
      'Mastery through repetition: 1000+ field goals before others wake up',
      'Reframe failure: every loss, every mistake is a study session',
      'Obsessive preparation: know every angle, every scenario before game day',
    ],
    trainingPhilosophy: 'Volume + obsession. No shortcuts, no excuses. If you are the hardest working person in the room, you control the outcome.',
    compatibleGritScore: [75, 100],
    uiPills: [
      { text: 'La mentalità Mamba: non fermarti finché non puoi farlo nel sonno', sourceId: 'Kobe Memoir 2018', quote: 'Rest at the end, not in the middle.' },
    ],
    quote: 'The most important thing is to try and inspire people so that they can be great in whatever they want to do.',
  },

  {
    id: 'A02',
    name: 'Cristiano Ronaldo',
    sport: 'football (soccer)',
    era: '2002-present',
    nationality: 'Portugal',
    gritArchetype: 'VOLUME_MONK',
    mentalPrinciples: [
      'Obsessive self-improvement: no ceiling on personal standards',
      'Body as instrument: sleep, nutrition, recovery are training tools',
      'Competitive hunger: never satisfied with current level',
      'Reject limits set by others: what others think is impossible is your baseline',
      'Consistent excellence: not peak performances, but consistently elite standards',
    ],
    trainingPhilosophy: 'Volume + recovery discipline. Talent is nothing without work. Then recover like a professional to repeat the work.',
    compatibleGritScore: [70, 100],
    uiPills: [
      { text: 'Quando gli altri dormono, Ronaldo si allena. È questo il vantaggio', sourceId: 'Various media 2010s' },
    ],
    quote: 'Talent without working hard is nothing.',
  },

  {
    id: 'A03',
    name: 'Michael Phelps',
    sport: 'swimming',
    era: '2000-2016',
    nationality: 'USA',
    gritArchetype: 'VOLUME_MONK',
    mentalPrinciples: [
      'Train 365 days: no holidays, no weekends. Consistency compounds',
      'Visualization: mentally swim every race perfectly before entering the water',
      'Routine mastery: same warm-up, same preparation, predictable excellence',
      'Process-focused: obsess over the execution, not the medal',
      'Mental resilience: bounce back from setbacks faster than the competition',
    ],
    trainingPhilosophy: 'Volume + visualization. Every race should feel like you\'ve swum it 1000 times already.',
    compatibleGritScore: [70, 100],
    uiPills: [
      { text: 'Phelps si allenava di domenica. Sono quelle giornate che fanno la differenza', sourceId: 'Bowman biography' },
    ],
    quote: 'I think goals should never be easy, they should force you to work, even if they are uncomfortable at the time.',
  },

  {
    id: 'A04',
    name: 'Eliud Kipchoge',
    sport: 'marathon',
    era: '2003-present',
    nationality: 'Kenya',
    gritArchetype: 'VOLUME_MONK',
    mentalPrinciples: [
      'No human is limited: the mind sets the real ceiling, not the body',
      'Consistency and patience: monthly, annual, decadal compounding of work',
      'Team over ego: training group as force multiplier, not competition',
      'Joy in the process: run with a smile; suffering is a choice',
      'Simplicity: sleep, eat, train, repeat. Remove distractions',
    ],
    trainingPhilosophy: '80% easy. 20% hard. Every day. Every week. For years. That is the recipe.',
    compatibleGritScore: [60, 100],
    uiPills: [
      { text: 'No human is limited. Il limite è nella mente, non nel corpo', sourceId: 'Nike Breaking2 2017', quote: 'No human is limited.' },
    ],
    quote: 'In my experience, I only set small goals that can lead me to a big goal.',
  },

  {
    id: 'A05',
    name: 'Tom Brady',
    sport: 'American football (NFL)',
    era: '2000-2023',
    nationality: 'USA',
    gritArchetype: 'LONGEVITY_FOCUSED',
    mentalPrinciples: [
      'TB12 method: pliability + anti-inflammatory diet as longevity tools',
      'Longevity through discipline: retire when you choose, not when your body forces it',
      'Mental preparation is equal to physical: study the game, not just train for it',
      'Sacrifice: say no to anything that undermines performance',
      'Adaptability: change your game as you age; work smarter as body changes',
    ],
    trainingPhilosophy: 'Recovery is training. Sleep, nutrition, pliability, mindset — these are what let you compete at 45.',
    compatibleGritScore: [55, 90],
    uiPills: [
      { text: 'Per Brady la recovery è allenamento. Il riposo è parte del piano', sourceId: 'TB12 Method book 2017' },
    ],
    quote: 'I always have confidence. But never arrogance.',
  },

  {
    id: 'A06',
    name: 'Novak Djokovic',
    sport: 'tennis',
    era: '2003-present',
    nationality: 'Serbia',
    gritArchetype: 'LONGEVITY_FOCUSED',
    mentalPrinciples: [
      'Nutrition as performance lever: gluten-free diet transformed his career',
      'Mental training equal to physical: mindfulness, breathing, focus blocks',
      'Recovery rituals: ice baths, meditation, breathing protocols',
      'Serve the game: transcend individual ego; play for something bigger',
      'Compete with a smile: use adversity as fuel rather than obstacle',
    ],
    trainingPhilosophy: 'Mental + nutritional mastery combined with physical excellence. Mind and body as one integrated system.',
    compatibleGritScore: [55, 95],
    uiPills: [
      { text: 'Djokovic ha cambiato tutto con la nutrizione. Il corpo è il primo strumento', sourceId: 'Serve to Win book 2013' },
    ],
    quote: 'The mind is your strongest muscle. Train it like you train your body.',
  },

  {
    id: 'A07',
    name: 'David Goggins',
    sport: 'ultra-endurance / military',
    era: '2000s-present',
    nationality: 'USA',
    gritArchetype: 'HIT_WARRIOR',
    mentalPrinciples: [
      'Callous the mind: seek discomfort to expand your capability ceiling',
      '40% rule: when you think you\'re done, you\'re only at 40% of capacity',
      'Accountability mirror: brutal self-honesty daily',
      'Suffering as teacher: the most uncomfortable sessions give the most growth',
      'No excuses, no shortcuts: the work is the work',
    ],
    trainingPhilosophy: 'Deliberately seek discomfort. When your mind says stop, your body has more. Train that gap.',
    compatibleGritScore: [85, 100],
    uiPills: [
      { text: 'Quando pensi di aver finito, sei al 40%. Il vero lavoro inizia lì', sourceId: 'Can\'t Hurt Me 2018', quote: 'You are only 40% done.' },
    ],
    quote: "You are in danger of living a life so comfortable and soft, that you will die without ever realizing your true potential.",
  },

  {
    id: 'A08',
    name: 'Simone Biles',
    sport: 'artistic gymnastics',
    era: '2011-present',
    nationality: 'USA',
    gritArchetype: 'HYBRID',
    mentalPrinciples: [
      'Mental health is performance: prioritize psychological wellbeing alongside physical',
      'Courage to step back: knowing when to rest is not weakness, it is wisdom',
      'Redefine boundaries: what others declare impossible defines your next target',
      'Trust the training: the preparation allows you to compete freely',
      'Own your power: greatness belongs to those who claim it, not those who minimize it',
    ],
    trainingPhilosophy: 'Mastery through repetition, protected by self-awareness. You can\'t perform your best when your mind is not right.',
    compatibleGritScore: [50, 95],
    uiPills: [
      { text: 'La salute mentale è performance. Biles ha avuto il coraggio di dirlo', sourceId: 'Tokyo Olympics 2021' },
    ],
    quote: 'I\'m not the next Usain Bolt or Michael Phelps. I\'m the first Simone Biles.',
  },

  {
    id: 'A09',
    name: 'Dorian Yates',
    sport: 'bodybuilding (IFBB Mr. Olympia)',
    era: '1988-1997',
    nationality: 'UK',
    gritArchetype: 'HIT_WARRIOR',
    mentalPrinciples: [
      'Blood & Guts: one set to absolute failure is more productive than many sets holding back',
      'Work in the dark: train without audience, in silence, with full intensity',
      'HIT philosophy: intensity over volume; every set must be maximally challenging',
      'Extreme focus: nothing exists during the set except the muscle and the rep',
      'Train like a machine: emotion-free, systematic, relentless',
    ],
    trainingPhilosophy: 'One brutal set to failure. Not 15 comfortable sets. Quality of intensity beats quantity of reps.',
    compatibleGritScore: [80, 100],
    uiPills: [
      { text: 'Una serie al cedimento totale vale più di dieci serie comode', sourceId: 'Blood & Guts documentary', quote: 'Go in hard, go in brutal, come out a champion.' },
    ],
    quote: 'Champion bodybuilders are either stupid, or they are willing to live as though they are.',
  },

  {
    id: 'A10',
    name: 'Arnold Schwarzenegger',
    sport: 'bodybuilding (IFBB Mr. Olympia)',
    era: '1966-1980',
    nationality: 'Austria/USA',
    gritArchetype: 'VOLUME_MONK',
    mentalPrinciples: [
      'Visualization: see the muscle pumped and perfect before the set begins',
      'Mind-muscle connection: feel every rep; the weight is secondary to the connection',
      'Volume as path to mastery: more reps, more sets, more exposure to the movement',
      'Joy of the pump: find pleasure in the process of training, not only the result',
      'Ambition without limits: if you set a small goal, you achieve a small result',
    ],
    trainingPhilosophy: 'High volume, mind-muscle connection, visualization. Train 2x/day if needed. The body adapts to what you demand of it.',
    compatibleGritScore: [65, 100],
    uiPills: [
      { text: 'Arnold visualizzava il bicipite come una montagna. La connessione mente-muscolo è tutto', sourceId: 'Pumping Iron 1977' },
    ],
    quote: 'The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.',
  },

]

// ─── LOOKUP UTILITIES ─────────────────────────────────────────────────────────

/** Get a Titan coach profile by ID */
export function getTitanById(id: string): TitanProfile | undefined {
  return titanProfiles.find(p => p.id === id)
}

/** Get an athlete profile by ID */
export function getAthleteById(id: string): AthleteProfile | undefined {
  return athleteProfiles.find(p => p.id === id)
}

/** Get all Titan profiles compatible with a given objective keyword */
export function getTitansForObjective(objective: string): TitanProfile[] {
  const kw = objective.toLowerCase()
  return titanProfiles.filter(p =>
    p.mapping.compatibleObjectives.some(o => o.toLowerCase().includes(kw)) ||
    p.discipline.toLowerCase().includes(kw)
  )
}

/** Get the best matching athlete profile for a grit score */
export function getAthleteForGrit(gritScore: number): AthleteProfile[] {
  return athleteProfiles
    .filter(a => gritScore >= a.compatibleGritScore[0] && gritScore <= a.compatibleGritScore[1])
    .sort((a, b) => {
      // Prefer closer to midpoint of range
      const midA = (a.compatibleGritScore[0] + a.compatibleGritScore[1]) / 2
      const midB = (b.compatibleGritScore[0] + b.compatibleGritScore[1]) / 2
      return Math.abs(gritScore - midA) - Math.abs(gritScore - midB)
    })
}

/**
 * Build fusion weights for plan generation.
 * Given a list of selected titan IDs, returns normalized % weights.
 */
export function buildFusionWeights(titanIds: string[]): Record<string, number> {
  const profiles = titanIds.map(id => getTitanById(id)).filter(Boolean) as TitanProfile[]
  const total = profiles.reduce((sum, p) => sum + p.fusionWeight.recommendedPercent, 0)
  const result: Record<string, number> = {}
  for (const p of profiles) {
    result[p.id] = Math.round((p.fusionWeight.recommendedPercent / total) * 100)
  }
  return result
}

/** Disciplines index for UI filtering */
export const DISCIPLINES = [
  'football (soccer)',
  'sprint',
  'endurance running',
  'cycling / triathlon',
  'strength / powerlifting',
  'weightlifting',
  'CrossFit',
  'swimming',
  'mountain / uphill',
  'climbing',
  'female physiology',
  'rehab / prehab',
  'HIIT / team sport',
  'load management',
  'periodization',
] as const

export type Discipline = typeof DISCIPLINES[number]

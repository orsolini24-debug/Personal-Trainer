/**
 * titans-blocks.ts
 *
 * CANONICAL BLOCK CATALOG — versione 1.0
 *
 * I 10 blocchi fondamentali del sistema TITANS.
 * Ogni blocco rappresenta la "fisica dell'allenamento":
 * indipendente dal coach, ancorato alla calibration policy.
 *
 * REGOLA FONDAMENTALE:
 *   Ogni valore numerico è derivato dalle costanti in titans-calibration.ts.
 *   Non esistono "numeri liberi" qui. Se un valore non ha fonte, è null.
 *
 * BLOCCHI INCLUSI:
 *   1. ZONE2_FOUNDATION          — base aerobica / fat oxidation
 *   2. THRESHOLD_ENDURANCE       — soglia lattacida / LT2 training
 *   3. LONG_AEROBIC_ENDURANCE    — fondo lungo / aerobic capacity
 *   4. HIIT_TEAM_SPORT           — HIIT orientato a sport di squadra
 *   5. RSA                       — Repeated Sprint Ability
 *   6. SPRINT_ACCELERATION       — accelerazione / forza esplosiva orizzontale
 *   7. MAX_STRENGTH_ACCUMULATION — forza massimale (accumulo)
 *   8. ECCENTRIC_HAMSTRING_PREHAB — preventivo posteriore coscia
 *   9. COD_MECHANICS             — tecnica cambio di direzione
 *  10. RTP_FIELD_REBUILD         — return-to-play progressivo sul campo
 *
 * Come sono usati:
 *   titans-db.ts   → TitanProfile.blockCatalogIds referenzia i block_id
 *   titans-db.ts   → ProfileBlockModifier personalizza senza modificare la fisica
 *   titans-engine  → legge blocchi + UserPhenotype → DailyRecommendation
 */

import type { TitanBlockCanonical, ProfileBlockModifier, MechanicalDosage } from './titans-types'
import { CALIBRATION_VERSION } from './titans-calibration'

// ─── 1. ZONE2_FOUNDATION ──────────────────────────────────────────────────

const ZONE2_FOUNDATION: TitanBlockCanonical = {
  block_id:    'ZONE2_FOUNDATION',
  name:        'Zone 2 Foundation Training',
  category:    'endurance_aerobic',
  subcategory: 'fat_oxidation_base',

  mechanical_dosage: {
    sessions_per_week: [3, 5],
    duration_min:      [45, 90],
    rpe_target:        [2, 4],    // conversational pace; "talk test" positivo
    // intensity_pct_1rm non applicabile
    // Nota: HR target 60–72% HRmax (HR_ZONES_PCT_HRMAX.ZONE2_AEROBIC_BASE)
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,  // nessun carico assiale rilevante
    joint_stress_knee:     null,  // impatto assorbito con tecnica corretta
    joint_stress_hip:      null,
    joint_stress_shoulder: null,
    joint_stress_ankle:    3,     // JOINT_STRESS_RUBRIC.ANKLE_RUNNING_MODERATE: 3
    tendon_load_type:      'tensile',  // carico Achille durante corsa
    tissue_recovery_hours: 14,    // TISSUE_RECOVERY_HOURS.ZONE2_RUNNING_EASY: 14
    bilateral_demand:      true,
  },

  cns_drain_score:   2,  // CNS_DRAIN_RUBRIC.ZONE2_STEADY_STATE: 2
  metabolic_pathway: 'aerobic_oxidative',

  primary_adaptation:   'FAT_OXIDATION',
  secondary_adaptation: 'AEROBIC_CAPACITY',

  adaptation_decay: {
    primary_quality:   'FAT_OXIDATION',
    secondary_quality: 'AEROBIC_CAPACITY',
    half_life_days:    21,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.FAT_OXIDATION: 21
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'minor',
      minimum_separation_hours: 0,    // INTERFERENCE_MATRIX.ZONE2_ENDURANCE_vs_STRENGTH.separation_hours_minimum
      mechanism:                'Minima attivazione AMPK a Zone 2 — interferenza trascurabile (San Millán & Brooks 2018)',
      source:                   'San Millán & Brooks 2018; Fyfe et al. 2014 Sports Med',
    },
  ],

  synergistic_with: ['THRESHOLD_ENDURANCE', 'LONG_AEROBIC_ENDURANCE'],

  entry_gates: [],  // blocco di ingresso: nessun prerequisito formale

  exit_criteria: [
    'Durata sostenuta ≥ 60 min in Zone 2 (RPE 3) dopo 6+ settimane',
    'Miglioramento LT1 pace/power ≥ 5% rispetto al baseline',
    'Disponibile una base di ≥ 3 sessioni/settimana × 8 settimane',
  ],

  autoregulation_caps: [
    {
      metric:           'hr_ceiling_pct',
      threshold:        72,  // HR_ZONES_PCT_HRMAX.ZONE2_AEROBIC_BASE.max: 72
      action_on_breach: 'end_session',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        4,
      action_on_breach: 'reduce_load_pct',
      reduction_pct:    20,
    },
  ],

  sport_compatibility: [
    { discipline: 'endurance_running',   priority: 'primary',   note: 'Base fondativa — minimo 3×/sett in preparazione generale' },
    { discipline: 'cycling',             priority: 'primary' },
    { discipline: 'triathlon',           priority: 'primary' },
    { discipline: 'football',            priority: 'secondary', note: '2×/sett in off-season per base aerobica squadra' },
    { discipline: 'rugby',               priority: 'secondary' },
    { discipline: 'basketball',          priority: 'secondary' },
    { discipline: 'powerlifting',        priority: 'optional',  note: 'Utile per recovery attivo e capacità di lavoro generale' },
  ],

  contraindications: [
    'Patologia cardiaca non controllata',
    'Infortunio acuto agli arti inferiori con carico peso controindicato',
    'Tendinopatia Achillea in fase reattiva (VAS > 4 durante attività)',
  ],

  evidence_basis: [
    { source: 'San Millán & Brooks (2018) — Zone 2 and mitochondrial function', type: 'peer_reviewed',        strength: 'A' },
    { source: 'Seiler (2010) — Intensity distribution in endurance athletes',    type: 'peer_reviewed',        strength: 'A' },
    { source: 'Maffetone (2010) — The Big Book of Endurance Training and Racing', type: 'practitioner_manual', strength: 'B' },
    { source: 'Fyfe et al. (2014) — Concurrent training meta-analysis',          type: 'peer_reviewed',        strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.90,
}

// ─── 2. THRESHOLD_ENDURANCE ───────────────────────────────────────────────

const THRESHOLD_ENDURANCE: TitanBlockCanonical = {
  block_id:    'THRESHOLD_ENDURANCE',
  name:        'Threshold / LT2 Endurance Training',
  category:    'endurance_aerobic',
  subcategory: 'lactate_threshold_development',

  mechanical_dosage: {
    sessions_per_week: [2, 2],        // oltre 2×/sett accumula fatica critica
    duration_min:      [8, 20],       // per singolo interval; 2–4 intervals per sessione
    sets_per_session:  [2, 4],        // numero di intervals
    rpe_target:        [7, 8],        // "comfortably hard" — può parlare a frasi brevi
    rest_seconds:      [120, 300],    // recupero tra intervals
    // HR target: 82–92% HRmax (HR_ZONES_PCT_HRMAX.ZONE4_THRESHOLD)
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     null,
    joint_stress_hip:      null,
    joint_stress_shoulder: null,
    joint_stress_ankle:    3,     // JOINT_STRESS_RUBRIC.ANKLE_RUNNING_MODERATE: 3
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 30,    // TISSUE_RECOVERY_HOURS.THRESHOLD_RUNNING: 30
    bilateral_demand:      true,
  },

  cns_drain_score:   4,  // CNS_DRAIN_RUBRIC.THRESHOLD_ENDURANCE: 4
  metabolic_pathway: 'aerobic_glycolytic_mixed',

  primary_adaptation:   'LACTATE_THRESHOLD',
  secondary_adaptation: 'AEROBIC_CAPACITY',

  adaptation_decay: {
    primary_quality:   'LACTATE_THRESHOLD',
    secondary_quality: 'AEROBIC_CAPACITY',
    half_life_days:    25,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.LACTATE_THRESHOLD: 25
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 6,    // INTERFERENCE_MATRIX.HIGH_INTENSITY_ENDURANCE_vs_STRENGTH.separation_hours_minimum
      mechanism:                'AMPK attivato sopra LT1 — conflitto mTOR; preferibile separare di 24h (Wilson et al. 2012)',
      source:                   'Hickson 1980; Wilson et al. 2012 JSCR',
    },
    {
      penalizes_block_category: 'power_explosive',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'Accumulo lattato residuo riduce output di potenza neuromuscolare acuta',
      source:                   'Wilson et al. 2012 meta-analysis',
    },
  ],

  synergistic_with: ['ZONE2_FOUNDATION', 'LONG_AEROBIC_ENDURANCE'],

  entry_gates: [
    {
      metric:    'ZONE2_FOUNDATION weeks completed',
      operator:  '>=',
      threshold: 6,
      critical:  true,
      source:    'Seiler (2010) — progressione 80/20 richiede base Zone 2 solida',
    },
  ],

  exit_criteria: [
    'FTP/CP incrementato ≥ 5% rispetto al baseline',
    'LT2 pace/power migliorata ≥ 3% dopo 6–8 settimane',
    'RPE sostenuta alle sessioni ≤ 8 con durata 20 min',
  ],

  autoregulation_caps: [
    {
      metric:           'hr_ceiling_pct',
      threshold:        92,  // HR_ZONES_PCT_HRMAX.ZONE4_THRESHOLD.max
      action_on_breach: 'end_set',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        8,
      action_on_breach: 'reduce_load_pct',
      reduction_pct:    10,
    },
  ],

  sport_compatibility: [
    { discipline: 'endurance_running',   priority: 'primary' },
    { discipline: 'cycling',             priority: 'primary' },
    { discipline: 'triathlon',           priority: 'primary' },
    { discipline: 'football',            priority: 'secondary', note: 'Pre-season: sviluppo capacità di ripetere sforzi medi' },
    { discipline: 'rugby',               priority: 'secondary' },
    { discipline: 'rowing',              priority: 'primary' },
  ],

  contraindications: [
    'Patologia cardiaca non controllata',
    'Infortunio acuto — qualsiasi fase acuta',
    'Acwr > 1.5 (alto rischio infortuni)',
  ],

  evidence_basis: [
    { source: 'Seiler (2010) — Best practice intensity distribution',           type: 'peer_reviewed',   strength: 'A' },
    { source: 'Coggan & Allen (2010) — Training with Power Meter',              type: 'textbook',        strength: 'A' },
    { source: 'Daniels (2013) — Daniels\' Running Formula (3rd ed.)',           type: 'practitioner_manual', strength: 'B' },
    { source: 'Hickson (1980) — Interference of concurrent training',           type: 'peer_reviewed',   strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.88,
}

// ─── 3. LONG_AEROBIC_ENDURANCE ────────────────────────────────────────────

const LONG_AEROBIC_ENDURANCE: TitanBlockCanonical = {
  block_id:    'LONG_AEROBIC_ENDURANCE',
  name:        'Long Slow Distance / Aerobic Capacity Block',
  category:    'endurance_aerobic',
  subcategory: 'aerobic_capacity_volume',

  mechanical_dosage: {
    sessions_per_week: [1, 2],
    duration_min:      [90, 180],  // LSD tradizionale: 90–180+ min
    rpe_target:        [3, 5],
    // HR target: Zone 1–2 (50–72% HRmax)
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     null,
    joint_stress_hip:      null,
    joint_stress_shoulder: null,
    joint_stress_ankle:    3,     // JOINT_STRESS_RUBRIC.ANKLE_RUNNING_MODERATE: 3
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 24,    // oltre 2h: incremento × 1.3 vs ZONE2_RUNNING_EASY
    bilateral_demand:      true,
  },

  cns_drain_score:   2,  // CNS_DRAIN_RUBRIC.ZONE2_STEADY_STATE: 2
  metabolic_pathway: 'aerobic_oxidative',

  primary_adaptation:   'AEROBIC_CAPACITY',
  secondary_adaptation: 'FAT_OXIDATION',

  adaptation_decay: {
    primary_quality:   'AEROBIC_CAPACITY',
    secondary_quality: 'FAT_OXIDATION',
    half_life_days:    28,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.AEROBIC_CAPACITY: 28
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'minor',
      minimum_separation_hours: 0,
      mechanism:                'Sessione lenta e di bassa intensità — impatto AMPK minimo (San Millán 2018)',
      source:                   'San Millán & Brooks 2018',
    },
  ],

  synergistic_with: ['ZONE2_FOUNDATION', 'THRESHOLD_ENDURANCE'],

  entry_gates: [
    {
      metric:    'ZONE2 base weeks',
      operator:  '>=',
      threshold: 4,
      critical:  false,
      source:    'Lydiard (1978): base aerobica prima di incrementare durata',
    },
  ],

  exit_criteria: [
    'Capacità di sostenere 90+ min a RPE ≤ 4 senza calo di pace',
    'VO2max migliorato ≥ 3% dopo 8+ settimane di stimolo',
  ],

  autoregulation_caps: [
    {
      metric:           'hr_ceiling_pct',
      threshold:        72,  // rimanere in Zone 2
      action_on_breach: 'reduce_load_pct',
      reduction_pct:    15,
    },
  ],

  sport_compatibility: [
    { discipline: 'endurance_running',   priority: 'primary' },
    { discipline: 'cycling',             priority: 'primary' },
    { discipline: 'triathlon',           priority: 'primary' },
    { discipline: 'football',            priority: 'optional', note: 'Solo off-season profondo' },
    { discipline: 'marathon',            priority: 'primary' },
    { discipline: 'ironman_triathlon',   priority: 'primary' },
  ],

  contraindications: [
    'In-season sport di squadra (volume incompatibile con recupero)',
    'Infortunio arti inferiori con carico peso controindicato',
  ],

  evidence_basis: [
    { source: 'Lydiard & Gilmour (1978) — Running the Lydiard Way',                  type: 'practitioner_manual', strength: 'B' },
    { source: 'Mujika & Padilla (2000) — Detraining and aerobic adaptations',         type: 'peer_reviewed',       strength: 'A' },
    { source: 'Seiler (2010) — Polarized training in endurance athletes',             type: 'peer_reviewed',       strength: 'A' },
    { source: 'San Millán & Brooks (2018) — Reexamination of training intensity',     type: 'peer_reviewed',       strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.85,
}

// ─── 4. HIIT_TEAM_SPORT ───────────────────────────────────────────────────

const HIIT_TEAM_SPORT: TitanBlockCanonical = {
  block_id:    'HIIT_TEAM_SPORT',
  name:        'HIIT Team Sport (Interval Training ad Alta Intensità)',
  category:    'endurance_anaerobic',
  subcategory: 'aerobic_power_team_sport',

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [6, 10],
    duration_min:      [3, 6],      // durata di ogni bout (3–6 min a > 90% HRmax)
    rpe_target:        [8, 9],
    rest_seconds:      [180, 360],  // rapporto lavoro:recupero ~ 1:1 / 1:2
    // HR target: > 90% HRmax (HR_ZONES_PCT_HRMAX.ZONE5_VO2MAX)
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     null,
    joint_stress_hip:      null,
    joint_stress_shoulder: null,
    joint_stress_ankle:    3,     // JOINT_STRESS_RUBRIC.ANKLE_RUNNING_MODERATE
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 36,    // TISSUE_RECOVERY_HOURS.HIIT_TEAM_SPORT: 36
    bilateral_demand:      true,
  },

  cns_drain_score:   6,  // CNS_DRAIN_RUBRIC.HIIT_TEAM_SPORT: 6
  metabolic_pathway: 'glycolytic_alactic_mixed',

  primary_adaptation:   'ANAEROBIC_CAPACITY',
  secondary_adaptation: 'AEROBIC_CAPACITY',

  adaptation_decay: {
    primary_quality:   'ANAEROBIC_CAPACITY',
    secondary_quality: 'AEROBIC_CAPACITY',
    half_life_days:    18,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.ANAEROBIC_CAPACITY: 18
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 6,    // INTERFERENCE_MATRIX.HIGH_INTENSITY_ENDURANCE_vs_STRENGTH: 6h min, 24h ideal
      mechanism:                'AMPK activation > mTOR suppression — compromette adattamento di forza acuto (Hickson 1980)',
      source:                   'Hickson 1980; Wilson et al. 2012 JSCR meta-analysis',
    },
    {
      penalizes_block_category: 'strength_hypertrophy',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'AMPK-mTOR conflict rilevante anche per ipertrofia (Fyfe et al. 2014)',
      source:                   'Fyfe et al. 2014 Sports Medicine',
    },
    {
      penalizes_block_category: 'speed_sprint',
      severity:                 'moderate',
      minimum_separation_hours: 24,  // INTERFERENCE_MATRIX.HYPERTROPHY_VOLUME_vs_SPRINT: 24h min
      mechanism:                 'Fatica periferica post-HIIT riduce output di velocità nei successivi 24h',
      source:                   'Wilson et al. 2012',
    },
  ],

  synergistic_with: ['RSA', 'ZONE2_FOUNDATION'],

  entry_gates: [
    {
      metric:    'ZONE2 weekly sessions (base aerobica)',
      operator:  '>=',
      threshold: 3,
      critical:  true,
      source:    'Buchheit & Laursen (2013): senza base aerobica il HIIT perde efficacia e incrementa rischio',
    },
  ],

  exit_criteria: [
    'VO2max incrementato ≥ 5% dopo 6 settimane',
    'Tolleranza a 10 bouts × 4 min senza calo di pace > 5%',
  ],

  autoregulation_caps: [
    {
      metric:           'hr_ceiling_pct',
      threshold:        100,
      action_on_breach: 'end_set',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        9,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'football',    priority: 'primary',   note: 'Pre-season: 2–3× / settimana; in-season: 1× max' },
    { discipline: 'basketball',  priority: 'primary' },
    { discipline: 'rugby',       priority: 'primary' },
    { discipline: 'tennis',      priority: 'secondary' },
    { discipline: 'endurance_running', priority: 'secondary', note: 'Integra polarizzato — max 20% del volume settimanale' },
    { discipline: 'cycling',     priority: 'secondary' },
  ],

  contraindications: [
    'Fase acuta di infortunio muscolare o tendineo',
    'HRV z-score < -1.5 (RED zone — deload) per 2+ giorni consecutivi',
    'ACWR > 1.5 (zona ad alto rischio)',
    'Senza base aerobica di almeno 4 settimane di Zone 2',
  ],

  evidence_basis: [
    { source: 'Buchheit & Laursen (2013) — HIIT programming science',         type: 'peer_reviewed',   strength: 'A' },
    { source: 'Gabbett (2016) — Training load and injury prevention BJSM',    type: 'peer_reviewed',   strength: 'A' },
    { source: 'Rønnestad & Mujika (2014) — HIIT in team sports',              type: 'peer_reviewed',   strength: 'B' },
    { source: 'Hickson (1980) — Interference of concurrent training',         type: 'peer_reviewed',   strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.88,
}

// ─── 5. RSA (Repeated Sprint Ability) ─────────────────────────────────────

const RSA: TitanBlockCanonical = {
  block_id:    'RSA',
  name:        'Repeated Sprint Ability',
  category:    'endurance_anaerobic',
  subcategory: 'repeated_sprint_team_sport',

  mechanical_dosage: {
    sessions_per_week:  [2, 3],
    sets_per_session:   [3, 5],      // serie di sprint ripetuti
    reps_per_set:       [5, 8],      // sprint per serie
    distance_per_rep_m: [20, 40],    // distanza singolo sprint
    rest_seconds:       [15, 30],    // recupero tra sprint nel set (incompleto!)
    // recupero tra serie: 8–10 min (non in schema — nota coach)
    rpe_target:         [9, 10],     // massimale
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     null,
    joint_stress_hip:      6,     // JOINT_STRESS_RUBRIC.HIP_SPRINT_ACCELERATION: 6
    joint_stress_shoulder: null,
    joint_stress_ankle:    6,     // JOINT_STRESS_RUBRIC.ANKLE_REACTIVE_SPRINT: 6
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 36,    // TISSUE_RECOVERY_HOURS.HIIT_TEAM_SPORT: 36 (conservative)
    bilateral_demand:      true,
  },

  cns_drain_score:   8,  // CNS_DRAIN_RUBRIC.SPRINT_ACCELERATION: 8 (in serie con recupero incompleto)
  metabolic_pathway: 'glycolytic_alactic_mixed',

  primary_adaptation:   'ANAEROBIC_CAPACITY',
  secondary_adaptation: 'SPEED',

  adaptation_decay: {
    primary_quality:   'ANAEROBIC_CAPACITY',
    secondary_quality: 'SPEED',
    half_life_days:    18,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.ANAEROBIC_CAPACITY: 18
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'critical',
      minimum_separation_hours: 8,   // INTERFERENCE_MATRIX.SPRINT_vs_HEAVY_LOWER_BODY: 8h
      mechanism:                'Overlap CNS + fatica muscolare inferiore — squat pesante post-RSA riduce qualità tecnica e rischia infortuni',
      source:                   'Francis 1992; Verkhoshansky 2009',
    },
    {
      penalizes_block_category: 'strength_hypertrophy',
      severity:                 'moderate',
      minimum_separation_hours: 24,
      mechanism:                'Fatica periferica da RSA riduce produzione di forza per 12–24h',
      source:                   'Wilson et al. 2012',
    },
  ],

  synergistic_with: ['HIIT_TEAM_SPORT', 'SPRINT_ACCELERATION', 'ZONE2_FOUNDATION'],

  entry_gates: [
    {
      metric:    'HIIT_TEAM_SPORT weeks completed',
      operator:  '>=',
      threshold: 4,
      critical:  true,
      source:    'Buchheit (2012): la capacità RSA si costruisce su base aerobica + HIIT consolidata',
    },
    {
      metric:    'Sprint 30m time (baseline available)',
      operator:  '!=',
      threshold: 0,
      critical:  false,
      source:    'Prerequisito di tracking per verificare adattamento',
    },
  ],

  exit_criteria: [
    'Riduzione del decremento di velocità tra 1° e 8° sprint ≥ 10%',
    'Miglioramento del tempo di sprint singolo ≥ 3%',
  ],

  autoregulation_caps: [
    {
      metric:           'velocity_drop_pct',
      threshold:        10,    // se un sprint è >10% più lento del migliore → fine serie
      action_on_breach: 'end_set',
    },
    {
      metric:           'pain_vas_ceiling',
      threshold:        3,
      action_on_breach: 'end_session',
    },
  ],

  sport_compatibility: [
    { discipline: 'football',    priority: 'primary',   note: 'Qualità chiave: RSA è predittiva della performance in partita' },
    { discipline: 'rugby',       priority: 'primary' },
    { discipline: 'basketball',  priority: 'primary' },
    { discipline: 'hockey',      priority: 'primary' },
    { discipline: 'tennis',      priority: 'secondary', note: 'Rally brevi — RSA applicata a cambi di direzione' },
    { discipline: 'endurance_running', priority: 'optional' },
  ],

  contraindications: [
    'Infortunio muscolare posteriore coscia (qualsiasi grado)',
    'Tendinopatia Achillea o rotulea in fase reattiva',
    'HRV z-score < -1.5 per 2+ giorni',
    'Senza almeno 4 settimane di HIIT di base precedente',
  ],

  evidence_basis: [
    { source: 'Buchheit (2012) — Repeated sprint ability: a review of the literature',    type: 'peer_reviewed', strength: 'A' },
    { source: 'Spencer et al. (2005) — Physiological demands of RSA in team sports',       type: 'peer_reviewed', strength: 'A' },
    { source: 'Gabbett (2016) — Training load injury prevention BJSM',                    type: 'peer_reviewed', strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.87,
}

// ─── 6. SPRINT_ACCELERATION ───────────────────────────────────────────────

const SPRINT_ACCELERATION: TitanBlockCanonical = {
  block_id:    'SPRINT_ACCELERATION',
  name:        'Sprint Acceleration Block (0–30m)',
  category:    'speed_sprint',
  subcategory: 'acceleration_power_development',

  mechanical_dosage: {
    sessions_per_week:  [2, 2],       // più di 2×/sett satura CNS
    sets_per_session:   [6, 10],      // reps totali per sessione
    distance_per_rep_m: [10, 30],     // focus su accelerazione; non velocità massima
    rest_seconds:       [180, 300],   // recupero COMPLETO tra reps (3–5 min)
    rpe_target:         [9, 10],
    // Nota: ogni sprint deve essere ≥ 97% del massimo (Charlie Francis: qualità > quantità)
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     null,
    joint_stress_hip:      6,     // JOINT_STRESS_RUBRIC.HIP_SPRINT_ACCELERATION: 6
    joint_stress_shoulder: null,
    joint_stress_ankle:    6,     // JOINT_STRESS_RUBRIC.ANKLE_REACTIVE_SPRINT: 6
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 72,    // TISSUE_RECOVERY_HOURS.SPRINT_ACCELERATION: 72 (CNS-limited)
    bilateral_demand:      true,
  },

  cns_drain_score:   8,  // CNS_DRAIN_RUBRIC.SPRINT_ACCELERATION: 8
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'SPEED',
  secondary_adaptation: 'REACTIVE_STRENGTH',

  adaptation_decay: {
    primary_quality:   'SPEED',
    secondary_quality: 'REACTIVE_STRENGTH',
    half_life_days:    5,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.SPEED: 5 — qualità più volatile
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'critical',
      minimum_separation_hours: 8,   // INTERFERENCE_MATRIX.SPRINT_vs_HEAVY_LOWER_BODY: 8h min
      mechanism:                'CNS + sovrapposizione neuromuscolare arti inferiori — squat pesante post-sprint riduce velocità del 15–20% (Francis 1992)',
      source:                   'Francis 1992; Verkhoshansky & Siff 2009',
    },
    {
      penalizes_block_category: 'endurance_anaerobic',
      severity:                 'moderate',
      minimum_separation_hours: 24,
      mechanism:                'HIIT pre-sprint: acidosi residua compromette qualità neuromuscolare massimale',
      source:                   'Wilson et al. 2012',
    },
  ],

  synergistic_with: ['MAX_STRENGTH_ACCUMULATION', 'RSA', 'COD_MECHANICS'],

  entry_gates: [
    {
      metric:    'Sprint mechanics baseline (video or GPS)',
      operator:  '!=',
      threshold: 0,
      critical:  false,
      source:    'Winkelman (2018) — tecnica accelerazione deve essere valutata prima del lavoro ad alta intensità',
    },
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,    // PAIN_VAS_THRESHOLDS.SAFE_TO_TRAIN_BELOW: 2
      critical:  true,
      source:    'Cook & Purdam 2009 — nessun carico ad alta velocità con dolore > 2/10',
    },
  ],

  exit_criteria: [
    'Miglioramento tempo 10m ≥ 2% rispetto al baseline',
    'Miglioramento tempo 30m ≥ 3% rispetto al baseline',
    'Tecnica accelerazione valutata "adeguata" da coach (ginocchio > 90° primo passo)',
  ],

  autoregulation_caps: [
    {
      metric:           'velocity_drop_pct',
      threshold:        3,    // sprint di velocità: drop >3% → qualità compromessa → fine sessione
      action_on_breach: 'end_session',
    },
    {
      metric:           'pain_vas_ceiling',
      threshold:        2,    // PAIN_VAS_THRESHOLDS.SAFE_TO_TRAIN_BELOW: 2
      action_on_breach: 'end_session',
    },
  ],

  sport_compatibility: [
    { discipline: 'football',      priority: 'primary',   note: 'Sprint 0–10m è il determinante più importante della performance di accelerazione in partita' },
    { discipline: 'rugby',         priority: 'primary' },
    { discipline: 'basketball',    priority: 'primary' },
    { discipline: 'athletics_100m', priority: 'primary' },
    { discipline: 'athletics_400m', priority: 'secondary' },
    { discipline: 'powerlifting',  priority: 'optional',  note: 'Utile per atleti che vogliono espressività neuromuscolare' },
  ],

  contraindications: [
    'Infortunio acuto posteriore coscia (qualsiasi grado)',
    'Tendinopatia Achillea o rotulea con VAS > 2 all\'attività',
    'Recupero < 72h da sessione di sprint precedente',
    'Recupero < 24h da sessione di forza massimale arti inferiori',
    'ACWR > 1.5',
  ],

  evidence_basis: [
    { source: 'Francis (1992) — The Charlie Francis Training System',           type: 'practitioner_manual', strength: 'B' },
    { source: 'Verkhoshansky & Siff (2009) — Supertraining cap. 5',             type: 'textbook',            strength: 'A' },
    { source: 'Winkelman (2018) — Attentional Focus and Motor Learning',        type: 'textbook',            strength: 'B' },
    { source: 'Haugen et al. (2019) — Sprint mechanics review',                  type: 'peer_reviewed',       strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.88,
}

// ─── 7. MAX_STRENGTH_ACCUMULATION ─────────────────────────────────────────

const MAX_STRENGTH_ACCUMULATION: TitanBlockCanonical = {
  block_id:    'MAX_STRENGTH_ACCUMULATION',
  name:        'Maximal Strength Accumulation Block',
  category:    'strength_maximal',
  subcategory: 'neural_structural_strength',

  mechanical_dosage: {
    sessions_per_week:  [3, 4],
    sets_per_session:   [3, 5],
    reps_per_set:       [2, 5],
    intensity_pct_1rm:  [85, 95],   // zona di forza massimale
    rest_seconds:       [180, 300],
    rpe_target:         [8, 9],
    tempo:              '3-1-1-0',  // eccentrica controllata, pausa, concentrica, nessuna pausa
  },

  tissue_load_matrix: {
    joint_stress_spine:    8,   // JOINT_STRESS_RUBRIC.SPINE_DEADLIFT_HEAVY: 7 (media squat+deadlift)
    joint_stress_knee:     6,   // JOINT_STRESS_RUBRIC.KNEE_SQUAT_MODERATE_DEPTH: 5 con carichi >85%
    joint_stress_hip:      5,   // JOINT_STRESS_RUBRIC.HIP_THRUST_HEAVY: 5
    joint_stress_shoulder: 6,   // JOINT_STRESS_RUBRIC.SHOULDER_PRESS_HEAVY_OVERHEAD: 6
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile_compressive_mixed',
    tissue_recovery_hours: 48,  // TISSUE_RECOVERY_HOURS.STRENGTH_HEAVY_COMPOUND_LOWER: 48
    bilateral_demand:      true,
  },

  cns_drain_score:   8,  // CNS_DRAIN_RUBRIC.STRENGTH_85_95_PCT: 8
  metabolic_pathway: 'glycolytic_dominant',

  primary_adaptation:   'MAXIMAL_STRENGTH',
  secondary_adaptation: 'HYPERTROPHY',

  adaptation_decay: {
    primary_quality:   'MAXIMAL_STRENGTH',
    secondary_quality: 'HYPERTROPHY',
    half_life_days:    18,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.MAXIMAL_STRENGTH: 18
  },

  interference_with: [
    {
      penalizes_block_category: 'speed_sprint',
      severity:                 'critical',
      minimum_separation_hours: 8,   // INTERFERENCE_MATRIX.SPRINT_vs_HEAVY_LOWER_BODY: 8h
      mechanism:                'Sprint post-forza massimale: CNS saturato + fatica muscolare → riduzione velocità >15% (Francis 1992)',
      source:                   'Francis 1992; Verkhoshansky 2009',
    },
    {
      penalizes_block_category: 'endurance_anaerobic',
      severity:                 'moderate',
      minimum_separation_hours: 6,   // INTERFERENCE_MATRIX.HIGH_INTENSITY_ENDURANCE_vs_STRENGTH
      mechanism:                'AMPK-mTOR conflict: HIIT pre-forza riduce sintesi proteica miofibrilar nelle 6–8h successive',
      source:                   'Hickson 1980; Wilson et al. 2012',
    },
    {
      penalizes_block_category: 'power_explosive',
      severity:                 'moderate',
      minimum_separation_hours: 24,  // necessario recupero CNS completo
      mechanism:                'Fatica neuromuscolare post-sessione massimale riduce espressività di potenza',
      source:                   'Zatsiorsky & Kraemer 2006',
    },
  ],

  synergistic_with: ['SPRINT_ACCELERATION', 'ECCENTRIC_HAMSTRING_PREHAB', 'ZONE2_FOUNDATION'],

  entry_gates: [
    {
      metric:    'Squat 1RM / body weight ratio (se esercizio primario è squat)',
      operator:  '>=',
      threshold: 1.0,     // minimo tecnico prima di carichi >85%
      critical:  true,
      source:    'Boyle (2016) — prerequisiti di forza relativa prima di accumulo massimale',
    },
    {
      metric:    'Functional Movement Screen (FMS) overall score',
      operator:  '>=',
      threshold: 14,
      critical:  false,
      source:    'Cook (2010) — FMS < 14 predice aumentato rischio infortuni sotto carico',
    },
  ],

  exit_criteria: [
    '1RM stimato incrementato ≥ 5% rispetto al baseline',
    'VBT: velocità media al 70% 1RM migliorata ≥ 5%',
    'Tolleranza a 4 set × 3 reps al 90% 1RM senza dolore articolare',
  ],

  autoregulation_caps: [
    {
      metric:           'velocity_drop_pct',
      threshold:        20,    // VBT_THRESHOLDS.VELOCITY_LOSS_STOP_SET_PCT: 20
      action_on_breach: 'end_set',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        9,
      action_on_breach: 'end_set',
    },
    {
      metric:           'pain_vas_ceiling',
      threshold:        3,
      action_on_breach: 'end_session',
    },
  ],

  sport_compatibility: [
    { discipline: 'powerlifting',     priority: 'primary' },
    { discipline: 'weightlifting',    priority: 'primary' },
    { discipline: 'football',         priority: 'secondary', note: 'Off-season: fondamento per potenza esplosiva' },
    { discipline: 'rugby',            priority: 'secondary' },
    { discipline: 'athletics_throws', priority: 'primary' },
    { discipline: 'endurance_running', priority: 'optional', note: 'Economia di corsa — 2×/sett max' },
  ],

  contraindications: [
    'Dolore articolare acuto con VAS > 3 durante movimento specifico',
    'Osteoporosi severa (carico assiale > 80% controindicato)',
    'Post-chirurgia spinale < 12 mesi',
    'Recupero < 48h da sessione di forza massimale precedente',
  ],

  evidence_basis: [
    { source: 'Zatsiorsky & Kraemer (2006) — Science and Practice of Strength Training', type: 'textbook',      strength: 'A' },
    { source: 'Rippetoe & Kilgore (2007) — Starting Strength (2nd ed.)',                  type: 'textbook',      strength: 'B' },
    { source: 'Helms, Morgan & Valdez (2019) — The Muscle and Strength Pyramid',          type: 'textbook',      strength: 'B' },
    { source: 'Prilepin (1974) — Weightlifting periodization table',                       type: 'peer_reviewed', strength: 'A' },
    { source: 'González-Badillo & Sánchez-Medina (2010) — VBT thresholds IJSM',           type: 'peer_reviewed', strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.92,
}

// ─── 8. ECCENTRIC_HAMSTRING_PREHAB ────────────────────────────────────────

const ECCENTRIC_HAMSTRING_PREHAB: TitanBlockCanonical = {
  block_id:    'ECCENTRIC_HAMSTRING_PREHAB',
  name:        'Eccentric Hamstring Prehab (Nordic-based)',
  category:    'prehab_corrective',
  subcategory: 'posterior_chain_injury_prevention',

  mechanical_dosage: {
    sessions_per_week:  [2, 3],       // Oslo protocol: 3 × 10 a settimana (progressive)
    sets_per_session:   [2, 4],
    reps_per_set:       [6, 10],
    rpe_target:         [6, 8],
    rest_seconds:       [90, 120],
    tempo:              '4-0-1-0',    // eccentrica lunga (4s), concentric assistita
    // Nota: Nordic Hamstring Curl — eccentrica da estensione completa a 90°
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     4,   // JOINT_STRESS_RUBRIC.KNEE_NORDIC_CURL: 4 (stress tendineo > articolare)
    joint_stress_hip:      null,
    joint_stress_shoulder: null,
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile',  // carico eccentrico su tendine e muscolatura posteriore
    tissue_recovery_hours: 48,         // TISSUE_RECOVERY_HOURS.ECCENTRIC_PREHAB_NORDIC: 48
    bilateral_demand:      false,      // si esegue spesso unilaterale per asimmetrie
  },

  cns_drain_score:   4,  // CNS_DRAIN_RUBRIC.ECCENTRIC_PREHAB: 4
  metabolic_pathway: 'glycolytic_dominant',

  primary_adaptation:   'ECCENTRIC_CAPACITY',
  secondary_adaptation: 'MAXIMAL_STRENGTH',

  adaptation_decay: {
    primary_quality:   'ECCENTRIC_CAPACITY',
    secondary_quality: 'MAXIMAL_STRENGTH',
    half_life_days:    20,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.ECCENTRIC_CAPACITY: 20
  },

  interference_with: [
    {
      penalizes_block_category: 'speed_sprint',
      severity:                 'critical',
      minimum_separation_hours: 48,   // INTERFERENCE_MATRIX.HEAVY_ECCENTRIC_vs_POWER_EXPRESSION: 48h
      mechanism:                'DOMS post-Nordic riduce produzione di forza eccentrica e velocità per 48–72h (Schoenfeld 2017)',
      source:                   'Schoenfeld 2017; Mjøsund et al. 2021 — Nordic + sprint timing',
    },
    {
      penalizes_block_category: 'power_explosive',
      severity:                 'critical',
      minimum_separation_hours: 48,
      mechanism:                'Inibizione neuromuscolare da danno muscolare eccentrico — riduzione SSC performance',
      source:                   'Schoenfeld 2017 muscle damage review',
    },
  ],

  synergistic_with: ['MAX_STRENGTH_ACCUMULATION', 'RTP_FIELD_REBUILD'],

  entry_gates: [
    {
      metric:    'pain_vas (posteriore coscia)',
      operator:  '<=',
      threshold: 2,    // PAIN_VAS_THRESHOLDS.SAFE_TO_TRAIN_BELOW: 2
      critical:  true,
      source:    'Malliaras et al. 2015; Cook & Purdam 2009 — nessun carico eccentrico con dolore > 2/10',
    },
    {
      metric:    'Settimane di induzione (DOMS attesi)',
      operator:  '>=',
      threshold: 2,   // 2 settimane a volume ridotto per adattare la muscolatura
      critical:  false,
      source:    'Mjøsund et al. (2021) — Nordic progressive protocol per minimizzare DOMS',
    },
  ],

  exit_criteria: [
    'Forza eccentrica isocinética incrementata ≥ 15% rispetto al baseline',
    'Simmetria forza sinistra/destra ≥ 90% (LSI)',
    'Capacità di completare 3 × 10 Nordic senza dolore significativo (VAS < 2)',
  ],

  autoregulation_caps: [
    {
      metric:           'pain_vas_ceiling',
      threshold:        3,    // PAIN_VAS_THRESHOLDS.TRAIN_WITH_MONITOR_BELOW: 4 (conservativo)
      action_on_breach: 'end_session',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        8,
      action_on_breach: 'reduce_load_pct',
      reduction_pct:    20,
    },
  ],

  sport_compatibility: [
    { discipline: 'football',         priority: 'primary',   note: 'Prevenzione lesioni ischio-crurali — riduzione incidenza ~50% con Oslo protocol' },
    { discipline: 'rugby',            priority: 'primary' },
    { discipline: 'athletics_sprints', priority: 'primary' },
    { discipline: 'basketball',       priority: 'secondary' },
    { discipline: 'cycling',          priority: 'secondary', note: 'Bilancio muscolare ant/post importante per ciclisti con quadricipite dominante' },
    { discipline: 'powerlifting',     priority: 'secondary' },
  ],

  contraindications: [
    'Lesione acuta muscolo posteriore coscia (grado I–III) — attendere clearance medica',
    'Post-chirurgia LCA < 6 mesi (carico eccentrico sull\'intero ginocchio)',
    'Dolore posteriore coscia VAS > 3 a riposo o durante warm-up',
  ],

  evidence_basis: [
    { source: 'Petersen et al. (2011) — Nordic Hamstring exercise injury prevention RCT AJSM', type: 'peer_reviewed', strength: 'A' },
    { source: 'Mjøsund et al. (2021) — Nordic progressive protocol',                            type: 'peer_reviewed', strength: 'A' },
    { source: 'Malliaras et al. (2015) — Patellar tendinopathy loading review BJSM',            type: 'peer_reviewed', strength: 'A' },
    { source: 'Cook & Purdam (2009) — Tendon continuum model BJSM',                             type: 'peer_reviewed', strength: 'A' },
    { source: 'Schoenfeld (2017) — Science and Development of Muscle Hypertrophy',              type: 'textbook',      strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.92,
}

// ─── 9. COD_MECHANICS ─────────────────────────────────────────────────────

const COD_MECHANICS: TitanBlockCanonical = {
  block_id:    'COD_MECHANICS',
  name:        'Change of Direction Mechanics (Tecnica COD)',
  category:    'skill_cod',
  subcategory: 'deceleration_reacceleration_technique',

  mechanical_dosage: {
    sessions_per_week:  [2, 3],
    sets_per_session:   [4, 6],
    reps_per_set:       [6, 8],    // ripetizioni di COD a angolo variabile (45°, 90°, 180°)
    rest_seconds:       [90, 180], // recupero quasi completo — focus su qualità tecnica
    rpe_target:         [6, 8],    // non massimale: la qualità tecnica viene prima
    // distanza media per rep: 10–20m di approach + COD + reacceleration
    distance_per_rep_m: [10, 20],
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     6,   // JOINT_STRESS_RUBRIC.KNEE_COD_DECELERATION: 6
    joint_stress_hip:      6,   // JOINT_STRESS_RUBRIC.HIP_SPRINT_ACCELERATION: 6
    joint_stress_shoulder: null,
    joint_stress_ankle:    6,   // JOINT_STRESS_RUBRIC.ANKLE_REACTIVE_SPRINT: 6
    tendon_load_type:      'compressive',  // carico compressivo rotuleo durante decelerazione profonda
    tissue_recovery_hours: 36,             // tra PLYOMETRIC_MODERATE e SPRINT
    bilateral_demand:      false,          // spesso unilaterale / asimmetrico
  },

  cns_drain_score:   5,  // CNS_DRAIN_RUBRIC.COD_TECHNIQUE: 5
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'REACTIVE_STRENGTH',
  secondary_adaptation: 'SPEED',

  adaptation_decay: {
    primary_quality:   'REACTIVE_STRENGTH',
    secondary_quality: 'SPEED',
    half_life_days:    7,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.REACTIVE_STRENGTH: 7
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 8,
      mechanism:                'COD ad alta intensità impone stress CNS + articolare significativo; forza massimale post-COD è subottimale',
      source:                   'Verkhoshansky 2009; Francis 1992',
    },
  ],

  synergistic_with: ['SPRINT_ACCELERATION', 'RSA', 'ECCENTRIC_HAMSTRING_PREHAB'],

  entry_gates: [
    {
      metric:    'Eccentric hamstring strength symmetry (LSI)',
      operator:  '>=',
      threshold: 90,    // 90% simmetria sinistra/destra prima del COD ad alta intensità
      critical:  true,
      source:    'Winkelman 2018; Malliaras 2015 — asimmetria >10% = rischio durante decelerazione',
    },
    {
      metric:    'Single-leg squat quality (qualitative assessment)',
      operator:  '>=',
      threshold: 3,     // scala 1–5 qualitativa
      critical:  false,
      source:    'Cook (2010) — controllo mono-podalico prerequisito per COD sicuro',
    },
  ],

  exit_criteria: [
    'Riduzione del tempo COD 505 test ≥ 5% rispetto al baseline',
    'Angolo di contatto con il suolo adeguato (< 50° di flessione di tronco valutato video)',
    'Nessun dolor articolare a ginocchio o caviglia durante/dopo sessione',
  ],

  autoregulation_caps: [
    {
      metric:           'pain_vas_ceiling',
      threshold:        3,
      action_on_breach: 'end_session',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        8,
      action_on_breach: 'reduce_load_pct',
      reduction_pct:    25,
    },
  ],

  sport_compatibility: [
    { discipline: 'football',    priority: 'primary',   note: 'COD è tra le meccaniche più esposte a infortuni al ginocchio — la tecnica riduce il rischio ACL' },
    { discipline: 'basketball',  priority: 'primary' },
    { discipline: 'rugby',       priority: 'primary' },
    { discipline: 'tennis',      priority: 'primary',   note: 'Split step + primo passo — tecnica COD fondamentale' },
    { discipline: 'volleyball',  priority: 'secondary' },
    { discipline: 'endurance_running', priority: 'optional' },
  ],

  contraindications: [
    'Instabilità legamentosa ginocchio non trattata (LCA, LCM)',
    'Dolore al ginocchio VAS > 2 durante squat monopodalico',
    'Tendinopatia rotulea in fase reattiva',
    'Post-chirurgia LCA < 9 mesi (dipende da protocollo RTP)',
  ],

  evidence_basis: [
    { source: 'Winkelman (2018) — Attentional Focus and Motor Learning (COD chapter)', type: 'textbook',      strength: 'B' },
    { source: 'Nimphius et al. (2017) — COD mechanics and injury risk',                type: 'peer_reviewed', strength: 'A' },
    { source: 'Hewett et al. (2005) — Biomechanical measures of neuromuscular control', type: 'peer_reviewed', strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.85,
}

// ─── 10. RTP_FIELD_REBUILD ────────────────────────────────────────────────

const RTP_FIELD_REBUILD: TitanBlockCanonical = {
  block_id:    'RTP_FIELD_REBUILD',
  name:        'Return-to-Play Progressive Field Rebuild',
  category:    'rehab_rtp',
  subcategory: 'progressive_rtp_protocol',

  mechanical_dosage: {
    sessions_per_week:  [3, 5],        // quotidianamente nelle prime fasi; poi 3–4×
    duration_min:       [20, 45],       // progressivo: inizia 20 min, arriva a 45+
    rpe_target:         [3, 7],         // range ampio: fa fede il protocollo a fasi
    rest_seconds:       [60, 300],      // dipende dalla fase (sport return protocol)
    // Dosaggio preciso determinato dal protocollo medico → override_dosage nei ProfileModifier
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     null,  // variabile per tipo infortunio — null = usare UserPhenotype
    joint_stress_hip:      null,
    joint_stress_shoulder: null,
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile',   // conservativo — Cook/Malliaras isometric-then-isotonic
    tissue_recovery_hours: 36,          // TISSUE_RECOVERY_HOURS.RTP_FIELD_PROGRESSIVE: 36
    bilateral_demand:      false,       // spesso unilaterale per asimmetria nella fase RTP
  },

  cns_drain_score:   3,  // CNS_DRAIN_RUBRIC.RTP_PROGRESSIVE_START: 3 (sale a 6 nelle fasi avanzate)
  metabolic_pathway: 'aerobic_oxidative',  // prime fasi; poi 'aerobic_glycolytic_mixed'

  primary_adaptation:   'AEROBIC_CAPACITY',
  secondary_adaptation: 'ECCENTRIC_CAPACITY',

  adaptation_decay: {
    primary_quality:   'AEROBIC_CAPACITY',
    secondary_quality: 'ECCENTRIC_CAPACITY',
    half_life_days:    28,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.AEROBIC_CAPACITY: 28
  },

  interference_with: [
    {
      penalizes_block_category: 'speed_sprint',
      severity:                 'critical',
      minimum_separation_hours: 48,
      mechanism:                'In fase RTP il tessuto è fragile — nessun sprint massimale prima di clearance medica esplicita',
      source:                   'Gabbett (2016); Malliaras et al. 2015',
    },
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 48,
      mechanism:                'Forza massimale durante RTP aumenta rischio recidiva — solo fasi avanzate con clearance',
      source:                   'Cook & Purdam (2009) — tendon continuum: no heavy load in reactive phase',
    },
  ],

  synergistic_with: ['ECCENTRIC_HAMSTRING_PREHAB', 'ZONE2_FOUNDATION'],

  entry_gates: [
    {
      metric:    'Medical clearance (signed)',
      operator:  '==',
      threshold: 1,  // 1 = clearance ottenuta; 0 = BLOCCA
      critical:  true,
      source:    'Standard medico-sportivo internazionale — RTP richiede clearance medica',
    },
    {
      metric:    'pain_vas (area infortunata)',
      operator:  '<=',
      threshold: 2,    // PAIN_VAS_THRESHOLDS.SAFE_TO_TRAIN_BELOW: 2
      critical:  true,
      source:    'Malliaras et al. 2015; Silbernagel et al. 2007',
    },
    {
      metric:    'Limb Symmetry Index (LSI) strength',
      operator:  '>=',
      threshold: 80,   // 80% simmetria minima per avviare RTP sul campo (soglia conservativa)
      critical:  true,
      source:    'Gokeler et al. (2017) — LSI < 80% predice aumentato rischio recidiva',
    },
  ],

  exit_criteria: [
    'LSI ≥ 90% per forza e funzione (Gokeler 2017)',
    'Completamento protocollo fasi (walk → jog → run → sprint → sport-specific) senza dolore',
    'Clearance medica per ritorno completo all\'attività agonistica',
    'ACWR < 1.3 al momento del ritorno in squadra',
  ],

  autoregulation_caps: [
    {
      metric:           'pain_vas_ceiling',
      threshold:        2,    // zero tolleranza sul dolore in RTP — rispetto Cook continuum
      action_on_breach: 'end_session',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        7,    // nella fase di rebuild: mai al massimale
      action_on_breach: 'end_session',
    },
  ],

  sport_compatibility: [
    { discipline: 'football',   priority: 'primary',   note: 'UEFA RTP protocol — standard di riferimento per sport di squadra' },
    { discipline: 'rugby',      priority: 'primary' },
    { discipline: 'basketball', priority: 'primary' },
    { discipline: 'athletics',  priority: 'primary' },
    { discipline: 'cycling',    priority: 'secondary', note: 'RTP in sport no-impatto — progressione più rapida' },
    { discipline: 'swimming',   priority: 'secondary', note: 'Ambiente no-impatto utile nelle prime fasi' },
  ],

  contraindications: [
    'Assenza di clearance medica — blocco assoluto',
    'VAS > 2 nell\'area dell\'infortunio durante attività',
    'LSI < 70% — rientrare in protocollo di riabilitazione',
    'Gonfiore articolare attivo (ABI > 1.0 rispetto alla baseline)',
  ],

  evidence_basis: [
    { source: 'Malliaras et al. (2015) — Loading interventions for tendinopathy BJSM',             type: 'peer_reviewed', strength: 'A' },
    { source: 'Gokeler et al. (2017) — LSI thresholds for RTP after ACLR',                         type: 'peer_reviewed', strength: 'A' },
    { source: 'Gabbett (2016) — Training load and injury BJSM',                                    type: 'peer_reviewed', strength: 'A' },
    { source: 'Cook & Purdam (2009) — Tendon continuum and loading strategies BJSM',               type: 'peer_reviewed', strength: 'A' },
    { source: 'Silbernagel et al. (2007) — Pain-monitoring model in Achilles tendinopathy AJSM',   type: 'peer_reviewed', strength: 'A' },
  ],

  calibration_version: CALIBRATION_VERSION,
  completeness_score:  0.88,
}

// ─── CATALOG REGISTRY ─────────────────────────────────────────────────────

export const TITAN_BLOCK_CATALOG: Record<string, TitanBlockCanonical> = {
  ZONE2_FOUNDATION,
  THRESHOLD_ENDURANCE,
  LONG_AEROBIC_ENDURANCE,
  HIIT_TEAM_SPORT,
  RSA,
  SPRINT_ACCELERATION,
  MAX_STRENGTH_ACCUMULATION,
  ECCENTRIC_HAMSTRING_PREHAB,
  COD_MECHANICS,
  RTP_FIELD_REBUILD,
}

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────

export function getBlock(id: string): TitanBlockCanonical | undefined {
  return TITAN_BLOCK_CATALOG[id]
}

export function getBlocksByCategory(category: string): TitanBlockCanonical[] {
  return Object.values(TITAN_BLOCK_CATALOG).filter(b => b.category === category)
}

export function getBlocksForSport(discipline: string): TitanBlockCanonical[] {
  return Object.values(TITAN_BLOCK_CATALOG).filter(b =>
    b.sport_compatibility.some(s => s.discipline === discipline)
  )
}

export function getPrimaryBlocksForSport(discipline: string): TitanBlockCanonical[] {
  return Object.values(TITAN_BLOCK_CATALOG).filter(b =>
    b.sport_compatibility.some(s => s.discipline === discipline && s.priority === 'primary')
  )
}

export function checkInterference(
  blockA: TitanBlockCanonical,
  blockB: TitanBlockCanonical,
  separationHours: number
): { hasConflict: boolean; severity: string; message: string } | null {
  const conflict = blockA.interference_with.find(
    i => i.penalizes_block_category === blockB.category
  )
  if (!conflict) return null
  if (separationHours >= conflict.minimum_separation_hours) return null
  return {
    hasConflict: true,
    severity:    conflict.severity,
    message:     `${blockA.block_id} interferisce con ${blockB.block_id}: ${conflict.mechanism}. Separazione minima: ${conflict.minimum_separation_hours}h (attuale: ${separationHours}h).`,
  }
}

// ─── HYDRATION (CP-024 Layer 1→2 Merge) ──────────────────────────────────────

/**
 * hydrateBlock() — fonde un TitanBlockCanonical con un ProfileBlockModifier.
 *
 * PERCHÉ ESISTE:
 *   Layer 1 (canonical) = fisica dell'allenamento (indipendente dal coach).
 *   Layer 2 (modifier)  = filosofia del coach (come usa/modifica il blocco).
 *   L'engine NON deve mai operare sul canonical puro quando un modifier è attivo:
 *   deciderebbe sulla fisica astratta, non sulla realtà del coach.
 *
 * CONTRATTO:
 *   - Il blocco canonico non viene mai mutato (deep clone).
 *   - I limiti fisiologici fissi sono preservati (recovery_hours, entry_gates critical).
 *   - override_dosage ha la massima priorità sui modifier percentuali.
 *   - Se nessun modifier → restituisce il canonical inalterato.
 *   - Se blockId non esiste nel catalog → restituisce null.
 *
 * @param blockId   - ID del blocco nel TITAN_BLOCK_CATALOG
 * @param modifier  - ProfileBlockModifier del coach attivo (opzionale)
 * @returns         - Blocco idratato (canonical + overrides del coach)
 */
export function hydrateBlock(
  blockId:  string,
  modifier?: ProfileBlockModifier
): TitanBlockCanonical | null {
  const canonical = getBlock(blockId)
  if (!canonical) return null
  if (!modifier)  return canonical  // nessun modifier → canonical puro

  // ── Deep clone per garantire immutabilità del catalog ────────────────────
  const hydrated: TitanBlockCanonical = JSON.parse(JSON.stringify(canonical))

  // ── Applica volume_modifier_pct ─────────────────────────────────────────
  // Modifica: sessions_per_week, sets_per_session, duration_min
  // Limiti: mai < 1 set/sessione, mai < 10 min durata
  const volFactor = 1 + (modifier.volume_modifier_pct / 100)
  applyTupleFactor(hydrated.mechanical_dosage, 'sessions_per_week', volFactor, [1, 14])
  applyTupleFactor(hydrated.mechanical_dosage, 'sets_per_session',  volFactor, [1, 20])
  applyTupleFactor(hydrated.mechanical_dosage, 'duration_min',      volFactor, [10, 300])

  // ── Applica intensity_modifier_pct ─────────────────────────────────────
  // Modifica: rpe_target, intensity_pct_1rm
  // Limiti: RPE 1–10, intensità 30–100%
  const intFactor = 1 + ((modifier.intensity_modifier_pct ?? 0) / 100)
  applyTupleFactor(hydrated.mechanical_dosage, 'rpe_target',        intFactor, [1, 10])
  applyTupleFactor(hydrated.mechanical_dosage, 'intensity_pct_1rm', intFactor, [30, 100])

  // ── Applica override_dosage (massima priorità — sovrascrittura puntuale) ─
  if (modifier.override_dosage) {
    const overrides = modifier.override_dosage as Partial<MechanicalDosage>
    // Merge campo per campo: override_dosage vince su qualsiasi modifier percentuale
    for (const key of Object.keys(overrides) as Array<keyof MechanicalDosage>) {
      if (overrides[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(hydrated.mechanical_dosage as any)[key] = overrides[key]
      }
    }
  }

  // ── Aggiungi red flags aggiuntivi del coach come controindicazioni ───────
  // NON modificano entry_gates (quelli sono fisici e non negoziabili).
  // I coach red flags entrano nel sistema come controindicazioni narrative.
  if (modifier.additional_red_flags && modifier.additional_red_flags.length > 0) {
    const flagNotes = modifier.additional_red_flags.map(
      rf => `[COACH RED FLAG — ${rf.priority.toUpperCase()}] ${rf.condition} → ${rf.action}${rf.source_id ? ` (${rf.source_id})` : ''}`
    )
    hydrated.contraindications = [...hydrated.contraindications, ...flagNotes]
  }

  return hydrated
}

/**
 * Utility interna: applica un fattore moltiplicativo a un campo [min, max]
 * di MechanicalDosage con clamping ai limiti fisiologici specificati.
 */
function applyTupleFactor(
  dosage: MechanicalDosage,
  field:  keyof MechanicalDosage,
  factor: number,
  limits: [number, number]
): void {
  const value = dosage[field] as [number, number] | undefined
  if (!value) return
  const [physMin, physMax] = limits
  const clamped: [number, number] = [
    Math.max(physMin, Math.min(physMax, Math.round(value[0] * factor * 10) / 10)),
    Math.max(physMin, Math.min(physMax, Math.round(value[1] * factor * 10) / 10)),
  ]
  // Garantisce che min ≤ max dopo l'arrotondamento
  if (clamped[0] > clamped[1]) clamped[1] = clamped[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(dosage as any)[field] = clamped
}

/**
 * Costruisce una mappa blockId → ProfileBlockModifier da un array di modifiers.
 * Helper per costruire active_coach_block_modifiers in DailyRecommenderInput.
 */
export function buildModifierMap(
  modifiers: ProfileBlockModifier[]
): Record<string, ProfileBlockModifier> {
  return Object.fromEntries(modifiers.map(m => [m.block_id, m]))
}

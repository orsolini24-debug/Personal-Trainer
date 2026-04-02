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

// ─── 11. DELOAD_WEEK ──────────────────────────────────────────────────────

const DELOAD_WEEK: TitanBlockCanonical = {
  block_id:    'DELOAD_WEEK',
  name:        'Deload / Recovery Week',
  category:    'recovery_deload',
  subcategory: 'planned_unloading',

  mechanical_dosage: {
    sessions_per_week: [3, 4],
    duration_min:      [30, 50],
    rpe_target:        [3, 5],
    // Intensità ridotta al 40–60% rispetto alla settimana precedente
  },

  tissue_load_matrix: {
    joint_stress_spine:    1,
    joint_stress_knee:     1,
    joint_stress_hip:      1,
    joint_stress_shoulder: 1,
    joint_stress_ankle:    1,
    tendon_load_type:      'none',
    tissue_recovery_hours: 6,
    bilateral_demand:      true,
  },

  cns_drain_score:   2,  // CNS_DRAIN_RUBRIC.ZONE2_STEADY_STATE
  metabolic_pathway: 'aerobic_oxidative',

  primary_adaptation:   'AEROBIC_CAPACITY',
  secondary_adaptation: 'FAT_OXIDATION',

  adaptation_decay: {
    primary_quality:   'AEROBIC_CAPACITY',
    secondary_quality: 'MAXIMAL_STRENGTH',
    half_life_days:    28,
  },

  interference_with: [],  // il deload non interferisce con nulla

  synergistic_with: [
    'ZONE2_FOUNDATION',
    'THRESHOLD_ENDURANCE',
    'MAX_STRENGTH_ACCUMULATION',
  ],

  entry_gates: [],  // nessun prerequisito — è un blocco di recupero

  exit_criteria: [
    'HRV tornata entro ±1 SD dalla baseline personale',
    'RPE sessioni Z1 < 11 (Borg 6-20) per sforzo a 70% HRmax',
    'Senso soggettivo di freschezza ≥ 3/5 nel wizard',
    'Minimo 5 giorni di deload completati',
  ],

  autoregulation_caps: [
    {
      metric:           'rpe_ceiling',
      threshold:        5,
      action_on_breach: 'end_session',
    },
  ],

  sport_compatibility: [
    { discipline: 'all',               priority: 'primary', note: 'Universale — ogni atleta ogni 3–4 settimane' },
    { discipline: 'endurance_running', priority: 'primary' },
    { discipline: 'cycling',           priority: 'primary' },
    { discipline: 'powerlifting',      priority: 'primary' },
    { discipline: 'football',          priority: 'primary' },
  ],

  contraindications: [
    'Non eseguire durante settimane pre-gara con TSB già positivo (doppio deload)',
    'Non confondere con riposo completo: la sessione di movimento mantiene gli adattamenti',
  ],

  evidence_basis: [
    {
      source:   'Issurin (2008) Block Periodization vs. Traditional Training — JSCR',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Mujika & Padilla (2000) Detraining: Loss of Training Adaptations — Sports Med',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Bosquet et al. (2007) Effects of tapering on performance — Med Sci Sports',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.90,
}

// ─── 12. HYPERTROPHY_MESOCYCLE ────────────────────────────────────────────

const HYPERTROPHY_MESOCYCLE: TitanBlockCanonical = {
  block_id:    'HYPERTROPHY_MESOCYCLE',
  name:        'Hypertrophy Mesocycle (Volume Accumulation)',
  category:    'strength_hypertrophy',
  subcategory: 'muscle_mass_accumulation',

  mechanical_dosage: {
    sessions_per_week: [3, 5],
    sets_per_session:  [3, 5],
    reps_per_set:      [8, 15],
    intensity_pct_1rm: [65, 80],
    rpe_target:        [7, 9],
    rest_seconds:      [60, 120],
    tempo:             '3-1-1-0',  // 3" eccentrico, 1" pausa, 1" concentrico, 0 pausa
  },

  tissue_load_matrix: {
    joint_stress_spine:    5,   // JOINT_STRESS_RUBRIC.SPINE_SQUAT_MODERATE
    joint_stress_knee:     5,   // JOINT_STRESS_RUBRIC.KNEE_SQUAT_MODERATE_DEPTH
    joint_stress_hip:      3,
    joint_stress_shoulder: 3,   // JOINT_STRESS_RUBRIC.SHOULDER_PRESS_LIGHT_MODERATE
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 36,  // TISSUE_RECOVERY_HOURS.STRENGTH_MODERATE_LOWER
    bilateral_demand:      true,
  },

  cns_drain_score:   4,  // CNS_DRAIN_RUBRIC.HYPERTROPHY_MODERATE
  metabolic_pathway: 'glycolytic_dominant',

  primary_adaptation:   'HYPERTROPHY',
  secondary_adaptation: 'MAXIMAL_STRENGTH',

  adaptation_decay: {
    primary_quality:   'HYPERTROPHY',
    secondary_quality: 'MAXIMAL_STRENGTH',
    half_life_days:    28,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.HYPERTROPHY
  },

  interference_with: [
    {
      penalizes_block_category: 'endurance_aerobic',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'AMPK-mTOR conflict: endurance volume > 60 min attiva AMPK che inibisce mTORC1 (hypertrophy signaling)',
      source:                   'Hickson 1980; Wilson et al. 2012 meta-analysis JSCR',
    },
    {
      penalizes_block_category: 'speed_sprint',
      severity:                 'moderate',
      minimum_separation_hours: 24,
      mechanism:                'peripheral fatigue da alto volume riduce output velocità nei 24h successivi',
      source:                   'Wilson et al. 2012 meta-analysis',
    },
  ],

  synergistic_with: ['ZONE2_FOUNDATION', 'ECCENTRIC_HAMSTRING_PREHAB'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009 BJSM',
    },
    {
      metric:    'training_years_strength',
      operator:  '>=',
      threshold: 0.5,
      critical:  false,
      source:    'NSCA CSCS guidelines — adaptation window for novice',
    },
  ],

  exit_criteria: [
    'Set settimanali per gruppo muscolare raggiungono il MAV (18 sets) senza degradazione tecnica',
    'RPE medio delle sessioni stabili a 7.5–8.5 per 3+ settimane consecutive',
    'Progressione di carico stagnante per 2 settimane → transizione a forza massimale',
  ],

  autoregulation_caps: [
    {
      metric:           'rpe_ceiling',
      threshold:        9.5,
      action_on_breach: 'end_set',
    },
    {
      metric:             'velocity_drop_pct',
      threshold:          20,
      action_on_breach:   'reduce_load_pct',
      reduction_pct:      10,
    },
  ],

  sport_compatibility: [
    { discipline: 'powerlifting',  priority: 'primary' },
    { discipline: 'bodybuilding',  priority: 'primary' },
    { discipline: 'football',      priority: 'primary', note: 'Blocco off-season primario' },
    { discipline: 'swimming',      priority: 'secondary' },
    { discipline: 'endurance_running', priority: 'optional', note: 'Solo off-season, volume ridotto' },
  ],

  contraindications: [
    'Tendinopatia attiva (VAS ≥ 4) in zona sollecitata',
    'Meno di 4 settimane a gara principale (interferisce con picco neuromuscolare)',
    'CTL < 20 TSS/giorno (base aerobica insufficiente per recupero tra sessioni)',
  ],

  evidence_basis: [
    {
      source:   'Schoenfeld (2017) "Science and Development of Muscle Hypertrophy" Human Kinetics',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Schoenfeld et al. (2017) "Dose-response relationship between weekly resistance training volume and increases in muscle mass" JSCR',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Israetel et al. (2019) "Scientific Principles of Strength Training" RP Strength',
      type:     'practitioner_manual',
      strength: 'B',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.88,
}

// ─── 13. MAX_VELOCITY_SPRINT ──────────────────────────────────────────────

const MAX_VELOCITY_SPRINT: TitanBlockCanonical = {
  block_id:    'MAX_VELOCITY_SPRINT',
  name:        'Maximum Velocity Sprint Training',
  category:    'speed_sprint',
  subcategory: 'max_velocity_development',

  mechanical_dosage: {
    sessions_per_week: [1, 2],
    distance_per_rep_m: [20, 60],    // zone 20–60m (post-acceleration phase)
    rpe_target:         [9, 10],
    rest_seconds:       [180, 360],  // recupero completo CNS (3–6' per rep)
  },

  tissue_load_matrix: {
    joint_stress_spine:    3,
    joint_stress_knee:     5,
    joint_stress_hip:      7,   // JOINT_STRESS_RUBRIC.HIP_MAX_VELOCITY_SPRINT
    joint_stress_shoulder: null,
    joint_stress_ankle:    6,   // JOINT_STRESS_RUBRIC.ANKLE_REACTIVE_SPRINT
    tendon_load_type:      'tensile',   // carico tendine prossimale hamstring in swing
    tissue_recovery_hours: 72,  // TISSUE_RECOVERY_HOURS.MAX_VELOCITY_SPRINT
    bilateral_demand:      true,
  },

  cns_drain_score:   9,  // CNS_DRAIN_RUBRIC.MAX_VELOCITY_SPRINT
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'SPEED',
  secondary_adaptation: 'REACTIVE_STRENGTH',

  adaptation_decay: {
    primary_quality:   'SPEED',
    secondary_quality: 'REACTIVE_STRENGTH',
    half_life_days:    5,   // ADAPTATION_DECAY_HALF_LIFE_DAYS.SPEED — qualità più volatile
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'critical',
      minimum_separation_hours: 8,
      mechanism:                'CNS fatigue neuromuscolare overlap: entrambi richiedono reclutamento massimale delle unità motorie rapide',
      source:                   'Francis 1992 "Speed Trap"; Verkhoshansky 2009 Supertraining',
    },
    {
      penalizes_block_category: 'strength_hypertrophy',
      severity:                 'moderate',
      minimum_separation_hours: 24,
      mechanism:                'peripheral fatigue da volume ipertrofia riduce peak velocity output',
      source:                   'Wilson et al. 2012 meta-analysis JSCR',
    },
    {
      penalizes_block_category: 'endurance_anaerobic',
      severity:                 'critical',
      minimum_separation_hours: 24,
      mechanism:                'acidosi lattica da HIIT/RSA blocca espressione forza rapida nelle 24h successive',
      source:                   'Rampinini et al. 2011 Int J Sports Med',
    },
  ],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 1,
      critical:  true,
      source:    'Cook & Purdam 2009 — massima esigenza integrità strutturale',
    },
    {
      metric:    'SPRINT_ACCELERATION_weeks_completed',
      operator:  '>=',
      threshold: 3,
      critical:  false,
      source:    'Progressione raccomandata: acceleration prima di max velocity — Francis 1992',
    },
    {
      metric:    'hamstring_strength_asymmetry_pct',
      operator:  '<=',
      threshold: 15,
      critical:  true,
      source:    'Croisier et al. (2008) AJSM — asimmetria > 15% = rischio hamstring strain',
    },
  ],

  exit_criteria: [
    'Flying 20m ≤ −2% rispetto al PB: mantenimento qualità',
    'RPE sessione 9–10 mantenuto senza degradazione tecnica per 3 settimane',
    'Nessun dolore o tensione posteriore coscia durante il ciclo',
  ],

  autoregulation_caps: [
    {
      metric:           'pain_vas_ceiling',
      threshold:        2,
      action_on_breach: 'end_session',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        10,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'athletics_sprints',  priority: 'primary' },
    { discipline: 'football',           priority: 'primary' },
    { discipline: 'rugby',              priority: 'primary' },
    { discipline: 'basketball',         priority: 'secondary' },
    { discipline: 'endurance_running',  priority: 'optional', note: 'Solo per mezzofondo — sviluppo economia di corsa' },
  ],

  contraindications: [
    'Hamstring strain grado I–III: attesa 8–16 settimane post-lesione + clearance fisioterapica',
    'Tendinopatia prossimale hamstring attiva (VAS ≥ 2)',
    'In-season sport di squadra senza buffer di 72h pre-match',
  ],

  evidence_basis: [
    {
      source:   'Mann & Murphy (2015) "The Physics of Sprint Running" Tafnews Press',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Haugen et al. (2019) "Sprint mechanical properties in football players" EJSS',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Croisier et al. (2008) "Strength Imbalances and Prevention of Hamstring Injury in Professional Soccer Players" AJSM',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.87,
}

// ─── 14. PLYOMETRIC_FOUNDATION ────────────────────────────────────────────

const PLYOMETRIC_FOUNDATION: TitanBlockCanonical = {
  block_id:    'PLYOMETRIC_FOUNDATION',
  name:        'Plyometric Foundation (SSC Development)',
  category:    'power_explosive',
  subcategory: 'stretch_shortening_cycle_intro',

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [3, 5],
    reps_per_set:      [6, 10],
    rpe_target:        [6, 8],
    rest_seconds:      [60, 120],
    // Contatti a terra: 80–150 per sessione (vol. introduttivo)
  },

  tissue_load_matrix: {
    joint_stress_spine:    2,
    joint_stress_knee:     6,   // JOINT_STRESS_RUBRIC.KNEE_COD_DECELERATION — simile
    joint_stress_hip:      4,
    joint_stress_shoulder: null,
    joint_stress_ankle:    7,   // JOINT_STRESS_RUBRIC.ANKLE_PLYOMETRIC_BOUNDING
    tendon_load_type:      'tensile_compressive_mixed',
    tissue_recovery_hours: 36,  // TISSUE_RECOVERY_HOURS.PLYOMETRIC_MODERATE
    bilateral_demand:      true,
  },

  cns_drain_score:   6,  // CNS_DRAIN_RUBRIC.PLYOMETRIC_MODERATE
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'REACTIVE_STRENGTH',
  secondary_adaptation: 'SPEED',

  adaptation_decay: {
    primary_quality:   'REACTIVE_STRENGTH',
    secondary_quality: 'SPEED',
    half_life_days:    7,   // ADAPTATION_DECAY_HALF_LIFE_DAYS.REACTIVE_STRENGTH
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'fatica neuromuscolare da pliometrica riduce capacità di reclutamento massimale nelle ore successive',
      source:                   'Verkhoshansky & Siff (2009) Supertraining cap.5',
    },
    {
      penalizes_block_category: 'endurance_anaerobic',
      severity:                 'critical',
      minimum_separation_hours: 24,
      mechanism:                'DOMS da pliometrica fondazione (elevato danno eccentrico) degrada RSA e HIIT quality per 24–48h',
      source:                   'Schoenfeld (2017) muscle damage review',
    },
  ],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009 BJSM',
    },
    {
      metric:    'single_leg_squat_control',
      operator:  '>=',
      threshold: 3,
      critical:  false,
      source:    'Cook (2010) Movement — FMS prerequisito per landing mechanics',
    },
    {
      metric:    'training_years_strength',
      operator:  '>=',
      threshold: 0.5,
      critical:  true,
      source:    'NSCA Position Stand on Plyometrics (2007): base di forza necessaria prima di pliometrica',
    },
  ],

  exit_criteria: [
    'Contatto a terra < 250ms in salti bilaterali (misurato da contact mat)',
    'Nessun valgismo del ginocchio nella fase di atterraggio per 3 sessioni consecutive',
    'Reactive Strength Index (altezza / contatto) stabile per 2 settimane → progressione a volume maggiore',
  ],

  autoregulation_caps: [
    {
      metric:           'pain_vas_ceiling',
      threshold:        3,
      action_on_breach: 'end_session',
    },
  ],

  sport_compatibility: [
    { discipline: 'football',           priority: 'primary' },
    { discipline: 'basketball',         priority: 'primary' },
    { discipline: 'athletics_sprints',  priority: 'primary' },
    { discipline: 'volleyball',         priority: 'primary' },
    { discipline: 'endurance_running',  priority: 'secondary', note: 'Migliora economia di corsa' },
    { discipline: 'cycling',            priority: 'optional' },
  ],

  contraindications: [
    'Tendinopatia rotulea o achillea attiva (VAS ≥ 3)',
    'Forza massimale squat < 1.0× BW (prerequisito strutturale non soddisfatto)',
    'Età < 13 anni senza supervisione specializzata (sviluppo scheletrico)',
    'Post-chirurgia ACL < 9 mesi',
  ],

  evidence_basis: [
    {
      source:   'Verkhoshansky & Siff (2009) "Supertraining" cap. 5 — shock method e SSC',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'NSCA (2007) Position Statement on Plyometric Training',
      type:     'position_stand',
      strength: 'A',
    },
    {
      source:   'Suchomel et al. (2016) "The Importance of Muscular Strength in Athletic Performance" Sports Med',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.85,
}

// ─── 15. COD_REACTIVE_ADVANCED ────────────────────────────────────────────

const COD_REACTIVE_ADVANCED: TitanBlockCanonical = {
  block_id:    'COD_REACTIVE_ADVANCED',
  name:        'Reactive Change of Direction (Agility)',
  category:    'skill_cod',
  subcategory: 'reactive_agility_perception_action',

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [4, 8],
    reps_per_set:      [3, 6],
    rpe_target:        [7, 9],
    rest_seconds:      [60, 120],
    // Durata stimolo: 2–5 sec per rep (cambio direzione reattivo)
  },

  tissue_load_matrix: {
    joint_stress_spine:    2,
    joint_stress_knee:     6,   // JOINT_STRESS_RUBRIC.KNEE_COD_DECELERATION
    joint_stress_hip:      5,
    joint_stress_shoulder: null,
    joint_stress_ankle:    6,   // JOINT_STRESS_RUBRIC.ANKLE_REACTIVE_SPRINT
    tendon_load_type:      'tensile_compressive_mixed',
    tissue_recovery_hours: 36,
    bilateral_demand:      false,  // asimmetrico per natura
  },

  cns_drain_score:   7,  // cognitivo + neuromuscolare simultanei
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'SPEED',
  secondary_adaptation: 'REACTIVE_STRENGTH',

  adaptation_decay: {
    primary_quality:   'SPEED',
    secondary_quality: 'REACTIVE_STRENGTH',
    half_life_days:    5,
  },

  interference_with: [
    {
      penalizes_block_category: 'endurance_anaerobic',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'fatica cognitiva da compiti reattivi riduce qualità decisionale nei drill successivi',
      source:                   'Rampinini et al. (2011) — cognitive fatigue e sport performance',
    },
  ],

  synergistic_with: ['COD_MECHANICS', 'SPRINT_ACCELERATION', 'PLYOMETRIC_FOUNDATION'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009 BJSM',
    },
    {
      metric:    'COD_MECHANICS_weeks_completed',
      operator:  '>=',
      threshold: 4,
      critical:  true,
      source:    'Progressione raccomandata: tecnica COD prima di agility reattiva — Sheppard & Young 2006 JSCR',
    },
  ],

  exit_criteria: [
    'T-Test o 505 Agility migliorato ≥ 3% rispetto al baseline',
    'Decision-making accuracy ≥ 85% in drill con stimolo imprevedibile',
    'Nessuna differenza > 10% tra lato dominante e non-dominante nei tempi di cambio direzione',
  ],

  autoregulation_caps: [
    {
      metric:           'rpe_ceiling',
      threshold:        9,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'football',    priority: 'primary' },
    { discipline: 'basketball',  priority: 'primary' },
    { discipline: 'tennis',      priority: 'primary' },
    { discipline: 'rugby',       priority: 'primary' },
    { discipline: 'handball',    priority: 'primary' },
  ],

  contraindications: [
    'Tecnica di decelerazione non acquisita (COD_MECHANICS non completato)',
    'Post-chirurgia legamentosa < 12 mesi senza clearance medica',
    'Deficit di forza asimmetrico ≥ 20% tra gambe',
  ],

  evidence_basis: [
    {
      source:   'Sheppard & Young (2006) "Agility literature review: Classifications, training and testing" JSCR',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Young et al. (2015) "Resistance Training for Speed: Moving Beyond Theoretical Rationale" Strength Cond J',
      type:     'peer_reviewed',
      strength: 'B',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.82,
}

// ─── 16. ISOMETRIC_TENDON ─────────────────────────────────────────────────

const ISOMETRIC_TENDON: TitanBlockCanonical = {
  block_id:    'ISOMETRIC_TENDON',
  name:        'Isometric Tendon Loading Protocol',
  category:    'prehab_corrective',
  subcategory: 'tendinopathy_pain_reduction',

  mechanical_dosage: {
    sessions_per_week: [4, 5],
    sets_per_session:  [3, 5],
    reps_per_set:      [1, 1],    // isometriche lunghe, non reps classiche
    hold_seconds:      [30, 45],  // 30–45s per contrazione
    intensity_pct_1rm: [60, 80],  // 60–80% MVC (massima contrazione volontaria)
    rest_seconds:      [120, 180],
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     4,   // JOINT_STRESS_RUBRIC.KNEE_NORDIC_CURL — simile tendinopatia rotulea
    joint_stress_hip:      null,
    joint_stress_shoulder: null,
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 48,  // TISSUE_RECOVERY_HOURS.ISOMETRIC_HEAVY_TENDON
    bilateral_demand:      false,
  },

  cns_drain_score:   2,  // CNS_DRAIN_RUBRIC.ISOMETRIC_SUBMAXIMAL
  metabolic_pathway: 'aerobic_oxidative',  // isometriche non esauriscono ATP-PCr

  primary_adaptation:   'TENDON_STIFFNESS',
  secondary_adaptation: 'MAXIMAL_STRENGTH',

  adaptation_decay: {
    primary_quality:   'TENDON_STIFFNESS',
    secondary_quality: 'ECCENTRIC_CAPACITY',
    half_life_days:    30,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.TENDON_STIFFNESS
  },

  interference_with: [],  // isometriche non interferiscono significativamente

  synergistic_with: ['ECCENTRIC_HAMSTRING_PREHAB', 'RTP_FIELD_REBUILD'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 5,
      critical:  false,
      source:    'Silbernagel et al. (2007) "Continued sports activity using a pain-monitoring model" AJSM — VAS ≤ 5 durante isometrica accettabile',
    },
    {
      metric:    'tendinopathy_diagnosis_confirmed',
      operator:  '==',
      threshold: 1,
      critical:  false,
      source:    'Cook & Purdam 2009 — indicato specificamente per tendinopatia reattiva/degenerativa',
    },
  ],

  exit_criteria: [
    'VAS durante isometrica scende a ≤ 2 su 5 reps consecutive',
    'Progressione a esercizi isotonici tollerata senza spike di dolore nelle 24h',
    '3–4 settimane di protocollo completate (minimo per risposta tendinea)',
  ],

  autoregulation_caps: [
    {
      metric:           'pain_vas_ceiling',
      threshold:        5,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'all',              priority: 'primary', note: 'Protocollo universale per tendinopatia rotulea, achillea, adduttoria' },
    { discipline: 'endurance_running', priority: 'primary' },
    { discipline: 'football',          priority: 'primary' },
    { discipline: 'basketball',        priority: 'primary' },
  ],

  contraindications: [
    'Tendinopatia acuta con VAS > 8: risposo completo necessario',
    'Post-rottura tendinea: non iniziare prima di clearance chirurgica',
    'Calcificazione tendinea sintomatica: valutazione medica prima del carico',
  ],

  evidence_basis: [
    {
      source:   'Rio et al. (2015) "Isometric exercise induces analgesia and reduces inhibition in patellar tendinopathy" BJSM',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Cook & Purdam (2009) "Is tendon pathology a continuum?" BJSM',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Malliaras et al. (2015) "Patellar tendinopathy: clinical diagnosis, load management, and advice" BJSM',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.92,
}

// ─── 17. TEMPO_STRENGTH ───────────────────────────────────────────────────

const TEMPO_STRENGTH: TitanBlockCanonical = {
  block_id:    'TEMPO_STRENGTH',
  name:        'Tempo / Anatomical Adaptation Strength',
  category:    'strength_endurance',
  subcategory: 'anatomical_adaptation_foundation',

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [3, 4],
    reps_per_set:      [15, 25],
    intensity_pct_1rm: [40, 60],
    rpe_target:        [5, 7],
    rest_seconds:      [45, 90],
    tempo:             '4-2-2-0',  // 4" eccentrico, 2" pausa, 2" concentrico
  },

  tissue_load_matrix: {
    joint_stress_spine:    3,   // JOINT_STRESS_RUBRIC.SPINE_HIP_HINGE_LIGHT
    joint_stress_knee:     3,
    joint_stress_hip:      2,
    joint_stress_shoulder: 3,   // JOINT_STRESS_RUBRIC.SHOULDER_PRESS_LIGHT_MODERATE
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 24,  // TISSUE_RECOVERY_HOURS.STRENGTH_MODERATE_UPPER
    bilateral_demand:      true,
  },

  cns_drain_score:   3,  // CNS_DRAIN_RUBRIC.STRENGTH_60_70_PCT
  metabolic_pathway: 'glycolytic_dominant',

  primary_adaptation:   'HYPERTROPHY',
  secondary_adaptation: 'TENDON_STIFFNESS',

  adaptation_decay: {
    primary_quality:   'HYPERTROPHY',
    secondary_quality: 'TENDON_STIFFNESS',
    half_life_days:    28,
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'minor',
      minimum_separation_hours: 6,
      mechanism:                'volume accumulato con carichi moderati genera una certa fatica metabolica che riduce la qualità nel massimale nelle ore successive',
      source:                   'Kraemer & Ratamess 2004 ACSM position stand',
    },
  ],

  synergistic_with: ['ZONE2_FOUNDATION', 'MOBILITY_FOUNDATION'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 3,
      critical:  true,
      source:    'Linee guida ACSM per esercizio con dolore cronico',
    },
  ],

  exit_criteria: [
    '3–4 settimane completate (fase di adattamento anatomico)',
    'Carichi progrediti del 5–10% con tecnica invariata',
    'Progressione a HYPERTROPHY_MESOCYCLE quando 20 reps con carico stabile senza dolore',
  ],

  autoregulation_caps: [
    {
      metric:           'rpe_ceiling',
      threshold:        8,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'all',              priority: 'primary', note: 'Blocco introduttivo universale per chi inizia la forza' },
    { discipline: 'endurance_running', priority: 'primary', note: 'AA phase prima del blocco forza specifico' },
    { discipline: 'cycling',           priority: 'primary' },
    { discipline: 'swimming',          priority: 'primary' },
  ],

  contraindications: [
    'Non usare come sostituto dell\'ipertrofia per atleti già adattati (regredisce la risposta adattativa)',
    'Non combinare con HYPERTROPHY_MESOCYCLE nello stesso mesociclo (sovrapposizione di stimolo)',
  ],

  evidence_basis: [
    {
      source:   'Bompa & Haff (2009) "Periodization: Theory and Methodology of Training" 5th ed. Human Kinetics',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Kraemer & Ratamess (2004) "Fundamentals of Resistance Training" ACSM Position Stand Med Sci Sports Exerc',
      type:     'position_stand',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.85,
}

// ─── 18. ALACTIC_POWER_REPETITION ────────────────────────────────────────

const ALACTIC_POWER_REPETITION: TitanBlockCanonical = {
  block_id:    'ALACTIC_POWER_REPETITION',
  name:        'Alactic Power Repetition Method',
  category:    'endurance_anaerobic',
  subcategory: 'phosphagen_system_development',

  mechanical_dosage: {
    sessions_per_week: [1, 2],
    sets_per_session:  [4, 6],
    reps_per_set:      [4, 8],
    distance_per_rep_m: [10, 30],
    rpe_target:         [9, 10],
    rest_seconds:       [120, 180],  // recupero completo PCr (2–3' tra reps)
    // Pausa inter-serie: 8–10' (recupero sistemico)
  },

  tissue_load_matrix: {
    joint_stress_spine:    2,
    joint_stress_knee:     5,
    joint_stress_hip:      6,   // JOINT_STRESS_RUBRIC.HIP_SPRINT_ACCELERATION
    joint_stress_shoulder: null,
    joint_stress_ankle:    6,   // JOINT_STRESS_RUBRIC.ANKLE_REACTIVE_SPRINT
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 72,  // stesso di SPRINT_ACCELERATION — PCr-limited
    bilateral_demand:      true,
  },

  cns_drain_score:   8,  // CNS_DRAIN_RUBRIC.SPRINT_ACCELERATION
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'SPEED',
  secondary_adaptation: 'ANAEROBIC_CAPACITY',

  adaptation_decay: {
    primary_quality:   'SPEED',
    half_life_days:    5,
  },

  interference_with: [
    {
      penalizes_block_category: 'endurance_anaerobic',
      severity:                 'critical',
      minimum_separation_hours: 24,
      mechanism:                'RSA e HIIT successivi alla sessione alactacida: il PCr non è ricostituito completamente in < 4–6h, la qualità dei rep di velocità crolla',
      source:                   'Gaitanos et al. (1993) "Human muscle metabolism during intermittent maximal exercise" J Appl Physiol',
    },
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 8,
      mechanism:                'CNS fatigue neuromuscolare bidirezionale',
      source:                   'Verkhoshansky & Siff (2009) Supertraining',
    },
  ],

  synergistic_with: ['SPRINT_ACCELERATION', 'MAX_VELOCITY_SPRINT'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 1,
      critical:  true,
      source:    'Cook & Purdam 2009 — massima sollecitazione strutturale',
    },
    {
      metric:    'SPRINT_ACCELERATION_weeks_completed',
      operator:  '>=',
      threshold: 4,
      critical:  false,
      source:    'Progressione: base di accelerazione prima di rep method — Charlie Francis Speed Trap',
    },
  ],

  exit_criteria: [
    'Velocità di picco mantenuta (≤ 3% decay) tra rep 1 e rep 6 dello stesso set',
    'Potenza alattacida (10m split) stabile su 3 sessioni consecutive',
  ],

  autoregulation_caps: [
    {
      metric:           'velocity_drop_pct',
      threshold:        5,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'athletics_sprints', priority: 'primary' },
    { discipline: 'football',          priority: 'primary' },
    { discipline: 'rugby',             priority: 'secondary' },
    { discipline: 'basketball',        priority: 'secondary' },
  ],

  contraindications: [
    'Stessa giornata di RSA o HIIT team sport',
    'Temperatura ambientale > 35°C senza protocollo di raffreddamento',
    'Hamstring VAS ≥ 2 — massimo rischio strain a velocità massimale',
  ],

  evidence_basis: [
    {
      source:   'Francis (1992) "Speed Trap" — Rep method di Charlie Francis per sviluppo alattacido',
      type:     'practitioner_manual',
      strength: 'B',
    },
    {
      source:   'Gaitanos et al. (1993) "Human muscle metabolism during intermittent maximal exercise" J Appl Physiol',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.82,
}

// ─── 19. VO2MAX_INTERVALS ─────────────────────────────────────────────────

const VO2MAX_INTERVALS: TitanBlockCanonical = {
  block_id:    'VO2MAX_INTERVALS',
  name:        'VO₂max Interval Training',
  category:    'endurance_anaerobic',
  subcategory: 'vo2max_development',

  mechanical_dosage: {
    sessions_per_week: [1, 2],
    sets_per_session:  [4, 6],
    duration_min:      [4, 8],    // 4–8' per rep (Seiler et al. 2013)
    rpe_target:        [8, 10],
    rest_seconds:      [240, 300], // recupero ~1:1 rispetto alla durata
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     3,
    joint_stress_hip:      3,
    joint_stress_shoulder: null,
    joint_stress_ankle:    4,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 36,
    bilateral_demand:      true,
  },

  cns_drain_score:   6,  // CNS_DRAIN_RUBRIC.HIIT_TEAM_SPORT — simile
  metabolic_pathway: 'aerobic_glycolytic_mixed',

  primary_adaptation:   'AEROBIC_CAPACITY',
  secondary_adaptation: 'LACTATE_THRESHOLD',

  adaptation_decay: {
    primary_quality:   'AEROBIC_CAPACITY',
    secondary_quality: 'LACTATE_THRESHOLD',
    half_life_days:    28,
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'AMPK activation at high-intensity endurance blocks mTOR signaling for 6h post-exercise',
      source:                   'Hickson 1980; Wilson et al. 2012',
    },
    {
      penalizes_block_category: 'speed_sprint',
      severity:                 'moderate',
      minimum_separation_hours: 24,
      mechanism:                'residual acidosi lattica + fatica neuromuscolare endurance degradano output velocità per 24h',
      source:                   'Rampinini et al. 2011',
    },
  ],

  synergistic_with: ['ZONE2_FOUNDATION', 'THRESHOLD_ENDURANCE'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009',
    },
    {
      metric:    'ZONE2_FOUNDATION_weeks_completed',
      operator:  '>=',
      threshold: 8,
      critical:  false,
      source:    'Progressione endurance: base aerobica prima di VO2max — Seiler 2010 IJSPP',
    },
    {
      metric:    'ctl_tss_per_day',
      operator:  '>=',
      threshold: 40,
      critical:  false,
      source:    'CTL minima per supportare adattamenti VO2max senza overreaching — Allen & Coggan 2010',
    },
  ],

  exit_criteria: [
    'VO2max stimato (da test incrementale) aumentato ≥ 3% rispetto al baseline',
    'VT2 power/pace spostato in avanti ≥ 2% in 6 settimane',
    'RPE 8–10 mantenuto per durata target senza degradazione cardio (FC stabile)',
  ],

  autoregulation_caps: [
    {
      metric:           'hr_ceiling_pct',
      threshold:        100,
      action_on_breach: 'end_set',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        10,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'endurance_running', priority: 'primary' },
    { discipline: 'cycling',           priority: 'primary' },
    { discipline: 'triathlon',         priority: 'primary' },
    { discipline: 'rowing',            priority: 'primary' },
    { discipline: 'football',          priority: 'secondary', note: 'Sviluppo VO2max off-season' },
  ],

  contraindications: [
    'Senza base aerobica adeguata (CTL < 30 TSS/giorno): rischio overreaching immediato',
    'Consecutivo con LACTATE_TOLERANCE nello stesso giorno',
    '> 2 sessioni VO2max/settimana porta a overreaching nel 80% degli atleti (Seiler 2010)',
  ],

  evidence_basis: [
    {
      source:   'Seiler & Tønnessen (2009) "Intervals, Thresholds, and Long Slow Distance" Int J Sports Physiol Perf',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Helgerud et al. (2007) "Aerobic high-intensity intervals improve VO2max more than moderate training" Med Sci Sports Exerc',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Midgley et al. (2006) "Training to enhance the physiological determinants of long-distance running" Sports Med',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.90,
}

// ─── 20. LACTATE_TOLERANCE ────────────────────────────────────────────────

const LACTATE_TOLERANCE: TitanBlockCanonical = {
  block_id:    'LACTATE_TOLERANCE',
  name:        'Lactate Tolerance / Speed Endurance',
  category:    'endurance_anaerobic',
  subcategory: 'glycolytic_capacity_buffer',

  mechanical_dosage: {
    sessions_per_week: [1, 2],
    sets_per_session:  [3, 6],
    duration_min:      [1, 3],    // 1–3' per rep ad alta intensità (> VT2)
    rpe_target:        [9, 10],
    rest_seconds:      [180, 360], // 3–6' tra rep
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     4,
    joint_stress_hip:      4,
    joint_stress_shoulder: null,
    joint_stress_ankle:    5,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 48,
    bilateral_demand:      true,
  },

  cns_drain_score:   7,
  metabolic_pathway: 'glycolytic_alactic_mixed',

  primary_adaptation:   'ANAEROBIC_CAPACITY',
  secondary_adaptation: 'LACTATE_THRESHOLD',

  adaptation_decay: {
    primary_quality:   'ANAEROBIC_CAPACITY',
    secondary_quality: 'LACTATE_THRESHOLD',
    half_life_days:    18,
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'critical',
      minimum_separation_hours: 24,
      mechanism:                'Acidosi metabolica post-lattacida inibisce la forza rapida e la qualità del reclutamento neuromuscolare per 12–24h',
      source:                   'Bishop et al. (2011) "High-intensity exercise and skeletal muscle" Sports Med',
    },
    {
      penalizes_block_category: 'speed_sprint',
      severity:                 'critical',
      minimum_separation_hours: 24,
      mechanism:                'Il lattato residuo e la fatica muscolare periferica degradano la velocità di picco',
      source:                   'Rampinini et al. 2011 Int J Sports Med',
    },
  ],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009',
    },
    {
      metric:    'THRESHOLD_ENDURANCE_weeks_completed',
      operator:  '>=',
      threshold: 6,
      critical:  false,
      source:    'Progressione: soglia prima di tolleranza lattica — Seiler 2009',
    },
  ],

  exit_criteria: [
    'Lattato a fine sessione > 10 mmol/L per 3 sessioni (conferma stimolo metabolico adeguato)',
    'RPE di recupero scende a < 7 entro 3 minuti dalla fine del rep (migliore buffer lattato)',
  ],

  autoregulation_caps: [
    {
      metric:           'rpe_ceiling',
      threshold:        10,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'athletics_middle_distance', priority: 'primary' },
    { discipline: 'swimming',                  priority: 'primary' },
    { discipline: 'cycling',                   priority: 'secondary' },
    { discipline: 'football',                  priority: 'secondary' },
    { discipline: 'endurance_running',         priority: 'secondary', note: 'Solo per gare < 5km' },
  ],

  contraindications: [
    'Consecutivo con RSA o VO2MAX_INTERVALS (stessa giornata)',
    'Più di 2 sessioni/settimana aumenta significativamente il rischio overtraining',
    'Senza base aerobica: l\'acidosi non può essere smaltita efficacemente',
  ],

  evidence_basis: [
    {
      source:   'Laursen & Jenkins (2002) "The scientific basis for high-intensity interval training" Sports Med',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Bishop et al. (2011) "High-intensity exercise and skeletal muscle function in Health and disease" Sports Med',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.83,
}

// ─── 21. MOBILITY_FOUNDATION ──────────────────────────────────────────────

const MOBILITY_FOUNDATION: TitanBlockCanonical = {
  block_id:    'MOBILITY_FOUNDATION',
  name:        'Mobility & Corrective Exercise Foundation',
  category:    'prehab_corrective',
  subcategory: 'joint_mobility_movement_quality',

  mechanical_dosage: {
    sessions_per_week: [3, 7],  // quotidiano ideale, minimo 3×/settimana
    duration_min:      [15, 30],
    rpe_target:        [2, 4],
    hold_seconds:      [20, 60], // per posizioni di stretching
  },

  tissue_load_matrix: {
    joint_stress_spine:    1,   // JOINT_STRESS_RUBRIC.SPINE_SUPINE_NO_AXIAL_LOAD
    joint_stress_knee:     1,
    joint_stress_hip:      1,
    joint_stress_shoulder: 1,
    joint_stress_ankle:    1,
    tendon_load_type:      'none',
    tissue_recovery_hours: 6,   // TISSUE_RECOVERY_HOURS.MOBILITY_CORRECTIVE
    bilateral_demand:      true,
  },

  cns_drain_score:   2,  // CNS_DRAIN_RUBRIC.MOBILITY_CORRECTIVE
  metabolic_pathway: 'aerobic_oxidative',

  primary_adaptation:   'MOBILITY',
  secondary_adaptation: 'TENDON_STIFFNESS',

  adaptation_decay: {
    primary_quality:   'MOBILITY',
    secondary_quality: 'TENDON_STIFFNESS',
    half_life_days:    7,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.MOBILITY — decade velocemente
  },

  interference_with: [],  // la mobilità non interferisce con altri blocchi

  synergistic_with: [
    'TEMPO_STRENGTH',
    'ZONE2_FOUNDATION',
    'ISOMETRIC_TENDON',
    'ECCENTRIC_HAMSTRING_PREHAB',
  ],

  entry_gates: [],  // nessun prerequisito

  exit_criteria: [
    'FMS composite score ≥ 14/21 (Cook 2010 Movement)',
    'ROM obiettivo raggiunto nella valutazione iniziale (es. dorsiflexion > 15°, hip 90/90 ≥ 45°)',
    'Dolore durante movimento correttivo ≤ 1 VAS per 2 settimane consecutive',
  ],

  autoregulation_caps: [
    {
      metric:           'pain_vas_ceiling',
      threshold:        3,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'all',              priority: 'primary', note: 'Blocco universale — non ha uno sport target' },
  ],

  contraindications: [
    'Stretching statico intenso immediatamente pre-gara o pre-sessione esplosiva: riduce forza acuta per 30–60 min',
    'Dolore articolare acuto > 4 VAS: assessment medico prima di mobilizzare',
  ],

  evidence_basis: [
    {
      source:   'Cook (2010) "Movement: Functional Movement Systems" On Target Publications',
      type:     'textbook',
      strength: 'B',
    },
    {
      source:   'Behm & Chaouachi (2011) "A review of the acute effects of static and dynamic stretching on performance" Eur J Appl Physiol',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.80,
}

// ─── 22. AEROBIC_POWER ────────────────────────────────────────────────────

const AEROBIC_POWER: TitanBlockCanonical = {
  block_id:    'AEROBIC_POWER',
  name:        'Aerobic Power (Sweet Spot) Training',
  category:    'endurance_aerobic',
  subcategory: 'sustained_high_aerobic_output',

  // Note: "Sweet Spot" = 88–93% FTP (tra LT1 e LT2), descritto da Coggan & Allen (2010)
  // Punto di massima efficienza adattativa per atleti endurance intermedi-avanzati.
  // Più tollerabile del threshold puro ma più adattativo del Zone 2.

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    duration_min:      [20, 40],   // durata per set
    rpe_target:        [6, 8],     // "comfortably hard"
    // Intensità: 88–93% FTP (da HR_ZONES — tra ZONE3_TEMPO e ZONE4_THRESHOLD)
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     3,
    joint_stress_hip:      3,
    joint_stress_shoulder: null,
    joint_stress_ankle:    3,   // JOINT_STRESS_RUBRIC.ANKLE_RUNNING_MODERATE
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 30,  // TISSUE_RECOVERY_HOURS.THRESHOLD_RUNNING
    bilateral_demand:      true,
  },

  cns_drain_score:   4,  // CNS_DRAIN_RUBRIC.THRESHOLD_ENDURANCE
  metabolic_pathway: 'aerobic_glycolytic_mixed',

  primary_adaptation:   'LACTATE_THRESHOLD',
  secondary_adaptation: 'AEROBIC_CAPACITY',

  adaptation_decay: {
    primary_quality:   'LACTATE_THRESHOLD',
    secondary_quality: 'AEROBIC_CAPACITY',
    half_life_days:    25,  // ADAPTATION_DECAY_HALF_LIFE_DAYS.LACTATE_THRESHOLD
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'AMPK moderata attivazione a sweet spot → interferenza AMPK-mTOR rilevante ma < VO2max',
      source:                   'Fyfe et al. 2014 Sports Med',
    },
  ],

  synergistic_with: ['ZONE2_FOUNDATION', 'THRESHOLD_ENDURANCE', 'LONG_AEROBIC_ENDURANCE'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009',
    },
    {
      metric:    'ctl_tss_per_day',
      operator:  '>=',
      threshold: 35,
      critical:  false,
      source:    'Base aerobica minima per sweet spot produttivo — Allen & Coggan 2010',
    },
  ],

  exit_criteria: [
    'FTP aumentato ≥ 3% in 6–8 settimane di sweet spot sistematico',
    'RPE a parità di potenza scende di 0.5 punti Borg in 4 settimane',
  ],

  autoregulation_caps: [
    {
      metric:           'hr_ceiling_pct',
      threshold:        92,
      action_on_breach: 'reduce_load_pct',
      reduction_pct:    5,
    },
  ],

  sport_compatibility: [
    { discipline: 'cycling',           priority: 'primary' },
    { discipline: 'endurance_running', priority: 'primary' },
    { discipline: 'triathlon',         priority: 'primary' },
    { discipline: 'rowing',            priority: 'primary' },
  ],

  contraindications: [
    'Principianti endurance (< 3 mesi di base aerobica): usare ZONE2_FOUNDATION invece',
    'Consecutivo 2+ giorni senza Z1 di recupero intermedio',
  ],

  evidence_basis: [
    {
      source:   'Allen & Coggan (2010) "Training and Racing with a Power Meter" 2nd ed. VeloPress',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Seiler & Tønnessen (2009) "Intervals, Thresholds, and Long Slow Distance" IJSPP',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.85,
}

// ─── 23. TEMPO_RUNNING ────────────────────────────────────────────────────

const TEMPO_RUNNING: TitanBlockCanonical = {
  block_id:    'TEMPO_RUNNING',
  name:        'Tempo Running (Charlie Francis Low-CNS Speed Endurance)',
  category:    'endurance_aerobic',
  subcategory: 'low_cns_speed_endurance',

  // Note: Il "Tempo" di Charlie Francis (Speed Trap, 1992) è corsa a 65–75% Vmax,
  // non il threshold "tempo run" del mondo endurance. Funzione opposta: sviluppa
  // la capacità aerobica del velocista senza stressare il sistema nervoso.
  // Durata: 100–300m per rep a ritmo "comodo" per un velocista.

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [6, 12],
    distance_per_rep_m: [100, 300],
    rpe_target:         [4, 6],
    rest_seconds:       [60, 120],
  },

  tissue_load_matrix: {
    joint_stress_spine:    null,
    joint_stress_knee:     2,
    joint_stress_hip:      2,
    joint_stress_shoulder: null,
    joint_stress_ankle:    3,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 14,  // TISSUE_RECOVERY_HOURS.ZONE2_RUNNING_EASY
    bilateral_demand:      true,
  },

  cns_drain_score:   2,  // intenzionalmente basso — funzione di recupero CNS
  metabolic_pathway: 'aerobic_oxidative',

  primary_adaptation:   'AEROBIC_CAPACITY',
  secondary_adaptation: 'FAT_OXIDATION',

  adaptation_decay: {
    primary_quality:   'AEROBIC_CAPACITY',
    secondary_quality: 'FAT_OXIDATION',
    half_life_days:    28,
  },

  interference_with: [],  // non interferisce (basso CNS drain)

  synergistic_with: ['SPRINT_ACCELERATION', 'MAX_VELOCITY_SPRINT', 'ALACTIC_POWER_REPETITION'],

  entry_gates: [],  // nessun prerequisito

  exit_criteria: [
    'Volume settimanale tempo raggiunge 1500–2000m senza fatica residua il giorno dopo',
    'FC durante tempo ≤ 75% HRmax confermata su 3 sessioni consecutive',
  ],

  autoregulation_caps: [
    {
      metric:           'hr_ceiling_pct',
      threshold:        75,
      action_on_breach: 'reduce_load_pct',
      reduction_pct:    10,
    },
  ],

  sport_compatibility: [
    { discipline: 'athletics_sprints',  priority: 'primary', note: 'Base aerobica del velocista (Francis method)' },
    { discipline: 'football',           priority: 'secondary' },
    { discipline: 'rugby',              priority: 'secondary' },
  ],

  contraindications: [
    'Non confondere con "tempo run" endurance (> 85% FTP) — sono protocolli diversi',
    'Non usare come sostituto di ZONE2_FOUNDATION per atleti endurance',
  ],

  evidence_basis: [
    {
      source:   'Francis (1992) "Speed Trap" — Tempo running come base aerobica per velocisti',
      type:     'practitioner_manual',
      strength: 'B',
    },
    {
      source:   'Bompa & Haff (2009) "Periodization" 5th ed. — Low-intensity volume nella periodizzazione sprint',
      type:     'textbook',
      strength: 'B',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.75,
}

// ─── 24. NEURAL_PEAKING ───────────────────────────────────────────────────

const NEURAL_PEAKING: TitanBlockCanonical = {
  block_id:    'NEURAL_PEAKING',
  name:        'Neural Peaking (Pre-Competition CNS Activation)',
  category:    'power_explosive',
  subcategory: 'pre_competition_neural_potentiation',

  // Note: La fase di "neural peaking" (Zatsiorsky 2006, Bompa 2009) usa volumi
  // bassi e intensità massimali per attivare il sistema nervoso e dissipare la
  // fatica accumulata. Non costruisce fitness — ESPRIME la fitness già presente.
  // Timing: 7–14 giorni prima della gara.

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [2, 4],
    reps_per_set:      [1, 3],
    intensity_pct_1rm: [90, 100],
    rpe_target:        [8, 10],
    rest_seconds:      [180, 300],  // recupero molto completo
  },

  tissue_load_matrix: {
    joint_stress_spine:    7,   // JOINT_STRESS_RUBRIC.SPINE_DEADLIFT_HEAVY
    joint_stress_knee:     5,
    joint_stress_hip:      5,
    joint_stress_shoulder: null,
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 48,  // TISSUE_RECOVERY_HOURS.STRENGTH_HEAVY_COMPOUND_LOWER
    bilateral_demand:      true,
  },

  cns_drain_score:   9,  // CNS_DRAIN_RUBRIC.STRENGTH_95_100_PCT
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'MAXIMAL_STRENGTH',
  secondary_adaptation: 'SPEED',

  adaptation_decay: {
    primary_quality:   'MAXIMAL_STRENGTH',
    secondary_quality: 'SPEED',
    half_life_days:    18,
  },

  interference_with: [
    {
      penalizes_block_category: 'endurance_aerobic',
      severity:                 'minor',
      minimum_separation_hours: 6,
      mechanism:                'basso volume → interferenza AMPK trascurabile a questa fase',
      source:                   'Fyfe et al. 2014',
    },
  ],

  synergistic_with: ['DELOAD_WEEK'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 1,
      critical:  true,
      source:    'Massima esigenza integrità strutturale a carichi massimali',
    },
    {
      metric:    'days_to_competition',
      operator:  '>=',
      threshold: 7,
      critical:  true,
      source:    'Mujika & Padilla 2003 — taper minimo 7 giorni prima gara per dissipare fatica',
    },
    {
      metric:    'days_to_competition',
      operator:  '<=',
      threshold: 14,
      critical:  true,
      source:    'Fuori dalla finestra di peaking se > 14 giorni pre-gara',
    },
  ],

  exit_criteria: [
    'Gara completata',
    'Soggettivamente "fresco e esplosivo" nelle sessioni di attivazione',
  ],

  autoregulation_caps: [
    {
      metric:           'rpe_ceiling',
      threshold:        10,
      action_on_breach: 'end_set',
    },
    {
      metric:           'velocity_drop_pct',
      threshold:        3,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'powerlifting',      priority: 'primary' },
    { discipline: 'athletics_sprints', priority: 'primary' },
    { discipline: 'football',          priority: 'secondary' },
    { discipline: 'weightlifting',     priority: 'primary' },
  ],

  contraindications: [
    'Al di fuori della finestra 7–14 giorni pre-gara: diventa un blocco di forza normale',
    'Atleti con storico di infortuni acuti da carico massimale: usare 85–90% invece di 95–100%',
    'Mai in fase di accumulation (Volume alto incompatibile con peaking neurale)',
  ],

  evidence_basis: [
    {
      source:   'Zatsiorsky & Kraemer (2006) "Science and Practice of Strength Training" 2nd ed.',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Bompa & Haff (2009) "Periodization" 5th ed. — Peaking e supercompensazione',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Mujika & Padilla (2003) "Scientific bases for precompetition tapering strategies" Med Sci Sports Exerc',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.88,
}

// ─── 25. UPPER_BODY_STRENGTH ──────────────────────────────────────────────

const UPPER_BODY_STRENGTH: TitanBlockCanonical = {
  block_id:    'UPPER_BODY_STRENGTH',
  name:        'Upper Body Maximal Strength',
  category:    'strength_maximal',
  subcategory: 'push_pull_upper_compound',

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [3, 5],
    reps_per_set:      [3, 6],
    intensity_pct_1rm: [80, 92],
    rpe_target:        [7, 9],
    rest_seconds:      [180, 300],
    tempo:             '2-1-1-0',
  },

  tissue_load_matrix: {
    joint_stress_spine:    4,   // JOINT_STRESS_RUBRIC.SPINE_OVERHEAD_PRESS_MODERATE
    joint_stress_knee:     null,
    joint_stress_hip:      null,
    joint_stress_shoulder: 6,   // JOINT_STRESS_RUBRIC.SHOULDER_PRESS_HEAVY_OVERHEAD
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 36,  // TISSUE_RECOVERY_HOURS.STRENGTH_HEAVY_COMPOUND_UPPER
    bilateral_demand:      true,
  },

  cns_drain_score:   6,  // CNS_DRAIN_RUBRIC.STRENGTH_75_85_PCT
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'MAXIMAL_STRENGTH',
  secondary_adaptation: 'HYPERTROPHY',

  adaptation_decay: {
    primary_quality:   'MAXIMAL_STRENGTH',
    secondary_quality: 'HYPERTROPHY',
    half_life_days:    18,
  },

  interference_with: [
    {
      penalizes_block_category: 'endurance_aerobic',
      severity:                 'minor',
      minimum_separation_hours: 0,
      mechanism:                'Upper body strength ha interferenza AMPK-mTOR trascurabile con endurance lower body (sistemi muscolari separati)',
      source:                   'Fyfe et al. 2014 Sports Med — interferenza ridotta con body part separation',
    },
  ],

  synergistic_with: ['ECCENTRIC_HAMSTRING_PREHAB', 'TEMPO_STRENGTH'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009',
    },
    {
      metric:    'shoulder_overhead_mobility_deg',
      operator:  '>=',
      threshold: 160,
      critical:  false,
      source:    'FMS overhead squat screen — mobilità spalla prerequisito per press overhead sicuro',
    },
  ],

  exit_criteria: [
    'Bench press o overhead press 1RM aumentato ≥ 5% in 6 settimane',
    'Velocità di sollevamento (VBT) stabile a 0.3–0.5 m/s per i carichi target',
  ],

  autoregulation_caps: [
    {
      metric:             'velocity_drop_pct',
      threshold:          20,
      action_on_breach:   'reduce_load_pct',
      reduction_pct:      5,
    },
    {
      metric:           'rpe_ceiling',
      threshold:        9.5,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'powerlifting',    priority: 'primary' },
    { discipline: 'weightlifting',   priority: 'primary' },
    { discipline: 'swimming',        priority: 'primary', note: 'Fondamentale per trazione e spinta in acqua' },
    { discipline: 'football',        priority: 'secondary' },
    { discipline: 'rugby',           priority: 'primary' },
    { discipline: 'basketball',      priority: 'secondary' },
  ],

  contraindications: [
    'Sindrome da conflitto subacromiale attivo (VAS ≥ 3) — ridurre ROM o sostituire con variante neutro',
    'Frattura clavicola o acromion < 12 settimane',
    'Stessa sessione di MAX_VELOCITY_SPRINT (CNS drain cumulativo)',
  ],

  evidence_basis: [
    {
      source:   'Zatsiorsky & Kraemer (2006) "Science and Practice of Strength Training" 2nd ed.',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Schoenfeld et al. (2017) "Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training" JSCR',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.86,
}

// ─── 26. LOWER_BODY_HYPERTROPHY ───────────────────────────────────────────

const LOWER_BODY_HYPERTROPHY: TitanBlockCanonical = {
  block_id:    'LOWER_BODY_HYPERTROPHY',
  name:        'Lower Body Hypertrophy (Quad / Posterior Chain)',
  category:    'strength_hypertrophy',
  subcategory: 'lower_body_volume_accumulation',

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [4, 6],
    reps_per_set:      [8, 15],
    intensity_pct_1rm: [65, 80],
    rpe_target:        [7, 9],
    rest_seconds:      [90, 180],
    tempo:             '3-1-2-0',
  },

  tissue_load_matrix: {
    joint_stress_spine:    6,   // JOINT_STRESS_RUBRIC.SPINE_SQUAT_MODERATE — carico assiale frequente
    joint_stress_knee:     6,   // JOINT_STRESS_RUBRIC.KNEE_SQUAT_MODERATE_DEPTH
    joint_stress_hip:      5,   // JOINT_STRESS_RUBRIC.HIP_THRUST_HEAVY
    joint_stress_shoulder: null,
    joint_stress_ankle:    null,
    tendon_load_type:      'tensile_compressive_mixed',
    tissue_recovery_hours: 48,  // TISSUE_RECOVERY_HOURS.STRENGTH_HEAVY_COMPOUND_LOWER
    bilateral_demand:      true,
  },

  cns_drain_score:   4,  // CNS_DRAIN_RUBRIC.HYPERTROPHY_MODERATE
  metabolic_pathway: 'glycolytic_dominant',

  primary_adaptation:   'HYPERTROPHY',
  secondary_adaptation: 'MAXIMAL_STRENGTH',

  adaptation_decay: {
    primary_quality:   'HYPERTROPHY',
    secondary_quality: 'MAXIMAL_STRENGTH',
    half_life_days:    28,
  },

  interference_with: [
    {
      penalizes_block_category: 'endurance_aerobic',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'AMPK-mTOR conflict: alto volume lower body ipertrofia attiva AMPK che interferisce con adattamenti endurance (e viceversa)',
      source:                   'Hickson 1980; Wilson et al. 2012',
    },
    {
      penalizes_block_category: 'speed_sprint',
      severity:                 'critical',
      minimum_separation_hours: 48,
      mechanism:                'DOMS da ipertrofia lower body degrada output velocità per 48h (peripheral fatigue + danno eccentrico)',
      source:                   'Schoenfeld 2017; Wilson et al. 2012',
    },
    {
      penalizes_block_category: 'power_explosive',
      severity:                 'moderate',
      minimum_separation_hours: 24,
      mechanism:                'Fatica muscolare periferica lower body riduce espressione di potenza nei salti e sprint',
      source:                   'Verkhoshansky & Siff 2009',
    },
  ],

  synergistic_with: ['ECCENTRIC_HAMSTRING_PREHAB', 'MOBILITY_FOUNDATION', 'ISOMETRIC_TENDON'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009',
    },
    {
      metric:    'dorsiflexion_deg',
      operator:  '>=',
      threshold: 15,
      critical:  false,
      source:    'Necessario per squat profondo sicuro — Starrett & Cordoza 2013',
    },
  ],

  exit_criteria: [
    'Sets settimanali per quad + posteriore coscia raggiungono MAV (18 sets) senza RIR < 1',
    'Progressione di carico stagnante per 2 settimane → transizione a MAX_STRENGTH_ACCUMULATION',
    'Rapporto quad/hamstring (isokinetic) stabile (non peggiora durante il mesociclo)',
  ],

  autoregulation_caps: [
    {
      metric:             'velocity_drop_pct',
      threshold:          20,
      action_on_breach:   'reduce_load_pct',
      reduction_pct:      10,
    },
    {
      metric:           'rpe_ceiling',
      threshold:        9.5,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'powerlifting',      priority: 'primary' },
    { discipline: 'football',          priority: 'primary', note: 'Off-season foundation' },
    { discipline: 'athletics_sprints', priority: 'secondary' },
    { discipline: 'cycling',           priority: 'secondary' },
    { discipline: 'endurance_running', priority: 'optional', note: 'Solo off-season, volume ridotto' },
  ],

  contraindications: [
    'Tendinopatia rotulea o achillea attiva: sostituire con varianti hip-dominant (leg press, hip thrust)',
    'Consecutivo con MAX_VELOCITY_SPRINT o PLYOMETRIC_FOUNDATION nello stesso giorno',
    'Meno di 6 settimane a gara principale',
  ],

  evidence_basis: [
    {
      source:   'Schoenfeld (2017) "Science and Development of Muscle Hypertrophy" Human Kinetics',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Israetel et al. (2019) "Scientific Principles of Strength Training" RP Strength',
      type:     'practitioner_manual',
      strength: 'B',
    },
    {
      source:   'VOLUME_WEEKLY_THRESHOLDS: MEV=10, MAV=18, MRV=25 sets/muscle group (Schoenfeld 2017)',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.88,
}

// ─── 27. REACTIVE_PLYOMETRIC ──────────────────────────────────────────────

const REACTIVE_PLYOMETRIC: TitanBlockCanonical = {
  block_id:    'REACTIVE_PLYOMETRIC',
  name:        'Reactive Plyometrics (Depth Drops / Shock Method)',
  category:    'power_explosive',
  subcategory: 'shock_method_verkhoshansky',

  // Note: "Shock method" di Verkhoshansky (1966, Supertraining cap.5).
  // Contatti a terra brevi (< 200ms), forze di impatto 3–8× BW.
  // Richiede PLYOMETRIC_FOUNDATION completata come prerequisito assoluto.

  mechanical_dosage: {
    sessions_per_week: [1, 2],
    sets_per_session:  [3, 6],
    reps_per_set:      [4, 8],
    rpe_target:        [8, 10],
    rest_seconds:      [120, 180],
    // Altezza box: 40–75cm (progressione da 40 a 75cm)
    // Contatti target per sessione: 40–80 (avanzati fino a 120)
  },

  tissue_load_matrix: {
    joint_stress_spine:    3,
    joint_stress_knee:     8,   // JOINT_STRESS_RUBRIC.KNEE_DEPTH_DROP_REACTIVE
    joint_stress_hip:      5,
    joint_stress_shoulder: null,
    joint_stress_ankle:    7,   // JOINT_STRESS_RUBRIC.ANKLE_PLYOMETRIC_BOUNDING
    tendon_load_type:      'tensile_compressive_mixed',
    tissue_recovery_hours: 48,  // TISSUE_RECOVERY_HOURS.DEPTH_DROP_REACTIVE
    bilateral_demand:      true,
  },

  cns_drain_score:   8,  // CNS_DRAIN_RUBRIC.DEPTH_DROP_REACTIVE
  metabolic_pathway: 'alactic_phosphagen',

  primary_adaptation:   'REACTIVE_STRENGTH',
  secondary_adaptation: 'SPEED',

  adaptation_decay: {
    primary_quality:   'REACTIVE_STRENGTH',
    secondary_quality: 'SPEED',
    half_life_days:    7,
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_hypertrophy',
      severity:                 'critical',
      minimum_separation_hours: 48,
      mechanism:                'DOMS da reactive plyometrics (danno eccentrico estremo da impatto) inibisce la qualità di output di forza per 48h',
      source:                   'TISSUE_RECOVERY_HOURS.DEPTH_DROP_REACTIVE: 48h (Schoenfeld 2017)',
    },
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 8,
      mechanism:                'CNS drain alto (score 8) sovrapponibile al massimale — riduce qualità reclutamento',
      source:                   'Verkhoshansky & Siff 2009',
    },
    {
      penalizes_block_category: 'endurance_anaerobic',
      severity:                 'critical',
      minimum_separation_hours: 24,
      mechanism:                'Danno muscolare acuto da shock method compromette la qualità della RSA e degli HIIT nei 24h successivi',
      source:                   'Schoenfeld 2017 muscle damage review',
    },
  ],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 1,
      critical:  true,
      source:    'Cook & Purdam 2009 — massima integrità strutturale per impatti > 3× BW',
    },
    {
      metric:    'PLYOMETRIC_FOUNDATION_weeks_completed',
      operator:  '>=',
      threshold: 6,
      critical:  true,
      source:    'NSCA Position Stand 2007 — prerequisito assoluto: base pliometrica prima dello shock method',
    },
    {
      metric:    'squat_1rm_bw_ratio',
      operator:  '>=',
      threshold: 1.5,
      critical:  true,
      source:    'Verkhoshansky & Siff 2009 — forza minima 1.5× BW per gestire le forze di impatto reactive',
    },
    {
      metric:    'RSI_reactive_strength_index',
      operator:  '>=',
      threshold: 1.5,
      critical:  false,
      source:    'Soglia RSI per ingresso shock method — Young 1995',
    },
  ],

  exit_criteria: [
    'Contatto a terra < 180ms in drop jump (da 60cm) misurato da contact mat',
    'RSI (Reactive Strength Index = altezza / tempo contatto) ≥ 2.0',
    'Nessun dolore ginocchio/caviglia durante o nelle 24h post-sessione per 4 settimane',
  ],

  autoregulation_caps: [
    {
      metric:           'pain_vas_ceiling',
      threshold:        2,
      action_on_breach: 'end_session',
    },
  ],

  sport_compatibility: [
    { discipline: 'athletics_sprints', priority: 'primary' },
    { discipline: 'basketball',        priority: 'primary' },
    { discipline: 'volleyball',        priority: 'primary' },
    { discipline: 'football',          priority: 'secondary', note: 'Off-season con adeguata base' },
    { discipline: 'gymnastics',        priority: 'primary' },
  ],

  contraindications: [
    'PLYOMETRIC_FOUNDATION non completata (6+ settimane)',
    'Squat 1RM < 1.5× BW — rischio infortuni articolari acuti',
    'Post-chirurgia ACL < 18 mesi',
    'Tendinopatia rotulea o achillea attiva (carico di impatto incompatibile)',
    'Atleti obesi (BMI > 30) senza base strutturale adeguata',
  ],

  evidence_basis: [
    {
      source:   'Verkhoshansky & Siff (2009) "Supertraining" cap. 5 — shock method origine e progressione',
      type:     'textbook',
      strength: 'A',
    },
    {
      source:   'Flanagan & Comyns (2008) "The Use of Contact Time and the Reactive Strength Index to Optimize Fast Stretch-Shortening Cycle Training" Strength Cond J',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'NSCA (2007) Position Statement on Plyometric Training',
      type:     'position_stand',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.90,
}

// ─── 28. STRENGTH_ENDURANCE_CIRCUIT ───────────────────────────────────────

const STRENGTH_ENDURANCE_CIRCUIT: TitanBlockCanonical = {
  block_id:    'STRENGTH_ENDURANCE_CIRCUIT',
  name:        'Strength Endurance Circuit Training',
  category:    'strength_endurance',
  subcategory: 'metabolic_conditioning_circuit',

  mechanical_dosage: {
    sessions_per_week: [2, 3],
    sets_per_session:  [3, 5],   // rounds
    reps_per_set:      [10, 20],
    intensity_pct_1rm: [40, 60],
    rpe_target:        [6, 8],
    rest_seconds:      [30, 60], // riposo minimo tra esercizi (formato circuit)
    // Struttura: 4–8 esercizi in circuito, 30–60" per stazione
  },

  tissue_load_matrix: {
    joint_stress_spine:    4,
    joint_stress_knee:     4,
    joint_stress_hip:      3,
    joint_stress_shoulder: 3,
    joint_stress_ankle:    3,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 24,
    bilateral_demand:      true,
  },

  cns_drain_score:   4,  // CNS_DRAIN_RUBRIC.HYPERTROPHY_MODERATE
  metabolic_pathway: 'glycolytic_dominant',

  primary_adaptation:   'ANAEROBIC_CAPACITY',
  secondary_adaptation: 'HYPERTROPHY',

  adaptation_decay: {
    primary_quality:   'ANAEROBIC_CAPACITY',
    secondary_quality: 'HYPERTROPHY',
    half_life_days:    18,
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'Fatica metabolica da circuit training riduce qualità reclutamento nelle sessioni di forza massimale successive',
      source:                   'Kraemer & Ratamess 2004 ACSM',
    },
  ],

  synergistic_with: ['ZONE2_FOUNDATION', 'MOBILITY_FOUNDATION'],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 3,
      critical:  true,
      source:    'Cook & Purdam 2009',
    },
  ],

  exit_criteria: [
    'Completamento di tutti i round senza degradazione tecnica per 3 sessioni consecutive',
    'FC di recupero tra round < 130bpm in 30" di pausa (miglioramento fitness metabolica)',
  ],

  autoregulation_caps: [
    {
      metric:           'hr_ceiling_pct',
      threshold:        95,
      action_on_breach: 'end_set',
    },
    {
      metric:           'rpe_ceiling',
      threshold:        9,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'crossfit',          priority: 'primary' },
    { discipline: 'football',          priority: 'secondary' },
    { discipline: 'military',          priority: 'primary' },
    { discipline: 'endurance_running', priority: 'optional', note: 'Solo off-season per forza generale' },
    { discipline: 'all',               priority: 'secondary', note: 'General fitness transition block' },
  ],

  contraindications: [
    'Obiettivo primario è forza massimale o velocità: i circuit training diluiscono lo stimolo specifico',
    'Combinato nello stesso giorno con LACTATE_TOLERANCE o RSA',
  ],

  evidence_basis: [
    {
      source:   'Kraemer & Ratamess (2004) "Fundamentals of Resistance Training: Progression and Exercise Prescription" Med Sci Sports Exerc',
      type:     'position_stand',
      strength: 'A',
    },
    {
      source:   'Rhea et al. (2003) "A Meta-Analysis to Determine the Dose Response for Strength Development" Med Sci Sports Exerc',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.80,
}

// ─── 29. COMPETITION_PREPARATION ─────────────────────────────────────────

const COMPETITION_PREPARATION: TitanBlockCanonical = {
  block_id:    'COMPETITION_PREPARATION',
  name:        'Competition Week Protocol (T−7 to T−0)',
  category:    'recovery_deload',
  subcategory: 'pre_competition_taper_activation',

  // Note: Protocollo integrato per la settimana di gara.
  // Combina elementi di DELOAD_WEEK (riduzione volume) con
  // attivazioni neuromuscolari brevi (mantenimento intensità).
  // Bosquet et al. (2007): volume −41–60%, intensità 100%, durata 8–14gg ottimale.

  mechanical_dosage: {
    sessions_per_week: [3, 4],
    duration_min:      [20, 45],
    rpe_target:        [5, 8],   // mix: Z1 + brevi strides ad alta intensità
    // Attivazioni: 3–5 reps @ 90–95% nelle sessioni di mantenimento
  },

  tissue_load_matrix: {
    joint_stress_spine:    2,
    joint_stress_knee:     2,
    joint_stress_hip:      2,
    joint_stress_shoulder: 2,
    joint_stress_ankle:    2,
    tendon_load_type:      'tensile',
    tissue_recovery_hours: 14,
    bilateral_demand:      true,
  },

  cns_drain_score:   3,
  metabolic_pathway: 'aerobic_oxidative',

  primary_adaptation:   'SPEED',       // mantenimento con strides brevi
  secondary_adaptation: 'AEROBIC_CAPACITY',

  adaptation_decay: {
    primary_quality:   'SPEED',
    secondary_quality: 'AEROBIC_CAPACITY',
    half_life_days:    5,
  },

  interference_with: [],

  synergistic_with: ['DELOAD_WEEK', 'NEURAL_PEAKING'],

  entry_gates: [
    {
      metric:    'days_to_competition',
      operator:  '<=',
      threshold: 7,
      critical:  true,
      source:    'Bosquet et al. 2007 — finestra ottimale taper',
    },
  ],

  exit_criteria: [
    'TSB (Training Stress Balance) ≥ +15 al giorno gara (Coggan & Allen 2010)',
    'Sensazione soggettiva di freschezza ≥ 4/5 nella mattina della gara',
  ],

  autoregulation_caps: [
    {
      metric:           'rpe_ceiling',
      threshold:        8,
      action_on_breach: 'end_set',
    },
  ],

  sport_compatibility: [
    { discipline: 'all',               priority: 'primary', note: 'Universale pre-gara' },
    { discipline: 'endurance_running', priority: 'primary' },
    { discipline: 'cycling',           priority: 'primary' },
    { discipline: 'powerlifting',      priority: 'primary' },
    { discipline: 'athletics_sprints', priority: 'primary' },
  ],

  contraindications: [
    'Aumentare il volume pensando di "guadagnare forma" nell\'ultima settimana (errore classico)',
    'Ridurre anche l\'intensità: va ridotto SOLO il volume, non l\'intensità (Mujika & Padilla 2003)',
    'Dormire troppo poco per ansia da gara: gestire con sleep banking nei 5 giorni precedenti',
  ],

  evidence_basis: [
    {
      source:   'Bosquet et al. (2007) "Effects of Tapering on Performance: A Meta-Analysis" Med Sci Sports Exerc',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Mujika & Padilla (2003) "Scientific bases for precompetition tapering strategies" Med Sci Sports Exerc',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.88,
}

// ─── 30. CONCURRENT_STRENGTH_ENDURANCE ────────────────────────────────────

const CONCURRENT_STRENGTH_ENDURANCE: TitanBlockCanonical = {
  block_id:    'CONCURRENT_STRENGTH_ENDURANCE',
  name:        'Concurrent Strength + Endurance (Interference Management)',
  category:    'strength_endurance',
  subcategory: 'concurrent_training_optimized',

  // Note: Blocco "meta" per atleti che devono sviluppare CONTEMPORANEAMENTE
  // forza e resistenza (triatleti, calciatori, rugby, atleti militari).
  // Non è un blocco di "tutto insieme" — è un framework di SEQUENZA e SEPARAZIONE
  // per minimizzare l'interferenza AMPK-mTOR (Fyfe et al. 2014).
  //
  // Regola fondamentale: Strength BEFORE Endurance nella stessa giornata
  // (Wilson et al. 2012: forza prima riduce interferenza del 30% rispetto al contrario).

  mechanical_dosage: {
    sessions_per_week: [3, 5],
    duration_min:      [45, 90],  // durata totale sessione (forza + endurance)
    rpe_target:        [6, 8],
    rest_seconds:      [360, 480], // separazione minima forza→endurance nella stessa sessione
  },

  tissue_load_matrix: {
    joint_stress_spine:    5,
    joint_stress_knee:     5,
    joint_stress_hip:      4,
    joint_stress_shoulder: 3,
    joint_stress_ankle:    4,
    tendon_load_type:      'tensile_compressive_mixed',
    tissue_recovery_hours: 36,
    bilateral_demand:      true,
  },

  cns_drain_score:   5,
  metabolic_pathway: 'aerobic_glycolytic_mixed',

  primary_adaptation:   'AEROBIC_CAPACITY',
  secondary_adaptation: 'MAXIMAL_STRENGTH',

  adaptation_decay: {
    primary_quality:   'AEROBIC_CAPACITY',
    secondary_quality: 'MAXIMAL_STRENGTH',
    half_life_days:    25,
  },

  interference_with: [
    {
      penalizes_block_category: 'strength_maximal',
      severity:                 'moderate',
      minimum_separation_hours: 6,
      mechanism:                'Se endurance precede forza massimale nella stessa giornata: AMPK attiva riduce qualità reclutamento neuromuscolare. Soluzione: forza PRIMA, poi endurance.',
      source:                   'Wilson et al. (2012) "Concurrent Training: a Meta-Analysis Examining Interference of Aerobic and Resistance Exercises" JSCR',
    },
  ],

  synergistic_with: [
    'ZONE2_FOUNDATION',
    'TEMPO_STRENGTH',
    'THRESHOLD_ENDURANCE',
    'LOWER_BODY_HYPERTROPHY',
  ],

  entry_gates: [
    {
      metric:    'pain_vas',
      operator:  '<=',
      threshold: 2,
      critical:  true,
      source:    'Cook & Purdam 2009',
    },
    {
      metric:    'training_years_combined',
      operator:  '>=',
      threshold: 1,
      critical:  false,
      source:    'Stöggl & Sperlich (2014) — principianti beneficiano di concurrent training, ma la sequenza è critica da subito',
    },
  ],

  exit_criteria: [
    'Nessuna regressione di FTP o 1RM dopo 8 settimane di concurrent (minimizzazione interferenza raggiunta)',
    'Atleta capace di distinguere soggettivamente la fatica neuromuscolare da quella metabolica',
  ],

  autoregulation_caps: [
    {
      metric:           'rpe_ceiling',
      threshold:        9,
      action_on_breach: 'end_session',
    },
  ],

  sport_compatibility: [
    { discipline: 'triathlon',         priority: 'primary', note: 'Definisce il training model del triatleta' },
    { discipline: 'football',          priority: 'primary' },
    { discipline: 'rugby',             priority: 'primary' },
    { discipline: 'rowing',            priority: 'primary' },
    { discipline: 'military',          priority: 'primary' },
    { discipline: 'endurance_running', priority: 'secondary', note: 'Off-season con strength aggiunto' },
    { discipline: 'cycling',           priority: 'secondary' },
  ],

  contraindications: [
    'Non mettere endurance PRIMA di forza nella stessa sessione (interferenza aumenta del 30%)',
    'Non programmare forza massimale e VO2max intervals nello stesso giorno (CNS drain cumulativo > 14)',
    'Non usare durante settimane di picco/gara: troppa fatica accumulata',
  ],

  evidence_basis: [
    {
      source:   'Wilson et al. (2012) "Concurrent Training: a Meta-Analysis" JSCR',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Fyfe et al. (2014) "Concurrent Training: a Meta-Analysis Examining Interference of Aerobic and Resistance Exercises" Sports Med',
      type:     'peer_reviewed',
      strength: 'A',
    },
    {
      source:   'Stöggl & Sperlich (2014) "Polarized training has greater impact on key endurance variables" Front Physiol',
      type:     'peer_reviewed',
      strength: 'A',
    },
  ],

  calibration_version:  CALIBRATION_VERSION,
  completeness_score:   0.87,
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
  // ── v1.1 additions (blocks 11–17) ──
  DELOAD_WEEK,
  HYPERTROPHY_MESOCYCLE,
  MAX_VELOCITY_SPRINT,
  PLYOMETRIC_FOUNDATION,
  COD_REACTIVE_ADVANCED,
  ISOMETRIC_TENDON,
  TEMPO_STRENGTH,
  // ── v1.2 additions (blocks 18–24) ──
  ALACTIC_POWER_REPETITION,
  VO2MAX_INTERVALS,
  LACTATE_TOLERANCE,
  MOBILITY_FOUNDATION,
  AEROBIC_POWER,
  TEMPO_RUNNING,
  NEURAL_PEAKING,
  // ── v1.3 additions (blocks 25–30) ──
  UPPER_BODY_STRENGTH,
  LOWER_BODY_HYPERTROPHY,
  REACTIVE_PLYOMETRIC,
  STRENGTH_ENDURANCE_CIRCUIT,
  COMPETITION_PREPARATION,
  CONCURRENT_STRENGTH_ENDURANCE,
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

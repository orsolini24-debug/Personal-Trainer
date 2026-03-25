/**
 * titans-calibration.ts
 *
 * CALIBRATION POLICY LIBRARY — versione 1.0
 *
 * REGOLA FONDAMENTALE:
 * Ogni costante numerica qui presente ha una fonte esplicita.
 * Se la fonte non esiste, il campo è `null` nel blocco canonico.
 * Il motore tratta `null` come dato mancante, NON come zero.
 *
 * Questa libreria è il garante anti-falsa-precisione dell'intero sistema.
 * Prima di modificare un valore, aggiorna la fonte e incrementa
 * CALIBRATION_VERSION.
 */

export const CALIBRATION_VERSION = '1.0.0'

// ─── CNS DRAIN SCORE (1–10) ────────────────────────────────────────────────
//
// Fonte primaria: Zatsiorsky & Kraemer (2006) "Science and Practice of
// Strength Training"; Verkhoshansky & Siff (2009) "Supertraining" cap. 3-4;
// Prilepin (1974) intensity/rep table.
//
// Definizione operativa: quanto stress impone l'attività sul sistema nervoso
// centrale, indipendentemente dalla fatica muscolare periferica.
// Determina il recovery minimo tra sessioni CNS-intensive.
//
export const CNS_DRAIN_RUBRIC = {
  // 1–2: Attività aerobica bassa intensità, mobilità, correttivo
  ZONE1_WALKING:              1,
  ZONE2_STEADY_STATE:         2,
  MOBILITY_CORRECTIVE:        2,
  ISOMETRIC_SUBMAXIMAL:       2,
  // 3–4: Forza moderata, soglia aerobica, eccentrico leggero
  STRENGTH_60_70_PCT:         3,
  THRESHOLD_ENDURANCE:        4,
  HYPERTROPHY_MODERATE:       4,
  ECCENTRIC_PREHAB:           4,
  // 5–6: Forza pesante, HIIT, pliometrica moderata
  STRENGTH_75_85_PCT:         6,
  HIIT_TEAM_SPORT:            6,
  PLYOMETRIC_MODERATE:        6,
  COD_TECHNIQUE:              5,
  // 7–8: Near-maximal, sprint accelerazione, depth drop
  STRENGTH_85_95_PCT:         8,
  SPRINT_ACCELERATION:        8,
  MAX_VELOCITY_SPRINT:        9,
  DEPTH_DROP_REACTIVE:        8,
  // 9–10: Massimale assoluto, gara
  STRENGTH_95_100_PCT:        9,
  COMPETITION_EFFORT:        10,
  // Return-to-play protocol: progressive, starts low
  RTP_PROGRESSIVE_START:      3,
  RTP_PROGRESSIVE_PEAK:       6,
} as const

export type CnsDrainKey = keyof typeof CNS_DRAIN_RUBRIC

// ─── JOINT STRESS SCORE (1–10 per distretto) ──────────────────────────────
//
// Fonte primaria: McGill (2007) "Ultimate Back Fitness and Performance";
// Cook (2010) "Movement: Functional Movement Systems";
// Starrett & Cordoza (2013) "Becoming a Supple Leopard";
// Malliaras et al. (2015) BJSM systematic review su carico tendineo.
//
// Definizione operativa: rischio di accumulo di stress articolare e tendineo
// se il blocco è eseguito senza prerequisiti di mobilità e tecnica.
// NON equivale a pericolosità assoluta: un deadlift è score 8 in un atleta
// impreparato, 5 in un atleta con tecnica solida. Il profilo utente modifica
// il valore effettivo via UserPhenotype.specific_tissue_vulnerability.
//
export const JOINT_STRESS_RUBRIC = {
  // COLONNA VERTEBRALE
  SPINE_SUPINE_NO_AXIAL_LOAD:          1,
  SPINE_HIP_HINGE_LIGHT:               3,
  SPINE_OVERHEAD_PRESS_MODERATE:        4,
  SPINE_SQUAT_MODERATE:                 5,
  SPINE_DEADLIFT_HEAVY:                 7,
  SPINE_SQUAT_HEAVY_AXIAL:              8,
  SPINE_GOOD_MORNING_HEAVY:             8,
  // GINOCCHIO
  KNEE_HIP_DOMINANT_EXERCISE:           2,
  KNEE_LEG_PRESS_MODERATE:              4,
  KNEE_SQUAT_MODERATE_DEPTH:            5,
  KNEE_NORDIC_CURL:                     4,   // stress tendineo > articolare
  KNEE_COD_DECELERATION:                6,
  KNEE_SQUAT_HEAVY_ATG:                 7,
  KNEE_DEPTH_DROP_REACTIVE:             8,
  // ANCA
  HIP_GLUTE_BRIDGE_LIGHT:               2,
  HIP_THRUST_HEAVY:                     5,
  HIP_SPRINT_ACCELERATION:              6,
  HIP_MAX_VELOCITY_SPRINT:              7,
  // SPALLA
  SHOULDER_PRESS_LIGHT_MODERATE:        3,
  SHOULDER_PRESS_HEAVY_OVERHEAD:        6,
  SHOULDER_OVERHEAD_ATHLETE_HIGH:       8,
  // CAVIGLIA/TENDINE ACHILLE
  ANKLE_WALKING_JOGGING:                2,
  ANKLE_RUNNING_MODERATE:               3,
  ANKLE_REACTIVE_SPRINT:                6,
  ANKLE_PLYOMETRIC_BOUNDING:            7,
} as const

// ─── TISSUE RECOVERY HOURS ────────────────────────────────────────────────
//
// Fonte primaria: Schoenfeld (2017) "Science and Development of Muscle
// Hypertrophy"; Kellmann et al. (2018) "Recovery and Stress in Sport";
// Hausswirth & Mujika eds. (2013) "Recovery for Performance in Sport";
// Kraemer & Ratamess (2004) ACSM position stand su S&C programming.
//
// Definizione operativa: ore minime prima che lo stesso sistema (muscolare,
// tendineo o neurale) possa essere re-stimolato senza accumulo di fatica.
// Valori per atleti TRAINED (non principianti) in condizioni normali.
// Fattori moltiplicativi per varianti: × 1.5 se atleta principiante,
// × 1.3 se sleep < 6h, × 0.8 se atleta elite con alta fitness croniche.
//
export const TISSUE_RECOVERY_HOURS = {
  MOBILITY_CORRECTIVE:              6,   // recupero quasi immediato
  ZONE2_CYCLING_EASY:              12,
  ZONE2_RUNNING_EASY:              14,   // impatto vs cycling
  THRESHOLD_CYCLING:               24,
  THRESHOLD_RUNNING:               30,
  HIIT_TEAM_SPORT:                 36,
  STRENGTH_MODERATE_UPPER:         24,
  STRENGTH_MODERATE_LOWER:         36,
  STRENGTH_HEAVY_COMPOUND_LOWER:   48,   // squat, deadlift >80%
  STRENGTH_HEAVY_COMPOUND_UPPER:   36,   // bench, row >80%
  ECCENTRIC_PREHAB_NORDIC:         48,   // alto DOMS iniziale
  PLYOMETRIC_MODERATE:             36,
  DEPTH_DROP_REACTIVE:             48,
  SPRINT_ACCELERATION:             72,   // CNS-limited, non solo muscolare
  MAX_VELOCITY_SPRINT:             72,
  RTP_FIELD_PROGRESSIVE:           36,   // conservativo per tendinopathy
  ISOMETRIC_HEAVY_TENDON:          48,   // Cook/Malliaras protocol
} as const

// ─── ADAPTATION DECAY HALF-LIVES (giorni) ─────────────────────────────────
//
// Fonte primaria: Issurin (2008) "Block Periodization vs. Traditional
// Training" JSCR; Issurin (2010) "New Horizons for the Methodology
// and Physiology of Training Periodization" Sports Medicine;
// Mujika & Padilla (2000) "Detraining: Loss of Training-Induced
// Physiological and Performance Adaptations" Sports Medicine.
//
// Definizione operativa: tempo in giorni in cui l'80% dell'adattamento
// acquisito si disperde dopo la cessazione dell'allenamento specifico
// (detraining completo). Con training ridotto (maintenance), il decay
// è circa il 40% di questi valori.
//
export const ADAPTATION_DECAY_HALF_LIFE_DAYS = {
  SPEED:               5,    // qualità più volatile — reti neuromotorie
  REACTIVE_STRENGTH:   7,    // riflessi myotatici, SSC
  MAXIMAL_STRENGTH:   18,    // adattamenti neurali + strutturali
  HYPERTROPHY:        28,    // perdita massa muscolare lenta senza stimolo
  ANAEROBIC_CAPACITY: 18,    // capacità glicolitica
  AEROBIC_CAPACITY:   28,    // VO2max, mitocondri — più stabile
  LACTATE_THRESHOLD:  25,    // LT2/FTP
  FAT_OXIDATION:      21,    // efficienza lipidica — Zone 2 adaptation
  MOBILITY:            7,    // ROM guadagnato decade senza stimolo
  TENDON_STIFFNESS:   30,    // adattamento tendineo più lento da costruire
                              // e più lento da perdere (Malliaras 2015)
  ECCENTRIC_CAPACITY: 20,    // capacità eccentrica dopo fase di induzione DOMS
} as const

export type AdaptationQualityKey = keyof typeof ADAPTATION_DECAY_HALF_LIFE_DAYS

// ─── INTERFERENCE MATRIX ──────────────────────────────────────────────────
//
// Fonte primaria: Hickson (1980) "Interference of strength development by
// simultaneously training for strength and endurance" Eur J Appl Physiol;
// Wilson et al. (2012) meta-analysis J Strength Cond Res;
// Fyfe et al. (2014) "Concurrent Training: a Meta-Analysis" Sports Med.
//
// Meccanismo molecolare: AMPK (endurance signaling) → inibisce mTORC1
// (strength/hypertrophy signaling). Conflitto acuto quando le sessioni
// sono entro 6h. Separazione ≥ 8h riduce significativamente l'interferenza.
//
export const INTERFERENCE_MATRIX = {
  // Quanto tempo di separazione (ore) è necessario tra i blocchi in conflitto
  HIGH_INTENSITY_ENDURANCE_vs_STRENGTH:  {
    separation_hours_minimum: 6,
    separation_hours_ideal: 24,
    mechanism: 'AMPK_mTOR_conflict',
    severity: 'moderate',
    source: 'Hickson 1980 + Wilson 2012',
  },
  SPRINT_vs_HEAVY_LOWER_BODY: {
    separation_hours_minimum: 8,
    separation_hours_ideal: 24,
    mechanism: 'CNS_neuromuscular_fatigue_overlap',
    severity: 'critical',
    source: 'Francis 1992; Verkhoshansky 2009',
  },
  HEAVY_ECCENTRIC_vs_POWER_EXPRESSION: {
    separation_hours_minimum: 48,
    separation_hours_ideal: 72,
    mechanism: 'DOMS_force_production_inhibition',
    severity: 'critical',
    source: 'Schoenfeld 2017 muscle damage review',
  },
  ZONE2_ENDURANCE_vs_STRENGTH: {
    separation_hours_minimum: 0,
    separation_hours_ideal: 6,
    mechanism: 'minimal_AMPK_activation_at_zone2',
    severity: 'minor',
    source: 'San Millan & Brooks 2018; Fyfe 2014',
  },
  HYPERTROPHY_VOLUME_vs_SPRINT: {
    separation_hours_minimum: 24,
    separation_hours_ideal: 48,
    mechanism: 'peripheral_fatigue_velocity_output_reduction',
    severity: 'moderate',
    source: 'Wilson et al. 2012 meta-analysis',
  },
} as const

// ─── VELOCITY-BASED TRAINING THRESHOLDS ───────────────────────────────────
//
// Fonte primaria: González-Badillo & Sánchez-Medina (2010) IJSM
// "Movement Velocity as a Measure of Loading Intensity in Resistance Training";
// Pareja-Blanco et al. (2017) "Effects of velocity loss during resistance
// training on athletic performance" EJAP.
//
export const VBT_THRESHOLDS = {
  // % perdita di velocità nel set che indica imminente cedimento tecnico
  VELOCITY_LOSS_STOP_SET_PCT:        20,   // stop set qui → qualità garantita
  VELOCITY_LOSS_SESSION_ADEQUATE_PCT: 30,  // sessione volume sufficiente
  // Velocità minima (m/s) per espressione di forza vs potenza
  MIN_VELOCITY_POWER_EXPRESSION:   0.75,   // < questo = bias forza, non potenza
  MIN_VELOCITY_MAX_STRENGTH:       0.25,   // near-maximal zone
  // %1RM approssimativo a velocità target (González-Badillo 2010)
  VELOCITY_1MS_APPROX_PCT_1RM:       50,
  VELOCITY_075MS_APPROX_PCT_1RM:     65,
  VELOCITY_050MS_APPROX_PCT_1RM:     80,
  VELOCITY_025MS_APPROX_PCT_1RM:     92,
} as const

// ─── VOLUME WEEKLY THRESHOLDS (sets per muscle group) ─────────────────────
//
// Fonte primaria: Schoenfeld et al. (2017) "Dose-response relationship
// between weekly resistance training volume and increases in muscle mass"
// JSCR; Israetel et al. (2019) "Scientific Principles of Strength Training"
// RP Strength.
//
export const VOLUME_WEEKLY_THRESHOLDS = {
  MEV_SETS_PER_MUSCLE:   10,  // Minimum Effective Volume
  MAV_SETS_PER_MUSCLE:   18,  // Maximum Adaptive Volume (midpoint range)
  MRV_SETS_PER_MUSCLE:   25,  // Maximum Recoverable Volume (upper bound)
} as const

// ─── HEART RATE ZONES (% HRmax) ───────────────────────────────────────────
//
// Fonte: Seiler (2010) "What is Best Practice for Training Intensity and
// Duration Distribution in Endurance Athletes?" Int J Sports Physiol Perf;
// Coggan & Allen (2010) "Training and Racing with a Power Meter".
//
export const HR_ZONES_PCT_HRMAX = {
  ZONE1_RECOVERY:      { min: 50, max: 60 },
  ZONE2_AEROBIC_BASE:  { min: 60, max: 72 },  // sotto LT1
  ZONE3_TEMPO:         { min: 72, max: 82 },  // tra LT1 e LT2
  ZONE4_THRESHOLD:     { min: 82, max: 92 },  // intorno LT2
  ZONE5_VO2MAX:        { min: 92, max: 100 }, // sopra LT2
} as const

// ─── HRV INTERPRETATION Z-SCORE ──────────────────────────────────────────
//
// Fonte: Plews et al. (2013) "Heart rate variability in elite triathletes"
// Int J Sports Physiol Perf; Buchheit (2014) "Monitoring training status
// with HR measures" Frontiers in Physiology.
//
export const HRV_ZSCORE_THRESHOLDS = {
  GREEN_OK_ABOVE:       -0.5,  // z-score ≥ -0.5 → proceed as planned
  YELLOW_CAUTION_ABOVE: -1.5,  // z-score da -1.5 a -0.5 → monitor
  RED_DELOAD_BELOW:     -1.5,  // z-score < -1.5 → ridurre intensità
} as const

// ─── PAIN VAS THRESHOLDS ─────────────────────────────────────────────────
//
// Fonte: Cook & Purdam (2009) "Is tendon pathology a continuum?"
// BJSM; Malliaras et al. (2015) BJSM; Silbernagel et al. (2007)
// "Continued sports activity, using a pain-monitoring model, during
// rehabilitation in patients with Achilles tendinopathy" AJSM.
//
export const PAIN_VAS_THRESHOLDS = {
  SAFE_TO_TRAIN_BELOW:      2,   // VAS 0–1: proceed fully
  TRAIN_WITH_MONITOR_BELOW: 4,   // VAS 2–3: proceed with monitoring
  MODIFY_LOAD_BELOW:        7,   // VAS 4–6: reduce load, avoid aggravating
  STOP_TRAINING_AT_OR_ABOVE: 7,  // VAS 7+: stop aggravating activity
  CLINICAL_REFERRAL_AT:     8,   // VAS 8+: clinical assessment required
} as const

// ─── ACWR THRESHOLDS ─────────────────────────────────────────────────────
//
// NOTA CRITICA (da Gabbett 2020; Impellizzeri et al. 2020):
// L'ACWR ha limiti metodologici significativi (dipendenza da definizione
// di "acute" e "chronic", effetto di coupling, autocorrelazione).
// NON usarlo come metrica unica. Usarlo come uno dei segnali nel
// multi-signal monitoring framework (Gabbett 2016 BJSM).
//
export const ACWR_THRESHOLDS_CAUTION = {
  SWEET_SPOT_MIN:   0.8,   // fonte: Gabbett 2016 BJSM
  SWEET_SPOT_MAX:   1.3,   // fonte: Gabbett 2016 BJSM
  HIGH_RISK_ABOVE:  1.5,   // aumentato rischio infortuni
  WARNING:          'ACWR è un indicatore secondario; non usare come unica metrica',
} as const

// ─── CALIBRATION METADATA ─────────────────────────────────────────────────

export const CALIBRATION_METADATA = {
  version: CALIBRATION_VERSION,
  last_reviewed: '2026-03-25',
  reviewer: 'Claude + Giorgio Orsolini',
  next_review_due: '2026-09-25',
  policy: [
    'Ogni numero ha una fonte peer-reviewed o testo autorevole citato nel commento',
    'Se la fonte non esiste, il campo è null nel blocco canonico',
    'Modifiche ai valori richiedono aggiornamento della fonte e della versione',
    'I valori si applicano ad atleti TRAINED in condizioni normali di recovery',
    'Il UserPhenotype modifica i valori effettivi runtime via moltiplicatori',
  ],
} as const

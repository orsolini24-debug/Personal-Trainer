/**
 * titans-types.ts
 *
 * SCHEMA UNICO — versione 2.0
 *
 * Fonte autoritativa di tutti i tipi condivisi tra:
 *   - titans-calibration.ts (policy numerica)
 *   - titans-blocks.ts     (canonical blocks)
 *   - titans-db.ts         (profili Tier-1)
 *   - titans-engine.ts     (motore decisionale)
 *
 * ARCHITETTURA A 3 LAYER:
 *   Layer 1 — Canonical Block (fisica dell'allenamento)
 *             Indipendente dal coach. Oggetti riusabili in titans-blocks.ts.
 *   Layer 2 — Profile Modifier (filosofia del coach)
 *             Come quel coach usa/modifica il canonical block.
 *   Layer 3 — Engine State (decisione runtime)
 *             Lettura da Layer 1+2, modifica in base a UserPhenotype.
 */

import type { AdaptationQualityKey } from './titans-calibration'

// ─── ENUMS & UNION TYPES ──────────────────────────────────────────────────

export type EvidenceLevel = 'A' | 'B' | 'C'
export type PeriodizationModel = 'linear' | 'undulating' | 'block' | 'conjugate' | 'concurrent'

export type BlockCategory =
  | 'endurance_aerobic'
  | 'endurance_anaerobic'
  | 'strength_maximal'
  | 'strength_hypertrophy'
  | 'strength_endurance'
  | 'power_explosive'
  | 'speed_sprint'
  | 'skill_cod'
  | 'prehab_corrective'
  | 'rehab_rtp'
  | 'recovery_deload'

export type MetabolicPathway =
  | 'aerobic_oxidative'          // Zone 1–2, fat oxidation
  | 'aerobic_glycolytic_mixed'   // Zone 3–4, threshold
  | 'glycolytic_alactic_mixed'   // HIIT, speed endurance
  | 'alactic_phosphagen'         // Sprint, explosive power < 10s
  | 'glycolytic_dominant'        // Hypertrophy, high rep strength

export type TendonLoadType =
  | 'tensile'                    // eccentric / tensile load (Nordic, RDL)
  | 'compressive'                // compression on tendon (knee flexion, hip crease)
  | 'tensile_compressive_mixed'  // combination (end-range loading)
  | 'none'

export type InterferenceSeverity = 'critical' | 'moderate' | 'minor' | 'none'
export type ProgressionBias = 'volume_first' | 'intensity_first' | 'frequency_first' | 'autoregulatory'
export type OperationalTier = 'TIER_1_HARDWARE' | 'TIER_2_SUBJECTIVE' | 'TIER_3_SHADOW' | 'CALIBRATION_MODE'
export type SessionRecommendationType =
  | 'PROCEED_AS_PLANNED'
  | 'PROCEED_MODIFIED'
  | 'SUBSTITUTE_LOWER_INTENSITY'
  | 'ACTIVE_RECOVERY'
  | 'FULL_REST'
  | 'BLOCKED_PAIN'
  | 'INSUFFICIENT_DATA'

export type IngestionMethod =
  | 'OS_AGGREGATOR_APPLE_HEALTH'
  | 'OS_AGGREGATOR_GOOGLE_CONNECT'
  | 'B2B_API_TERRA_ROOK'
  | 'FILE_PARSE_FIT_TCX'
  | 'OCR_SCREENSHOT'
  | 'MANUAL_TYPED_ENTRY'

export type SensorType = 'ECG_CHEST_STRAP' | 'OPTICAL_WRIST_OR_RING' | 'UNKNOWN_GENERIC'
export type ActionCode = 
  | 'FULL_STOP' 
  | 'REDUCE_LOAD' 
  | 'REDUCE_INTENSITY'
  | 'SUBSTITUTE_LOWER_INTENSITY'
  | 'MONITOR_CLOSELY' 
  | 'PROCEED'
  | 'FULL_REST'
  | 'BLOCKED_PAIN'

// ─── LAYER 1: CANONICAL BLOCK ──────────────────────────────────────────────
// "La fisica dell'allenamento" — indipendente dal coach

export interface MechanicalDosage {
  sessions_per_week:       [number, number]  // [min, max]
  sets_per_session?:       [number, number]
  reps_per_set?:           [number, number]
  duration_min?:           [number, number]  // per blocchi endurance
  intensity_pct_1rm?:      [number, number]  // se rilevante
  rpe_target?:             [number, number]  // scala 1–10
  rest_seconds?:           [number, number]
  tempo?:                  string            // es. '3-1-1-0'
  distance_per_rep_m?:     [number, number]  // per sprint
  hold_seconds?:           [number, number]  // per isometrici
}

export interface TissueLoadMatrix {
  joint_stress_spine:      number | null  // 1–10 da JOINT_STRESS_RUBRIC, null se non rilevante
  joint_stress_knee:       number | null
  joint_stress_hip:        number | null
  joint_stress_shoulder:   number | null
  joint_stress_ankle:      number | null
  tendon_load_type:        TendonLoadType
  tissue_recovery_hours:   number         // da TISSUE_RECOVERY_HOURS
  bilateral_demand:        boolean
}

export interface AdaptationDecay {
  primary_quality:    AdaptationQualityKey
  secondary_quality?: AdaptationQualityKey
  half_life_days:     number  // da ADAPTATION_DECAY_HALF_LIFE_DAYS
}

export interface AutoregulationCap {
  metric:             'velocity_drop_pct' | 'rpe_ceiling' | 'hr_ceiling_pct' | 'pain_vas_ceiling'
  threshold:          number
  action_on_breach:   'end_set' | 'end_session' | 'reduce_load_pct'
  reduction_pct?:     number
}

export interface GateRequirement {
  // Prerequisito di ingresso al blocco (es. squat ≥ 1.5× BW prima dei depth drops)
  metric:             string  // nome KPI — deve coincidere con una chiave di GateKPIContext
  operator:           '>=' | '<=' | '>' | '<' | '==' | '!='
  threshold:          number | string
  critical:           boolean  // se true: BLOCCA il blocco; se false: solo warning
  source?:            string
}

export interface InterferencePenalty {
  penalizes_block_category: BlockCategory
  severity:                 InterferenceSeverity
  minimum_separation_hours: number
  mechanism:                string  // spiegazione fisiologica
  source:                   string
}

export interface SportCompatibility {
  discipline:     string  // es. 'football', 'endurance_running', 'powerlifting'
  priority:       'primary' | 'secondary' | 'optional'
  note?:          string
}

export interface EvidenceBasis {
  source:         string  // autore + anno + titolo abbreviato
  type:           'peer_reviewed' | 'textbook' | 'practitioner_manual' | 'position_stand'
  strength:       EvidenceLevel
}

/**
 * TitanBlockCanonical
 * La "fisica" di un blocco di allenamento. Non appartiene a nessun coach.
 * Viene definita in titans-blocks.ts con valori ancorati alla calibration policy.
 */
export interface TitanBlockCanonical {
  block_id:               string              // es. 'ZONE2_FOUNDATION'
  name:                   string
  category:               BlockCategory
  subcategory?:           string

  // Dosaggio fisiologico
  mechanical_dosage:      MechanicalDosage
  tissue_load_matrix:     TissueLoadMatrix
  cns_drain_score:        number              // da CNS_DRAIN_RUBRIC
  metabolic_pathway:      MetabolicPathway

  // Adattamento e decadimento
  primary_adaptation:     AdaptationQualityKey
  secondary_adaptation?:  AdaptationQualityKey
  adaptation_decay:       AdaptationDecay

  // Interazioni con altri blocchi
  interference_with:      InterferencePenalty[]
  synergistic_with?:      string[]            // block_ids potenziati

  // Gate di ingresso e uscita
  entry_gates:            GateRequirement[]   // prerequisiti obbligatori
  exit_criteria:          string[]            // criteri di avanzamento (human-readable)

  // Autoregolazione
  autoregulation_caps:    AutoregulationCap[]

  // Compatibilità
  sport_compatibility:    SportCompatibility[]
  contraindications:      string[]

  // Metadati
  evidence_basis:         EvidenceBasis[]
  calibration_version:    string              // deve corrispondere a CALIBRATION_VERSION
  completeness_score:     number              // 0–1, onestà sul livello di dettaglio
}

// ─── LAYER 2: PROFILE MODIFIER ────────────────────────────────────────────
// "Come il coach usa il blocco" — specifico del profilo in titans-db.ts

export interface ProfileBlockModifier {
  block_id:                 string           // referenza a TitanBlockCanonical.block_id
  activation_priority:      1 | 2 | 3 | 4 | 5  // 1=core, 5=optional
  progression_bias:         ProgressionBias
  volume_modifier_pct:      number           // -50 a +50 rispetto al canonical
  intensity_modifier_pct?:  number           // -20 a +20 rispetto al canonical
  preferred_phase?:         'preseason' | 'in_season' | 'off_season' | 'any'
  override_dosage?:         Partial<MechanicalDosage>  // override puntuale
  coach_specific_notes:     string           // perché questo coach usa questo blocco così
  additional_red_flags?:    OverrideRule[]   // trigger extra specifici del coach
}

export interface OverrideRule {
  // Regola comportamentale specifica del profilo che sovrascrive il canonical
  condition:       string    // condizione in linguaggio naturale
  action:          string    // azione prescritta
  priority:        'veto' | 'high' | 'medium'
  source_id?:      string    // da quale pubblicazione del coach viene
}

// ─── LAYER 2: PROFILE METHODOLOGY IDENTITY ────────────────────────────────
// Quello che distingue Pintus da Verheijen anche se usano gli stessi blocchi

export interface ProfileMethodologyV2 {
  load_philosophy:            string   // frase-chiave del metodo (condensata)
  preferred_progression:      ProgressionBias
  block_selection_logic:      string   // quando e perché attiva certi blocchi
  assessment_bias:            string[] // tool e metriche privilegiati dal coach
  signature_constraints:      string[] // vincoli irrinunciabili del metodo (es. "mai ACWR come unica metrica")
  fusion_logic?:              string   // come si combina con altri profili
}

// ─── LAYER 3: ENGINE STATE TYPES ─────────────────────────────────────────
// Usati solo da titans-engine.ts a runtime

export interface DataIngestionGate {
  ingestion_method:              IngestionMethod
  extraction_confidence_score:   number    // 0–1
  event_timestamp:               string    // ISO 8601
  upload_timestamp:              string
  latency_hours:                 number
  quarantined?:                  boolean
}

export interface TelemetryValidation {
  sensor_type:          SensorType
  calculation_method:   'time_domain' | 'frequency_domain' | 'unknown'
  ingestion_gate:       DataIngestionGate
  data_density:         number    // 0–1, ≥0.7 per trust (Density Gate)
  calibration_status:   'calibrated' | 'calibrating' | 'uncalibrated'
  rolling_baseline_n:   number    // giorni di baseline accumulati
}

export interface UserPhenotype {
  user_id:                         string
  dynamic_recovery_multiplier:     number    // 0.5–1.5, baseline 1.0
  specific_tissue_vulnerability:   string[]  // es. ['left_knee', 'proximal_hamstring_R']
  allostatic_load_score:           number    // 0–100 calcolato dall'engine
  interoception_accuracy_score:    number    // 0–1, calibrato su accuracy storica
  subjective_prompt_reliability:   number    // 0–1, compliance wizard
}

export interface DegradationState {
  current_tier:                   OperationalTier
  max_weekly_volume_increase_pct: number
  high_risk_blocks_enabled:       boolean
  require_explicit_confirm:       boolean
  reason:                         string
}

export interface ResilientRedFlag {
  // Truth Hierarchy: pain veto > mechanical performance > hardware telemetry
  primary_source:          'pain_vas' | 'mechanical_performance' | 'hrv_zscore' | 'wizard' | 'allostatic_load'
  fallback_1_source?:      'pain_vas' | 'mechanical_performance' | 'hrv_zscore' | 'wizard' | 'allostatic_load'
  fallback_2_source?:      'pain_vas' | 'mechanical_performance' | 'hrv_zscore' | 'wizard' | 'allostatic_load'
  condition:               string    // human-readable
  threshold:               number    // per primary_source
  fallback_1_threshold?:   number
  fallback_2_threshold?:   number
  action_code:             ActionCode
  confidence_penalty?:     number    // 0–1, riduce il confidence score del sistema
  ui_explanation:          string    // mostrato all'utente
}

export interface WizardResponse {
  date:               string    // ISO
  sleep_quality:      1 | 2 | 3 | 4 | 5
  energy_level:       1 | 2 | 3 | 4 | 5
  muscle_fatigue:     1 | 2 | 3 | 4 | 5
  motivation:         1 | 2 | 3 | 4 | 5
  pain_vas:           number    // 0–10 obbligatorio
  pain_location?:     string
  sleep_hours_reported?: number
  submitted_at:       string
}

export interface CollisionResolver {
  active_block_ids:       string[]
  conflict_detected:      boolean
  resolution_protocol:    'priority_wins' | 'time_separation' | 'volume_reduction' | 'block_substitution'
  priority_block_id?:     string
  sacrificed_block_id?:   string
  separation_hours?:      number
  resolution_explanation: string
}

export interface DailyRecommendation {
  recommendation:          SessionRecommendationType
  confidence:              number    // 0–1
  operational_tier:        OperationalTier
  readiness_score:         number    // 0–100
  allostatic_load:         number    // 0–100
  volume_modifier:         number    // es. 0.8 = −20%
  intensity_modifier:      number    // es. 0.9 = −10%
  active_fusion_weights:   Record<string, number>
  gate_check:              { allPassed: boolean; results: Array<{ gate: string; passed: boolean; reason: string }> }
  blocked_blocks:          string[]
  collision_resolutions:   CollisionResolver[]
  warnings:                string[]
  action_code:             ActionCode
  ui_summary:              string
}

// ─── UPDATED TITAN PROFILE INTERFACE (v2) ────────────────────────────────
// Aggiunge i nuovi campi mantenendo backward compatibility con v1

export interface TitanProfileV2Extension {
  // NUOVO v2: Block Catalog references
  blockCatalogIds?:        string[]              // referenze a TitanBlockCanonical.block_id
  profileModifiers?:       ProfileBlockModifier[] // per-coach customization

  // NUOVO v2: Methodology identity
  methodologyV2?:          ProfileMethodologyV2

  // NUOVO v2: Schema versioning
  schemaVersion?:          '1.0' | '2.0'        // default '1.0' per profili non migrati
  deepProfileComplete?:    boolean               // true = profilo completamente migrato

  // NUOVO v2: Resilient red flags (opzionale, sostituisce il formato testo nel DB)
  resilientRedFlags?:      ResilientRedFlag[]
}

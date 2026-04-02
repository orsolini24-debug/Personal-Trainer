/**
 * titans-validation.ts
 *
 * Runtime Zod schemas for all TITANS engine inputs.
 * Usato come safety gate prima che i dati dell'utente entrino nel motore.
 *
 * PRINCIPIO: "Trust nothing entering the engine from external systems."
 * Ogni path di ingestion (OS aggregator, B2B API, OCR, manual entry) può
 * produrre dati malformati. Questi schemi bloccano i dati cattivi PRIMA che
 * raggiungano l'engine, garantendo type-safety at runtime.
 *
 * ALIGNMENT NOTE (CP-024):
 * Il TelemetryValidation definito nel motore (titans-engine.ts) è più dettagliato
 * rispetto alla versione in titans-types.ts. Questo file usa la versione del motore
 * come fonte autoritativa per la validazione runtime.
 *
 * Dependency: zod ^3.23.8 (già in package.json)
 */

import { z } from 'zod'

// ─── PRIMITIVE VALIDATORS ────────────────────────────────────────────────────

/** Score 0–100 */
const score100 = z.number().min(0).max(100)

/** Score 0–10 (VAS pain, RPE) */
const score10 = z.number().min(0).max(10)

/** Score 1–10 */
const score1to10 = z.number().min(1).max(10)

/** Percentuale 0–1 */
const pct01 = z.number().min(0).max(1)

/** ISO 8601 timestamp */
const isoTimestamp = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  'Deve essere ISO 8601 (es. 2026-01-15T07:30:00Z)'
)

// ─── SCHEMA 1: DATA INGESTION GATE ──────────────────────────────────────────

export const IngestionMethodSchema = z.enum([
  'OS_AGGREGATOR_APPLE_HEALTH',
  'OS_AGGREGATOR_GOOGLE_CONNECT',
  'B2B_API_TERRA_ROOK',
  'FILE_PARSE_FIT_TCX',
  'OCR_SCREENSHOT',
  'MANUAL_TYPED_ENTRY',
])

export const DataIngestionGateSchema = z.object({
  ingestion_method:            IngestionMethodSchema,
  extraction_confidence_score: score100,
  event_timestamp:             isoTimestamp,
  upload_timestamp:            isoTimestamp,
  latency_hours:               z.number().min(0).max(8760), // max 1 anno
  quarantined:                 z.boolean().optional(),
}).refine(
  data => new Date(data.upload_timestamp) >= new Date(data.event_timestamp),
  { message: 'upload_timestamp non può essere prima di event_timestamp', path: ['upload_timestamp'] }
)

export type DataIngestionGateInput = z.infer<typeof DataIngestionGateSchema>

// ─── SCHEMA 2: TELEMETRY VALIDATION ──────────────────────────────────────────
//
// Fonte autoritativa: titans-engine.ts (versione più dettagliata con
// TelemetryDensity e CalibrationStatus come oggetti strutturati).

export const SensorTypeSchema = z.enum([
  'ECG_CHEST_STRAP',
  'OPTICAL_WRIST_OR_RING',
  'UNKNOWN_GENERIC',
])

export const TelemetryDensitySchema = z.object({
  score:                z.number().min(0).max(1),
  available_days:       z.number().int().min(0),
  expected_days:        z.number().int().min(1),
  coverage_pct:         z.number().min(0).max(100),
  last_reading_hours:   z.number().min(0),
  gap_penalty_applied:  z.boolean(),
})

export const CalibrationStatusSchema = z.object({
  status:              z.enum(['calibrated', 'calibrating', 'uncalibrated']),
  baseline_days:       z.number().int().min(0),
  baseline_target:     z.number().int().min(0),
  pct_complete:        z.number().min(0).max(100),
  calibration_started: isoTimestamp.optional(),
})

export const TelemetryValidationSchema = z.object({
  sensor_type:         SensorTypeSchema,
  calculation_method:  z.enum(['14_DAY_ROLLING_Z_SCORE']),
  ingestion_gate:      DataIngestionGateSchema,
  data_density:        TelemetryDensitySchema,
  calibration:         CalibrationStatusSchema,
  // HRV payload (null se non disponibile o sotto densità minima)
  rmssd_ms:            z.number().positive().nullable(),
  hrv_zscore:          z.number().nullable(),             // Z-score rispetto alla baseline
  rhr_bpm:             z.number().positive().nullable(),  // Frequenza cardiaca a riposo
  sleep_hours:         z.number().min(0).max(24).nullable(),
  recorded_at:         isoTimestamp,
}).refine(
  data => data.data_density.score >= 0 && data.data_density.score <= 1,
  { message: 'data_density.score fuori range [0, 1]', path: ['data_density', 'score'] }
)

export type TelemetryValidationInput = z.infer<typeof TelemetryValidationSchema>

// ─── SCHEMA 3: USER PHENOTYPE ─────────────────────────────────────────────────

export const UserPhenotypeSchema = z.object({
  user_id:                         z.string().min(1),
  dynamic_recovery_multiplier:     z.number().min(0.5).max(1.5),
  specific_tissue_vulnerability:   z.array(z.string()),
  allostatic_load_score:           score100,
  interoception_accuracy_score:    pct01,
  subjective_prompt_reliability:   pct01,
})

export type UserPhenotypeInput = z.infer<typeof UserPhenotypeSchema>

// ─── SCHEMA 4: WIZARD RESPONSE ───────────────────────────────────────────────

const likert5 = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])

export const WizardResponseSchema = z.object({
  date:                  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data YYYY-MM-DD'),
  sleep_quality:         likert5,
  energy_level:          likert5,
  muscle_fatigue:        likert5,
  motivation:            likert5,
  pain_vas:              score10,
  pain_location:         z.string().optional(),
  sleep_hours_reported:  z.number().min(0).max(24).optional(),
  submitted_at:          isoTimestamp,
}).refine(
  data => {
    const wizardDate = new Date(data.date)
    const submitDate = new Date(data.submitted_at)
    // Il wizard può essere compilato solo il giorno stesso o il giorno dopo
    const diffDays = (submitDate.getTime() - wizardDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays >= -0.5 && diffDays <= 2
  },
  { message: 'submitted_at troppo distante dalla date del wizard', path: ['submitted_at'] }
)

export type WizardResponseInput = z.infer<typeof WizardResponseSchema>

// ─── SCHEMA 5: ALLOSTATIC LOAD INPUT ─────────────────────────────────────────

export const AllostaticLoadInputSchema = z.object({
  sleep_hours_last3:          z.array(z.number().min(0).max(24)).min(1).max(3),
  rpe_last3_sessions:         z.array(score10).min(1).max(3),
  caloric_balance_last3:      z.array(z.number()).min(1).max(3),
  life_stress_score:          z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)
  ]).optional(),
  hrv_zscore_last3:           z.array(z.number()).max(3).optional(),
  consecutive_training_days:  z.number().int().min(0).max(365),
})

export type AllostaticLoadInputData = z.infer<typeof AllostaticLoadInputSchema>

// ─── SCHEMA 6: GATE KPI CONTEXT ───────────────────────────────────────────────

export const GateKPIContextSchema = z.object({
  // Pain & Recovery
  HAMSTRING_VAS_PAIN:    score10.optional(),
  ACHILLES_VAS_PAIN:     score10.optional(),
  KNEE_VAS_PAIN:         score10.optional(),
  SHOULDER_VAS_PAIN:     score10.optional(),
  GENERAL_VAS_PAIN:      score10.optional(),
  // Performance
  SQUAT_1RM_BW_RATIO:    z.number().min(0).max(5).optional(),
  PULLUP_MAX_REPS:        z.number().int().min(0).optional(),
  SPRINT_10M_SEC:         z.number().positive().optional(),
  FTP_WATTS:              z.number().positive().optional(),
  VO2MAX_ML_KG_MIN:       z.number().positive().optional(),
  // Systemic
  HRV_ZSCORE:             z.number().optional(),
  CTL:                    z.number().min(0).optional(),
  ATL:                    z.number().min(0).optional(),
  TSB:                    z.number().optional(),
  // Additional dynamic KPIs (open map per estensibilità)
}).catchall(z.number().optional())

export type GateKPIContextData = z.infer<typeof GateKPIContextSchema>

// ─── SCHEMA 7: DAILY RECOMMENDER INPUT ───────────────────────────────────────
//
// L'input principale dell'engine. Questo è il punto di ingresso più critico.

export const ObjectiveSchema = z.enum([
  'STRENGTH',
  'ENDURANCE',
  'SPORT_PERFORMANCE',
  'HYPERTROPHY',
  'WEIGHT_LOSS',
])

export const DailyRecommenderInputSchema = z.object({
  phenotype:                  UserPhenotypeSchema,
  active_mental_profiles:     z.array(z.object({
    profile:                  z.object({ id: z.string() }).passthrough(), // AthleteProfile
    weight:                   pct01,
  })).optional().refine(
    profiles => !profiles || Math.abs(profiles.reduce((s, p) => s + p.weight, 0) - 1.0) < 0.01,
    { message: 'La somma dei pesi dei profili mentali deve essere 1.0' }
  ),
  wizard:                     WizardResponseSchema.nullable(),
  telemetry:                  TelemetryValidationSchema.nullable(),
  allostatic_input:           AllostaticLoadInputSchema,
  gate_context:               GateKPIContextSchema,
  active_titan_ids:           z.array(z.string().min(1)).min(1).max(10),
  base_fusion_weights:        z.record(z.string(), z.number().min(0).max(1)),
  planned_block_ids:          z.array(z.string()).max(8),
  available_equipment:        z.array(z.string()),
  available_time_min:         z.number().int().min(10).max(480),
  primary_objective:          ObjectiveSchema,
  active_coach_block_modifiers: z.record(z.string(), z.object({
    block_id:              z.string(),
    activation_priority:   z.number().int().min(1).max(5),
    progression_bias:      z.string(),
    volume_modifier_pct:   z.number().min(-50).max(50),
    intensity_modifier_pct: z.number().min(-20).max(20).optional(),
    preferred_phase:       z.string().optional(),
    coach_specific_notes:  z.string(),
  }).passthrough()).optional(),
}).refine(
  data => data.available_time_min > 0,
  { message: 'available_time_min deve essere > 0', path: ['available_time_min'] }
)

export type DailyRecommenderInputData = z.infer<typeof DailyRecommenderInputSchema>

// ─── VALIDATION HELPERS ──────────────────────────────────────────────────────

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
}

/**
 * Valida un DataIngestionGate prima dell'ingestion.
 * Gate di primo livello: blocca dati palesemente errati.
 */
export function validateIngestionGate(raw: unknown): ValidationResult<DataIngestionGateInput> {
  const result = DataIngestionGateSchema.safeParse(raw)
  if (result.success) return { success: true, data: result.data }
  return {
    success: false,
    errors: result.error.errors.map(e => `[${e.path.join('.')}] ${e.message}`),
  }
}

/**
 * Valida TelemetryValidation prima dell'iniezione nell'engine.
 * Critico: dati telemetria malformati possono causare Z-score errati.
 */
export function validateTelemetry(raw: unknown): ValidationResult<TelemetryValidationInput> {
  const result = TelemetryValidationSchema.safeParse(raw)
  if (result.success) return { success: true, data: result.data }
  return {
    success: false,
    errors: result.error.errors.map(e => `[${e.path.join('.')}] ${e.message}`),
  }
}

/**
 * Valida WizardResponse prima di alimentare il motore.
 * Il pain_vas è l'unico campo veramente obbligatorio e critico per la sicurezza.
 */
export function validateWizard(raw: unknown): ValidationResult<WizardResponseInput> {
  const result = WizardResponseSchema.safeParse(raw)
  if (result.success) return { success: true, data: result.data }
  return {
    success: false,
    errors: result.error.errors.map(e => `[${e.path.join('.')}] ${e.message}`),
  }
}

/**
 * Valida il DailyRecommenderInput completo prima di passarlo a recommendDailySession().
 * Il pain_vas viene estratto e verificato separatamente come Veto Gate di sicurezza.
 */
export function validateDailyRecommenderInput(
  raw: unknown
): ValidationResult<DailyRecommenderInputData> {
  const result = DailyRecommenderInputSchema.safeParse(raw)
  if (result.success) return { success: true, data: result.data }
  return {
    success: false,
    errors: result.error.errors.map(e => `[${e.path.join('.')}] ${e.message}`),
  }
}

/**
 * Controllo rapido di sicurezza sul pain_vas prima di procedere.
 * Dovrebbe essere chiamato SEMPRE prima di passare al recommendDailySession.
 *
 * @returns true se il dolore è dentro limiti sicuri (VAS < 7)
 * @returns false se VAS ≥ 7 (VETO assoluto: stop sessione)
 */
export function painVetoCheck(wizard: WizardResponseInput | null | undefined): boolean {
  if (!wizard) return true  // nessun dato = no veto (engine userà default)
  return wizard.pain_vas < 7
}

/**
 * Verifica che la densità dei dati telemetria sia sufficiente per attivare
 * decisioni algoritmiche automatiche (Density Gate).
 *
 * @param telemetry — oggetto telemetria validato
 * @returns true se density ≥ 0.7 E baseline ≥ 14 giorni
 */
export function densityGateCheck(telemetry: TelemetryValidationInput | null): boolean {
  if (!telemetry) return false
  return (
    telemetry.data_density.score >= 0.7 &&
    telemetry.calibration.baseline_days >= 14
  )
}

/**
 * Genera un messaggio di errore human-readable per l'UI
 * a partire dagli errori di validazione Zod.
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return ''
  if (errors.length === 1) return errors[0]
  return `${errors.length} errori di validazione:\n${errors.map(e => `• ${e}`).join('\n')}`
}

// ─── TELEMETRY ALIGNMENT BRIDGE ──────────────────────────────────────────────
//
// Il TelemetryValidation in titans-types.ts ha una struttura semplificata
// (data_density: number, calibration_status: string) mentre titans-engine.ts
// usa oggetti strutturati (TelemetryDensity, CalibrationStatus).
//
// Questo bridge converte dal formato engine al formato types per i consumer
// che usano il tipo da titans-types.ts.

import type { TelemetryValidation as TelemetryValidationTyped } from './titans-types'

/**
 * Converte dal formato engine TelemetryValidation al formato titans-types.
 * Usato dai consumer che importano da titans-types invece che dall'engine.
 */
export function bridgeTelemetryToTypes(
  engineTelemetry: TelemetryValidationInput
): TelemetryValidationTyped {
  return {
    sensor_type:          engineTelemetry.sensor_type as TelemetryValidationTyped['sensor_type'],
    calculation_method:   'time_domain',
    ingestion_gate:       {
      ingestion_method:              engineTelemetry.ingestion_gate.ingestion_method as TelemetryValidationTyped['ingestion_gate']['ingestion_method'],
      extraction_confidence_score:   engineTelemetry.ingestion_gate.extraction_confidence_score / 100,
      event_timestamp:               engineTelemetry.ingestion_gate.event_timestamp,
      upload_timestamp:              engineTelemetry.ingestion_gate.upload_timestamp,
      latency_hours:                 engineTelemetry.ingestion_gate.latency_hours,
      quarantined:                   engineTelemetry.ingestion_gate.quarantined,
    },
    data_density:         engineTelemetry.data_density.score,
    calibration_status:   engineTelemetry.calibration.status,
    rolling_baseline_n:   engineTelemetry.calibration.baseline_days,
  }
}

/**
 * Converte dal formato titans-types al formato engine.
 * Usato quando si riceve un TelemetryValidation semplificato e si vuole
 * alimentare l'engine con la versione strutturata.
 */
export function bridgeTelemetryToEngine(
  typesTelemetry: TelemetryValidationTyped
): Partial<TelemetryValidationInput> {
  return {
    sensor_type:        typesTelemetry.sensor_type,
    calculation_method: '14_DAY_ROLLING_Z_SCORE',
    ingestion_gate: {
      ingestion_method:            typesTelemetry.ingestion_gate.ingestion_method,
      extraction_confidence_score: typesTelemetry.ingestion_gate.extraction_confidence_score * 100,
      event_timestamp:             typesTelemetry.ingestion_gate.event_timestamp,
      upload_timestamp:            typesTelemetry.ingestion_gate.upload_timestamp,
      latency_hours:               typesTelemetry.ingestion_gate.latency_hours,
      quarantined:                 typesTelemetry.ingestion_gate.quarantined,
    },
    data_density: {
      score:               typesTelemetry.data_density,
      available_days:      typesTelemetry.rolling_baseline_n,
      expected_days:       14,
      coverage_pct:        typesTelemetry.data_density * 100,
      last_reading_hours:  0,
      gap_penalty_applied: false,
    },
    calibration: {
      status:              typesTelemetry.calibration_status,
      baseline_days:       typesTelemetry.rolling_baseline_n,
      baseline_target:     14,
      pct_complete:        Math.min(100, (typesTelemetry.rolling_baseline_n / 14) * 100),
    },
    rmssd_ms:  null,
    hrv_zscore: null,
    rhr_bpm:   null,
    sleep_hours: null,
    recorded_at: new Date().toISOString(),
  }
}

/**
 * TITANS ENGINE — Strato Algoritmico Dinamico
 * ============================================
 * Separazione netta dei due layer architetturali:
 *
 *  STRATO 1 — ENGINE_STATE (questo file)
 *    Gestisce tutto ciò che varia per utente e nel tempo:
 *    telemetria, fenotipo utente, ingestion dei dati, graceful degradation,
 *    risoluzione conflitti, decadimento adattamenti, autoregolazione.
 *
 *  STRATO 2 — TITAN_DB (lib/titans-db.ts)
 *    Knowledge base STATICA dei coach: metodologie, blocchi, KPI, red flags.
 *    NON toccare questo file per logiche dinamiche.
 *
 * Design philosophy (da sessione Gemini + Claude, Marzo 2026):
 *  - Hardware agnostic: nessun brand discriminato, solo tipo sensore e Z-score
 *  - Graceful degradation: il sistema non va mai in blocco per assenza dati
 *  - Allenare l'atleta, non il cruscotto: la performance meccanica batte l'hardware
 *  - Legge del Veto: dolore soggettivo ha priorità assoluta su qualsiasi dato
 *  - Immutabilità storica: il passato non si riscrive, solo il presente si ricalcola
 */

// ─── RE-EXPORT TYPES FROM TITAN_DB FOR CONSUMERS ──────────────────────────────
export type { TitanProfile, AthleteProfile, PeriodizationModel } from './titans-db'

// ─── CANONICAL BLOCK CATALOG (CP-024 Layer 1) ────────────────────────────────
// titans-blocks.ts espone i blocchi canonici con la fisica dell'allenamento.
// L'engine li usa per la collision resolution e per il gate check avanzato.
// titans-types.ts è la fonte autoritativa degli interface condivisi tra tutti i layer.
import { getBlock, checkInterference, hydrateBlock } from './titans-blocks'
import type { GateRequirement, TitanBlockCanonical, ProfileBlockModifier } from './titans-types'

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1A — DATA INGESTION GATE
// Gestisce come e quando i dati entrano nel sistema.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Metodi di ingestion ordinati per confidenza decrescente.
 * - OS_AGGREGATOR: sync automatico silenzioso via Apple Health / Google Connect (best)
 * - B2B_API: aggregatori come Terra/Rook (ottimo, richiede subscription)
 * - FILE_PARSE: upload manuale file FIT/TCX/GPX (buono, asincrono)
 * - OCR_SCREENSHOT: scansione screenshot smartwatch (medio, soggetto a errori OCR)
 * - MANUAL_TYPED: inserimento a mano dall'utente (baseline minima, sempre disponibile)
 */
export type IngestionMethod =
  | 'OS_AGGREGATOR_APPLE_HEALTH'
  | 'OS_AGGREGATOR_GOOGLE_CONNECT'
  | 'B2B_API_TERRA_ROOK'
  | 'FILE_PARSE_FIT_TCX'
  | 'OCR_SCREENSHOT'
  | 'MANUAL_TYPED_ENTRY'

/** Confidenza di default per ogni metodo (0–100) */
export const INGESTION_CONFIDENCE: Record<IngestionMethod, number> = {
  OS_AGGREGATOR_APPLE_HEALTH: 100,
  OS_AGGREGATOR_GOOGLE_CONNECT: 100,
  B2B_API_TERRA_ROOK: 95,
  FILE_PARSE_FIT_TCX: 90,
  OCR_SCREENSHOT: 70,       // variabile: può scendere sotto 85 → quarantena
  MANUAL_TYPED_ENTRY: 60,
}

/** Soglia minima di confidenza per attivare trigger algoritmici automatici */
export const CONFIDENCE_THRESHOLD_ACTIVE = 85

export interface DataIngestionGate {
  /** Come il dato è entrato nel sistema */
  ingestion_method: IngestionMethod
  /**
   * Confidenza dell'estrazione (0–100).
   * Sotto 85 per OCR → dato in quarantena (non attiva trigger, richiede conferma utente).
   */
  extraction_confidence_score: number
  /** ISO timestamp di quando l'evento fisiologico è avvenuto (l'allenamento reale) */
  event_timestamp: string
  /** ISO timestamp di quando il dato è entrato nel DB (upload/sync) */
  upload_timestamp: string
  /**
   * Delta in ore tra evento e upload.
   * > 48h → innesca Retroactive_Sync (ricalcolo stato fatica attuale senza riscrivere storico).
   */
  latency_hours: number
  /** Se true il dato è in quarantena OCR: non altera carichi, richiede conferma UI */
  quarantined?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1B — TELEMETRY VALIDATION (Hardware Agnostic)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tipo di sensore (non brand).
 * La differenza reale non è Garmin vs Suunto vs Honor:
 * è fascia toracica ECG (gold standard) vs sensore ottico da polso (PPG).
 * Tutti gli smartwatch commerciali — qualsiasi prezzo — usano PPG.
 */
export type SensorType =
  | 'ECG_CHEST_STRAP'       // Gold standard (Polar H10, Garmin HRM-Pro)
  | 'OPTICAL_WRIST_OR_RING' // Tutti gli smartwatch/smartband commerciali (Garmin, Suunto, Polar, Samsung, Huawei, Honor, Amazfit, Xiaomi, Apple, Oura...)
  | 'UNKNOWN_GENERIC'        // Fallback se il sensore non è identificabile

/**
 * Il motore non usa MAI valori assoluti dall'hardware commerciale.
 * Usa solo lo Z-Score sulla rolling baseline a 14 giorni dell'utente.
 * Un Amazfit usato costantemente è più affidabile di un Garmin usato a singhiozzo.
 */
export type CalculationMethod = '14_DAY_ROLLING_Z_SCORE'

export interface TelemetryDensity {
  /** Giorni minimi con dato valido richiesti su 14 (default: 10 = 70%) */
  minimum_valid_days_required: number
  /** Giorni effettivamente tracciati negli ultimi 14 */
  current_valid_days: number
  /**
   * Se false → hardware "zittito".
   * Il motore passa a Fallback Tier 2 (wizard soggettivo).
   * Previene falsi allarmi da una lettura isolata dopo 5 giorni di vuoto.
   */
  is_density_valid: boolean
}

export interface CalibrationStatus {
  /** Giorni trascorsi dal primo sync */
  days_since_first_sync: number
  /**
   * True nei primi 14 giorni → CALIBRATION_MODE.
   * In calibration mode l'hardware registra ma non decide.
   * Le decisioni si basano su performance meccanica + wizard soggettivo.
   * La progressione è cappata al +5%/settimana come misura precauzionale.
   */
  is_calibrating: boolean
}

export interface TelemetryValidation {
  sensor_type: SensorType
  /** Sempre Z-score: mai valori assoluti per sensori ottici commerciali */
  calculation_method: CalculationMethod
  ingestion_gate: DataIngestionGate
  data_density: TelemetryDensity
  calibration_status: CalibrationStatus
}

/**
 * Determina se il dato hardware è affidabile abbastanza da influenzare le decisioni.
 * Se ritorna 'MUTE_HARDWARE', il motore ignora la telemetria e usa i fallback.
 */
export function evaluateHardwareAuthority(
  telemetry: TelemetryValidation
): 'TRUST_HARDWARE' | 'MUTE_HARDWARE' {
  // Regola 1: Prime 2 settimane → accumula baseline, non decidere
  if (telemetry.calibration_status.is_calibrating) {
    return 'MUTE_HARDWARE'
  }
  // Regola 2: Dati a singhiozzo → statistica corrotta → taci
  if (!telemetry.data_density.is_density_valid) {
    return 'MUTE_HARDWARE'
  }
  // Regola 3: OCR sotto soglia confidenza → quarantena
  if (
    telemetry.ingestion_gate.ingestion_method === 'OCR_SCREENSHOT' &&
    telemetry.ingestion_gate.extraction_confidence_score < CONFIDENCE_THRESHOLD_ACTIVE
  ) {
    return 'MUTE_HARDWARE'
  }
  return 'TRUST_HARDWARE'
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1C — FENOTIPO UTENTE (Machine Learning Individuale)
// ═══════════════════════════════════════════════════════════════════════════════

export type TissueVulnerability =
  | 'KNEE_TENDON'
  | 'LOWER_BACK'
  | 'HAMSTRING'
  | 'ACHILLES'
  | 'SHOULDER_ROTATOR'
  | 'NONE'

/**
 * Profilo fenotipico individuale — aggiornato dal motore nel tempo.
 * Codifica le caratteristiche di risposta fisiologica specifiche dell'utente,
 * non presunte dalla letteratura ma apprese dall'uso reale.
 */
export interface UserPhenotype {
  user_id: string

  /**
   * Moltiplicatore di recupero individuale.
   * Default: 1.0 (nella media della letteratura).
   * Scende a 0.8 se l'utente fallisce ripetutamente i Progression Gates
   * → il motore allunga i tempi di blocco del 20% per questo fenotipo.
   * Sale fino a 1.3 se supera i gate sistematicamente in anticipo.
   */
  dynamic_recovery_multiplier: number

  /**
   * Vulnerabilità tissutale specifica — identificata dai fail dei Progression Gates.
   * Es: se l'utente blocca ripetutamente su gate 'HAMSTRING_VAS_PAIN <= 2',
   * il sistema deduce vulnerabilità HAMSTRING e aumenta la cautela su blocchi
   * con tendon_load_type = 'high_eccentric' o 'high_plyometric'.
   */
  specific_tissue_vulnerability: TissueVulnerability

  /**
   * Carico allostatico totale (0–100).
   * Somma ponderata di: stress lavorativo (wizard), privazione sonno (HRV),
   * deficit calorico stimato (bilancia + nutrition log), stress psicologico (RPE anomali).
   * > 80 → il motore shifta la via metabolica da glicolitica ad alattacida/ossidativa.
   */
  allostatic_load_score: number

  /**
   * Accuratezza interocettiva (0–100).
   * Misura la capacità dell'utente di valutare il proprio stato fisiologico.
   * Calcolata confrontando le risposte del wizard soggettivo con i dati hardware
   * caricati in ritardo (retroactive sync).
   * Es: utente risponde "sonno 5/5" → hardware mostra HRV crollata → discrepanza rilevata.
   * Bassa interocezione → motore riduce il peso del wizard nelle decisioni future.
   */
  interoception_accuracy_score: number

  /**
   * Affidabilità delle risposte manuali (wizard).
   * Derivata da interoception_accuracy_score:
   * - HIGH (>70): il wizard ha piena autorità quando l'hardware è assente
   * - MODERATE (40–70): il wizard è tenuto in considerazione ma con cautela
   * - LOW_IGNORE (<40): il motore ignora le risposte positive del wizard e
   *   applica Graceful Degradation conservativa di default
   * NOTA: dolore articolare (VAS) mantiene potere di veto anche a LOW_IGNORE.
   */
  subjective_prompt_reliability: 'HIGH' | 'MODERATE' | 'LOW_IGNORE'
}

/** Fenotipo neutro di default per nuovi utenti (prima del profiling) */
export const DEFAULT_USER_PHENOTYPE: Omit<UserPhenotype, 'user_id'> = {
  dynamic_recovery_multiplier: 1.0,
  specific_tissue_vulnerability: 'NONE',
  allostatic_load_score: 50,
  interoception_accuracy_score: 60,
  subjective_prompt_reliability: 'MODERATE',
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1D — GRACEFUL DEGRADATION (Cascata di Sicurezza)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Livello operativo del motore in base alla qualità dei dati disponibili.
 *
 * TIER_1_HARDWARE: Telemetria automatica, Z-score affidabile.
 *   Progressioni normali. Trigger hardware attivi.
 *
 * TIER_2_SUBJECTIVE: Wizard soggettivo come pilota primario.
 *   Progressioni cappate al +5%/settimana.
 *   Blocchi rischiosi (1RM test, sprint massimali) richiedono conferma esplicita.
 *
 * TIER_3_SHADOW: Nessun dato (né hardware né wizard per >48h).
 *   Profilo Ombra: l'utente è considerato in stress subclinico di default.
 *   Blocchi HIGH_RISK disabilitati finché non arriva almeno Tier 2.
 *   Progressione congelata.
 *
 * CALIBRATION_MODE: Primi 14 giorni.
 *   Hardware in ascolto passivo (raccoglie baseline).
 *   Opera come Tier 2 con cap +5%/settimana.
 */
export type OperationalTier =
  | 'TIER_1_HARDWARE'
  | 'TIER_2_SUBJECTIVE'
  | 'TIER_3_SHADOW'
  | 'CALIBRATION_MODE'

export interface DegradationState {
  current_tier: OperationalTier
  max_weekly_volume_increase_pct: number   // 10 (T1) | 5 (T2/CAL) | 0 (T3)
  high_risk_blocks_enabled: boolean        // false in T3 e CALIBRATION
  require_explicit_confirm_for_intensity: boolean
  reason: string                           // Descrizione human-readable per UI
}

/** Calcola il tier operativo in base allo stato della telemetria e del wizard */
export function computeOperationalTier(params: {
  telemetry: TelemetryValidation | null
  wizard_answered_today: boolean
  hours_since_last_wizard: number
  phenotype: UserPhenotype
}): DegradationState {
  const { telemetry, wizard_answered_today, hours_since_last_wizard, phenotype } = params

  // TIER 3: nessun dato da >48h
  if (!wizard_answered_today && hours_since_last_wizard > 48) {
    return {
      current_tier: 'TIER_3_SHADOW',
      max_weekly_volume_increase_pct: 0,
      high_risk_blocks_enabled: false,
      require_explicit_confirm_for_intensity: true,
      reason: 'Nessun dato per oltre 48h. Modalità ombra attiva: progressione congelata, sessioni ad alto rischio disabilitate.',
    }
  }

  // CALIBRATION MODE: prime 2 settimane di telemetria
  if (telemetry && telemetry.calibration_status.is_calibrating) {
    return {
      current_tier: 'CALIBRATION_MODE',
      max_weekly_volume_increase_pct: 5,
      high_risk_blocks_enabled: false,
      require_explicit_confirm_for_intensity: true,
      reason: `Calibrazione hardware in corso (giorno ${telemetry.calibration_status.days_since_first_sync}/14). Operatività su wizard soggettivo.`,
    }
  }

  // TIER 1: telemetria affidabile
  if (telemetry && evaluateHardwareAuthority(telemetry) === 'TRUST_HARDWARE') {
    return {
      current_tier: 'TIER_1_HARDWARE',
      max_weekly_volume_increase_pct: 10,
      high_risk_blocks_enabled: true,
      require_explicit_confirm_for_intensity: false,
      reason: 'Telemetria hardware affidabile. Motore operativo a piena capacità.',
    }
  }

  // TIER 2: solo wizard soggettivo
  return {
    current_tier: 'TIER_2_SUBJECTIVE',
    max_weekly_volume_increase_pct: phenotype.subjective_prompt_reliability === 'LOW_IGNORE' ? 3 : 5,
    high_risk_blocks_enabled: wizard_answered_today,
    require_explicit_confirm_for_intensity: phenotype.subjective_prompt_reliability !== 'HIGH',
    reason: 'Hardware non disponibile o insufficiente. Navigazione su wizard soggettivo.',
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1E — RESILIENT RED FLAGS (Trigger con Cascata di Fallback)
// ═══════════════════════════════════════════════════════════════════════════════

export type TelemetrySource =
  | 'smartwatch_hrv'
  | 'smart_scale_hydration'
  | 'user_pain_vas'
  | 'user_morning_readiness_prompt'
  | 'user_bodyweight_trend'
  | 'predictive_fatigue_model'

export type LogicCondition =
  | '<' | '<=' | '>' | '>=' | '==' | 'spike_deviation' | 'drop_deviation'

export type ActionCode =
  | 'FORCE_DELOAD'
  | 'REDUCE_ACCESSORY_VOLUME'
  | 'HALT_HIGH_SPEED_RUNNING'
  | 'SHIFT_TO_RECOVERY'
  | 'MAINTAIN'
  | 'MAINTAIN_PROGRESSION_LOG_HARDWARE_ANOMALY'

/**
 * Red flag con cascata di fallback.
 * Il motore prova sempre prima la sorgente primaria (hardware).
 * Se non disponibile, scende al fallback_1 (wizard).
 * Se nemmeno quello c'è, usa il modello predittivo (fallback_2).
 *
 * NOTA: user_pain_vas ha sempre priorità assoluta (Legge del Veto)
 * indipendentemente dal tier operativo e dall'interoception_accuracy_score.
 */
export interface ResilientRedFlag {
  /** Sorgente primaria (preferita) */
  primary_source: TelemetrySource
  /** Fallback se primary non disponibile */
  fallback_1_source: TelemetrySource
  /** Fallback di ultima istanza (modello predittivo) */
  fallback_2_source: TelemetrySource

  condition: LogicCondition
  /** Soglia per primary_source (Z-score per hardware, es. -1.5 = 1.5 dev std sotto media) */
  threshold: number
  /** Soglia per fallback_1 (scala Wizard, es. 2/5 per readiness) */
  fallback_1_threshold: number

  action_code: ActionCode
  /**
   * Se true: l'uso dei fallback (invece dell'hardware) rallenta le future progressioni.
   * Registra che il sistema opera con bassa confidenza.
   */
  confidence_penalty: boolean
  /** Spiegazione human-readable per l'utente in UI */
  ui_explanation: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1F — TITAN BLOCK ULTIMATE (Blocco di Allenamento Algoritmico)
// ═══════════════════════════════════════════════════════════════════════════════

export type KineticChain = 'anterior' | 'posterior' | 'lateral' | 'rotational'
export type TendonLoadType = 'low' | 'moderate' | 'high_eccentric' | 'high_plyometric'
export type MetabolicPathway = 'alactic' | 'glycolytic' | 'oxidative'
export type TechnicalTolerance = 'zero' | 'moderate' | 'high_fatigue_allowed'
export type RestType = 'passive' | 'active' | 'full_recovery'

/**
 * Versione algoritmica estesa del TitanBlock.
 * Usata per i profili che richiedono calcolo dinamico avanzato.
 * I profili esistenti in titans-db.ts usano TitanBlock (semplificato):
 * questo tipo serve al motore per blocchi generati o adattati runtime.
 *
 * Dimensioni aggiunte vs TitanBlock base:
 * 1. tissue_load_matrix    → usura articolare/tendinea calcolabile
 * 2. interference_penalties → conflitti metabolici/neurali con altri blocchi
 * 3. gates                 → progressione basata su KPI fisiologici, non tempo
 * 4. adaptation_decay      → emivita dell'adattamento e dosi di richiamo
 * 5. autoregulation_caps   → freno a mano intra-sessione (velocità, RPE, tecnica)
 * 6. execution_constraints → fattibilità contestuale (attrezzatura, tempo)
 * 7. metabolic_cost        → costo termodinamico per allostatic load check
 */
export interface TitanBlockUltimate {
  block_id: string
  name: string

  // ── Dosaggio Meccanico ──────────────────────────────────────────────────────
  mechanical_dosage: {
    min_reps?: number
    max_reps?: number
    distance_meters?: number
    duration_sec?: number
    rest_sec?: number
    rest_type?: RestType
    intensity_zone?: string    // es. '90-100% vVO2max', '85-100% 1RM', 'Z2'
  }

  // ── 1. Matrice di Carico Tissutale ──────────────────────────────────────────
  // Permette di calcolare l'usura locale e prevenire algoritmi di collisione.
  tissue_load_matrix: {
    primary_kinetic_chain: KineticChain
    /** Punteggio stress articolare 0–10 per ogni joint */
    joint_stress_score: {
      knee: number
      hip: number
      ankle: number
      spine: number
    }
    tendon_load_type: TendonLoadType
  }

  // ── 2. Interferenza e Drenaggio Sistemico ───────────────────────────────────
  // Usato dalla CollisionMatrix per evitare incompatibilità nelle 24h.
  interference_penalties: {
    /** Impatto sul Sistema Nervoso Centrale 0–10. 10 = seduta sprint massimale */
    cns_drain_score: number
    metabolic_pathway: MetabolicPathway
    /**
     * Blocchi incompatibili nelle successive 24h.
     * Es: dopo sprint massimali, no stacchi pesanti (SNC e ischi condivisi).
     */
    incompatible_within_24h: string[]
  }

  // ── 3. Progression Gates (Macchina a Stati Fisiologici) ─────────────────────
  // Sostituisce la logica temporale con criteri fisiologici reali.
  gates: {
    /** KPI che devono essere soddisfatti per ENTRARE nel blocco */
    entry_kpi_requirements: string[]
    /** Criterio fisiologico per USCIRE (passare al blocco successivo) */
    exit_kpi_criteria: string
  }

  // ── 4. Decadimento Adattamento ──────────────────────────────────────────────
  // L'orologio biologico della qualità allenata.
  adaptation_decay: {
    /**
     * Emivita in giorni dell'adattamento.
     * Velocità massima: ~5 giorni
     * Forza massima: ~25–30 giorni
     * Base aerobica: ~30 giorni
     * Coordinazione/Tecnica: ~30+ giorni
     */
    residual_effect_half_life_days: number
    /**
     * Dose minima di mantenimento per resettare il timer del decadimento.
     * Stringa descrittiva per il motore di generazione piano.
     * Es: '3x20m_MAX_SPRINT_PRE_WORKOUT'
     */
    maintenance_minimum_dose: string
  }

  // ── 5. Autoregolazione Intra-Sessione ───────────────────────────────────────
  // Il "freno a mano algoritmico" che ferma la serie prima del previsto.
  autoregulation_caps: {
    /**
     * % di calo della velocità di esecuzione che interrompe la serie.
     * Se il GPS o il timer registra un degrado >X%, la serie finisce.
     * Es: sprint al 10% più lento → stop.
     */
    velocity_drop_cutoff_percent?: number
    /** Soglia RPE che, se raggiunta prima del previsto, interrompe il blocco */
    rpe_stop_cap?: number
    technical_breakdown_tolerance: TechnicalTolerance
  }

  // ── 6. Vincoli di Eseguibilità ──────────────────────────────────────────────
  // Il motore esclude il blocco se i prerequisiti fisici non sono soddisfatti.
  execution_constraints: {
    /** Lista attrezzatura necessaria — es. 'flat_ground_30m', 'barbell', 'gps_tracker' */
    required_equipment: string[]
    /** Finestra temporale minima in minuti. Se l'utente ha meno tempo → blocco escluso */
    minimum_time_window_min: number
  }

  // ── 7. Costo Metabolico (Termodinamica) ─────────────────────────────────────
  // Usato per l'allostatic load check: se i depositi sono bassi, certi blocchi vengono
  // sostituiti automaticamente con varianti a pathway diverso.
  metabolic_cost: {
    primary_fuel: 'ATP_PC' | 'GLYCOGEN' | 'FATTY_ACIDS'
    /** Consumo stimato in kcal/min durante il blocco */
    estimated_kcal_per_minute: number
    /**
     * Score idratazione minimo richiesto (da bilancia smart o wizard).
     * 0 = nessun prerequisito, 100 = idratazione perfetta richiesta.
     */
    minimum_hydration_score: number
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1G — COLLISION RESOLVER
// Risolve conflitti tra blocchi di coach diversi quando vengono fusi
// ═══════════════════════════════════════════════════════════════════════════════

export type ResolutionProtocol =
  | 'DEGRADE_SECONDARY'       // Il blocco meno prioritario viene depotenziato (es. sprint sub-massimali)
  | 'SEPARATE_BY_48H'         // I blocchi vengono distribuiti a 48h di distanza
  | 'SHIFT_METABOLIC_PATHWAY' // Il blocco secondario cambia via metabolica (es. da glicolitico ad alattacido)

export interface CollisionResolver {
  /** IDs dei blocchi che entrano in conflitto (es. 'P01_SPRINT' + 'P27_HEAVY_SQUAT') */
  active_block_ids: string[]
  conflict_detected: boolean
  resolution_protocol: ResolutionProtocol
  /**
   * Il blocco che ha vinto la priorità in base all'obiettivo primario dell'utente.
   * Es: obiettivo STRENGTH → il blocco forza mantiene il 100%, lo sprint si degrada.
   */
  priority_block_id: string
  /** Descrizione della risoluzione applicata per log/debug */
  resolution_explanation: string
}

/**
 * Risolve automaticamente la collisione tra due blocchi incompatibili.
 * Usa l'obiettivo primario dell'utente per determinare quale blocco ha priorità.
 */
export function resolveBlockCollision(params: {
  block_a: TitanBlockUltimate
  block_b: TitanBlockUltimate
  user_primary_objective: 'STRENGTH' | 'ENDURANCE' | 'SPORT_PERFORMANCE' | 'HYPERTROPHY' | 'WEIGHT_LOSS'
}): CollisionResolver {
  const { block_a, block_b, user_primary_objective } = params

  // Verifica incompatibilità nelle 24h
  const aBlocksB = block_a.interference_penalties.incompatible_within_24h.some(
    tag => block_b.block_id.includes(tag) || block_b.name.toUpperCase().includes(tag)
  )
  const bBlocksA = block_b.interference_penalties.incompatible_within_24h.some(
    tag => block_a.block_id.includes(tag) || block_a.name.toUpperCase().includes(tag)
  )

  if (!aBlocksB && !bBlocksA) {
    return {
      active_block_ids: [block_a.block_id, block_b.block_id],
      conflict_detected: false,
      resolution_protocol: 'DEGRADE_SECONDARY',
      priority_block_id: block_a.block_id,
      resolution_explanation: 'Nessun conflitto rilevato. Entrambi i blocchi possono coesistere.',
    }
  }

  // Determina priorità in base all'obiettivo
  const strengthFavored: Record<string, boolean> = {
    STRENGTH: true,
    HYPERTROPHY: true,
    SPORT_PERFORMANCE: false,
    ENDURANCE: false,
    WEIGHT_LOSS: false,
  }

  const aIsStrength = block_a.interference_penalties.metabolic_pathway === 'alactic' &&
    block_a.tissue_load_matrix.joint_stress_score.spine > 5
  const priorityBlock = (strengthFavored[user_primary_objective] && aIsStrength)
    ? block_a : block_b
  const secondaryBlock = priorityBlock === block_a ? block_b : block_a

  // Sceglie protocollo di risoluzione
  let protocol: ResolutionProtocol = 'SEPARATE_BY_48H'
  if (block_a.interference_penalties.cns_drain_score >= 8 || block_b.interference_penalties.cns_drain_score >= 8) {
    protocol = 'SEPARATE_BY_48H'
  } else if (block_a.interference_penalties.metabolic_pathway !== block_b.interference_penalties.metabolic_pathway) {
    protocol = 'SHIFT_METABOLIC_PATHWAY'
  } else {
    protocol = 'DEGRADE_SECONDARY'
  }

  return {
    active_block_ids: [block_a.block_id, block_b.block_id],
    conflict_detected: true,
    resolution_protocol: protocol,
    priority_block_id: priorityBlock.block_id,
    resolution_explanation: `Conflitto ${block_a.block_id} ↔ ${block_b.block_id}. Protocollo: ${protocol}. Priorità a ${priorityBlock.block_id} per obiettivo ${user_primary_objective}. Blocco secondario ${secondaryBlock.block_id} ${protocol === 'DEGRADE_SECONDARY' ? 'depotenziato' : protocol === 'SEPARATE_BY_48H' ? 'spostato di 48h' : 'via metabolica modificata'}.`,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1H — HARDWARE CONFLICT RESOLVER
// Quando hardware e performance reale si contraddicono, chi vince?
// ═══════════════════════════════════════════════════════════════════════════════

export interface HardwareConflictResolver {
  /**
   * Se true: se la performance meccanica è in target E l'RPE è accettabile,
   * il sistema ignora l'allarme dell'hardware commerciale (ottico da polso).
   *
   * Rationale: Un sensore ottico economico può leggere HRV bassa perché il
   * cinturino era largo, la temp cutanea era alta, c'era luce solare diretta.
   * Un atleta che chiude gli sprint ai tempi previsti senza degrado tecnico
   * sta adattando. Non si frena chi vola sulla base di un pixel.
   */
  override_optical_sensor_if_performance_high: boolean
  /**
   * Quanti giorni CONSECUTIVI di allerta hardware sono necessari per
   * forzare uno scarico su un utente che dichiara di stare bene E performa.
   * Default: 3 giorni consecutivi di Z-score anomalo.
   */
  consecutive_hardware_warnings_to_force_action: number
}

export const DEFAULT_HARDWARE_CONFLICT_RESOLVER: HardwareConflictResolver = {
  override_optical_sensor_if_performance_high: true,
  consecutive_hardware_warnings_to_force_action: 3,
}

/**
 * Gerarchia della Verità — risolve conflitti totali tra sorgenti dati.
 *
 * ORDINE DI PRIORITÀ (non modificabile):
 *  1. Dolore clinico (VAS ≥ 4) → VETO ASSOLUTO su qualsiasi dato positivo
 *  2. Performance meccanica (target raggiunti senza degrado tecnico)
 *  3. Interocezione soggettiva (RPE, wizard)
 *  4. Telemetria hardware (utile per anticipare, non per frenare chi performa)
 */
export function resolveTelemetryConflict(params: {
  hardware_signal: 'RED_DELOAD' | 'YELLOW_CAUTION' | 'GREEN_OK'
  user_pain_vas: number            // 0–10 (VAS)
  user_rpe: number                 // 1–10
  performance_quality: 'HIT_TARGETS' | 'PARTIAL' | 'MISSED_TARGETS'
  sensor_type: SensorType
  consecutive_hardware_warnings: number
  resolver: HardwareConflictResolver
}): ActionCode {
  const { hardware_signal, user_pain_vas, user_rpe, performance_quality, sensor_type,
    consecutive_hardware_warnings, resolver } = params

  // LEGGE 1: Il dolore ha il veto assoluto — sempre, senza eccezioni
  if (user_pain_vas >= 4) {
    return 'HALT_HIGH_SPEED_RUNNING'
  }
  if (user_pain_vas >= 7) {
    return 'FORCE_DELOAD'
  }

  // LEGGE 2: Se la performance è eccellente e l'utente sta bene
  if (
    performance_quality === 'HIT_TARGETS' &&
    user_rpe <= 6 &&
    resolver.override_optical_sensor_if_performance_high &&
    sensor_type === 'OPTICAL_WRIST_OR_RING' &&
    hardware_signal === 'RED_DELOAD'
  ) {
    // L'atleta vince sull'hardware economico — log anomalia, non frenare
    return 'MAINTAIN_PROGRESSION_LOG_HARDWARE_ANOMALY'
  }

  // LEGGE 3: Hardware consecutivamente in allarme + performance che inizia a scendere
  if (
    hardware_signal === 'RED_DELOAD' &&
    consecutive_hardware_warnings >= resolver.consecutive_hardware_warnings_to_force_action &&
    performance_quality !== 'HIT_TARGETS'
  ) {
    return 'FORCE_DELOAD'
  }

  // LEGGE 4: Cauzione gialla + RPE alto
  if (hardware_signal === 'YELLOW_CAUTION' && user_rpe >= 8) {
    return 'REDUCE_ACCESSORY_VOLUME'
  }

  return 'MAINTAIN'
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1I — BLOCK FEASIBILITY CHECK
// Verifica se un blocco è eseguibile nel contesto attuale dell'utente
// ═══════════════════════════════════════════════════════════════════════════════

export interface BlockFeasibilityResult {
  feasible: boolean
  block_id: string
  rejection_reasons: string[]
  suggested_alternative?: string
}

/**
 * Verifica se un TitanBlockUltimate può essere eseguito dall'utente
 * considerando: stato allostatico, attrezzatura, tempo, vulnerabilità tissutale.
 */
export function validateBlockExecution(params: {
  block: TitanBlockUltimate
  user: UserPhenotype
  available_equipment: string[]
  available_time_min: number
  degradation_state: DegradationState
}): BlockFeasibilityResult {
  const { block, user, available_equipment, available_time_min, degradation_state } = params
  const reasons: string[] = []

  // Check 1: Tempo disponibile
  if (available_time_min < block.execution_constraints.minimum_time_window_min) {
    reasons.push(`Tempo insufficiente: disponibili ${available_time_min}min, richiesti ${block.execution_constraints.minimum_time_window_min}min`)
  }

  // Check 2: Attrezzatura
  const missingEquip = block.execution_constraints.required_equipment.filter(
    eq => !available_equipment.includes(eq)
  )
  if (missingEquip.length > 0) {
    reasons.push(`Attrezzatura mancante: ${missingEquip.join(', ')}`)
  }

  // Check 3: Carico allostatico vs costo glicolitico
  if (
    block.metabolic_cost.primary_fuel === 'GLYCOGEN' &&
    user.allostatic_load_score > 80
  ) {
    reasons.push(`Carico allostatico critico (${user.allostatic_load_score}/100): lavori glicolitici controindicati. Usare blocchi alattacidi o ossidativi.`)
  }

  // Check 4: Vulnerabilità tissutale vs tendon load
  const vulnerabilityBlocksHighLoad =
    user.specific_tissue_vulnerability !== 'NONE' &&
    (block.tissue_load_matrix.tendon_load_type === 'high_eccentric' ||
      block.tissue_load_matrix.tendon_load_type === 'high_plyometric')
  if (vulnerabilityBlocksHighLoad) {
    reasons.push(`Vulnerabilità ${user.specific_tissue_vulnerability}: blocchi ad alto carico eccentrico/pliometrico controindicati.`)
  }

  // Check 5: Tier 3 (shadow) blocca blocchi rischiosi
  if (!degradation_state.high_risk_blocks_enabled && block.interference_penalties.cns_drain_score >= 8) {
    reasons.push('Modalità ombra attiva: blocchi ad alto drenaggio SNC disabilitati finché non tornano i dati.')
  }

  return {
    feasible: reasons.length === 0,
    block_id: block.block_id,
    rejection_reasons: reasons,
    suggested_alternative: reasons.length > 0 ? 'Considera una sessione Z2 aerobica o forza a bassa intensità (50–65% 1RM).' : undefined,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1J — DYNAMIC GRIT SCORE & FUSION WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcola il Grit Score dinamico dell'utente.
 * Non si basa sull'autovalutazione (bias altissimo) ma su:
 * - compliance_rate: % sessioni completate vs pianificate (peso 60%)
 * - base_grit: punteggio audit psicofisico iniziale (peso 40%)
 * - penalità per sessioni saltate per mancanza di motivazione (non infortunio/lavoro)
 */
export function calculateDynamicGritScore(params: {
  base_grit: number              // 0–100 da audit psicofisico
  compliance_rate_pct: number    // 0–100 (sessioni fatte / pianificate × 100)
  /** Sessioni saltate per demotivazione (escludendo infortunio, lavoro, forza maggiore) */
  missed_for_motivation: number
}): number {
  const { base_grit, compliance_rate_pct, missed_for_motivation } = params
  let dynamic = (base_grit * 0.4) + (compliance_rate_pct * 0.6)
  // Penalità per mancanza di disciplina (5 punti per sessione saltata senza motivo valido)
  dynamic -= missed_for_motivation * 5
  return Math.max(0, Math.min(100, Math.round(dynamic)))
}

/**
 * Calcola i pesi di fusione DINAMICI in base allo stato di prontezza dell'utente.
 *
 * Logica: se la readiness è critica (<40), il motore aumenta automaticamente
 * il peso dei profili di load management (Gabbett P05) e riduce quelli
 * orientati all'alta intensità (Pintus P01, Buchheit P03).
 *
 * Dipende da buildFusionWeights in titans-db.ts per i pesi base.
 */
export function buildDynamicFusionWeights(params: {
  titan_ids: string[]
  user_readiness_score: number  // 0–100
  /** Mappa id → fusionWeight.recommendedPercent da titans-db */
  base_weights: Record<string, number>
}): Record<string, number> {
  const { titan_ids, user_readiness_score, base_weights } = params
  const weights: Record<string, number> = {}
  let total = 0

  for (const id of titan_ids) {
    let w = base_weights[id] ?? 10
    if (user_readiness_score < 40) {
      // Readiness critica: priorità al load management, meno intensità
      if (id === 'P05') w *= 3      // Gabbett: triplo peso
      if (['P01', 'P03', 'P04', 'P40'].includes(id)) w *= 0.5 // HI profiles: dimezzati
    } else if (user_readiness_score > 80) {
      // Prontezza alta: si può spingere di più sull'intensità
      if (['P04', 'P03', 'P16'].includes(id)) w *= 1.2
    }
    weights[id] = w
    total += w
  }

  // Normalizza a 100%
  const result: Record<string, number> = {}
  for (const id of titan_ids) {
    result[id] = Math.round((weights[id] / total) * 100)
  }
  return result
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 1K — RETROACTIVE SYNC
// Gestisce i dati caricati in ritardo (upload posticipato di 48h+)
// ═══════════════════════════════════════════════════════════════════════════════

export interface RetroactiveSyncResult {
  /** Il passato rimane immutato */
  historical_sessions_modified: false
  /** Solo il presente viene aggiornato */
  current_fatigue_state_updated: boolean
  /** Aggiornamento dell'indice interocettivo (utente aveva sottostimato/sovrastimato) */
  interoception_delta: number  // positivo = era più preciso di quanto pensavamo, negativo = meno
  /** Azione da applicare alla sessione CORRENTE (non passate) */
  action_for_today: ActionCode
  summary: string
}

/**
 * Processa un upload posticipato di dati hardware (es. sync dopo 3 giorni).
 * NON modifica le sessioni storiche (immutabilità).
 * Aggiorna lo stato di fatica CORRENTE e l'indice interocettivo.
 */
export function processRetroactiveSync(params: {
  /** Risposte wizard per i giorni mancanti */
  wizard_responses_past: Array<{ day: string; readiness: number; sleep: number }>
  /** Dati hardware effettivi per quegli stessi giorni */
  hardware_data_past: Array<{ day: string; hrv_zscore: number; sleep_score: number }>
  phenotype: UserPhenotype
}): RetroactiveSyncResult {
  const { wizard_responses_past, hardware_data_past, phenotype } = params

  // Confronta wizard vs hardware per misurare il delta interocettivo
  let interoception_delta = 0
  for (let i = 0; i < Math.min(wizard_responses_past.length, hardware_data_past.length); i++) {
    const wiz = wizard_responses_past[i]
    const hw = hardware_data_past[i]
    // wizard 1–5 normalizzato in 0–1, hrv_zscore interpretato come positivo=buono
    const wiz_normalized = wiz.readiness / 5
    const hw_normalized = Math.max(0, Math.min(1, (hw.hrv_zscore + 2) / 4)) // Z-score [-2, 2] → [0, 1]
    interoception_delta += (hw_normalized - wiz_normalized)
  }
  interoception_delta = interoception_delta / Math.max(1, wizard_responses_past.length)

  // Calcola stato fatica attuale sommando l'hardware storico (non il wizard)
  const avg_hrv_zscore = hardware_data_past.reduce((s, d) => s + d.hrv_zscore, 0) / Math.max(1, hardware_data_past.length)
  let action_for_today: ActionCode = 'MAINTAIN'
  if (avg_hrv_zscore <= -1.5) action_for_today = 'FORCE_DELOAD'
  else if (avg_hrv_zscore <= -1.0) action_for_today = 'REDUCE_ACCESSORY_VOLUME'

  return {
    historical_sessions_modified: false,
    current_fatigue_state_updated: true,
    interoception_delta: Math.round(interoception_delta * 100) / 100,
    action_for_today,
    summary: `Sync retroattivo: ${hardware_data_past.length} giorni riconciliati. ` +
      `Delta interocettivo: ${interoception_delta > 0 ? '+' : ''}${Math.round(interoception_delta * 100)}% ` +
      `(${interoception_delta > 0 ? 'più accurato del previsto' : 'tende a sovrastimare la propria prontezza'}). ` +
      `Azione oggi: ${action_for_today}.`,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & LOOKUP HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Emivite standard dell'adattamento (da letteratura Issurin, Verkhoshansky) */
export const ADAPTATION_HALF_LIFE_DAYS: Record<string, number> = {
  MAX_VELOCITY: 5,
  REACTIVE_STRENGTH: 7,
  ANAEROBIC_CAPACITY: 10,
  MAX_STRENGTH: 25,
  HYPERTROPHY: 20,
  AEROBIC_POWER_VO2MAX: 20,
  AEROBIC_BASE: 30,
  COORDINATION_TECHNIQUE: 35,
}

/** Stima kcal/min per pathway metabolico (per allostatic load check) */
export const METABOLIC_RATE_KCAL_PER_MIN: Record<MetabolicPathway, number> = {
  alactic: 12,    // Sprint brevi: altissima intensità, breve durata
  glycolytic: 8,  // Intervalli medi: moderata-alta intensità
  oxidative: 4,   // Lavoro aerobico: bassa-moderata intensità prolungata
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 2A — Z-SCORE CALCULATOR
// Il cuore matematico del sistema telemetrico.
// Normalizza qualsiasi dato hardware (HRV, sonno, RHR…) sulla baseline
// personale dell'utente, eliminando le differenze tra smartwatch diversi.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcola la media di una serie numerica.
 * Serie vuota → 0 (non si blocca mai).
 */
export function mean(series: number[]): number {
  if (series.length === 0) return 0
  return series.reduce((a, b) => a + b, 0) / series.length
}

/**
 * Calcola la deviazione standard di una serie.
 * Serie con 0 o 1 elemento → 0 (non abbastanza dati per calcolare dispersione).
 */
export function stddev(series: number[]): number {
  if (series.length <= 1) return 0
  const m = mean(series)
  const variance = series.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (series.length - 1)
  return Math.sqrt(variance)
}

/**
 * Calcola lo Z-score di un nuovo valore rispetto alla rolling baseline.
 *
 * Z = (valore_oggi - media_14gg) / deviazione_standard_14gg
 *
 * Interpretazione:
 *   Z > +1.5  → stato eccezionalmente buono (sopra norma)
 *   Z ±1.0    → normalità
 *   Z < -1.0  → attenzione
 *   Z < -1.5  → allerta (trigger RED_DELOAD per HRV)
 *   Z < -2.0  → critico
 *
 * Se la serie ha meno di 5 punti (calibrazione insufficiente) → restituisce null.
 * Il chiamante deve gestire null applicando Graceful Degradation.
 */
export function computeZScore(
  rollingBaseline: number[],
  newValue: number
): number | null {
  // Meno di 5 punti → statistica inaffidabile, non decidere
  if (rollingBaseline.length < 5) return null

  const m = mean(rollingBaseline)
  const sd = stddev(rollingBaseline)

  // Deviazione standard zero = tutti i valori identici = sensore statico
  // (Es. smartband che mostra sempre 42ms) → considera come non affidabile
  if (sd === 0) return null

  return Math.round(((newValue - m) / sd) * 100) / 100
}

/**
 * Mantiene la rolling baseline a 14 giorni.
 * Aggiunge il nuovo valore, rimuove il più vecchio se la finestra supera maxDays.
 */
export function updateRollingBaseline(
  existingBaseline: number[],
  newValue: number,
  maxDays = 14
): number[] {
  const updated = [...existingBaseline, newValue]
  if (updated.length > maxDays) updated.shift()
  return updated
}

/**
 * Interpreta lo Z-score HRV in un segnale semplice per il motore.
 * Usato da resolveTelemetryConflict e computeOperationalTier.
 */
export function interpretHRVSignal(
  zScore: number | null
): 'GREEN_OK' | 'YELLOW_CAUTION' | 'RED_DELOAD' {
  if (zScore === null) return 'YELLOW_CAUTION'   // dati insufficienti → prudenza
  if (zScore >= -1.0) return 'GREEN_OK'
  if (zScore >= -1.5) return 'YELLOW_CAUTION'
  return 'RED_DELOAD'
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 2B — WIZARD RESPONSE
// Le domande esatte che il motore pone ogni mattina all'utente.
// Progettate per essere compilabili in <30 secondi (zero attrito).
// Alimentano il sistema quando l'hardware non è disponibile (Tier 2 e 3).
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Le 5 dimensioni del wizard mattutino.
 *
 * Filosofia di design:
 * - Scale 1–5 (non 1–10): riducono la paralisi da analisi
 * - Domande ancorate a comportamenti osservabili, non stati emotivi vaghi
 * - Il dolore (VAS 0–10) è l'unica scala a 10 punti: massima granularità
 *   perché è la metrica con potere di veto assoluto
 * - Tutte opzionali tranne il dolore: anche 1 risposta è meglio di 0
 */
export interface WizardResponse {
  /** Data dell'auto-valutazione (ISO date, es. "2026-03-25") */
  date: string

  /**
   * Q1 — Qualità del sonno percepita (1–5)
   * Anchor: 1 = ho dormito poco o male, mi sento spossato
   *         3 = sonno normale, niente di speciale
   *         5 = sonno profondo, mi sono svegliato riposatissimo
   * Null = utente ha saltato la domanda
   */
  sleep_quality: 1 | 2 | 3 | 4 | 5 | null

  /**
   * Q2 — Livello di energia generale (1–5)
   * Anchor: 1 = zero energia, movimento difficoltoso
   *         3 = nella media
   *         5 = energia alta, voglia di allenarsi
   */
  energy_level: 1 | 2 | 3 | 4 | 5 | null

  /**
   * Q3 — Fatica muscolare residua (1–5)
   * Anchor: 1 = dolori diffusi, rigidità marcata
   *         3 = un po' di indolenzimento normale
   *         5 = muscoli freschi, nessuna sensazione residua
   */
  muscle_fatigue: 1 | 2 | 3 | 4 | 5 | null

  /**
   * Q4 — Motivazione/umore (1–5)
   * Anchor: 1 = non voglio sentire parlare di allenamento
   *         3 = indifferente, lo farei perché è in programma
   *         5 = non vedo l'ora di iniziare
   * Nota: intenzionalmente separato dall'energia (un atleta può essere stanco
   * ma motivatissimo, o riposato ma demotivato)
   */
  motivation: 1 | 2 | 3 | 4 | 5 | null

  /**
   * Q5 — Dolore localizzato (VAS 0–10)
   * Anchor: 0 = nessun dolore
   *         4 = dolore fastidioso ma gestibile
   *         7 = dolore significativo che limita il movimento
   *        10 = dolore insopportabile
   * Obbligatorio: anche 0 è una risposta valida e importante.
   * Legge del Veto: ≥4 → blocca blocchi ad alto rischio
   *                ≥7 → FORCE_DELOAD immediato
   */
  pain_vas: number   // 0–10, unica scala a 10 punti (max granularità)

  /**
   * Q6 — Localizzazione dolore (testo libero, solo se pain_vas > 0)
   * Es: "ginocchio destro", "lombari", "achilleo sinistro"
   * Usato per aggiornare specific_tissue_vulnerability nel UserPhenotype.
   */
  pain_location?: string

  /**
   * Quante ore di sonno ha dormito (auto-riferito).
   * Usato come proxy quando non c'è hardware che misura il sonno.
   * Null = non risposto.
   */
  sleep_hours_reported?: number | null

  /** Timestamp di quando il wizard è stato compilato (ISO datetime) */
  submitted_at: string
}

/**
 * Converte una WizardResponse in un readiness score aggregato (0–100).
 *
 * Formula pesata:
 *   sleep_quality   25%  (il sonno è il fattore di recupero più importante)
 *   energy_level    25%
 *   muscle_fatigue  20%
 *   motivation      15%
 *   pain_vas        15%  (con logica invertita: più dolore = meno readiness)
 *
 * Campi mancanti (null) → si usa il valore neutro 3/5.
 * Pain_vas ha effetto moltiplicatore: se ≥7 → score cappato a 20/100.
 */
export function wizardToReadinessScore(wizard: WizardResponse): number {
  const s = (wizard.sleep_quality ?? 3) / 5
  const e = (wizard.energy_level ?? 3) / 5
  const m = (wizard.muscle_fatigue ?? 3) / 5
  const mot = (wizard.motivation ?? 3) / 5
  // Dolore: invertito (0 = ottimo, 10 = pessimo) e normalizzato in 0–1
  const painFactor = Math.max(0, 1 - wizard.pain_vas / 10)

  let score = Math.round(
    (s * 25) + (e * 25) + (m * 20) + (mot * 15) + (painFactor * 15)
  )

  // Cap duro: dolore severo → readiness non può superare 20
  if (wizard.pain_vas >= 7) score = Math.min(score, 20)
  // Cap moderato: dolore fastidioso → readiness cappata a 55
  else if (wizard.pain_vas >= 4) score = Math.min(score, 55)

  return Math.max(0, Math.min(100, score))
}

/**
 * Determina se la domanda sul dolore è stata risposta oggi.
 * Il pain_vas è l'unica risposta veramente obbligatoria.
 */
export function wizardIsValid(wizard: WizardResponse | null): boolean {
  if (!wizard) return false
  return typeof wizard.pain_vas === 'number' && wizard.pain_vas >= 0
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 2C — GATE EVALUATOR
// Parsifica e valuta le stringhe KPI dei Progression Gates.
// Es: "HAMSTRING_VAS_PAIN <= 2" → true/false in base ai dati reali.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mappa dei KPI disponibili per la valutazione dei gate.
 * I valori vengono popolati al momento della valutazione
 * con i dati reali dell'utente (wizard + telemetria + log allenamenti).
 */
export interface GateKPIContext {
  // Pain & Recovery
  HAMSTRING_VAS_PAIN?: number           // 0–10
  ACHILLES_VAS_PAIN?: number            // 0–10
  KNEE_VAS_PAIN?: number                // 0–10
  LOWER_BACK_VAS_PAIN?: number          // 0–10
  SHOULDER_VAS_PAIN?: number            // 0–10
  GENERAL_VAS_PAIN?: number             // 0–10 (da wizard pain_vas)

  // Fitness prerequisites
  SQUAT_1RM_KG?: number
  DEADLIFT_1RM_KG?: number
  BENCH_1RM_KG?: number
  BODYWEIGHT_KG?: number
  SQUAT_TO_BW_RATIO?: number            // squat_1rm / bodyweight
  FTP_WATTS?: number
  VO2MAX_ML_KG_MIN?: number
  VDOT?: number

  // Performance metrics (da log allenamenti)
  FLYING_20M_TIME_S?: number            // Tempo su 20m lanciati (secondi)
  RSI?: number                          // Reactive Strength Index
  CMJ_HEIGHT_CM?: number                // Countermovement jump
  HRR_60S_BPM?: number                  // HR recovery in 60s (battiti recuperati)
  SPRINT_VELOCITY_DROPOFF_PCT?: number  // % calo velocità tra primo e ultimo sprint

  // Training load
  CTL?: number                          // Chronic Training Load
  ATL?: number                          // Acute Training Load
  TSB?: number                          // Training Stress Balance (CTL - ATL)
  WEEKLY_MILEAGE_KM?: number
  ACWR?: number                         // Acute:Chronic Workload Ratio

  // Readiness
  HRV_ZSCORE?: number                   // Z-score HRV su 14 giorni
  WIZARD_READINESS?: number             // Score 0–100 da wizardToReadinessScore()
  CONSECUTIVE_GREEN_DAYS?: number       // Giorni consecutivi con readiness ≥ 70
  CALIBRATION_COMPLETE?: boolean        // True dopo i primi 14 giorni

  // Block completion
  AEROBIC_BASE_COMPLETED?: boolean
  HAMSTRING_PREHAB_WEEKS?: number
  SYMMETRICAL_ECCENTRIC_CONTROL?: boolean
  FMS_SCORE?: number                    // Functional Movement Screen (0–21)

  // Arbitrary numeric values (per KPI non previsti sopra)
  [key: string]: number | boolean | undefined
}

/**
 * Parsifica e valuta una condizione KPI nella forma:
 *   "VARIABILE operatore valore"
 *   Es: "HAMSTRING_VAS_PAIN <= 2"
 *       "SQUAT_TO_BW_RATIO >= 1.5"
 *       "AEROBIC_BASE_COMPLETED == true"
 *       "FMS_SCORE >= 14"
 *
 * Restituisce { passed, reason } per log/debug e UI.
 */
export function evaluateGateCondition(
  conditionString: string,
  context: GateKPIContext
): { passed: boolean; reason: string } {
  // Parsifica "CHIAVE operatore VALORE"
  const match = conditionString.trim().match(
    /^([A-Z_]+)\s*(<=|>=|<|>|==|!=)\s*(.+)$/
  )

  if (!match) {
    // Condizione non parsificabile → consideriamo non soddisfatta per sicurezza
    return {
      passed: false,
      reason: `Condizione non parsificabile: "${conditionString}"`,
    }
  }

  const [, kpi, operator, rawValue] = match
  const contextValue = context[kpi]

  // KPI non presente nel contesto → gate bloccato (dati mancanti = cautela)
  if (contextValue === undefined) {
    return {
      passed: false,
      reason: `KPI "${kpi}" non disponibile nel contesto. Fornisci il dato per sbloccare il gate.`,
    }
  }

  // Converte il valore atteso (string → tipo corretto)
  let expectedValue: number | boolean | string = rawValue
  if (rawValue === 'true') expectedValue = true
  else if (rawValue === 'false') expectedValue = false
  else if (!isNaN(Number(rawValue))) expectedValue = Number(rawValue)

  // Valutazione booleana
  if (typeof contextValue === 'boolean') {
    const passed = operator === '==' ? contextValue === expectedValue : contextValue !== expectedValue
    return {
      passed,
      reason: passed
        ? `✓ ${kpi} = ${contextValue} soddisfa "${conditionString}"`
        : `✗ ${kpi} = ${contextValue} non soddisfa "${conditionString}"`,
    }
  }

  // Valutazione numerica
  const numContext = contextValue as number
  const numExpected = expectedValue as number
  let passed = false
  switch (operator) {
    case '<=': passed = numContext <= numExpected; break
    case '>=': passed = numContext >= numExpected; break
    case '<':  passed = numContext < numExpected; break
    case '>':  passed = numContext > numExpected; break
    case '==': passed = numContext === numExpected; break
    case '!=': passed = numContext !== numExpected; break
  }

  return {
    passed,
    reason: passed
      ? `✓ ${kpi} = ${numContext} soddisfa "${conditionString}"`
      : `✗ ${kpi} = ${numContext} non soddisfa "${conditionString}" (target: ${operator} ${numExpected})`,
  }
}

/**
 * Valuta TUTTI i requirements di un gate entry/exit.
 * TUTTI devono passare (logica AND) per sbloccare il blocco.
 */
export function evaluateGate(
  requirements: string[],
  context: GateKPIContext
): { allPassed: boolean; results: Array<{ condition: string; passed: boolean; reason: string }> } {
  if (requirements.length === 0) {
    return { allPassed: true, results: [] }
  }

  const results = requirements.map(cond => ({
    condition: cond,
    ...evaluateGateCondition(cond, context),
  }))

  return {
    allPassed: results.every(r => r.passed),
    results,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 2C-bis — TYPED GATE EVALUATOR (CP-024 Gate Refactor)
//
// Sostituisce il path stringly-typed (evaluateGateCondition con regex) con una
// valutazione type-safe dei GateRequirement strutturati dai blocchi canonici.
//
// PRINCIPIO: i gate nel Block Catalog sono già oggetti { metric, operator, threshold }.
// TypeScript li valida a compile time. NON servono regex a runtime.
//
// Il path legacy (evaluateGateCondition/evaluateGate con stringhe) sopravvive
// solo per i blocchi NON ancora nel catalog. È marcato @deprecated.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valuta un singolo GateRequirement strutturato contro il GateKPIContext.
 *
 * CONTRATTO:
 *   - KPI mancante nel contesto → gate non verificabile:
 *       se critical=true  → blocked (cautela per sicurezza)
 *       se critical=false → passed con warning (dato opzionale mancante)
 *   - Tutti gli operatori sono gestiti esplicitamente (no regex, no magia).
 */
export function evaluateGateRequirement(
  gate:    GateRequirement,
  context: GateKPIContext
): { passed: boolean; critical: boolean; reason: string } {
  const contextValue = context[gate.metric]

  if (contextValue === undefined) {
    // Dato mancante → cautela: blocca se critical, warning se non critical
    return {
      passed:   !gate.critical,
      critical: gate.critical,
      reason:   `KPI "${gate.metric}" non disponibile nel contesto. ` +
                (gate.critical
                  ? 'Gate CRITICO: blocco bloccato per assenza dato.'
                  : 'Gate non critico: warning, ma blocco consentito.'),
    }
  }

  const threshold: number =
    typeof gate.threshold === 'string'
      ? parseFloat(gate.threshold as string)
      : (gate.threshold as number)

  let passed = false
  if (typeof contextValue === 'boolean') {
    // Valore booleano
    passed = gate.operator === '==' ? contextValue === Boolean(threshold) : contextValue !== Boolean(threshold)
  } else {
    // Valore numerico
    const n = contextValue as number
    switch (gate.operator) {
      case '<=': passed = n <= threshold; break
      case '>=': passed = n >= threshold; break
      case '<':  passed = n <  threshold; break
      case '>':  passed = n >  threshold; break
      case '==': passed = n === threshold; break
      case '!=': passed = n !== threshold; break
    }
  }

  const srcNote = gate.source ? ` — ${gate.source}` : ''
  return {
    passed,
    critical: gate.critical,
    reason: passed
      ? `✓ ${gate.metric} = ${contextValue} soddisfa ${gate.operator} ${gate.threshold}${srcNote}`
      : `✗ ${gate.metric} = ${contextValue} — richiesto ${gate.operator} ${gate.threshold}${srcNote}`,
  }
}

/**
 * Valuta tutti i GateRequirement di un blocco canonico.
 * Logica: tutti i gate CRITICAL devono passare per sbloccare il blocco.
 * I gate non-critical generano warning ma non bloccano.
 */
export function evaluateCanonicalBlockGates(
  block:   TitanBlockCanonical,
  context: GateKPIContext
): {
  allCriticalPassed: boolean
  results: Array<GateRequirement & { passed: boolean; critical: boolean; reason: string }>
} {
  if (block.entry_gates.length === 0) {
    return { allCriticalPassed: true, results: [] }
  }

  const results = block.entry_gates.map(gate => ({
    ...gate,
    ...evaluateGateRequirement(gate, context),
  }))

  const allCriticalPassed = results
    .filter(r => r.critical)
    .every(r => r.passed)

  return { allCriticalPassed, results }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 2D — ALLOSTATIC LOAD CALCULATOR
// Calcola il carico allostatico totale dell'utente.
// Non è solo fatica fisica: include stress da vita, nutrizione, sonno.
// ═══════════════════════════════════════════════════════════════════════════════

export interface AllostaticLoadInput {
  /** Ore di sonno delle ultime 3 notti (hardware o auto-riferito) */
  sleep_hours_last3: number[]

  /** RPE medio delle ultime 3 sessioni di allenamento (1–10) */
  rpe_last3_sessions: number[]

  /** Deficit calorico stimato negli ultimi 3 giorni (kcal/giorno, negativo = deficit) */
  caloric_balance_last3: number[]

  /** Score stress lavorativo/personale auto-riferito (1–5, da wizard opzionale) */
  life_stress_score?: 1 | 2 | 3 | 4 | 5

  /** HRV Z-score degli ultimi 3 giorni (se disponibile) */
  hrv_zscore_last3?: number[]

  /** Giorni consecutivi senza riposo (senza almeno 1 giorno a recupero) */
  consecutive_training_days: number
}

/**
 * Calcola l'Allostatic Load Score (0–100).
 *
 * Formula ponderata:
 *   deficit sonno         30%  (privazione sonno è il driver principale del recovery)
 *   carico allenamento    25%  (RPE medio recente)
 *   deficit calorico      20%  (riserve energetiche)
 *   stress vita           15%  (contesto psicosociale)
 *   HRV trend             10%  (segnale sistemico oggettivo, se disponibile)
 *
 * Score:
 *   0–30  = carico allostatico basso (verde)
 *   31–60 = medio (giallo, progressioni conservative)
 *   61–80 = alto (arancio, no lavori glicolitici massimali)
 *   81–100 = critico (rosso, solo recupero attivo o Z1)
 */
export function calculateAllostaticLoad(input: AllostaticLoadInput): number {
  // 1. SONNO — privazione sonno (adulti: target 7–9h)
  const avgSleep = mean(input.sleep_hours_last3)
  const sleepDeficit = Math.max(0, 8 - avgSleep)          // deficit rispetto a 8h ottimali
  const sleepScore = Math.min(100, sleepDeficit * 20)      // ogni ora mancante = +20 punti stress

  // 2. CARICO ALLENAMENTO — RPE medio recente
  const avgRPE = mean(input.rpe_last3_sessions)
  const rpeScore = ((avgRPE - 1) / 9) * 100               // normalizzato: RPE1=0, RPE10=100

  // 3. DEFICIT CALORICO — bilancio energetico
  const avgBalance = mean(input.caloric_balance_last3)
  // deficit > 300kcal/giorno inizia a stressare il sistema
  const caloricScore = avgBalance < -300
    ? Math.min(100, Math.abs(avgBalance + 300) / 5)       // ogni 5kcal di deficit extra = +1 punto
    : 0

  // 4. STRESS DA VITA
  const lifeScore = input.life_stress_score
    ? ((input.life_stress_score - 1) / 4) * 100
    : 30  // default neutro se non risposto

  // 5. HRV TREND (se disponibile)
  let hrvScore = 40  // default neutro
  if (input.hrv_zscore_last3 && input.hrv_zscore_last3.length > 0) {
    const avgHRV = mean(input.hrv_zscore_last3)
    // Z-score < 0 = sotto baseline → stress, Z-score > 0 = sopra baseline → recupero
    hrvScore = Math.min(100, Math.max(0, 50 - avgHRV * 25))
  }

  // 6. BONUS per giorni consecutivi senza riposo
  const consecutiveBonus = Math.min(30, input.consecutive_training_days * 5)

  // Ponderazione finale
  const weighted = (
    sleepScore * 0.30 +
    rpeScore * 0.25 +
    caloricScore * 0.20 +
    lifeScore * 0.15 +
    hrvScore * 0.10
  ) + consecutiveBonus

  return Math.max(0, Math.min(100, Math.round(weighted)))
}

/**
 * Interpreta l'allostatic load score in un segnale operativo.
 */
export function interpretAllostaticLoad(
  score: number
): { level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'; recommendation: string } {
  if (score <= 30) return {
    level: 'LOW',
    recommendation: 'Carico allostatico basso. Progressioni normali attivabili.',
  }
  if (score <= 60) return {
    level: 'MODERATE',
    recommendation: 'Carico moderato. Progressioni conservative (+5%/settimana max). Evitare test di massimale.',
  }
  if (score <= 80) return {
    level: 'HIGH',
    recommendation: 'Carico alto. No lavori glicolitici massimali. Favorire alattacido e ossidativo. Monitora sonno e nutrizione.',
  }
  return {
    level: 'CRITICAL',
    recommendation: 'Carico critico. Solo recupero attivo (Z1/Z2 leggero). Nessuna sessione di intensità. Rivedi stile di vita.',
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATO 2E — DAILY SESSION RECOMMENDER
// Entry point principale del motore.
// Dato un utente e il suo piano, restituisce la raccomandazione per oggi.
// ═══════════════════════════════════════════════════════════════════════════════

export type SessionRecommendationType =
  | 'PROCEED_AS_PLANNED'    // Vai con il piano originale
  | 'PROCEED_MODIFIED'      // Vai ma con modifiche (volume, intensità ridotti)
  | 'SUBSTITUTE_LOWER_INTENSITY' // Sostituisci con sessione meno intensa
  | 'ACTIVE_RECOVERY'       // Solo recupero attivo (camminata, mobilità, Z1)
  | 'FULL_REST'             // Riposo completo raccomandato
  | 'BLOCKED_PAIN'          // Bloccato per dolore (veto assoluto)
  | 'INSUFFICIENT_DATA'     // Dati insufficienti per raccomandare (primi giorni)

export interface DailyRecommendation {
  recommendation: SessionRecommendationType
  confidence: number                    // 0–100: quanto è affidabile questa raccomandazione
  operational_tier: OperationalTier
  readiness_score: number               // 0–100
  allostatic_load: number               // 0–100
  volume_modifier: number               // 0.5–1.2 (moltiplicatore sul volume pianificato)
  intensity_modifier: number            // 0.5–1.1 (moltiplicatore sull'intensità)
  active_fusion_weights: Record<string, number>
  gate_check: {
    block_id: string
    all_gates_passed: boolean
    failed_gates: string[]
  } | null
  blocked_blocks: string[]              // IDs blocchi esclusi oggi
  collision_resolutions: CollisionResolver[]
  warnings: string[]                    // Messaggi informativi per l'utente
  action_code: ActionCode
  ui_summary: string                    // Messaggio human-readable per la UI (1–2 frasi)
}

export interface DailyRecommenderInput {
  /** Fenotipo utente (aggiornato nel tempo) */
  phenotype: UserPhenotype
  /** Risposta wizard di oggi (null se non ancora compilato) */
  wizard: WizardResponse | null
  /** Stato telemetria hardware (null se nessun device) */
  telemetry: TelemetryValidation | null
  /** Input per il calcolo del carico allostatico */
  allostatic_input: AllostaticLoadInput
  /** Contesto KPI per valutazione gate */
  gate_context: GateKPIContext
  /** IDs dei profili Titan selezionati nel piano */
  active_titan_ids: string[]
  /** Pesi base dei Titan (da titans-db.buildFusionWeights) */
  base_fusion_weights: Record<string, number>
  /** Blocchi pianificati per oggi (già selezionati dal piano) */
  planned_block_ids: string[]
  /** Attrezzatura disponibile oggi */
  available_equipment: string[]
  /** Minuti disponibili per la sessione */
  available_time_min: number
  /** Obiettivo primario dell'utente */
  primary_objective: 'STRENGTH' | 'ENDURANCE' | 'SPORT_PERFORMANCE' | 'HYPERTROPHY' | 'WEIGHT_LOSS'
  /**
   * Map blockId → ProfileBlockModifier del coach attivo.
   * Usata in Step 6B per idratare i blocchi canonici prima di collision/gate check.
   * Costruita con buildModifierMap(titanProfile.profileModifiers ?? []) da titans-blocks.ts.
   * Opzionale: se assente, l'engine usa i blocchi canonici puri (backward-compat).
   */
  active_coach_block_modifiers?: Record<string, ProfileBlockModifier>
}

/**
 * Entry point principale del motore.
 * Integra tutti i layer (telemetria, wizard, allostatic load, gate check,
 * collision matrix, graceful degradation) in una singola raccomandazione.
 */
export function recommendDailySession(
  input: DailyRecommenderInput
): DailyRecommendation {
  const warnings: string[] = []
  const blockedBlocks: string[] = []
  const collisionResolutions: CollisionResolver[] = []

  // ── STEP 1: Calcola ore dall'ultimo wizard ─────────────────────────────────
  const hoursSinceWizard = input.wizard
    ? (Date.now() - new Date(input.wizard.submitted_at).getTime()) / 3_600_000
    : 999 // mai compilato = infinito

  // ── STEP 2: Determina tier operativo ──────────────────────────────────────
  const degradationState = computeOperationalTier({
    telemetry: input.telemetry,
    wizard_answered_today: wizardIsValid(input.wizard) && hoursSinceWizard < 16,
    hours_since_last_wizard: hoursSinceWizard,
    phenotype: input.phenotype,
  })

  // ── STEP 3: Readiness score ────────────────────────────────────────────────
  let readinessScore = 50 // default neutro
  if (input.wizard && wizardIsValid(input.wizard)) {
    readinessScore = wizardToReadinessScore(input.wizard)
  }

  // Override con HRV se tier 1 e hardware affidabile
  if (
    input.telemetry &&
    evaluateHardwareAuthority(input.telemetry) === 'TRUST_HARDWARE' &&
    input.gate_context.HRV_ZSCORE !== undefined
  ) {
    const hwReadiness = Math.max(0, Math.min(100, 50 + input.gate_context.HRV_ZSCORE! * 20))
    // Media pesata wizard (60%) + hardware (40%)
    readinessScore = Math.round(readinessScore * 0.6 + hwReadiness * 0.4)
  }

  // ── STEP 4: Carico allostatico ─────────────────────────────────────────────
  const allostaticLoad = calculateAllostaticLoad(input.allostatic_input)

  // ── STEP 5: LEGGE DEL VETO — dolore (controllo immediato) ─────────────────
  const painVAS = input.wizard?.pain_vas ?? 0
  if (painVAS >= 7) {
    return buildRecommendation({
      type: 'BLOCKED_PAIN',
      tier: degradationState.current_tier,
      readiness: readinessScore,
      allostatic: allostaticLoad,
      volMod: 0,
      intMod: 0,
      fusionWeights: {},
      blockedBlocks: input.planned_block_ids,
      collisions: [],
      warnings: [`Dolore VAS ${painVAS}/10: sessione bloccata. Consulta un professionista se persiste oltre 48h.`],
      actionCode: 'FORCE_DELOAD',
      summary: `Dolore VAS ${painVAS}/10 rilevato. Riposo completo oggi. Nessun allenamento.`,
      confidence: 95,
      gateCheck: null,
    })
  }

  // ── STEP 6: Fusion weights dinamici ───────────────────────────────────────
  const dynamicWeights = buildDynamicFusionWeights({
    titan_ids: input.active_titan_ids,
    user_readiness_score: readinessScore,
    base_weights: input.base_fusion_weights,
  })

  // ── STEP 6B: Collision resolution via Canonical Block Catalog (CP-024) ───────
  //
  // HYDRATION: prima di fare collision check, ogni blocco viene idratato con il
  // modifier del coach attivo (se presente). Questo garantisce che l'engine
  // operi sulla realtà del coach, non sulla fisica canonica astratta.
  //
  // Se active_coach_block_modifiers non è fornito → fallback su canonical puro.
  // Se un blocco non è nel catalog → skip silenzioso (backward-compat).
  if (input.planned_block_ids.length > 1) {
    const modifierMap = input.active_coach_block_modifiers ?? {}

    for (let i = 0; i < input.planned_block_ids.length; i++) {
      for (let j = i + 1; j < input.planned_block_ids.length; j++) {
        const idA = input.planned_block_ids[i]
        const idB = input.planned_block_ids[j]

        // Idratiamo con il modifier del coach (se esiste)
        const blockA = hydrateBlock(idA, modifierMap[idA])
        const blockB = hydrateBlock(idB, modifierMap[idB])
        if (!blockA || !blockB) continue  // blocco non nel catalog → skip

        // Stesso giorno = 0h di separazione
        const conflict = checkInterference(blockA, blockB, 0)
        if (conflict && conflict.hasConflict) {
          const isCritical = conflict.severity === 'critical' || conflict.severity === 'moderate'

          // Determina priorità in base all'obiettivo utente
          const objectiveWinsStrength = ['STRENGTH', 'HYPERTROPHY'].includes(input.primary_objective)
          const aIsStrength = blockA.category === 'strength_maximal' || blockA.category === 'strength_hypertrophy'
          const priorityId = (objectiveWinsStrength && aIsStrength) ? idA : idB
          const sacrificedId = priorityId === idA ? idB : idA

          collisionResolutions.push({
            active_block_ids:       [idA, idB],
            conflict_detected:      true,
            resolution_protocol:    conflict.severity === 'critical' ? 'time_separation' : 'volume_reduction',
            priority_block_id:      priorityId,
            sacrificed_block_id:    sacrificedId,
            separation_hours:       conflict.severity === 'critical' ? 48 : 24,
            resolution_explanation: conflict.message,
          })

          if (isCritical) {
            blockedBlocks.push(sacrificedId)
            warnings.push(
              `⚠️ Conflitto ${conflict.severity.toUpperCase()}: ${idA} ↔ ${idB} incompatibili nella stessa sessione. ` +
              `${conflict.message} Priorità a ${priorityId} per obiettivo ${input.primary_objective}.`
            )
          }
        }
      }
    }
  }

  // ── STEP 7: Gate check (typed path primario + legacy fallback) ────────────
  //
  // PATH PRIMARIO (CP-024): usa evaluateCanonicalBlockGates() con GateRequirement
  // strutturati dal blocco idratato. Type-safe, nessuna regex, validazione compile-time.
  //
  // FALLBACK LEGACY: se il blocco non è nel catalog (v1.0 profiles), applica solo
  // il gate universale VAS pain come rete di sicurezza minima. @deprecated
  let gateCheck: DailyRecommendation['gate_check'] = null
  if (input.planned_block_ids.length > 0) {
    const primaryBlockId = input.planned_block_ids[0]
    const modifierMap = input.active_coach_block_modifiers ?? {}
    const primaryBlock = hydrateBlock(primaryBlockId, modifierMap[primaryBlockId])

    if (primaryBlock && primaryBlock.entry_gates.length > 0) {
      // ── PATH PRIMARIO: typed gate evaluator ──────────────────────────────
      const gateResult = evaluateCanonicalBlockGates(primaryBlock, {
        ...input.gate_context,
        GENERAL_VAS_PAIN: painVAS,  // sempre presente per il gate VAS universale
      })

      const failedCritical = gateResult.results.filter(r => r.critical && !r.passed)
      const failedReasons  = failedCritical.map(r => r.reason)

      gateCheck = {
        block_id:         primaryBlockId,
        all_gates_passed: gateResult.allCriticalPassed,
        failed_gates:     failedReasons,
      }

      if (!gateResult.allCriticalPassed) {
        blockedBlocks.push(primaryBlockId)
        warnings.push(
          `Gate critico non superato per ${primaryBlockId}: ${failedReasons.join('; ')}`
        )
      }

      // Warning per gate non-critical falliti (non bloccano, ma avvisano)
      const failedNonCritical = gateResult.results.filter(r => !r.critical && !r.passed)
      for (const nw of failedNonCritical) {
        warnings.push(`⚠ Gate non critico per ${primaryBlockId}: ${nw.reason}`)
      }

    } else {
      // ── FALLBACK LEGACY: VAS pain universale (blocchi non nel catalog) ──
      // @deprecated — sarà rimosso quando tutti i profili saranno migrati a v2
      if (painVAS >= 4) {
        const legacyGates = [`GENERAL_VAS_PAIN <= 3`]
        const gateResult = evaluateGate(legacyGates, {
          ...input.gate_context,
          GENERAL_VAS_PAIN: painVAS,
        })
        gateCheck = {
          block_id:         primaryBlockId,
          all_gates_passed: gateResult.allPassed,
          failed_gates:     gateResult.results.filter(r => !r.passed).map(r => r.condition),
        }
        if (!gateResult.allPassed) {
          blockedBlocks.push(primaryBlockId)
          warnings.push(
            `[legacy gate] Gate non superato per ${primaryBlockId}: dolore VAS ${painVAS} ≥ 4. Blocco escluso per sicurezza.`
          )
        }
      }
    }
  }

  // ── STEP 8: Calcolo modificatori volume/intensità ──────────────────────────
  let volMod = 1.0
  let intMod = 1.0

  if (readinessScore < 30 || allostaticLoad > 80) {
    volMod = 0.5; intMod = 0.7
  } else if (readinessScore < 50 || allostaticLoad > 60) {
    volMod = 0.7; intMod = 0.85
  } else if (readinessScore < 65) {
    volMod = 0.85; intMod = 0.9
  } else if (readinessScore > 85 && allostaticLoad < 30) {
    volMod = 1.05; intMod = 1.05  // Prontezza eccezionale → leggero bonus
  }

  // Cap massimo progressione settimanale in base al tier
  const maxVolIncrease = degradationState.max_weekly_volume_increase_pct / 100
  volMod = Math.min(volMod, 1 + maxVolIncrease)

  // ── STEP 9: Determina tipo raccomandazione ─────────────────────────────────
  let recType: SessionRecommendationType

  if (degradationState.current_tier === 'TIER_3_SHADOW') {
    recType = 'ACTIVE_RECOVERY'
    warnings.push('Nessun dato per oltre 48h. Modalità ombra: solo recupero attivo oggi.')
  } else if (readinessScore < 25 || allostaticLoad > 85) {
    recType = 'FULL_REST'
  } else if (readinessScore < 40 || allostaticLoad > 70) {
    recType = 'ACTIVE_RECOVERY'
  } else if (readinessScore < 55 || allostaticLoad > 55 || blockedBlocks.length > 0) {
    recType = 'SUBSTITUTE_LOWER_INTENSITY'
  } else if (volMod < 0.95 || intMod < 0.95) {
    recType = 'PROCEED_MODIFIED'
    warnings.push(`Volume ridotto a ${Math.round(volMod * 100)}% e intensità a ${Math.round(intMod * 100)}% del piano per stato di recupero.`)
  } else {
    recType = 'PROCEED_AS_PLANNED'
  }

  // ── STEP 10: Confidence della raccomandazione ──────────────────────────────
  let confidence = 70
  if (degradationState.current_tier === 'TIER_1_HARDWARE') confidence = 90
  else if (degradationState.current_tier === 'TIER_2_SUBJECTIVE') confidence = 65
  else if (degradationState.current_tier === 'CALIBRATION_MODE') confidence = 55
  else confidence = 40 // TIER_3

  // ── STEP 11: Action code ───────────────────────────────────────────────────
  let actionCode: ActionCode = 'MAINTAIN'
  if (recType === 'FULL_REST' || recType === 'ACTIVE_RECOVERY') actionCode = 'FORCE_DELOAD'
  else if (recType === 'SUBSTITUTE_LOWER_INTENSITY') actionCode = 'SHIFT_TO_RECOVERY'
  else if (recType === 'PROCEED_MODIFIED') actionCode = 'REDUCE_ACCESSORY_VOLUME'

  // ── STEP 12: Summary UI ────────────────────────────────────────────────────
  const summaryMap: Record<SessionRecommendationType, string> = {
    PROCEED_AS_PLANNED: `Prontezza ${readinessScore}/100 — vai con il piano. Sei in forma.`,
    PROCEED_MODIFIED: `Prontezza ${readinessScore}/100 — sessione confermata con volume ridotto al ${Math.round(volMod * 100)}%.`,
    SUBSTITUTE_LOWER_INTENSITY: `Prontezza bassa (${readinessScore}/100) — sostituisci con sessione a bassa intensità o tecnica.`,
    ACTIVE_RECOVERY: `Recupero attivo consigliato: camminata, mobilità o Z1 leggero. Il corpo ha bisogno di rigenerarsi.`,
    FULL_REST: `Riposo completo oggi. Carico allostatico ${allostaticLoad}/100: il sistema ha bisogno di recuperare.`,
    BLOCKED_PAIN: `Sessione bloccata per dolore. Riposo e valutazione medica se persiste.`,
    INSUFFICIENT_DATA: `Dati insufficienti per raccomandare con precisione. Compila il wizard per attivare il motore.`,
  }

  return buildRecommendation({
    type: recType,
    tier: degradationState.current_tier,
    readiness: readinessScore,
    allostatic: allostaticLoad,
    volMod,
    intMod,
    fusionWeights: dynamicWeights,
    blockedBlocks,
    collisions: collisionResolutions,
    warnings,
    actionCode,
    summary: summaryMap[recType],
    confidence,
    gateCheck,
  })
}

/** Helper interno per costruire il DailyRecommendation object */
function buildRecommendation(p: {
  type: SessionRecommendationType
  tier: OperationalTier
  readiness: number
  allostatic: number
  volMod: number
  intMod: number
  fusionWeights: Record<string, number>
  blockedBlocks: string[]
  collisions: CollisionResolver[]
  warnings: string[]
  actionCode: ActionCode
  summary: string
  confidence: number
  gateCheck: DailyRecommendation['gate_check']
}): DailyRecommendation {
  return {
    recommendation: p.type,
    confidence: p.confidence,
    operational_tier: p.tier,
    readiness_score: p.readiness,
    allostatic_load: p.allostatic,
    volume_modifier: Math.round(p.volMod * 100) / 100,
    intensity_modifier: Math.round(p.intMod * 100) / 100,
    active_fusion_weights: p.fusionWeights,
    gate_check: p.gateCheck,
    blocked_blocks: p.blockedBlocks,
    collision_resolutions: p.collisions,
    warnings: p.warnings,
    action_code: p.actionCode,
    ui_summary: p.summary,
  }
}

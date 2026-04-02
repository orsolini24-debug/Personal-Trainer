/**
 * titans-workouts.ts
 *
 * TIER-3: EXERCISE PRESCRIPTION LAYER — versione 1.0
 *
 * Struttura a 3 livelli del DB TITANS:
 *   Tier-1 (titans-db.ts)      → Coach/Metodologisti: IL METODO (chi segui)
 *   Tier-2 (titans-db.ts)      → Atleti mentali: LA MENTE (chi emuli)
 *   Tier-3 (titans-workouts.ts) → Prescrizioni esercizi: LA PRATICA (cosa fai)
 *
 * Questo file risponde alla domanda:
 *   "Il blocco HYPERTROPHY_MESOCYCLE è attivo — quali esercizi, in quale ordine,
 *    con quale schema set/rep/carico, per quale gruppo muscolare?"
 *
 * ARCHITETTURA:
 *   ExerciseDefinition   → esercizio singolo con parametri fisici
 *   WorkoutTemplate      → sessione strutturata (array di ExerciseSlot)
 *   BlockWorkoutMap      → mappa block_id → WorkoutTemplate[]
 *
 * REGOLA FONDAMENTALE (stessa di titans-calibration.ts):
 *   Ogni progressione numerica ha una fonte. Se la fonte non esiste,
 *   il campo è null e l'engine usa una stima conservativa.
 *
 * Importato da: titans-engine.ts (per generazione DailyRecommendation dettagliata)
 */

import { CALIBRATION_VERSION } from './titans-calibration'

// ─── TIPI ─────────────────────────────────────────────────────────────────

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'push_horizontal'
  | 'push_vertical'
  | 'pull_horizontal'
  | 'pull_vertical'
  | 'carry'
  | 'rotation'
  | 'locomotion'
  | 'jump_land'
  | 'sprint'
  | 'isometric'
  | 'stretch_mobility'

export type MuscleGroup =
  | 'quad'
  | 'hamstring'
  | 'glute'
  | 'calf'
  | 'chest'
  | 'back_upper'
  | 'back_lower'
  | 'shoulder'
  | 'bicep'
  | 'tricep'
  | 'core_anterior'
  | 'core_posterior'
  | 'hip_flexor'
  | 'adductor'
  | 'full_body'

export type EquipmentRequired =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable_machine'
  | 'resistance_band'
  | 'bodyweight'
  | 'pullup_bar'
  | 'box'              // per pliometrica
  | 'sled'
  | 'bike_ergometer'
  | 'treadmill'
  | 'rowing_ergometer'
  | 'none'

export type ProgressionMethod =
  | 'linear'           // +2.5–5kg a settimana (Rippetoe Starting Strength)
  | 'double_progression' // prima reps poi carico (NSCA standard)
  | 'wave_loading'     // 3-2-1 / 5-3-1 (Wendler)
  | 'rpe_autoregulated' // carico da RPE target (Israetel)
  | 'vbt_autoregulated' // carico da velocity target (González-Badillo)
  | 'tss_based'        // per endurance (Allen & Coggan)
  | 'fixed'            // nessuna progressione (prehab, mobilità)

export type IntensityZone =
  | 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'  // endurance zones (% HRmax)
  | 'SS'                                  // Sweet Spot (88–93% FTP)
  | 'FTP'                                 // soglia FTP
  | 'pct_1rm'                             // % 1RM per forza

/** Singolo esercizio con parametri fisici completi */
export interface ExerciseDefinition {
  exercise_id:        string            // es. 'SQUAT_BACK_BARBELL'
  name:               string
  name_it:            string            // nome italiano
  movement_pattern:   MovementPattern
  primary_muscles:    MuscleGroup[]
  secondary_muscles:  MuscleGroup[]
  equipment:          EquipmentRequired[]
  bilateral:          boolean
  technique_cues:     string[]          // 2–4 cue tecnici chiave
  common_errors:      string[]          // 2–3 errori frequenti
  regression:         string | null     // exercise_id di variante più semplice
  progression:        string | null     // exercise_id di variante più difficile
  contraindications:  string[]
  evidence_note?:     string
}

/** Slot in una sessione: esercizio + parametri di dosaggio */
export interface ExerciseSlot {
  exercise_id:        string
  order:              number            // posizione nella sessione (1 = primo)
  role:               'primary' | 'secondary' | 'accessory' | 'warmup' | 'cooldown'

  // Dosaggio
  sets:               [number, number]  // [min, max]
  reps?:              [number, number]
  duration_sec?:      [number, number]  // per isometriche/cardio
  distance_m?:        [number, number]  // per sprint/corsa
  intensity:          IntensityZone | null
  rpe_target?:        [number, number]
  rest_sec:           [number, number]
  tempo?:             string            // es. '3-1-1-0'

  // Progressione
  progression_method: ProgressionMethod
  week1_load_note:    string            // come determinare il carico iniziale
  progression_rule:   string           // regola di avanzamento settimana per settimana

  // Note contestuali
  coaching_note:      string
}

/** Template completo di una sessione */
export interface WorkoutTemplate {
  template_id:        string            // es. 'HYPERTROPHY_LOWER_A'
  block_id:           string            // referenza a TitanBlockCanonical.block_id
  name:               string
  name_it:            string
  session_type:       'strength' | 'endurance' | 'power' | 'prehab' | 'mixed' | 'recovery'
  target_duration_min: [number, number]
  target_tss:         [number, number]
  day_in_week:        'A' | 'B' | 'C' | 'D'  // sessione A, B, C nell'alternanza
  slots:              ExerciseSlot[]
  warmup_protocol:    string
  cooldown_protocol:  string
  notes:              string
  calibration_version: string
}

// ─── ESERCIZI BASE — CATALOG ──────────────────────────────────────────────

export const EXERCISE_CATALOG: Record<string, ExerciseDefinition> = {

  // ── SQUAT / LOWER COMPOUND ─────────────────────────────────────────────

  SQUAT_BACK_BARBELL: {
    exercise_id:      'SQUAT_BACK_BARBELL',
    name:             'Back Squat (Barbell)',
    name_it:          'Squat con bilanciere',
    movement_pattern: 'squat',
    primary_muscles:  ['quad', 'glute'],
    secondary_muscles: ['hamstring', 'core_posterior', 'back_lower'],
    equipment:        ['barbell'],
    bilateral:        true,
    technique_cues: [
      'Piedi larghezza spalle, punte leggermente aperte (10–30°)',
      'Schiena neutra mantenuta lungo tutto il ROM',
      'Ginocchia seguono la direzione delle punte (no valgismo)',
      'Discesa controllata (3s) — risalita esplosiva',
    ],
    common_errors: [
      'Butt wink (retroversione pelvi a fondo corsa): ridurre ROM o migliorare dorsiflexion',
      'Valgismo ginocchio in risalita: attivare glute med con band',
      'Talloni che si alzano: problema dorsiflexion caviglia',
    ],
    regression:         'GOBLET_SQUAT',
    progression:        'SQUAT_PAUSE_BARBELL',
    contraindications:  ['Lombalgia acuta', 'Ginocchio VAS > 3'],
    evidence_note:      'Zatsiorsky & Kraemer 2006 — re esercizio di forza lower body',
  },

  GOBLET_SQUAT: {
    exercise_id:      'GOBLET_SQUAT',
    name:             'Goblet Squat',
    name_it:          'Goblet squat con kettlebell',
    movement_pattern: 'squat',
    primary_muscles:  ['quad', 'glute'],
    secondary_muscles: ['core_anterior', 'back_upper'],
    equipment:        ['kettlebell', 'dumbbell'],
    bilateral:        true,
    technique_cues: [
      'Kettlebell al petto, gomiti dentro',
      'Tacco a terra durante tutto il movimento',
      'Petto alto, schiena neutra',
    ],
    common_errors: [
      'Busto che collassa in avanti: tenere il peso più alto',
    ],
    regression:         'BODYWEIGHT_SQUAT',
    progression:        'SQUAT_BACK_BARBELL',
    contraindications:  [],
  },

  SQUAT_PAUSE_BARBELL: {
    exercise_id:      'SQUAT_PAUSE_BARBELL',
    name:             'Pause Squat (Barbell)',
    name_it:          'Squat con pausa',
    movement_pattern: 'squat',
    primary_muscles:  ['quad', 'glute'],
    secondary_muscles: ['hamstring', 'core_posterior'],
    equipment:        ['barbell'],
    bilateral:        true,
    technique_cues: [
      '3–5 secondi di pausa nella posizione più bassa',
      'Eliminazione del rimbalzo elastico — forza concentrica pura',
    ],
    common_errors: ['Perdita di tensione durante la pausa'],
    regression:     'SQUAT_BACK_BARBELL',
    progression:    null,
    contraindications: ['Lombalgia acuta'],
  },

  DEADLIFT_CONVENTIONAL: {
    exercise_id:      'DEADLIFT_CONVENTIONAL',
    name:             'Conventional Deadlift',
    name_it:          'Stacco da terra convenzionale',
    movement_pattern: 'hinge',
    primary_muscles:  ['hamstring', 'glute', 'back_lower'],
    secondary_muscles: ['quad', 'back_upper', 'core_posterior'],
    equipment:        ['barbell'],
    bilateral:        true,
    technique_cues: [
      'Barra sulla tibia, shins verticali all\'inizio del pull',
      'Presa pronata o mista — larghezza spalle',
      'Schiena neutra + bracing del core prima di tirare',
      'Spingere il pavimento, non tirare la barra',
    ],
    common_errors: [
      'Schiena arrotondata (lombare): ridurre carico, migliorare hip hinge',
      'Barra che si allontana: tenere scapole bloccate in discesa',
      'Iperestensione lombare in cima: glutei, non schiena',
    ],
    regression:     'RDL_DUMBBELL',
    progression:    'DEADLIFT_DEFICIT',
    contraindications: ['Ernia discale lombare attiva', 'Lombosciatalgia acuta'],
    evidence_note:  'McGill 2007 — meccanica del deadlift e carico lombare',
  },

  RDL_DUMBBELL: {
    exercise_id:      'RDL_DUMBBELL',
    name:             'Romanian Deadlift (Dumbbell)',
    name_it:          'Romanian deadlift con manubri',
    movement_pattern: 'hinge',
    primary_muscles:  ['hamstring', 'glute'],
    secondary_muscles: ['back_lower', 'core_posterior'],
    equipment:        ['dumbbell'],
    bilateral:        true,
    technique_cues: [
      'Cerniera all\'anca, non flessione lombare',
      'Sensazione di stiramento hamstring fino al range controllabile',
    ],
    common_errors: ['Flessione lombare eccessiva invece di hip hinge'],
    regression:     'HIP_HINGE_BODYWEIGHT',
    progression:    'DEADLIFT_CONVENTIONAL',
    contraindications: [],
  },

  HIP_THRUST_BARBELL: {
    exercise_id:      'HIP_THRUST_BARBELL',
    name:             'Hip Thrust (Barbell)',
    name_it:          'Hip thrust con bilanciere',
    movement_pattern: 'hinge',
    primary_muscles:  ['glute'],
    secondary_muscles: ['hamstring', 'quad'],
    equipment:        ['barbell'],
    bilateral:        true,
    technique_cues: [
      'Spalle appoggiate sulla panca, piedi piatti a terra',
      'Contrazione massimale glute in cima — 1s isometrica',
      'Pelvi neutra — no iperestensione lombare',
    ],
    common_errors: ['Estensione lombare invece di glutea (no attivazione glute)'],
    regression:     'GLUTE_BRIDGE_BODYWEIGHT',
    progression:    'SINGLE_LEG_HIP_THRUST',
    contraindications: [],
    evidence_note:  'Contreras et al. (2015) — hip thrust come stimolo ottimale per glute',
  },

  // ── PUSH ──────────────────────────────────────────────────────────────

  BENCH_PRESS_BARBELL: {
    exercise_id:      'BENCH_PRESS_BARBELL',
    name:             'Bench Press (Barbell)',
    name_it:          'Panca piana con bilanciere',
    movement_pattern: 'push_horizontal',
    primary_muscles:  ['chest'],
    secondary_muscles: ['shoulder', 'tricep'],
    equipment:        ['barbell'],
    bilateral:        true,
    technique_cues: [
      'Presa larghezza 1.5× larghezza spalle',
      'Scapole retratte e depresse durante tutto il movimento',
      'Traiettoria: leggermente diagonale verso l\'ombelico in discesa',
      'Gomiti a 45–75° dal busto (non perpendicolari)',
    ],
    common_errors: [
      'Rimbalzo dal petto: pausa 1s a contatto',
      'Polsi in estensione: polso neutro, barra nel palmo',
    ],
    regression:     'DB_FLOOR_PRESS',
    progression:    'BENCH_PRESS_CLOSE_GRIP',
    contraindications: ['Sindrome da conflitto subacromiale VAS ≥ 3'],
  },

  OVERHEAD_PRESS_BARBELL: {
    exercise_id:      'OVERHEAD_PRESS_BARBELL',
    name:             'Overhead Press (Barbell)',
    name_it:          'Lento avanti con bilanciere',
    movement_pattern: 'push_vertical',
    primary_muscles:  ['shoulder'],
    secondary_muscles: ['tricep', 'core_anterior'],
    equipment:        ['barbell'],
    bilateral:        true,
    technique_cues: [
      'Barra a livello clavicola, presa larghezza spalle',
      'Core bracing e glutei contratti — transfert da terra verso l\'alto',
      'Sposta la testa "attraverso la finestra" salendo',
      'Lockout completo con orecchie dentro le braccia',
    ],
    common_errors: [
      'Iperestensione lombare: core inattivo',
      'Barra troppo davanti: traiettoria deve passare per la linea mediana',
    ],
    regression:     'DB_SHOULDER_PRESS_SEATED',
    progression:    'PUSH_PRESS_BARBELL',
    contraindications: ['Mobilità spalla < 160°', 'Tendinopatia cuffia rotatori attiva'],
  },

  // ── PULL ──────────────────────────────────────────────────────────────

  PULLUP_WEIGHTED: {
    exercise_id:      'PULLUP_WEIGHTED',
    name:             'Weighted Pull-Up',
    name_it:          'Trazioni con zavorra',
    movement_pattern: 'pull_vertical',
    primary_muscles:  ['back_upper'],
    secondary_muscles: ['bicep', 'core_anterior'],
    equipment:        ['pullup_bar'],
    bilateral:        true,
    technique_cues: [
      'Presa prona larghezza spalle (pull-up) o supina (chin-up)',
      'Inizia da dead hang — scapole poi coda al petto',
      'Mento sopra la barra — discesa controllata 3s',
    ],
    common_errors: ['Oscillazione (kipping): escluso per forza strutturale'],
    regression:     'PULLUP_ASSISTED_BAND',
    progression:    'PULLUP_WEIGHTED',
    contraindications: ['Sindrome da conflitto spalla VAS ≥ 3'],
  },

  BARBELL_ROW: {
    exercise_id:      'BARBELL_ROW',
    name:             'Barbell Bent-Over Row',
    name_it:          'Rematore con bilanciere',
    movement_pattern: 'pull_horizontal',
    primary_muscles:  ['back_upper'],
    secondary_muscles: ['bicep', 'back_lower', 'core_posterior'],
    equipment:        ['barbell'],
    bilateral:        true,
    technique_cues: [
      'Busto a 45°, schiena neutra',
      'Presa prona larghezza spalle — tirare verso l\'ombelico basso',
      'Scapole retratte in cima — contrazione 1s',
    ],
    common_errors: ['Cifosi lombare: ridurre carico o usare chest-supported'],
    regression:     'DB_ROW_SINGLE_ARM',
    progression:    'PENDLAY_ROW',
    contraindications: ['Lombalgia acuta'],
  },

  // ── NORDIC / PREHAB ───────────────────────────────────────────────────

  NORDIC_CURL: {
    exercise_id:      'NORDIC_CURL',
    name:             'Nordic Curl (Eccentric Hamstring)',
    name_it:          'Nordic curl / Piegamento nordico',
    movement_pattern: 'hinge',
    primary_muscles:  ['hamstring'],
    secondary_muscles: ['glute', 'calf'],
    equipment:        ['bodyweight'],
    bilateral:        true,
    technique_cues: [
      'Caviglie bloccate sotto panca o partner',
      'Controllo eccentrico 3–5s nella discesa',
      'Caduta con mani al suolo — non arrivare a fine ROM senza controllo',
      'Progressione: dal negativo puro → 1/4 ROM → pieno ROM',
    ],
    common_errors: [
      'Discesa non controllata (rimbalzo): ridurre ROM',
      'Flessione delle anche (uso attivo del femore, non hamstring)',
    ],
    regression:         'LEG_CURL_MACHINE_ECCENTRIC',
    progression:        'NORDIC_CURL_ADDED_LOAD',
    contraindications:  ['Hamstring strain grado I–II < 4 settimane'],
    evidence_note:      'Petersen et al. (2011) AJSM — riduzione 70% incidenza strain hamstring',
  },

  CALF_RAISE_SINGLE_LEG: {
    exercise_id:      'CALF_RAISE_SINGLE_LEG',
    name:             'Single Leg Calf Raise (Eccentric)',
    name_it:          'Alzata su punta monopodalica eccentrica',
    movement_pattern: 'isometric',
    primary_muscles:  ['calf'],
    secondary_muscles: [],
    equipment:        ['bodyweight', 'dumbbell'],
    bilateral:        false,
    technique_cues: [
      'Piede su gradino, tallone sotto il livello del gradino (range completo)',
      'Salita bipodalica — discesa monopodalica (3–4s)',
      'Ginocchio leggera flessione (coinvolge il soleo)',
    ],
    common_errors: ['Range ridotto: deve andare sotto il livello del gradino'],
    regression:     'CALF_RAISE_BILATERAL',
    progression:    'CALF_RAISE_SINGLE_WEIGHTED',
    contraindications: ['Tendinopatia achillea acuta VAS > 6'],
    evidence_note:  'Alfredson et al. (1998) AJSM — protocollo eccentrico heavy-slow per tendinopatia achillea',
  },

  ISOMETRIC_WALL_SIT: {
    exercise_id:      'ISOMETRIC_WALL_SIT',
    name:             'Isometric Wall Sit (Patellar Tendon)',
    name_it:          'Seduta isometrica al muro',
    movement_pattern: 'isometric',
    primary_muscles:  ['quad'],
    secondary_muscles: ['glute'],
    equipment:        ['none'],
    bilateral:        true,
    technique_cues: [
      'Schiena contro il muro, ginocchia 60° di flessione',
      'Contrazione isometrica massimale sostenuta',
      '45 secondi × 5 ripetizioni (Rio et al. 2015)',
    ],
    common_errors: ['Angolo > 90° (stress tendineo subottimale): mantenere 60°'],
    regression:     null,
    progression:    'SINGLE_LEG_WALL_SIT',
    contraindications: [],
    evidence_note:  'Rio et al. (2015) BJSM — analgesia immediata tendinopatia rotulea',
  },

  // ── ENDURANCE / CARDIO ────────────────────────────────────────────────

  ZONE2_RUNNING: {
    exercise_id:      'ZONE2_RUNNING',
    name:             'Zone 2 Running (Aerobic Base)',
    name_it:          'Corsa in zona 2 (base aerobica)',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'hamstring', 'calf', 'glute'],
    secondary_muscles: ['core_anterior'],
    equipment:        ['treadmill', 'none'],
    bilateral:        true,
    technique_cues: [
      'Ritmo conversazionale: puoi parlare in frasi complete',
      'FC < 72% HRmax (HR_ZONES_PCT_HRMAX.ZONE2_AEROBIC_BASE)',
      'Cadenza 170–180 passi/min per ridurre impatto',
    ],
    common_errors: [
      'Ritmo troppo veloce (zona grigia): rallentare, anche se sembra lento',
      'Ignorare la FC: usare sempre monitor cardiaco',
    ],
    regression:     'ZONE1_WALKING',
    progression:    'THRESHOLD_RUNNING',
    contraindications: [],
    evidence_note:  'Seiler & Tønnessen 2009 — 80% del volume in Z2 per endurance ottimale',
  },

  ZONE2_CYCLING: {
    exercise_id:      'ZONE2_CYCLING',
    name:             'Zone 2 Cycling',
    name_it:          'Pedalata in zona 2',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'hamstring', 'glute', 'calf'],
    secondary_muscles: ['core_anterior'],
    equipment:        ['bike_ergometer'],
    bilateral:        true,
    technique_cues: [
      'Potenza: 56–75% FTP (Coggan Zone 2)',
      'Cadenza: 85–95 rpm per minimizzare stress muscolare',
      'RPE 2–4 (scala CR10)',
    ],
    common_errors: ['Potenza troppo alta: rimanere sotto il 75% FTP'],
    regression:     null,
    progression:    'THRESHOLD_CYCLING',
    contraindications: [],
    evidence_note:  'Allen & Coggan 2010 — Zone 2 cycling per fat oxidation',
  },

  THRESHOLD_RUNNING: {
    exercise_id:      'THRESHOLD_RUNNING',
    name:             'Threshold Running Intervals',
    name_it:          'Interval al ritmo soglia',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'hamstring', 'calf', 'glute'],
    secondary_muscles: ['core_anterior', 'hip_flexor'],
    equipment:        ['treadmill', 'none'],
    bilateral:        true,
    technique_cues: [
      'FC 82–92% HRmax (HR_ZONES_PCT_HRMAX.ZONE4_THRESHOLD)',
      'RPE 6–7 su CR10: "difficile ma sostenibile per 20–30 min"',
      'Testa alta, cadenza 175–185 passi/min',
    ],
    common_errors: ['Partenza troppo veloce: mantieni ritmo costante'],
    regression:     'ZONE2_RUNNING',
    progression:    'VO2MAX_RUNNING',
    contraindications: [],
    evidence_note:  'Seiler 2009 — threshold come 10–15% del volume totale',
  },

  VO2MAX_RUNNING: {
    exercise_id:      'VO2MAX_RUNNING',
    name:             'VO₂max Intervals (Running)',
    name_it:          'Interval VO2max in corsa',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'hamstring', 'calf', 'glute'],
    secondary_muscles: ['core_anterior', 'hip_flexor'],
    equipment:        ['treadmill', 'none'],
    bilateral:        true,
    technique_cues: [
      'FC > 92% HRmax (HR_ZONES_PCT_HRMAX.ZONE5_VO2MAX)',
      'RPE 8–10 su CR10: "molto duro, difficile mantenere"',
      'Seiler 4×4: 4 minuti ad alta intensità, 4 minuti recupero attivo',
    ],
    common_errors: ['Recupero troppo breve: non iniziare il rep successivo a FC > 65% HRmax'],
    regression:     'THRESHOLD_RUNNING',
    progression:    null,
    contraindications: [],
    evidence_note:  'Helgerud et al. 2007 Med Sci Sports — 4×4 VO2max protocol',
  },

  // ── SPRINT ────────────────────────────────────────────────────────────

  SPRINT_ACCELERATION_10M: {
    exercise_id:      'SPRINT_ACCELERATION_10M',
    name:             'Acceleration Sprint 10m',
    name_it:          'Sprint di accelerazione 10m',
    movement_pattern: 'sprint',
    primary_muscles:  ['glute', 'quad', 'hamstring'],
    secondary_muscles: ['calf', 'hip_flexor', 'core_anterior'],
    equipment:        ['none'],
    bilateral:        false,
    technique_cues: [
      'Posizione di partenza: 45° di inclinazione in avanti',
      'Spinta orizzontale — non verticale',
      'Ginocchio alto nella fase di swing',
      'Primo passo più corto, poi progressivamente più lungo',
    ],
    common_errors: [
      'Raddrizzarsi troppo presto (< 6m): mantieni inclinazione',
      'Braccia che attraversano la linea mediana: movimenti sagittali puri',
    ],
    regression:     'A_MARCH_DRILL',
    progression:    'SPRINT_FLYING_20M',
    contraindications: ['Hamstring VAS ≥ 2'],
    evidence_note:  'Mann & Murphy 2015 — mechanics of sprint acceleration',
  },

  SPRINT_FLYING_20M: {
    exercise_id:      'SPRINT_FLYING_20M',
    name:             'Flying Sprint 20m (Max Velocity)',
    name_it:          'Sprint lanciato 20m (velocità massimale)',
    movement_pattern: 'sprint',
    primary_muscles:  ['hamstring', 'glute', 'quad'],
    secondary_muscles: ['calf', 'hip_flexor'],
    equipment:        ['none'],
    bilateral:        false,
    technique_cues: [
      '20m di rincorsa per raggiungere Vmax prima del timing gate',
      'Postura eretta — non inclinata come in accelerazione',
      'Passo lungo, frequenza elevata: non scegliere uno solo',
      'Minima tensione: "veloce ma rilassato"',
    ],
    common_errors: ['Tensione eccessiva (over-striding): spalle e braccia tese'],
    regression:     'SPRINT_ACCELERATION_10M',
    progression:    null,
    contraindications: ['Hamstring VAS ≥ 1', 'Senza base di accelerazione (SPRINT_ACCELERATION non completato)'],
    evidence_note:  'Mann & Murphy 2015; Haugen et al. 2019',
  },

  // ── JUMP / PLYOMETRIC ─────────────────────────────────────────────────

  BOX_JUMP: {
    exercise_id:      'BOX_JUMP',
    name:             'Box Jump',
    name_it:          'Salto sulla cassa',
    movement_pattern: 'jump_land',
    primary_muscles:  ['quad', 'glute', 'calf'],
    secondary_muscles: ['hamstring', 'core_anterior'],
    equipment:        ['box'],
    bilateral:        true,
    technique_cues: [
      'Scatto di preparazione (countermovement) + salto esplosivo',
      'Atterraggio morbido: ginocchia flesse, assorbimento silenzioso',
      'Scendi dal box lateralmente — non saltare giù (stress inutile)',
      'Focus: velocità di decollo, non altezza del box',
    ],
    common_errors: [
      'Salto su box troppo alto: ridurre altezza se atterraggio non è morbido',
      'Rimbalzo immediato senza reset: assicurarsi recupero completo tra rep',
    ],
    regression:     'SQUAT_JUMP_BODYWEIGHT',
    progression:    'DEPTH_DROP_REACTIVE',
    contraindications: ['Ginocchio VAS ≥ 2', 'Post-chirurgia ACL < 9 mesi'],
  },

  DEPTH_DROP_REACTIVE: {
    exercise_id:      'DEPTH_DROP_REACTIVE',
    name:             'Depth Drop to Jump (Reactive)',
    name_it:          'Caduta e salto reattivo (shock method)',
    movement_pattern: 'jump_land',
    primary_muscles:  ['quad', 'calf', 'glute'],
    secondary_muscles: ['hamstring', 'core_anterior'],
    equipment:        ['box'],
    bilateral:        true,
    technique_cues: [
      'Caduta dal box (non salto): rilascia e cadi',
      'Contatto a terra: pianta del piede, minimizza tempo (obiettivo < 200ms)',
      'Rimbalzo esplosivo verso l\'alto immediatamente al contatto',
      'Atterraggio finale: morbido, ginocchia flesse',
    ],
    common_errors: [
      'Tempo di contatto troppo lungo (> 300ms): non assorbire — rimbalzare',
      'Altezza box eccessiva senza base: iniziare da 40cm, progressione a 60–75cm',
    ],
    regression:     'BOX_JUMP',
    progression:    null,
    contraindications: [
      'PLYOMETRIC_FOUNDATION non completata (6+ settimane)',
      'Squat 1RM < 1.5× BW',
      'Tendinopatia rotulea o achillea attiva',
    ],
    evidence_note:  'Verkhoshansky & Siff 2009 — shock method',
  },

  // ── MOBILITY / CORRECTIVE ─────────────────────────────────────────────

  HIP_90_90_STRETCH: {
    exercise_id:      'HIP_90_90_STRETCH',
    name:             '90/90 Hip Mobility',
    name_it:          'Mobilità anca 90/90',
    movement_pattern: 'stretch_mobility',
    primary_muscles:  ['hip_flexor', 'glute', 'adductor'],
    secondary_muscles: [],
    equipment:        ['none'],
    bilateral:        false,
    technique_cues: [
      'Seduto a terra: gamba anteriore 90° davanti, posteriore 90° laterale',
      'Mantieni colonna neutra — non inarcare la schiena',
      'Inclina il busto avanti sulla gamba anteriore per aumentare ROM',
      '60–90 secondi per lato, 2–3 ripetizioni',
    ],
    common_errors: ['Rotazione della schiena per compensare mancanza di ROM'],
    regression:     null,
    progression:    'HIP_90_90_WITH_INTERNAL_ROTATION',
    contraindications: ['Dolore acuto anca VAS > 3'],
  },

  ANKLE_MOBILITY_WALL: {
    exercise_id:      'ANKLE_MOBILITY_WALL',
    name:             'Ankle Dorsiflexion Wall Drill',
    name_it:          'Esercizio mobilità caviglia al muro',
    movement_pattern: 'stretch_mobility',
    primary_muscles:  ['calf'],
    secondary_muscles: [],
    equipment:        ['none'],
    bilateral:        false,
    technique_cues: [
      'Piede a 10cm dal muro, spingere il ginocchio verso il muro senza alzare il tallone',
      'Progressione: allontana il piede finché il tallone si solleva',
      '10 reps di mobilizzazione dinamica per lato',
    ],
    common_errors: ['Tallone che si alza: tornare alla distanza precedente'],
    regression:     null,
    progression:    null,
    contraindications: [],
    evidence_note:  'Starrett & Cordoza 2013 — dorsiflexion come prerequisito squat',
  },

  THORACIC_SPINE_ROTATION: {
    exercise_id:      'THORACIC_SPINE_ROTATION',
    name:             'Thoracic Spine Rotation (Quadruped)',
    name_it:          'Rotazione toracica in quadrupedia',
    movement_pattern: 'stretch_mobility',
    primary_muscles:  ['back_upper'],
    secondary_muscles: ['core_anterior'],
    equipment:        ['none'],
    bilateral:        false,
    technique_cues: [
      'In quadrupedia, mano dietro la testa',
      'Ruota il gomito verso il soffitto — solo toracica, non lombare',
      '10 reps lente per lato',
    ],
    common_errors: ['Rotazione che parte dalla lombare invece della toracica'],
    regression:     null,
    progression:    null,
    contraindications: [],
  },

  // ─── AGGIUNTE v1.1 ────────────────────────────────────────────────────────

  SPLIT_SQUAT_BULGARIAN: {
    exercise_id:      'SPLIT_SQUAT_BULGARIAN',
    name:             'Bulgarian Split Squat',
    name_it:          'Split Squat Bulgaro',
    movement_pattern: 'squat',
    primary_muscles:  ['quad', 'glute'],
    secondary_muscles: ['hamstring', 'core_anterior'],
    equipment:        ['dumbbell'],
    bilateral:        false,
    technique_cues:   ['Piede posteriore su box (30–45cm)', 'Ginocchio anteriore non supera le dita del piede', 'Busto eretto o leggermente inclinato in avanti'],
    common_errors:    ['Ginocchio anteriore che collassa in valgismo', 'Piede posteriore troppo vicino al box'],
    regression:       'GOBLET_SQUAT',
    progression:      'SQUAT_BACK_BARBELL',
    contraindications: ['dolore patello-femorale acuto'],
    evidence_note:    'Contreras et al. 2011: split squat genera alta attivazione glutei con ridotto carico spinale.',
  },

  LEG_PRESS: {
    exercise_id:      'LEG_PRESS',
    name:             'Leg Press',
    name_it:          'Leg Press',
    movement_pattern: 'squat',
    primary_muscles:  ['quad', 'glute'],
    secondary_muscles: ['hamstring', 'calf'],
    equipment:        ['cable_machine'],
    bilateral:        true,
    technique_cues:   ['Piedi a larghezza spalle, a meta carrello', 'Non bloccare le ginocchia in estensione', 'ROM completo: coscia parallela o oltre'],
    common_errors:    ['Range of motion parziale', 'Ginocchia che collassano in valgismo'],
    regression:       'GOBLET_SQUAT',
    progression:      'SQUAT_BACK_BARBELL',
    contraindications: [],
  },

  GLUTE_BRIDGE_SINGLE_LEG: {
    exercise_id:      'GLUTE_BRIDGE_SINGLE_LEG',
    name:             'Single-Leg Glute Bridge',
    name_it:          'Ponte Gluteo Monolaterale',
    movement_pattern: 'hinge',
    primary_muscles:  ['glute', 'hamstring'],
    secondary_muscles: ['core_posterior', 'core_anterior'],
    equipment:        ['bodyweight'],
    bilateral:        false,
    technique_cues:   ['A terra, ginocchio piegato, altro arto teso', 'Spingi con il tallone, attiva il gluteo', 'Mantieni 1–2 secondi al picco'],
    common_errors:    ['Bacino che ruota o scende sul lato libero', 'Spingi con i lombi invece del gluteo'],
    regression:       null,
    progression:      'HIP_THRUST_BARBELL',
    contraindications: [],
  },

  SLED_PUSH: {
    exercise_id:      'SLED_PUSH',
    name:             'Sled Push',
    name_it:          'Spinta Slitta',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'glute', 'calf'],
    secondary_muscles: ['core_anterior', 'shoulder'],
    equipment:        ['sled'],
    bilateral:        true,
    technique_cues:   ['Posizione sprint bassa (45°)', 'Passi veloci, appoggio pianta', 'Non bloccare le ginocchia'],
    common_errors:    ['Busto troppo verticale', 'Passi troppo lunghi'],
    regression:       'SPRINT_ACCELERATION_10M',
    progression:      null,
    contraindications: ['dolore al ginocchio in flessione profonda'],
  },

  MEDICINE_BALL_SLAM: {
    exercise_id:      'MEDICINE_BALL_SLAM',
    name:             'Medicine Ball Overhead Slam',
    name_it:          'Slam Palla Medica Overhead',
    movement_pattern: 'rotation',
    primary_muscles:  ['core_anterior', 'shoulder', 'back_upper'],
    secondary_muscles: ['glute', 'full_body'],
    equipment:        ['none'],
    bilateral:        true,
    technique_cues:   ['Alza la palla sopra la testa estendendo i fianchi', 'Slam esplosivo verso il pavimento', 'Fletti leggermente le ginocchia al rilascio'],
    common_errors:    ['Movimento che nasce solo dalle braccia, non dai fianchi', 'Schiena tonda al momento dello slam'],
    regression:       null,
    progression:      null,
    contraindications: ['lombalgia acuta', 'problema alla spalla'],
  },

  HURDLE_HOP_BILATERAL: {
    exercise_id:      'HURDLE_HOP_BILATERAL',
    name:             'Bilateral Hurdle Hop',
    name_it:          'Salto Ostacolo Bilaterale',
    movement_pattern: 'jump_land',
    primary_muscles:  ['quad', 'calf', 'glute'],
    secondary_muscles: ['core_anterior'],
    equipment:        ['box'],
    bilateral:        true,
    technique_cues:   ['Atterraggio morbido su punta-tacco', 'Contatto a terra minimo (stiffness)', 'Braccia che aiutano la spinta'],
    common_errors:    ['Atterraggio duro sui talloni', 'Ginocchia in valgismo all\'atterraggio'],
    regression:       'BOX_JUMP',
    progression:      'DEPTH_DROP_REACTIVE',
    contraindications: ['dolore al ginocchio', 'Achille acuto'],
  },

  BROAD_JUMP: {
    exercise_id:      'BROAD_JUMP',
    name:             'Broad Jump (Standing Long Jump)',
    name_it:          'Salto in Lungo da Fermo',
    movement_pattern: 'jump_land',
    primary_muscles:  ['glute', 'quad', 'hamstring'],
    secondary_muscles: ['calf', 'core_anterior'],
    equipment:        ['bodyweight'],
    bilateral:        true,
    technique_cues:   ['Carica il movimento oscillando le braccia', 'Spinta esplosiva orizzontale', 'Atterraggio morbido con flessione ginocchio-anca'],
    common_errors:    ['Salto troppo verticale invece che orizzontale', 'Atterraggio rigido'],
    regression:       'BOX_JUMP',
    progression:      'HURDLE_HOP_BILATERAL',
    contraindications: [],
  },

  HIGH_KNEE_DRILL: {
    exercise_id:      'HIGH_KNEE_DRILL',
    name:             'High Knee Drill (A-Skip)',
    name_it:          'A-Skip (Ginocchia Alte)',
    movement_pattern: 'sprint',
    primary_muscles:  ['hip_flexor', 'quad', 'calf'],
    secondary_muscles: ['core_anterior', 'glute'],
    equipment:        ['bodyweight'],
    bilateral:        false,
    technique_cues:   ['Ginocchio al 90° in alto, piede dorsiflessato', 'Braccia opposte, angolo 90°', 'Ritmo cadenzato, non veloce'],
    common_errors:    ['Busto che si inclina indietro', 'Piede a punta invece che dorsiflessato'],
    regression:       null,
    progression:      'SPRINT_ACCELERATION_10M',
    contraindications: [],
  },

  LATERAL_SHUFFLE: {
    exercise_id:      'LATERAL_SHUFFLE',
    name:             'Lateral Shuffle',
    name_it:          'Scivolamento Laterale',
    movement_pattern: 'locomotion',
    primary_muscles:  ['adductor', 'quad', 'glute'],
    secondary_muscles: ['core_posterior', 'calf'],
    equipment:        ['bodyweight'],
    bilateral:        false,
    technique_cues:   ['Posizione atletica bassa (flessione anca-ginocchio)', 'Passo laterale — non incrociare i piedi', 'Mantieni il bacino basso per tutto il movimento'],
    common_errors:    ['Piedi che si incontrano o si incrociano', 'Busto che si erge durante lo spostamento'],
    regression:       null,
    progression:      'COD_45_CONE_DRILL',
    contraindications: [],
  },

  COD_45_CONE_DRILL: {
    exercise_id:      'COD_45_CONE_DRILL',
    name:             'COD 45° Cone Drill',
    name_it:          'Cambio Direzione 45°',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'glute', 'adductor'],
    secondary_muscles: ['core_posterior', 'calf'],
    equipment:        ['bodyweight'],
    bilateral:        false,
    technique_cues:   ['Approccio al cono decelerando con passi corti', 'Pianta interna al cono come pivot', 'Re-accelerazione esplosiva nella nuova direzione'],
    common_errors:    ['Taglio troppo brusco senza decelerazione', 'Valgismo del ginocchio nel taglio'],
    regression:       'LATERAL_SHUFFLE',
    progression:      'COD_90_REACTIVE',
    contraindications: ['lesione LCA recente'],
  },

  COD_90_REACTIVE: {
    exercise_id:      'COD_90_REACTIVE',
    name:             'Reactive COD 90° (T-Drill)',
    name_it:          'T-Drill Reattivo 90°',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'glute', 'adductor', 'hamstring'],
    secondary_muscles: ['core_posterior', 'calf'],
    equipment:        ['bodyweight'],
    bilateral:        false,
    technique_cues:   ['Sprint in avanti 5m → taglio 90° → laterale 2.5m → rientro', 'Decelerazione ATTIVA prima del taglio', 'Segnale visivo/uditivo prima del cambio di direzione'],
    common_errors:    ['Anticipare la direzione prima del segnale', 'Ginocchio in valgismo nel taglio a 90°'],
    regression:       'COD_45_CONE_DRILL',
    progression:      null,
    contraindications: ['lesione LCA recente'],
    evidence_note:    'Hewit et al. 2011 Journal of Strength & Conditioning: T-drill come test valido COD in sport di squadra.',
  },

  JOGGING_FIELD_EASY: {
    exercise_id:      'JOGGING_FIELD_EASY',
    name:             'Easy Field Jog',
    name_it:          'Jogging Facile in Campo',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'hamstring', 'calf'],
    secondary_muscles: ['glute', 'core_anterior'],
    equipment:        ['none'],
    bilateral:        false,
    technique_cues:   ['Ritmo conversazionale', 'Atterraggio morbido', 'Postura eretta rilassata'],
    common_errors:    ['Ritmo troppo veloce', 'Tensione nel busto e nelle spalle'],
    regression:       null,
    progression:      'ZONE2_RUNNING',
    contraindications: ['dolore al ginocchio/anca in fase acuta'],
  },

  LATERAL_BAND_WALK: {
    exercise_id:      'LATERAL_BAND_WALK',
    name:             'Lateral Band Walk',
    name_it:          'Camminata Laterale con Elastico',
    movement_pattern: 'locomotion',
    primary_muscles:  ['glute', 'adductor'],
    secondary_muscles: ['quad', 'core_anterior'],
    equipment:        ['resistance_band'],
    bilateral:        false,
    technique_cues:   ['Elastico sopra le ginocchia', 'Posizione atletica bassa', 'Passi laterali controllati — non rimbalzare'],
    common_errors:    ['Postura troppo eretta', 'Piedi che si avvicinano troppo'],
    regression:       null,
    progression:      'COD_45_CONE_DRILL',
    contraindications: [],
  },

  LACTATE_TOLERANCE_RUN: {
    exercise_id:      'LACTATE_TOLERANCE_RUN',
    name:             'Lactate Tolerance Run (800m–1000m rep)',
    name_it:          'Ripetuta LT (800m–1000m)',
    movement_pattern: 'locomotion',
    primary_muscles:  ['quad', 'hamstring', 'calf', 'glute'],
    secondary_muscles: ['core_anterior', 'hip_flexor'],
    equipment:        ['none'],
    bilateral:        false,
    technique_cues:   ['Ritmo 5–10sec/km più veloce del threshold', 'Gestisci il dolore lattacido: tecnica prima di tutto', 'Recovery camminando o jogging lento'],
    common_errors:    ['Partire troppo forte nelle prime rep', 'Recupero troppo breve'],
    regression:       'THRESHOLD_RUNNING',
    progression:      null,
    contraindications: ['overreaching in corso (HRV basso)'],
    evidence_note:    'Billat 2001 Sports Medicine: training at 100-110% vLT migliora capacita tampone lattacido.',
  },

  DROP_JUMP_REACTIVE: {
    exercise_id:      'DROP_JUMP_REACTIVE',
    name:             'Drop Jump (Reactive)',
    name_it:          'Drop Jump Reattivo',
    movement_pattern: 'jump_land',
    primary_muscles:  ['quad', 'calf', 'glute'],
    secondary_muscles: ['hamstring', 'core_anterior'],
    equipment:        ['box'],
    bilateral:        true,
    technique_cues:   ['Scendi dal box (altezza 30–50cm)', 'Contatto a terra MINIMO (<200ms)', 'Rimbalzo esplosivo immediato — non ammortizzare'],
    common_errors:    ['Contatto a terra troppo lungo (ammortizzazione)', 'Ginocchia in valgismo all\'atterraggio'],
    regression:       'DEPTH_DROP_REACTIVE',
    progression:      null,
    contraindications: ['dolore patello-femorale', 'Achille acuto'],
    evidence_note:    'Flanagan & Comyns 2008 S&C: contact time <200ms = reactive strength index ottimale.',
  },

  CALF_RAISE_SEATED: {
    exercise_id:      'CALF_RAISE_SEATED',
    name:             'Seated Calf Raise (Soleus Isolation)',
    name_it:          'Calf Raise Seduto (Isolamento Soleo)',
    movement_pattern: 'isometric',
    primary_muscles:  ['calf'],
    secondary_muscles: [],
    equipment:        ['dumbbell'],
    bilateral:        true,
    technique_cues:   ['Seduto con ginocchio a 90°', 'Carico sulle cosce', 'ROM completo: tacco a terra → punta massima', 'Pausa di 2 secondi in contrazione'],
    common_errors:    ['ROM parziale', 'Non isolare il soleo vs gastrocnemio'],
    regression:       'CALF_RAISE_SINGLE_LEG',
    progression:      null,
    contraindications: ['tendinopatia Achillea acuta (fase irritabile)'],
    evidence_note:    'Alfredson et al. 1998: carico eccentrico su soleo via calf raise seduto riduce il dolore tendinopatia Achillea.',
  },

  RSA_SHUTTLE_30M: {
    exercise_id:      'RSA_SHUTTLE_30M',
    name:             'RSA Shuttle Sprint 30m',
    name_it:          'Sprint Ripetuto RSA 30m Navetta',
    movement_pattern: 'sprint',
    primary_muscles:  ['quad', 'hamstring', 'glute', 'calf'],
    secondary_muscles: ['core_anterior', 'hip_flexor'],
    equipment:        ['bodyweight'],
    bilateral:        false,
    technique_cues:   ['30m = 15m andata + 15m ritorno (navetta)', 'Sprint massimale ogni ripetuta', 'Recupero incompleto (20–30s) tra le rep'],
    common_errors:    ['Non sprintare al massimo nelle ultime rep', 'Mancata decelerazione prima del cambio direzione'],
    regression:       'SPRINT_ACCELERATION_10M',
    progression:      null,
    contraindications: ['dolore ischio-crurali acuto'],
    evidence_note:    'Bishop et al. 2011 BJSM: RSA test con 6x30m navetta valida il metabolismo glicolitico nel calciatore.',
  },
}

// ─── WORKOUT TEMPLATES PER BLOCCO ─────────────────────────────────────────

export const WORKOUT_TEMPLATE_CATALOG: Record<string, WorkoutTemplate[]> = {

  // ── ZONE2_FOUNDATION ──────────────────────────────────────────────────

  ZONE2_FOUNDATION: [
    {
      template_id:        'ZONE2_RUN_A',
      block_id:           'ZONE2_FOUNDATION',
      name:               'Zone 2 Endurance Run',
      name_it:            'Corsa in zona 2',
      session_type:       'endurance',
      target_duration_min: [45, 75],
      target_tss:         [40, 65],
      day_in_week:        'A',
      warmup_protocol:    '5 min camminata Z1 + 5 min mobilità caviglia/anca',
      cooldown_protocol:  '5 min camminata + stretching statico 10 min (hamstring, calf, hip flexor)',
      notes:              'FC target: 60–72% HRmax. Se FC sale sopra soglia, rallenta. Non guardare il ritmo.',
      slots: [
        {
          exercise_id:        'ZONE2_RUNNING',
          order:              1,
          role:               'primary',
          sets:               [1, 1],
          duration_sec:       [2700, 4500],  // 45–75 minuti
          intensity:          'Z2',
          rpe_target:         [2, 4],
          rest_sec:           [0, 0],
          progression_method: 'tss_based',
          week1_load_note:    'Inizia con 45 min. Regola il ritmo per mantenere FC in zona.',
          progression_rule:   '+5 min/sessione ogni settimana fino a 75 min. Se FC stabile e RPE < 4, mantieni.',
          coaching_note:      'Parla ad alta voce durante la corsa — se fai fatica a parlare, rallenta.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── THRESHOLD_ENDURANCE ───────────────────────────────────────────────

  THRESHOLD_ENDURANCE: [
    {
      template_id:        'THRESHOLD_RUN_A',
      block_id:           'THRESHOLD_ENDURANCE',
      name:               'Threshold Intervals (2×20\')',
      name_it:            'Interval alla soglia 2×20 minuti',
      session_type:       'endurance',
      target_duration_min: [60, 75],
      target_tss:         [65, 85],
      day_in_week:        'A',
      warmup_protocol:    '15 min Z1 progressivo + 3× 30s strides @ Z3',
      cooldown_protocol:  '10 min Z1 + stretching 10 min',
      notes:              'Sessione principale del mesociclo threshold. FC target: 82–92% HRmax.',
      slots: [
        {
          exercise_id:        'ZONE2_RUNNING',
          order:              1,
          role:               'warmup',
          sets:               [1, 1],
          duration_sec:       [900, 900],
          intensity:          'Z1',
          rpe_target:         [1, 3],
          rest_sec:           [0, 0],
          progression_method: 'fixed',
          week1_load_note:    'Riscaldamento standard 15 min Z1.',
          progression_rule:   'Invariato — sempre 15 min Z1.',
          coaching_note:      'Riscaldamento progressivo: parti lento, arriva a Z2 nei minuti finali.',
        },
        {
          exercise_id:        'THRESHOLD_RUNNING',
          order:              2,
          role:               'primary',
          sets:               [2, 3],
          duration_sec:       [1200, 1200],  // 20 min per set
          intensity:          'FTP',
          rpe_target:         [6, 8],
          rest_sec:           [300, 300],    // 5 min Z1 tra i set
          progression_method: 'tss_based',
          week1_load_note:    'Inizia con 2×20\'. Se RPE > 8 nel secondo set, è il carico giusto.',
          progression_rule:   'Settimana 3: 3×20\'. Se RPE stabile, aggiungi 5 min al terzo set.',
          coaching_note:      'Mantieni ritmo costante — non partire forte. Gli ultimi 5 min devono essere difficili, non i primi.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── DELOAD_WEEK ───────────────────────────────────────────────────────

  DELOAD_WEEK: [
    {
      template_id:        'DELOAD_EASY_A',
      block_id:           'DELOAD_WEEK',
      name:               'Deload — Easy Aerobic Session',
      name_it:            'Settimana scarico — sessione aerobica leggera',
      session_type:       'recovery',
      target_duration_min: [30, 45],
      target_tss:         [20, 40],
      day_in_week:        'A',
      warmup_protocol:    '5 min mobilità libera',
      cooldown_protocol:  '10 min stretching statico + respiro',
      notes:              'Volume −40%, intensità invariata. Non aggiungere intensità "perché ti senti bene".',
      slots: [
        {
          exercise_id:        'ZONE2_RUNNING',
          order:              1,
          role:               'primary',
          sets:               [1, 1],
          duration_sec:       [1800, 2700],
          intensity:          'Z1',
          rpe_target:         [1, 3],
          rest_sec:           [0, 0],
          progression_method: 'fixed',
          week1_load_note:    '30–45 min massimo. FC < 70% HRmax.',
          progression_rule:   'Nessuna progressione — è una settimana di recupero.',
          coaching_note:      'Se ti senti benissimo, è normale — è la supercompensazione che arriva.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── HYPERTROPHY_MESOCYCLE ─────────────────────────────────────────────

  HYPERTROPHY_MESOCYCLE: [
    {
      template_id:        'HYPERTROPHY_LOWER_A',
      block_id:           'HYPERTROPHY_MESOCYCLE',
      name:               'Lower Body Hypertrophy — Quad Dominant',
      name_it:            'Ipertrofia lower body — dominanza quad',
      session_type:       'strength',
      target_duration_min: [60, 80],
      target_tss:         [55, 75],
      day_in_week:        'A',
      warmup_protocol:    '10 min mobilità anca + caviglia (HIP_90_90_STRETCH + ANKLE_MOBILITY_WALL) + 2 serie leggere squat',
      cooldown_protocol:  '5 min stretching hip flexor + quad + foam rolling 10 min',
      notes:              'Sessione A del mesociclo ipertrofia lower body. Focus quad. Alternare con sessione B (posterior chain).',
      slots: [
        {
          exercise_id:        'SQUAT_BACK_BARBELL',
          order:              1,
          role:               'primary',
          sets:               [4, 5],
          reps:               [8, 12],
          intensity:          'pct_1rm',
          rpe_target:         [7, 9],
          rest_sec:           [120, 180],
          tempo:              '3-1-1-0',
          progression_method: 'double_progression',
          week1_load_note:    'Usa il 70% del tuo 1RM stimato. Se non hai il 1RM, inizia con RPE 7 nelle prime serie.',
          progression_rule:   'Quando completi tutte le serie al limite superiore delle reps (es. 4×12) con RPE ≤ 8, aggiungi 2.5–5kg la settimana successiva.',
          coaching_note:      'Eccentrico lento (3s) — concentrico esplosivo. Non rimbalzare in fondo.',
        },
        {
          exercise_id:        'HIP_THRUST_BARBELL',
          order:              2,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [10, 15],
          intensity:          'pct_1rm',
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          tempo:              '2-1-2-1',
          progression_method: 'double_progression',
          week1_load_note:    'Carico che permette contrazione massimale glute. Inizia leggero — focalizza la sensazione muscolare.',
          progression_rule:   '+5kg quando raggiungi 4×15 con RPE ≤ 8.',
          coaching_note:      '1s di pausa isometrica in cima con glute contratto.',
        },
        {
          exercise_id:        'NORDIC_CURL',
          order:              3,
          role:               'accessory',
          sets:               [3, 3],
          reps:               [4, 8],
          intensity:          null,
          rpe_target:         [7, 9],
          rest_sec:           [90, 120],
          progression_method: 'double_progression',
          week1_load_note:    'Prima settimana: solo fase eccentrica (lowering). Non tentare il concentrico.',
          progression_rule:   'Quando controlli l\'eccentrico per tutto il ROM, inizia ad aggiungere 1 rep/settimana.',
          coaching_note:      'Priorità: qualità dell\'eccentrico. Se cadi velocemente, diminuisci le reps.',
        },
        {
          exercise_id:        'CALF_RAISE_SINGLE_LEG',
          order:              4,
          role:               'accessory',
          sets:               [3, 3],
          reps:               [10, 15],
          intensity:          null,
          rpe_target:         [6, 8],
          rest_sec:           [60, 90],
          progression_method: 'double_progression',
          week1_load_note:    'Bodyweight prima settimana. Aggiungi manubrio quando 3×15 è RPE ≤ 7.',
          progression_rule:   '+2.5kg ogni 2 settimane.',
          coaching_note:      'Eccentrico 3s. Tallone ben sotto il livello del gradino.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
    {
      template_id:        'HYPERTROPHY_LOWER_B',
      block_id:           'HYPERTROPHY_MESOCYCLE',
      name:               'Lower Body Hypertrophy — Posterior Chain',
      name_it:            'Ipertrofia lower body — catena posteriore',
      session_type:       'strength',
      target_duration_min: [60, 80],
      target_tss:         [55, 75],
      day_in_week:        'B',
      warmup_protocol:    '10 min hip hinge pattern (RDL bodyweight × 10, hip circle × 10) + HIP_90_90_STRETCH',
      cooldown_protocol:  '5 min stretching hamstring + stretching hip flexor',
      notes:              'Sessione B: focus posterior chain. Complementare alla sessione A quad-dominant.',
      slots: [
        {
          exercise_id:        'DEADLIFT_CONVENTIONAL',
          order:              1,
          role:               'primary',
          sets:               [4, 5],
          reps:               [6, 10],
          intensity:          'pct_1rm',
          rpe_target:         [7, 9],
          rest_sec:           [180, 240],
          tempo:              '3-0-1-0',
          progression_method: 'double_progression',
          week1_load_note:    '70–75% 1RM. Priorità tecnica sulla prima sessione — non al massimale.',
          progression_rule:   '+5kg quando tutte le serie raggiungono il top delle reps con RPE ≤ 8.',
          coaching_note:      'Schiena neutra durante tutto il pull. Se tecnica deteriora, stop il set.',
        },
        {
          exercise_id:        'RDL_DUMBBELL',
          order:              2,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [10, 15],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          tempo:              '3-1-1-0',
          progression_method: 'double_progression',
          week1_load_note:    'Carico che permette di sentire lo stiramento hamstring al punto basso.',
          progression_rule:   '+2.5kg quando 4×15 con RPE ≤ 8.',
          coaching_note:      'Stira gli hamstring — non piegare le ginocchia per compensare.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
    {
      template_id:        'HYPERTROPHY_UPPER_A',
      block_id:           'HYPERTROPHY_MESOCYCLE',
      name:               'Upper Body Hypertrophy — Push/Pull',
      name_it:            'Ipertrofia upper body — spinta e tirata',
      session_type:       'strength',
      target_duration_min: [55, 75],
      target_tss:         [50, 70],
      day_in_week:        'C',
      warmup_protocol:    '10 min mobilità spalla (THORACIC_SPINE_ROTATION × 10 + band pull-apart × 15) + 2 serie leggere bench press',
      cooldown_protocol:  '5 min stretching petto + stretching lat + foam rolling spalle',
      notes:              'Sessione C: upper body push + pull in formato superset per densità.',
      slots: [
        {
          exercise_id:        'BENCH_PRESS_BARBELL',
          order:              1,
          role:               'primary',
          sets:               [4, 5],
          reps:               [8, 12],
          intensity:          'pct_1rm',
          rpe_target:         [7, 9],
          rest_sec:           [120, 180],
          tempo:              '3-1-1-0',
          progression_method: 'double_progression',
          week1_load_note:    '70% 1RM o RPE 7 nelle prime serie. Pausa 1s sul petto.',
          progression_rule:   '+2.5kg quando 5×12 con RPE ≤ 8.',
          coaching_note:      'Scapole retratte per tutta la serie. Non rimbalzare dal petto.',
        },
        {
          exercise_id:        'BARBELL_ROW',
          order:              2,
          role:               'primary',
          sets:               [4, 5],
          reps:               [8, 12],
          intensity:          'pct_1rm',
          rpe_target:         [7, 9],
          rest_sec:           [120, 180],
          tempo:              '2-1-2-0',
          progression_method: 'double_progression',
          week1_load_note:    'Carico che permette retrazione completa delle scapole in cima.',
          progression_rule:   '+5kg quando 5×12 con RPE ≤ 8.',
          coaching_note:      'Tira verso l\'ombelico basso. Contrazione 1s con scapole retratte.',
        },
        {
          exercise_id:        'OVERHEAD_PRESS_BARBELL',
          order:              3,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [8, 12],
          intensity:          'pct_1rm',
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          progression_method: 'double_progression',
          week1_load_note:    '65% 1RM. Controlla che la barra non oscilli — usa il core.',
          progression_rule:   '+2.5kg ogni 2 settimane.',
          coaching_note:      'Non iperestendere la schiena — core braced durante tutto il movimento.',
        },
        {
          exercise_id:        'PULLUP_WEIGHTED',
          order:              4,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [6, 10],
          intensity:          null,
          rpe_target:         [7, 9],
          rest_sec:           [120, 150],
          progression_method: 'double_progression',
          week1_load_note:    'Bodyweight prima settimana. Aggiungi zavorra quando 4×10 è RPE ≤ 8.',
          progression_rule:   '+2.5kg quando 4×10 con RPE ≤ 8.',
          coaching_note:      'Dead hang pieno in partenza. Scapole depresse prima di tirare.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── MAX_STRENGTH_ACCUMULATION ─────────────────────────────────────────

  MAX_STRENGTH_ACCUMULATION: [
    {
      template_id:        'MAX_STRENGTH_A',
      block_id:           'MAX_STRENGTH_ACCUMULATION',
      name:               'Maximal Strength — Heavy Compound',
      name_it:            'Forza massimale — esercizi composti pesanti',
      session_type:       'strength',
      target_duration_min: [60, 90],
      target_tss:         [65, 85],
      day_in_week:        'A',
      warmup_protocol:    '10 min mobilità specifica + rampa di avvicinamento (50%×5, 65%×3, 80%×1 → lavoro)',
      cooldown_protocol:  '10 min mobilità + stretching statico 5 min',
      notes:              'Schema 5/3/1 (Wendler 2009) o simile wave loading. Intensità 80–92% 1RM. Priorità assoluta tecnica.',
      slots: [
        {
          exercise_id:        'SQUAT_BACK_BARBELL',
          order:              1,
          role:               'primary',
          sets:               [3, 5],
          reps:               [3, 5],
          intensity:          'pct_1rm',
          rpe_target:         [8, 9],
          rest_sec:           [240, 360],
          tempo:              '2-1-1-0',
          progression_method: 'wave_loading',
          week1_load_note:    'Settimana 1 schema 5/3/1: 65%×5, 75%×5, 85%×5+. Il "5+" = massimo reps a RPE ≤ 9.',
          progression_rule:   'Ciclo 3 settimane: 85%×5 → 90%×3 → 95%×1. Settimana 4 deload. Poi +2.5% 1RM stimato.',
          coaching_note:      'Recupero pieno tra le serie (4–6 min). La qualità del singolo lift conta più del volume.',
        },
        {
          exercise_id:        'DEADLIFT_CONVENTIONAL',
          order:              2,
          role:               'primary',
          sets:               [3, 5],
          reps:               [3, 5],
          intensity:          'pct_1rm',
          rpe_target:         [8, 9],
          rest_sec:           [300, 420],
          progression_method: 'wave_loading',
          week1_load_note:    'Stessa progressione dello squat ma giorni separati.',
          progression_rule:   'Stessa progressione dello squat.',
          coaching_note:      'Stop il set se la schiena si arrotonda. Non negoziabile.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── SPRINT_ACCELERATION ───────────────────────────────────────────────

  SPRINT_ACCELERATION: [
    {
      template_id:        'SPRINT_ACC_A',
      block_id:           'SPRINT_ACCELERATION',
      name:               'Acceleration Development — 10m Sprints',
      name_it:            'Sviluppo accelerazione — sprint 10m',
      session_type:       'power',
      target_duration_min: [45, 60],
      target_tss:         [50, 70],
      day_in_week:        'A',
      warmup_protocol:    '15 min progressivo: camminata → jogging → A-march drill × 2 × 20m → B-skip × 2 × 20m → accelerazioni progressive 60–80%',
      cooldown_protocol:  '10 min camminata Z1 + stretching hip flexor + hamstring',
      notes:              'Recupero COMPLETO tra i rep (3–5 min). Qualità assoluta — se il tempo peggiora, stop.',
      slots: [
        {
          exercise_id:        'SPRINT_ACCELERATION_10M',
          order:              1,
          role:               'primary',
          sets:               [4, 6],
          distance_m:         [10, 10],
          intensity:          null,
          rpe_target:         [9, 10],
          rest_sec:           [180, 300],
          progression_method: 'linear',
          week1_load_note:    '4 rep × 10m. Massimo sforzo ma tecnica prioritaria.',
          progression_rule:   '+1 rep/settimana fino a 6 rep. Poi aggiungere 20m run-in (→ diventa flying sprint).',
          coaching_note:      'Non guardare il cronometro durante lo sprint. Concentrati sulla sensazione di spinta orizzontale.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── VO2MAX_INTERVALS ──────────────────────────────────────────────────

  VO2MAX_INTERVALS: [
    {
      template_id:        'VO2MAX_4X4_A',
      block_id:           'VO2MAX_INTERVALS',
      name:               'VO₂max 4×4\' (Seiler Protocol)',
      name_it:            'VO2max interval 4×4 minuti (protocollo Seiler)',
      session_type:       'endurance',
      target_duration_min: [50, 65],
      target_tss:         [70, 90],
      day_in_week:        'A',
      warmup_protocol:    '15 min progressivo Z1→Z2 + 2× 30s @ Z3 → 2 min recupero',
      cooldown_protocol:  '10 min Z1 + stretching 5 min',
      notes:              'Protocollo classico Seiler 4×4: 4 min ad alta intensità, 4 min recupero attivo Z1. FC obiettivo > 92% HRmax negli ultimi 60s di ogni rep.',
      slots: [
        {
          exercise_id:        'VO2MAX_RUNNING',
          order:              1,
          role:               'primary',
          sets:               [4, 5],
          duration_sec:       [240, 240],  // 4 minuti per set
          intensity:          'Z5',
          rpe_target:         [8, 10],
          rest_sec:           [240, 240],  // 4 minuti recupero Z1
          progression_method: 'tss_based',
          week1_load_note:    'Inizia con 4 rep. La prima deve sembrare "quasi troppo facile" — la quarta sarà difficile.',
          progression_rule:   'Settimana 3: 5 rep. Non aggiungere oltre 5 rep × 4 min (overreaching).',
          coaching_note:      'Se la FC non raggiunge il 92% HRmax nella terza e quarta rep, sei andato troppo piano. Adatta il ritmo.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── MOBILITY_FOUNDATION ───────────────────────────────────────────────

  MOBILITY_FOUNDATION: [
    {
      template_id:        'MOBILITY_DAILY_A',
      block_id:           'MOBILITY_FOUNDATION',
      name:               'Daily Mobility Routine',
      name_it:            'Routine quotidiana di mobilità',
      session_type:       'prehab',
      target_duration_min: [15, 25],
      target_tss:         [5, 15],
      day_in_week:        'A',
      warmup_protocol:    'Nessuno — è già un warmup',
      cooldown_protocol:  '2 min di respirazione diaframmatica',
      notes:              'Da eseguire ogni mattina o come warm-up prima di ogni sessione. Non deve fare male.',
      slots: [
        {
          exercise_id:        'ANKLE_MOBILITY_WALL',
          order:              1,
          role:               'warmup',
          sets:               [2, 2],
          reps:               [10, 10],
          intensity:          null,
          rest_sec:           [30, 30],
          progression_method: 'fixed',
          week1_load_note:    '10 reps per lato.',
          progression_rule:   'Nessuna progressione. Aumenta la distanza dal muro quando il tallone rimane giù.',
          coaching_note:      'Ginocchio punta nella stessa direzione del piede.',
        },
        {
          exercise_id:        'HIP_90_90_STRETCH',
          order:              2,
          role:               'primary',
          sets:               [2, 3],
          duration_sec:       [60, 90],
          intensity:          null,
          rest_sec:           [30, 30],
          progression_method: 'fixed',
          week1_load_note:    '60s per lato. Nessun dolore acuto.',
          progression_rule:   'Aumenta a 90s quando riesci a rimanere rilassato per 60s.',
          coaching_note:      'Respira nell\'anca tesa. Non forzare il ROM.',
        },
        {
          exercise_id:        'THORACIC_SPINE_ROTATION',
          order:              3,
          role:               'primary',
          sets:               [2, 2],
          reps:               [10, 10],
          intensity:          null,
          rest_sec:           [20, 20],
          progression_method: 'fixed',
          week1_load_note:    '10 reps per lato, lente e controllate.',
          progression_rule:   'Nessuna progressione — eseguire sempre.',
          coaching_note:      'La rotazione parte dal torace, non dalla lombare.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── ISOMETRIC_TENDON ──────────────────────────────────────────────────

  ISOMETRIC_TENDON: [
    {
      template_id:        'ISO_TENDON_PATELLA_A',
      block_id:           'ISOMETRIC_TENDON',
      name:               'Patellar Tendon Isometric Protocol (Rio 2015)',
      name_it:            'Protocollo isometrico tendine rotuleo',
      session_type:       'prehab',
      target_duration_min: [20, 30],
      target_tss:         [10, 20],
      day_in_week:        'A',
      warmup_protocol:    '5 min cyclette leggera Z1 (non obbligatorio)',
      cooldown_protocol:  'Ghiaccio 10 min se VAS > 3 post-sessione',
      notes:              'Protocollo Rio et al. (2015): 5 × 45s @ 70% MVC isometrica, recupero 2 min. Eseguire 4–5×/settimana. Target: VAS durante isometrica ≤ 3.',
      slots: [
        {
          exercise_id:        'ISOMETRIC_WALL_SIT',
          order:              1,
          role:               'primary',
          sets:               [4, 5],
          duration_sec:       [30, 45],
          intensity:          'pct_1rm',
          rpe_target:         [5, 7],
          rest_sec:           [120, 180],
          progression_method: 'fixed',
          week1_load_note:    'Angolo 60° di flessione ginocchio. Contrazione massimale sostenuta.',
          progression_rule:   'Quando VAS ≤ 2 per 3 sessioni consecutive, passa a esercizi isotonici (step-up eccentrico).',
          coaching_note:      'L\'obiettivo è ridurre il dolore — non massimizzare la forza. Se VAS > 5 durante la contrazione, riduci l\'intensità.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ── NEURAL_PEAKING ────────────────────────────────────────────────────

  NEURAL_PEAKING: [
    {
      template_id:        'NEURAL_PEAK_A',
      block_id:           'NEURAL_PEAKING',
      name:               'Neural Activation — Pre-Competition (T−5)',
      name_it:            'Attivazione neurale pre-gara (T−5)',
      session_type:       'power',
      target_duration_min: [40, 55],
      target_tss:         [45, 65],
      day_in_week:        'A',
      warmup_protocol:    '15 min rampa Z1→Z2 + 3× salti verticali leggeri (50%)',
      cooldown_protocol:  '10 min mobilità leggera',
      notes:              'Volume bassissimo, intensità alta. Non aggiungere set "perché si sente bene". Il volume basso è intenzionale.',
      slots: [
        {
          exercise_id:        'SQUAT_BACK_BARBELL',
          order:              1,
          role:               'primary',
          sets:               [2, 3],
          reps:               [2, 3],
          intensity:          'pct_1rm',
          rpe_target:         [8, 9],
          rest_sec:           [300, 360],
          tempo:              '2-0-1-0',
          progression_method: 'fixed',
          week1_load_note:    '90–93% 1RM. Non al massimale. Solo attivazione neurale.',
          progression_rule:   'Nessuna — è una sessione di mantenimento pre-gara.',
          coaching_note:      'Muovi la barra velocemente nel concentrico. La velocità è il segnale neurale.',
        },
        {
          exercise_id:        'BOX_JUMP',
          order:              2,
          role:               'secondary',
          sets:               [3, 3],
          reps:               [3, 5],
          intensity:          null,
          rpe_target:         [8, 9],
          rest_sec:           [120, 180],
          progression_method: 'fixed',
          week1_load_note:    'Altezza media (60–70% del massimo). Focus sulla potenza di decollo, non l\'altezza.',
          progression_rule:   'Nessuna — stessa altezza tutta la settimana.',
          coaching_note:      '"Esplodi" — massima intenzione di velocità. Conta come ti senti, non come salti alto.',
        },
      ],
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // BATCH A — 10 blocchi aggiunti v1.1
  // ─────────────────────────────────────────────────────────────────────────

  RSA: [
    {
      template_id:        'RSA_FIELD_A',
      block_id:           'RSA',
      name:               'RSA Field Session A',
      name_it:            'RSA Campo A — Navette Ripetute',
      session_type:       'endurance',
      target_duration_min: [35, 50],
      target_tss:         [70, 95],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'RSA_SHUTTLE_30M',
          order:              1,
          role:               'primary',
          sets:               [5, 8],
          reps:               [1, 1],
          duration_sec:       [6, 8],
          intensity:          null,
          rpe_target:         [9, 10],
          rest_sec:           [20, 30],
          progression_method: 'double_progression',
          week1_load_note:    '5 serie di navette. Decremento tra la prima e l\'ultima rep < 5% = buona RSA.',
          progression_rule:   'Aggiungere 1 navetta a settimana fino a 8. Se decremento > 10%: ridurre serie.',
          coaching_note:      'Test RSA: cronometra ogni navetta. Se la 6a rep è >10% più lenta della 1a, stop.',
        },
        {
          exercise_id:        'JOGGING_FIELD_EASY',
          order:              2,
          role:               'cooldown',
          sets:               [1, 1],
          duration_sec:       [300, 600],
          intensity:          'Z1',
          rpe_target:         [4, 5],
          rest_sec:           [0, 0],
          progression_method: 'fixed',
          week1_load_note:    '5–10 min jogging facile per smaltire il lattato.',
          progression_rule:   'Fisso.',
          coaching_note:      'Non stoppare di colpo dopo RSA: il jogging accelera il recupero lattacido.',
        },
      ],
      warmup_protocol:    '10 min jogging Z1 + 4×30m progressivi al 50/70/85/95% + allungamenti dinamici',
      cooldown_protocol:  '5–10 min jogging Z1 + stretching ischio-crurali + foam rolling gambe',
      notes:              'Test RSA ogni 3 settimane: 6 navette, registra tempi e decremento. Fonte: Bishop 2011 BJSM.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  ECCENTRIC_HAMSTRING_PREHAB: [
    {
      template_id:        'ECCENTRIC_HAM_A',
      block_id:           'ECCENTRIC_HAMSTRING_PREHAB',
      name:               'Eccentric Hamstring Prehab A',
      name_it:            'Prehab Ischio-Crurali Eccentrico A',
      session_type:       'prehab',
      target_duration_min: [20, 30],
      target_tss:         [20, 35],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'NORDIC_CURL',
          order:              1,
          role:               'primary',
          sets:               [3, 4],
          reps:               [4, 8],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [120, 180],
          tempo:              '4-0-1-0',
          progression_method: 'double_progression',
          week1_load_note:    'Settimana 1: 3×4 rep. Eccentrico lento (4 sec). Usa banda per assistere se necessario.',
          progression_rule:   '+1 rep/settimana fino a 4×8. Poi rimuovere banda (se usata).',
          coaching_note:      'FIRMA PREHAB: Nordic eccentrico riduce infortuni ischio-crurali del 51% (Petersen 2011 AJSM). Non saltare mai.',
        },
        {
          exercise_id:        'GLUTE_BRIDGE_SINGLE_LEG',
          order:              2,
          role:               'secondary',
          sets:               [3, 3],
          reps:               [8, 12],
          intensity:          null,
          rpe_target:         [5, 7],
          rest_sec:           [60, 90],
          progression_method: 'double_progression',
          week1_load_note:    '3×8 per lato. Focus: attivazione gluteo, non lombare.',
          progression_rule:   '+1 rep/settimana per lato.',
          coaching_note:      'Se il gluteo non si accende: pausa 2 sec al picco per assicurare l\'attivazione.',
        },
        {
          exercise_id:        'RDL_DUMBBELL',
          order:              3,
          role:               'secondary',
          sets:               [3, 3],
          reps:               [10, 12],
          intensity:          null,
          rpe_target:         [6, 7],
          rest_sec:           [90, 120],
          tempo:              '3-0-1-0',
          progression_method: 'double_progression',
          week1_load_note:    'Peso che permette ROM completo e controllo eccentrico (3 sec).',
          progression_rule:   '+2.5kg quando 3×12 pulito.',
          coaching_note:      'Senti lo stretch degli ischio-crurali nella discesa. Non arrotondare la schiena bassa.',
        },
      ],
      warmup_protocol:    '5 min jogging leggero + hip circle + leg swing frontale e laterale',
      cooldown_protocol:  '5 min stretching ischio-crurali + piriforme + foam rolling posterior chain',
      notes:              '2x/sett obbligatorio in tutti i piani sport di squadra. Fonte: Petersen 2011 AJSM, Van der Horst 2015 AJSM.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  COD_MECHANICS: [
    {
      template_id:        'COD_MECH_A',
      block_id:           'COD_MECHANICS',
      name:               'COD Mechanics Drill Session A',
      name_it:            'Tecnica COD A — 45° → 90°',
      session_type:       'power',
      target_duration_min: [30, 45],
      target_tss:         [40, 60],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'LATERAL_SHUFFLE',
          order:              1,
          role:               'warmup',
          sets:               [3, 3],
          reps:               [6, 8],
          duration_sec:       [8, 10],
          intensity:          null,
          rpe_target:         [5, 6],
          rest_sec:           [30, 45],
          progression_method: 'fixed',
          week1_load_note:    '3×8m laterale. Attivazione posizione atletica bassa.',
          progression_rule:   'Fisso — riscaldamento.',
          coaching_note:      'Bacino basso per tutto. Questo è prep meccanica, non fatica.',
        },
        {
          exercise_id:        'COD_45_CONE_DRILL',
          order:              2,
          role:               'primary',
          sets:               [4, 6],
          reps:               [4, 6],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [45, 60],
          progression_method: 'fixed',
          week1_load_note:    '4×4 ripetizioni per lato. Focus meccanica decelerazione-plant-reacceleration.',
          progression_rule:   '+1 serie a settimana fino a 6. Poi passare a COD_90°.',
          coaching_note:      'Ogni rep deve essere eseguita con intenzione tecnica. Non velocizzare finché la meccanica non è solida.',
        },
        {
          exercise_id:        'COD_90_REACTIVE',
          order:              3,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [3, 4],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [60, 90],
          progression_method: 'fixed',
          week1_load_note:    'Solo dopo 2+ sett di COD_45° solido. 3×3 su segnale.',
          progression_rule:   '+1 serie a settimana. Introdurre segnale reattivo (visivo/uditivo).',
          coaching_note:      'Il segnale PRIMA del cambio direzione è critico per la reattività. Non anticipare.',
        },
      ],
      warmup_protocol:    '5 min jogging + dynamic stretching hip-adductor + 3×15m sprint progressivi',
      cooldown_protocol:  '5 min jogging + stretching adductor + glute + stretching hip flexor',
      notes:              'Progressione tecnica: 45°→90°→135°. Rischio ACL riduce con decelerazione controllata. Fonte: Dempsey et al. 2009.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  LONG_AEROBIC_ENDURANCE: [
    {
      template_id:        'LONG_AEROBIC_A',
      block_id:           'LONG_AEROBIC_ENDURANCE',
      name:               'Long Aerobic Run A',
      name_it:            'Lungo Aerobico A — 90 min Z2',
      session_type:       'endurance',
      target_duration_min: [75, 120],
      target_tss:         [80, 120],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'ZONE2_RUNNING',
          order:              1,
          role:               'primary',
          sets:               [1, 1],
          duration_sec:       [4500, 7200],
          intensity:          'Z2',
          rpe_target:         [5, 6],
          rest_sec:           [0, 0],
          progression_method: 'tss_based',
          week1_load_note:    'Settimana 1: 75 min in Zona 2 pura (nasal breathing, conversazione sostenibile).',
          progression_rule:   '+10 min/settimana fino a 2h. HR che scende a passo fisso = adattamento aerobico.',
          coaching_note:      'Il LONG RUN non è lento — è IL ritmo giusto. Se non puoi parlare, stai andando troppo forte.',
        },
      ],
      warmup_protocol:    '5 min camminata / jogging molto leggero per elevare gradualmente la FC',
      cooldown_protocol:  '5 min camminata + stretching quadricipite + ischio-crurali + gluteo',
      notes:              'Sessione fondamentale per base aerobica e adattamento mitocondriale. Non usare mai per intervalli o tempo. Fonte: San Millán 2018 PubMed.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  MAX_VELOCITY_SPRINT: [
    {
      template_id:        'MAXV_SPRINT_A',
      block_id:           'MAX_VELOCITY_SPRINT',
      name:               'Max Velocity Sprint Session A',
      name_it:            'Sprint Velocita Massima A — Flying 20m',
      session_type:       'power',
      target_duration_min: [40, 55],
      target_tss:         [50, 70],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'HIGH_KNEE_DRILL',
          order:              1,
          role:               'warmup',
          sets:               [3, 4],
          reps:               [1, 1],
          distance_m:         [20, 30],
          intensity:          null,
          rpe_target:         [5, 6],
          rest_sec:           [30, 45],
          progression_method: 'fixed',
          week1_load_note:    '3–4×20m A-skip. Attivazione neuromuscolare pre-sprint.',
          progression_rule:   'Fisso — riscaldamento specifico sprint.',
          coaching_note:      'Focus sulla meccanica: ginocchio a 90°, piede dorsiflessato, braccia opposte. Non velocità.',
        },
        {
          exercise_id:        'SPRINT_FLYING_20M',
          order:              2,
          role:               'primary',
          sets:               [4, 6],
          reps:               [1, 1],
          distance_m:         [20, 20],
          intensity:          null,
          rpe_target:         [9, 10],
          rest_sec:           [240, 360],
          progression_method: 'fixed',
          week1_load_note:    '4 flying 20m con 30m di run-up. Recupero PIENO (4–6 min) tra le rep.',
          progression_rule:   '+1 rep/settimana fino a 6. Non aggiungere se il tempo peggiora > 2%.',
          coaching_note:      'Il flying 20m misura la Velocità Massima pura. Non accelerazione. Run-up di 30m al 70% prima del timing gate.',
        },
      ],
      warmup_protocol:    '10–15 min riscaldamento progressivo: jogging + skip + 3 sprint progressivi al 50/70/85% + mobilità anca',
      cooldown_protocol:  '10 min jogging leggero + stretching hip flexor + ischio-crurali + calf',
      notes:              'RECUPERO PIENO OBBLIGATORIO tra le rep. Stop immediato se dolore ischio-crurali o Achille. Fonte: Vittori 1996 IAAF.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  PLYOMETRIC_FOUNDATION: [
    {
      template_id:        'PLYO_FOUND_A',
      block_id:           'PLYOMETRIC_FOUNDATION',
      name:               'Plyometric Foundation A',
      name_it:            'Pliometrica Fondamentale A — Salti e Landing',
      session_type:       'power',
      target_duration_min: [30, 45],
      target_tss:         [45, 65],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'BROAD_JUMP',
          order:              1,
          role:               'primary',
          sets:               [3, 4],
          reps:               [4, 6],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          progression_method: 'double_progression',
          week1_load_note:    '3×4 salti in lungo. Focus sulla qualità del lancio orizzontale e dell\'atterraggio morbido.',
          progression_rule:   '+1 rep/sett fino a 4×6. Poi passare a HURDLE_HOP.',
          coaching_note:      'Misura la distanza ogni sessione: è il tuo test di potenza orizzontale. Non la velocità.',
        },
        {
          exercise_id:        'BOX_JUMP',
          order:              2,
          role:               'primary',
          sets:               [3, 4],
          reps:               [3, 5],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          progression_method: 'double_progression',
          week1_load_note:    '3×3 su box 40–50cm. Atterraggio morbido e controllato. Non rimbalzare.',
          progression_rule:   '+1 rep/sett fino a 4×5. Poi aumentare altezza box di 5–10cm.',
          coaching_note:      'Atterraggio: ginocchio-anca-caviglia assorbono il carico. Mai atterrare rigido.',
        },
        {
          exercise_id:        'HURDLE_HOP_BILATERAL',
          order:              3,
          role:               'secondary',
          sets:               [2, 3],
          reps:               [4, 6],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          progression_method: 'double_progression',
          week1_load_note:    'Solo dalla settimana 3+ quando landing è solido. 2×4 ostacoli (30cm).',
          progression_rule:   '+1 rep/sett. Aumentare altezza ostacoli gradualmente.',
          coaching_note:      'Il contatto a terra deve essere breve: non ammortizzare, rimbalza subito. Questo sviluppa la stiffness.',
        },
      ],
      warmup_protocol:    '5 min jogging + squat dinamico + leg swing + 3 hop leggeri per risveglio tendineo',
      cooldown_protocol:  '5 min jogging leggero + stretching quad + ischio + polpaccio',
      notes:              'Progressione pliometrica: atterraggio morbido → stiffness → reattività. Non aggiungere volume se atterraggio non è sicuro. Fonte: Gambetta 2007.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  TEMPO_STRENGTH: [
    {
      template_id:        'TEMPO_STR_A',
      block_id:           'TEMPO_STRENGTH',
      name:               'Tempo Strength Session A',
      name_it:            'Forza Tempo A — Controllato Eccentrico',
      session_type:       'strength',
      target_duration_min: [50, 65],
      target_tss:         [55, 75],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'SQUAT_BACK_BARBELL',
          order:              1,
          role:               'primary',
          sets:               [3, 4],
          reps:               [6, 8],
          intensity:          'pct_1rm',
          rpe_target:         [6, 7],
          rest_sec:           [150, 180],
          tempo:              '4-1-1-0',
          progression_method: 'double_progression',
          week1_load_note:    '3×6 al 65–70% 1RM. Eccentrico 4 sec, pausa 1 sec in basso, concentrico 1 sec.',
          progression_rule:   '+2.5kg quando 4×8 pulito con tempo controllato.',
          coaching_note:      'Il TEMPO è il protagonista: 4 sec scendendo. Il carico è secondario. TUT (time under tension) = adattamento.',
        },
        {
          exercise_id:        'BENCH_PRESS_BARBELL',
          order:              2,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [8, 10],
          intensity:          'pct_1rm',
          rpe_target:         [6, 7],
          rest_sec:           [120, 150],
          tempo:              '3-1-1-0',
          progression_method: 'double_progression',
          week1_load_note:    '3×8 al 60–65% 1RM. Eccentrico 3 sec, pausa petto 1 sec.',
          progression_rule:   '+2.5kg quando 4×10 pulito.',
          coaching_note:      'Non rimbalzare la barra sul petto. La pausa 1 sec elimina il riflesso elastico.',
        },
        {
          exercise_id:        'BARBELL_ROW',
          order:              3,
          role:               'secondary',
          sets:               [3, 3],
          reps:               [8, 10],
          intensity:          null,
          rpe_target:         [6, 7],
          rest_sec:           [90, 120],
          tempo:              '2-1-2-0',
          progression_method: 'double_progression',
          week1_load_note:    '3×8 con controllo eccentrico (2 sec) e concentrico (2 sec).',
          progression_rule:   '+2.5kg quando 3×10 pulito.',
          coaching_note:      'Eccentrico controllato nella rowing = lavoro sullo scapolare e sui romboidi. Non lasciare scendere la barra di scatto.',
        },
      ],
      warmup_protocol:    '5 min bike ergometer Z1 + mobilità toracica + 2 serie leggere di ogni esercizio',
      cooldown_protocol:  'Stretching petto + schiena + quad',
      notes:              'Tempo controllato: tensione meccanica prolungata = maggior adattamento ipertrofico a parità di peso. Fonte: Schoenfeld 2010 JSCR.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  ALACTIC_POWER_REPETITION: [
    {
      template_id:        'ALACTIC_POWER_A',
      block_id:           'ALACTIC_POWER_REPETITION',
      name:               'Alactic Power Repetition A',
      name_it:            'Potenza Alattacida A — Sprint + Sled',
      session_type:       'power',
      target_duration_min: [35, 50],
      target_tss:         [50, 70],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'SPRINT_ACCELERATION_10M',
          order:              1,
          role:               'primary',
          sets:               [4, 6],
          reps:               [3, 4],
          distance_m:         [10, 10],
          intensity:          null,
          rpe_target:         [9, 10],
          rest_sec:           [120, 180],
          progression_method: 'fixed',
          week1_load_note:    '4 serie da 3 sprint 10m. Recupero PIENO (2–3 min) tra le serie.',
          progression_rule:   '+1 rep/serie fino a 4. Non ridurre il recupero.',
          coaching_note:      'SISTEMA ALATTACIDO: <10s sforzo = 0 lattato se recupero pieno. La velocità deve essere massimale ogni rep.',
        },
        {
          exercise_id:        'SLED_PUSH',
          order:              2,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [1, 1],
          distance_m:         [20, 30],
          intensity:          null,
          rpe_target:         [9, 10],
          rest_sec:           [180, 240],
          progression_method: 'fixed',
          week1_load_note:    '3×20m slitta. Carico moderato (BW ×30–40%). Focus su potenza applicata.',
          progression_rule:   '+10m distanza a settimana fino a 30m. O +5kg ogni 2 settimane.',
          coaching_note:      'Il sled è il carryover perfetto della potenza gym → campo. Posizione bassa, passi rapidi.',
        },
        {
          exercise_id:        'MEDICINE_BALL_SLAM',
          order:              3,
          role:               'secondary',
          sets:               [3, 3],
          reps:               [5, 6],
          intensity:          null,
          rpe_target:         [8, 9],
          rest_sec:           [60, 90],
          progression_method: 'fixed',
          week1_load_note:    '3×5 slam con palla 4–6kg. Potenza del pattern flessione hip-driven.',
          progression_rule:   '+1 rep/sett fino a 6. O aumentare peso palla di 1kg.',
          coaching_note:      'Il slam non è un esercizio per le braccia. Nasce dai fianchi. "Schianta" i fianchi a terra.',
        },
      ],
      warmup_protocol:    '10 min riscaldamento: jogging + skip + 3 sprint progressivi 50/70/85% + mobilità anca',
      cooldown_protocol:  '10 min jogging leggero + stretching hip flexor + ischio',
      notes:              'Sistema fosfageno (ATP-PCr): attività <10s con recupero 2–3 min. Fonte: Jamieson 2009 Ultimate MMA Conditioning.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  LACTATE_TOLERANCE: [
    {
      template_id:        'LACTATE_TOL_A',
      block_id:           'LACTATE_TOLERANCE',
      name:               'Lactate Tolerance Session A',
      name_it:            'Tolleranza Lattacida A — Ripetute 400–800m',
      session_type:       'endurance',
      target_duration_min: [45, 60],
      target_tss:         [80, 110],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'LACTATE_TOLERANCE_RUN',
          order:              1,
          role:               'primary',
          sets:               [4, 6],
          reps:               [1, 1],
          distance_m:         [400, 800],
          intensity:          null,
          rpe_target:         [8, 9],
          rest_sec:           [120, 180],
          progression_method: 'double_progression',
          week1_load_note:    '4×400m al ritmo 5K–10sec/km. Recupero 2 min tra le ripetute.',
          progression_rule:   '+1 rep/settimana fino a 6×400m. Poi passare a 4×600m.',
          coaching_note:      'La tolleranza lattacida è dolore gestito. Non abbandonare la tecnica di corsa anche con il bruciore muscolare.',
        },
        {
          exercise_id:        'ZONE2_RUNNING',
          order:              2,
          role:               'cooldown',
          sets:               [1, 1],
          duration_sec:       [600, 900],
          intensity:          'Z1',
          rpe_target:         [4, 5],
          rest_sec:           [0, 0],
          progression_method: 'fixed',
          week1_load_note:    '10–15 min jogging Z1 per smaltire il lattato.',
          progression_rule:   'Fisso.',
          coaching_note:      'Non stoppare dopo LT training: il jogging accelera il clearance del lattato del 30% vs riposo.',
        },
      ],
      warmup_protocol:    '10–15 min jogging Z1–Z2 + 4 strides 80m al 85% + allungamento dinamico',
      cooldown_protocol:  '10 min jogging leggero + stretching completo gambe',
      notes:              'Solo dopo 4+ sett di base aerobica. Monitorare HRV: se rosso post-LT training per 2+ gg, ridurre volume. Fonte: Billat 2001 Sports Med.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  AEROBIC_POWER: [
    {
      template_id:        'AEROBIC_POWER_A',
      block_id:           'AEROBIC_POWER',
      name:               'Aerobic Power Session A',
      name_it:            'Potenza Aerobica A — 30/30 e 15/15',
      session_type:       'endurance',
      target_duration_min: [40, 55],
      target_tss:         [75, 100],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'VO2MAX_RUNNING',
          order:              1,
          role:               'primary',
          sets:               [2, 3],
          reps:               [8, 12],
          duration_sec:       [30, 30],
          intensity:          'Z5',
          rpe_target:         [9, 10],
          rest_sec:           [30, 30],
          progression_method: 'double_progression',
          week1_load_note:    '2 blocchi da 8×30s/30s. Velocita 110–120% vVO2max. Recupero = jogging 30s.',
          progression_rule:   '+1 rep/blocco fino a 12. Poi aggiungere un 3° blocco.',
          coaching_note:      '30/30 Billat: 30s massimale + 30s jogging. Il tempo alla massima intensita accumula oltre il VO2max.',
        },
        {
          exercise_id:        'ZONE2_RUNNING',
          order:              2,
          role:               'cooldown',
          sets:               [1, 1],
          duration_sec:       [600, 900],
          intensity:          'Z1',
          rpe_target:         [4, 5],
          rest_sec:           [0, 0],
          progression_method: 'fixed',
          week1_load_note:    '10–15 min Z1 di recupero.',
          progression_rule:   'Fisso.',
          coaching_note:      'Il cooldown aerobico dopo sessioni ad alto VO2 accelera il ripristino delle riserve di PCr.',
        },
      ],
      warmup_protocol:    '10 min jogging Z1–Z2 + 4 strides progressivi 50/70/85/100% + mobilità',
      cooldown_protocol:  '10 min jogging Z1 + stretching',
      notes:              'Metodo Billat 30/30: sviluppa potenza aerobica con stress periferico minore vs 4×4 tradizionale. Fonte: Billat et al. 2000 Med Sci Sports Exerc.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // BATCH B — 9 blocchi aggiunti v1.2–v1.3
  // ─────────────────────────────────────────────────────────────────────────

  TEMPO_RUNNING: [
    {
      template_id:        'TEMPO_RUN_A',
      block_id:           'TEMPO_RUNNING',
      name:               'Tempo Running A — Continuous Tempo',
      name_it:            'Tempo Run A — Tempo Continuo',
      session_type:       'endurance',
      target_duration_min: [40, 55],
      target_tss:         [60, 85],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'THRESHOLD_RUNNING',
          order:              1,
          role:               'primary',
          sets:               [1, 2],
          duration_sec:       [1200, 2400],
          intensity:          'Z4',
          rpe_target:         [7, 8],
          rest_sec:           [180, 300],
          progression_method: 'tss_based',
          week1_load_note:    '1×20 min al ritmo soglia (T-pace). RPE 7: frasi brevi, non conversazione.',
          progression_rule:   '+5 min/settimana fino a 2×20 min con 3 min riposo tra le due.',
          coaching_note:      'T-pace = ritmo che potresti tenere 50–60 min in gara. Non più veloce: diventa I-pace.',
        },
      ],
      warmup_protocol:    '10 min jogging Z1 + 4×100m strides + allungamento dinamico',
      cooldown_protocol:  '5 min jogging Z1 + stretching',
      notes:              'Massimo 10% del volume settimanale totale a T-pace. Fonte: Daniels Running Formula 2014.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  UPPER_BODY_STRENGTH: [
    {
      template_id:        'UPPER_STR_A',
      block_id:           'UPPER_BODY_STRENGTH',
      name:               'Upper Body Strength A',
      name_it:            'Forza Upper A — Spinta + Tirata',
      session_type:       'strength',
      target_duration_min: [50, 65],
      target_tss:         [55, 75],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'BENCH_PRESS_BARBELL',
          order:              1,
          role:               'primary',
          sets:               [4, 5],
          reps:               [4, 6],
          intensity:          'pct_1rm',
          rpe_target:         [7, 8],
          rest_sec:           [180, 240],
          tempo:              '2-1-1-0',
          progression_method: 'linear',
          week1_load_note:    '4×5 all\'80–82% 1RM. Pausa 1 sec sul petto per ridurre bounce.',
          progression_rule:   '+2.5kg/settimana. Reset se fallimento tecnico per 2 sett.',
          coaching_note:      'Scarica i piedi a terra, arco lombare fisiologico, presa a 1.5× larghezza spalle.',
        },
        {
          exercise_id:        'PULLUP_WEIGHTED',
          order:              2,
          role:               'primary',
          sets:               [4, 5],
          reps:               [4, 6],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [180, 240],
          progression_method: 'linear',
          week1_load_note:    '4×5 con peso aggiunto (cintura). Se non si riesce: bodyweight 4×6.',
          progression_rule:   '+2.5kg/settimana. Se bodyweight: +1 rep fino a 4×8, poi aggiungere peso.',
          coaching_note:      'Full ROM: partenza con braccia tese, tirare fino al mento sopra la barra.',
        },
        {
          exercise_id:        'OVERHEAD_PRESS_BARBELL',
          order:              3,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [6, 8],
          intensity:          'pct_1rm',
          rpe_target:         [7, 8],
          rest_sec:           [150, 180],
          progression_method: 'linear',
          week1_load_note:    '3×6 al 70–75% 1RM. Standing press: core attivo, glutei stretti.',
          progression_rule:   '+2.5kg/sett. Alternare con Seated se l\'overhead standing è limitante.',
          coaching_note:      'Pressione verticale: la barra viaggia in linea con la base di appoggio. Non inclinare indietro.',
        },
        {
          exercise_id:        'BARBELL_ROW',
          order:              4,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [6, 8],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [120, 150],
          progression_method: 'linear',
          week1_load_note:    '3×6. Busto a 45°, barra vicina ai piedi, tirare verso il basso addome.',
          progression_rule:   '+2.5–5kg/sett.',
          coaching_note:      'Squeeze della scapola al picco della trazione. Non usare il momento per portare su la barra.',
        },
      ],
      warmup_protocol:    '5 min bike + band pull-apart 3×15 + face-pull 2×15 + 2 serie leggere bench/pullup',
      cooldown_protocol:  'Stretching pettorali + dorsali + spalle',
      notes:              'Sessione upper body forza: pattern push+pull sempre bilanciati. Fonte: NSCA Strength Training 3rd ed.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  LOWER_BODY_HYPERTROPHY: [
    {
      template_id:        'LOWER_HYP_A',
      block_id:           'LOWER_BODY_HYPERTROPHY',
      name:               'Lower Body Hypertrophy A',
      name_it:            'Ipertrofia Lower A — Quad + Glutei + Ischio',
      session_type:       'strength',
      target_duration_min: [55, 70],
      target_tss:         [65, 85],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'SQUAT_BACK_BARBELL',
          order:              1,
          role:               'primary',
          sets:               [4, 4],
          reps:               [8, 12],
          intensity:          'pct_1rm',
          rpe_target:         [7, 8],
          rest_sec:           [180, 240],
          progression_method: 'double_progression',
          week1_load_note:    '4×10 al 67–72% 1RM. RIR 2–3.',
          progression_rule:   '+2.5kg quando 4×12 pulito (RIR ≥1).',
          coaching_note:      'Ipertrofia quad: profondità = sotto parallela. Il ROM completo massimizza il TUT.',
        },
        {
          exercise_id:        'HIP_THRUST_BARBELL',
          order:              2,
          role:               'primary',
          sets:               [3, 4],
          reps:               [10, 15],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [120, 150],
          progression_method: 'double_progression',
          week1_load_note:    '3×12. Focus: contrazione gluteo al picco (2 sec), non iperestensione lombare.',
          progression_rule:   '+5kg quando 4×15 pulito.',
          coaching_note:      'Il hip thrust genera l\'attivazione gluteo massima documentata in letteratura (Contreras 2015).',
        },
        {
          exercise_id:        'SPLIT_SQUAT_BULGARIAN',
          order:              3,
          role:               'secondary',
          sets:               [3, 3],
          reps:               [10, 12],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          progression_method: 'double_progression',
          week1_load_note:    '3×10 per lato con manubri. ROM completo: coscia posteriore quasi a terra.',
          progression_rule:   '+2.5kg/mano quando 3×12 pulito.',
          coaching_note:      'Unilaterale corregge asimmetrie. Se un lato è più debole, inizia sempre da quel lato.',
        },
        {
          exercise_id:        'NORDIC_CURL',
          order:              4,
          role:               'secondary',
          sets:               [2, 3],
          reps:               [6, 8],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          tempo:              '4-0-1-0',
          progression_method: 'double_progression',
          week1_load_note:    '2×6 eccentrico. Sempre incluso: ischio-crurali richiedono forza eccentrica in ipertrofia lower.',
          progression_rule:   '+1 rep/sett fino a 3×8.',
          coaching_note:      'Anche nella giornata lower ipertrofia: il Nordic protegge l\'ischio da strappi in fase di accumulo di volume.',
        },
      ],
      warmup_protocol:    '5 min bike + squat a corpo libero 2×10 + hip circle + 2 serie leggere squat',
      cooldown_protocol:  'Stretching quad + ischio + gluteo + hip flexor',
      notes:              'Lower body ipertrofia: volume primario quad + glute + ischio in ogni sessione. Fonte: Schoenfeld 2020 textbook.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  REACTIVE_PLYOMETRIC: [
    {
      template_id:        'REACTIVE_PLYO_A',
      block_id:           'REACTIVE_PLYOMETRIC',
      name:               'Reactive Plyometric Session A',
      name_it:            'Pliometrica Reattiva A — Drop Jump + RSI',
      session_type:       'power',
      target_duration_min: [30, 45],
      target_tss:         [40, 60],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'DEPTH_DROP_REACTIVE',
          order:              1,
          role:               'primary',
          sets:               [3, 4],
          reps:               [4, 6],
          intensity:          null,
          rpe_target:         [8, 9],
          rest_sec:           [120, 180],
          progression_method: 'double_progression',
          week1_load_note:    '3×4 dal box 30cm. Contatto a terra MINIMO. Misura l\'altezza del rimbalzo per calcolare RSI.',
          progression_rule:   '+1 rep/sett fino a 4×6. Poi alzare box a 40cm.',
          coaching_note:      'RSI = altezza salto / tempo contatto. Target > 1.5 per atleti avanzati. Cronometra ogni rep.',
        },
        {
          exercise_id:        'DROP_JUMP_REACTIVE',
          order:              2,
          role:               'primary',
          sets:               [3, 4],
          reps:               [3, 5],
          intensity:          null,
          rpe_target:         [9, 10],
          rest_sec:           [150, 180],
          progression_method: 'double_progression',
          week1_load_note:    '3×3 dal box 40cm. Contatto <200ms: rimbalzo immediato senza ammortizzazione.',
          progression_rule:   '+1 rep/sett fino a 4×5.',
          coaching_note:      'Il DROP JUMP è più difficile del depth drop: la caduta è più veloce. Solo atleti con buona fondazione pliometrica.',
        },
        {
          exercise_id:        'BOX_JUMP',
          order:              3,
          role:               'secondary',
          sets:               [2, 3],
          reps:               [3, 5],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [90, 120],
          progression_method: 'fixed',
          week1_load_note:    '2×3 su box 50–60cm per mantenere la potenza verticale durante la sessione reattiva.',
          progression_rule:   'Fisso. Questo è supplementare alla sessione reattiva.',
          coaching_note:      'Non fare box jump dopo drop jump se sei stanco. Invertire l\'ordine se necessario.',
        },
      ],
      warmup_protocol:    '10 min jogging + salti sul posto 2×20 + 3 box jump leggeri + mobilità caviglia',
      cooldown_protocol:  '5 min jogging leggero + stretching calf + quad + foam rolling',
      notes:              'Solo atleti con base pliometrica (PLYOMETRIC_FOUNDATION 4+ sett). Monitor: contatto a terra < 200ms. Fonte: Flanagan 2008 S&C.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  STRENGTH_ENDURANCE_CIRCUIT: [
    {
      template_id:        'STR_END_CIRCUIT_A',
      block_id:           'STRENGTH_ENDURANCE_CIRCUIT',
      name:               'Strength Endurance Circuit A',
      name_it:            'Circuito Forza-Resistenza A',
      session_type:       'mixed',
      target_duration_min: [40, 55],
      target_tss:         [65, 90],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'GOBLET_SQUAT',
          order:              1,
          role:               'primary',
          sets:               [3, 4],
          reps:               [12, 15],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [30, 45],
          progression_method: 'fixed',
          week1_load_note:    '15 rep kettlebell 16–24kg. Recupero breve: questo è il circuito, non forza pura.',
          progression_rule:   'Aumentare KB peso quando 4×15 con RPE < 7.',
          coaching_note:      'Circuito: il riposo è ridotto perché lo stimolo è ibrido forza-aerobico.',
        },
        {
          exercise_id:        'BARBELL_ROW',
          order:              2,
          role:               'primary',
          sets:               [3, 4],
          reps:               [12, 15],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [30, 45],
          progression_method: 'fixed',
          week1_load_note:    '15 rep peso moderato. Il riposo breve sfida il sistema metabolico.',
          progression_rule:   '+2.5kg quando 4×15 con RPE < 7.',
          coaching_note:      'Con recupero breve, ridurre il carico del 15–20% rispetto alla sessione forza pura.',
        },
        {
          exercise_id:        'ZONE2_RUNNING',
          order:              3,
          role:               'secondary',
          sets:               [3, 4],
          duration_sec:       [60, 90],
          intensity:          'Z3',
          rpe_target:         [6, 7],
          rest_sec:           [30, 30],
          progression_method: 'fixed',
          week1_load_note:    '60–90s corsa a passo moderato tra le serie del circuito.',
          progression_rule:   'Aumentare a 90s dopo la 2a settimana.',
          coaching_note:      'La corsa DENTRO il circuito eleva il metabolic cost e transferisce al condizionamento sport-specifico.',
        },
        {
          exercise_id:        'HIP_THRUST_BARBELL',
          order:              4,
          role:               'primary',
          sets:               [3, 4],
          reps:               [12, 15],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [30, 45],
          progression_method: 'fixed',
          week1_load_note:    '15 rep. Carico che permette il volume con recupero breve.',
          progression_rule:   '+5kg quando 4×15 con RPE < 7.',
          coaching_note:      'Glutei in un circuito: fondamentale per il transfer sport. Non eliminare mai.',
        },
      ],
      warmup_protocol:    '5 min jogging + mobilità anca + squat dinamico + 1 giro del circuito al 50% intensita',
      cooldown_protocol:  '5 min jogging Z1 + stretching completo',
      notes:              'Il circuito deve essere completato in sequenza senza pause tra gli esercizi (o pause minime). Fonte: Bompa 2019 periodization textbook.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  COMPETITION_PREPARATION: [
    {
      template_id:        'COMP_PREP_A',
      block_id:           'COMPETITION_PREPARATION',
      name:               'Competition Preparation A — Taper Activation',
      name_it:            'Preparazione Gara A — Attivazione Taper',
      session_type:       'mixed',
      target_duration_min: [30, 40],
      target_tss:         [30, 50],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'SPRINT_ACCELERATION_10M',
          order:              1,
          role:               'primary',
          sets:               [3, 4],
          reps:               [2, 3],
          distance_m:         [10, 10],
          intensity:          null,
          rpe_target:         [8, 9],
          rest_sec:           [180, 240],
          progression_method: 'fixed',
          week1_load_note:    '3×2 sprint 10m al 90–95%. Non al massimale: attivazione, non fatica.',
          progression_rule:   'Nessuna — sessione fissa di taper.',
          coaching_note:      'TAPER: il volume cala del 40–60%, l\'intensita RIMANE. Non fare sessioni completamente easy prima di gara.',
        },
        {
          exercise_id:        'BOX_JUMP',
          order:              2,
          role:               'secondary',
          sets:               [2, 3],
          reps:               [3, 5],
          intensity:          null,
          rpe_target:         [7, 8],
          rest_sec:           [120, 150],
          progression_method: 'fixed',
          week1_load_note:    '2×3 box jump su altezza media. Attivazione CNS pre-gara.',
          progression_rule:   'Nessuna.',
          coaching_note:      'Il box jump in taper mantiene l\'attivazione neuromuscolare senza creare DOMS.',
        },
        {
          exercise_id:        'SQUAT_BACK_BARBELL',
          order:              3,
          role:               'secondary',
          sets:               [2, 3],
          reps:               [3, 5],
          intensity:          'pct_1rm',
          rpe_target:         [7, 8],
          rest_sec:           [180, 240],
          tempo:              '2-0-1-0',
          progression_method: 'fixed',
          week1_load_note:    '2×5 al 85–90% 1RM. Volume ridotto: solo attivazione neurale.',
          progression_rule:   'Nessuna.',
          coaching_note:      'Alta intensita, basso volume: il pattern di Mujika. Il CNS si attiva senza accumulo di fatica periferica.',
        },
      ],
      warmup_protocol:    '10 min riscaldamento completo: jogging progressivo + mobilità completa + 2 sprint leggeri',
      cooldown_protocol:  '10 min jogging leggero + stretching leggero — nessun foam rolling aggressivo',
      notes:              'Sessione di attivazione pre-gara (48–72h prima). Volume −50%, intensita mantenuta. Fonte: Mujika & Padilla 2003 Med Sci Sports Exerc.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  CONCURRENT_STRENGTH_ENDURANCE: [
    {
      template_id:        'CONCURRENT_A',
      block_id:           'CONCURRENT_STRENGTH_ENDURANCE',
      name:               'Concurrent Training Session A',
      name_it:            'Allenamento Concorrente A — Forza + Aerobico',
      session_type:       'mixed',
      target_duration_min: [60, 75],
      target_tss:         [80, 110],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'SQUAT_BACK_BARBELL',
          order:              1,
          role:               'primary',
          sets:               [3, 4],
          reps:               [4, 6],
          intensity:          'pct_1rm',
          rpe_target:         [7, 8],
          rest_sec:           [180, 240],
          progression_method: 'linear',
          week1_load_note:    '3×5 all\'80% 1RM. La forza PRIMA dell\'endurance per minimizzare l\'interferenza AMPK-mTOR.',
          progression_rule:   '+2.5kg/sett.',
          coaching_note:      'ORDINE CRITICO: forza prima di endurance. Invertire l\'ordine aumenta l\'interferenza anabolica del 40%.',
        },
        {
          exercise_id:        'BENCH_PRESS_BARBELL',
          order:              2,
          role:               'secondary',
          sets:               [3, 3],
          reps:               [5, 6],
          intensity:          'pct_1rm',
          rpe_target:         [7, 8],
          rest_sec:           [150, 180],
          progression_method: 'linear',
          week1_load_note:    '3×5 all\'78–82% 1RM.',
          progression_rule:   '+2.5kg/sett.',
          coaching_note:      'Upper body forza dopo squat: freschi per il petto, recupero lower.',
        },
        {
          exercise_id:        'ZONE2_RUNNING',
          order:              3,
          role:               'secondary',
          sets:               [1, 1],
          duration_sec:       [1200, 1800],
          intensity:          'Z2',
          rpe_target:         [5, 6],
          rest_sec:           [0, 0],
          progression_method: 'tss_based',
          week1_load_note:    '20–30 min Zona 2 dopo la parte di forza. Non Zona 3+: l\'interferenza sale.',
          progression_rule:   '+5 min/sett fino a 30 min.',
          coaching_note:      'Concurrent training: l\'endurance va tenuta in Zona 2 per minimizzare il segnale AMPK che inibisce mTOR/ipertrofia.',
        },
      ],
      warmup_protocol:    '5 min bike Z1 + mobilità anca/spalla + 2 serie leggere squat',
      cooldown_protocol:  '5 min jogging Z1 + stretching',
      notes:              'Ordine obbligatorio: forza PRIMA di endurance. Zona 2 massima per endurance in concurrent. Fonte: Hickson 1980 + Wilson 2012 meta-analysis.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  RTP_FIELD_REBUILD: [
    {
      template_id:        'RTP_FIELD_A',
      block_id:           'RTP_FIELD_REBUILD',
      name:               'Return to Play Field Rebuild A',
      name_it:            'Ritorno al Campo A — Progressione Graduale',
      session_type:       'prehab',
      target_duration_min: [30, 45],
      target_tss:         [20, 40],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'JOGGING_FIELD_EASY',
          order:              1,
          role:               'primary',
          sets:               [1, 1],
          duration_sec:       [600, 900],
          intensity:          'Z1',
          rpe_target:         [4, 5],
          rest_sec:           [0, 0],
          progression_method: 'fixed',
          week1_load_note:    '10 min jogging facile senza dolore. Se dolore > 2 VAS: stop.',
          progression_rule:   '+5 min/sett fino a 20 min. Poi passare a ZONE2_FOUNDATION.',
          coaching_note:      'RTP Gate 1: corsa facile senza dolore. Non aumentare il ritmo finche il dolore non è 0.',
        },
        {
          exercise_id:        'LATERAL_BAND_WALK',
          order:              2,
          role:               'secondary',
          sets:               [2, 3],
          reps:               [12, 15],
          intensity:          null,
          rpe_target:         [4, 5],
          rest_sec:           [60, 90],
          progression_method: 'fixed',
          week1_load_note:    '2×12 per lato con elastico leggero. Attivazione glute-adductor.',
          progression_rule:   '+1 rep/sett. Passare a elastico più resistente dopo 3 sett.',
          coaching_note:      'L\'attivazione del gluteo durante RTP previene compensazioni che causano re-infortuno.',
        },
        {
          exercise_id:        'GLUTE_BRIDGE_SINGLE_LEG',
          order:              3,
          role:               'secondary',
          sets:               [2, 3],
          reps:               [8, 10],
          intensity:          null,
          rpe_target:         [4, 6],
          rest_sec:           [60, 90],
          progression_method: 'double_progression',
          week1_load_note:    '2×8 per lato. Solo se dolore < 2 VAS.',
          progression_rule:   '+1 rep/sett fino a 3×10.',
          coaching_note:      'Progressione RTP: non saltare fasi. Ogni settimana = gate check. Dolore > 3 VAS = torna alla fase precedente.',
        },
      ],
      warmup_protocol:    '5 min camminata + stretching leggero + rotazione anca (non aggressiva)',
      cooldown_protocol:  '5 min camminata + ghiaccio se indicato + stretching leggero',
      notes:              'PROTOCOLLO RTP: dolore VAS > 3 in qualsiasi momento = stop e ritorno alla fase precedente. Fonte: Gabbett 2016 BJSM.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],

  COD_REACTIVE_ADVANCED: [
    {
      template_id:        'COD_REACT_ADV_A',
      block_id:           'COD_REACTIVE_ADVANCED',
      name:               'Reactive COD Advanced A',
      name_it:            'COD Reattivo Avanzato A — T-Drill + Segnale',
      session_type:       'power',
      target_duration_min: [35, 50],
      target_tss:         [50, 70],
      day_in_week:        'A',
      slots: [
        {
          exercise_id:        'LATERAL_SHUFFLE',
          order:              1,
          role:               'warmup',
          sets:               [3, 3],
          duration_sec:       [8, 10],
          intensity:          null,
          rpe_target:         [5, 6],
          rest_sec:           [30, 45],
          progression_method: 'fixed',
          week1_load_note:    'Warmup COD: 3×10 sec scivolamento laterale.',
          progression_rule:   'Fisso.',
          coaching_note:      'Posizione atletica bassa: questo e il punto di partenza per ogni COD avanzato.',
        },
        {
          exercise_id:        'COD_90_REACTIVE',
          order:              2,
          role:               'primary',
          sets:               [4, 5],
          reps:               [4, 6],
          intensity:          null,
          rpe_target:         [8, 9],
          rest_sec:           [60, 90],
          progression_method: 'fixed',
          week1_load_note:    '4×4 T-drill su segnale visivo/uditivo. Cronometra ogni esecuzione.',
          progression_rule:   '+1 rep/sett fino a 5×6. Poi ridurre il tempo di segnale (stimolo più rapido).',
          coaching_note:      'Il T-drill valida la COD completa: sprint + laterale + back. Registra i tempi ogni settimana.',
        },
        {
          exercise_id:        'COD_45_CONE_DRILL',
          order:              3,
          role:               'secondary',
          sets:               [3, 4],
          reps:               [3, 4],
          intensity:          null,
          rpe_target:         [8, 9],
          rest_sec:           [60, 90],
          progression_method: 'fixed',
          week1_load_note:    '3×3 COD 45° ad alta velocita come complemento reattivo.',
          progression_rule:   '+1 rep/sett.',
          coaching_note:      'COD a 45° dopo T-drill: mantenere la qualita meccanica anche in fatica.',
        },
      ],
      warmup_protocol:    '10 min jogging + lateral shuffle + 3 sprint progressivi 50/70/85% + mobilità anca completa',
      cooldown_protocol:  '5 min jogging + stretching adductor + gluteo + hip flexor',
      notes:              'Solo atleti con COD_MECHANICS solido (4+ sett). Segnale reattivo rende il drill sport-specifico. Fonte: Hewit 2011 JSCR.',
      calibration_version: CALIBRATION_VERSION,
    },
  ],
}

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────

/** Restituisce tutti i template di sessione per un dato block_id */
export function getWorkoutTemplatesForBlock(blockId: string): WorkoutTemplate[] {
  return WORKOUT_TEMPLATE_CATALOG[blockId] ?? []
}

/** Restituisce la definizione di un esercizio dal catalog */
export function getExercise(exerciseId: string): ExerciseDefinition | undefined {
  return EXERCISE_CATALOG[exerciseId]
}

/** Restituisce tutti gli esercizi per un dato pattern motorio */
export function getExercisesByPattern(pattern: MovementPattern): ExerciseDefinition[] {
  return Object.values(EXERCISE_CATALOG).filter(e => e.movement_pattern === pattern)
}

/** Restituisce tutti gli esercizi per un dato gruppo muscolare (primario) */
export function getExercisesByMuscle(muscle: MuscleGroup): ExerciseDefinition[] {
  return Object.values(EXERCISE_CATALOG).filter(e => e.primary_muscles.includes(muscle))
}

/** Restituisce tutti gli esercizi fattibili con l'attrezzatura disponibile */
export function getExercisesByEquipment(available: EquipmentRequired[]): ExerciseDefinition[] {
  return Object.values(EXERCISE_CATALOG).filter(e =>
    e.equipment.some(eq => available.includes(eq)) || e.equipment.includes('none')
  )
}

/**
 * Risolve l'ExerciseSlot in un oggetto completo con la definizione dell'esercizio.
 * Utile per il rendering lato UI.
 */
export function hydrateSlot(slot: ExerciseSlot): (ExerciseSlot & { definition: ExerciseDefinition }) | null {
  const definition = getExercise(slot.exercise_id)
  if (!definition) return null
  return { ...slot, definition }
}

/**
 * Genera una stringa di prescrizione leggibile per un ExerciseSlot.
 * Es. "Squat — 4×8-12 @ RPE 7-9 | Recupero 2-3 min"
 */
export function slotToString(slot: ExerciseSlot): string {
  const def = getExercise(slot.exercise_id)
  const name = def?.name_it ?? slot.exercise_id
  const setsStr = `${slot.sets[0]}–${slot.sets[1]}`
  const volumeStr = slot.reps
    ? `${slot.reps[0]}–${slot.reps[1]} reps`
    : slot.duration_sec
      ? `${slot.duration_sec[0]}–${slot.duration_sec[1]}s`
      : slot.distance_m
        ? `${slot.distance_m[0]}–${slot.distance_m[1]}m`
        : ''
  const rpeStr = slot.rpe_target ? ` @ RPE ${slot.rpe_target[0]}–${slot.rpe_target[1]}` : ''
  const restStr = `Recupero ${slot.rest_sec[0] / 60}–${slot.rest_sec[1] / 60} min`
  return `${name} — ${setsStr}×${volumeStr}${rpeStr} | ${restStr}`
}

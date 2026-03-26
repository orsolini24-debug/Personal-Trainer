'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SportType } from '@prisma/client'
import {
  User, ChevronRight, ChevronLeft, Loader2, CheckCircle2,
  Dumbbell, Sparkles, Calendar, Clock, Target, AlertTriangle,
  Trophy, Zap, Activity, BarChart2, Upload, FileText, X
} from 'lucide-react'
import {
  completeWithExistingPlan,
  completeWithGeneratedPlan,
  type BasicProfileData,
  type ExistingPlanData,
  type GeneratePlanData,
} from '@/app/actions/plan-setup'

// ─────────────────────────────────────────────────────────────────────────────
// Local helper (cannot import from 'use server' file as it's synchronous)
// ─────────────────────────────────────────────────────────────────────────────
function buildSyntheticChatHistory(
  profile: BasicProfileData,
  genData: GeneratePlanData
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const sportsList = profile.sports.join(', ') || 'non specificato'
  const sexLabel = profile.biologicalSex === 'FEMALE' ? 'donna' : 'uomo'

  const userSummary = `
Sono un ${sexLabel} di ${profile.ageYears} anni, alto ${profile.heightCm} cm.
Mi alleno ${profile.gymSessionsPerWeek} volte a settimana, prevalentemente ${sportsList}.
La mia esperienza è di livello ${profile.experienceScore}/10.
Obiettivo principale: ${genData.primaryGoal}.
Posso dedicare ${genData.sessionDurationMin} minuti per sessione.
Ho ${genData.timelineWeeks} settimane di tempo.
${genData.upcomingEvent ? `Ho in programma: ${genData.upcomingEvent}.` : ''}
${genData.injuries ? `Limitazioni / infortuni: ${genData.injuries}.` : 'Nessun infortuno rilevante.'}
  `.trim()

  return [
    { role: 'assistant', content: 'Ottimo, raccontami i tuoi obiettivi e la tua situazione attuale.' },
    { role: 'user',      content: userSummary },
    { role: 'assistant', content: 'Perfetto, ho un quadro completo. Procedo con la generazione del piano. ###READY###' },
  ]
}
import { generatePlanFromWizard } from '@/app/actions/plan-wizard'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'PROFILE' | 'DECISION' | 'EXISTING_PLAN' | 'GENERATE_PLAN' | 'GENERATING' | 'DONE'

const SPORT_OPTIONS: { label: string; value: SportType; emoji: string }[] = [
  { label: 'Palestra',      value: 'PALESTRA',     emoji: '🏋️' },
  { label: 'Calcio',        value: 'SOCCER',        emoji: '⚽' },
  { label: 'Padel',         value: 'PADEL',         emoji: '🎾' },
  { label: 'Tennis',        value: 'TENNIS',        emoji: '🎾' },
  { label: 'Running',       value: 'RUNNING',       emoji: '🏃' },
  { label: 'Ciclismo',      value: 'CYCLING',       emoji: '🚴' },
  { label: 'Nuoto',         value: 'SWIMMING',      emoji: '🏊' },
  { label: 'CrossFit',      value: 'CROSSFIT',      emoji: '🔥' },
  { label: 'Basketball',    value: 'BASKETBALL',    emoji: '🏀' },
  { label: 'Combat',        value: 'COMBAT',        emoji: '🥊' },
  { label: 'Trail Running', value: 'TRAIL_RUNNING', emoji: '🏔️' },
  { label: 'Triathlon',     value: 'TRIATHLON',     emoji: '🏊‍♂️' },
  { label: 'Sci',           value: 'SKIING',        emoji: '⛷️' },
  { label: 'Calisthenics',  value: 'CALISTHENICS',  emoji: '💪' },
  { label: 'Yoga / Pilates', value: 'YOGA',         emoji: '🧘' },
  { label: 'Altro',         value: 'OTHER',         emoji: '🎯' },
]

const GOAL_OPTIONS = [
  { label: 'Forza',            value: 'Aumentare la forza massimale',        icon: Dumbbell,  color: 'var(--accent)' },
  { label: 'Ipertrofia',       value: 'Aumentare la massa muscolare',        icon: BarChart2, color: '#8b5cf6' },
  { label: 'Dimagrimento',     value: 'Perdere peso e ridurre il grasso',    icon: Target,    color: '#f59e0b' },
  { label: 'Performance',      value: 'Migliorare la performance sportiva',  icon: Trophy,    color: '#10b981' },
  { label: 'Resistenza',       value: 'Migliorare la resistenza aerobica',   icon: Activity,  color: '#3b82f6' },
  { label: 'Salute Generale',  value: 'Mantenersi in forma e in salute',     icon: Zap,       color: '#ec4899' },
]

const TIMELINE_OPTIONS = [
  { label: '4 settimane',  value: 4  },
  { label: '8 settimane',  value: 8  },
  { label: '12 settimane', value: 12 },
  { label: '16 settimane', value: 16 },
  { label: '24 settimane', value: 24 },
]

const DURATION_OPTIONS = [
  { label: '30 min', value: 30  },
  { label: '45 min', value: 45  },
  { label: '1 ora',  value: 60  },
  { label: '1h 30',  value: 90  },
  { label: '2 ore',  value: 120 },
]

const DURATION_LABELS: Record<string, string> = {
  'none':   'Non iniziato',
  'week':   '< 1 settimana',
  'short':  '< 1 mese',
  'medium': '1-3 mesi',
  'long':   '3-6 mesi',
  'xlong':  '6+ mesi',
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepHeader({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-fg-subtle opacity-60">
          Passo {step} di {total}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: i < step ? 24 : 8,
                background: i < step ? 'var(--accent)' : 'var(--border-default)',
                opacity: i < step ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-accent">{label}</p>
    </div>
  )
}

function FormField({
  label, children, hint
}: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-black uppercase tracking-widest text-fg-subtle opacity-70">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-fg-subtle opacity-50 italic">{hint}</p>}
    </div>
  )
}

function TextInput({
  value, onChange, placeholder, type = 'text', min, max
}: {
  value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; min?: number; max?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full h-12 px-4 rounded-2xl text-sm font-bold outline-none transition-all"
      style={{
        background: 'var(--bg-elevated)',
        border: '1.5px solid var(--border-default)',
        color: 'var(--fg-primary)',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
    />
  )
}

function OptionButton({
  selected, onClick, children, color
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode; color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wide transition-all border"
      style={{
        background: selected ? (color ?? 'var(--accent)') : 'var(--bg-elevated)',
        borderColor: selected ? (color ?? 'var(--accent)') : 'var(--border-default)',
        color: selected ? 'white' : 'var(--fg-muted)',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {children}
    </button>
  )
}

function NavButtons({
  onBack, onNext, nextLabel = 'Continua', disabled, loading
}: {
  onBack?: () => void; onNext: () => void; nextLabel?: string;
  disabled?: boolean; loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/40">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wide text-fg-muted hover:text-primary transition-all"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Indietro
        </button>
      ) : <div />}

      <button
        type="button"
        onClick={onNext}
        disabled={disabled || loading}
        className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent)', color: 'white' }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {nextLabel}
        {!loading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface PlanSetupFlowProps {
  userName?: string
}

export default function PlanSetupFlow({ userName }: PlanSetupFlowProps) {
  const router = useRouter()

  // ── Navigation ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('PROFILE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Phase 1: Profile ──────────────────────────────────────────────────────
  const [name, setName] = useState(userName ?? '')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | ''>('')
  const [height, setHeight] = useState('')
  const [experience, setExperience] = useState<number>(0)
  const [gymDays, setGymDays] = useState<number>(0)
  const [sports, setSports] = useState<SportType[]>([])

  // ── Phase 2: Decision ─────────────────────────────────────────────────────
  const [decision, setDecision] = useState<'EXISTING' | 'GENERATE' | null>(null)

  // ── Phase 3a: Existing Plan ───────────────────────────────────────────────
  const [planDescription, setPlanDescription] = useState('')
  const [planFile, setPlanFile] = useState<File | null>(null)
  const [planNotes, setPlanNotes] = useState('')
  const [planDuration, setPlanDuration] = useState('')
  const [planSatisfaction, setPlanSatisfaction] = useState<number>(0)
  const [squat, setSquat] = useState('')
  const [bench, setBench] = useState('')
  const [deadlift, setDeadlift] = useState('')

  // ── Phase 3b: Generate Plan ───────────────────────────────────────────────
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [sessionDuration, setSessionDuration] = useState<number>(0)
  const [timelineWeeks, setTimelineWeeks] = useState<number>(0)
  const [planType, setPlanType] = useState<'FULL' | 'TRAINING_ONLY' | 'NUTRITION_ONLY'>('TRAINING_ONLY')
  const [upcomingEvent, setUpcomingEvent] = useState('')
  const [injuries, setInjuries] = useState('')

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toggleSport = (s: SportType) => {
    setSports(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const getProfileData = (): BasicProfileData => ({
    name,
    ageYears: parseInt(age) || 0,
    biologicalSex: sex as 'MALE' | 'FEMALE',
    heightCm: parseInt(height) || 0,
    experienceScore: experience,
    gymSessionsPerWeek: gymDays,
    sports: sports.length ? sports : ['PALESTRA'],
  })

  // ── Validation ────────────────────────────────────────────────────────────

  const profileValid =
    age.trim() !== '' &&
    parseInt(age) >= 10 && parseInt(age) <= 99 &&
    sex !== '' &&
    height.trim() !== '' &&
    parseInt(height) >= 100 && parseInt(height) <= 250 &&
    experience >= 1 &&
    gymDays >= 1

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleProfileNext = () => {
    if (!profileValid) return
    setStep('DECISION')
  }

  const handleDecisionNext = () => {
    if (!decision) return
    setStep(decision === 'EXISTING' ? 'EXISTING_PLAN' : 'GENERATE_PLAN')
  }

  const handleExistingPlanSubmit = async () => {
    const effectiveDescription = planFile
      ? `[Documento: ${planFile.name}]${planNotes.trim() ? '\n' + planNotes.trim() : ''}`
      : planNotes.trim()
    if (!planFile && !planNotes.trim()) return
    setLoading(true)
    setError(null)

    const profileData = getProfileData()
    const planData: ExistingPlanData = {
      planDescription: effectiveDescription,
      durationLabel: DURATION_LABELS[planDuration] ?? planDuration,
      satisfaction: planSatisfaction,
      squat1RM: squat ? parseFloat(squat) : undefined,
      bench1RM: bench ? parseFloat(bench) : undefined,
      deadlift1RM: deadlift ? parseFloat(deadlift) : undefined,
    }

    const result = await completeWithExistingPlan(profileData, planData)
    if (result && 'success' in result && result.success) {
      setStep('DONE')
      setTimeout(() => router.refresh(), 800)
    } else {
      setError((result && 'error' in result) ? result.error : 'Errore sconosciuto')
    }
    setLoading(false)
  }

  const handleGeneratePlanSubmit = async () => {
    if (!primaryGoal || !sessionDuration || !timelineWeeks) return
    setLoading(true)
    setError(null)
    setStep('GENERATING')

    const profileData = getProfileData()
    const genData: GeneratePlanData = {
      primaryGoal,
      sessionDurationMin: sessionDuration,
      timelineWeeks,
      planType,
      upcomingEvent: upcomingEvent.trim() || undefined,
      injuries: injuries.trim() || undefined,
    }

    // 1. Save profile & mark onboarding complete
    const saveResult = await completeWithGeneratedPlan(profileData, genData)
    if (saveResult && 'error' in saveResult) {
      setError(saveResult.error)
      setStep('GENERATE_PLAN')
      setLoading(false)
      return
    }

    // 2. Trigger AI plan generation with synthetic chat history
    const chatHistory = buildSyntheticChatHistory(profileData, genData)
    const genResult = await generatePlanFromWizard(chatHistory, genData.planType)

    setLoading(false)
    setStep('DONE')
    setTimeout(() => router.refresh(), 600)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  // ── Done / Generating ─────────────────────────────────────────────────────
  if (step === 'GENERATING') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-20 h-20 rounded-full border border-accent/30 flex items-center justify-center"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
          <Sparkles className="w-10 h-10 text-accent animate-pulse" />
        </div>
        <div>
          <p className="text-2xl font-black text-primary mb-2">Generando il tuo piano...</p>
          <p className="text-sm text-fg-muted">
            I nostri coach AI stanno costruendo 3 proposte personalizzate su misura per te.
          </p>
        </div>
        <Loader2 className="w-6 h-6 text-accent animate-spin mt-2" />
      </div>
    )
  }

  if (step === 'DONE') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-20 h-20 rounded-full border border-green-500/30 flex items-center justify-center animate-rise-up"
          style={{ background: 'color-mix(in srgb, #22c55e 12%, transparent)' }}>
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <p className="text-2xl font-black text-primary mb-2">Tutto pronto!</p>
          <p className="text-sm text-fg-muted">Sto caricando il tuo piano...</p>
        </div>
      </div>
    )
  }

  // ── Step: PROFILE ─────────────────────────────────────────────────────────
  if (step === 'PROFILE') {
    return (
      <div className="max-w-xl mx-auto">
        <StepHeader step={1} total={3} label="Le tue informazioni base" />

        <div className="space-y-7">
          {/* Name */}
          <FormField label="Come ti chiami?" hint="Come vuoi essere chiamato nel tuo piano">
            <TextInput value={name} onChange={setName} placeholder="Il tuo nome..." />
          </FormField>

          {/* Age + Sex row */}
          <div className="grid grid-cols-2 gap-5">
            <FormField label="Età">
              <TextInput
                type="number" value={age} onChange={setAge}
                placeholder="es. 28" min={10} max={99}
              />
            </FormField>

            <FormField label="Sesso biologico">
              <div className="flex gap-3">
                {(['MALE', 'FEMALE'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className="flex-1 h-12 rounded-2xl text-sm font-black uppercase tracking-wide transition-all border"
                    style={{
                      background: sex === s ? 'var(--accent)' : 'var(--bg-elevated)',
                      borderColor: sex === s ? 'var(--accent)' : 'var(--border-default)',
                      color: sex === s ? 'white' : 'var(--fg-muted)',
                    }}
                  >
                    {s === 'MALE' ? '♂ Uomo' : '♀ Donna'}
                  </button>
                ))}
              </div>
            </FormField>
          </div>

          {/* Height */}
          <FormField label="Altezza (cm)">
            <TextInput type="number" value={height} onChange={setHeight} placeholder="es. 175" min={100} max={250} />
          </FormField>

          {/* Experience 1-10 */}
          <FormField label={`Livello di esperienza sportiva — ${experience > 0 ? experience + '/10' : 'seleziona'}`}
            hint="1 = mai fatto sport  •  5-6 = buona base  •  10 = agonista élite">
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setExperience(n)}
                  className="w-10 h-10 rounded-xl text-sm font-black transition-all border"
                  style={{
                    background: experience === n ? 'var(--accent)' : experience > 0 && n <= experience ? 'color-mix(in srgb, var(--accent) 20%, var(--bg-elevated))' : 'var(--bg-elevated)',
                    borderColor: experience >= n ? 'var(--accent)' : 'var(--border-default)',
                    color: experience === n ? 'white' : experience > 0 && n <= experience ? 'var(--accent)' : 'var(--fg-muted)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </FormField>

          {/* Gym sessions per week */}
          <FormField label={`Sessioni di allenamento a settimana — ${gymDays > 0 ? gymDays : 'seleziona'}`}>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGymDays(n)}
                  className="flex-1 h-11 rounded-xl text-sm font-black transition-all border"
                  style={{
                    background: gymDays === n ? 'var(--accent)' : 'var(--bg-elevated)',
                    borderColor: gymDays === n ? 'var(--accent)' : 'var(--border-default)',
                    color: gymDays === n ? 'white' : 'var(--fg-muted)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </FormField>

          {/* Sports */}
          <FormField label="Sport che pratichi" hint="Seleziona uno o più sport — puoi scegliere anche più di uno">
            <div className="flex flex-wrap gap-2 pt-1">
              {SPORT_OPTIONS.map(s => (
                <OptionButton
                  key={s.value}
                  selected={sports.includes(s.value)}
                  onClick={() => toggleSport(s.value)}
                >
                  {s.emoji} {s.label}
                </OptionButton>
              ))}
            </div>
          </FormField>
        </div>

        <NavButtons
          onNext={handleProfileNext}
          disabled={!profileValid}
          nextLabel="Continua"
        />
      </div>
    )
  }

  // ── Step: DECISION ────────────────────────────────────────────────────────
  if (step === 'DECISION') {
    return (
      <div className="max-w-xl mx-auto">
        <StepHeader step={2} total={3} label="Il tuo piano" />

        <div className="mb-8">
          <h2 className="text-2xl font-black text-primary tracking-tighter mb-2">
            Hai già un piano da seguire?
          </h2>
          <p className="text-sm text-fg-muted">
            Puoi caricare il piano che stai già seguendo, oppure lasciare che i nostri coach AI ne generino uno su misura per te.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* Option A: existing plan */}
          <button
            type="button"
            onClick={() => setDecision('EXISTING')}
            className="p-7 rounded-[2rem] border text-left transition-all group"
            style={{
              background: decision === 'EXISTING'
                ? 'color-mix(in srgb, var(--accent) 8%, var(--bg-surface))'
                : 'var(--bg-elevated)',
              borderColor: decision === 'EXISTING' ? 'var(--accent)' : 'var(--border-default)',
              borderWidth: decision === 'EXISTING' ? 2 : 1,
            }}
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: decision === 'EXISTING'
                    ? 'color-mix(in srgb, var(--accent) 20%, transparent)'
                    : 'var(--bg-base)',
                  color: decision === 'EXISTING' ? 'var(--accent)' : 'var(--fg-muted)',
                }}>
                <Dumbbell className="w-7 h-7" />
              </div>
              <div>
                <p className="font-black text-lg text-primary tracking-tight mb-1">
                  Ho già un piano
                </p>
                <p className="text-sm text-fg-muted leading-relaxed">
                  Inserisci il piano che stai seguendo. Potrai descrivere gli esercizi, i carichi di lavoro e ricevere feedback dal coach AI.
                </p>
              </div>
              {decision === 'EXISTING' && (
                <CheckCircle2 className="w-6 h-6 text-accent shrink-0 mt-1" />
              )}
            </div>
          </button>

          {/* Option B: generate */}
          <button
            type="button"
            onClick={() => setDecision('GENERATE')}
            className="p-7 rounded-[2rem] border text-left transition-all group"
            style={{
              background: decision === 'GENERATE'
                ? 'color-mix(in srgb, var(--accent) 8%, var(--bg-surface))'
                : 'var(--bg-elevated)',
              borderColor: decision === 'GENERATE' ? 'var(--accent)' : 'var(--border-default)',
              borderWidth: decision === 'GENERATE' ? 2 : 1,
            }}
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: decision === 'GENERATE'
                    ? 'color-mix(in srgb, var(--accent) 20%, transparent)'
                    : 'var(--bg-base)',
                  color: decision === 'GENERATE' ? 'var(--accent)' : 'var(--fg-muted)',
                }}>
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <p className="font-black text-lg text-primary tracking-tight mb-1">
                  Genera il mio piano
                </p>
                <p className="text-sm text-fg-muted leading-relaxed">
                  I nostri coach AI creeranno 3 proposte di piano personalizzate basate sui tuoi obiettivi, tempo disponibile ed esperienza.
                </p>
              </div>
              {decision === 'GENERATE' && (
                <CheckCircle2 className="w-6 h-6 text-accent shrink-0 mt-1" />
              )}
            </div>
          </button>
        </div>

        <NavButtons
          onBack={() => setStep('PROFILE')}
          onNext={handleDecisionNext}
          disabled={!decision}
        />
      </div>
    )
  }

  // ── Step: EXISTING PLAN ───────────────────────────────────────────────────
  if (step === 'EXISTING_PLAN') {
    const existingValid = planFile !== null || planNotes.trim().length > 2
    const showSatisfaction = planDuration !== '' && planDuration !== 'none' && planDuration !== 'week'

    return (
      <div className="max-w-xl mx-auto">
        <StepHeader step={3} total={3} label="Il tuo piano attuale" />

        <div className="space-y-7">
          {/* File upload */}
          <FormField
            label="Carica il tuo piano"
            hint="PDF, Word, immagine o qualsiasi documento con il tuo programma"
          >
            <div>
              <input
                id="plan-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0] ?? null
                  setPlanFile(f)
                }}
              />
              {!planFile ? (
                <label
                  htmlFor="plan-file-input"
                  className="flex flex-col items-center justify-center gap-3 w-full py-8 rounded-2xl cursor-pointer transition-all border-2 border-dashed"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-default)',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)')}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-primary">Carica documento</p>
                    <p className="text-[11px] text-fg-subtle opacity-60 mt-0.5">PDF, Word, immagine...</p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-2xl border"
                  style={{ background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-elevated))', borderColor: 'var(--accent)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)' }}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-primary truncate">{planFile.name}</p>
                    <p className="text-[11px] text-fg-subtle opacity-60">
                      {(planFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlanFile(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </FormField>

          {/* Optional notes */}
          <FormField
            label="Note aggiuntive (opzionale)"
            hint="Aggiungi dettagli sul piano, obiettivi o contesto"
          >
            <textarea
              value={planNotes}
              onChange={e => setPlanNotes(e.target.value)}
              placeholder="Es: Push/Pull/Legs 4x a settimana, focus sulla forza massimale..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all resize-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1.5px solid var(--border-default)',
                color: 'var(--fg-primary)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </FormField>

          {/* How long following */}
          <FormField label="Da quanto tempo segui questo piano?">
            <div className="flex flex-wrap gap-2">
              {Object.entries(DURATION_LABELS).map(([k, v]) => (
                <OptionButton key={k} selected={planDuration === k} onClick={() => setPlanDuration(k)}>
                  {v}
                </OptionButton>
              ))}
            </div>
          </FormField>

          {/* Satisfaction — hidden when plan not yet started */}
          {showSatisfaction && (
            <FormField
              label={`Come sta andando? ${planSatisfaction > 0 ? '★'.repeat(planSatisfaction) : ''}`}
              hint="1 = per niente soddisfatto  •  5 = ottimamente"
            >
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPlanSatisfaction(n)}
                    className="flex-1 h-12 rounded-2xl font-black transition-all border"
                    style={{
                      fontSize: n <= 2 ? '0.8rem' : n === 3 ? '0.75rem' : '0.65rem',
                      background: planSatisfaction >= n ? '#f59e0b' : 'var(--bg-elevated)',
                      borderColor: planSatisfaction >= n ? '#f59e0b' : 'var(--border-default)',
                      color: planSatisfaction >= n ? 'white' : 'var(--fg-muted)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {'★'.repeat(n)}
                  </button>
                ))}
              </div>
            </FormField>
          )}

          {/* Carichi di riferimento (opzionale) */}
          <div className="p-6 rounded-[1.5rem] border border-dashed border-border/50"
            style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs font-black uppercase tracking-widest text-fg-subtle opacity-60 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Carichi di riferimento <span className="normal-case font-medium opacity-50 tracking-normal">(opzionale)</span>
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Squat 1RM', value: squat, onChange: setSquat },
                { label: 'Panca 1RM', value: bench, onChange: setBench },
                { label: 'Deadlift 1RM', value: deadlift, onChange: setDeadlift },
              ].map(f => (
                <FormField key={f.label} label={f.label}>
                  <input
                    type="number"
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
                    placeholder="kg"
                    className="w-full h-11 px-3 rounded-xl text-sm font-bold outline-none transition-all text-center"
                    style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--fg-primary)',
                    }}
                  />
                </FormField>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl text-sm"
              style={{ background: 'color-mix(in srgb, #ef4444 12%, transparent)', color: '#ef4444', border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <NavButtons
          onBack={() => setStep('DECISION')}
          onNext={handleExistingPlanSubmit}
          nextLabel="Salva e continua"
          disabled={!existingValid}
          loading={loading}
        />
      </div>
    )
  }

  // ── Step: GENERATE PLAN ───────────────────────────────────────────────────
  if (step === 'GENERATE_PLAN') {
    const generateValid = primaryGoal !== '' && sessionDuration > 0 && timelineWeeks > 0

    return (
      <div className="max-w-xl mx-auto">
        <StepHeader step={3} total={3} label="Obiettivi e preferenze" />

        <div className="space-y-7">
          {/* Primary goal */}
          <FormField label="Obiettivo principale">
            <div className="grid grid-cols-2 gap-3 pt-1">
              {GOAL_OPTIONS.map(g => {
                const Icon = g.icon
                const selected = primaryGoal === g.value
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setPrimaryGoal(g.value)}
                    className="p-4 rounded-2xl border text-left transition-all"
                    style={{
                      background: selected
                        ? `color-mix(in srgb, ${g.color} 15%, var(--bg-elevated))`
                        : 'var(--bg-elevated)',
                      borderColor: selected ? g.color : 'var(--border-default)',
                      borderWidth: selected ? 2 : 1,
                    }}
                  >
                    <Icon
                      className="w-5 h-5 mb-2"
                      style={{ color: selected ? g.color : 'var(--fg-muted)' }}
                    />
                    <p className="text-xs font-black text-primary tracking-tight">{g.label}</p>
                  </button>
                )
              })}
            </div>
          </FormField>

          {/* Plan type */}
          <FormField label="Tipo di piano">
            <div className="flex gap-2">
              {([
                { value: 'TRAINING_ONLY', label: '🏋️ Solo Allenamento' },
                { value: 'FULL', label: '⚡ Completo + Nutrizione' },
                { value: 'NUTRITION_ONLY', label: '🥗 Solo Nutrizione' },
              ] as const).map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setPlanType(o.value)}
                  className="flex-1 py-3 px-2 rounded-2xl border text-xs font-black uppercase tracking-wide transition-all"
                  style={{
                    background: planType === o.value ? 'var(--accent)' : 'var(--bg-elevated)',
                    borderColor: planType === o.value ? 'var(--accent)' : 'var(--border-default)',
                    color: planType === o.value ? 'white' : 'var(--fg-muted)',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </FormField>

          {/* Session duration */}
          <FormField
            label={`Durata sessione — ${sessionDuration > 0 ? sessionDuration + ' min' : 'seleziona'}`}
          >
            <div className="flex gap-2 flex-wrap">
              {DURATION_OPTIONS.map(d => (
                <OptionButton
                  key={d.value}
                  selected={sessionDuration === d.value}
                  onClick={() => setSessionDuration(d.value)}
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  {d.label}
                </OptionButton>
              ))}
            </div>
          </FormField>

          {/* Timeline */}
          <FormField
            label={`Durata del piano — ${timelineWeeks > 0 ? timelineWeeks + ' settimane' : 'seleziona'}`}
          >
            <div className="flex gap-2 flex-wrap">
              {TIMELINE_OPTIONS.map(t => (
                <OptionButton
                  key={t.value}
                  selected={timelineWeeks === t.value}
                  onClick={() => setTimelineWeeks(t.value)}
                >
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {t.label}
                </OptionButton>
              ))}
            </div>
          </FormField>

          {/* Events (optional) */}
          <FormField
            label="Gare o eventi in programma"
            hint="Opzionale — es. 'Maratona di Milano il 12 Aprile'"
          >
            <TextInput
              value={upcomingEvent}
              onChange={setUpcomingEvent}
              placeholder="Es. mezza maratona, gara di padel, torneo..."
            />
          </FormField>

          {/* Injuries (optional) */}
          <FormField
            label="Infortuni o limitazioni"
            hint="Opzionale — il piano eviterà di sovraccaricare le zone indicate"
          >
            <TextInput
              value={injuries}
              onChange={setInjuries}
              placeholder="Es. ginocchio dx, spalla sx, mal di schiena..."
            />
          </FormField>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl text-sm"
              style={{ background: 'color-mix(in srgb, #ef4444 12%, transparent)', color: '#ef4444', border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <NavButtons
          onBack={() => setStep('DECISION')}
          onNext={handleGeneratePlanSubmit}
          nextLabel="Genera il Piano"
          disabled={!generateValid}
          loading={loading}
        />
      </div>
    )
  }

  return null
}

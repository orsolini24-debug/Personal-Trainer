import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBiometricHistory } from "@/app/actions/body"
import BodyForm from "./body-form"
import BodyChart from "./body-chart"
import BodyHistory from "./body-history"
import PhotoUpload from "./photo-upload"
import { Camera, Target, Activity } from "lucide-react"

export default async function BodyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const res = await getBiometricHistory(30)
  const history = res.data || []
  
  const today = new Date()
  today.setUTCHours(0,0,0,0)
  const todayLog = history.find(l => new Date(l.date).getTime() === today.getTime())

  // Dummy target calculation
  const targetWeight = 75
  const currentWeight = history.length > 0 ? history[0].weightKg : null
  const weightDiff = currentWeight ? (currentWeight - targetWeight).toFixed(1) : '-'

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">Body Metrics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold mb-4 text-[#f1f5f9]">Trend Peso (Ultimi 30 giorni)</h2>
            <BodyChart history={history} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Component */}
            <section className="bg-[#111118] rounded-2xl p-6 border border-white/5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <Target className="w-32 h-32" />
              </div>
              <h2 className="text-lg font-bold mb-4 text-[#f1f5f9] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#8b5cf6]" /> Obiettivo
              </h2>
              <div className="space-y-4 relative z-10">
                <div>
                  <p className="text-sm text-[#64748b]">Target Peso</p>
                  <p className="text-2xl font-bold text-[#f1f5f9]">{targetWeight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748b]">Distanza</p>
                  <p className="text-lg font-medium text-[#8b5cf6]">{weightDiff} kg</p>
                </div>
                <div className="w-full bg-[#0a0a0f] h-2 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-[#8b5cf6] h-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </section>

            {/* Correlazioni (Mock) */}
            <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-bold mb-4 text-[#f1f5f9] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#f59e0b]" /> Correlazioni (7gg)
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center p-2 bg-[#0a0a0f] rounded-lg border border-white/5">
                  <span className="text-[#64748b]">Δ Peso vs Kcal Medie</span>
                  <span className="text-[#10b981] font-medium">-0.2kg / 2450 kcal</span>
                </li>
                <li className="flex justify-between items-center p-2 bg-[#0a0a0f] rounded-lg border border-white/5">
                  <span className="text-[#64748b]">Training Load Medio</span>
                  <span className="text-[#f1f5f9] font-medium">450</span>
                </li>
                <li className="flex justify-between items-center p-2 bg-[#0a0a0f] rounded-lg border border-white/5">
                  <span className="text-[#64748b]">Sonno Medio</span>
                  <span className="text-[#f1f5f9] font-medium">7h 15m</span>
                </li>
              </ul>
            </section>
          </div>

          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold mb-4 text-[#f1f5f9]">Storico Recente</h2>
            <BodyHistory history={history.slice(0, 10)} />
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <BodyForm initialData={todayLog} />
          </section>

          {/* Progress Photos Component */}
          <PhotoUpload />
        </div>
      </div>
    </div>
  )
}
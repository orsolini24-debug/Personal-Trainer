import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBiometricHistory } from "@/app/actions/body"
import BodyForm from "./body-form"
import BodyChart from "./body-chart"
import BodyHistory from "./body-history"

export default async function BodyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const res = await getBiometricHistory(30)
  const history = res.data || []
  
  const today = new Date()
  today.setUTCHours(0,0,0,0)
  const todayLog = history.find(l => new Date(l.date).getTime() === today.getTime())

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-2xl font-bold">Body Metrics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Trend Peso (Ultimi 30 giorni)</h2>
            <BodyChart history={history} />
          </section>

          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Storico Recente</h2>
            <BodyHistory history={history.slice(0, 10)} />
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <BodyForm initialData={todayLog} />
          </section>
        </div>
      </div>
    </div>
  )
}
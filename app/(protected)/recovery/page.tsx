import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import RecoveryForm from "./recovery-form"
import RecoveryHistory from "./recovery-history"
import DeviceForm from "./device-form"

export default async function RecoveryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const today = new Date()
  today.setUTCHours(0,0,0,0)

  const [todayLog, history, devices] = await Promise.all([
    prisma.recoveryLog.findUnique({ where: { userId_date: { userId: session.user.id, date: today } } }),
    prisma.recoveryLog.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' }, take: 14 }),
    prisma.userDevice.findMany({ where: { userId: session.user.id } })
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-2xl font-bold">Recovery Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <RecoveryForm initialData={todayLog} />
          </section>

          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Storico 14 Giorni</h2>
            <RecoveryHistory history={history} />
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <DeviceForm devices={devices} />
          </section>
        </div>
      </div>
    </div>
  )
}
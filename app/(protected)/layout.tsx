import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LayoutDashboard, Dumbbell, Utensils, HeartPulse, MessageCircle, Activity, Calendar } from "lucide-react"
import Link from "next/link"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Training", href: "/training", icon: Dumbbell },
    { name: "Nutrition", href: "/nutrition", icon: Utensils },
    { name: "Recovery", href: "/recovery", icon: HeartPulse },
    { name: "Coach", href: "/coach", icon: MessageCircle },
    { name: "Body", href: "/body", icon: Activity },
    { name: "Plan", href: "/plan", icon: Calendar },
  ]

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold">PerfEcosystem</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome, {session.user.name || session.user.email || 'User'}</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-50">
        <ul className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
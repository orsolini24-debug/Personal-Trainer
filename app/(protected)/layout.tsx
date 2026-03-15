import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LayoutDashboard, Dumbbell, Utensils, HeartPulse, MessageCircle, Activity, Calendar, BookOpen } from "lucide-react"
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
    { name: "Guida", href: "/guida", icon: BookOpen },
  ]

  const userName = session.user.name || session.user.email || 'User'
  const initials = userName.substring(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-[#f1f5f9] overflow-hidden">
      {/* Desktop Sidebar (Expandable on hover) */}
      <aside className="hidden md:flex flex-col bg-[#0d0d14] border-r border-white/5 w-[64px] hover:w-[220px] transition-all duration-300 z-40 group relative">
        <div className="h-16 flex items-center justify-center group-hover:justify-start px-4 border-b border-white/5">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center font-bold text-white shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            PE
          </div>
          <span className="ml-3 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#6366f1]">
            Ecosystem
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center rounded-xl p-2 text-[#64748b] hover:bg-white/5 hover:text-[#f1f5f9] transition-all group/link relative"
                  title={item.name}
                >
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 group-hover/link:text-[#3b82f6] transition-colors" />
                  </div>
                  <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile Bottom */}
        <div className="p-3 border-t border-white/5 flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-[#111118] border border-white/10 flex items-center justify-center shrink-0 text-sm font-medium">
            {initials}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 min-w-0">
            <p className="text-sm font-medium truncate text-[#f1f5f9]">{userName}</p>
            <p className="text-xs text-[#64748b] truncate">Atleta</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative z-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/80 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent"></div>
        <ul className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center w-full h-full min-w-[44px] text-[#64748b] hover:text-[#3b82f6] transition-colors"
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ClientLayout from "./ClientLayout"
import OnboardingWizard from "./onboarding/OnboardingWizard"
import { headers } from "next/headers"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Check if we are already on the onboarding page to avoid loops
  const headerList = await headers()
  const fullPath = headerList.get("x-invoke-path") || ""
  const isOnboardingPage = fullPath.includes("/onboarding")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true }
  })

  // Se non ha profilo o non ha completato l'onboarding E non siamo già sulla pagina di onboarding
  if (!user?.profile || !user.profile.onboardingCompleted) {
    if (!isOnboardingPage) {
      return <OnboardingWizard userName={user?.name ?? undefined} />
    }
  }

  // Otherwise, render the normal app layout
  return <ClientLayout>{children}</ClientLayout>
}

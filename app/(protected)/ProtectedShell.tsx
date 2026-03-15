import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ClientLayout from "./ClientLayout"
import OnboardingWizard from "./onboarding/OnboardingWizard"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true }
  })

  // If the user doesn't have a profile yet, force them into the Onboarding Wizard
  if (!user?.profile) {
    return <OnboardingWizard />
  }

  // Otherwise, render the normal app layout
  return <ClientLayout>{children}</ClientLayout>
}

import { auth } from "@/auth"
import ClientLayout from "./ClientLayout"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Middleware handles redirection: unauthenticated → /login, incomplete onboarding → /plan
  // Here we just render the layout for authenticated users with completed onboarding
  return <ClientLayout session={session}>{children}</ClientLayout>
}

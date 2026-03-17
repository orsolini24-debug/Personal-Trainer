import { auth } from "@/auth"
import ClientLayout from "./ClientLayout"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Middleware already handles redirection to /login and /onboarding
  // Here we just render the layout for authenticated users with completed onboarding
  return <ClientLayout>{children}</ClientLayout>
}

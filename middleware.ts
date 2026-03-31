import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiRoute = nextUrl.pathname.startsWith("/api")
  const isPublicRoute = ["/login", "/register", "/"].includes(nextUrl.pathname)

  // Routes that are part of the onboarding/plan setup flow — never redirect these
  const isPlanRoute = nextUrl.pathname.startsWith("/plan")
  const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding")

  if (isApiRoute) return NextResponse.next()

  if (isLoggedIn) {
    if (isPublicRoute) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }

    // Onboarding gating is handled at the page level (/plan/page.tsx shows PlanSetupFlow).
    // Middleware-level JWT guard is intentionally removed: the JWT is stale between logins
    // and can lock out users whose onboardingCompleted was updated in the DB but not yet
    // refreshed in the token. Page-level checks are always fresh.
  } else {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

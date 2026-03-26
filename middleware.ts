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

    // New-user guard: if onboarding not done, only /plan is allowed
    const onboardingCompleted = (req.auth as any)?.user?.onboardingCompleted
    if (!onboardingCompleted && !isPlanRoute && !isOnboardingRoute) {
      return NextResponse.redirect(new URL("/plan", nextUrl))
    }
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

import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isOnboardingCompleted = (req.auth?.user as any)?.onboardingCompleted

  const isApiRoute = nextUrl.pathname.startsWith("/api")
  const isPublicRoute = ["/login", "/register"].includes(nextUrl.pathname)
  const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding")

  if (isApiRoute) return NextResponse.next()

  if (isLoggedIn) {
    if (isPublicRoute) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    
    // Redirect to onboarding if not completed and not already there
    if (!isOnboardingCompleted && !isOnboardingRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl))
    }
    
    // If completed and trying to go back to onboarding, go to dashboard
    if (isOnboardingCompleted && isOnboardingRoute) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
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

import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiRoute = nextUrl.pathname.startsWith("/api")
  const isPublicRoute = ["/login", "/register", "/"].includes(nextUrl.pathname)

  // /plan is the single entry point for onboarding + plan management — never redirect away from it
  const isPlanRoute = nextUrl.pathname.startsWith("/plan")

  if (isApiRoute) return NextResponse.next()

  if (isLoggedIn) {
    if (isPublicRoute) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }

    // If onboarding is not yet complete, funnel the user to /plan.
    // Note: req.auth.user.onboardingCompleted reflects the JWT value at login time.
    // After selectProposal() sets it to true in the DB, the next login will refresh the token.
    // In the meantime /plan/page.tsx reads fresh DB state and shows the correct view.
    const onboardingCompleted = (req.auth as any)?.user?.onboardingCompleted
    if (!onboardingCompleted && !isPlanRoute) {
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

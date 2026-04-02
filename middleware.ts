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
    // Onboarding gating is handled at page level (/plan/page.tsx reads DB directly).
    // JWT-based check removed: the token is stale between logins and would block
    // users whose onboardingCompleted was just updated in the DB.
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

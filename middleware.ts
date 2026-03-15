import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/training") ||
    req.nextUrl.pathname.startsWith("/nutrition") ||
    req.nextUrl.pathname.startsWith("/recovery") ||
    req.nextUrl.pathname.startsWith("/coach") ||
    req.nextUrl.pathname.startsWith("/body") ||
    req.nextUrl.pathname.startsWith("/plan")

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

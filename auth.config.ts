import type { NextAuthConfig } from "next-auth"

// Edge-safe config — NO Prisma import here (used in middleware)
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/training") ||
        nextUrl.pathname.startsWith("/nutrition") ||
        nextUrl.pathname.startsWith("/recovery") ||
        nextUrl.pathname.startsWith("/coach") ||
        nextUrl.pathname.startsWith("/body") ||
        nextUrl.pathname.startsWith("/plan") ||
        nextUrl.pathname.startsWith("/guida")

      if (isProtected) {
        if (isLoggedIn) return true
        return false
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.onboardingCompleted = user.onboardingCompleted
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig

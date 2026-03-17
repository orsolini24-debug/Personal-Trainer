import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    onboardingCompleted?: boolean
  }
  interface Session {
    user: {
      id: string
      onboardingCompleted: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    onboardingCompleted?: boolean
  }
}

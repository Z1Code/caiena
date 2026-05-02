import type { DefaultSession } from "next-auth"

export type UserRole = "superadmin" | "admin" | "user"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      displayName: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    displayName: string
    roleFetchedAt?: number
  }
}

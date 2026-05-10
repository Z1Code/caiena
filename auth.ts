// auth.ts
import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { UserRole } from "./types/next-auth"

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

// Re-fetch role from DB every 5 minutes to propagate role changes
const ROLE_TTL_MS = 5 * 60 * 1000

async function resolveRole(googleId: string, email: string): Promise<UserRole> {
  if (SUPERADMIN_EMAILS.includes(email.toLowerCase())) return "superadmin"
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.googleId, googleId),
    columns: { role: true },
  })
  return (profile?.role as UserRole) ?? "user"
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user, trigger }) {
      // First login: user object is present, create/upsert profile
      if (trigger === "signIn" || trigger === "signUp") {
        const role = await resolveRole(token.sub!, user.email!)
        token.role = role
        token.displayName = user.name ?? ""
        token.roleFetchedAt = Date.now()

        // Upsert user profile (superadmin role not stored in DB)
        await db
          .insert(userProfiles)
          .values({
            googleId: token.sub!,
            email: user.email!,
            role: role === "superadmin" ? "user" : role,
          })
          .onConflictDoUpdate({
            target: userProfiles.googleId,
            set: { email: user.email! },
          })
        return token
      }

      // trigger === "update": ALWAYS re-fetch from DB — never trust client data
      if (trigger === "update") {
        token.role = await resolveRole(token.sub!, token.email!)
        token.roleFetchedAt = Date.now()
        return token
      }

      // Normal requests: re-fetch only when TTL expired
      const isStale =
        !token.roleFetchedAt || Date.now() - (token.roleFetchedAt as number) > ROLE_TTL_MS
      if (isStale) {
        token.role = await resolveRole(token.sub!, token.email!)
        token.roleFetchedAt = Date.now()
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.role = token.role as UserRole
        session.user.displayName = token.displayName as string
      }
      return session
    },
  },
})

import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

// Edge-safe config — NO database imports, NO Node.js-only packages.
// This file is imported by src/proxy.ts which runs in the Edge runtime.

export default {
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Only accept Google accounts with verified emails
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true
      }
      return true
    },

    // Runs in middleware (Edge) — reads role from JWT token, no DB
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      if (nextUrl.pathname.startsWith("/dashboard")) {
        return isLoggedIn
      }
      return true
    },
  },
} satisfies NextAuthConfig

# Google Auth + Role Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace password auth with Google OAuth (Auth.js v5), add 3-role system (superadmin/admin/user), add `/dashboard` with role-based panels, and validate WhatsApp phone via signed bot message.

**Architecture:** Auth.js v5 JWT strategy with edge-safe split config (auth.config.ts for proxy.ts, auth.ts for DB role lookups with 5-min TTL). New `user_profiles` table links Google accounts to WhatsApp phones. Dashboard renders AdminDashboard or UserDashboard based on JWT role.

**Tech Stack:** next-auth@beta, Drizzle ORM (Neon PostgreSQL), Next.js 16.2.4 App Router, src/ directory structure.

---

## Project Context

- **Next.js 16.2.4** uses `proxy.ts` (not `middleware.ts`) — named export `proxy` or default export
- **src/ directory** — all app code in `src/`, so `proxy.ts` goes at `src/proxy.ts`
- **Auth files** go at project root alongside `package.json` (`auth.config.ts`, `auth.ts`)
- **DB imports**: `import { db } from "@/db"`, schema from `@/db/schema`
- **Current auth**: `src/lib/auth.ts` with `isAuthenticated()` — gets deleted in final task
- **Migration**: `npx drizzle-kit push` — reads DATABASE_URL from `.env.local`. Run on VPS if no local `.env.local`.
- **Deploy**: `scp` files to VPS at `/var/www/caiena/`, then `ssh vps "cd /var/www/caiena && npm run build && pm2 restart caiena"`
- **Admin routes pattern**: every `/api/admin/*` route has `import { isAuthenticated } from "@/lib/auth"` and guard `if (!(await isAuthenticated())) return 401`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `auth.config.ts` | Create (root) | Edge-safe Auth.js config, Google provider, `authorized` callback |
| `auth.ts` | Create (root) | Full Auth.js with DB role lookup, `unstable_update` export |
| `src/proxy.ts` | Create | Next.js 16 middleware (replaces `middleware.ts`) |
| `types/next-auth.d.ts` | Create | TypeScript augmentation for `UserRole`, `displayName` |
| `src/app/api/auth/[...nextauth]/route.ts` | Create | Auth.js OAuth route handler |
| `src/app/providers.tsx` | Create | `SessionProvider` wrapper for client hooks |
| `src/app/login/page.tsx` | Create | Google sign-in page |
| `src/app/dashboard/layout.tsx` | Create | Auth guard for `/dashboard` |
| `src/app/dashboard/page.tsx` | Create | Role-based panel router |
| `src/components/auth-widget.tsx` | Create | Navbar Google login/profile dropdown |
| `src/components/link-whatsapp-card.tsx` | Create | Onboarding card + polling |
| `src/components/user-dashboard.tsx` | Create | Client panel (appointments, history, loyalty) |
| `src/components/admin-users-tab.tsx` | Create | Superadmin user management tab |
| `src/app/api/user/me/route.ts` | Create | GET profile + linking status |
| `src/app/api/user/link-phone/token/route.ts` | Create | POST generate LINK token |
| `src/app/api/user/profile/route.ts` | Create | PUT update displayName |
| `src/app/api/admin/users/route.ts` | Create | GET all users (superadmin) |
| `src/app/api/admin/users/[id]/role/route.ts` | Create | PUT change role (superadmin) |
| `src/db/schema.ts` | Modify | Add `userProfiles` table |
| `src/lib/whatsapp-bot.ts` | Modify | Add `LINK|` handler |
| `src/components/navbar.tsx` | Modify | Replace "Agendar" button with `<AuthWidget>` |
| `src/components/hero.tsx` | Modify | "Ver Servicios" → "Agendar" |
| `src/components/admin-dashboard.tsx` | Modify | Add `canManageUsers` prop + Usuarios tab + fix logout/redirects |
| `src/app/layout.tsx` | Modify | Wrap with `<Providers>` |
| `ecosystem.config.js` | Modify | Add AUTH_* env vars |
| All `/api/admin/*` routes (14 files) | Modify | Replace `isAuthenticated()` guard |
| `src/app/admin/` (directory) | Delete | Replaced by `/dashboard` |
| `src/lib/auth.ts` | Delete | Replaced by root `auth.ts` |

---

### Task 1: Install next-auth@beta and TypeScript types

**Files:**
- Create: `types/next-auth.d.ts`

- [ ] **Step 1: Install next-auth**

```bash
cd /c/Nails/caiena
npm install next-auth@beta
```

Expected output: `added next-auth@...` with no peer dependency errors.

- [ ] **Step 2: Create TypeScript augmentation**

Create `types/next-auth.d.ts`:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to next-auth types (some pre-existing errors are OK).

- [ ] **Step 4: Commit**

```bash
git add types/next-auth.d.ts package.json package-lock.json
git commit -m "feat: install next-auth@beta and TypeScript role types"
```

---

### Task 2: DB migration — add user_profiles table

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add userProfiles table to schema**

Open `src/db/schema.ts`. After the `waUsers` table definition (around line 140), add:

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILES — links Google accounts to WhatsApp phones + portal role
// ─────────────────────────────────────────────────────────────────────────────
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").unique().notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // 'user' | 'admin' (superadmin from env only)
  whatsappPhone: text("whatsapp_phone").unique(),
  displayName: text("display_name"),
  linkedAt: timestamp("linked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
```

Also add the type export at the bottom of the file:

```typescript
export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
```

- [ ] **Step 2: Run migration**

If you have a local `.env.local` with `DATABASE_URL`:
```bash
cd /c/Nails/caiena
npx drizzle-kit push
```

If no local `.env.local`, copy schema to VPS and run there:
```bash
scp -P 2222 src/db/schema.ts root@178.156.176.15:/var/www/caiena/src/db/schema.ts
ssh vps "cd /var/www/caiena && npx drizzle-kit push"
```

Expected: `user_profiles table created` in output.

- [ ] **Step 3: Verify table exists**

```bash
ssh vps "cd /var/www/caiena && node -e \"
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'\`.then(r => console.log(r.map(c => c.column_name))).catch(console.error);
\" "
```

Expected: `['id', 'google_id', 'email', 'role', 'whatsapp_phone', 'display_name', 'linked_at', 'created_at']`

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add user_profiles table for Google-WhatsApp account linking"
```

---

### Task 3: auth.config.ts — edge-safe configuration

**Files:**
- Create: `auth.config.ts` (project root, alongside package.json)

- [ ] **Step 1: Create auth.config.ts**

```typescript
// auth.config.ts
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep "auth.config" | head -10
```

Expected: no errors referencing `auth.config.ts`.

- [ ] **Step 3: Commit**

```bash
git add auth.config.ts
git commit -m "feat: add edge-safe auth.config.ts with Google provider"
```

---

### Task 4: auth.ts — full instance with DB role lookup

**Files:**
- Create: `auth.ts` (project root)

- [ ] **Step 1: Create auth.ts**

```typescript
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
        !token.roleFetchedAt || Date.now() - token.roleFetchedAt > ROLE_TTL_MS
      if (isStale) {
        token.role = await resolveRole(token.sub!, token.email!)
        token.roleFetchedAt = Date.now()
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.role = token.role
        session.user.displayName = token.displayName
      }
      return session
    },
  },
})
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep "auth.ts" | head -10
```

Expected: no errors in `auth.ts`.

- [ ] **Step 3: Commit**

```bash
git add auth.ts
git commit -m "feat: add auth.ts with DB role lookup and 5-min TTL"
```

---

### Task 5: proxy.ts + Auth.js route handler

**Files:**
- Create: `src/proxy.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create src/proxy.ts**

Next.js 16 uses `proxy.ts` (not `middleware.ts`). The file must be inside `src/` since the project uses `src/app/`. Export a named `proxy` function or use default export.

```typescript
// src/proxy.ts
import NextAuth from "next-auth"
import authConfig from "../auth.config"

// Use edge-safe config only — no DB imports here
const { auth } = NextAuth(authConfig)

export const proxy = auth

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.png$|uploads).*)",
  ],
}
```

- [ ] **Step 2: Create the Auth.js route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "../../../../auth"
export const { GET, POST } = handlers
```

Note: using relative path because `auth.ts` is at project root, outside `src/`.

- [ ] **Step 3: Verify build**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep -E "proxy|route" | head -10
```

Expected: no errors in these files.

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts src/app/api/auth/
git commit -m "feat: add proxy.ts middleware and Auth.js route handler"
```

---

### Task 6: SessionProvider + layout.tsx update

**Files:**
- Create: `src/app/providers.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create providers.tsx**

Create `src/app/providers.tsx`:

```typescript
"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 2: Update layout.tsx**

Current `src/app/layout.tsx` body:
```typescript
      <body className="min-h-full flex flex-col">
        {children}
        <AIChatbot />
      </body>
```

Replace with:
```typescript
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <AIChatbot />
        </Providers>
      </body>
```

Add import at the top of the file (after existing imports):
```typescript
import { Providers } from "./providers"
```

- [ ] **Step 3: Verify build**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep "layout" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add src/app/providers.tsx src/app/layout.tsx
git commit -m "feat: add SessionProvider wrapper to layout"
```

---

### Task 7: Login page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create login page**

Create `src/app/login/page.tsx`:

```typescript
import { redirect } from "next/navigation"
import { auth, signIn } from "../../../auth"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  // Already logged in — go to dashboard
  if (session) redirect("/dashboard")

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Error al iniciar sesión con Google.",
    OAuthCallback: "Error en el callback de Google.",
    OAuthAccountNotLinked: "Esta cuenta ya existe con otro método.",
    default: "Ocurrió un error. Intenta de nuevo.",
  }
  const errorMsg = params.error
    ? (errorMessages[params.error] ?? errorMessages.default)
    : null

  const callbackUrl = params.callbackUrl ?? "/dashboard"

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blush/60 border-2 border-accent-light flex items-center justify-center mx-auto mb-4">
            <span className="font-serif text-2xl text-accent-dark italic">C</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Bienvenida
          </h1>
          <p className="text-sm text-foreground/50 mt-1">Caiena Beauty Nails</p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Sign in card */}
        <div className="bg-white rounded-2xl border border-accent-light/30 p-6 shadow-sm">
          <p className="text-sm text-foreground/60 text-center mb-5">
            Inicia sesión para ver tus citas y reservar
          </p>

          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: callbackUrl })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm"
            >
              {/* Google icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep "login" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/login/
git commit -m "feat: add Google sign-in login page"
```

---

### Task 8: Dashboard layout + page (role-based router)

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard layout**

Create `src/app/dashboard/layout.tsx`:

```typescript
import { redirect } from "next/navigation"
import { auth } from "../../../auth"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")
  return <>{children}</>
}
```

- [ ] **Step 2: Create dashboard page**

Create `src/app/dashboard/page.tsx`:

```typescript
import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UserDashboard } from "@/components/user-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user.role

  if (role === "superadmin" || role === "admin") {
    return <AdminDashboard canManageUsers={role === "superadmin"} />
  }

  return <UserDashboard session={session} />
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: add /dashboard route with role-based panel routing"
```

---

### Task 9: Update AdminDashboard — logout, 401 redirect, canManageUsers prop

**Files:**
- Modify: `src/components/admin-dashboard.tsx`

The current `AdminDashboard` component has hardcoded `/admin/login` redirects and uses `/api/admin/auth DELETE` for logout. Also needs a `canManageUsers` prop and a "Usuarios" tab.

- [ ] **Step 1: Update the component signature and imports**

At the top of `src/components/admin-dashboard.tsx`, change:

Current line 1:
```typescript
"use client";
```

Replace the import block (lines 1-11) with:
```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AdminStaffTab } from "./admin-staff-tab";
import { AdminScheduleTab } from "./admin-schedule-tab";
import { AdminGroupsTab } from "./admin-groups-tab";
import { AdminServicesTab } from "./admin-services-tab";
import { AdminUsersTab } from "./admin-users-tab";
```

- [ ] **Step 2: Update AdminTab type and component signature**

Change line 35:
```typescript
type AdminTab = "reservas" | "staff" | "horarios" | "grupos" | "servicios";
```
to:
```typescript
type AdminTab = "reservas" | "staff" | "horarios" | "grupos" | "servicios" | "usuarios";
```

Change line 37:
```typescript
export function AdminDashboard() {
```
to:
```typescript
export function AdminDashboard({ canManageUsers = false }: { canManageUsers?: boolean }) {
```

- [ ] **Step 3: Update handleLogout**

Change lines 91-94:
```typescript
  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };
```
to:
```typescript
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  };
```

- [ ] **Step 4: Fix 401 redirects**

There are two `router.push("/admin/login")` calls in `fetchStats` and `fetchBookings`. Change both to `router.push("/login")`.

Change:
```typescript
    if (res.status === 401) { router.push("/admin/login"); return; }
```
to (both occurrences):
```typescript
    if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
```

- [ ] **Step 5: Add Usuarios tab to navigation**

Change the tab array in the JSX (line 132):
```typescript
          {(["reservas", "staff", "horarios", "grupos", "servicios"] as AdminTab[]).map((tab) => {
            const labels: Record<AdminTab, string> = { reservas: "Reservas", staff: "Empleadas", horarios: "Horarios", grupos: "Grupos", servicios: "Servicios" };
```
to:
```typescript
          {(["reservas", "staff", "horarios", "grupos", "servicios", ...(canManageUsers ? ["usuarios" as AdminTab] : [])] as AdminTab[]).map((tab) => {
            const labels: Record<AdminTab, string> = { reservas: "Reservas", staff: "Empleadas", horarios: "Horarios", grupos: "Grupos", servicios: "Servicios", usuarios: "Usuarios" };
```

- [ ] **Step 6: Add Usuarios panel render**

After `{activeTab === "servicios" && <AdminServicesTab />}` (line 146), add:
```typescript
        {activeTab === "usuarios" && canManageUsers && <AdminUsersTab />}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/admin-dashboard.tsx
git commit -m "feat: update AdminDashboard for Auth.js logout, role-based Usuarios tab"
```

---

### Task 10: Update all /api/admin/* route guards

**Files to modify** (14 route files):
- `src/app/api/admin/bookings/route.ts`
- `src/app/api/admin/bookings/[id]/route.ts`
- `src/app/api/admin/services/route.ts`
- `src/app/api/admin/services/[id]/route.ts`
- `src/app/api/admin/services/[id]/images/route.ts`
- `src/app/api/admin/services/[id]/images/[filename]/route.ts`
- `src/app/api/admin/slot-groups/route.ts`
- `src/app/api/admin/slot-groups/[id]/route.ts`
- `src/app/api/admin/staff/route.ts`
- `src/app/api/admin/staff/[id]/exceptions/route.ts`
- `src/app/api/admin/staff/[id]/route.ts`
- `src/app/api/admin/staff/[id]/schedule/route.ts`
- `src/app/api/admin/staff/[id]/time-blocks/route.ts`
- `src/app/api/admin/stats/route.ts`

**Pattern to apply to every file:**

Remove:
```typescript
import { isAuthenticated } from "@/lib/auth";
```

Add (the depth of the relative path varies — use the correct number of `../` to reach project root):
```typescript
import { auth } from "../../../../auth"
```

The depth depends on the file location:
- `src/app/api/admin/stats/route.ts` → `../../../../auth` (4 levels up)
- `src/app/api/admin/bookings/route.ts` → `../../../../auth` (4 levels up)
- `src/app/api/admin/bookings/[id]/route.ts` → `../../../../../auth` (5 levels up)
- `src/app/api/admin/services/route.ts` → `../../../../auth`
- `src/app/api/admin/services/[id]/route.ts` → `../../../../../auth`
- `src/app/api/admin/services/[id]/images/route.ts` → `../../../../../../auth`
- `src/app/api/admin/services/[id]/images/[filename]/route.ts` → `../../../../../../../auth`
- `src/app/api/admin/slot-groups/route.ts` → `../../../../auth`
- `src/app/api/admin/slot-groups/[id]/route.ts` → `../../../../../auth`
- `src/app/api/admin/staff/route.ts` → `../../../../auth`
- `src/app/api/admin/staff/[id]/exceptions/route.ts` → `../../../../../../auth`
- `src/app/api/admin/staff/[id]/route.ts` → `../../../../../auth`
- `src/app/api/admin/staff/[id]/schedule/route.ts` → `../../../../../../auth`
- `src/app/api/admin/staff/[id]/time-blocks/route.ts` → `../../../../../../auth`

Replace the guard in every HTTP handler function:
```typescript
// REMOVE this pattern:
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

// REPLACE with:
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
```

- [ ] **Step 1: Update all 14 route files** applying the pattern above to each one.

- [ ] **Step 2: Verify TypeScript**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep "api/admin" | head -20
```

Expected: no errors in admin routes.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: replace isAuthenticated() with Auth.js auth() in all admin routes"
```

---

### Task 11: AuthWidget + navbar update

**Files:**
- Create: `src/components/auth-widget.tsx`
- Modify: `src/components/navbar.tsx`

- [ ] **Step 1: Create AuthWidget**

Create `src/components/auth-widget.tsx`:

```typescript
"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"

export function AuthWidget() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-accent-light/30 animate-pulse" />
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="shimmer-btn ml-4 bg-foreground text-white text-xs px-6 py-2.5 rounded-full tracking-[0.1em] uppercase hover:bg-accent-dark transition-colors"
      >
        Iniciar sesión
      </button>
    )
  }

  const displayName = session.user.displayName || session.user.name || "Usuario"
  const firstName = displayName.split(" ")[0]

  return (
    <div ref={ref} className="relative ml-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-accent-light/40 px-3 py-1.5 hover:bg-accent-light/10 transition-colors"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={displayName}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-xs font-medium text-accent-dark">
              {firstName[0].toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-xs text-foreground/70 max-w-[80px] truncate">{firstName}</span>
        <svg className="w-3 h-3 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-accent-light/30 shadow-lg shadow-accent/5 py-1 z-50">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-accent-light/10 transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Mi panel
          </a>
          <div className="border-t border-accent-light/20 my-1" />
          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }) }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update navbar.tsx**

In `src/components/navbar.tsx`, add import at the top:
```typescript
import { AuthWidget } from "./auth-widget"
```

Replace the desktop "Agendar" button (lines 59-64):
```typescript
            <a
              href="/reservar"
              className="shimmer-btn ml-4 bg-foreground text-white text-xs px-6 py-2.5 rounded-full tracking-[0.1em] uppercase hover:bg-accent-dark transition-colors"
            >
              Agendar
            </a>
```
with:
```typescript
            <AuthWidget />
```

Replace the mobile "Agendar Cita" link (lines 107-113):
```typescript
              <a
                href="/reservar"
                onClick={() => setOpen(false)}
                className="bg-foreground text-white text-sm px-5 py-3 rounded-full text-center mt-3 tracking-wide"
              >
                Agendar Cita
              </a>
```
with:
```typescript
              <a
                href="/reservar"
                onClick={() => setOpen(false)}
                className="bg-foreground text-white text-sm px-5 py-3 rounded-full text-center mt-3 tracking-wide"
              >
                Agendar
              </a>
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="border border-foreground/20 text-foreground/70 text-sm px-5 py-3 rounded-full text-center mt-1 tracking-wide"
              >
                Mi panel
              </a>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth-widget.tsx src/components/navbar.tsx
git commit -m "feat: add Google auth widget to navbar"
```

---

### Task 12: Hero "Agendar" button swap

**Files:**
- Modify: `src/components/hero.tsx`

The hero currently has a "Ver Servicios" button (href `#servicios`). This becomes "Agendar" pointing to `/reservar`.

- [ ] **Step 1: Update hero CTA**

In `src/components/hero.tsx`, change the primary CTA button (lines 70-75):

Current:
```typescript
              <a
                href="#servicios"
                className="shimmer-btn bg-foreground text-white px-10 py-4 rounded-full text-sm tracking-[0.15em] uppercase hover:bg-accent-dark transition-colors shadow-xl shadow-foreground/10"
              >
                Ver Servicios
              </a>
```

Replace with:
```typescript
              <a
                href="/reservar"
                className="shimmer-btn bg-foreground text-white px-10 py-4 rounded-full text-sm tracking-[0.15em] uppercase hover:bg-accent-dark transition-colors shadow-xl shadow-foreground/10"
              >
                Agendar
              </a>
```

Also update the glass card "Ver todos" link at the bottom of the card (line 119-124) to point to `#servicios`:
```typescript
                <a
                  href="#servicios"
                  className="mt-5 w-full block text-center text-xs tracking-[0.1em] uppercase text-accent-dark border border-accent/30 rounded-full py-2.5 hover:bg-accent hover:text-white transition-all"
                >
                  Ver servicios
                </a>
```
This one stays as-is (it's already `#servicios` and "Ver servicios" is appropriate here).

- [ ] **Step 2: Commit**

```bash
git add src/components/hero.tsx
git commit -m "feat: change hero CTA from 'Ver Servicios' to 'Agendar'"
```

---

### Task 13: WhatsApp LINK token API + bot handler

**Files:**
- Create: `src/app/api/user/link-phone/token/route.ts`
- Modify: `src/lib/whatsapp-bot.ts`

- [ ] **Step 1: Create link-phone token route**

Create `src/app/api/user/link-phone/token/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import crypto from "crypto"

const WHATSAPP_BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "12057940509"
const TOKEN_TTL_SECONDS = 900 // 15 minutes

export async function POST() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const secret = process.env.AUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

  const payload = Buffer.from(
    JSON.stringify({ sub: session.user.id, iat: Math.floor(Date.now() / 1000) })
  ).toString("base64url")

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url")

  const token = `LINK|${payload}.${hmac}`
  const waUrl = `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(token)}`

  return NextResponse.json({ waUrl, expiresIn: TOKEN_TTL_SECONDS })
}
```

- [ ] **Step 2: Add LINK| handler to whatsapp-bot.ts**

Open `src/lib/whatsapp-bot.ts`. Find the `handleMessage` function. Add the LINK handler as the FIRST check inside the function, before any existing handlers:

```typescript
  // Phone linking from web dashboard
  if (input?.startsWith("LINK|")) {
    await handlePhoneLink(from, input.slice(5))
    return
  }
```

Then add the `handlePhoneLink` function in the same file (before `handleMessage` or after all other handlers):

```typescript
async function handlePhoneLink(from: string, tokenStr: string): Promise<void> {
  const secret = process.env.AUTH_SECRET
  if (!secret) return

  try {
    const [payload, signature] = tokenStr.split(".")
    if (!payload || !signature) {
      await sendText(from, "❌ El enlace no es válido. Genera uno nuevo desde tu panel.")
      return
    }

    // Verify HMAC
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url")

    if (expectedSig !== signature) {
      await sendText(from, "❌ El enlace no es válido. Genera uno nuevo desde tu panel.")
      return
    }

    // Verify expiry
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    const nowSec = Math.floor(Date.now() / 1000)
    if (nowSec - data.iat > 900) {
      await sendText(from, "❌ El enlace expiró (15 min). Genera uno nuevo desde tu panel.")
      return
    }

    // Check if already linked
    const existing = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.googleId, data.sub),
    })

    if (!existing) {
      await sendText(from, "❌ Cuenta no encontrada. Inicia sesión primero en caienanails.com/login")
      return
    }

    if (existing.linkedAt) {
      await sendText(from, "✅ Tu cuenta ya estaba conectada. Puedes ver tus citas en caienanails.com/dashboard")
      return
    }

    // Check phone not taken by another account
    const phoneConflict = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.whatsappPhone, from),
    })
    if (phoneConflict && phoneConflict.googleId !== data.sub) {
      await sendText(from, "❌ Este número ya está vinculado a otra cuenta Google.")
      return
    }

    // Link the phone
    await db
      .update(userProfiles)
      .set({ whatsappPhone: from, linkedAt: new Date() })
      .where(eq(userProfiles.googleId, data.sub))

    await sendText(
      from,
      `✅ ¡Tu cuenta está conectada!\n\nYa puedes ver tus citas y reservar más fácil en:\ncaienanails.com/dashboard`
    )
  } catch {
    await sendText(from, "❌ Error procesando el enlace. Intenta de nuevo.")
  }
}
```

Add the missing imports at the top of `whatsapp-bot.ts` (if not already present):
```typescript
import crypto from "crypto"
import { userProfiles } from "@/db/schema"
```

And add `eq` to the drizzle-orm imports if not already there.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep "whatsapp-bot\|link-phone" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/user/ src/lib/whatsapp-bot.ts
git commit -m "feat: LINK token API and WhatsApp phone linking bot handler"
```

---

### Task 14: /api/user/me + LinkWhatsAppCard component

**Files:**
- Create: `src/app/api/user/me/route.ts`
- Create: `src/components/link-whatsapp-card.tsx`

- [ ] **Step 1: Create /api/user/me**

Create `src/app/api/user/me/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ linked: false, profile: null })
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.googleId, session.user.id),
  })

  return NextResponse.json({
    linked: !!profile?.whatsappPhone,
    profile: profile
      ? {
          whatsappPhone: profile.whatsappPhone,
          displayName: profile.displayName,
          role: profile.role,
        }
      : null,
  })
}
```

- [ ] **Step 2: Create LinkWhatsAppCard**

Create `src/components/link-whatsapp-card.tsx`:

```typescript
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function LinkWhatsAppCard() {
  const [loading, setLoading] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Poll every 3 seconds while waiting for bot confirmation
  function startPolling() {
    intervalRef.current = setInterval(async () => {
      const res = await fetch("/api/user/me")
      const data = await res.json()
      if (data.linked) {
        stopPolling()
        router.refresh()
      }
    }, 3000)

    // Stop after 5 minutes
    timeoutRef.current = setTimeout(() => {
      stopPolling()
      setWaiting(false)
      setError("El tiempo expiró. Genera un nuevo enlace e inténtalo de nuevo.")
    }, 5 * 60 * 1000)
  }

  function stopPolling() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  useEffect(() => () => stopPolling(), [])

  async function handleLink() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/user/link-phone/token", { method: "POST" })
      if (!res.ok) throw new Error("Error generando enlace")
      const { waUrl } = await res.json()
      window.open(waUrl, "_blank")
      setWaiting(true)
      startPolling()
    } catch {
      setError("No se pudo generar el enlace. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="glass-card rounded-3xl p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>

          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            Conecta tu WhatsApp
          </h2>
          <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
            Para ver tus citas e historial, necesitamos vincular tu cuenta con tu número de WhatsApp.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {waiting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/60">
                <div className="w-4 h-4 border-2 border-green-400/40 border-t-green-500 rounded-full animate-spin" />
                Esperando confirmación...
              </div>
              <p className="text-xs text-foreground/40">
                Envía el mensaje que se abrió en WhatsApp para confirmar
              </p>
              <button
                onClick={() => { setWaiting(false); stopPolling() }}
                className="text-xs text-foreground/40 hover:text-foreground/60 underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={handleLink}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generando enlace...
                </>
              ) : (
                "Validar por WhatsApp"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/me/ src/components/link-whatsapp-card.tsx
git commit -m "feat: /api/user/me polling route and LinkWhatsAppCard component"
```

---

### Task 15: User dashboard

**Files:**
- Create: `src/components/user-dashboard.tsx`
- Create: `src/app/api/user/profile/route.ts`

- [ ] **Step 1: Create /api/user/profile**

Create `src/app/api/user/profile/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth, unstable_update } from "../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { displayName } = await req.json()
  if (!displayName || typeof displayName !== "string" || displayName.trim().length < 2) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 })
  }

  const name = displayName.trim()

  await db
    .update(userProfiles)
    .set({ displayName: name })
    .where(eq(userProfiles.googleId, session.user.id))

  // Update the JWT so the new name shows immediately
  await unstable_update({ displayName: name })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create user-dashboard.tsx**

Create `src/components/user-dashboard.tsx`:

```typescript
import { db } from "@/db"
import { userProfiles, bookings, services } from "@/db/schema"
import { eq, and, desc, gt, count } from "drizzle-orm"
import { LinkWhatsAppCard } from "./link-whatsapp-card"
import { BurnerNameModal } from "./burner-name-modal"
import Image from "next/image"
import type { Session } from "next-auth"

const LOYALTY_MILESTONE = parseInt(process.env.LOYALTY_MILESTONE ?? "10", 10)
const WHATSAPP_BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "12057940509"

function looksLikeBurner(name: string | null | undefined): boolean {
  if (!name) return true
  const t = name.trim()
  return t.length < 4 || !/\s/.test(t) || /\d{4,}/.test(t)
}

export async function UserDashboard({ session }: { session: Session }) {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.googleId, session.user.id),
  })

  // Not yet linked to a WhatsApp number
  if (!profile?.whatsappPhone) {
    return <LinkWhatsAppCard />
  }

  const phone = profile.whatsappPhone
  const today = new Date().toISOString().slice(0, 10)

  // Fetch upcoming bookings
  const upcomingBookings = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      serviceName: services.name,
      serviceId: bookings.serviceId,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.clientPhone, phone),
        gt(bookings.date, today)
      )
    )
    .orderBy(bookings.date, bookings.startTime)
    .limit(5)

  // Fetch booking history
  const historyBookings = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      serviceName: services.name,
      serviceId: bookings.serviceId,
      durationMinutes: services.durationMinutes,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.clientPhone, phone),
        eq(bookings.status, "completed")
      )
    )
    .orderBy(desc(bookings.date))
    .limit(20)

  // Loyalty stamp count
  const [loyaltyResult] = await db
    .select({ count: count() })
    .from(bookings)
    .where(and(eq(bookings.clientPhone, phone), eq(bookings.status, "completed")))

  const totalVisits = loyaltyResult?.count ?? 0
  const stampsInCurrentCycle = totalVisits % LOYALTY_MILESTONE
  const cyclesCompleted = Math.floor(totalVisits / LOYALTY_MILESTONE)
  const displayName = profile.displayName || session.user.displayName || session.user.name || "Clienta"
  const showBurnerModal = looksLikeBurner(profile.displayName ?? session.user.displayName)

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">
      {showBurnerModal && <BurnerNameModal />}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={displayName}
              width={56}
              height={56}
              className="rounded-full border-2 border-accent-light/40"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blush/50 border-2 border-accent-light/40 flex items-center justify-center">
              <span className="font-serif text-xl text-accent-dark">{displayName[0]}</span>
            </div>
          )}
          <div>
            <h1 className="font-serif text-xl font-semibold text-foreground">{displayName}</h1>
            <p className="text-sm text-foreground/50">{session.user.email}</p>
          </div>
          <a
            href="/"
            className="ml-auto text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            Volver al sitio
          </a>
        </div>

        {/* Loyalty card */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted tracking-widest uppercase">Tarjeta de lealtad</p>
            {cyclesCompleted > 0 && (
              <span className="text-xs bg-gold/20 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                ✨ {cyclesCompleted} recompensa{cyclesCompleted > 1 ? "s" : ""} canjeada{cyclesCompleted > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {Array.from({ length: LOYALTY_MILESTONE }).map((_, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                  i < stampsInCurrentCycle
                    ? "bg-accent border-accent text-white"
                    : "border-accent-light/40 text-foreground/20"
                }`}
              >
                {i < stampsInCurrentCycle ? "✓" : "○"}
              </div>
            ))}
          </div>
          {stampsInCurrentCycle === 0 && totalVisits === 0 ? (
            <p className="text-sm text-foreground/50">¡Agenda tu primera cita para comenzar!</p>
          ) : stampsInCurrentCycle === 0 && totalVisits > 0 ? (
            <p className="text-sm text-accent-dark font-medium">
              🎉 ¡Completaste {LOYALTY_MILESTONE} visitas! Habla con nosotros para reclamar tu recompensa.
            </p>
          ) : (
            <p className="text-sm text-foreground/60">
              {stampsInCurrentCycle} de {LOYALTY_MILESTONE} visitas —{" "}
              <span className="text-foreground/80 font-medium">
                te faltan {LOYALTY_MILESTONE - stampsInCurrentCycle} para tu recompensa
              </span>
            </p>
          )}
        </div>

        {/* Upcoming appointments */}
        <section className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Próximas citas</h2>
          {upcomingBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-sm text-foreground/50 mb-3">No tienes citas próximas</p>
              <a
                href="/reservar"
                className="inline-block bg-foreground text-white text-xs px-6 py-2.5 rounded-full tracking-wide hover:bg-accent-dark transition-colors"
              >
                Reservar
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{b.serviceName}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {b.date} · {b.startTime} – {b.endTime}
                    </p>
                  </div>
                  <span className="text-xs bg-accent/10 text-accent-dark px-2 py-1 rounded-full">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Historial de visitas</h2>
          {historyBookings.length === 0 ? (
            <p className="text-sm text-foreground/50">Aún no tienes visitas registradas.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {historyBookings.map((b) => (
                <div key={b.id} className="bg-white/60 rounded-xl px-4 py-3 flex items-center justify-between border border-accent-light/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.serviceName}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">{b.date}</p>
                  </div>
                  <a
                    href={`https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(`BOOKING|${b.serviceId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                  >
                    Repetir
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* New booking CTA */}
        <a
          href="/reservar"
          className="block w-full text-center bg-foreground text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-accent-dark transition-colors"
        >
          Nueva reserva
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create BurnerNameModal**

Create `src/components/burner-name-modal.tsx`:

```typescript
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

export function BurnerNameModal() {
  const { update } = useSession()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return
    setLoading(true)
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      })
      await update({ displayName: name.trim() })
      setDismissed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-1">
          ¿Cómo te llamamos?
        </h2>
        <p className="text-sm text-foreground/50 mb-5">
          Tu nombre de Google no parece un nombre real. ¿Cómo prefieres que te llamemos?
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors mb-4"
            autoFocus
          />
          <button
            type="submit"
            disabled={name.trim().length < 2 || loading}
            className="w-full bg-accent text-white py-3 rounded-full text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full mt-2 text-xs text-foreground/40 hover:text-foreground/60 py-2"
          >
            Saltar por ahora
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/user-dashboard.tsx src/components/burner-name-modal.tsx src/app/api/user/profile/
git commit -m "feat: user dashboard with appointments, loyalty stamps and burner name modal"
```

---

### Task 16: Admin users tab (superadmin role management)

**Files:**
- Create: `src/components/admin-users-tab.tsx`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/role/route.ts`

- [ ] **Step 1: Create /api/admin/users route**

Create `src/app/api/admin/users/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await db
    .select()
    .from(userProfiles)
    .orderBy(desc(userProfiles.createdAt))

  return NextResponse.json(users)
}
```

- [ ] **Step 2: Create /api/admin/users/[id]/role route**

Create `src/app/api/admin/users/[id]/role/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { role } = await req.json()

  if (role !== "admin" && role !== "user") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Find the target user
  const target = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, parseInt(id, 10)),
  })

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Prevent modifying superadmin emails
  if (SUPERADMIN_EMAILS.includes(target.email.toLowerCase())) {
    return NextResponse.json({ error: "Cannot modify superadmin" }, { status: 403 })
  }

  await db
    .update(userProfiles)
    .set({ role })
    .where(eq(userProfiles.id, parseInt(id, 10)))

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create AdminUsersTab component**

Create `src/components/admin-users-tab.tsx`:

```typescript
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface UserProfile {
  id: number
  googleId: string
  email: string
  role: string
  whatsappPhone: string | null
  displayName: string | null
  linkedAt: string | null
  createdAt: string
}

export function AdminUsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  async function fetchUsers() {
    const res = await fetch("/api/admin/users")
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function changeRole(id: number, newRole: "admin" | "user") {
    setUpdating(id)
    await fetch(`/api/admin/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    await fetchUsers()
    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Usuarios registrados</h2>
        <p className="text-sm text-gray-500">
          Los cambios de rol se aplican en la próxima sesión del usuario (máx. 5 min).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No hay usuarios registrados aún
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-4 py-3">
                {/* Avatar placeholder */}
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-accent-dark">
                    {(user.displayName ?? user.email)[0].toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.displayName ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  {user.whatsappPhone && (
                    <p className="text-xs text-gray-400 truncate">
                      📱 {user.whatsappPhone}
                    </p>
                  )}
                </div>

                {/* Role badge */}
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    user.role === "admin"
                      ? "bg-accent/10 text-accent-dark"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {user.role}
                </span>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {user.role === "user" ? (
                    <button
                      onClick={() => changeRole(user.id, "admin")}
                      disabled={updating === user.id}
                      className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
                    >
                      {updating === user.id ? "..." : "Hacer admin"}
                    </button>
                  ) : (
                    <button
                      onClick={() => changeRole(user.id, "user")}
                      disabled={updating === user.id}
                      className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {updating === user.id ? "..." : "Quitar admin"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep "admin-users\|admin/users" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin-users-tab.tsx src/app/api/admin/users/
git commit -m "feat: superadmin user management tab with role assignment"
```

---

### Task 17: Delete old admin pages and auth lib

**Files:**
- Delete: `src/app/admin/` (entire directory)
- Delete: `src/lib/auth.ts`

- [ ] **Step 1: Delete old admin directory**

```bash
rm -rf /c/Nails/caiena/src/app/admin
```

Verify:
```bash
ls /c/Nails/caiena/src/app/ | grep admin
```
Expected: no output.

- [ ] **Step 2: Delete old auth lib**

```bash
rm /c/Nails/caiena/src/lib/auth.ts
```

- [ ] **Step 3: Verify no remaining imports**

```bash
grep -r "from.*@/lib/auth\|from.*src/lib/auth\|isAuthenticated\|verifyPassword\|createSession" /c/Nails/caiena/src --include="*.ts" --include="*.tsx" -l
```

Expected: no output (all imports removed).

- [ ] **Step 4: Verify build**

```bash
cd /c/Nails/caiena
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
```

Fix any remaining errors before proceeding.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: delete old admin pages and password-based auth lib"
```

---

### Task 18: Update ecosystem.config.js + build + deploy to VPS

**Files:**
- Modify: `ecosystem.config.js`

- [ ] **Step 1: Update ecosystem.config.js with new env vars**

Open `ecosystem.config.js`. Add to the `env` object:

```javascript
        // Auth.js (Google OAuth)
        AUTH_SECRET: "<generate with: openssl rand -base64 33>",
        AUTH_GOOGLE_ID: "<from Google Cloud Console>",
        AUTH_GOOGLE_SECRET: "<from Google Cloud Console>",
        AUTH_TRUST_HOST: "true",
        SUPERADMIN_EMAILS: "wjjfernandez@gmail.com",
        LOYALTY_MILESTONE: "10",
```

**IMPORTANT**: Before deploying, the actual `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` must be filled in. Generate the secret with:

```bash
openssl rand -base64 33
```

For Google OAuth credentials, go to console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client ID → Web application. Add authorized redirect URIs:
- `http://localhost:3007/api/auth/callback/google`
- `https://caienanails.com/api/auth/callback/google`

- [ ] **Step 2: Build locally**

```bash
cd /c/Nails/caiena
npm run build
```

Expected: successful build with no errors. Fix any TypeScript or import errors before deploying.

- [ ] **Step 3: Deploy to VPS**

```bash
# Copy all changed source files
scp -P 2222 -r src/ root@178.156.176.15:/var/www/caiena/
scp -P 2222 auth.config.ts auth.ts ecosystem.config.js package.json package-lock.json types/ root@178.156.176.15:/var/www/caiena/

# Install deps and build on VPS
ssh vps "cd /var/www/caiena && npm install && npm run build && pm2 restart caiena"
```

- [ ] **Step 4: Run DB migration on VPS**

```bash
ssh vps "cd /var/www/caiena && npx drizzle-kit push"
```

Expected: `user_profiles table created` or `No changes detected` if already pushed.

- [ ] **Step 5: Smoke test**

```bash
# Check PM2 is running
ssh vps "pm2 show caiena | grep -E 'status|pid|error'"
```

Then open `https://caienanails.com/login` in a browser — should see the Google sign-in page.

Open `https://caienanails.com/dashboard` without being logged in — should redirect to `/login`.

- [ ] **Step 6: Commit**

```bash
git add ecosystem.config.js
git commit -m "feat: add AUTH_*, SUPERADMIN_EMAILS env vars to ecosystem config"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Auth.js v5 Google OAuth | Tasks 1, 3, 4, 5 |
| 3-role system (superadmin/admin/user) | Tasks 4, 9, 10 |
| `/dashboard` role-based panel | Tasks 8, 9 |
| `user_profiles` table | Task 2 |
| Proxy.ts (Next.js 16 middleware) | Task 5 |
| SessionProvider | Task 6 |
| Login page | Task 7 |
| AuthWidget in navbar | Task 11 |
| Hero "Agendar" button | Task 12 |
| WhatsApp LINK token + bot | Task 13 |
| `/api/user/me` polling | Task 14 |
| LinkWhatsAppCard | Task 14 |
| UserDashboard (appointments, history, loyalty) | Task 15 |
| Burner name detection + modal | Task 15 |
| Admin users tab (superadmin) | Task 16 |
| All admin API guards updated | Task 10 |
| Old admin pages deleted | Task 17 |
| Deploy | Task 18 |

All spec requirements covered.

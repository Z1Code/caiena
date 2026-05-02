# Google Auth + Dashboard de Roles — Design Spec
**Date:** 2026-05-02
**Status:** Approved

---

## Overview

Reemplazar el sistema de autenticación por contraseña con Google OAuth (Auth.js v5). El panel de administración pasa de `/admin` a `/dashboard`, protegido por rol. Tres roles: `superadmin` (hardcoded en env), `admin` (asignado en DB por superadmin), `user` (cualquier Google verificado). El panel de usuario muestra citas, historial, lealtad y rebook. La validación del número WhatsApp se hace enviando un mensaje firmado al bot — sin formularios de teléfono.

---

## Tech Stack

- `next-auth@beta` (Auth.js v5) — Google provider, JWT strategy, sin adapter
- Drizzle ORM — nueva tabla `user_profiles` con columna `role`
- Framer Motion (ya instalado) — animaciones del dashboard
- WhatsApp bot existente — nuevo handler `LINK|` para validación

---

## Sistema de Roles

| Rol | Fuente | Panel visible | Puede hacer |
|-----|--------|--------------|-------------|
| `superadmin` | `SUPERADMIN_EMAILS` env var | Admin completo + tab Usuarios | Todo, incluyendo asignar/revocar rol `admin` |
| `admin` | `user_profiles.role = "admin"` en DB | Admin completo (sin tab Usuarios) | Gestionar reservas, servicios, horarios, stats |
| `user` | Default (cualquier Google verificado) | Panel de cliente | Ver sus citas, historial, lealtad, rebook |

**Regla de seguridad:** `superadmin` se determina SOLO por env var, nunca se almacena en DB. No puede ser modificado desde el panel.

---

## Auth Architecture

### Split Config — obligatorio para Next.js 16

`auth.config.ts` debe ser edge-safe (sin imports de DB) porque lo usa `proxy.ts` (middleware). `auth.ts` tiene acceso a DB y hace el lookup de rol.

---

**`auth.config.ts`** — edge-safe, solo providers + `authorized` callback:
```typescript
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export default {
  providers: [Google],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      // Solo acepta cuentas Google con email verificado
      if (account?.provider === "google") {
        return profile?.email_verified === true
      }
      return true
    },
    // Corre en Edge (proxy.ts) — lee rol del JWT, sin DB
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn // cualquier logueado puede entrar; el panel filtra por rol
      }
      return true
    },
  },
} satisfies NextAuthConfig
```

---

**`auth.ts`** — instancia completa con DB lookup de rol + TTL:
```typescript
import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { db } from "@/lib/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { UserRole } from "@/types/next-auth"

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean)

const ROLE_TTL_MS = 5 * 60 * 1000 // re-fetch rol cada 5 minutos

async function fetchRoleFromDB(googleId: string, email: string): Promise<UserRole> {
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
      // Primer login: user está disponible, crear/actualizar user_profiles
      if (trigger === "signIn" || trigger === "signUp") {
        const role = await fetchRoleFromDB(token.sub!, user.email!)
        token.role = role
        token.displayName = user.name ?? ""
        token.roleFetchedAt = Date.now()

        // Upsert user_profiles (crea el perfil si no existe)
        await db.insert(userProfiles).values({
          googleId: token.sub!,
          email: user.email!,
          role: role === "superadmin" ? "user" : role, // superadmin no se guarda en DB
        }).onConflictDoUpdate({
          target: userProfiles.googleId,
          set: { email: user.email! }, // solo actualiza email si cambia
        })
        return token
      }

      // trigger === "update": siempre re-fetch desde DB (NUNCA confiar en session param)
      if (trigger === "update") {
        token.role = await fetchRoleFromDB(token.sub!, token.email!)
        token.roleFetchedAt = Date.now()
        return token
      }

      // Requests normales: re-fetch solo si el TTL expiró
      const isStale = !token.roleFetchedAt || Date.now() - token.roleFetchedAt > ROLE_TTL_MS
      if (isStale) {
        token.role = await fetchRoleFromDB(token.sub!, token.email!)
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

---

**`proxy.ts`** — Next.js 16 middleware (edge-safe, usa solo `auth.config.ts`):
```typescript
import authConfig from "./auth.config"
import NextAuth from "next-auth"

const { auth } = NextAuth(authConfig)
export default auth

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|uploads).*)"],
}
```

---

**`app/api/auth/[...nextauth]/route.ts`**:
```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

---

### TypeScript Augmentation

**`types/next-auth.d.ts`**:
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

---

### Variables de Entorno

Se agregan a `ecosystem.config.js` en el VPS:
```
AUTH_SECRET=<openssl rand -base64 33>
AUTH_GOOGLE_ID=<Google Cloud Console>
AUTH_GOOGLE_SECRET=<Google Cloud Console>
AUTH_TRUST_HOST=true
SUPERADMIN_EMAILS=wjjfernandez@gmail.com,owner@domain.com
LOYALTY_MILESTONE=10
```

En Google Cloud Console, authorized redirect URIs:
- `http://localhost:3007/api/auth/callback/google`
- `https://caienanails.com/api/auth/callback/google`

---

## Rutas

| Ruta | Acceso | Contenido |
|------|--------|-----------|
| `/login` | Público | Página "Continuar con Google" |
| `/dashboard` | Logueado | Renderiza panel según rol |
| `/api/auth/[...nextauth]` | Auth.js | OAuth callbacks |
| `/api/admin/*` | `admin` o `superadmin` | Gestión del salón |
| `/api/admin/users/*` | Solo `superadmin` | Gestión de usuarios y roles |
| `/api/user/*` | Cualquier logueado | Perfil, linking, polling |

`src/app/admin/` se **elimina** — movido a `/dashboard`.
`src/app/admin/login/` se **elimina** — reemplazado por `/login`.
`src/lib/auth.ts` se **elimina** — reemplazado por `auth.ts` en raíz.

Guards actualizados en todos los route handlers de `/api/admin/*`:
```typescript
// Antes:
if (!(await isAuthenticated())) { return 401 }

// Después:
const session = await auth()
if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// En rutas solo para superadmin (gestión de usuarios):
if (!session || session.user.role !== "superadmin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

---

## Gestión de Usuarios (superadmin)

### Tab "Usuarios" en AdminDashboard

Solo visible cuando `session.user.role === "superadmin"`. Muestra tabla de todos los `user_profiles`:
- Avatar, nombre, email, rol actual, fecha de registro, teléfono WhatsApp linked
- Botones "Hacer admin" / "Quitar admin" por fila
- No puede modificar emails que están en `SUPERADMIN_EMAILS`

### API: `PUT /api/admin/users/[id]/role`

```typescript
// Body: { role: "admin" | "user" }
// Guard: solo superadmin
// Prohibido: modificar un email que está en SUPERADMIN_EMAILS
// Efecto: actualiza user_profiles.role en DB
// Propagación: el usuario afectado obtiene el nuevo rol en ≤5 min (TTL) o al re-login
```

### Propagación de cambios de rol

Cuando el superadmin cambia el rol de alguien en la DB:
- El usuario afectado obtiene el nuevo rol automáticamente en máximo 5 minutos (cuando el JWT TTL expire y se re-fetch)
- El panel de admin muestra: "El nuevo rol se aplicará en la próxima sesión del usuario (máx. 5 min)"
- No se requiere re-login manual

---

## Database — Cambios

### Tabla nueva `user_profiles`

```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin' (superadmin solo en env)
  whatsapp_phone TEXT UNIQUE,
  display_name TEXT,
  linked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Drizzle schema:
```typescript
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").unique().notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  whatsappPhone: text("whatsapp_phone").unique(),
  displayName: text("display_name"),
  linkedAt: timestamp("linked_at"),
  createdAt: timestamp("created_at").defaultNow(),
})
```

Los loyalty stamps se calculan con:
```sql
SELECT COUNT(*) FROM bookings WHERE phone = $whatsapp_phone AND status = 'confirmed'
```
Sin tabla extra.

---

## Validación WhatsApp (Phone Linking)

### Problema
El usuario se loguea con Google pero sus bookings en la DB están asociados a su número de WhatsApp. Hay que ligarlos sin pedir que escriba un número manualmente.

### Flujo completo

```
1. Usuario entra a /dashboard por primera vez (user_profiles.whatsapp_phone = null)
2. Ve card: "Conecta tu WhatsApp para ver tus citas"
3. Click en "Validar por WhatsApp"
   → POST /api/user/link-phone/token  (genera token firmado)
   → window.open("wa.me/12057940509?text=LINK|<token>")
4. Usuario envía ese mensaje desde su WhatsApp real
5. Bot recibe "LINK|<token>"
6. Bot valida: HMAC correcto + no expirado (15 min) + no usado
7. Bot guarda: user_profiles SET whatsapp_phone = from, linked_at = NOW()
   WHERE google_id = token.sub
8. Bot responde: "✅ Tu cuenta está conectada. Ya puedes ver tus citas:
   caienanails.com/dashboard"
9. /dashboard detecta conexión (polling GET /api/user/me cada 3s, máx 5 min)
   → recarga y muestra panel completo
```

### Token Format

```
LINK|<base64url({ sub: "google_id", iat: unix_timestamp })>.<HMAC-SHA256>
```

- Firmado con `AUTH_SECRET`
- Expira en 15 minutos
- Un solo uso: si `linked_at` ya existe en user_profiles → rechazado

### API: `POST /api/user/link-phone/token`

- Requiere sesión (`auth()`)
- Genera y responde: `{ waUrl: "https://wa.me/12057940509?text=LINK|eyJ..." }`

### API: `GET /api/user/me`

- Requiere sesión
- Responde: `{ linked: boolean, profile: { whatsappPhone, displayName, role } | null }`
- Usado para polling post-linking y para el dashboard

### Bot handler

```typescript
// En whatsapp-bot.ts, antes de los handlers existentes:
if (input?.startsWith("LINK|")) {
  await handlePhoneLink(from, input.slice(5))
  return
}
```

`handlePhoneLink(from, tokenStr)`:
1. Valida HMAC-SHA256 con `AUTH_SECRET`
2. Verifica `iat + 900 > now` (no expirado)
3. Busca `user_profiles` por `google_id = payload.sub`
4. Si `linked_at` ya existe → responde "Tu cuenta ya estaba conectada ✅"
5. Verifica que `from` no esté asociado a otro `google_id` (teléfono duplicado)
6. Guarda `whatsapp_phone = from`, `linked_at = NOW()`
7. Responde: "✅ ¡Tu cuenta está conectada! Ya puedes ver tus citas y reservar más fácil en caienanails.com/dashboard"

---

## Panel de Usuario (post-validación)

**`src/components/user-dashboard.tsx`** — Server Component:
- Llama `GET /api/user/me` internamente (o query directa a DB)
- Si `whatsappPhone` es null → `<LinkWhatsAppCard>`
- Si tiene número → panel completo

**Panel completo incluye:**

1. **Encabezado** — avatar Google + nombre (editable si burner) + email

2. **Próximas citas**
   ```sql
   SELECT b.*, s.name as service_name FROM bookings b
   JOIN services s ON b.service_id = s.id
   WHERE b.phone = $phone AND b.starts_at > NOW()
   ORDER BY b.starts_at ASC LIMIT 5
   ```

3. **Historial de visitas** — cronológico inverso, cada item con:
   - Fecha, servicio, duración
   - Botón "Repetir" → `wa.me/12057940509?text=BOOKING|{serviceId}`
   ```sql
   SELECT b.*, s.name as service_name FROM bookings b
   JOIN services s ON b.service_id = s.id
   WHERE b.phone = $phone AND b.status = 'confirmed'
   ORDER BY b.starts_at DESC LIMIT 20
   ```

4. **Tarjeta de lealtad**
   - Contador de visitas completadas
   - Barra de progreso hacia `LOYALTY_MILESTONE` (env var, default 10)
   - Al alcanzar milestone: badge dorado + "¡Habla con nosotros para reclamar tu recompensa!"

5. **Botón "Nueva reserva"** → scroll a catálogo de servicios en landing

---

## Panel de Admin / Superadmin

`src/app/dashboard/page.tsx` renderiza condicionalmente:
```typescript
if (role === "superadmin" || role === "admin") return <AdminDashboard canManageUsers={role === "superadmin"} />
return <UserDashboard />
```

`AdminDashboard` recibe prop `canManageUsers`:
- `true` (superadmin) → muestra tab "Usuarios" con gestión de roles
- `false` (admin) → tabs normales sin gestión de usuarios

---

## Nombre Burner — Detección y Override

**Heurística** (en `src/components/user-dashboard.tsx`):
```typescript
function looksLikeBurner(name: string | null | undefined): boolean {
  if (!name) return true
  const t = name.trim()
  return t.length < 4 || !/\s/.test(t) || /\d{4,}/.test(t)
}
```

**Flow:**
1. Al entrar al dashboard, si `looksLikeBurner(session.user.displayName)` → modal "¿Cómo te llamamos?"
2. Usuario ingresa nombre → `PUT /api/user/profile` con `{ displayName }`
3. API actualiza `user_profiles.display_name`
4. Cliente llama `update({ displayName })` → JWT callback re-fetch desde DB → JWT actualizado
5. Modal no vuelve (JWT tiene `displayName` válido)

**Seguridad:** el JWT callback con `trigger === "update"` SIEMPRE re-fetch desde DB. El cliente no puede auto-asignarse un rol enviando `update({ role: "admin" })`.

---

## Navbar — Auth Widget

**`src/components/auth-widget.tsx`** — Client Component (`useSession()`):

**No logueado:**
```
[Iniciar sesión]  ← donde estaba "Agendar"
```

**Logueado:**
```
[Avatar 32px] Nombre ▾
              ├── Mi panel  →  /dashboard
              └── Cerrar sesión
```

El botón "Agendar" se mueve a:
- **Hero**: reemplaza "Ver servicios" (scroll a servicios)
- **Sección servicios**: CTA secundario debajo del catálogo de selección

---

## SessionProvider

**`src/app/providers.tsx`**:
```typescript
"use client"
import { SessionProvider } from "next-auth/react"
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

Se importa en `src/app/layout.tsx` wrapeando el body.

---

## Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `auth.config.ts` | Config edge-safe Auth.js |
| `auth.ts` | Instancia completa con DB lookup de roles |
| `proxy.ts` | Next.js 16 middleware |
| `types/next-auth.d.ts` | Tipos `UserRole`, augmentación Session/JWT |
| `app/api/auth/[...nextauth]/route.ts` | OAuth route handlers |
| `app/providers.tsx` | SessionProvider wrapper |
| `app/login/page.tsx` | Página Google sign-in |
| `app/dashboard/page.tsx` | Panel role-based |
| `app/dashboard/layout.tsx` | Auth guard + layout |
| `src/components/auth-widget.tsx` | Navbar login/perfil dropdown |
| `src/components/user-dashboard.tsx` | Panel de cliente |
| `src/components/link-whatsapp-card.tsx` | Card onboarding + polling |
| `src/components/admin-users-tab.tsx` | Tab gestión de usuarios (superadmin) |
| `src/app/api/user/me/route.ts` | Estado de perfil + linking (polling) |
| `src/app/api/user/link-phone/token/route.ts` | Genera token LINK firmado |
| `src/app/api/user/profile/route.ts` | PUT displayName |
| `src/app/api/admin/users/route.ts` | GET lista usuarios (superadmin) |
| `src/app/api/admin/users/[id]/role/route.ts` | PUT cambio de rol (superadmin) |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/db/schema.ts` | Agregar `userProfiles` con columna `role` |
| `src/lib/whatsapp-bot.ts` | Handler `LINK|` |
| `src/components/navbar.tsx` | `<AuthWidget>` reemplaza botón "Agendar" |
| `src/components/hero.tsx` | Botón "Agendar" (antes "Ver servicios") |
| `src/components/admin-dashboard.tsx` | Prop `canManageUsers`, tab condicional |
| `src/app/layout.tsx` | Wrappear con `<Providers>` |
| `ecosystem.config.js` | Nuevas env vars (AUTH_*, SUPERADMIN_EMAILS, LOYALTY_MILESTONE) |
| Todos los `/api/admin/*` routes | Guard `auth()` + role check |

## Archivos a Eliminar

| Archivo | Razón |
|---------|-------|
| `src/app/admin/` (directorio completo) | Movido a `/dashboard` |
| `src/lib/auth.ts` | Reemplazado por `auth.ts` en raíz |

---

## Out of Scope

- Pagos, depósitos o cargos por no-show
- Galería de fotos de uñas por visita (cliente) — fase siguiente
- Waitlist de cancelaciones — fase siguiente
- Referidos — fase siguiente
- Gestión de membresías
- Multi-idioma
- Notificaciones push / email

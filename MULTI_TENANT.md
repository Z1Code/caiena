# Guía de implementación multi-tenant

Esta app está diseñada para ser vendida como SaaS a múltiples negocios de uñas.
La tabla `businesses` ya existe en el schema. Este documento explica exactamente
qué cambiar cuando llegue el momento.

---

## Estado actual (single-tenant)

- Un solo negocio configurado vía variables de entorno (`KAPSO_API_KEY`, `KAPSO_PHONE_NUMBER_ID`)
- No hay `business_id` en las tablas de datos
- El webhook usa credenciales de env vars directamente

---

## Qué cambiar para multi-tenant

### 1. Base de datos — schema.ts

Descomentar el campo `businessId` en cada tabla:

```typescript
// services
businessId: integer("business_id").notNull().references(() => businesses.id),

// bookings
businessId: integer("business_id").notNull().references(() => businesses.id),

// blocked_times
businessId: integer("business_id").notNull().references(() => businesses.id),

// whatsapp_sessions (ya está comentado en el schema)
businessId: integer("business_id").notNull().references(() => businesses.id),
```

Crear la migración: `npx drizzle-kit generate` y aplicarla.

### 2. Webhook routing — src/app/api/whatsapp/webhook/route.ts

El payload de Kapso incluye `payload.data.phone_number_id`.
Descomentar el bloque MULTI_TENANT y pasarle el contexto del negocio al bot:

```typescript
// Descomentar esto:
const phoneNumberId = payload.data.phone_number_id;
const [business] = await db
  .select()
  .from(businesses)
  .where(eq(businesses.phoneNumberId, phoneNumberId));

if (!business || !business.active) {
  return NextResponse.json({ ok: true });
}

await handleMessage(from, message, business);
```

### 3. Bot — src/lib/whatsapp-bot.ts

Cambiar la firma de `handleMessage` para recibir el negocio:

```typescript
export async function handleMessage(
  from: string,
  message: KapsoMessage,
  business: Business  // añadir este parámetro
): Promise<void>
```

Y en `whatsapp.ts`, `sendText/sendButtons/sendList` deben recibir
el `apiKey` y `phoneNumberId` del negocio en vez de leerlos del env:

```typescript
export async function sendText(to: string, text: string, config: { apiKey: string, phoneNumberId: string })
```

### 4. Queries — filtrar por business_id

Todas las queries en el bot que lean `services`, `bookings`, `blockedTimes`
necesitan el filtro adicional:

```typescript
.where(and(eq(services.businessId, business.id), eq(services.active, true)))
```

### 5. Admin panel

Agregar autenticación por negocio (JWT o sesión con `businessId`).
El admin solo ve datos de su propio negocio.

### 6. Onboarding de nuevos negocios

Con Kapso Platform plan, cada cliente tiene su propio número configurado
en el panel de Kapso. El proceso es:

1. Cliente registra su cuenta en tu SaaS
2. Tú (o ellos) configuran un número WhatsApp en Kapso
3. Insertar fila en `businesses` con `phoneNumberId` y `kapsoApiKey` del cliente
4. Kapso enrutará los webhooks del número a tu único endpoint
5. El endpoint `POST /api/whatsapp/webhook` despacha por `phone_number_id`

### 7. Variables de entorno para multi-tenant

En multi-tenant las credenciales de Kapso ya no van en `.env.local`
sino en la tabla `businesses`. Solo necesitas una variable global:

```env
# No necesitas KAPSO_API_KEY ni KAPSO_PHONE_NUMBER_ID en multi-tenant
# Las credenciales de cada negocio van en la tabla businesses
```

---

## Checklist completo

- [ ] Descomentar `businessId` FK en schema.ts (services, bookings, blocked_times, whatsapp_sessions)
- [ ] Generar y aplicar migración de DB
- [ ] Actualizar `handleMessage` para recibir `Business` como parámetro
- [ ] Actualizar `sendText/sendButtons/sendList` para recibir config dinámica
- [ ] Agregar `and(eq(...businessId, business.id))` a todas las queries del bot
- [ ] Descomentar bloque MULTI_TENANT en webhook/route.ts
- [ ] Actualizar admin panel para filtrar por business
- [ ] Crear flujo de onboarding de negocios (UI + insertar en businesses)
- [ ] Remover KAPSO_API_KEY/KAPSO_PHONE_NUMBER_ID del .env.local.example

---

## Kapso Platform plan ($299/mo)

Necesario para multi-tenant. Soporta múltiples negocios/números bajo una sola cuenta.
Docs: https://kapso.ai/platform

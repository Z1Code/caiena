# Caiena Nails — Booking Overhaul & Admin Panel Design
**Date:** 2026-05-01
**Scope:** Mandatory Google/WhatsApp auth, multi-staff admin panel, animated slot blocks, double-confirmation notifications

---

## 1. Database Schema

### New Tables

#### `staff`
```sql
id uuid PK, businessId FK→businesses, name text, phone text, email text,
googleCalendarId text, active boolean DEFAULT true, createdAt
```

#### `staff_services` (junction)
```sql
staffId FK→staff, serviceId FK→services,
durationOverride int (NULL = use service default),
priceOverride decimal (NULL = use service default),
PRIMARY KEY (staffId, serviceId)
```

#### `staff_schedules` (named templates, Cal.com pattern)
```sql
id uuid PK, staffId FK→staff, name text, isActive boolean DEFAULT true, createdAt
```

#### `schedule_availability` (recurring windows + date overrides)
```sql
id uuid PK, scheduleId FK→staff_schedules,
daysOfWeek int[] (e.g. [1,2,3,4,5] = Mon-Fri),
startTime time, endTime time,
specificDate date (NULL = recurring, non-NULL = one-time override)
```

#### `schedule_exceptions` (vacations, sick days, custom hours)
```sql
id uuid PK, staffId FK→staff, date date UNIQUE per staff,
type: 'VACATION' | 'SICK' | 'CUSTOM_HOURS' | 'CLOSED',
customStart time, customEnd time, note text
```

#### `time_blocks` (lunch breaks, admin time)
```sql
id uuid PK, staffId FK→staff,
-- one-time: startAt timestamptz, endAt timestamptz
-- recurring: daysOfWeek int[], blockStart time, blockEnd time
type: 'LUNCH' | 'BREAK' | 'ADMIN' | 'PERSONAL', label text
```

#### `slot_groups` (admin-defined morning/afternoon/evening)
```sql
id uuid PK, businessId FK→businesses,
name text, startTime time, endTime time,
color text, icon text, sortOrder int
```

#### `admin_roles`
```sql
id uuid PK, staffId FK→staff,
role: 'super_admin' | 'manager' | 'staff',
grantedBy uuid FK→staff, createdAt
```

### Modified Tables

#### `bookings` (add columns)
```sql
staffId uuid FK→staff (nullable, for backward compat),
status: extend to include 'awaiting_staff' | 'awaiting_client',
confirmStaff boolean DEFAULT false,
confirmClient boolean DEFAULT false,
confirmedStaffAt timestamptz,
confirmedClientAt timestamptz,
cancelledBy: 'staff' | 'client' | 'system' | 'manager',
reminderSentAt timestamptz
```

### Key Design Decisions (backed by Cal.com, PostgreSQL, industry research)
- `daysOfWeek int[]` = single row covers Mon–Fri as `[1,2,3,4,5]` (Cal.com pattern)
- `time` type for working hours, not `timestamptz` — slot instances computed at query time
- `specificDate non-null` overrides recurring template for that date
- Exceptions always take priority over schedule template
- Availability = working hours − existing bookings − time blocks − exceptions
- Booking conflict check uses PostgreSQL `OVERLAPS` with half-open `[start, end)` semantics

---

## 2. Permission Matrix (RBAC)

| Permission | super_admin | manager | staff |
|---|---|---|---|
| Create/delete businesses | ✅ | ❌ | ❌ |
| Assign managers | ✅ | ❌ | ❌ |
| Manage all staff | ✅ | ✅ | ❌ |
| Assign services to staff | ✅ | ✅ | ❌ |
| Manage schedules | ✅ | ✅ | own only |
| Block dates/times | ✅ | ✅ | own only |
| View all bookings | ✅ | ✅ | ❌ |
| View own bookings | ✅ | ✅ | ✅ |
| Confirm/reject own bookings | ✅ | ✅ | ✅ |
| Manage slot groups | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ❌ |
| Manage services catalog | ✅ | ✅ | ❌ |

Permission checks run at API route level via `requireRole(role)` middleware helper.

---

## 3. Booking Wizard Overhaul

### New Flow
`service → date → time → auth → confirm`

Step `info` becomes `auth`. No manual form.

### Auth Step UI
```
┌─────────────────────────────────────┐
│  Para continuar, verifica tu         │
│  identidad con una de estas opciones │
│                                      │
│  [G] Continuar con Google            │
│                                      │
│  ─── o ───                           │
│                                      │
│  📱 Continuar con WhatsApp           │
│     [+1 (555) 123-4567]  [Enviar →] │
│                                      │
│  (ingresa tu número, te enviamos     │
│   un código de verificación)         │
└─────────────────────────────────────┘
```

### Google Flow (existing, minor cleanup)
1. Click → save state to sessionStorage → fetch `/api/auth/google-booking` → redirect
2. Callback returns `?auth=ok&name=...&email=...`
3. Restore state from sessionStorage → advance to `confirm` step

### WhatsApp Flow (new)
1. Enter phone → POST `/api/auth/whatsapp-verify/send` → sends 6-digit code via Kapso
2. Enter code → POST `/api/auth/whatsapp-verify/confirm` → verifies
3. On success: upsert `waUsers` record → return `{ name, phone }` → advance to `confirm`
4. Code expires in 10 minutes, single-use

### Confirm Step
Shows: service, staff (if assigned), date, time, name (from auth), contact. One "Confirmar Cita" button.

---

## 4. Admin Panel — Full Schedule Management

### New Admin Sections (tabs/sidebar)

1. **Dashboard** (existing — stats, day/week view)
2. **Staff** (new)
   - List staff with role badges
   - Create/edit: name, phone, email, Google Calendar ID
   - Assign services (checkboxes with duration/price overrides)
   - Assign role (super_admin only for manager promotion)
3. **Horarios** (new)
   - Per-staff schedule editor
   - Weekly template: day toggles + start/end time per day
   - Break blocks: add lunch/break within working hours
   - Date exceptions: mark vacation, sick, custom hours
4. **Grupos de Horario** (new)
   - Configure slot group labels (Mañana/Tarde/Noche)
   - Set time ranges per group
   - Assign color/icon
5. **Bloqueos** (new)
   - Block specific date+time range globally or per staff
   - Reason text
6. **Servicios** (new — move from seed/manual)
   - CRUD for services catalog
   - Category management

---

## 5. Animated Time Slot Blocks

### Architecture
- Admin defines `slot_groups` records (e.g., Mañana 9-12, Tarde 12-16)
- API returns slots pre-grouped
- UI renders groups collapsed by default, auto-expands first group with available slots

### Visual States
| State | Treatment |
|---|---|
| Available | Brand color (`accent`), hover scales 1.02 |
| Selected | Filled dark, checkmark, scale pulse 0.95→1.02→1.0 |
| Booked/Full | Gray, `cursor-not-allowed`, strikethrough |
| Blocked | Striped pattern, tooltip "No disponible" |

### Animation (Framer Motion)
- Date change: `AnimatePresence` fade+slide (150ms)
- Group expand/collapse: `height` transition with `overflow: hidden`
- Slot selection: spring scale pulse
- Loading: skeleton shimmer per group

---

## 6. Notification & Double-Confirmation System

### Booking Lifecycle States
```
created → PENDING_STAFF (instant WhatsApp to staff)
staff confirms → PENDING_CLIENT (instant WhatsApp to client)
client confirms → CONFIRMED
either cancels → CANCELLED (notify other party)
```

### 1-Hour Reminder Trigger
- Vercel Cron runs every 30 min: `GET /api/cron/reminders`
- Finds bookings where `start_at BETWEEN now()+55min AND now()+65min` AND `reminderSentAt IS NULL`
- Sends WhatsApp to staff first (template: "¿Confirmas tu cita con [name]?")
- On staff confirmation webhook: sends to client
- Sets `reminderSentAt = now()`

### WhatsApp Template Messages
Two Meta-approved templates needed:
1. `staff_appointment_reminder` — staff confirms/declines
2. `client_appointment_reminder` — client confirms/declines

Webhook at `/api/whatsapp/webhook` already handles button payloads — extend to handle `CONFIRM_{bookingId}` and `CANCEL_{bookingId}` payloads.

### Cascading Cancellation
- Staff cancels → `cancelled_by = 'staff'`, notify client immediately, free the slot
- Client cancels → `cancelled_by = 'client'`, notify staff immediately
- Auto-decline timeout: if staff hasn't confirmed 2h after reminder → auto-CANCELLED, notify client

---

## Implementation Order

1. DB migrations (new tables + booking column additions)
2. API: RBAC middleware + staff CRUD + schedule management endpoints
3. Admin UI: Staff tab + Horarios tab + Grupos tab
4. Booking wizard: replace auth step, add WhatsApp verify flow
5. Animated slot blocks: grouped display + Framer Motion
6. Notification cron + WhatsApp confirmation webhook extension

---

## Out of Scope (this spec)
- Multi-location support (businesses table exists, not activating now)
- Commission tracking per staff
- Client history per staff
- Payment processing

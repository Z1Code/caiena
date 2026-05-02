# Caiena Frontend Redesign — Design Spec
**Date:** 2026-05-01
**Status:** Approved

---

## Overview

Full-site frontend refresh with Glass & Bloom aesthetic, morphing blob backgrounds, Framer Motion scroll reveal, and a new service-catalog booking flow. The admin panel gains product-style service management with images and pricing.

---

## Visual Direction

**Aesthetic:** Glass & Bloom — warm light backgrounds, frosted glass cards, soft shadows.
**Animations:** Morphing CSS blobs (organic background life) + Framer Motion scroll reveal (spring physics on section entry).
**Library:** `framer-motion` added as the only new dependency.
**Colors/fonts:** Unchanged — same tokens (`accent`, `rose`, `gold`, `cream`, Playfair Display + Geist).

### New CSS utilities
- `.glass-card` — `bg-white/55 backdrop-blur-xl border border-white/80 shadow-md`
- `.blob` — absolutely positioned div with morph keyframe animation + `blur-[55px]`
- Blob variants: `blob-rose` (rgba(201,144,143,0.28)), `blob-gold` (rgba(196,162,101,0.2)), `blob-warm` (rgba(184,144,122,0.22))

---

## New Booking Flow

```
Landing (service catalog) → select 1+ services → sticky summary bar → WhatsApp button
→ wa.me with BOOKING|id1,id2 payload → bot greets, confirms services, asks for date/time
```

The `/reservar` wizard remains as an alternative entry point (unchanged).

---

## Landing Page Changes

### Hero
- Add 4 morphing blobs (CSS, no JS) in background
- Add floating glass card with top 3 services (right side on desktop)
- Stats row gains ★ 5.0 rating stat
- All existing content and copy unchanged

### Services Section — becomes a selector catalog
- **No prices shown** on the public landing
- Each service card has:
  - Image carousel (up to 6 photos, auto-cycles every 3s, pause on hover)
  - Service name + duration badge
  - Selectable toggle: click → checkmark animates in, card gets accent border + slight scale
  - Framer Motion `whileInView` + stagger (0.08s per card)
- Cards use `.glass-card` style
- Blob in section background

### Sticky Summary Bar
- Appears (slide up) when ≥1 service is selected
- Shows: selected service names as chips + "Reservar por WhatsApp" button
- WhatsApp button calls `/api/booking/wa-link-multi?svcIds=1,2,3`
- Returns `wa.me/12057940509?text=BOOKING|1,2,3`
- Bar disappears when 0 services selected

### Other Sections (Gallery, Testimonials, About, Booking CTA)
- Framer Motion `whileInView` fadeUp + spring on all section headings and cards
- Blobs added to About and Booking CTA sections
- Gallery: glass overlay on hover with smooth scale
- Testimonials: glass cards

### Footer
- Unchanged structurally
- Subtle blob in background (low opacity)

---

## Admin Panel — Service Management

### Services tab redesign
- **Image upload**: up to 6 images per service, stored as URL array in `services.images`
- Upload endpoint: `POST /api/admin/services/[id]/images` (saves to `/public/uploads/services/`)
- **Price field**: visible in admin, hidden on public landing
- **Drag to reorder**: `services.sortOrder` column used for display order
- **Toggle active/inactive** (existing)
- **Full edit**: name, description, duration, price, category, images, sortOrder

### New `/api/admin/services` endpoints
- `GET` — list all services with images
- `POST` — create service
- `PUT /[id]` — update service
- `DELETE /[id]` — delete service (soft: set active=false)
- `POST /[id]/images` — upload image, returns URL
- `DELETE /[id]/images/[filename]` — remove image

---

## Database Changes

```sql
-- Add images and sortOrder to services table
ALTER TABLE services ADD COLUMN images text[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN sort_order integer DEFAULT 0;
```

Drizzle schema update:
```typescript
images: text("images").array().default([]),
sortOrder: integer("sort_order").default(0),
```

---

## New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/booking/wa-link-multi` | GET | `?svcIds=1,2,3` → wa.me URL with BOOKING payload |
| `/api/admin/services` | GET/POST | List/create services |
| `/api/admin/services/[id]` | PUT/DELETE | Update/delete service |
| `/api/admin/services/[id]/images` | POST/DELETE | Manage service images |

---

## WhatsApp Bot Update

New payload type: `BOOKING|id1,id2,id3`

```
handleBookingRequest(from, "1,2,3"):
  1. Look up service names
  2. sendText: "¡Hola! Quieres agendar:\n• Manicure Gel\n• Nail Art\n\n¿Para qué fecha?"
  3. saveNameSession if unknown user (step: await_name_booking)
  4. Then normal date/time flow for each service (book sequentially or as one block)
```

---

## Implementation Order

1. **Install Framer Motion** + add blob CSS utilities to globals.css
2. **Database migration** — add `images`, `sort_order` to services
3. **Admin services tab** — image upload, price, reorder
4. **Landing hero** — blobs + glass card
5. **Services section** — catalog cards with carousel + select toggle
6. **Sticky summary bar** — selection state + WhatsApp button
7. **`/api/booking/wa-link-multi`** — multi-service wa.me URL
8. **WhatsApp bot** — handle `BOOKING|` payload
9. **Framer Motion** — scroll reveal across all sections
10. **Polish** — gallery hover, testimonial glass cards, footer blob

---

## Out of Scope

- No price shown anywhere on public site (admin only)
- No online payment flow
- No user accounts on web side (WhatsApp handles identity)
- The `/reservar` wizard is unchanged

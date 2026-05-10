# Nail Catalog System — Design Spec
**Date:** 2026-05-09
**Project:** Caiena Beauty Nails (Next.js 16.2.4 + Drizzle + Neon + Gemini)
**Status:** Approved for implementation

---

## Overview

A luxury nail catalog system that:
1. Generates 4-pose variant images per design from Instagram reference photos using Gemini API
2. Displays them in an auto-scrolling luxury carousel on the landing page and user dashboard
3. Allows admins to upload new reference images and publish designs
4. Integrates design selection into the existing booking flow (WhatsApp bot + calendar unchanged)

Design palette: warm white `#FEF9F7`, blush cream `#F7EDE8`, rose gold `#B76E79`, plum `#3A1020`. Typography: Cormorant Garamond (display) + Jost (body). No box-shadows on cards; wide letter-spacing; 2:3 card ratio.

---

## 1. Database Schema

### Extend existing schema (`src/db/schema.ts`)

Add two new tables alongside the existing `nailStyles`:

**`nailStyleVariants`** — one row per (design × base pose) combination:
```
id, styleId (FK → nailStyles.id), baseId (enum: garra|ascendente|doble|rocío),
imagePath (public/ relative), generatedAt, status (pending|processing|done|error), errorMsg
```

**`catalogQueue`** — tracks which source images have been processed:
```
id, sourceImagePath, sourceHash (sha256 of file), styleId (FK, nullable until linked),
queuedAt, processedAt, status (queued|processing|done|error)
```

`sourceHash` prevents re-processing the same file even if it moves or is renamed.

The existing `nailStyles` table gains two columns:
- `published` (boolean, default false) — admin must explicitly publish
- `sortOrder` (integer) — for carousel ordering

---

## 2. Image Generation Pipeline

**Script:** `scripts/apply-designs.mjs` (extend existing, add DB tracking)

### Flow for batch processing
1. Scan `C:/Users/PC/Desktop/caiena_instagram_pipeline_20260430_222913/data/organized/posts/` for images starting with `"37"` (filename prefix)
2. For each image: compute sha256, check `catalogQueue.sourceHash` — skip if already done
3. Insert `catalogQueue` row (status=queued) + `nailStyles` row (published=false)
4. For each of 4 bases (`garra`, `ascendente`, `doble`, `rocío`): call Gemini, save PNG to `public/catalog-preview/<styleId>/<baseId>.jpg`, insert `nailStyleVariants` row
5. Run Gemini classification on the reference to extract: color hex, acabado (glossy/matte/satin), forma (almond/square/oval/coffin/stiletto), estilo (french/sólido/arte/degradé/chrome)
6. Update `nailStyles` with extracted metadata

### Gemini models
- Primary: `gemini-3.1-flash-image-preview` (image gen)
- Fallback: `gemini-2.5-flash-preview-05-20`
- Classification: `gemini-2.5-flash-preview-05-20` (text only, cheaper)

### Master base images
Located at `public/bases/`: `garra.jpg`, `ascendente.jpg`, `doble.jpg`, `rocio.jpg`
These are the 4 canonical hand poses that every design gets applied to.

### Prompt structure (image gen)
```
Extract ONLY the nail design (color, pattern, art, finish) from the REFERENCE PHOTO.
Apply it onto the bare nails in the BASE PHOTO.
Keep ALL other aspects unchanged: hand pose, skin tone, lighting, background.
Result must be photorealistic, professional nail salon quality.
```

### Error handling
- Each variant tracked individually — one Gemini failure doesn't kill the whole design
- Retry logic: up to 3 attempts with 2s backoff per variant
- After all variants attempted, set `catalogQueue.status` = done (even if some variants errored)

---

## 3. Carousel Component

**File:** `src/components/catalog/NailCarousel.tsx`

### Behavior
- Horizontally scrollable row of cards, auto-scrolls at 38 px/s using `requestAnimationFrame`
- Pause button (top-right) toggles auto-scroll; hovering a card also pauses
- Mobile touch: `touchend` restarts scroll after 1800ms grace period
- Edge fades via `mask-image: linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)`
- Seamless loop: when `scrollLeft >= max - 1`, reset to 0 (with `scrollBehavior: 'auto'` momentarily)
- Progress dots below carousel (one per design, highlight active)

### Card design (2:3 ratio)
- White card, no shadow, 8px border-radius
- Full-bleed image (thumbnail = first variant, `garra` pose)
- Bottom strip: design name in Cormorant Garamond, color chip, acabado badge
- Hover: subtle scale(1.02) with 300ms ease

### Data
Cards rendered server-side from DB: `nailStyles` WHERE `published = true` ORDER BY `sortOrder`

---

## 4. Overlay — Card Stack

When a carousel card is clicked:
1. Carousel dims (backdrop overlay `rgba(254,249,247,0.85)` + `backdrop-filter: blur(8px)`)
2. Card stack appears centered: 4 cards stacked with `translate()+rotate()+scale()` transforms
3. Front card = `garra` pose; arrows cycle through poses: garra → ascendente → doble → rocío
4. Spring animation: `cubic-bezier(0.34,1.15,0.64,1)` 520ms, incoming card comes from behind to front
5. Mobile: swipe left/right on the deck cycles poses; swipe up/down = no action
6. Back button (top-left) or click outside stack → close overlay, resume carousel

**File:** `src/components/catalog/DesignOverlay.tsx`

State: `{ activeDesignId, activePoseIndex }` — lifted to parent page, not global store.

---

## 5. Logo Integration

**SVG approach** (current): Inline SVG recreation in `src/components/layout/Navbar.tsx`
- "Caiena" wordmark: `#3A1020` (plum)
- "BEAUTY NAILS" subtitle + nail drop ornament: `#B76E79` (rose gold)
- Works on any background, no image load

**True PNG** (deferred): `scripts/process-logo.mjs` produces `public/logo-caiena.png` but Gemini returns JPEG. Fix: use sharp/jimp to convert in post. Not blocking for launch.

---

## 6. Hero Animation

**File:** `src/components/landing/HeroNails.tsx`

5 nail shapes in a fan arrangement. Each nail has:
- Outer shape (clip-path SVG or border-radius)
- Inner `.fill` div that animates `translateY(100% → 0%)` — the "paint rising" effect
- `::after` pseudo-element with `wave` keyframe for liquid surface wobble
- Staggered animation delays: 0ms, 150ms, 300ms, 450ms, 600ms

Colors (left to right): champagne → rose → plum → rose-dark → champagne
Floating nail drop SVG echoes the logo ornament, drifts up/down with `float` keyframe.

---

## 7. Admin Panel

**Extend:** `src/components/admin/AdminNailStylesTab.tsx` (existing file)

Add "Upload New Design" flow:
1. File input → preview reference image
2. Submit → POST `/api/admin/catalog/generate`
3. API route: inserts `catalogQueue` + `nailStyles` (published=false), triggers pipeline for 4 variants, returns job ID
4. Poll `GET /api/admin/catalog/status/:jobId` every 3s — show per-variant progress
5. Once all done: show 4 generated images side by side, editable metadata fields (name, color, acabado, forma, estilo), Publish button
6. Publish: sets `nailStyles.published = true`, assigns `sortOrder = MAX(sortOrder) + 1`

No background job queue needed — the generate route runs synchronously (Gemini calls are ~3–8s each, 4 variants = ~15–30s, acceptable for admin context with a loading state).

---

## 8. User Dashboard Integration

**File:** `src/app/dashboard/page.tsx` (or wherever the user dashboard lives)

- Same `<NailCarousel>` component, same data, same overlay behavior
- On pose selection in overlay: "Seleccionar este diseño" button appears
- Clicking it: sets `selectedDesignId + selectedPoseId` in form state for the booking form
- Selected design shows as a confirmation chip in the appointment booking section
- The booking itself (WhatsApp redirect / calendar) is unchanged — design info appended to message

---

## 9. API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/admin/catalog/generate` | POST | Start pipeline for uploaded image |
| `/api/admin/catalog/status/:jobId` | GET | Poll variant generation progress |
| `/api/admin/catalog/publish/:styleId` | POST | Publish a design (set published=true) |
| `/api/catalog` | GET | Public: return published designs with variants |

All admin routes protected by existing session/auth middleware.

---

## 10. File Structure

```
src/
  components/
    catalog/
      NailCarousel.tsx        # Auto-scroll carousel
      CarouselCard.tsx        # Single card
      DesignOverlay.tsx       # Stack + arrows overlay
    landing/
      HeroNails.tsx           # Nail paint animation
    layout/
      Navbar.tsx              # SVG logo inline
    admin/
      AdminNailStylesTab.tsx  # Extended with upload flow
  app/
    api/
      catalog/route.ts
      admin/catalog/
        generate/route.ts
        status/[jobId]/route.ts
        publish/[styleId]/route.ts
public/
  bases/                      # 4 master base images
  catalog-preview/            # Generated variants <styleId>/<baseId>.jpg
scripts/
  apply-designs.mjs           # Batch pipeline (existing, extended)
  process-logo.mjs            # Logo processor (existing)
src/db/
  schema.ts                   # Extended with variants + queue tables
```

---

## 11. Out of Scope (Deferred)

- True PNG logo conversion (SVG fallback used for now)
- Dark mode activation (tokens defined in CSS, toggle deferred)
- User-uploaded "designs I found online" (admin-only for now)
- Infinite scroll / pagination for large catalogs (direct link to designs with >20 published)
- AI try-on (virtual nail overlay on user's photo) — separate future spec

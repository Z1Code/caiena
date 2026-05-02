# Frontend Redesign — Glass & Bloom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Caiena landing page into a Glass & Bloom premium experience with morphing blobs, Framer Motion scroll reveal, a selectable service catalog with image carousels, and a sticky WhatsApp summary bar.

**Architecture:** CSS morphing blobs live entirely in `globals.css` (no JS). Framer Motion wraps sections as thin `'use client'` wrappers. The service catalog is a client component fed by a server-fetched list from the DB. Admin image management is a new tab in the existing admin dashboard.

**Tech Stack:** Next.js 16.2.4, React 19, Tailwind CSS v4, Framer Motion, Drizzle ORM + Neon PostgreSQL, framer-motion (new dependency)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/globals.css` | Modify | Add `.glass-card`, `.blob`, `.blob-rose`, `.blob-gold`, `.blob-warm`, `@keyframes blob-morph` |
| `src/db/schema.ts` | Modify | Add `images text[]`, `sortOrder integer` to services table |
| `src/components/hero.tsx` | Modify | Add 4 morphing blobs + floating glass card with top 3 services |
| `src/components/services.tsx` | Rewrite | DB-fetched server component → renders `<ServicesCatalog>` |
| `src/components/services-catalog.tsx` | Create | `'use client'` — service cards grid + selection state |
| `src/components/service-card.tsx` | Create | `'use client'` — individual card: image carousel + select toggle |
| `src/components/sticky-summary.tsx` | Create | `'use client'` — slide-up bar with selected services + WA button |
| `src/components/scroll-reveal.tsx` | Create | `'use client'` — Framer Motion `whileInView` wrapper component |
| `src/components/about.tsx` | Modify | Add blobs + `<ScrollReveal>` wrapper |
| `src/components/gallery.tsx` | Modify | Glass overlay on hover + `<ScrollReveal>` |
| `src/components/testimonials.tsx` | Modify | Glass cards + `<ScrollReveal>` |
| `src/components/footer.tsx` | Modify | Subtle blob |
| `src/components/booking.tsx` | Modify | Add blobs + `<ScrollReveal>` |
| `src/app/page.tsx` | Modify | Add `<StickyBar>` below `<Services />` |
| `src/app/api/booking/wa-link-multi/route.ts` | Create | `GET ?svcIds=1,2,3` → wa.me BOOKING URL |
| `src/app/api/admin/services/route.ts` | Create | GET list + POST create |
| `src/app/api/admin/services/[id]/route.ts` | Create | PUT update + DELETE soft-delete |
| `src/app/api/admin/services/[id]/images/route.ts` | Create | POST image upload |
| `src/app/api/admin/services/[id]/images/[filename]/route.ts` | Create | DELETE image |
| `src/app/admin/servicios/page.tsx` | Create | Admin services management UI |
| `src/components/admin-services-tab.tsx` | Create | Admin services tab component |
| `src/lib/whatsapp-bot.ts` | Modify | Add `handleBookingRequest` for `BOOKING|` payload |
| `public/uploads/services/` | Create dir | Service image storage |

---

## Task 1: Install Framer Motion + Add Blob CSS Utilities

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/app/globals.css`

- [ ] **Step 1: Install framer-motion**

```bash
cd C:\Nails\caiena && npm install framer-motion
```

Expected: framer-motion added to `dependencies` in package.json.

- [ ] **Step 2: Add blob CSS utilities to `src/app/globals.css`**

Add after the `.shimmer-btn` block:

```css
/* ── Glass card ────────────────────────────────────── */
.glass-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.80);
  box-shadow: 0 4px 24px rgba(140, 104, 84, 0.08);
}

/* ── Morphing blobs ────────────────────────────────── */
@keyframes blob-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  50%       { border-radius: 50% 40% 60% 30% / 40% 50% 60% 50%; }
  75%       { border-radius: 40% 70% 30% 60% / 60% 40% 50% 40%; }
}

@keyframes blob-morph-b {
  0%, 100% { border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%; }
  50%       { border-radius: 60% 40% 30% 70% / 40% 70% 30% 60%; }
}

.blob {
  position: absolute;
  filter: blur(55px);
  animation: blob-morph 10s ease-in-out infinite;
  pointer-events: none;
}

.blob-b {
  animation: blob-morph-b 8s ease-in-out infinite;
}

.blob-rose  { background: rgba(201, 144, 143, 0.28); }
.blob-gold  { background: rgba(196, 162, 101, 0.20); }
.blob-warm  { background: rgba(184, 144, 122, 0.22); }
```

- [ ] **Step 3: Verify globals.css compiles**

Start dev server and check no CSS errors in browser console:

```bash
cd C:\Nails\caiena && npm run dev
```

Expected: Server starts on port 3007, no PostCSS errors.

- [ ] **Step 4: Commit**

```bash
cd C:\Nails\caiena && git add src/app/globals.css package.json package-lock.json && git commit -m "feat: install framer-motion and add blob/glass-card CSS utilities"
```

---

## Task 2: Database Migration — Add images and sort_order to Services

**Files:**
- Modify: `src/db/schema.ts`
- Run: SQL migration on Neon DB

- [ ] **Step 1: Add columns to Drizzle schema in `src/db/schema.ts`**

Find the `services` table definition and add two columns after `active`:

```typescript
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  active: boolean("active").notNull().default(true),
  images: text("images").array().default([]),
  sortOrder: integer("sort_order").default(0),
});
```

- [ ] **Step 2: Update the `Service` type export**

The `Service` type at the bottom of schema.ts is automatically inferred — no change needed since it uses `$inferSelect`.

- [ ] **Step 3: Run SQL migration on Neon**

SSH into the VPS and run the migration (or run locally with `DATABASE_URL`):

```bash
DATABASE_URL="$(grep DATABASE_URL /var/www/caiena/.env.local | cut -d= -f2-)" npx drizzle-kit push
```

Or manually on Neon console:

```sql
ALTER TABLE services ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
```

Expected: Migration succeeds, no errors.

- [ ] **Step 4: Verify schema locally**

```bash
cd C:\Nails\caiena && npx drizzle-kit studio
```

Expected: Drizzle Studio shows `images` and `sort_order` columns in the services table.

- [ ] **Step 5: Commit**

```bash
cd C:\Nails\caiena && git add src/db/schema.ts && git commit -m "feat: add images and sort_order columns to services table"
```

---

## Task 3: New API Endpoints — Admin Services CRUD + Image Upload

**Files:**
- Create: `src/app/api/admin/services/route.ts`
- Create: `src/app/api/admin/services/[id]/route.ts`
- Create: `src/app/api/admin/services/[id]/images/route.ts`
- Create: `src/app/api/admin/services/[id]/images/[filename]/route.ts`
- Create: `public/uploads/services/.gitkeep`

- [ ] **Step 1: Create `src/app/api/admin/services/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.id));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, durationMinutes, price, category } = body;

  if (!name || !description || !durationMinutes || price == null || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [created] = await db
    .insert(services)
    .values({ name, description, durationMinutes, price, category })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Create `src/app/api/admin/services/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svcId = parseInt(id);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const { name, description, durationMinutes, price, category, active, sortOrder, images } = body;

  const updateData: Partial<{
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    category: string;
    active: boolean;
    sortOrder: number;
    images: string[];
  }> = {};

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
  if (price !== undefined) updateData.price = price;
  if (category !== undefined) updateData.category = category;
  if (active !== undefined) updateData.active = active;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (images !== undefined) updateData.images = images;

  const [updated] = await db
    .update(services)
    .set(updateData)
    .where(eq(services.id, svcId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svcId = parseInt(id);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Soft delete — set active = false
  const [updated] = await db
    .update(services)
    .set({ active: false })
    .where(eq(services.id, svcId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create `public/uploads/services/` directory**

```bash
mkdir -p C:\Nails\caiena\public\uploads\services
echo "" > C:\Nails\caiena\public\uploads\services\.gitkeep
```

- [ ] **Step 4: Create `src/app/api/admin/services/[id]/images/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svcId = parseInt(id);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingImages = service.images ?? [];
  if (existingImages.length >= 6) {
    return NextResponse.json({ error: "Maximum 6 images per service" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `svc-${svcId}-${Date.now()}.${ext}`;
  const savePath = path.join(process.cwd(), "public", "uploads", "services", filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(savePath, buffer);

  const url = `/uploads/services/${filename}`;
  const updatedImages = [...existingImages, url];

  await db.update(services).set({ images: updatedImages }).where(eq(services.id, svcId));

  return NextResponse.json({ url }, { status: 201 });
}
```

- [ ] **Step 5: Create `src/app/api/admin/services/[id]/images/[filename]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;
  const svcId = parseInt(id);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Sanitize filename — no path traversal
  const safeName = path.basename(filename);
  const url = `/uploads/services/${safeName}`;

  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updatedImages = (service.images ?? []).filter((img) => img !== url);
  await db.update(services).set({ images: updatedImages }).where(eq(services.id, svcId));

  try {
    const filePath = path.join(process.cwd(), "public", "uploads", "services", safeName);
    await unlink(filePath);
  } catch {
    // File already gone — that's fine
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Test the GET endpoint**

With dev server running:
```bash
curl http://localhost:3007/api/admin/services
```

Expected: JSON array of all services.

- [ ] **Step 7: Commit**

```bash
cd C:\Nails\caiena && git add src/app/api/admin/ public/uploads/ && git commit -m "feat: admin services CRUD and image upload API endpoints"
```

---

## Task 4: New API — Multi-Service WhatsApp Link

**Files:**
- Create: `src/app/api/booking/wa-link-multi/route.ts`

- [ ] **Step 1: Create `src/app/api/booking/wa-link-multi/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { inArray } from "drizzle-orm";

const BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "";

/**
 * GET ?svcIds=1,2,3
 * Returns { waUrl: "https://wa.me/12057940509?text=BOOKING|1,2,3", serviceNames: [...] }
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("svcIds") ?? "";
  const ids = raw
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  if (!ids.length) {
    return NextResponse.json({ error: "Missing svcIds" }, { status: 400 });
  }

  if (!BUSINESS_PHONE) {
    return NextResponse.json({ error: "WhatsApp not configured" }, { status: 500 });
  }

  const found = await db.select().from(services).where(inArray(services.id, ids));
  if (!found.length) return NextResponse.json({ error: "No services found" }, { status: 404 });

  const serviceNames = found.map((s) => s.name);
  const payload = `BOOKING|${ids.join(",")}`;
  const waUrl = `https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(payload)}`;

  return NextResponse.json({ waUrl, serviceNames });
}
```

- [ ] **Step 2: Test the endpoint**

```bash
curl "http://localhost:3007/api/booking/wa-link-multi?svcIds=1,2"
```

Expected: `{ "waUrl": "https://wa.me/12057940509?text=BOOKING%7C1%2C2", "serviceNames": [...] }`

- [ ] **Step 3: Commit**

```bash
cd C:\Nails\caiena && git add src/app/api/booking/wa-link-multi/ && git commit -m "feat: add /api/booking/wa-link-multi endpoint for multi-service WhatsApp link"
```

---

## Task 5: WhatsApp Bot — Handle BOOKING| Payload

**Files:**
- Modify: `src/lib/whatsapp-bot.ts`

- [ ] **Step 1: Add `handleBookingRequest` function to `src/lib/whatsapp-bot.ts`**

Add this function after the `handleVerifyLink` function (before `sendWelcome`):

```typescript
async function handleBookingRequest(from: string, idsStr: string): Promise<void> {
  const ids = idsStr
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  if (!ids.length) {
    await sendWelcome(from);
    return;
  }

  const found = await db.select().from(services).where(inArray(services.id, ids));
  if (!found.length) {
    await sendText(from, "No pudimos encontrar los servicios seleccionados. Intenta de nuevo desde la web.");
    return;
  }

  const serviceList = found.map((s) => `• ${s.name}`).join("\n");
  await sendText(
    from,
    `¡Hola! Quieres agendar:\n${serviceList}\n\n¿Para qué fecha te gustaría? 📅`
  );

  // Save session so the bot knows which service to book next
  // Use the first service for the date/time flow
  const firstSvc = found[0];
  const nameSession = await getNameSession(from);
  if (!nameSession) {
    // Store the booking context — reuse name session data structure
    await saveNameSession(from, {
      svcId: firstSvc.id,
      date: "",   // will be filled by date selection
      time: "",   // will be filled by time selection
    });
  }

  // Show available dates for the first service
  await handleSvcSelected(from, firstSvc.id);
}
```

- [ ] **Step 2: Add `inArray` import to the imports at the top of `src/lib/whatsapp-bot.ts`**

Find the line:
```typescript
import { eq, and, gte, lte, gt, isNull } from "drizzle-orm";
```

Change it to:
```typescript
import { eq, and, gte, lte, gt, isNull, inArray } from "drizzle-orm";
```

- [ ] **Step 3: Add BOOKING| routing in the `handleMessage` function**

In the `handleMessage` function, add this block before the `if (input.startsWith("CAIENA|VERIFY|"))` check:

```typescript
  // Multi-service booking from landing page catalog
  if (input && input.startsWith("BOOKING|")) {
    const idsStr = input.slice("BOOKING|".length).trim();
    await handleBookingRequest(from, idsStr);
    return;
  }
```

- [ ] **Step 4: Verify the bot compiles**

```bash
cd C:\Nails\caiena && npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd C:\Nails\caiena && git add src/lib/whatsapp-bot.ts && git commit -m "feat: whatsapp bot handles BOOKING| multi-service payload from landing catalog"
```

---

## Task 6: Scroll Reveal Wrapper Component

**Files:**
- Create: `src/components/scroll-reveal.tsx`

- [ ] **Step 1: Create `src/components/scroll-reveal.tsx`**

```typescript
"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger index — each child increments delay by 0.08s */
  index?: number;
  /** Custom y offset. Default 32. */
  y?: number;
}

export function ScrollReveal({ children, className, index = 0, y = 32 }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            delay: index * 0.08,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a section container — staggers all direct ScrollReveal children */
export function ScrollRevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Same as ScrollReveal but uses spring physics */
export function SpringReveal({ children, className, index = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      whileInView={{
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          delay: index * 0.08,
          type: "spring",
          stiffness: 200,
          damping: 20,
        },
      }}
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Nails\caiena && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd C:\Nails\caiena && git add src/components/scroll-reveal.tsx && git commit -m "feat: add ScrollReveal, ScrollRevealGroup, SpringReveal Framer Motion components"
```

---

## Task 7: Hero — Morphing Blobs + Floating Glass Card

**Files:**
- Modify: `src/components/hero.tsx`

- [ ] **Step 1: Rewrite `src/components/hero.tsx`**

Replace the entire file content:

```typescript
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function Hero() {
  const topServices = await db
    .select({ name: services.name, durationMinutes: services.durationMinutes })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder), asc(services.id))
    .limit(3);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay"
    >
      {/* Layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-blush/20" />

      {/* Morphing blobs */}
      <div className="blob blob-rose w-[480px] h-[480px] top-[-60px] right-[-80px] opacity-70" />
      <div className="blob blob-b blob-gold w-[360px] h-[360px] bottom-[-40px] left-[-60px] opacity-60" />
      <div className="blob blob-warm w-[280px] h-[280px] top-[40%] left-[15%] opacity-40" />
      <div className="blob blob-b blob-rose w-[200px] h-[200px] bottom-[20%] right-[10%] opacity-30" />

      {/* Diagonal accent line */}
      <div className="absolute top-0 right-[30%] w-px h-[40vh] bg-gradient-to-b from-transparent via-accent-light/30 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left: main content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Logo mark */}
            <div className="animate-scale-in mb-10 flex justify-center lg:justify-start">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blush/80 to-accent-light/50 border border-accent-light/40 flex items-center justify-center shadow-lg shadow-accent/10">
                <span className="font-serif text-4xl text-accent-dark italic">C</span>
              </div>
            </div>

            {/* Tagline */}
            <p className="animate-fade-up text-muted tracking-[0.4em] uppercase text-[10px] sm:text-xs mb-6 font-medium">
              Nail Art Studio &middot; Leander, Texas
            </p>

            {/* Main title */}
            <h1 className="animate-fade-up [animation-delay:100ms] font-serif text-6xl sm:text-7xl md:text-8xl font-semibold text-foreground leading-[0.9] tracking-tight mb-8">
              <span className="block">Cai</span>
              <span className="block gradient-text italic">ena</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-up [animation-delay:200ms] text-base sm:text-lg text-foreground/50 max-w-md mx-auto lg:mx-0 mb-4 leading-relaxed font-light">
              Donde cada una es una obra de arte.
              <br className="hidden sm:block" />
              Manicure, pedicure y disenos personalizados.
            </p>

            {/* Location badge */}
            <div className="animate-fade-up [animation-delay:300ms] inline-flex items-center gap-2 text-xs text-muted mb-12 px-4 py-2 rounded-full border border-accent-light/30 bg-white/50">
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Home Studio &middot; Leander, TX
            </div>

            {/* CTAs */}
            <div className="animate-fade-up [animation-delay:400ms] flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#servicios"
                className="shimmer-btn bg-foreground text-white px-10 py-4 rounded-full text-sm tracking-[0.15em] uppercase hover:bg-accent-dark transition-colors shadow-xl shadow-foreground/10"
              >
                Ver Servicios
              </a>
              <a
                href="/prueba-virtual"
                className="group flex items-center gap-2 px-8 py-4 rounded-full text-sm tracking-wide text-foreground/70 border border-foreground/10 hover:border-accent/40 hover:text-accent-dark transition-all"
              >
                <svg className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Probar con IA
              </a>
            </div>

            {/* Stats row */}
            <div className="animate-fade-up [animation-delay:600ms] mt-16 flex items-center justify-center lg:justify-start gap-12 sm:gap-16">
              <div className="text-center">
                <span className="block font-serif text-3xl sm:text-4xl font-semibold gradient-text">★ 5.0</span>
                <span className="text-[10px] text-muted tracking-widest uppercase mt-1 block">Rating</span>
              </div>
              <div className="w-px h-10 bg-accent-light/40" />
              <div className="text-center">
                <span className="block font-serif text-3xl sm:text-4xl font-semibold gradient-text">200+</span>
                <span className="text-[10px] text-muted tracking-widest uppercase mt-1 block">Trabajos</span>
              </div>
              <div className="w-px h-10 bg-accent-light/40" />
              <div className="text-center">
                <span className="block font-serif text-3xl sm:text-4xl font-semibold gradient-text">5+</span>
                <span className="text-[10px] text-muted tracking-widest uppercase mt-1 block">Anos Exp.</span>
              </div>
            </div>
          </div>

          {/* Right: floating glass card — top services */}
          {topServices.length > 0 && (
            <div className="animate-fade-up [animation-delay:500ms] w-full lg:w-72 flex-shrink-0">
              <div className="glass-card rounded-3xl p-6">
                <p className="text-[10px] text-muted tracking-[0.3em] uppercase mb-4">Servicios populares</p>
                <div className="flex flex-col gap-3">
                  {topServices.map((svc, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-accent-light/20 last:border-0">
                      <span className="text-sm font-medium text-foreground/80">{svc.name}</span>
                      <span className="text-xs text-muted ml-2 whitespace-nowrap">{svc.durationMinutes} min</span>
                    </div>
                  ))}
                </div>
                <a
                  href="#servicios"
                  className="mt-5 w-full block text-center text-xs tracking-[0.1em] uppercase text-accent-dark border border-accent/30 rounded-full py-2.5 hover:bg-accent hover:text-white transition-all"
                >
                  Ver todos
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in [animation-delay:1s]">
        <div className="w-5 h-8 rounded-full border border-accent-light/40 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-accent/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify in browser**

With dev server running, open http://localhost:3007. Expected: Blobs visible in hero background, floating glass card on right side with service names.

- [ ] **Step 3: Commit**

```bash
cd C:\Nails\caiena && git add src/components/hero.tsx && git commit -m "feat: hero section with morphing blobs and floating glass card"
```

---

## Task 8: Service Card Component with Image Carousel + Select Toggle

**Files:**
- Create: `src/components/service-card.tsx`

- [ ] **Step 1: Create `src/components/service-card.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

interface ServiceCardProps {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  images: string[];
  selected: boolean;
  onToggle: (id: number) => void;
  index: number;
}

export function ServiceCard({
  id,
  name,
  description,
  durationMinutes,
  images,
  selected,
  onToggle,
  index,
}: ServiceCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const hasImages = images.length > 0;

  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentImage((i) => (i + 1) % images.length);
    }
  }, [images.length]);

  // Auto-cycle every 3s, pause on hover handled by CSS
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(nextImage, 3000);
    return () => clearInterval(interval);
  }, [images.length, nextImage]);

  return (
    <div
      onClick={() => onToggle(id)}
      style={{ animationDelay: `${index * 80}ms` }}
      className={`
        relative rounded-3xl overflow-hidden cursor-pointer select-none
        transition-all duration-300
        ${selected
          ? "ring-2 ring-accent scale-[1.02] shadow-xl shadow-accent/15"
          : "hover:scale-[1.01] hover:shadow-lg hover:shadow-accent/10"}
        glass-card
        animate-fade-up
      `}
    >
      {/* Image carousel */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blush/40 to-accent-light/20 group">
        {hasImages ? (
          <>
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${name} ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  i === currentImage ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            {/* Carousel dots */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentImage ? "bg-white w-3" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full">
          {durationMinutes} min
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-medium text-foreground truncate">
              {name}
            </h3>
            <p className="text-xs text-foreground/45 leading-relaxed mt-1 line-clamp-2">
              {description}
            </p>
          </div>

          {/* Select toggle */}
          <div
            className={`
              flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center
              transition-all duration-200
              ${selected
                ? "bg-accent border-accent text-white scale-110"
                : "border-accent-light/50 bg-white/50"}
            `}
          >
            {selected && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Selected overlay accent */}
      {selected && (
        <div className="absolute inset-0 rounded-3xl ring-2 ring-accent pointer-events-none" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Nails\caiena && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd C:\Nails\caiena && git add src/components/service-card.tsx && git commit -m "feat: ServiceCard with image carousel and select toggle"
```

---

## Task 9: Sticky Summary Bar Component

**Files:**
- Create: `src/components/sticky-summary.tsx`

- [ ] **Step 1: Create `src/components/sticky-summary.tsx`**

```typescript
"use client";

import { useState } from "react";

interface SelectedService {
  id: number;
  name: string;
}

interface StickySummaryProps {
  selected: SelectedService[];
  onRemove: (id: number) => void;
}

export function StickySummary({ selected, onRemove }: StickySummaryProps) {
  const [loading, setLoading] = useState(false);

  if (selected.length === 0) return null;

  async function handleWhatsApp() {
    if (loading) return;
    setLoading(true);
    try {
      const ids = selected.map((s) => s.id).join(",");
      const res = await fetch(`/api/booking/wa-link-multi?svcIds=${ids}`);
      const data = await res.json();
      if (data.waUrl) {
        window.open(data.waUrl, "_blank");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${selected.length > 0 ? "translate-y-0" : "translate-y-full"}
      `}
    >
      <div className="glass-card border-t border-white/60 shadow-2xl shadow-accent/10 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Selected chips */}
          <div className="flex-1 flex flex-wrap gap-2">
            {selected.map((svc) => (
              <span
                key={svc.id}
                className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent-dark text-xs px-3 py-1.5 rounded-full"
              >
                {svc.name}
                <button
                  onClick={() => onRemove(svc.id)}
                  className="text-accent/50 hover:text-accent transition-colors ml-0.5"
                  aria-label={`Remove ${svc.name}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <button
            onClick={handleWhatsApp}
            disabled={loading}
            className="flex-shrink-0 flex items-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white px-6 py-3.5 rounded-2xl font-medium text-sm tracking-wide shadow-lg shadow-[#25D366]/25 transition-all active:scale-95 disabled:opacity-70"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {loading ? "Generando enlace..." : `Reservar por WhatsApp (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Nails\caiena && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd C:\Nails\caiena && git add src/components/sticky-summary.tsx && git commit -m "feat: StickySummary bar with selected service chips and WhatsApp CTA"
```

---

## Task 10: Services Catalog — Client Component with Selection State

**Files:**
- Create: `src/components/services-catalog.tsx`
- Rewrite: `src/components/services.tsx`

- [ ] **Step 1: Create `src/components/services-catalog.tsx`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { ServiceCard } from "@/components/service-card";
import { StickySummary } from "@/components/sticky-summary";

interface Service {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  images: string[] | null;
}

interface ServicesCatalogProps {
  services: Service[];
}

export function ServicesCatalog({ services }: ServicesCatalogProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleService = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const removeService = useCallback((id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const selectedServices = services
    .filter((s) => selectedIds.includes(s.id))
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            name={service.name}
            description={service.description}
            durationMinutes={service.durationMinutes}
            images={service.images ?? []}
            selected={selectedIds.includes(service.id)}
            onToggle={toggleService}
            index={index}
          />
        ))}
      </div>

      <StickySummary selected={selectedServices} onRemove={removeService} />
    </>
  );
}
```

- [ ] **Step 2: Rewrite `src/components/services.tsx`**

Replace the entire file:

```typescript
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ServicesCatalog } from "@/components/services-catalog";

export async function Services() {
  const activeServices = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      images: services.images,
      sortOrder: services.sortOrder,
    })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder), asc(services.id));

  return (
    <section id="servicios" className="py-28 sm:py-36 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream/30 to-white" />

      {/* Blob accent */}
      <div className="blob blob-rose w-[500px] h-[500px] top-[-100px] right-[-150px] opacity-20" />

      {/* Decorative corner */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-8 left-8 w-px h-16 bg-accent-light/40" />
        <div className="absolute top-8 left-8 w-16 h-px bg-accent-light/40" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-16 gap-4">
          <div>
            <p className="text-muted tracking-[0.4em] uppercase text-[10px] mb-3">
              Servicios
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-tight">
              Elige tu
              <br />
              <span className="italic gradient-text">experiencia</span>
            </h2>
          </div>
          <p className="text-xs text-muted/70 max-w-xs sm:text-right">
            Selecciona uno o más servicios y reserva directo por WhatsApp
          </p>
        </div>

        <ServicesCatalog services={activeServices} />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify in browser**

Check http://localhost:3007/#servicios. Expected: Glass cards appear for each service, clicking toggles selection, sticky bar slides up when ≥1 selected.

- [ ] **Step 4: Commit**

```bash
cd C:\Nails\caiena && git add src/components/services-catalog.tsx src/components/services.tsx && git commit -m "feat: services section rewritten as selectable catalog with image carousels"
```

---

## Task 11: Framer Motion Scroll Reveal — All Sections

**Files:**
- Modify: `src/components/about.tsx`
- Modify: `src/components/gallery.tsx`
- Modify: `src/components/testimonials.tsx`
- Modify: `src/components/booking.tsx` (if it exists as a section)
- Modify: `src/components/footer.tsx`

- [ ] **Step 1: Update `src/components/about.tsx`**

Replace the entire file:

```typescript
import { ScrollReveal, SpringReveal } from "@/components/scroll-reveal";

export function About() {
  return (
    <section id="sobre-mi" className="py-28 sm:py-36 relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-white" />

      {/* Blobs */}
      <div className="blob blob-warm w-[400px] h-[400px] bottom-[-80px] left-[-100px] opacity-25" />
      <div className="blob blob-b blob-gold w-[300px] h-[300px] top-[-40px] right-[-60px] opacity-20" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Image side */}
          <SpringReveal className="lg:col-span-5 relative">
            <div className="aspect-[3/4] rounded-[2rem] bg-gradient-to-br from-blush/60 via-accent-light/30 to-cream overflow-hidden relative">
              <div className="absolute inset-3 rounded-[1.5rem] border border-white/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/60 border border-accent-light/40 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-accent/5">
                    <span className="font-serif text-2xl text-accent-dark italic">R</span>
                  </div>
                  <p className="text-sm font-medium text-accent-dark">Roxanna</p>
                  <p className="text-[10px] text-muted tracking-wider">@roxannaacosta</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-light/20 to-blush/30 -z-10 hidden lg:block" />
            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-rose/10 -z-10 hidden lg:block" />
          </SpringReveal>

          {/* Content side */}
          <div className="lg:col-span-6 lg:col-start-7">
            <ScrollReveal index={0}>
              <p className="text-muted tracking-[0.4em] uppercase text-[10px] mb-3">La Artista</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-tight mb-8">
                Hola, soy
                <br />
                <span className="italic gradient-text">Roxanna</span>
              </h2>
            </ScrollReveal>

            <div className="space-y-5 text-foreground/50 leading-relaxed">
              <ScrollReveal index={1}>
                <p>
                  Soy una apasionada del arte en unas con anos de experiencia
                  creando disenos unicos para cada clienta.
                </p>
              </ScrollReveal>
              <ScrollReveal index={2}>
                <p>
                  Trabajo desde la comodidad de mi hogar en Leander, TX, ofreciendo
                  un ambiente relajado y privado donde disfrutas de un servicio
                  profesional sin las prisas de un salon tradicional.
                </p>
              </ScrollReveal>
              <ScrollReveal index={3}>
                <p className="text-foreground/70 font-medium">
                  Cada set de unas es una oportunidad para expresar tu personalidad.
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal index={4} className="mt-10">
              <a
                href="https://www.instagram.com/caiena.us"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-sm w-fit"
              >
                <div className="w-10 h-10 rounded-full border border-accent-light/40 flex items-center justify-center group-hover:bg-accent group-hover:text-white group-hover:border-accent text-accent-dark transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </div>
                <span className="text-foreground/50 group-hover:text-accent-dark transition-colors">@caiena.us</span>
              </a>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `src/components/gallery.tsx`**

Replace the entire file:

```typescript
import { ScrollReveal, ScrollRevealGroup } from "@/components/scroll-reveal";

const galleryItems = [
  { caption: "Festival Nails", color: "from-rose/30 to-accent-light/30" },
  { caption: "Gel Elegante", color: "from-accent-light/30 to-blush/30" },
  { caption: "Polygel Natural", color: "from-blush/30 to-cream" },
  { caption: "Nail Art Creativo", color: "from-accent/20 to-rose/20" },
  { caption: "Rojo Clasico", color: "from-rose/40 to-accent/20" },
  { caption: "Sugar Pink", color: "from-blush/50 to-accent-light/20" },
];

export function Gallery() {
  return (
    <section id="galeria" className="py-24 bg-cream/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">Nuestro Trabajo</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">Galeria</h2>
          <div className="w-16 h-px bg-accent mx-auto mt-4" />
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryItems.map((item, i) => (
            <ScrollReveal key={i} index={i}>
              <div
                className={`group relative aspect-square rounded-2xl bg-gradient-to-br ${item.color} overflow-hidden border border-accent-light/20 hover:border-accent/30 transition-all duration-300 cursor-pointer`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-accent/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                    </svg>
                    <p className="text-xs text-accent-dark/60">{item.caption}</p>
                  </div>
                </div>

                {/* Glass hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 glass-card flex items-end p-3">
                  <span className="text-xs font-medium text-accent-dark">{item.caption}</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </ScrollRevealGroup>

        <ScrollReveal className="text-center mt-10">
          <a
            href="https://www.instagram.com/caiena.us"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent-dark hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Ver mas en Instagram
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update `src/components/testimonials.tsx`**

Replace the entire file:

```typescript
"use client";

import { useState, useEffect } from "react";
import { SpringReveal, ScrollReveal } from "@/components/scroll-reveal";

interface Review {
  id: number;
  clientName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">Testimonios</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
            Lo que dicen nuestras clientas
          </h2>
          <div className="w-16 h-px bg-accent mx-auto mt-4" />
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review, i) => (
            <SpringReveal key={review.id} index={i}>
              <div className="glass-card rounded-2xl p-6 h-full">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }, (_, j) => (
                    <svg key={j} className={`w-4 h-4 ${j < review.rating ? "text-gold" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/60 leading-relaxed mb-4">&ldquo;{review.comment}&rdquo;</p>
                )}
                <p className="text-sm font-medium text-foreground">{review.clientName}</p>
              </div>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add blob to footer in `src/components/footer.tsx`**

Find the line `<div className="absolute inset-0 bg-foreground" />` and add a blob after it:

```typescript
      <div className="absolute inset-0 bg-foreground" />
      {/* Subtle blob */}
      <div className="blob blob-rose w-[500px] h-[500px] bottom-[-200px] right-[-100px] opacity-[0.06]" />
```

- [ ] **Step 5: Verify in browser**

Scroll through http://localhost:3007. Expected: Sections fade up with spring physics as they enter the viewport.

- [ ] **Step 6: Commit**

```bash
cd C:\Nails\caiena && git add src/components/about.tsx src/components/gallery.tsx src/components/testimonials.tsx src/components/footer.tsx && git commit -m "feat: scroll reveal animations across about, gallery, testimonials, footer"
```

---

## Task 12: Admin Services Tab

**Files:**
- Create: `src/components/admin-services-tab.tsx`
- Modify: `src/components/admin-dashboard.tsx` (add Services tab)

- [ ] **Step 1: Read the admin dashboard to understand tab structure**

Read `src/components/admin-dashboard.tsx` to find how tabs are implemented (look for `activeTab` state and tab rendering pattern).

- [ ] **Step 2: Create `src/components/admin-services-tab.tsx`**

```typescript
"use client";

import { useState, useEffect, useRef } from "react";

interface Service {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
  active: boolean;
  images: string[] | null;
  sortOrder: number | null;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  durationMinutes: 60,
  price: 0,
  category: "manicure",
};

export function AdminServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadServices() {
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    setServices(data);
    setLoading(false);
  }

  useEffect(() => { loadServices(); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/admin/services/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setEditing(null);
      setCreating(false);
      setForm(EMPTY_FORM);
      await loadServices();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(svc: Service) {
    await fetch(`/api/admin/services/${svc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !svc.active }),
    });
    await loadServices();
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Desactivar este servicio?")) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    await loadServices();
  }

  async function handleImageUpload(svc: Service, file: File) {
    const fd = new FormData();
    fd.append("image", file);
    await fetch(`/api/admin/services/${svc.id}/images`, { method: "POST", body: fd });
    await loadServices();
  }

  async function handleImageDelete(svc: Service, filename: string) {
    await fetch(`/api/admin/services/${svc.id}/images/${filename}`, { method: "DELETE" });
    await loadServices();
  }

  function startEdit(svc: Service) {
    setEditing(svc);
    setCreating(false);
    setForm({
      name: svc.name,
      description: svc.description,
      durationMinutes: svc.durationMinutes,
      price: svc.price,
      category: svc.category,
    });
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  if (loading) return <div className="text-sm text-muted py-8 text-center">Cargando servicios...</div>;

  const showForm = editing !== null || creating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Servicios</h3>
        <button
          onClick={startCreate}
          className="text-xs bg-accent/20 hover:bg-accent/30 text-accent-light border border-accent/30 rounded-lg px-4 py-2 transition-colors"
        >
          + Nuevo servicio
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-medium text-white">{editing ? "Editar servicio" : "Nuevo servicio"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              >
                <option value="manicure">Manicure</option>
                <option value="pedicure">Pedicure</option>
                <option value="extras">Extras</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">Duración (min)</label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setEditing(null); setCreating(false); }}
              className="text-xs text-white/40 hover:text-white/70 px-4 py-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs bg-accent text-white rounded-lg px-5 py-2 hover:bg-accent-dark transition-colors disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Services list */}
      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{svc.name}</span>
                  <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">{svc.category}</span>
                  {!svc.active && (
                    <span className="text-[10px] text-red-400/70 bg-red-400/10 px-2 py-0.5 rounded">Inactivo</span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-1">{svc.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-white/30">
                  <span>{svc.durationMinutes} min</span>
                  <span className="text-accent-light/70">${svc.price}</span>
                  <span>{(svc.images ?? []).length}/6 fotos</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(svc)}
                  className="text-[10px] text-white/40 hover:text-white/70 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggleActive(svc)}
                  className={`text-[10px] border rounded-lg px-3 py-1.5 transition-colors ${
                    svc.active
                      ? "text-green-400/70 border-green-400/20 hover:border-green-400/40"
                      : "text-white/30 border-white/10 hover:border-white/20"
                  }`}
                >
                  {svc.active ? "Activo" : "Inactivo"}
                </button>
              </div>
            </div>

            {/* Image management */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 flex-wrap">
                {(svc.images ?? []).map((img) => {
                  const filename = img.split("/").pop() ?? "";
                  return (
                    <div key={img} className="relative group">
                      <img src={img} alt="" className="w-12 h-12 object-cover rounded-lg" />
                      <button
                        onClick={() => handleImageDelete(svc, filename)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {(svc.images ?? []).length < 6 && (
                  <label className="w-12 h-12 border border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors">
                    <span className="text-white/30 text-lg">+</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(svc, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Read `src/components/admin-dashboard.tsx`**

Before editing, read the file to understand the tab structure, specifically how tabs are added and which state variable controls the active tab.

- [ ] **Step 4: Add Services tab to admin dashboard**

In `src/components/admin-dashboard.tsx`:

1. Add import at the top:
```typescript
import { AdminServicesTab } from "@/components/admin-services-tab";
```

2. Add "servicios" to the tabs array (find where tabs like "reservas", "personal", etc. are defined):
```typescript
{ id: "servicios", label: "Servicios" }
```

3. Add the tab panel (find where other tab content is rendered with `activeTab === "..."` conditions):
```typescript
{activeTab === "servicios" && <AdminServicesTab />}
```

- [ ] **Step 5: Verify in browser**

Open http://localhost:3007/admin, log in, and click the "Servicios" tab. Expected: List of services with edit, toggle, and image upload controls.

- [ ] **Step 6: Commit**

```bash
cd C:\Nails\caiena && git add src/components/admin-services-tab.tsx src/components/admin-dashboard.tsx && git commit -m "feat: admin services tab with CRUD, image upload, and active toggle"
```

---

## Task 13: Deploy to VPS

**Files:**
- VPS: `/var/www/caiena/`

- [ ] **Step 1: Run DB migration on VPS**

SSH into VPS and run:

```bash
ssh root@178.156.176.15
cd /var/www/caiena
DATABASE_URL="$(grep DATABASE_URL .env.local | cut -d= -f2-)" npx drizzle-kit push
```

Expected: `images` and `sort_order` columns added to services table.

- [ ] **Step 2: Pull latest code and build on VPS**

```bash
ssh root@178.156.176.15 "cd /var/www/caiena && git pull && DATABASE_URL=\$(grep DATABASE_URL .env.local | cut -d= -f2-) npm run build"
```

Expected: Build succeeds.

- [ ] **Step 3: Restart PM2**

```bash
ssh root@178.156.176.15 "cd /var/www/caiena && pm2 restart caiena"
```

Expected: PM2 shows status `online` for caiena process.

- [ ] **Step 4: Smoke test**

Open https://caiena.us (or the VPS URL). Expected:
- Blobs visible in hero
- Services section shows selectable cards
- Clicking a service selects it and shows sticky bar
- Sticky bar "Reservar por WhatsApp" opens wa.me link

- [ ] **Step 5: Final commit tag**

```bash
cd C:\Nails\caiena && git tag v2.0-glass-bloom
```

---

## Self-Review

### Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Framer Motion installed | Task 1 |
| `.glass-card` CSS utility | Task 1 |
| `.blob` CSS utilities | Task 1 |
| DB: `images text[]`, `sort_order` | Task 2 |
| Hero: 4 morphing blobs | Task 7 |
| Hero: floating glass card with top 3 services | Task 7 |
| Hero: ★ 5.0 rating stat | Task 7 |
| Services: glass cards | Task 10 |
| Services: image carousel (auto-cycle 3s) | Task 8 |
| Services: selectable toggle with checkmark | Task 8 |
| Services: no prices on public page | Task 10 |
| Services: Framer Motion stagger | Task 8 (CSS animate-fade-up with delay) |
| Sticky summary bar | Task 9 |
| Sticky: selected service chips | Task 9 |
| Sticky: WhatsApp button → wa-link-multi | Tasks 4 + 9 |
| `/api/booking/wa-link-multi` | Task 4 |
| WhatsApp bot: `BOOKING|` payload | Task 5 |
| Admin: image upload (up to 6) | Task 3 + 12 |
| Admin: price field visible | Task 12 |
| Admin: CRUD full | Task 3 + 12 |
| Admin: toggle active/inactive | Task 12 |
| Scroll reveal: gallery | Task 11 |
| Scroll reveal: testimonials (glass cards) | Task 11 |
| Scroll reveal: about | Task 11 |
| Footer: subtle blob | Task 11 |
| Gallery: glass overlay on hover | Task 11 |
| Deploy | Task 13 |

### No Placeholders Found ✓

### Type Consistency Check

- `Service` type: used as `{ id, name, description, durationMinutes, images, sortOrder }` — consistent with updated schema across Tasks 10, 12
- `SelectedService`: `{ id, name }` — consistent between `services-catalog.tsx` and `sticky-summary.tsx`
- API responses: `inArray` import added alongside existing drizzle imports — consistent
- Framer Motion `Variants` type imported from `framer-motion` in `scroll-reveal.tsx` ✓

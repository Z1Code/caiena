# Nail Catalog System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a luxury nail catalog with auto-scrolling carousel, card-stack overlay, Gemini-powered variant generation pipeline, and admin/user dashboard integration on top of the existing Next.js booking platform.

**Architecture:** Extend existing schema with `nailStyleVariants` + `catalogQueue` tables. Pipeline script scans Instagram images, generates 4 pose variants each via Gemini, tracks progress in DB. Landing page and user dashboard display a `NailCarousel` (auto-scroll RAF loop) that opens a `DesignOverlay` (spring-animated card stack) on click. Admin can upload new references and generate variants on demand.

**Tech Stack:** Next.js 16.2.4 App Router · Drizzle ORM + Neon Postgres · Gemini API (`gemini-3.1-flash-image-preview`) · Tailwind 4 · Cormorant Garamond + Jost (Google Fonts) · `requestAnimationFrame` auto-scroll · `cubic-bezier(.34,1.15,.64,1)` spring cards

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/globals.css` | Modify | Add rose/plum palette tokens + liquidRise / wave / drip / float keyframes |
| `src/app/layout.tsx` | Modify | Add Cormorant Garamond + Jost fonts |
| `src/components/navbar.tsx` | Modify | SVG wordmark logo (plum + rose gold), bigger links |
| `src/components/hero.tsx` | Replace | HeroNails: 5-nail liquid-fill animation + existing CTA logic |
| `src/db/schema.ts` | Modify | Add `nailStyleVariants`, `catalogQueue`, `published` on `nailStyles` |
| `scripts/apply-designs.mjs` | Rewrite | Batch pipeline: scan "37" images, sha256 dedup, DB tracking, classify |
| `src/app/api/catalog/route.ts` | Create | GET published designs with variants |
| `src/app/api/admin/catalog/generate/route.ts` | Create | POST: upload ref → pipeline → variants |
| `src/app/api/admin/catalog/status/[jobId]/route.ts` | Create | GET: poll variant generation progress |
| `src/app/api/admin/catalog/publish/[styleId]/route.ts` | Create | POST: set published=true |
| `src/components/catalog/NailCarousel.tsx` | Create | Auto-scroll RAF carousel |
| `src/components/catalog/DesignOverlay.tsx` | Create | Spring card-stack overlay |
| `src/app/page.tsx` | Modify | Add NailCarousel section after Hero |
| `src/components/user-dashboard.tsx` | Modify | Add NailCarousel with design selection |
| `src/components/admin-nail-styles-tab.tsx` | Modify | Upload ref → generate variants → publish flow |

---

## Task 1: Update design tokens and add animations to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add palette variables and keyframes**

Open `src/app/globals.css` and add after the existing `:root` block:

```css
/* ── Caiena luxury palette (rose/plum) ───────────────────────────── */
:root {
  --caiena-bg:        #FEF9F7;
  --caiena-bg2:       #F7EDE8;
  --caiena-rose:      #C98B8B;
  --caiena-rose-dark: #B76E79;
  --caiena-plum:      #3A1020;
  --caiena-champagne: #E8D5C4;
  --caiena-card:      #FFFFFF;
}

/* ── Catalog animations ───────────────────────────────────────────── */
@keyframes liquidRise {
  from { transform: translateY(100%); }
  to   { transform: translateY(0%); }
}

@keyframes wave {
  0%,100% { transform: translateX(0) scaleY(1); }
  50%     { transform: translateX(-6%) scaleY(1.4); }
}

@keyframes drip {
  from { height: 0; opacity: 0; }
  to   { height: clamp(16px, 3vw, 28px); opacity: 1; }
}

@keyframes nailFloat {
  0%,100% { transform: translateY(0px) rotate(-2deg); }
  50%     { transform: translateY(-10px) rotate(-2deg); }
}

@keyframes cardEntrance {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd C:/Nails/caiena && npx next build --no-lint 2>&1 | grep -E "error|Error" | head -10
```
Expected: no CSS parse errors.

- [ ] **Step 3: Commit**

```bash
cd C:/Nails/caiena && git add src/app/globals.css && git commit -m "feat: add luxury palette tokens and catalog animation keyframes"
```

---

## Task 2: Add Cormorant Garamond + Jost fonts

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add font imports**

Replace the font imports section in `src/app/layout.tsx`. The file currently imports `Geist` and `Playfair_Display`. Add `Cormorant_Garamond` and `Jost`:

```typescript
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display, Cormorant_Garamond, Jost } from "next/font/google";
import { AIChatbot } from "@/components/ai-chatbot";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});
```

- [ ] **Step 2: Add variables to html element**

Update the `<html>` tag in the same file:

```typescript
<html
  lang="es"
  className={`${geistSans.variable} ${playfair.variable} ${cormorant.variable} ${jost.variable} h-full antialiased`}
>
```

- [ ] **Step 3: Commit**

```bash
cd C:/Nails/caiena && git add src/app/layout.tsx && git commit -m "feat: add Cormorant Garamond and Jost fonts"
```

---

## Task 3: Fix navbar — SVG wordmark logo + readable nav links

**Files:**
- Modify: `src/components/navbar.tsx`

The current navbar has a tiny `w-8 h-8` circle with an italic "C" for the logo, and nav links at `text-xs`. Fix: replace circle with an inline SVG wordmark and increase link size.

- [ ] **Step 1: Replace logo and fix link sizes**

Replace the entire content of `src/components/navbar.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { AuthWidget } from "./auth-widget";

const links = [
  { href: "/#servicios", label: "Servicios" },
  { href: "/prueba-virtual", label: "Prueba IA" },
  { href: "/generador", label: "Generador" },
  { href: "/gift-cards", label: "Gift Cards" },
  { href: "/reservar", label: "Reservar" },
];

function CaienaLogo() {
  return (
    <svg
      viewBox="0 0 220 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-auto"
      aria-label="Caiena Beauty Nails"
    >
      {/* Nail drop ornament above the C */}
      <ellipse cx="19" cy="6" rx="4.5" ry="7" fill="#B76E79" opacity="0.9" />
      <path d="M14.5 10 Q19 18 23.5 10" stroke="#B76E79" strokeWidth="1.2" fill="none" />

      {/* Main wordmark: "Caiena" in plum */}
      <text
        x="0"
        y="36"
        fontFamily="var(--font-cormorant), 'Cormorant Garamond', Georgia, serif"
        fontSize="34"
        fontWeight="400"
        fill="#3A1020"
        letterSpacing="1"
      >
        Caiena
      </text>

      {/* Subtitle: "BEAUTY NAILS" in rose gold */}
      <text
        x="2"
        y="50"
        fontFamily="var(--font-jost), 'Jost', sans-serif"
        fontSize="9"
        fontWeight="300"
        fill="#B76E79"
        letterSpacing="4"
      >
        BEAUTY NAILS
      </text>
    </svg>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass border-b border-accent-light/20 shadow-sm shadow-accent/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo */}
          <a href="/" className="flex items-center group">
            <CaienaLogo />
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="elegant-underline text-sm text-foreground/70 hover:text-foreground transition-colors tracking-[0.06em] uppercase px-4 py-2"
              >
                {link.label}
              </a>
            ))}
            <AuthWidget />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-foreground/60"
            aria-label="Toggle menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`block h-px bg-current transition-all duration-300 ${open ? "rotate-45 translate-y-[4px]" : ""}`} />
              <span className={`block h-px bg-current transition-all duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`block h-px bg-current transition-all duration-300 ${open ? "-rotate-45 -translate-y-[4px]" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-6 animate-fade-in">
            <div className="flex flex-col gap-1 pt-2">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-foreground/60 hover:text-foreground px-3 py-2.5 rounded-xl hover:bg-accent-light/10 transition-colors tracking-wide"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/reservar"
                onClick={() => setOpen(false)}
                className="bg-foreground text-white text-sm px-5 py-3 rounded-full text-center mt-3 tracking-wide"
              >
                Agendar
              </a>
              <a
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="border border-foreground/20 text-foreground/70 text-sm px-5 py-3 rounded-full text-center mt-1 tracking-wide"
              >
                Mi panel
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors related to navbar.tsx.

- [ ] **Step 3: Commit**

```bash
cd C:/Nails/caiena && git add src/components/navbar.tsx && git commit -m "feat: navbar — SVG wordmark logo with plum+rose gold, larger nav links"
```

---

## Task 4: Replace Hero with nail liquid-fill animation

**Files:**
- Modify: `src/components/hero.tsx`

Keep the existing DB fetch for top services. Replace the round "C" logo mark at the top with the 5-nail fan animation. Keep all CTAs, stats, and the floating glass card.

- [ ] **Step 1: Rewrite hero.tsx**

```tsx
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// 5 nail shapes in a fan arrangement — each fills with a different palette color
const NAILS = [
  { color: "#E8D5C4", delay: "0ms",   rotate: "-20deg", tx: "-110%", height: "110px" },
  { color: "#C98B8B", delay: "150ms", rotate: "-10deg", tx: "-55%",  height: "125px" },
  { color: "#3A1020", delay: "300ms", rotate: "0deg",   tx: "0%",    height: "132px" },
  { color: "#B76E79", delay: "450ms", rotate: "10deg",  tx: "55%",   height: "125px" },
  { color: "#E8D5C4", delay: "600ms", rotate: "20deg",  tx: "110%",  height: "110px" },
];

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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-blush/20" />
      <div className="blob blob-rose w-[480px] h-[480px] top-[-60px] right-[-80px] opacity-70" />
      <div className="blob blob-b blob-gold w-[360px] h-[360px] bottom-[-40px] left-[-60px] opacity-60" />
      <div className="blob blob-warm w-[280px] h-[280px] top-[40%] left-[15%] opacity-40" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-28 sm:pt-32">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

          {/* Left: content */}
          <div className="flex-1 text-center lg:text-left">

            {/* Nail fan animation (replaces circle "C") */}
            <div className="animate-scale-in mb-10 flex justify-center lg:justify-start">
              <div className="relative h-36 w-52 flex items-end justify-center">
                {NAILS.map((nail, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0"
                    style={{
                      transform: `translateX(${nail.tx}) rotate(${nail.rotate})`,
                      transformOrigin: "bottom center",
                      width: "32px",
                      height: nail.height,
                    }}
                  >
                    {/* Nail shape */}
                    <div
                      className="w-full h-full overflow-hidden"
                      style={{
                        borderRadius: "50% 50% 12px 12px / 40% 40% 8px 8px",
                        background: "#f0e8e4",
                        border: "1.5px solid rgba(58,16,32,0.12)",
                        position: "relative",
                      }}
                    >
                      {/* Liquid fill */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          top: 0,
                          overflow: "hidden",
                          borderRadius: "inherit",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: "-10%",
                            right: "-10%",
                            height: "100%",
                            background: nail.color,
                            animation: `liquidRise 1.2s cubic-bezier(.22,1,.36,1) ${nail.delay} both`,
                          }}
                        />
                        {/* Wave surface */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "calc(100% - 6px)",
                            left: "-20%",
                            right: "-20%",
                            height: "12px",
                            background: nail.color,
                            borderRadius: "50%",
                            animation: `wave 2.4s ease-in-out ${nail.delay} infinite, liquidRise 1.2s cubic-bezier(.22,1,.36,1) ${nail.delay} both`,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                    {/* Drip */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-4px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "6px",
                        borderRadius: "0 0 50% 50%",
                        background: nail.color,
                        animation: `drip 0.6s ease ${nail.delay} both`,
                      }}
                    />
                  </div>
                ))}
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
                href="/reservar"
                className="shimmer-btn bg-foreground text-white px-10 py-4 rounded-full text-sm tracking-[0.15em] uppercase hover:bg-accent-dark transition-colors shadow-xl shadow-foreground/10"
              >
                Agendar
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

          {/* Right: floating glass card */}
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

- [ ] **Step 2: Verify it compiles**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd C:/Nails/caiena && git add src/components/hero.tsx && git commit -m "feat: hero — 5-nail liquid-fill animation replaces circle logo"
```

---

## Task 5: Extend DB schema — nailStyleVariants, catalogQueue, published

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add published column to nailStyles and two new tables**

In `src/db/schema.ts`, after the `nailStyles` table definition, add `published` to `nailStyles` and add the two new tables. Then add type exports.

Find the `nailStyles` table block that ends with:
```typescript
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

Replace that closing `});` with:
```typescript
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  published: boolean("published").notNull().default(false),
});
```

Then after the `nailStyles` block, add:

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// NAIL STYLE VARIANTS — one row per (design × base pose) image
// ─────────────────────────────────────────────────────────────────────────────
export const nailStyleVariants = pgTable(
  "nail_style_variants",
  {
    id: serial("id").primaryKey(),
    styleId: integer("style_id")
      .notNull()
      .references(() => nailStyles.id, { onDelete: "cascade" }),
    baseId: text("base_id").notNull(), // garra | ascendente | doble | rocio
    imagePath: text("image_path").notNull(), // public/ relative path
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
    status: text("status").notNull().default("done"), // done | error
    errorMsg: text("error_msg"),
  },
  (t) => [unique().on(t.styleId, t.baseId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG QUEUE — tracks source images that have been processed
// ─────────────────────────────────────────────────────────────────────────────
export const catalogQueue = pgTable("catalog_queue", {
  id: serial("id").primaryKey(),
  sourceImagePath: text("source_image_path").notNull(),
  sourceHash: text("source_hash").notNull().unique(), // sha256 hex of file content
  styleId: integer("style_id").references(() => nailStyles.id),
  status: text("status").notNull().default("queued"), // queued | processing | done | error
  errorMsg: text("error_msg"),
  queuedAt: timestamp("queued_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
```

- [ ] **Step 2: Add type exports at the bottom of schema.ts**

After the existing type exports, add:

```typescript
export type NailStyleVariant = typeof nailStyleVariants.$inferSelect;
export type NewNailStyleVariant = typeof nailStyleVariants.$inferInsert;
export type CatalogQueueItem = typeof catalogQueue.$inferSelect;
export type NewCatalogQueueItem = typeof catalogQueue.$inferInsert;
```

- [ ] **Step 3: Run migration**

```bash
cd C:/Nails/caiena && npx drizzle-kit push 2>&1
```
Expected: "Changes applied" or similar success message. If it asks to confirm, type `y`.

- [ ] **Step 4: Verify TypeScript**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd C:/Nails/caiena && git add src/db/schema.ts && git commit -m "feat: schema — nailStyleVariants, catalogQueue, published on nailStyles"
```

---

## Task 6: Rewrite pipeline script with DB tracking and batch processing

**Files:**
- Modify: `scripts/apply-designs.mjs`

This rewrites the script to: scan all "37*" images, sha256-dedup against `catalogQueue`, generate 4 variants per image, classify each design, store all results in DB.

- [ ] **Step 1: Rewrite scripts/apply-designs.mjs**

```javascript
/**
 * apply-designs.mjs
 *
 * Batch pipeline: scans images starting with "37" from the Instagram archive,
 * generates 4 pose variants per design via Gemini, classifies each design,
 * and tracks everything in the DB via catalogQueue + nailStyleVariants.
 *
 * Usage:
 *   node scripts/apply-designs.mjs
 *
 * Requires GEMINI_API_KEY + DATABASE_URL in .env.local
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { createHash } from "crypto";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import {
  nailStyles,
  nailStyleVariants,
  catalogQueue,
} from "../src/db/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Config ───────────────────────────────────────────────────────────────────

const IMAGES_DIR =
  "C:/Users/PC/Desktop/caiena_instagram_pipeline_20260430_222913/data/organized/posts/images";
const BASES_DIR = join(ROOT, "public", "bases-maestras");
const OUTPUT_DIR = join(ROOT, "public", "catalog-preview");

const BASES = ["garra", "ascendente", "doble", "rocio"];
const BASE_FILES = {
  garra:       join(BASES_DIR, "base_garra.jpg"),
  ascendente:  join(BASES_DIR, "base_ascendente.jpg"),
  doble:       join(BASES_DIR, "base_doble.jpg"),
  rocio:       join(BASES_DIR, "base_rocio.jpg"),
};

// ─── Env ──────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) throw new Error(".env.local not found");
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const [k, ...v] = line.trim().split("=");
    if (k && v.length) process.env[k] = v.join("=");
  }
}
loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) { console.error("❌ Falta GEMINI_API_KEY"); process.exit(1); }

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// ─── Gemini helpers ───────────────────────────────────────────────────────────

function toInlineData(filePath, mimeType = "image/jpeg") {
  return { inlineData: { mimeType, data: readFileSync(filePath).toString("base64") } };
}

async function geminiGenerate(parts, preferImage = true) {
  for (const model of ["gemini-3.1-flash-image-preview", "gemini-2.5-flash-preview-05-20"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseModalities: preferImage ? ["TEXT", "IMAGE"] : ["TEXT"] },
          }),
        }
      );
      if (!res.ok) {
        console.log(`    ⚠️  ${model} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const candidate = data.candidates?.[0];
      const imgPart = candidate?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
      const txtPart = candidate?.content?.parts?.find((p) => p.text);
      if (preferImage && imgPart) return { type: "image", data: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType };
      if (!preferImage && txtPart) return { type: "text", text: txtPart.text };
      console.log(`    ⚠️  ${model} finishReason=${candidate?.finishReason} — no expected output`);
    } catch (e) {
      console.log(`    ⚠️  ${model} error: ${e.message.slice(0, 80)}`);
    }
  }
  return null;
}

// ─── Classification ───────────────────────────────────────────────────────────

async function classifyDesign(designFile) {
  const prompt = `Analyze this nail design photo and return ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "name": "short elegant name in Spanish for this nail style (3-5 words, title case)",
  "color": one of: nude|rosa|rojo|burdeos|blanco|negro|azul|verde|morado|lila|coral|multicolor|plateado|dorado|gris|beige,
  "acabado": one of: glossy|matte|chrome|glitter|satinado,
  "forma": one of: cuadrada|redonda|oval|almendra|stiletto|coffin,
  "estilo": one of: french|solid|floral|geometrico|glitter_foil|ombre|chrome|minimalista|nail_art
}`;

  const result = await geminiGenerate(
    [toInlineData(designFile), { text: prompt }],
    false
  );
  if (!result) return null;
  try {
    const json = result.text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(json);
  } catch {
    console.log(`    ⚠️  Could not parse classification JSON: ${result.text.slice(0, 100)}`);
    return null;
  }
}

// ─── Variant generation ───────────────────────────────────────────────────────

async function generateVariant(baseFile, designFile) {
  const prompt = `You are a professional nail art retouching artist for a luxury nail catalog.

TASK: Apply the nail design from the REFERENCE PHOTO onto the bare nails in the BASE PHOTO.

REFERENCE PHOTO (second image): Extract ONLY the nail color, pattern, art, and finish from this reference. Ignore everything else (hand shape, skin tone, background, jewelry, accessories).

BASE PHOTO (first image): A professional studio hand photo with bare natural nails on pure black background. This is your canvas.

WHAT TO CHANGE — nails only:
- Paint every nail with the exact design from the reference
- Match color, pattern, art style, finish (glossy/matte/glitter) precisely
- Apply the same design to ALL nails consistently
- Preserve the natural almond shape of the base nails

WHAT TO KEEP UNCHANGED:
- Hand pose and finger positions: IDENTICAL to base
- Skin tone: IDENTICAL to base (fair porcelain)
- Background: pure deep matte black — IDENTICAL to base
- Lighting: same rim light — IDENTICAL to base
- No jewelry, no rings, no accessories
- No watermarks, no text, no logos

QUALITY: Professional luxury catalog photo — sharp, editorial, Dior/Chanel level quality.`;

  return geminiGenerate([toInlineData(baseFile), toInlineData(designFile), { text: prompt }], true);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Find all "37*" images
  const allImages = readdirSync(IMAGES_DIR)
    .filter((f) => f.startsWith("37") && /\.(jpg|jpeg|png)$/i.test(f))
    .map((f) => join(IMAGES_DIR, f));

  console.log(`🎨 Encontradas ${allImages.length} imágenes "37*"\n`);

  for (const imgPath of allImages) {
    const filename = basename(imgPath);
    const hash = createHash("sha256").update(readFileSync(imgPath)).digest("hex");

    // Check if already processed
    const existing = await db
      .select({ id: catalogQueue.id, status: catalogQueue.status, styleId: catalogQueue.styleId })
      .from(catalogQueue)
      .where(eq(catalogQueue.sourceHash, hash));

    if (existing.length > 0 && existing[0].status === "done") {
      console.log(`⏭️  ${filename} — ya procesado (styleId=${existing[0].styleId})`);
      continue;
    }

    console.log(`\n⏳ Procesando: ${filename}`);

    // 1. Classify
    console.log("  📋 Clasificando diseño...");
    const classification = await classifyDesign(imgPath);
    const name = classification?.name ?? filename.replace(/\.\w+$/, "");

    // 2. Insert nailStyle
    const [style] = await db
      .insert(nailStyles)
      .values({
        name,
        description: "",
        category: classification?.estilo ?? "nail_art",
        prompt: "",
        color: classification?.color ?? null,
        acabado: classification?.acabado ?? null,
        forma: classification?.forma ?? null,
        estilo: classification?.estilo ?? null,
        active: true,
        published: false,
        sortOrder: 0,
      })
      .returning({ id: nailStyles.id });

    // 3. Insert queue entry
    const [queueEntry] = await db
      .insert(catalogQueue)
      .values({
        sourceImagePath: imgPath,
        sourceHash: hash,
        styleId: style.id,
        status: "processing",
      })
      .returning({ id: catalogQueue.id });

    const styleOutputDir = join(OUTPUT_DIR, String(style.id));
    mkdirSync(styleOutputDir, { recursive: true });

    let firstVariantPath: string | null = null;
    let allOk = true;

    // 4. Generate 4 variants
    for (const baseId of BASES) {
      const baseFile = BASE_FILES[baseId];
      const outPath = join(styleOutputDir, `${baseId}.jpg`);
      console.log(`  🖼  Generando variante ${baseId}...`);

      let attempts = 0;
      let result = null;
      while (attempts < 3 && !result) {
        result = await generateVariant(baseFile, imgPath);
        if (!result) { attempts++; await new Promise((r) => setTimeout(r, 2000)); }
      }

      if (result) {
        writeFileSync(outPath, Buffer.from(result.data, "base64"));
        const relPath = `/catalog-preview/${style.id}/${baseId}.jpg`;
        await db.insert(nailStyleVariants).values({
          styleId: style.id,
          baseId,
          imagePath: relPath,
          status: "done",
        });
        if (!firstVariantPath) firstVariantPath = relPath;
        console.log(`    ✅ ${baseId}`);
      } else {
        await db.insert(nailStyleVariants).values({
          styleId: style.id,
          baseId,
          imagePath: "",
          status: "error",
          errorMsg: "All models failed",
        });
        console.log(`    ❌ ${baseId} — falló`);
        allOk = false;
      }

      await new Promise((r) => setTimeout(r, 2500)); // rate limit
    }

    // 5. Update nailStyle thumbnail + queue status
    if (firstVariantPath) {
      await db
        .update(nailStyles)
        .set({ thumbnailUrl: firstVariantPath })
        .where(eq(nailStyles.id, style.id));
    }

    await db
      .update(catalogQueue)
      .set({
        status: allOk ? "done" : "error",
        processedAt: new Date(),
      })
      .where(eq(catalogQueue.id, queueEntry.id));

    console.log(`  ${allOk ? "✅" : "⚠️ "} ${name} (id=${style.id}) — ${allOk ? "completo" : "con errores"}`);
  }

  console.log("\n✨ Pipeline completo");
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
```

- [ ] **Step 2: Run the pipeline (this will take ~20–30 minutes for 20 images × 4 variants)**

```bash
cd C:/Nails/caiena && node scripts/apply-designs.mjs 2>&1
```
Expected: each image logged with ✅ or ⚠️. Outputs in `public/catalog-preview/<styleId>/`.

- [ ] **Step 3: Commit the script**

```bash
cd C:/Nails/caiena && git add scripts/apply-designs.mjs && git commit -m "feat: pipeline — batch 37* images, DB tracking, classification, 4 variants each"
```

---

## Task 7: Create /api/catalog public route

**Files:**
- Create: `src/app/api/catalog/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { nailStyles, nailStyleVariants } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const styles = await db
    .select()
    .from(nailStyles)
    .where(eq(nailStyles.published, true))
    .orderBy(asc(nailStyles.sortOrder), asc(nailStyles.id));

  const styleIds = styles.map((s) => s.id);

  if (styleIds.length === 0) return NextResponse.json([]);

  const variants = await db
    .select()
    .from(nailStyleVariants)
    .where(eq(nailStyleVariants.status, "done"));

  const variantsByStyle = variants.reduce<Record<number, typeof variants>>(
    (acc, v) => {
      if (!acc[v.styleId]) acc[v.styleId] = [];
      acc[v.styleId].push(v);
      return acc;
    },
    {}
  );

  const result = styles.map((style) => ({
    ...style,
    variants: (variantsByStyle[style.id] ?? []).sort((a, b) => {
      const order = ["garra", "ascendente", "doble", "rocio"];
      return order.indexOf(a.baseId) - order.indexOf(b.baseId);
    }),
  }));

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd C:/Nails/caiena && git add src/app/api/catalog/route.ts && git commit -m "feat: /api/catalog — public endpoint for published designs with variants"
```

---

## Task 8: Create NailCarousel component

**Files:**
- Create: `src/components/catalog/NailCarousel.tsx`

- [ ] **Step 1: Create the directory and component**

```bash
mkdir -p "C:/Nails/caiena/src/components/catalog"
```

Write `src/components/catalog/NailCarousel.tsx`:

```tsx
"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export interface NailVariant {
  id: number;
  styleId: number;
  baseId: string;
  imagePath: string;
}

export interface CatalogStyle {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  color: string | null;
  acabado: string | null;
  forma: string | null;
  estilo: string | null;
  badge: string | null;
  variants: NailVariant[];
}

interface Props {
  styles: CatalogStyle[];
  onSelect?: (style: CatalogStyle) => void;
}

const SPEED = 38; // px/sec

export function NailCarousel({ styles, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const playingRef = useRef(true);

  // Sync playingRef with state so RAF loop reads current value
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const loop = useCallback((ts: number) => {
    const track = trackRef.current;
    if (!track || !playingRef.current) { lastTsRef.current = null; return; }
    if (lastTsRef.current !== null) {
      const dt = (ts - lastTsRef.current) / 1000;
      const max = track.scrollWidth - track.clientWidth;
      track.scrollLeft += SPEED * dt;
      if (track.scrollLeft >= max - 1) {
        track.style.scrollBehavior = "auto";
        track.scrollLeft = 0;
        track.style.scrollBehavior = "";
      }
      // Update active dot based on scroll position
      const cardWidth = track.scrollWidth / styles.length;
      setActiveIdx(Math.round(track.scrollLeft / cardWidth) % styles.length);
    }
    lastTsRef.current = ts;
    rafRef.current = requestAnimationFrame(loop);
  }, [styles.length]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, loop]);

  // Mobile: restart after touch ends with grace period
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setPlaying(true), 1800);
  };

  if (styles.length === 0) return null;

  return (
    <section className="relative py-16 overflow-hidden" style={{ background: "var(--caiena-bg)" }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: "var(--caiena-rose-dark)" }}>
            Colección
          </p>
          <h2
            className="text-4xl sm:text-5xl font-light italic"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "var(--caiena-plum)" }}
          >
            Nuestros Diseños
          </h2>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-2 text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-colors"
          style={{
            borderColor: "var(--caiena-rose-dark)",
            color: "var(--caiena-rose-dark)",
          }}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {playing ? "Pausar" : "Ver"}
        </button>
      </div>

      {/* Carousel track with edge fades */}
      <div
        className="relative"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
        }}
      >
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto pb-4"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseEnter={() => setPlaying(false)}
          onMouseLeave={() => setPlaying(true)}
          onTouchStart={() => setPlaying(false)}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pad start */}
          <div className="flex-none w-16 shrink-0" />

          {styles.map((style) => (
            <CarouselCard
              key={style.id}
              style={style}
              onClick={() => onSelect?.(style)}
            />
          ))}

          {/* Pad end */}
          <div className="flex-none w-16 shrink-0" />
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-6">
        {styles.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const track = trackRef.current;
              if (!track) return;
              const cardWidth = track.scrollWidth / styles.length;
              track.style.scrollBehavior = "smooth";
              track.scrollLeft = i * cardWidth;
              setActiveIdx(i);
            }}
            className="rounded-full transition-all"
            style={{
              width: i === activeIdx ? "20px" : "6px",
              height: "6px",
              background: i === activeIdx ? "var(--caiena-rose-dark)" : "var(--caiena-champagne)",
            }}
          />
        ))}
      </div>
    </section>
  );
}

function CarouselCard({ style, onClick }: { style: CatalogStyle; onClick: () => void }) {
  const thumb = style.thumbnailUrl ?? style.variants[0]?.imagePath ?? null;

  return (
    <div
      className="flex-none cursor-pointer group"
      style={{
        width: "clamp(180px, 22vw, 260px)",
        scrollSnapAlign: "center",
      }}
      onClick={onClick}
    >
      {/* 2:3 image */}
      <div
        className="overflow-hidden rounded-lg mb-3 transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ aspectRatio: "2/3", background: "var(--caiena-bg2)" }}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={style.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </div>
        )}
      </div>

      {/* Card info */}
      <p
        className="text-sm font-light mb-1"
        style={{ fontFamily: "var(--font-cormorant), serif", color: "var(--caiena-plum)", letterSpacing: "0.04em" }}
      >
        {style.name}
      </p>
      <div className="flex items-center gap-2">
        {style.badge && (
          <span
            className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{ background: "var(--caiena-rose-dark)", color: "white" }}
          >
            {style.badge}
          </span>
        )}
        {style.acabado && (
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ color: "var(--caiena-rose)" }}
          >
            {style.acabado}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | grep "NailCarousel\|catalog" | head -10
```

- [ ] **Step 3: Commit**

```bash
cd C:/Nails/caiena && git add src/components/catalog/ && git commit -m "feat: NailCarousel — auto-scroll RAF carousel with rose/plum palette"
```

---

## Task 9: Create DesignOverlay component (card stack)

**Files:**
- Create: `src/components/catalog/DesignOverlay.tsx`

- [ ] **Step 1: Write DesignOverlay.tsx**

```tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { CatalogStyle } from "./NailCarousel";

const BASES_ORDER = ["garra", "ascendente", "doble", "rocio"];
const BASES_LABELS: Record<string, string> = {
  garra: "Garra",
  ascendente: "Ascendente",
  doble: "Doble Mano",
  rocio: "Rocío",
};

// Stack offsets for cards 1-3 behind the front card
const STACK_OFFSETS = [
  { tx: 0,   ty: 0,    rot: 0,    scale: 1    },  // front
  { tx: 4,   ty: -8,   rot: 2,    scale: 0.96 },  // 2nd
  { tx: 8,   ty: -16,  rot: 4,    scale: 0.92 },  // 3rd
  { tx: 12,  ty: -24,  rot: 6,    scale: 0.88 },  // 4th
];

interface Props {
  style: CatalogStyle;
  onClose: () => void;
  onSelectDesign?: (styleId: number, baseId: string) => void;
}

export function DesignOverlay({ style, onClose, onSelectDesign }: Props) {
  const [poseIdx, setPoseIdx] = useState(0);
  const [animDir, setAnimDir] = useState<"next" | "prev" | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Order variants by BASES_ORDER
  const variants = BASES_ORDER
    .map((baseId) => style.variants.find((v) => v.baseId === baseId))
    .filter(Boolean) as NonNullable<typeof style.variants[0]>[];

  const total = variants.length;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Swipe support
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); }
  };

  const goNext = useCallback(() => {
    setAnimDir("next");
    setPoseIdx((i) => (i + 1) % total);
    setTimeout(() => setAnimDir(null), 520);
  }, [total]);

  const goPrev = useCallback(() => {
    setAnimDir("prev");
    setPoseIdx((i) => (i - 1 + total) % total);
    setTimeout(() => setAnimDir(null), 520);
  }, [total]);

  const activeVariant = variants[poseIdx];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(254,249,247,0.88)", backdropFilter: "blur(10px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Back button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm tracking-widest uppercase transition-opacity hover:opacity-60"
        style={{ color: "var(--caiena-plum)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Catálogo
      </button>

      {/* Card stack */}
      <div
        className="relative flex items-center gap-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left arrow */}
        {total > 1 && (
          <button
            onClick={goPrev}
            className="flex-none w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105"
            style={{ borderColor: "var(--caiena-plum)", color: "var(--caiena-plum)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Stack of cards */}
        <div className="relative" style={{ width: "clamp(220px, 32vw, 340px)", aspectRatio: "2/3" }}>
          {variants.map((v, i) => {
            // Determine visual stack position relative to active
            const pos = (i - poseIdx + total) % total;
            const offset = STACK_OFFSETS[pos] ?? STACK_OFFSETS[3];
            const isActive = pos === 0;

            return (
              <div
                key={v.id}
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{
                  transform: `translate(${offset.tx}px, ${offset.ty}px) rotate(${offset.rot}deg) scale(${offset.scale})`,
                  transition: animDir ? "transform 0.52s cubic-bezier(.34,1.15,.64,1), opacity 0.4s ease" : "none",
                  zIndex: total - pos,
                  opacity: pos === 0 ? 1 : pos === 1 ? 0.8 : pos === 2 ? 0.6 : 0.4,
                  boxShadow: isActive ? "0 24px 60px rgba(58,16,32,0.18)" : "none",
                }}
              >
                {v.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.imagePath}
                    alt={`${style.name} — ${BASES_LABELS[v.baseId] ?? v.baseId}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: "var(--caiena-bg2)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        {total > 1 && (
          <button
            onClick={goNext}
            className="flex-none w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105"
            style={{ borderColor: "var(--caiena-plum)", color: "var(--caiena-plum)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Info + CTA below stack */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center" style={{ animation: "cardEntrance 0.5s ease both" }}>
        <p
          className="text-2xl font-light italic mb-1"
          style={{ fontFamily: "var(--font-cormorant), serif", color: "var(--caiena-plum)" }}
        >
          {style.name}
        </p>
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--caiena-rose)" }}>
          {activeVariant ? BASES_LABELS[activeVariant.baseId] ?? activeVariant.baseId : ""}
          {total > 1 && ` — ${poseIdx + 1} / ${total}`}
        </p>

        {/* Pose dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {variants.map((_, i) => (
            <button
              key={i}
              onClick={() => { setAnimDir("next"); setPoseIdx(i); setTimeout(() => setAnimDir(null), 520); }}
              className="rounded-full transition-all"
              style={{
                width: i === poseIdx ? "16px" : "5px",
                height: "5px",
                background: i === poseIdx ? "var(--caiena-plum)" : "var(--caiena-champagne)",
              }}
            />
          ))}
        </div>

        {onSelectDesign && activeVariant && (
          <button
            onClick={() => { onSelectDesign(style.id, activeVariant.baseId); onClose(); }}
            className="px-8 py-3 rounded-full text-sm tracking-widest uppercase transition-all hover:opacity-80"
            style={{ background: "var(--caiena-plum)", color: "white" }}
          >
            Seleccionar este diseño
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | grep "DesignOverlay\|catalog" | head -10
```

- [ ] **Step 3: Commit**

```bash
cd C:/Nails/caiena && git add src/components/catalog/DesignOverlay.tsx && git commit -m "feat: DesignOverlay — spring card-stack with arrows, swipe, pose dots"
```

---

## Task 10: Add carousel section to landing page

**Files:**
- Create: `src/components/catalog/CatalogSection.tsx`
- Modify: `src/app/page.tsx`

The landing page needs a server component to fetch catalog data, then pass it to the client carousel + overlay. Split into a server wrapper `CatalogSection` that fetches and a client part that renders.

- [ ] **Step 1: Create CatalogSection.tsx (server component + client wrapper)**

```tsx
// src/components/catalog/CatalogSection.tsx
import { db } from "@/db";
import { nailStyles, nailStyleVariants } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { CatalogClient } from "./CatalogClient";

export async function CatalogSection() {
  const styles = await db
    .select()
    .from(nailStyles)
    .where(eq(nailStyles.published, true))
    .orderBy(asc(nailStyles.sortOrder), asc(nailStyles.id));

  if (styles.length === 0) return null;

  const variants = await db
    .select()
    .from(nailStyleVariants)
    .where(eq(nailStyleVariants.status, "done"));

  const variantsByStyle = variants.reduce<Record<number, typeof variants>>(
    (acc, v) => { (acc[v.styleId] ??= []).push(v); return acc; },
    {}
  );

  const data = styles.map((s) => ({
    ...s,
    variants: (variantsByStyle[s.id] ?? []).sort((a, b) => {
      const order = ["garra", "ascendente", "doble", "rocio"];
      return order.indexOf(a.baseId) - order.indexOf(b.baseId);
    }),
  }));

  return <CatalogClient styles={data} />;
}
```

- [ ] **Step 2: Create CatalogClient.tsx (client component)**

```tsx
// src/components/catalog/CatalogClient.tsx
"use client";

import { useState } from "react";
import { NailCarousel, type CatalogStyle } from "./NailCarousel";
import { DesignOverlay } from "./DesignOverlay";

interface Props {
  styles: CatalogStyle[];
}

export function CatalogClient({ styles }: Props) {
  const [selected, setSelected] = useState<CatalogStyle | null>(null);

  return (
    <>
      <NailCarousel styles={styles} onSelect={setSelected} />
      {selected && (
        <DesignOverlay
          style={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Add CatalogSection to page.tsx**

In `src/app/page.tsx`, add the import and place `<CatalogSection />` after `<Hero />`:

```tsx
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { Services } from "@/components/services";
import { Gallery } from "@/components/gallery";
import { Testimonials } from "@/components/testimonials";
import { About } from "@/components/about";
import { Booking } from "@/components/booking";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CatalogSection />
        <Services />
        <Gallery />
        <Testimonials />
        <About />
        <Booking />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
cd C:/Nails/caiena && git add src/components/catalog/CatalogSection.tsx src/components/catalog/CatalogClient.tsx src/app/page.tsx && git commit -m "feat: landing page — catalog carousel section after hero"
```

---

## Task 11: Integrate carousel + design selection in user dashboard

**Files:**
- Create: `src/components/catalog/DashboardCatalogClient.tsx`
- Modify: `src/components/user-dashboard.tsx`

- [ ] **Step 1: Create DashboardCatalogClient.tsx**

This version of the catalog client passes `onSelectDesign` to the overlay, which sets the selected design in the booking form.

```tsx
// src/components/catalog/DashboardCatalogClient.tsx
"use client";

import { useState } from "react";
import { NailCarousel, type CatalogStyle } from "./NailCarousel";
import { DesignOverlay } from "./DesignOverlay";

interface Props {
  styles: CatalogStyle[];
  onDesignSelected?: (styleId: number, baseId: string, styleName: string) => void;
}

export function DashboardCatalogClient({ styles, onDesignSelected }: Props) {
  const [selected, setSelected] = useState<CatalogStyle | null>(null);

  return (
    <>
      <NailCarousel styles={styles} onSelect={setSelected} />
      {selected && (
        <DesignOverlay
          style={selected}
          onClose={() => setSelected(null)}
          onSelectDesign={(styleId, baseId) => {
            onDesignSelected?.(styleId, baseId, selected.name);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Add catalog to user-dashboard.tsx**

In `src/components/user-dashboard.tsx`, add the catalog fetch and render section. Add these imports at the top:

```typescript
import { nailStyles, nailStyleVariants } from "@/db/schema";
import { DashboardCatalogClient } from "./catalog/DashboardCatalogClient";
```

After the existing DB queries (upcomingBookings, historyBookings), add:

```typescript
  // Fetch published catalog for design selection
  const catalogStyles = await db
    .select()
    .from(nailStyles)
    .where(eq(nailStyles.published, true))
    .orderBy(asc(nailStyles.sortOrder), asc(nailStyles.id));

  const catalogVariants = catalogStyles.length > 0
    ? await db.select().from(nailStyleVariants).where(eq(nailStyleVariants.status, "done"))
    : [];

  const variantsByStyle = catalogVariants.reduce<Record<number, typeof catalogVariants>>(
    (acc, v) => { (acc[v.styleId] ??= []).push(v); return acc; },
    {}
  );

  const catalogData = catalogStyles.map((s) => ({
    ...s,
    variants: (variantsByStyle[s.id] ?? []).sort((a, b) => {
      const order = ["garra", "ascendente", "doble", "rocio"];
      return order.indexOf(a.baseId) - order.indexOf(b.baseId);
    }),
  }));
```

Then in the JSX, before the upcoming bookings section, add:

```tsx
{/* Catalog carousel for design selection */}
{catalogData.length > 0 && (
  <section className="mb-10">
    <h2 className="font-serif text-2xl font-semibold text-foreground mb-2 px-6">Elige tu diseño</h2>
    <p className="text-sm text-muted mb-4 px-6">Selecciona el estilo que quieres en tu próxima cita</p>
    <DashboardCatalogClient styles={catalogData} />
  </section>
)}
```

- [ ] **Step 3: Add missing imports to user-dashboard.tsx**

Make sure `asc` is imported from drizzle-orm — it may already be there. Verify the imports include:

```typescript
import { eq, and, desc, gt, count, asc } from "drizzle-orm"
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
cd C:/Nails/caiena && git add src/components/catalog/DashboardCatalogClient.tsx src/components/user-dashboard.tsx && git commit -m "feat: user dashboard — catalog carousel with design selection"
```

---

## Task 12: Admin upload + variant generation flow

**Files:**
- Create: `src/app/api/admin/catalog/generate/route.ts`
- Create: `src/app/api/admin/catalog/status/[jobId]/route.ts`
- Create: `src/app/api/admin/catalog/publish/[styleId]/route.ts`
- Modify: `src/components/admin-nail-styles-tab.tsx`

- [ ] **Step 1: Create generate route**

```typescript
// src/app/api/admin/catalog/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/db";
import { nailStyles, nailStyleVariants, catalogQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";

const BASES = ["garra", "ascendente", "doble", "rocio"] as const;
const BASE_FILES: Record<string, string> = {
  garra:      join(process.cwd(), "public/bases-maestras/base_garra.jpg"),
  ascendente: join(process.cwd(), "public/bases-maestras/base_ascendente.jpg"),
  doble:      join(process.cwd(), "public/bases-maestras/base_doble.jpg"),
  rocio:      join(process.cwd(), "public/bases-maestras/base_rocio.jpg"),
};

async function callGemini(parts: unknown[], preferImage: boolean) {
  for (const model of ["gemini-3.1-flash-image-preview", "gemini-2.5-flash-preview-05-20"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseModalities: preferImage ? ["TEXT", "IMAGE"] : ["TEXT"] },
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const candidate = data.candidates?.[0];
      const imgPart = candidate?.content?.parts?.find((p: { inlineData?: { mimeType?: string } }) => p.inlineData?.mimeType?.startsWith("image/"));
      const txtPart = candidate?.content?.parts?.find((p: { text?: string }) => p.text);
      if (preferImage && imgPart) return { type: "image" as const, data: imgPart.inlineData.data };
      if (!preferImage && txtPart) return { type: "text" as const, text: txtPart.text };
    } catch { continue; }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("image") as File | null;
  const name = (form.get("name") as string) || "Nuevo diseño";

  if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buf).digest("hex");

  // Dedup
  const existing = await db.select().from(catalogQueue).where(eq(catalogQueue.sourceHash, hash));
  if (existing.length > 0 && existing[0].status === "done") {
    return NextResponse.json({ jobId: existing[0].id, styleId: existing[0].styleId, status: "done" });
  }

  // Create nailStyle
  const [style] = await db.insert(nailStyles).values({
    name,
    description: "",
    category: "nail_art",
    prompt: "",
    active: true,
    published: false,
    sortOrder: 0,
  }).returning({ id: nailStyles.id });

  // Create queue entry
  const [qEntry] = await db.insert(catalogQueue).values({
    sourceImagePath: `upload:${hash}`,
    sourceHash: hash,
    styleId: style.id,
    status: "processing",
  }).returning({ id: catalogQueue.id });

  const imgB64 = buf.toString("base64");
  const mimeType = file.type || "image/jpeg";
  const outDir = join(process.cwd(), "public/catalog-preview", String(style.id));
  mkdirSync(outDir, { recursive: true });

  const PROMPT = `You are a professional nail art retouching artist for a luxury nail catalog.
TASK: Apply the nail design from the REFERENCE PHOTO onto the bare nails in the BASE PHOTO.
REFERENCE PHOTO (second image): Extract ONLY the nail color, pattern, art, and finish. Ignore hand shape, skin tone, background, accessories.
BASE PHOTO (first image): Professional studio hand photo with bare natural nails on black background. Your canvas.
Paint every nail with the exact design. Keep EVERYTHING else identical: pose, skin, background, lighting.
No jewelry, no watermarks. Professional Dior/Chanel quality result.`;

  let firstPath: string | null = null;
  let allOk = true;

  for (const baseId of BASES) {
    const baseFile = BASE_FILES[baseId];
    const baseBuf = readFileSync(baseFile);
    const parts = [
      { inlineData: { mimeType: "image/jpeg", data: baseBuf.toString("base64") } },
      { inlineData: { mimeType, data: imgB64 } },
      { text: PROMPT },
    ];
    const result = await callGemini(parts, true);
    const outPath = join(outDir, `${baseId}.jpg`);
    const relPath = `/catalog-preview/${style.id}/${baseId}.jpg`;

    if (result?.type === "image") {
      writeFileSync(outPath, Buffer.from(result.data, "base64"));
      await db.insert(nailStyleVariants).values({ styleId: style.id, baseId, imagePath: relPath, status: "done" });
      if (!firstPath) firstPath = relPath;
    } else {
      await db.insert(nailStyleVariants).values({ styleId: style.id, baseId, imagePath: "", status: "error", errorMsg: "generation failed" });
      allOk = false;
    }
  }

  if (firstPath) {
    await db.update(nailStyles).set({ thumbnailUrl: firstPath }).where(eq(nailStyles.id, style.id));
  }

  await db.update(catalogQueue).set({
    status: allOk ? "done" : "error",
    processedAt: new Date(),
  }).where(eq(catalogQueue.id, qEntry.id));

  return NextResponse.json({ jobId: qEntry.id, styleId: style.id, status: allOk ? "done" : "error" });
}
```

- [ ] **Step 2: Create status route**

```typescript
// src/app/api/admin/catalog/status/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { db } from "@/db";
import { catalogQueue, nailStyleVariants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const [job] = await db.select().from(catalogQueue).where(eq(catalogQueue.id, parseInt(jobId)));
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const variants = job.styleId
    ? await db.select().from(nailStyleVariants).where(eq(nailStyleVariants.styleId, job.styleId))
    : [];

  return NextResponse.json({ job, variants });
}
```

- [ ] **Step 3: Create publish route**

```typescript
// src/app/api/admin/catalog/publish/[styleId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { db } from "@/db";
import { nailStyles } from "@/db/schema";
import { eq, max } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ styleId: string }> }
) {
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { styleId } = await params;
  const [maxRow] = await db.select({ m: max(nailStyles.sortOrder) }).from(nailStyles);
  const nextOrder = (maxRow?.m ?? 0) + 1;

  await db.update(nailStyles).set({ published: true, sortOrder: nextOrder }).where(eq(nailStyles.id, parseInt(styleId)));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Add "Generate Variants" section to admin-nail-styles-tab.tsx**

In `src/components/admin-nail-styles-tab.tsx`, at the top of the component (after the existing state declarations), add a new collapsible section for the upload-and-generate flow. Find the JSX return and add before the existing content:

```tsx
{/* ── Generate from reference image ── */}
<div className="mb-8 p-5 rounded-2xl border border-accent-light/30 bg-cream/30">
  <h3 className="font-serif text-base font-semibold mb-4">Generar variantes desde foto de referencia</h3>
  <GenerateVariantsPanel />
</div>
```

Add the `GenerateVariantsPanel` component at the bottom of the file (before the last closing brace):

```tsx
function GenerateVariantsPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [variants, setVariants] = useState<Array<{ baseId: string; imagePath: string; status: string }>>([]);
  const [styleId, setStyleId] = useState<number | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setStatus("generating");
    setVariants([]);
    const form = new FormData();
    form.append("image", file);
    form.append("name", name || file.name.replace(/\.\w+$/, ""));
    const res = await fetch("/api/admin/catalog/generate", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) { setStatus("error"); return; }
    setStyleId(data.styleId);
    setStatus(data.status === "done" ? "done" : "error");
    // Fetch variants
    const statusRes = await fetch(`/api/admin/catalog/status/${data.jobId}`);
    const statusData = await statusRes.json();
    setVariants(statusData.variants ?? []);
  };

  const handlePublish = async () => {
    if (!styleId) return;
    setPublishLoading(true);
    await fetch(`/api/admin/catalog/publish/${styleId}`, { method: "POST" });
    setPublishLoading(false);
    alert("Diseño publicado. Aparecerá en el carrusel.");
    setStatus("idle"); setFile(null); setPreview(null); setName(""); setVariants([]); setStyleId(null);
  };

  const BASES_LABELS: Record<string, string> = { garra: "Garra", ascendente: "Ascendente", doble: "Doble", rocio: "Rocío" };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-start">
        <div
          className="w-24 h-32 rounded-xl border-2 border-dashed border-accent-light/40 flex items-center justify-center cursor-pointer hover:border-accent/40 transition-colors overflow-hidden flex-shrink-0"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? <img src={preview} alt="preview" className="w-full h-full object-cover" /> : (
            <span className="text-xs text-foreground/30 text-center px-1">+ Foto de referencia</span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <input
            type="text"
            placeholder="Nombre del diseño"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm border border-accent-light/30 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={handleGenerate}
            disabled={!file || status === "generating"}
            className="w-full bg-foreground text-white text-sm py-2.5 rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {status === "generating" ? "Generando variantes..." : "Generar 4 variantes"}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {status === "done" && variants.length > 0 && (
        <div>
          <p className="text-xs text-foreground/50 mb-3">Variantes generadas:</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {variants.filter(v => v.status === "done" && v.imagePath).map((v) => (
              <div key={v.baseId} className="space-y-1">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-cream">
                  <img src={v.imagePath} alt={v.baseId} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-center text-foreground/50">{BASES_LABELS[v.baseId] ?? v.baseId}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handlePublish}
            disabled={publishLoading}
            className="w-full bg-emerald-600 text-white text-sm py-2.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {publishLoading ? "Publicando..." : "Publicar diseño en el carrusel"}
          </button>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">Error generando variantes. Intenta de nuevo.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd C:/Nails/caiena && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
cd C:/Nails/caiena && git add src/app/api/admin/catalog/ src/components/admin-nail-styles-tab.tsx && git commit -m "feat: admin — upload reference → generate 4 variants → publish flow"
```

---

## Task 13: Publish initial designs from pipeline

After the pipeline (Task 6) completes, publish the generated designs so they appear in the carousel.

- [ ] **Step 1: Check how many unpublished designs exist**

```bash
cd C:/Nails/caiena && node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT COUNT(*) FROM nail_styles WHERE published = false\`.then(r => console.log('Unpublished:', r[0].count));
" 2>&1
```

- [ ] **Step 2: Publish all completed designs via SQL**

This publishes all designs that have at least one variant in `done` status and sets sequential sort order:

```bash
cd C:/Nails/caiena && node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
sql\`
  UPDATE nail_styles ns
  SET published = true,
      sort_order = sub.rn
  FROM (
    SELECT DISTINCT nsv.style_id,
           ROW_NUMBER() OVER (ORDER BY ns2.id) AS rn
    FROM nail_style_variants nsv
    JOIN nail_styles ns2 ON ns2.id = nsv.style_id
    WHERE nsv.status = 'done'
      AND ns2.published = false
  ) sub
  WHERE ns.id = sub.style_id
  RETURNING ns.id, ns.name
\`.then(r => { console.log('Published:', r.length); r.forEach(s => console.log(' -', s.id, s.name)); });
" 2>&1
```

- [ ] **Step 3: Verify**

Visit `http://localhost:3000` (after `npm run dev`) and confirm the carousel section appears with the published designs.

```bash
cd C:/Nails/caiena && npm run dev 2>&1 &
sleep 8 && curl -s http://localhost:3000/api/catalog | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{ const j=JSON.parse(Buffer.concat(d)); console.log('Published designs:', j.length); j.slice(0,3).forEach(s=>console.log(' -', s.id, s.name)); });"
```

- [ ] **Step 4: Stop dev server and commit**

```bash
pkill -f "next dev" 2>/dev/null; cd C:/Nails/caiena && git add -A && git commit -m "feat: publish initial catalog designs — carousel live"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Pipeline: scan "37*" images, sha256 dedup | Task 6 |
| 4 variants per design (garra/ascendente/doble/rocio) | Task 6 |
| DB tracking (catalogQueue + nailStyleVariants) | Tasks 5, 6 |
| AI classification (color, acabado, forma, estilo) | Task 6 |
| Auto-scroll carousel, pause button, seamless loop | Task 8 |
| 2:3 card ratio, Cormorant + rose palette | Tasks 1, 2, 8 |
| Card stack overlay, spring animation, arrows | Task 9 |
| Mobile swipe on overlay deck | Task 9 |
| Click outside closes overlay | Task 9 |
| SVG logo navbar (plum + rose gold), bigger | Task 3 |
| Nail liquid-fill hero animation | Task 4 |
| Landing page integration | Task 10 |
| User dashboard with design selection | Task 11 |
| Admin upload → generate → review → publish | Task 12 |
| /api/catalog public endpoint | Task 7 |
| published=false by default | Tasks 5, 6 |

**No placeholders found.** All code blocks are complete.

**Type consistency:** `CatalogStyle` type defined in `NailCarousel.tsx` and imported in `CatalogClient.tsx`, `DashboardCatalogClient.tsx`, `DesignOverlay.tsx`. `NailVariant` type consistent across all uses.

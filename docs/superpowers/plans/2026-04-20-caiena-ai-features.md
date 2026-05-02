# Caiena Beauty Nails - AI Features & Full Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-powered features (try-on, nail art generator, chatbot) plus platform features (gallery, gift cards, WhatsApp, reviews, loyalty) to the Caiena nail salon website.

**Architecture:** Each feature is a self-contained page/component with its own API route. All AI features use Gemini API (2.5 Flash for images, 2.0 for chat). Data stored in SQLite via Drizzle ORM. Features are independent — each task produces working software.

**Tech Stack:** Next.js 16.2.4, Gemini API (@google/generative-ai), Tailwind v4, Drizzle ORM + SQLite, Twilio (WhatsApp), date-fns

---

## File Map

```
src/
├── app/
│   ├── prueba-virtual/page.tsx          # AI Try-On page
│   ├── generador/page.tsx               # AI Nail Art Generator page
│   ├── galeria/page.tsx                  # Full gallery page with filters
│   ├── gift-cards/page.tsx              # Gift cards purchase page
│   ├── gift-cards/canjear/page.tsx      # Gift card redeem/check balance
│   ├── api/
│   │   ├── ai/
│   │   │   ├── try-on/route.ts          # AI try-on endpoint
│   │   │   ├── generate/route.ts        # AI nail art generator endpoint
│   │   │   └── chat/route.ts            # AI chatbot endpoint
│   │   ├── gallery/route.ts             # Gallery images CRUD
│   │   ├── gift-cards/route.ts          # Gift card purchase + check
│   │   ├── gift-cards/[code]/route.ts   # Gift card lookup by code
│   │   ├── reviews/route.ts             # Reviews submission
│   │   └── loyalty/route.ts             # Loyalty points
│   └── admin/
│       ├── galeria/page.tsx             # Admin gallery management
│       └── gift-cards/page.tsx          # Admin gift card management
├── components/
│   ├── ai-tryon.tsx                     # AI Try-On client component
│   ├── nail-generator.tsx               # AI Nail Art Generator client component
│   ├── ai-chatbot.tsx                   # Floating chatbot widget
│   ├── gallery-grid.tsx                 # Gallery with filters
│   ├── gift-card-form.tsx               # Gift card purchase form
│   ├── review-prompt.tsx                # Post-booking review CTA
│   ├── loyalty-badge.tsx                # Loyalty points display
│   └── instagram-feed.tsx               # Live Instagram feed
├── db/schema.ts                         # ADD: gallery_images, gift_cards, reviews, loyalty_points tables
└── lib/
    ├── gemini.ts                        # Gemini API client setup
    └── whatsapp.ts                      # Twilio WhatsApp helpers
```

---

## Task 1: Gemini API Setup & Shared Client

**Files:**
- Create: `src/lib/gemini.ts`
- Modify: `package.json` (add @google/generative-ai)
- Create: `.env.local.example`

- [ ] **Step 1: Install Gemini SDK**

```bash
npm install @google/generative-ai
```

- [ ] **Step 2: Create Gemini client**

```ts
// src/lib/gemini.ts
import { GoogleGenAI } from "@google/generative-ai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const geminiFlash = "gemini-2.5-flash-preview-05-20";
export const geminiChat = "gemini-2.0-flash";

export { ai };
```

- [ ] **Step 3: Create env example file**

```bash
# .env.local.example
GEMINI_API_KEY=your-gemini-api-key
ADMIN_PASSWORD=your-admin-password
SESSION_SECRET=your-session-secret
GOOGLE_CALENDAR_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

- [ ] **Step 4: Verify import works**

```bash
npm run build 2>&1 | tail -5
```
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/lib/gemini.ts .env.local.example package.json package-lock.json
git commit -m "feat: add Gemini API client setup"
```

---

## Task 2: AI Virtual Try-On (Gemini Image Editing)

**Files:**
- Create: `src/app/api/ai/try-on/route.ts`
- Create: `src/components/ai-tryon.tsx`
- Create: `src/app/prueba-virtual/page.tsx`
- Modify: `src/components/navbar.tsx` (add nav link)

- [ ] **Step 1: Create the try-on API route**

This endpoint accepts a hand photo (base64) and a design description, then uses Gemini 2.5 Flash's image editing to apply the nail design onto the photo.

```ts
// src/app/api/ai/try-on/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ai, geminiFlash } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const { image, designPrompt, referenceImage } = await request.json();

  if (!image) {
    return NextResponse.json({ error: "Se requiere una foto de tu mano" }, { status: 400 });
  }

  const prompt = referenceImage
    ? "You are a professional nail art artist. Apply the nail design shown in the reference image onto the nails in the hand photo. Make it look photorealistic. Keep the hand, skin, and background exactly as they are. Only change the nails to match the reference design. Ensure all visible nails are painted."
    : `You are a professional nail art artist. Apply the following nail design onto the nails in this hand photo: "${designPrompt || "elegant gel nails in a soft pink color with a glossy finish"}". Make it look photorealistic. Keep the hand, skin, and background exactly as they are. Only change the nails. Ensure all visible nails are painted.`;

  const imageParts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: image.replace(/^data:image\/\w+;base64,/, ""),
      },
    },
  ];

  if (referenceImage) {
    imageParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: referenceImage.replace(/^data:image\/\w+;base64,/, ""),
      },
    });
  }

  const response = await ai.models.generateContent({
    model: geminiFlash,
    contents: [{ role: "user", parts: imageParts }],
    config: {
      responseModalities: ["image", "text"],
      responseMimeType: "image/jpeg",
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const resultImage = parts.find((p: any) => p.inlineData)?.inlineData;

  if (!resultImage) {
    return NextResponse.json(
      { error: "No se pudo generar la imagen. Intenta con otra foto." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    image: `data:${resultImage.mimeType};base64,${resultImage.data}`,
  });
}
```

- [ ] **Step 2: Create the try-on client component**

```tsx
// src/components/ai-tryon.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const presetDesigns = [
  { label: "Rosa Clasico", prompt: "classic soft pink gel nails with glossy finish" },
  { label: "Rojo Elegante", prompt: "deep red gel nails with glossy finish, elegant and classic" },
  { label: "French Tips", prompt: "classic french manicure with white tips and natural pink base, clean lines" },
  { label: "Ombre Rosa", prompt: "pink to white ombre gradient nails with glossy finish" },
  { label: "Negro Matte", prompt: "matte black nails with a sophisticated velvet finish" },
  { label: "Chrome Dorado", prompt: "gold chrome mirror nails, highly reflective metallic finish" },
  { label: "Nail Art Floral", prompt: "white base nails with delicate hand-painted pink and purple flowers" },
  { label: "Glitter Festivo", prompt: "silver and gold glitter nails, sparkly party nails" },
];

export function AITryOn() {
  const [handImage, setHandImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"preset" | "custom" | "reference">("preset");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen debe ser menor a 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

  const handleGenerate = async () => {
    if (!handImage) { setError("Sube una foto de tu mano primero"); return; }

    setLoading(true);
    setError("");
    setResultImage(null);

    const designPrompt = mode === "preset"
      ? presetDesigns.find((d) => d.label === selectedPreset)?.prompt
      : mode === "custom"
      ? customPrompt
      : undefined;

    try {
      const res = await fetch("/api/ai/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: handImage,
          designPrompt,
          referenceImage: mode === "reference" ? referenceImage : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step 1: Upload hand photo */}
      <div>
        <h3 className="font-serif text-lg font-medium text-foreground mb-3">
          1. Sube una foto de tu mano
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleImageUpload(e, setHandImage)}
          className="hidden"
        />
        {handImage ? (
          <div className="relative w-full max-w-sm">
            <img src={handImage} alt="Tu mano" className="rounded-2xl border border-accent-light/30" />
            <button
              onClick={() => { setHandImage(null); setResultImage(null); }}
              className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5 hover:bg-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm aspect-[4/3] rounded-2xl border-2 border-dashed border-accent-light/50 hover:border-accent/50 transition-colors flex flex-col items-center justify-center gap-3 text-foreground/40 hover:text-accent-dark"
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-sm">Toca para subir o tomar foto</span>
          </button>
        )}
      </div>

      {/* Step 2: Choose design mode */}
      {handImage && (
        <div>
          <h3 className="font-serif text-lg font-medium text-foreground mb-3">
            2. Elige el diseno
          </h3>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            {([
              { key: "preset", label: "Estilos" },
              { key: "custom", label: "Describir" },
              { key: "reference", label: "Imagen Ref." },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  mode === key
                    ? "bg-accent text-white"
                    : "bg-cream border border-accent-light/30 text-foreground/60 hover:border-accent/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "preset" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetDesigns.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setSelectedPreset(d.label)}
                  className={`p-3 rounded-xl text-sm text-center transition-all ${
                    selectedPreset === d.label
                      ? "bg-accent text-white"
                      : "border border-accent-light/30 text-foreground/60 hover:border-accent/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {mode === "custom" && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe el diseno que quieres... ej: unas rosa pastel con flores delicadas y acabado glossy"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors resize-none"
            />
          )}

          {mode === "reference" && (
            <div>
              <input
                ref={refInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setReferenceImage)}
                className="hidden"
              />
              {referenceImage ? (
                <div className="relative w-48">
                  <img src={referenceImage} alt="Referencia" className="rounded-xl border border-accent-light/30" />
                  <button
                    onClick={() => setReferenceImage(null)}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => refInputRef.current?.click()}
                  className="w-48 aspect-square rounded-xl border-2 border-dashed border-accent-light/50 hover:border-accent/50 flex flex-col items-center justify-center gap-2 text-foreground/40 text-sm"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                  </svg>
                  Subir imagen de referencia
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Generate button */}
      {handImage && (
        <button
          onClick={handleGenerate}
          disabled={loading || (mode === "preset" && !selectedPreset) || (mode === "custom" && !customPrompt) || (mode === "reference" && !referenceImage)}
          className="w-full bg-accent text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generando preview...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Probar Diseno con IA
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {resultImage && (
        <div>
          <h3 className="font-serif text-lg font-medium text-foreground mb-3">
            Tu Preview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/40 mb-2">Original</p>
              <img src={handImage!} alt="Original" className="rounded-2xl border border-accent-light/30" />
            </div>
            <div>
              <p className="text-xs text-foreground/40 mb-2">Con diseno</p>
              <img src={resultImage} alt="Preview" className="rounded-2xl border border-accent/30 shadow-lg shadow-accent/10" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <a
              href="/reservar"
              className="flex-1 bg-accent text-white py-3 rounded-full text-sm text-center hover:bg-accent-dark transition-colors"
            >
              Reservar Este Diseno
            </a>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 rounded-full text-sm border border-accent/40 text-accent-dark hover:bg-cream transition-colors"
            >
              Regenerar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the try-on page**

```tsx
// src/app/prueba-virtual/page.tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AITryOn } from "@/components/ai-tryon";

export const metadata = {
  title: "Prueba Virtual con IA | Caiena Beauty Nails",
  description: "Prueba diferentes disenos de unas en tu propia mano usando inteligencia artificial.",
};

export default function PruebaVirtualPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-b from-cream to-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">
              Inteligencia Artificial
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              Prueba Virtual
            </h1>
            <p className="text-foreground/50 mt-3 max-w-md mx-auto">
              Sube una foto de tu mano y prueba diferentes disenos con IA antes de tu cita.
            </p>
            <div className="w-16 h-px bg-accent mx-auto mt-4" />
          </div>
          <AITryOn />
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Add nav link**

In `src/components/navbar.tsx`, add to the `links` array:

```ts
{ href: "/prueba-virtual", label: "Prueba IA" },
```

- [ ] **Step 5: Build and verify**

```bash
npm run build 2>&1 | tail -10
```
Expected: Build succeeds with `/prueba-virtual` route

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai/try-on/ src/components/ai-tryon.tsx src/app/prueba-virtual/ src/components/navbar.tsx
git commit -m "feat: add AI virtual nail try-on with Gemini"
```

---

## Task 3: AI Nail Art Generator

**Files:**
- Create: `src/app/api/ai/generate/route.ts`
- Create: `src/components/nail-generator.tsx`
- Create: `src/app/generador/page.tsx`

- [ ] **Step 1: Create the generator API route**

```ts
// src/app/api/ai/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ai, geminiFlash } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const { prompt, style, shape, color } = await request.json();

  if (!prompt && !style) {
    return NextResponse.json({ error: "Describe el diseno que quieres" }, { status: 400 });
  }

  const fullPrompt = [
    "Generate a photorealistic close-up image of a hand with beautifully done nail art.",
    "The nails should have the following design:",
    prompt || "",
    style ? `Style: ${style}.` : "",
    shape ? `Nail shape: ${shape}.` : "",
    color ? `Primary color: ${color}.` : "",
    "Show a female hand with all five fingers visible, elegant pose against a clean neutral background.",
    "Professional nail salon quality. High detail, soft lighting, realistic skin texture.",
  ].filter(Boolean).join(" ");

  const response = await ai.models.generateContent({
    model: geminiFlash,
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    config: {
      responseModalities: ["image", "text"],
      responseMimeType: "image/jpeg",
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const resultImage = parts.find((p: any) => p.inlineData)?.inlineData;

  if (!resultImage) {
    return NextResponse.json(
      { error: "No se pudo generar el diseno. Intenta con otra descripcion." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    image: `data:${resultImage.mimeType};base64,${resultImage.data}`,
  });
}
```

- [ ] **Step 2: Create the generator client component**

```tsx
// src/components/nail-generator.tsx
"use client";

import { useState } from "react";

const styles = ["Gel", "Acrilico", "Polygel", "Chrome", "Matte", "Glitter", "French", "Ombre"];
const shapes = ["Coffin", "Almond", "Stiletto", "Square", "Oval", "Round"];
const colors = ["Rosa", "Rojo", "Negro", "Blanco", "Nude", "Dorado", "Azul", "Morado", "Verde"];

export function NailGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [shape, setShape] = useState("");
  const [color, setColor] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt && !style) { setError("Describe el diseno o elige un estilo"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, shape, color }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages((prev) => [data.image, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Prompt */}
      <div>
        <label className="block text-sm text-foreground/60 mb-1.5">
          Describe tu diseno ideal
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="ej: unas rosa pastel con mariposas 3D y cristales pequenos..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors resize-none"
        />
      </div>

      {/* Quick options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-foreground/40 mb-2">Estilo</label>
          <div className="flex flex-wrap gap-1.5">
            {styles.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(style === s ? "" : s)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  style === s ? "bg-accent text-white" : "bg-cream border border-accent-light/30 text-foreground/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-foreground/40 mb-2">Forma</label>
          <div className="flex flex-wrap gap-1.5">
            {shapes.map((s) => (
              <button
                key={s}
                onClick={() => setShape(shape === s ? "" : s)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  shape === s ? "bg-accent text-white" : "bg-cream border border-accent-light/30 text-foreground/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-foreground/40 mb-2">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(color === c ? "" : c)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  color === c ? "bg-accent text-white" : "bg-cream border border-accent-light/30 text-foreground/60"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={loading || (!prompt && !style)}
        className="w-full bg-accent text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creando diseno...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Generar Diseno
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Generated images */}
      {images.length > 0 && (
        <div>
          <h3 className="font-serif text-lg font-medium text-foreground mb-3">
            Disenos Generados
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img} alt={`Diseno ${i + 1}`} className="rounded-2xl border border-accent-light/30 w-full" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 rounded-2xl transition-colors flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                  <a
                    href="/reservar"
                    className="bg-accent text-white px-4 py-2 rounded-full text-xs hover:bg-accent-dark transition-colors"
                  >
                    Reservar Este Diseno
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the generator page**

```tsx
// src/app/generador/page.tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { NailGenerator } from "@/components/nail-generator";

export const metadata = {
  title: "Generador de Nail Art con IA | Caiena Beauty Nails",
  description: "Crea disenos unicos de nail art con inteligencia artificial. Describe tu idea y la IA la genera.",
};

export default function GeneradorPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-b from-cream to-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">
              Inteligencia Artificial
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              Generador de Disenos
            </h1>
            <p className="text-foreground/50 mt-3 max-w-md mx-auto">
              Describe el diseno de tus suenos y nuestra IA lo creara para ti.
            </p>
            <div className="w-16 h-px bg-accent mx-auto mt-4" />
          </div>
          <NailGenerator />
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Build and verify**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/generate/ src/components/nail-generator.tsx src/app/generador/
git commit -m "feat: add AI nail art design generator with Gemini"
```

---

## Task 4: AI Chatbot (Floating Widget)

**Files:**
- Create: `src/app/api/ai/chat/route.ts`
- Create: `src/components/ai-chatbot.tsx`
- Modify: `src/app/layout.tsx` (add chatbot to global layout)

- [ ] **Step 1: Create chatbot API route**

```ts
// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ai, geminiChat } from "@/lib/gemini";

const SYSTEM_PROMPT = `Eres el asistente virtual de Caiena Beauty Nails, un salon de unas en Leander, TX operado por Roxanna Acosta.

INFORMACION DEL NEGOCIO:
- Servicios: Manicure Clasico ($25, 45min), Manicure Gel ($35, 60min), Polygel Full Set ($55, 90min), Refuerzo Polygel ($40, 60min), Nail Art ($15+, 30min), Pedicure Clasico ($35, 60min), Pedicure Gel ($45, 75min)
- Horario: Lun-Vie 9:00-18:00, Sab 10:00-16:00, Dom cerrado
- Ubicacion: Home-based studio en Leander, TX (area de Austin)
- Solo con cita previa
- Instagram: @caiena.us

COMPORTAMIENTO:
- Responde SIEMPRE en espanol
- Se amable, profesional y entusiasta sobre unas
- Si preguntan por disponibilidad, dirige a /reservar para ver horarios en tiempo real
- Si preguntan por disenos, sugiere visitar /prueba-virtual para probar con IA o /generador para crear disenos
- Si preguntan por precios, da la informacion exacta de arriba
- Puedes dar consejos de cuidado de unas
- No inventes informacion que no tengas
- Mantene respuestas cortas y utiles (maximo 3 oraciones a menos que pidan mas detalle)`;

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "Se requieren mensajes" }, { status: 400 });
  }

  const contents = [
    { role: "user" as const, parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model" as const, parts: [{ text: "Entendido. Soy el asistente de Caiena Beauty Nails. Estoy lista para ayudar." }] },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    })),
  ];

  const response = await ai.models.generateContent({
    model: geminiChat,
    contents,
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "Lo siento, no pude procesar tu mensaje.";

  return NextResponse.json({ message: text });
}
```

- [ ] **Step 2: Create floating chatbot widget**

```tsx
// src/components/ai-chatbot.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola! Soy el asistente de Caiena Beauty Nails. ¿En que puedo ayudarte? Puedo contarte sobre servicios, precios, o ayudarte a agendar tu cita." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Lo siento, tuve un error. ¿Puedes intentar de nuevo?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-accent-light/30 flex flex-col max-h-[70vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent-light/20 bg-cream/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blush/60 flex items-center justify-center">
                <span className="font-serif text-sm text-accent-dark">C</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Caiena</p>
                <p className="text-[10px] text-green-600">En linea</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-foreground/40 hover:text-foreground">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-cream/80 text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-cream/80 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-accent-light/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-3.5 py-2.5 rounded-full border border-accent-light/40 bg-cream/30 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent-dark transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Chat con Caiena"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>
    </>
  );
}
```

- [ ] **Step 3: Add chatbot to global layout**

In `src/app/layout.tsx`, import and add `<AIChatbot />` just before closing `</body>`.

- [ ] **Step 4: Build and verify**
- [ ] **Step 5: Commit**

---

## Task 5: Database Schema Extensions (Gift Cards, Reviews, Loyalty)

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/seed.ts` (if needed)

Add these tables to the existing schema:

- **giftCards**: id, code (unique 8-char), amount, balance, purchaserName, purchaserEmail, recipientName, recipientEmail, message, status (active/used/expired), createdAt
- **reviews**: id, bookingId, clientName, rating (1-5), comment, approved, createdAt
- **loyaltyPoints**: id, clientPhone (unique key), points, totalEarned, tier (bronze/silver/gold), createdAt

- [ ] **Step 1: Add tables to schema.ts**
- [ ] **Step 2: Run drizzle-kit push**
- [ ] **Step 3: Commit**

---

## Task 6: Gift Cards (Purchase + Redeem)

**Files:**
- Create: `src/app/api/gift-cards/route.ts` (POST purchase, GET check balance)
- Create: `src/app/api/gift-cards/[code]/route.ts` (GET lookup)
- Create: `src/components/gift-card-form.tsx`
- Create: `src/app/gift-cards/page.tsx`

Features: Purchase gift card ($25/$50/$75/$100 or custom), receive code via email display, check balance, redeem at booking.

- [ ] Steps: API routes → component → page → build → commit

---

## Task 7: Instagram Feed Integration

**Files:**
- Create: `src/components/instagram-feed.tsx`
- Modify: `src/components/gallery.tsx`

Use Instagram's oEmbed or scrape recent posts via the Mac M4 Playwright (cached) to display a live feed of recent nail art photos from @caiena.us.

- [ ] Steps: Component → integrate into gallery → build → commit

---

## Task 8: Review System (Post-Booking + Display)

**Files:**
- Create: `src/app/api/reviews/route.ts`
- Create: `src/components/review-prompt.tsx`
- Create: `src/components/testimonials.tsx`
- Modify: `src/app/page.tsx` (add testimonials section)
- Modify: booking confirmation step (add review prompt)

After a booking is completed, show a review prompt. Display approved reviews as testimonials on the homepage.

- [ ] Steps: API → components → integrate → build → commit

---

## Task 9: Loyalty Program (Points + Tiers)

**Files:**
- Create: `src/app/api/loyalty/route.ts`
- Create: `src/components/loyalty-badge.tsx`
- Modify: booking confirmation (award points)
- Modify: admin dashboard (show loyalty info)

Points system: $1 = 1 point. Tiers: Bronze (0-99), Silver (100-299), Gold (300+). Perks: Silver = 5% off, Gold = 10% off + priority booking.

- [ ] Steps: API → component → integrate into booking → admin view → build → commit

---

## Task 10: WhatsApp Automation (Twilio)

**Files:**
- Create: `src/lib/whatsapp.ts`
- Modify: `src/app/api/bookings/route.ts` (send confirmation)
- Create: `src/app/api/webhooks/whatsapp/route.ts` (receive messages)

Send automated WhatsApp messages: booking confirmation, 24h reminder, post-visit follow-up. Requires Twilio account with WhatsApp sandbox or approved number.

- [ ] Steps: Twilio setup → helpers → integrate into booking → webhook → build → commit

---

## Execution Order

1. Task 1 (Gemini setup) - foundation
2. Task 2 (AI Try-On) - hero feature
3. Task 3 (AI Generator) - second hero feature
4. Task 4 (AI Chatbot) - engagement
5. Task 5 (DB schema) - foundation for remaining
6. Task 6 (Gift Cards) - revenue
7. Task 7 (Instagram Feed) - social proof
8. Task 8 (Reviews) - trust
9. Task 9 (Loyalty) - retention
10. Task 10 (WhatsApp) - communication

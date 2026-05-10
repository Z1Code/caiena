/**
 * generate-bases-maestras.mjs
 *
 * Genera 4 imágenes base de mano profesional (sin diseño de uñas) en las
 * posiciones definidas por Caiena Nails.
 *
 * Usa Gemini multimodal: envía la foto de referencia real de Instagram como
 * guía de estilo fotográfico, y pide generar la misma pose/composición pero
 * con uñas limpias (sin esmalte) y aspecto de catálogo premium unificado.
 *
 * Posiciones / referencias:
 *   1. garra       – 3825940990721649196.jpg
 *   2. ascendente  – 3881106248586827977.jpg
 *   3. doble       – 3855767944119262427.jpg
 *   4. rocio       – 2927858139367384226.jpg
 *
 * Uso:
 *   node scripts/generate-bases-maestras.mjs
 *
 * Requiere GEMINI_API_KEY en .env.local
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Config ───────────────────────────────────────────────────────────────────

const IMAGES_DIR =
  "C:/Users/PC/Desktop/caiena_instagram_pipeline_20260430_222913/data/organized/posts/images";

const OUTPUT_DIR = join(ROOT, "public", "bases-maestras");

// Load API key from .env.local
function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) throw new Error(".env.local not found");
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const [key, ...rest] = line.trim().split("=");
    if (key && rest.length) process.env[key] = rest.join("=");
  }
}

loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key") {
  console.error("❌ Falta GEMINI_API_KEY en .env.local");
  process.exit(1);
}

// ─── Estilo maestro unificado — nivel OPI / Dior / Chanel ────────────────────
//
// PROPÓSITO: bases MÁSCARAS neutras 3:4 portrait (900×1200).
// Los diseños (color, forma, acabado, arte) se aplicarán encima con Gemini.
//
// Síntesis del research de marcas de lujo:
//   DIOR  → rim lateral que crea crecientes de luz en la uña, piel luminosa
//            porcelana, crop medio (dedos hasta palma media), fondo oscuro
//   CHANEL → extremadamente tight, negro profundo, piel fair cool-neutral,
//            ángulo lateral para resaltar forma de uña
//   OPI   → dedos ligeramente curvados (nunca rígidos), fanned, knuckles
//            visibles, color grade warm-neutral preciso
//
// REGLAS ABSOLUTAS:
//   · Portrait 3:4 — formato nativo de catálogo de lujo
//   · Fondo: negro profundo mate, seamless, sin gradiente
//   · Iluminación: rim light lateral suave + fill frontal difuso;
//     crea crecientes de luz en la superficie de la uña (Dior signature)
//   · Piel: porcelana clara luminosa, cool-warm neutral, sin bronceado
//           consistente e idéntica en las 4 imágenes
//   · Uñas: almendra mediana, completamente desnudas — solo placa natural
//           con su brillo inherente de keratina (no esmalte, no top coat)
//           superficie lisa y ligeramente reflectante = canvas perfecto para IA
//   · Dedos: ligeramente curvados, nunca rígidos ni estirados
//           (crea ilusión de longitud y elegancia — regla OPI)
//   · Crop: dedos hasta palma media, muñeca al borde o fuera de frame
//   · Sin joyas, sin anillos, sin accesorios
//   · Sin watermark, sin texto, sin logo
//   · Fotorrealista, ultra-sharp, campaña Dior Beauty / Chanel Le Vernis
//
const SHARED_STYLE = `
TECHNICAL SPECS:
- Format: portrait 3:4, ultra-high resolution
- Background: pure deep matte black, seamless, zero gradients or textures, rich inky darkness
- Lighting: controlled soft rim light from the upper-left side creating delicate crescent highlights on the nail surface (Dior-style specular) + a diffused gentle frontal fill that keeps skin luminous without flattening depth — no harsh shadows, no blown highlights
- Color grade: neutral-warm, slightly lifted contrast, cinematic luxury — skin glows without being golden-tanned
- Skin: fair luminous porcelain with warm undertone, flawless, natural — consistent and identical tone in all images
- Nails: medium-length almond shape — completely bare, no nail polish, no color, no top coat — only the natural nail plate with its inherent subtle keratin sheen, smooth reflective surface ready as a canvas
- Fingers: naturally and gently curved (never stiff or fully extended) — creates illusion of elegance and length
- Crop: tight from fingertips to mid-palm, wrist at edge or outside frame
- No rings, no jewelry, no bracelets, no accessories whatsoever
- No watermarks, no text, no logos, no brand marks
- Quality: Dior Vernis campaign / Chanel Le Vernis editorial — photorealistic, ultra-sharp focus on nails and fingertips
`.trim();

// ─── Bases a generar ──────────────────────────────────────────────────────────

const BASES = [
  {
    id: "garra",
    label: "Garra",
    filename: "base_garra.jpg",
    prompt: `${SHARED_STYLE}

HAND POSE — garra (relaxed claw):
One elegant woman's hand in a refined claw position — the four fingers curve gently and naturally inward toward the palm, as if loosely cupping air. Fingers are not tightly clenched but soft and graceful. The thumb curves naturally to the side. Shot from a 3/4 front-angle slightly above the hand. The rim light catches each nail's curved surface, creating a row of precise light crescents across the claw. The knuckles form subtle elegant ridges in the dark. Dramatic, restrained, couture composition. Crop: knuckles to fingertips, palm partially visible.`,
  },
  {
    id: "ascendente",
    label: "Ascendente",
    filename: "base_ascendente.jpg",
    prompt: `${SHARED_STYLE}

HAND POSE — ascendente (ascending):
One elegant woman's hand rising gracefully upward, fingers naturally fanned and gently curved — never stiff. The wrist enters frame from the very bottom edge. Shot from a slight 3/4 front-side angle, fingers reaching toward the top of the frame. The elongated composition emphasizes the length and elegance of the fingers. The rim light traces a delicate highlight along the edge of each finger and catches the nail surface. Airy, refined, Chanel-style elongated beauty editorial. Crop: fingertips fully visible, wrist just entering bottom edge.`,
  },
  {
    id: "doble",
    label: "Doble",
    filename: "base_doble.jpg",
    prompt: `${SHARED_STYLE}

HAND POSE — doble (two hands layered):
ANATOMICAL REQUIREMENT — CRITICAL: Exactly TWO human hands. Each hand has EXACTLY 5 fingers (4 fingers + 1 thumb). Total fingers in the image: EXACTLY 10. No extra fingers, no missing fingers, no anatomical errors. This is non-negotiable.

Two elegant women's hands with identical porcelain skin, one hand resting diagonally on top of the other. The bottom hand faces up (palm partially visible), the top hand rests across it with fingers slightly fanned. The layering creates depth without obscuring finger count — all 10 fingers remain individually visible and anatomically correct. Both sets of 5 nails catch the rim light with clean crescent highlights. Shot from a slight overhead-front angle, medium-tight crop (fingertips to mid-palm). Editorial, Dior couture feel. No rings or jewelry. No extra or phantom fingers.`,
  },
  {
    id: "rocio",
    label: "Rocío",
    filename: "base_rocio.jpg",
    prompt: `${SHARED_STYLE}

HAND POSE — rocío (flat overhead):
One elegant woman's hand resting completely flat on a smooth dark matte surface, fingers gently and naturally spread — a soft relaxed position, not forced or stiff. The hand is viewed from directly overhead, slightly tilted. All five nails face directly up toward the camera and are fully visible as a clean row. The rim light from above-left creates a uniform gloss on the dark surface and delicate highlights on each nail. The surface beneath is the same deep matte black as the background — seamless, no distinction between floor and background. Minimal, product-catalog precision. Crop: full hand flat, fingertips to mid-wrist visible.`,
  },
];

// ─── Gemini multimodal image generation ──────────────────────────────────────

async function callGeminiImage(parts, model = "gemini-3.1-flash-image-preview") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function callImagenPredict(prompt) {
  // Imagen 4 Ultra — native 3:4 portrait support
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict?key=${GEMINI_API_KEY}`;
  const body = {
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio: "3:4" },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Imagen API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const pred = data.predictions?.[0];
  if (!pred?.bytesBase64Encoded) throw new Error("Imagen: no image returned");
  return { data: pred.bytesBase64Encoded, mimeType: pred.mimeType ?? "image/png" };
}

async function generateFromPrompt(prompt) {
  // Strategy 1: gemini-3.1-flash-image-preview (text → image)
  try {
    const data = await callGeminiImage([{ text: prompt }], "gemini-3.1-flash-image-preview");
    const imgPart = data.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.mimeType?.startsWith("image/")
    );
    if (imgPart) {
      // Check if portrait (h > w) — parse JPEG SOF marker properly
      const buf = Buffer.from(imgPart.inlineData.data, "base64");
      let isPortrait = false;
      for (let i = 0; i < buf.length - 9; i++) {
        if (buf[i] === 0xFF && (buf[i+1] === 0xC0 || buf[i+1] === 0xC2)) {
          const h = buf.readUInt16BE(i + 5);
          const w = buf.readUInt16BE(i + 7);
          isPortrait = h > w;
          console.log(`    gemini-3.1 → ${w}x${h} ${isPortrait ? "portrait ✓" : "landscape, usando Imagen 4 para 3:4..."}`);
          break;
        }
      }
      if (isPortrait) return { data: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType };
    } else {
      const reason = data.candidates?.[0]?.finishReason;
      console.log(`    ⚠️  gemini-3.1 finishReason=${reason}, usando Imagen 3...`);
    }
  } catch (e) {
    console.log(`    ⚠️  gemini-3.1 error: ${e.message.slice(0, 80)}, usando Imagen 3...`);
  }

  // Strategy 2: Imagen 4 Ultra — garantiza 3:4 portrait nativo
  console.log(`    → Imagen 4 Ultra (aspectRatio: 3:4)...`);
  return callImagenPredict(prompt);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("🎨 Generando bases maestras con Gemini (multimodal)...\n");
  console.log("  Estilo: referencias reales de Instagram → base limpia premium\n");

  const results = [];

  for (const base of BASES) {
    const outPath = join(OUTPUT_DIR, base.filename);
      if (existsSync(outPath)) {
      console.log(`⏭️  ${base.label} ya existe, saltando`);
      results.push({ ...base, path: outPath, status: "skipped" });
      continue;
    }

    console.log(`⏳ Generando: ${base.label}...`);
    try {
      const { data } = await generateFromPrompt(base.prompt);
      const buffer = Buffer.from(data, "base64");
      writeFileSync(outPath, buffer);
      console.log(`✅ ${base.label} → ${base.filename}`);
      results.push({ ...base, path: outPath, status: "generated" });
    } catch (err) {
      console.error(`❌ ${base.label}: ${err.message.slice(0, 300)}`);
      results.push({ ...base, status: "error", error: err.message });
    }

    // Pause between requests to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Save manifest for the app to use
  const manifest = {
    generated: new Date().toISOString(),
    bases: results.map((r) => ({
      id: r.id,
      label: r.label,
      filename: r.filename,
      publicPath: `/bases-maestras/${r.filename}`,
      reference: r.reference,
      status: r.status,
      error: r.error ?? null,
    })),
  };

  writeFileSync(join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  const ok = results.filter((r) => r.status === "generated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "error").length;

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`✨ Bases maestras completas`);
  console.log(`   ✅ Generadas: ${ok}`);
  console.log(`   ⏭️  Saltadas:  ${skipped}`);
  console.log(`   ❌ Errores:   ${failed}`);
  console.log(`📁 ${OUTPUT_DIR}`);
  console.log(`═══════════════════════════════════════════\n`);

  if (failed > 0) {
    console.log("Errores detallados:");
    results.filter((r) => r.status === "error").forEach((r) => {
      console.log(`  · ${r.label}: ${r.error}`);
    });
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

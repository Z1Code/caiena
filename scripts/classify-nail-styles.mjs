/**
 * classify-nail-styles.mjs
 *
 * Analyzes nail photos from the Instagram pipeline with Gemini Flash,
 * organizes them into category folders, and generates a catalog.json
 * ready to import into the nail_styles table.
 *
 * Usage:
 *   node scripts/classify-nail-styles.mjs
 *
 * Requires:
 *   - .env.local with GEMINI_API_KEY
 *   - @google/generative-ai (already in project deps)
 *
 * Resumes automatically if interrupted (saves progress after each batch).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Config ───────────────────────────────────────────────────────────────────

const INPUT_DIR =
  "C:/Users/PC/Desktop/caiena_instagram_pipeline_20260430_222913/data/organized/posts/images";

const OUTPUT_DIR =
  "C:/Users/PC/Desktop/caiena_instagram_pipeline_20260430_222913/data/classified";

const PROGRESS_FILE = join(OUTPUT_DIR, "_progress.json");
const CATALOG_FILE = join(OUTPUT_DIR, "_catalog.json");

const BATCH_SIZE = 5;    // concurrent Gemini requests
const DELAY_MS = 1200;   // wait between batches (ms) — avoids rate limits

// ─── Gemini setup ─────────────────────────────────────────────────────────────

const envContent = readFileSync(join(ROOT, ".env.local"), "utf-8");
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
if (!apiKeyMatch) {
  console.error("❌ GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKeyMatch[1].trim());
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  "french",       // French manicure, baby boomer, reverse french
  "solid",        // Solid color or two-tone, no art
  "floral",       // Flowers, leaves, botanical
  "geometrico",   // Lines, shapes, graphic patterns
  "glitter_foil", // Glitter or gold/silver foil
  "ombre",        // Gradient / ombre
  "chrome",       // Chrome / mirror / full metallic
  "minimalista",  // Negative space, dots, thin single lines
  "nail_art",     // Complex art that doesn't fit above
  "descarte",     // Not a nail photo / blurry / product shot
];

// Map internal category → nail_styles.category enum
const CATEGORY_MAP = {
  french:       "french",
  solid:        "gel",
  floral:       "nail_art",
  geometrico:   "nail_art",
  glitter_foil: "nail_art",
  ombre:        "minimal",
  chrome:       "chrome",
  minimalista:  "minimal",
  nail_art:     "nail_art",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Timestamp-suffixed files are exact duplicates of their base version.
 * Pattern: POSTID_TIMESTAMP.jpg  or  POSTID_CHILDID_TIMESTAMP.jpg
 * Timestamps start with 1 (e.g. 1770194457000000000), Instagram IDs start with 2.
 */
function isTimestampDuplicate(filename) {
  const stem = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  const parts = stem.split("_");
  if (parts.length === 3) return true; // always a duplicate
  if (parts.length === 2 && /^1\d{18}$/.test(parts[1])) return true;
  return false;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Gemini prompt ────────────────────────────────────────────────────────────

const PROMPT = `You are a professional nail technician and salon expert. Analyze this nail photo carefully.

Return ONLY a valid JSON object with these exact fields (no markdown, no extra text):

{
  "categoria": "<french|solid|floral|geometrico|glitter_foil|ombre|chrome|minimalista|nail_art|descarte>",
  "color_principal": "<nude|rosa|rojo|burdeos|blanco|negro|azul|verde|morado|lila|coral|amarillo|naranja|multicolor|plateado|dorado|gris|beige>",
  "color_secundario": "<same options as color_principal, or null>",
  "acabado": "<glossy|matte|chrome|glitter|satinado>",
  "forma": "<cuadrada|redonda|oval|almendra|stiletto|coffin>",
  "longitud": "<corta|media|larga>",
  "nombre_sugerido": "<attractive Spanish name, max 4 words, e.g. 'French Clásico Nude'>",
  "descripcion": "<1 sentence in Spanish describing the design for a client>",
  "prompt_gemini": "<English technical description for AI image generation, 15-25 words, be specific about colors, patterns, finish>",
  "calidad_foto": "<alta|media|baja>",
  "apto_catalogo": <true if nails are clearly visible and professionally photographed; false otherwise>
}

Use "descarte" only if: no nails visible, photo is a product shot, heavy text overlay, or extremely blurry.`;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function classifyImage(imagePath) {
  const imageData = readFileSync(imagePath);
  const base64 = imageData.toString("base64");
  const ext = imagePath.split(".").pop()?.toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType: mime, data: base64 } },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  });

  const text = result.response.text().trim();
  return JSON.parse(text);
}

async function main() {
  // Create output folders
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const cat of CATEGORIES) {
    mkdirSync(join(OUTPUT_DIR, cat), { recursive: true });
  }

  // Load previous progress
  let progress = {};
  if (existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
    console.log(`📂 Resuming — ${Object.keys(progress).length} already processed`);
  }

  // Get unique images
  const allFiles = (await readdir(INPUT_DIR)).filter((f) =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  );
  const toProcess = allFiles.filter((f) => !isTimestampDuplicate(f));
  const pending = toProcess.filter((f) => !progress[f]);

  console.log(`📸 ${allFiles.length} total files → ${toProcess.length} unique → ${pending.length} pending`);

  let done = Object.keys(progress).length;

  // Process in batches
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (filename) => {
        const imagePath = join(INPUT_DIR, filename);
        try {
          const result = await classifyImage(imagePath);

          // Validate category
          if (!CATEGORIES.includes(result.categoria)) {
            result.categoria = "nail_art";
          }

          progress[filename] = { ...result, filename };

          // Copy to category folder
          copyFileSync(imagePath, join(OUTPUT_DIR, result.categoria, filename));

          done++;
          const status = result.apto_catalogo ? "✅" : "⏭️";
          console.log(
            `[${done}/${toProcess.length}] ${status} ${filename} → ${result.categoria} | ${result.nombre_sugerido}`
          );
        } catch (err) {
          console.error(`  ❌ ERROR ${filename}: ${err.message}`);
          // Mark as failed so we don't retry automatically (re-run to retry)
          progress[filename] = { error: err.message, filename, categoria: "descarte", apto_catalogo: false };
          done++;
        }
      })
    );

    // Save after every batch
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    if (i + BATCH_SIZE < pending.length) {
      await sleep(DELAY_MS);
    }
  }

  // ─── Generate catalog.json ─────────────────────────────────────────────────
  const catalog = Object.values(progress)
    .filter((r) => r.apto_catalogo && !r.error && r.categoria !== "descarte")
    .map((r) => ({
      // Fields matching nail_styles table schema
      name: r.nombre_sugerido,
      description: r.descripcion ?? "",
      category: CATEGORY_MAP[r.categoria] ?? "nail_art",
      prompt: r.prompt_gemini ?? "",
      thumbnailSrc: join(OUTPUT_DIR, r.categoria, r.filename).replace(/\\/g, "/"),
      // Extra metadata (for filtering UI)
      color: r.color_principal,
      color_secundario: r.color_secundario ?? null,
      acabado: r.acabado,
      forma: r.forma,
      longitud: r.longitud,
      estilo: r.categoria,     // internal category (more granular than nail_styles.category)
      originalFile: r.filename,
    }));

  writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));

  // ─── Summary ──────────────────────────────────────────────────────────────
  const byCategory = {};
  for (const r of Object.values(progress)) {
    if (r.error) continue;
    byCategory[r.categoria] = (byCategory[r.categoria] ?? 0) + 1;
  }

  console.log("\n═══════════════════════════════════════");
  console.log("✨ Classification complete!");
  console.log(`📋 Catalog-ready: ${catalog.length} images`);
  console.log("\nBreakdown by category:");
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat.padEnd(14)} ${count}`);
  }
  console.log(`\n📁 Organized → ${OUTPUT_DIR}`);
  console.log(`📄 Catalog   → ${CATALOG_FILE}`);
  console.log("═══════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

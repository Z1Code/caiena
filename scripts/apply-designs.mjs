/**
 * apply-designs.mjs — Batch pipeline
 * Scans 37* images, sha256-dedup, generates 4 Gemini variants + classifies each design.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { createHash } from "crypto";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const IMAGES_DIR =
  "C:/Users/PC/Desktop/caiena_instagram_pipeline_20260430_222913/data/organized/posts/images";
const BASES_DIR = join(ROOT, "public", "bases-maestras");
const OUTPUT_DIR = join(ROOT, "public", "catalog-preview");

const BASES = ["garra", "ascendente", "doble", "rocio"];
const BASE_FILES = {
  garra:      join(BASES_DIR, "base_garra.jpg"),
  ascendente: join(BASES_DIR, "base_ascendente.jpg"),
  doble:      join(BASES_DIR, "base_doble.jpg"),
  rocio:      join(BASES_DIR, "base_rocio.jpg"),
};

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

// ─── DB helpers (raw SQL, matching project pattern) ────────────────────────

async function dbGetQueueByHash(hash) {
  const rows = await sql`
    SELECT id, status, style_id FROM catalog_queue WHERE source_hash = ${hash}
  `;
  return rows[0] ?? null;
}

async function dbInsertStyle({ name, category, color, acabado, forma, estilo }) {
  const rows = await sql`
    INSERT INTO nail_styles (name, description, category, prompt, color, acabado, forma, estilo, active, published, sort_order)
    VALUES (${name}, '', ${category}, '', ${color ?? null}, ${acabado ?? null}, ${forma ?? null}, ${estilo ?? null}, true, false, 0)
    RETURNING id
  `;
  return rows[0].id;
}

async function dbInsertQueue({ sourceImagePath, sourceHash, styleId }) {
  const rows = await sql`
    INSERT INTO catalog_queue (source_image_path, source_hash, style_id, status)
    VALUES (${sourceImagePath}, ${sourceHash}, ${styleId}, 'processing')
    RETURNING id
  `;
  return rows[0].id;
}

async function dbInsertVariant({ styleId, baseId, imagePath, status, errorMsg }) {
  await sql`
    INSERT INTO nail_style_variants (style_id, base_id, image_path, status, error_msg)
    VALUES (${styleId}, ${baseId}, ${imagePath}, ${status}, ${errorMsg ?? null})
    ON CONFLICT (style_id, base_id) DO UPDATE SET image_path = EXCLUDED.image_path, status = EXCLUDED.status, error_msg = EXCLUDED.error_msg
  `;
}

async function dbUpdateStyleThumbnail(styleId, thumbnailUrl) {
  await sql`UPDATE nail_styles SET thumbnail_url = ${thumbnailUrl} WHERE id = ${styleId}`;
}

async function dbUpdateQueueStatus(queueId, status) {
  await sql`UPDATE catalog_queue SET status = ${status}, processed_at = NOW() WHERE id = ${queueId}`;
}

// ─── Gemini helpers ────────────────────────────────────────────────────────

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
        const err = await res.text();
        console.log(`    ⚠️  ${model} HTTP ${res.status}: ${err.slice(0, 100)}`);
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

async function classifyDesign(designFile) {
  const prompt = `Analyze this nail design photo and return ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "name": "short elegant name in Spanish for this nail style (3-5 words, title case)",
  "color": "one of: nude|rosa|rojo|burdeos|blanco|negro|azul|verde|morado|lila|coral|multicolor|plateado|dorado|gris|beige",
  "acabado": "one of: glossy|matte|chrome|glitter|satinado",
  "forma": "one of: cuadrada|redonda|oval|almendra|stiletto|coffin",
  "estilo": "one of: french|solid|floral|geometrico|glitter_foil|ombre|chrome|minimalista|nail_art"
}`;

  const result = await geminiGenerate([toInlineData(designFile), { text: prompt }], false);
  if (!result) return null;
  try {
    const json = result.text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(json);
  } catch {
    console.log(`    ⚠️  Could not parse classification JSON: ${result.text?.slice(0, 100)}`);
    return null;
  }
}

async function generateVariant(baseFile, designFile) {
  const prompt = `You are a professional nail art retouching artist for a luxury nail catalog.

TASK: Apply the nail design from the REFERENCE PHOTO onto the bare nails in the BASE PHOTO.

REFERENCE PHOTO (second image): Extract ONLY the nail color, pattern, art, and finish. Ignore hand shape, skin tone, background, jewelry, accessories.

BASE PHOTO (first image): Professional studio hand photo with bare natural nails on pure black background. Your canvas.

Paint every nail with the exact design from the reference. Keep EVERYTHING else identical: pose, skin tone, background, lighting.
No jewelry, no rings, no accessories. No watermarks, no text.
Professional luxury catalog photo quality — sharp, editorial, Dior/Chanel level.`;

  return geminiGenerate([toInlineData(baseFile), toInlineData(designFile), { text: prompt }], true);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const allImages = readdirSync(IMAGES_DIR)
    .filter((f) => f.startsWith("37") && /\.(jpg|jpeg|png)$/i.test(f))
    .map((f) => join(IMAGES_DIR, f));

  console.log(`🎨 Encontradas ${allImages.length} imágenes "37*"\n`);

  let totalOk = 0;
  let totalErrors = 0;

  for (const imgPath of allImages) {
    const filename = basename(imgPath);
    const hash = createHash("sha256").update(readFileSync(imgPath)).digest("hex");

    // sha256 dedup check
    const existing = await dbGetQueueByHash(hash);
    if (existing) {
      if (existing.status === "done") {
        console.log(`⏭️  ${filename} — ya procesado (styleId=${existing.style_id})`);
        continue;
      }
      // Clean up stale processing entry so we can retry
      if (existing.status === "processing" || existing.status === "error") {
        console.log(`  ♻️  Limpiando entrada previa (status=${existing.status})`);
        await sql`DELETE FROM catalog_queue WHERE id = ${existing.id}`;
        await sql`DELETE FROM nail_style_variants WHERE style_id = ${existing.style_id}`;
        await sql`DELETE FROM nail_styles WHERE id = ${existing.style_id}`;
      }
    }

    console.log(`\n⏳ Procesando: ${filename}`);

    // Classify
    console.log("  📋 Clasificando...");
    const cls = await classifyDesign(imgPath);
    const name = cls?.name ?? filename.replace(/\.\w+$/, "");
    console.log(`  → ${name} (${cls?.color ?? "?"} / ${cls?.acabado ?? "?"} / ${cls?.estilo ?? "?"})`);

    // Insert nailStyle
    const styleId = await dbInsertStyle({
      name,
      category: cls?.estilo ?? "nail_art",
      color: cls?.color,
      acabado: cls?.acabado,
      forma: cls?.forma,
      estilo: cls?.estilo,
    });

    // Insert queue entry
    const queueId = await dbInsertQueue({ sourceImagePath: imgPath, sourceHash: hash, styleId });

    const styleOutputDir = join(OUTPUT_DIR, String(styleId));
    mkdirSync(styleOutputDir, { recursive: true });

    let firstVariantPath = null;
    let allOk = true;

    for (const baseId of BASES) {
      const baseFile = BASE_FILES[baseId];
      console.log(`  🖼  ${baseId}...`);

      let result = null;
      for (let attempt = 0; attempt < 3 && !result; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
        result = await generateVariant(baseFile, imgPath);
      }

      const outPath = join(styleOutputDir, `${baseId}.jpg`);
      const relPath = `/catalog-preview/${styleId}/${baseId}.jpg`;

      if (result?.type === "image") {
        writeFileSync(outPath, Buffer.from(result.data, "base64"));
        await dbInsertVariant({ styleId, baseId, imagePath: relPath, status: "done" });
        if (!firstVariantPath) firstVariantPath = relPath;
        console.log(`    ✅ ${baseId}`);
      } else {
        await dbInsertVariant({ styleId, baseId, imagePath: "", status: "error", errorMsg: "All models failed" });
        console.log(`    ❌ ${baseId}`);
        allOk = false;
      }

      await new Promise((r) => setTimeout(r, 2500));
    }

    if (firstVariantPath) {
      await dbUpdateStyleThumbnail(styleId, firstVariantPath);
    }

    const finalStatus = allOk ? "done" : "error";
    await dbUpdateQueueStatus(queueId, finalStatus);

    if (allOk) totalOk++; else totalErrors++;
    console.log(`  ${allOk ? "✅" : "⚠️ "} ${name} completado (id=${styleId})`);
  }

  console.log(`\n✨ Pipeline completo — ${totalOk} exitosos, ${totalErrors} con errores`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });

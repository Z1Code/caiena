/**
 * apply-designs.mjs — Batch pipeline
 * Scans 37* images, sha256-dedup, generates 4 Gemini variants + classifies each design.
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

  const result = await geminiGenerate(
    [toInlineData(designFile), { text: prompt }],
    false
  );
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

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

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

    // Classify first
    console.log("  📋 Clasificando...");
    const classification = await classifyDesign(imgPath);
    const name = classification?.name ?? filename.replace(/\.\w+$/, "");
    console.log(`  → ${name} (${classification?.color ?? "?"} / ${classification?.acabado ?? "?"} / ${classification?.estilo ?? "?"})`);

    // Insert nailStyle
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

    // Insert queue entry
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
      const relPath = `/catalog-preview/${style.id}/${baseId}.jpg`;

      if (result?.type === "image") {
        writeFileSync(outPath, Buffer.from(result.data, "base64"));
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
        console.log(`    ❌ ${baseId}`);
        allOk = false;
      }

      await new Promise((r) => setTimeout(r, 2500));
    }

    if (firstVariantPath) {
      await db.update(nailStyles).set({ thumbnailUrl: firstVariantPath }).where(eq(nailStyles.id, style.id));
    }

    await db.update(catalogQueue).set({
      status: allOk ? "done" : "error",
      processedAt: new Date(),
    }).where(eq(catalogQueue.id, queueEntry.id));

    console.log(`  ${allOk ? "✅" : "⚠️ "} ${name} completado (id=${style.id})`);
  }

  console.log("\n✨ Pipeline completo");
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });

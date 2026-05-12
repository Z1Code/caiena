import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/db";
import { nailStyles, nailStyleVariants, catalogQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFile, writeFile, mkdir } from "fs/promises";
import { mkdirSync } from "fs";
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
  const model = "gemini-3.1-flash-image-preview";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: preferImage ? ["TEXT", "IMAGE"] : ["TEXT"], temperature: preferImage ? 0.2 : 0.4 },
          safetySettings: [
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          ],
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[catalog/generate] Gemini ${res.status}:`, errText.substring(0, 300));
      return null;
    }
    const data = await res.json();
    const candidate = data.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      console.error(`[catalog/generate] Gemini finishReason=${finishReason}`, JSON.stringify(candidate?.safetyRatings ?? []));
    }
    const imgPart = candidate?.content?.parts?.find((p: { inlineData?: { mimeType?: string } }) => p.inlineData?.mimeType?.startsWith("image/"));
    const txtPart = candidate?.content?.parts?.find((p: { text?: string }) => p.text);
    if (preferImage && imgPart) return { type: "image" as const, data: imgPart.inlineData.data };
    if (!preferImage && txtPart) return { type: "text" as const, text: txtPart.text };
    console.error(`[catalog/generate] Gemini returned no usable part. preferImage=${preferImage}, parts=${JSON.stringify((candidate?.content?.parts ?? []).map((p: Record<string, unknown>) => Object.keys(p)))}`);
  } catch (e) {
    console.error(`[catalog/generate] Gemini fetch error:`, e instanceof Error ? e.message : e);
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

  const encoder = new TextEncoder();
  const sse = (data: object) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  // SSE response headers — X-Accel-Buffering: no tells nginx not to buffer
  const sseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
  };

  // Dedup — already done: stream existing variants immediately
  const existing = await db.select().from(catalogQueue).where(eq(catalogQueue.sourceHash, hash));
  if (existing.length > 0 && existing[0].status === "done") {
    const existingVariants = existing[0].styleId
      ? await db.select().from(nailStyleVariants).where(eq(nailStyleVariants.styleId, existing[0].styleId!))
      : [];
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(sse({ type: "init", jobId: existing[0].id, styleId: existing[0].styleId }));
        let completed = 0;
        for (const v of existingVariants.filter((v) => v.status === "done" && v.imagePath)) {
          completed++;
          controller.enqueue(sse({ type: "progress", baseId: v.baseId, imagePath: v.imagePath, completed }));
        }
        controller.enqueue(sse({ type: "done", status: "done" }));
        controller.close();
      },
    });
    return new Response(stream, { headers: sseHeaders });
  }

  // Clean up failed/stuck previous attempt
  if (existing.length > 0) {
    const oldStyleId = existing[0].styleId;
    await db.delete(catalogQueue).where(eq(catalogQueue.sourceHash, hash));
    if (oldStyleId) {
      await db.delete(nailStyleVariants).where(eq(nailStyleVariants.styleId, oldStyleId));
      await db.delete(nailStyles).where(eq(nailStyles.id, oldStyleId));
    }
  }

  // Create nailStyle + queue entry before opening the stream so IDs exist
  const [style] = await db.insert(nailStyles).values({
    name,
    description: "",
    category: "nail_art",
    prompt: "",
    active: true,
    published: false,
    sortOrder: 0,
  }).returning({ id: nailStyles.id });

  const [qEntry] = await db.insert(catalogQueue).values({
    sourceImagePath: `upload:${hash}`,
    sourceHash: hash,
    styleId: style.id,
    status: "processing",
  }).returning({ id: catalogQueue.id });

  const imgB64 = buf.toString("base64");
  const mimeType = file.type || "image/jpeg";
  const catalogBase = process.env.CATALOG_PREVIEW_DIR ?? join(process.cwd(), "public/catalog-preview");
  const outDir = join(catalogBase, String(style.id));
  mkdirSync(outDir, { recursive: true });

  const PROMPT_FIRST = `You are a professional nail art retouching artist for a luxury nail catalog.

TASK: Apply the nail design from the REFERENCE PHOTO onto the bare nails in the BASE PHOTO.

REFERENCE PHOTO (second image): Extract ONLY the nail color, pattern, art, and finish.
DO NOT copy the nail shape, nail length, or nail edge style from the reference photo.
Ignore everything except: color, pattern, art motifs, and finish (glossy/matte/chrome/glitter).

BASE PHOTO (first image): This is your canvas. It is a professional studio hand photo on pure black background.
PRESERVE EXACTLY: the nail shape, nail length, nail edge (square/round/oval/almond/stiletto/coffin), hand pose, skin tone, background, lighting.
The nail shape in the BASE PHOTO is the final shape — do not alter it under any circumstances.

CRITICAL UNIFORMITY RULE — READ CAREFULLY:
- Apply EXACTLY THE SAME design to EVERY SINGLE NAIL. All nails must look IDENTICAL.
- Do NOT create an accent nail or feature nail with a different color or pattern.
- Do NOT leave any nail bare, lighter, darker, or with a different finish.
- Every nail = same color, same pattern, same art, same finish. Zero exceptions.
- One hand pose = exactly 5 nails. Double-hand pose = exactly 10 nails. ALL uniform.
- If the reference shows an accent nail, IGNORE that — apply the dominant design uniformly.

Keep EVERYTHING else identical: pose, skin tone, background, lighting, nail shape/length.
No jewelry, no rings, no accessories. No watermarks, no text.
Professional luxury catalog photo quality — sharp, editorial, Dior/Chanel level.`;

  const PROMPT_ANCHOR = `You are a professional nail art retouching artist for a luxury nail catalog.

You have THREE images:
1. BASE PHOTO (first image): Your canvas — a studio hand photo on pure black background.
2. REFERENCE PHOTO (second image): The original nail design inspiration.
3. ANCHOR IMAGE (third image): An already-approved generated result of this design on a different hand pose.

YOUR TASK: Apply the nail design onto the BASE PHOTO so it matches the ANCHOR IMAGE as closely as possible.

ANCHOR IS THE TRUTH — match it exactly:
- Same exact color tone and saturation as the ANCHOR IMAGE.
- Same finish intensity (glossy/matte/chrome/glitter level) as the ANCHOR IMAGE.
- Same pattern style and scale as the ANCHOR IMAGE.
- The ANCHOR IMAGE is your color and style reference — not the original REFERENCE PHOTO.

BASE PHOTO rules (never break these):
- PRESERVE the nail shape, nail length, nail edge, hand pose, skin tone, background, and lighting from the BASE PHOTO.
- Do NOT alter the nail shape under any circumstances.

CRITICAL UNIFORMITY:
- Apply EXACTLY THE SAME design to EVERY SINGLE NAIL. All nails identical.
- No accent nails. No bare nails. Every nail = same color, same pattern, same finish.
- One hand = exactly 5 nails. Two hands = exactly 10 nails.

No jewelry, no rings, no accessories. No watermarks, no text.
Professional luxury catalog quality — sharp, editorial, Dior/Chanel level.`;

  const stream = new ReadableStream({
    async start(controller) {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      // Immediately tell the client which job/style to track
      controller.enqueue(sse({ type: "init", jobId: qEntry.id, styleId: style.id }));

      // Classify design metadata
      const classifyPrompt = `Analyze this nail design photo and return ONLY a JSON object (no markdown, no explanation) with these fields:
{"name":"short elegant name in English for this nail style (3-5 words, title case)","color":"one of: nude|rosa|rojo|burdeos|blanco|negro|azul|verde|morado|lila|coral|multicolor|plateado|dorado|gris|beige","acabado":"one of: glossy|matte|chrome|glitter|satinado","forma":"one of: cuadrada|redonda|oval|almendra|stiletto|coffin","estilo":"one of: french|solid|floral|geometrico|glitter_foil|ombre|chrome|minimalista|nail_art"}`;
      const classifyResult = await callGemini([{ inlineData: { mimeType, data: imgB64 } }, { text: classifyPrompt }], false);
      let meta: { name?: string; color?: string; acabado?: string; forma?: string; estilo?: string } = {};
      if (classifyResult?.type === "text") {
        try { meta = JSON.parse(classifyResult.text.replace(/```json\n?|\n?```/g, "").trim()); } catch { /* ignore */ }
      }
      if (meta.name && meta.name !== name) {
        await db.update(nailStyles).set({ name: meta.name, color: meta.color ?? null, acabado: meta.acabado ?? null, forma: meta.forma ?? null, estilo: meta.estilo ?? null }).where(eq(nailStyles.id, style.id));
      }

      // Generate each base variant and stream progress as each one completes
      let firstPath: string | null = null;
      let allOk = true;
      let anchorB64: string | null = null;
      let completed = 0;

      for (const baseId of BASES) {
        const baseFile = BASE_FILES[baseId];
        try {
          const baseBuf = await readFile(baseFile);
          const baseB64 = baseBuf.toString("base64");

          const parts = anchorB64
            ? [
                { inlineData: { mimeType: "image/jpeg", data: baseB64 } },
                { inlineData: { mimeType, data: imgB64 } },
                { inlineData: { mimeType: "image/jpeg", data: anchorB64 } },
                { text: PROMPT_ANCHOR },
              ]
            : [
                { inlineData: { mimeType: "image/jpeg", data: baseB64 } },
                { inlineData: { mimeType, data: imgB64 } },
                { text: PROMPT_FIRST },
              ];

          let result = null;
          for (let attempt = 0; attempt < 3 && !result; attempt++) {
            if (attempt > 0) await sleep(2000);
            result = await callGemini(parts, true);
          }

          const outPath = join(outDir, `${baseId}.jpg`);
          const relPath = `/catalog-preview/${style.id}/${baseId}.jpg`;

          if (result?.type === "image") {
            await writeFile(outPath, Buffer.from(result.data, "base64"));
            await db.insert(nailStyleVariants).values({ styleId: style.id, baseId, imagePath: relPath, status: "done" });
            if (!firstPath) firstPath = relPath;
            if (!anchorB64) anchorB64 = result.data;
            completed++;
            // ← real progress event: one image done
            controller.enqueue(sse({ type: "progress", baseId, imagePath: relPath, completed }));
          } else {
            await db.insert(nailStyleVariants).values({ styleId: style.id, baseId, imagePath: "", status: "error", errorMsg: "generation failed" });
            allOk = false;
          }
          await sleep(2500);
        } catch (e) {
          await db.insert(nailStyleVariants).values({ styleId: style.id, baseId, imagePath: "", status: "error", errorMsg: e instanceof Error ? e.message : "unknown error" });
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

      controller.enqueue(sse({ type: "done", status: allOk ? "done" : "error" }));
      controller.close();
    },
  });

  return new Response(stream, { headers: sseHeaders });
}

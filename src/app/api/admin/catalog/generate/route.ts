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

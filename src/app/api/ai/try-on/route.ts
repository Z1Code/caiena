import { NextRequest, NextResponse } from "next/server";
import { getModel, geminiFlash } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/db";
import { nailStyles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";

// Used when there is NO reference image — text description only
const TEXT_PROMPT =
  "You are a professional nail artist. Apply the following nail design onto the nails in the hand photo. Make it photorealistic. Keep the hand, skin tone, fingers, and background exactly as they are — only change the nails. Paint all visible nails. Maintain the natural nail shape and proportions.";

// Used when there IS a reference image (e.g. an Instagram photo of the design)
// Critical: extract only the nail art from the reference, never copy the hand/skin/length
const REFERENCE_PROMPT =
  "You are a professional nail artist. Study the reference photo and identify: the exact nail color palette, pattern, nail art design, finish (glossy/matte/chrome/glitter), and any decorations or embellishments. " +
  "Then apply EXACTLY that nail design to the nails in the hand photo. " +
  "STRICT RULES — follow these without exception: " +
  "(1) Apply ONLY the nail design style from the reference image. " +
  "(2) Do NOT copy the hand, skin tone, nail length, nail shape, finger proportions, or background from the reference photo — those belong to the reference model, not the client. " +
  "(3) Keep the hand photo's skin tone, hand shape, nail length, nail shape, and background EXACTLY as they are. " +
  "(4) Only change: nail color, pattern, art design, and finish to match the reference. " +
  "Paint all visible nails. Make it look photorealistic and professional.";

export async function POST(request: NextRequest) {
  // Rate limit by IP: 3 requests per hour
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, remaining, resetInMs } = checkRateLimit(ip);
  if (!allowed) {
    const mins = Math.ceil(resetInMs / 60000);
    return NextResponse.json(
      { error: `Límite alcanzado. Intenta de nuevo en ${mins} minuto${mins !== 1 ? "s" : ""}.` },
      { status: 429 }
    );
  }

  const { image, styleId, designPrompt, referenceImage } = await request.json();

  if (!image) {
    return NextResponse.json({ error: "Se requiere una foto de tu mano" }, { status: 400 });
  }

  const handData = image.replace(/^data:image\/\w+;base64,/, "");
  const parts: any[] = [];

  if (styleId) {
    // Catalog style: always prefer thumbnail as visual reference (e.g. Instagram photo)
    const [style] = await db.select().from(nailStyles).where(eq(nailStyles.id, styleId));
    if (!style) {
      return NextResponse.json({ error: "Estilo no encontrado" }, { status: 404 });
    }

    if (style.thumbnailUrl) {
      try {
        const filePath = path.join(process.cwd(), "public", style.thumbnailUrl);
        const fileBuffer = await readFile(filePath);
        const ext = style.thumbnailUrl.split(".").pop()?.toLowerCase();
        const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

        // Reference image goes LAST — Gemini attends to the final image as "reference"
        parts.push(
          { text: REFERENCE_PROMPT },
          { text: "CLIENT HAND PHOTO (apply the design to these nails):" },
          { inlineData: { mimeType: "image/jpeg", data: handData } },
          { text: `REFERENCE DESIGN PHOTO — "${style.name}" (extract ONLY the nail design from this image):` },
          { inlineData: { mimeType: mime, data: fileBuffer.toString("base64") } }
        );
      } catch {
        // Thumbnail unreadable — fall back to text prompt
        parts.push(
          { text: `${TEXT_PROMPT} Design to apply: ${style.prompt}` },
          { inlineData: { mimeType: "image/jpeg", data: handData } }
        );
      }
    } else {
      parts.push(
        { text: `${TEXT_PROMPT} Design to apply: ${style.prompt}` },
        { inlineData: { mimeType: "image/jpeg", data: handData } }
      );
    }
  } else if (referenceImage) {
    parts.push(
      { text: REFERENCE_PROMPT },
      { text: "CLIENT HAND PHOTO (apply the design to these nails):" },
      { inlineData: { mimeType: "image/jpeg", data: handData } },
      { text: "REFERENCE DESIGN PHOTO (extract ONLY the nail design from this image):" },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: referenceImage.replace(/^data:image\/\w+;base64,/, ""),
        },
      }
    );
  } else {
    const design = designPrompt || "elegant soft pink gel nails with glossy finish";
    parts.push(
      { text: `${TEXT_PROMPT} Design to apply: "${design}".` },
      { inlineData: { mimeType: "image/jpeg", data: handData } }
    );
  }

  try {
    const model = getModel(geminiFlash);
    const response = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "image/jpeg" } as any,
    });

    const resultParts = response.response.candidates?.[0]?.content?.parts ?? [];
    const resultImage = resultParts.find((p: any) => p.inlineData)?.inlineData;

    if (!resultImage) {
      return NextResponse.json(
        { error: "No se pudo generar la imagen. Intenta con otra foto." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: `data:${resultImage.mimeType};base64,${resultImage.data}`,
      remaining,
    });
  } catch (err) {
    console.error("Try-on error:", err);
    return NextResponse.json(
      { error: "Error al procesar la imagen. Intenta de nuevo." },
      { status: 500 }
    );
  }
}

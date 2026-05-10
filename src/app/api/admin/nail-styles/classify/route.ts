import { NextRequest, NextResponse } from "next/server";
import { getModel, geminiChat } from "@/lib/gemini";
import { auth } from "../../../../../../auth";

const CLASSIFY_PROMPT = `You are a professional nail technician. Analyze this nail design photo carefully.

Return ONLY a valid JSON object — no markdown, no explanation:

{
  "name": "<attractive Spanish name max 4 words, e.g. 'French Clásico Nude'>",
  "description": "<1 sentence in Spanish for a client, describing the style>",
  "category": "<french|gel|chrome|nail_art|minimal|bold|seasonal>",
  "estilo": "<french|solid|floral|geometrico|glitter_foil|ombre|chrome|minimalista|nail_art>",
  "color": "<nude|rosa|rojo|burdeos|blanco|negro|azul|verde|morado|lila|coral|amarillo|naranja|multicolor|plateado|dorado|gris|beige>",
  "color_secundario": "<same options or null>",
  "acabado": "<glossy|matte|chrome|glitter|satinado>",
  "forma": "<cuadrada|redonda|oval|almendra|stiletto|coffin>",
  "prompt": "<English technical description for AI image generation, 15-25 words, specific about colors patterns finish>"
}

category mapping: french→french, solid colors→gel, floral/geo/glitter/abstract→nail_art, ombre/minimal→minimal, chrome→chrome, holiday/seasonal→seasonal.`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const model = getModel(geminiChat);
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: CLASSIFY_PROMPT },
            { inlineData: { mimeType: file.type, data: base64 } },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json" },
    });

    const classification = JSON.parse(result.response.text().trim());
    return NextResponse.json(classification);
  } catch (err) {
    console.error("Classification error:", err);
    return NextResponse.json({ error: "Error al clasificar la imagen" }, { status: 500 });
  }
}

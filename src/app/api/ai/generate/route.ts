import { NextRequest, NextResponse } from "next/server";
import { getModel, geminiFlash } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const { prompt, style, shape, color } = await request.json();

  if (!prompt && !style) {
    return NextResponse.json(
      { error: "Describe el diseno que quieres" },
      { status: 400 }
    );
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
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const model = getModel(geminiFlash);
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: "image/jpeg",
      } as any,
    });

    const result = response.response;
    const parts = result.candidates?.[0]?.content?.parts ?? [];
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
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "Error al generar el diseno. Intenta de nuevo." },
      { status: 500 }
    );
  }
}

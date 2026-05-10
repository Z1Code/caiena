import { NextRequest, NextResponse } from "next/server";
import { getModel, geminiFlash } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const { image, designPrompt, referenceImage } = await request.json();

  if (!image) {
    return NextResponse.json(
      { error: "Se requiere una foto de tu mano" },
      { status: 400 }
    );
  }

  const prompt = referenceImage
    ? "You are a professional nail art artist. Apply the nail design shown in the reference image onto the nails in the hand photo. Make it look photorealistic. Keep the hand, skin, and background exactly as they are. Only change the nails to match the reference design. Ensure all visible nails are painted."
    : `You are a professional nail art artist. Apply the following nail design onto the nails in this hand photo: "${designPrompt || "elegant gel nails in a soft pink color with a glossy finish"}". Make it look photorealistic. Keep the hand, skin, and background exactly as they are. Only change the nails. Ensure all visible nails are painted.`;

  const imageParts: any[] = [
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

  try {
    const model = getModel(geminiFlash);
    const response = await model.generateContent({
      contents: [{ role: "user", parts: imageParts }],
      generationConfig: {
        responseMimeType: "image/jpeg",
      } as any,
    });

    const result = response.response;
    const parts = result.candidates?.[0]?.content?.parts ?? [];
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
  } catch (err) {
    console.error("Try-on error:", err);
    return NextResponse.json(
      { error: "Error al procesar la imagen. Intenta de nuevo." },
      { status: 500 }
    );
  }
}

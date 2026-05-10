/**
 * process-logo.mjs
 * Envía el logo a Gemini para:
 * 1. Eliminar el fondo rosado → transparente
 * 2. Adaptar colores al sistema de diseño: plum #3A1020 + rose gold #B76E79
 * 3. Guardar como PNG en public/
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) throw new Error(".env.local not found");
  readFileSync(envPath, "utf-8").split("\n").forEach(line => {
    const [k, ...v] = line.trim().split("=");
    if (k && v.length) process.env[k] = v.join("=");
  });
}
loadEnv();

const LOGO_SRC = "C:/Users/PC/Desktop/caiena_instagram_pipeline_20260430_222913/data/organized/posts/logo/3145593223477059194_1769902521000000000.jpg";
const API_KEY  = process.env.GEMINI_API_KEY;

async function callGemini(parts, model = "gemini-3.1-flash-image-preview") {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    }
  );
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log("🎨 Procesando logo Caiena...");

  const imgBuf = readFileSync(LOGO_SRC);
  const imgB64 = imgBuf.toString("base64");

  // Versión 1: fondo transparente, colores palette
  const prompt = `You are a professional graphic designer.

INPUT: The Caiena Beauty Nails logo image (serif wordmark with nail polish drop detail on the C).

TASK: Recreate this exact logo as a clean PNG with TRANSPARENT background.

EXACT REQUIREMENTS:
- Background: completely transparent (checkerboard = transparent)
- "Caiena" lettering: color #3A1020 (deep plum/burgundy) — the same high-contrast serif style
- "BEAUTY NAILS" subtitle: color #B76E79 (rose gold) — same tracked uppercase
- The nail polish drop ornament on top of the C: color #B76E79 (rose gold)
- Keep ALL typographic details exactly: the serif letterforms, the nail drop flourish, the proportions
- No background color whatsoever — pure transparent PNG
- Clean, sharp edges, professional quality
- The result must work on both light (#FEF9F7 warm white) and dark backgrounds`;

  try {
    const data = await callGemini([
      { inlineData: { mimeType: "image/jpeg", data: imgB64 } },
      { text: prompt }
    ]);

    const imgPart = data.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData?.mimeType?.startsWith("image/")
    );

    if (imgPart) {
      const outPath = join(ROOT, "public", "logo-caiena.png");
      writeFileSync(outPath, Buffer.from(imgPart.inlineData.data, "base64"));
      console.log(`✅ Logo guardado: public/logo-caiena.png`);
      console.log(`   Mime: ${imgPart.inlineData.mimeType}`);
    } else {
      const reason = data.candidates?.[0]?.finishReason;
      const txt = data.candidates?.[0]?.content?.parts?.find(p=>p.text)?.text;
      console.log(`⚠️  Sin imagen. finishReason=${reason}. Text: ${txt?.slice(0,100)}`);
    }
  } catch (e) {
    console.error("❌", e.message.slice(0, 200));
  }
}

main();

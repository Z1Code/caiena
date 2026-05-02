import { NextRequest, NextResponse } from "next/server";
import { getModel, geminiChat } from "@/lib/gemini";

const SYSTEM_PROMPT = `Eres el asistente virtual de Caiena Beauty Nails, un salon de unas en Leander, TX operado por Roxanna Acosta.

INFORMACION DEL NEGOCIO:
- Servicios: Manicure Clasico ($25, 45min), Manicure Gel ($35, 60min), Polygel Full Set ($55, 90min), Refuerzo Polygel ($40, 60min), Nail Art ($15+, 30min), Pedicure Clasico ($35, 60min), Pedicure Gel ($45, 75min)
- Horario: Lun-Vie 9:00-18:00, Sab 10:00-16:00, Dom cerrado
- Ubicacion: Home-based studio en Leander, TX (area de Austin)
- Solo con cita previa
- Instagram: @caiena.us
- Sitio web con prueba virtual de unas con IA y generador de disenos

COMPORTAMIENTO:
- Responde SIEMPRE en espanol
- Se amable, profesional y entusiasta sobre unas
- Si preguntan por disponibilidad, dirige a /reservar para ver horarios en tiempo real
- Si preguntan por disenos, sugiere visitar /prueba-virtual para probar con IA o /generador para crear disenos
- Si preguntan por precios, da la informacion exacta de arriba
- Puedes dar consejos de cuidado de unas
- No inventes informacion que no tengas
- Mantene respuestas cortas y utiles (maximo 3 oraciones a menos que pidan mas detalle)`;

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!messages || messages.length === 0) {
    return NextResponse.json(
      { error: "Se requieren mensajes" },
      { status: 400 }
    );
  }

  try {
    const model = getModel(geminiChat);
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        {
          role: "model",
          parts: [
            {
              text: "Entendido. Soy el asistente de Caiena Beauty Nails. Estoy lista para ayudar.",
            },
          ],
        },
        ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
      ],
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return NextResponse.json({ message: text });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { message: "Lo siento, tuve un error. ¿Puedes intentar de nuevo?" },
      { status: 500 }
    );
  }
}

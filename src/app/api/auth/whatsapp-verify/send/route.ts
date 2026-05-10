import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { whatsappOtpCodes } from "@/db/schema";
import { sendText } from "@/lib/whatsapp";
import { addMinutes } from "date-fns";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const { phone } = await request.json();

  if (!phone?.trim()) {
    return NextResponse.json({ error: "Número requerido" }, { status: 400 });
  }

  // Normalize phone: strip non-digits, ensure it starts with country code
  const normalized = phone.replace(/\D/g, "");
  if (normalized.length < 10) {
    return NextResponse.json({ error: "Número inválido" }, { status: 400 });
  }

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = addMinutes(new Date(), 10);

  await db.insert(whatsappOtpCodes).values({ phone: normalized, code, expiresAt });

  // Send via Kapso WhatsApp
  await sendText(
    normalized,
    `Tu código de verificación para Caiena Beauty Nails es: *${code}*\n\nVálido por 10 minutos. No lo compartas con nadie.`
  );

  return NextResponse.json({ ok: true });
}

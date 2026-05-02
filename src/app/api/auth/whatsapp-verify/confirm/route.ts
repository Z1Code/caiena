import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { whatsappOtpCodes, waUsers } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const { phone, code, name } = await request.json();

  if (!phone || !code) {
    return NextResponse.json({ error: "Teléfono y código requeridos" }, { status: 400 });
  }

  const normalized = phone.replace(/\D/g, "");

  // Find latest unused, non-expired code for this phone
  const [record] = await db
    .select()
    .from(whatsappOtpCodes)
    .where(
      and(
        eq(whatsappOtpCodes.phone, normalized),
        eq(whatsappOtpCodes.code, code),
        isNull(whatsappOtpCodes.usedAt)
      )
    )
    .orderBy(desc(whatsappOtpCodes.createdAt))
    .limit(1);

  if (!record) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  if (new Date() > new Date(record.expiresAt)) {
    return NextResponse.json({ error: "Código expirado" }, { status: 400 });
  }

  // Mark as used
  await db
    .update(whatsappOtpCodes)
    .set({ usedAt: new Date() })
    .where(eq(whatsappOtpCodes.id, record.id));

  // Look up or create waUser record
  const [existing] = await db
    .select()
    .from(waUsers)
    .where(eq(waUsers.phone, normalized));

  const resolvedName = name?.trim() || existing?.name || "";

  if (existing) {
    if (name?.trim() && name.trim() !== existing.name) {
      await db
        .update(waUsers)
        .set({ name: name.trim(), updatedAt: new Date() })
        .where(eq(waUsers.phone, normalized));
    }
  } else {
    await db.insert(waUsers).values({ phone: normalized, name: resolvedName || "Cliente" });
  }

  return NextResponse.json({ ok: true, phone: normalized, name: resolvedName });
}

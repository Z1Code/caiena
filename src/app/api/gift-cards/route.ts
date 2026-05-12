import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "@/db";
import { giftCards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, purchaserName, purchaserEmail, recipientName, recipientEmail, message } = body;

  if (!amount || !purchaserName) {
    return NextResponse.json({ error: "Monto y nombre son requeridos" }, { status: 400 });
  }

  if (amount < 10 || amount > 500) {
    return NextResponse.json({ error: "Monto debe ser entre $10 y $500" }, { status: 400 });
  }

  let code = generateCode();
  while ((await db.select().from(giftCards).where(eq(giftCards.code, code)))[0]) {
    code = generateCode();
  }

  await db.insert(giftCards).values({
    code,
    amount,
    balance: amount,
    purchaserName,
    purchaserEmail: purchaserEmail || null,
    recipientName: recipientName || null,
    recipientEmail: recipientEmail || null,
    message: message || null,
  });

  return NextResponse.json({
    code,
    amount,
    message: `Gift card creada exitosamente. Codigo: ${code}`,
  });
}

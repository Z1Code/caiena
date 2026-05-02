import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { giftCards } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const [card] = await db
    .select()
    .from(giftCards)
    .where(eq(giftCards.code, code.toUpperCase()));

  if (!card) {
    return NextResponse.json({ error: "Gift card no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    code: card.code,
    amount: card.amount,
    balance: card.balance,
    status: card.status,
    recipientName: card.recipientName,
  });
}

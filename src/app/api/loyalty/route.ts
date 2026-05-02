import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loyaltyPoints } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Telefono requerido" }, { status: 400 });
  }

  const [loyalty] = await db
    .select()
    .from(loyaltyPoints)
    .where(eq(loyaltyPoints.clientPhone, phone));

  if (!loyalty) {
    return NextResponse.json({
      phone,
      points: 0,
      totalEarned: 0,
      tier: "bronze",
      exists: false,
    });
  }

  return NextResponse.json({ ...loyalty, exists: true });
}

export async function POST(request: NextRequest) {
  const { clientPhone, clientName, pointsToAdd } = await request.json();

  if (!clientPhone || !clientName || !pointsToAdd) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(loyaltyPoints)
    .where(eq(loyaltyPoints.clientPhone, clientPhone));

  if (existing) {
    const newPoints = existing.points + pointsToAdd;
    const newTotal = existing.totalEarned + pointsToAdd;
    const newTier = newTotal >= 300 ? "gold" : newTotal >= 100 ? "silver" : "bronze";

    await db
      .update(loyaltyPoints)
      .set({ points: newPoints, totalEarned: newTotal, tier: newTier, clientName })
      .where(eq(loyaltyPoints.clientPhone, clientPhone));

    return NextResponse.json({
      points: newPoints,
      totalEarned: newTotal,
      tier: newTier,
      pointsAdded: pointsToAdd,
    });
  } else {
    const tier = pointsToAdd >= 300 ? "gold" : pointsToAdd >= 100 ? "silver" : "bronze";

    await db.insert(loyaltyPoints).values({
      clientPhone,
      clientName,
      points: pointsToAdd,
      totalEarned: pointsToAdd,
      tier,
    });

    return NextResponse.json({
      points: pointsToAdd,
      totalEarned: pointsToAdd,
      tier,
      pointsAdded: pointsToAdd,
    });
  }
}

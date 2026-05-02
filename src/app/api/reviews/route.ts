import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const approved = await db
    .select()
    .from(reviews)
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.createdAt))
    .limit(20);

  return NextResponse.json(approved);
}

export async function POST(request: NextRequest) {
  const { bookingId, clientName, rating, comment } = await request.json();

  if (!clientName || !rating) {
    return NextResponse.json(
      { error: "Nombre y calificacion son requeridos" },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Calificacion debe ser entre 1 y 5" },
      { status: 400 }
    );
  }

  await db.insert(reviews).values({
    bookingId: bookingId || null,
    clientName,
    rating,
    comment: comment || null,
    approved: false,
  });

  return NextResponse.json({ ok: true, message: "Gracias por tu resena!" });
}

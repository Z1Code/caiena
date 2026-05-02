import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svcId = parseInt(id);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const { name, description, durationMinutes, price, category, active, sortOrder, images } = body;

  const updateData: Partial<{
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    category: string;
    active: boolean;
    sortOrder: number;
    images: string[];
  }> = {};

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
  if (price !== undefined) updateData.price = price;
  if (category !== undefined) updateData.category = category;
  if (active !== undefined) updateData.active = active;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (images !== undefined) updateData.images = images;

  const [updated] = await db
    .update(services)
    .set(updateData)
    .where(eq(services.id, svcId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svcId = parseInt(id);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Soft delete — set active = false
  const [updated] = await db
    .update(services)
    .set({ active: false })
    .where(eq(services.id, svcId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

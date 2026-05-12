import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nailStyles, nailStyleVariants, catalogQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../../../../../../auth";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const styleId = parseInt(id);
  if (isNaN(styleId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [style] = await db.select().from(nailStyles).where(eq(nailStyles.id, styleId));
  if (!style) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const variants = await db.select().from(nailStyleVariants).where(eq(nailStyleVariants.styleId, styleId));

  return NextResponse.json({ ...style, variants });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const styleId = parseInt(id);
  if (isNaN(styleId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const allowed = ["name", "description", "category", "prompt", "color", "acabado", "forma", "estilo", "badge", "discountPercent", "active", "sortOrder"] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const [updated] = await db
    .update(nailStyles)
    .set(updates)
    .where(eq(nailStyles.id, styleId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const styleId = parseInt(id);
  if (isNaN(styleId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Delete dependents first to satisfy FK constraints
  await db.delete(catalogQueue).where(eq(catalogQueue.styleId, styleId));
  await db.delete(nailStyleVariants).where(eq(nailStyleVariants.styleId, styleId));

  const [deleted] = await db
    .delete(nailStyles)
    .where(eq(nailStyles.id, styleId))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (deleted.thumbnailUrl) {
    try {
      await unlink(path.join(process.cwd(), "public", deleted.thumbnailUrl));
    } catch { /* file already gone */ }
  }

  return NextResponse.json({ ok: true });
}

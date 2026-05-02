import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { slotGroups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../../../../../../auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const id = parseInt((await params).id);
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  for (const key of ["name", "startTime", "endTime", "color", "icon", "sortOrder", "active"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  await db.update(slotGroups).set(updates).where(eq(slotGroups.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const id = parseInt((await params).id);
  await db.delete(slotGroups).where(eq(slotGroups.id, id));
  return NextResponse.json({ ok: true });
}

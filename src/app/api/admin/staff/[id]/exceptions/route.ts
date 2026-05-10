import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleExceptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../../../../../../../auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const staffId = parseInt((await params).id);
  const { date, type, customStart, customEnd, note } = await request.json();

  if (!date || !type) {
    return NextResponse.json({ error: "date y type son requeridos" }, { status: 400 });
  }

  // Upsert: delete existing for same staff+date, then insert
  await db
    .delete(scheduleExceptions)
    .where(and(eq(scheduleExceptions.staffId, staffId), eq(scheduleExceptions.date, date)));

  const [exception] = await db
    .insert(scheduleExceptions)
    .values({ staffId, date, type, customStart, customEnd, note })
    .returning();

  return NextResponse.json(exception, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const staffId = parseInt((await params).id);
  const { date } = await request.json();

  await db
    .delete(scheduleExceptions)
    .where(and(eq(scheduleExceptions.staffId, staffId), eq(scheduleExceptions.date, date)));

  return NextResponse.json({ ok: true });
}

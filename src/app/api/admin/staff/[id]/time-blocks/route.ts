import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timeBlocks } from "@/db/schema";
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
  const { date, daysOfWeek, startTime, endTime, type, label } = await request.json();

  if (!startTime || !endTime) {
    return NextResponse.json({ error: "startTime y endTime son requeridos" }, { status: 400 });
  }

  const [block] = await db
    .insert(timeBlocks)
    .values({ staffId, date: date ?? null, daysOfWeek: daysOfWeek ?? null, startTime, endTime, type: type ?? "BREAK", label })
    .returning();

  return NextResponse.json(block, { status: 201 });
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
  const { blockId } = await request.json();

  await db
    .delete(timeBlocks)
    .where(and(eq(timeBlocks.id, blockId), eq(timeBlocks.staffId, staffId)));

  return NextResponse.json({ ok: true });
}

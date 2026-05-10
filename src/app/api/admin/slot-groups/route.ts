import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { slotGroups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../../../../../auth"

export async function GET() {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const groups = await db
    .select()
    .from(slotGroups)
    .orderBy(slotGroups.sortOrder);
  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { name, startTime, endTime, color, icon, sortOrder } = await request.json();
  if (!name || !startTime || !endTime) {
    return NextResponse.json({ error: "name, startTime y endTime requeridos" }, { status: 400 });
  }
  const [group] = await db
    .insert(slotGroups)
    .values({ name, startTime, endTime, color, icon, sortOrder: sortOrder ?? 0 })
    .returning();
  return NextResponse.json(group, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffSchedules, scheduleAvailability, scheduleExceptions, timeBlocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../../../../../../../auth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const staffId = parseInt((await params).id);

  const schedules = await db
    .select()
    .from(staffSchedules)
    .where(eq(staffSchedules.staffId, staffId));

  const activeSchedule = schedules.find((s) => s.isActive) ?? schedules[0];

  const windows = activeSchedule
    ? await db
        .select()
        .from(scheduleAvailability)
        .where(eq(scheduleAvailability.scheduleId, activeSchedule.id))
    : [];

  const exceptions = await db
    .select()
    .from(scheduleExceptions)
    .where(eq(scheduleExceptions.staffId, staffId))
    .orderBy(scheduleExceptions.date);

  const blocks = await db
    .select()
    .from(timeBlocks)
    .where(eq(timeBlocks.staffId, staffId));

  return NextResponse.json({ schedule: activeSchedule, windows, exceptions, blocks });
}

// Save/replace the active schedule for a staff member.
// Body: { name, windows: [{ daysOfWeek, startTime, endTime, specificDate? }] }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const staffId = parseInt((await params).id);
  const { name = "Horario principal", windows } = await request.json();

  // Deactivate all existing schedules
  await db
    .update(staffSchedules)
    .set({ isActive: false })
    .where(eq(staffSchedules.staffId, staffId));

  // Create new active schedule
  const [schedule] = await db
    .insert(staffSchedules)
    .values({ staffId, name, isActive: true })
    .returning();

  // Insert windows
  if (windows?.length > 0) {
    await db.insert(scheduleAvailability).values(
      windows.map((w: { daysOfWeek?: number[]; startTime: string; endTime: string; specificDate?: string }) => ({
        scheduleId: schedule.id,
        daysOfWeek: w.daysOfWeek ?? null,
        startTime: w.startTime,
        endTime: w.endTime,
        specificDate: w.specificDate ?? null,
      }))
    );
  }

  return NextResponse.json({ ok: true, scheduleId: schedule.id });
}

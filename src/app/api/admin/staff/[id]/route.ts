import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, staffServices, adminRoles } from "@/db/schema";
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

  const { id } = await params;
  const staffId = parseInt(id);
  const body = await request.json();
  const { name, phone, email, googleCalendarId, active, role, serviceIds } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (googleCalendarId !== undefined) updates.googleCalendarId = googleCalendarId;
  if (active !== undefined) updates.active = active;

  if (Object.keys(updates).length > 0) {
    await db.update(staff).set(updates).where(eq(staff.id, staffId));
  }

  // Update role if provided
  if (role !== undefined) {
    const existing = await db.select().from(adminRoles).where(eq(adminRoles.staffId, staffId));
    if (existing.length > 0) {
      await db.update(adminRoles).set({ role }).where(eq(adminRoles.staffId, staffId));
    } else {
      await db.insert(adminRoles).values({ staffId, role });
    }
  }

  // Replace services if provided
  if (serviceIds !== undefined) {
    await db.delete(staffServices).where(eq(staffServices.staffId, staffId));
    if (serviceIds.length > 0) {
      await db.insert(staffServices).values(
        serviceIds.map((sid: number) => ({ staffId, serviceId: sid }))
      );
    }
  }

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

  const { id } = await params;
  // Soft delete
  await db.update(staff).set({ active: false }).where(eq(staff.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}

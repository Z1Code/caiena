import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, staffServices, services, adminRoles } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "../../../../../auth"

export async function GET() {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const members = await db
    .select({
      id: staff.id,
      name: staff.name,
      phone: staff.phone,
      email: staff.email,
      googleCalendarId: staff.googleCalendarId,
      active: staff.active,
      createdAt: staff.createdAt,
      role: adminRoles.role,
    })
    .from(staff)
    .leftJoin(adminRoles, eq(adminRoles.staffId, staff.id))
    .orderBy(staff.name);

  // Fetch services for each staff member
  const staffIds = members.map((m) => m.id);
  const assignments =
    staffIds.length > 0
      ? await db
          .select({
            staffId: staffServices.staffId,
            serviceId: staffServices.serviceId,
            serviceName: services.name,
            durationOverride: staffServices.durationOverride,
            priceOverride: staffServices.priceOverride,
          })
          .from(staffServices)
          .leftJoin(services, eq(staffServices.serviceId, services.id))
          .where(inArray(staffServices.staffId, staffIds))
      : [];

  const result = members.map((m) => ({
    ...m,
    services: assignments.filter((a) => a.staffId === m.id),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json();
  const { name, phone, email, googleCalendarId, role, serviceIds } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const [member] = await db
    .insert(staff)
    .values({ name: name.trim(), phone, email, googleCalendarId })
    .returning();

  // Assign role
  const assignedRole = role || "staff";
  await db.insert(adminRoles).values({ staffId: member.id, role: assignedRole });

  // Assign services
  if (serviceIds?.length > 0) {
    await db.insert(staffServices).values(
      serviceIds.map((id: number) => ({ staffId: member.id, serviceId: id }))
    );
  }

  return NextResponse.json(member, { status: 201 });
}

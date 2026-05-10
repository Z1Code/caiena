import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "../../../../../auth"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  const status = searchParams.get("status");

  const conditions = [];
  if (dateFrom) conditions.push(gte(bookings.date, dateFrom));
  if (dateTo) conditions.push(lte(bookings.date, dateTo));
  if (status) conditions.push(eq(bookings.status, status));

  const results = await db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      clientEmail: bookings.clientEmail,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      notes: bookings.notes,
      createdAt: bookings.createdAt,
      serviceName: services.name,
      servicePrice: services.price,
      serviceDuration: services.durationMinutes,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(bookings.date, bookings.startTime);

  return NextResponse.json(results);
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { auth } from "../../../../../auth"
import { format, addDays } from "date-fns";

export async function GET() {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [todayBookings, tomorrowBookings, totalConfirmed, totalCompleted, revenueResult] =
    await Promise.all([
      db.select().from(bookings).where(and(eq(bookings.date, today), eq(bookings.status, "confirmed"))),
      db.select().from(bookings).where(and(eq(bookings.date, tomorrow), eq(bookings.status, "confirmed"))),
      db.select({ count: count() }).from(bookings).where(eq(bookings.status, "confirmed")),
      db.select({ count: count() }).from(bookings).where(eq(bookings.status, "completed")),
      db
        .select({ total: sql<number>`COALESCE(SUM(${services.price}), 0)` })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(bookings.status, "completed")),
    ]);

  return NextResponse.json({
    today: {
      count: todayBookings.length,
      bookings: todayBookings,
    },
    tomorrow: {
      count: tomorrowBookings.length,
      bookings: tomorrowBookings,
    },
    totals: {
      confirmed: totalConfirmed[0]?.count ?? 0,
      completed: totalCompleted[0]?.count ?? 0,
      revenue: revenueResult[0]?.total ?? 0,
    },
  });
}

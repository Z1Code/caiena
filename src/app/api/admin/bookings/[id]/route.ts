import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../../../../../../auth"
import { deleteGoogleCalendarEvent } from "@/lib/google-calendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!["confirmed", "cancelled", "completed"].includes(status)) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (status === "cancelled" && booking.googleEventId) {
    try {
      await deleteGoogleCalendarEvent(booking.googleEventId);
    } catch (err) {
      console.error("Failed to delete Google Calendar event:", err);
    }
  }

  await db.update(bookings).set({ status }).where(eq(bookings.id, id));

  return NextResponse.json({ ok: true });
}

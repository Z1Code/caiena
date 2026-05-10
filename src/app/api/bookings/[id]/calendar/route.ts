import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildCalendarEvent, generateICS } from "@/lib/calendar";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id));

  if (!booking) {
    return NextResponse.json(
      { error: "Reserva no encontrada" },
      { status: 404 }
    );
  }

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, booking.serviceId));

  if (!service) {
    return NextResponse.json(
      { error: "Servicio no encontrado" },
      { status: 404 }
    );
  }

  const calendarEvent = buildCalendarEvent(booking, service);
  const icsContent = generateICS(calendarEvent);

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="caiena-cita-${booking.date}.ics"`,
    },
  });
}

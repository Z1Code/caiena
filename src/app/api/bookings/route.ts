import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { addMinutes, format, parse } from "date-fns";
import {
  buildCalendarEvent,
  generateGoogleCalendarURL,
} from "@/lib/calendar";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { serviceId, clientName, clientPhone, clientEmail, date, startTime, notes } = body;

  if (!serviceId || !clientName || !clientPhone || !date || !startTime) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId));

  if (!service) {
    return NextResponse.json(
      { error: "Servicio no encontrado" },
      { status: 404 }
    );
  }

  const startDT = parse(startTime, "HH:mm", new Date());
  const endTime = format(addMinutes(startDT, service.durationMinutes), "HH:mm");

  const bookingId = uuidv4();

  const calendarEvent = buildCalendarEvent(
    { clientName, date, startTime, endTime, notes },
    service
  );

  let googleEventId: string | null = null;
  try {
    googleEventId = await createGoogleCalendarEvent(calendarEvent);
  } catch (err) {
    console.error("Failed to create Google Calendar event:", err);
  }

  await db.insert(bookings).values({
    id: bookingId,
    serviceId,
    clientName,
    clientPhone,
    clientEmail: clientEmail || null,
    date,
    startTime,
    endTime,
    notes: notes || null,
    googleEventId,
    status: "confirmed",
  });

  const googleCalendarUrl = generateGoogleCalendarURL(calendarEvent);

  return NextResponse.json({
    booking: {
      id: bookingId,
      serviceName: service.name,
      date,
      startTime,
      endTime,
      price: service.price,
    },
    calendarLinks: {
      google: googleCalendarUrl,
      ics: `/api/bookings/${bookingId}/calendar`,
    },
  });
}

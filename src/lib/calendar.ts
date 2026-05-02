import { format, parse } from "date-fns";
import type { Service } from "@/db/schema";

interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/**
 * Generate an .ics file string for Apple Calendar / any calendar app
 */
export function generateICS(event: CalendarEvent): string {
  const startDT = toICSDateTime(event.date, event.startTime);
  const endDT = toICSDateTime(event.date, event.endTime);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Caiena Beauty Nails//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART;TZID=America/Chicago:${startDT}`,
    `DTEND;TZID=America/Chicago:${endDT}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Generate a Google Calendar "Add Event" URL
 */
export function generateGoogleCalendarURL(event: CalendarEvent): string {
  const startDT = toGoogleDateTime(event.date, event.startTime);
  const endDT = toGoogleDateTime(event.date, event.endTime);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startDT}/${endDT}`,
    details: event.description,
    location: event.location,
    ctz: "America/Chicago",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Build calendar event data from a booking
 */
export function buildCalendarEvent(
  booking: {
    clientName: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string | null;
  },
  service: Service
): CalendarEvent {
  return {
    title: `Caiena Nails - ${service.name}`,
    description: [
      `Servicio: ${service.name}`,
      `Cliente: ${booking.clientName}`,
      `Duracion: ${service.durationMinutes} min`,
      `Precio: $${service.price}`,
      booking.notes ? `Notas: ${booking.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: "Caiena Beauty Nails, Leander, TX",
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
  };
}

function toICSDateTime(date: string, time: string): string {
  // YYYYMMDDTHHMMSS
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function toGoogleDateTime(date: string, time: string): string {
  // YYYYMMDDTHHMMSS
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

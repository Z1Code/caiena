import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, blockedTimes, services, slotGroups } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  BUSINESS_HOURS,
  SLOT_INTERVAL,
  MIN_ADVANCE_HOURS,
  MAX_ADVANCE_DAYS,
} from "@/lib/booking-config";
import { addMinutes, format, parse, isAfter, isBefore, addHours, addDays, startOfDay } from "date-fns";
import { getGoogleCalendarBusyTimes } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateStr = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!dateStr || !serviceId) {
    return NextResponse.json(
      { error: "date and serviceId are required" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const requestedDate = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const today = startOfDay(now);
  const maxDate = addDays(today, MAX_ADVANCE_DAYS);

  if (isBefore(requestedDate, today) || isAfter(requestedDate, maxDate)) {
    return NextResponse.json({ slots: [] });
  }

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, parseInt(serviceId)));

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const dayOfWeek = requestedDate.getDay() as keyof typeof BUSINESS_HOURS;
  const hours = BUSINESS_HOURS[dayOfWeek];

  if (!hours) {
    return NextResponse.json({ slots: [] });
  }

  const existingBookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.date, dateStr), eq(bookings.status, "confirmed")));

  const blocked = await db
    .select()
    .from(blockedTimes)
    .where(eq(blockedTimes.date, dateStr));

  let googleBusy: Array<{ start: string; end: string }> = [];
  try {
    googleBusy = await getGoogleCalendarBusyTimes(dateStr);
  } catch {
    // Google Calendar not configured or error, continue without it
  }

  const slots: Array<{ time: string; available: boolean }> = [];
  const dayStart = parse(hours.start, "HH:mm", requestedDate);
  const dayEnd = parse(hours.end, "HH:mm", requestedDate);

  let current = dayStart;

  while (isBefore(current, dayEnd)) {
    const slotStart = format(current, "HH:mm");
    const slotEnd = format(
      addMinutes(current, service.durationMinutes),
      "HH:mm"
    );

    if (isAfter(addMinutes(current, service.durationMinutes), dayEnd)) {
      break;
    }

    const slotDateTime = parse(
      `${dateStr} ${slotStart}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );
    if (isBefore(slotDateTime, addHours(now, MIN_ADVANCE_HOURS))) {
      current = addMinutes(current, SLOT_INTERVAL);
      continue;
    }

    const hasBookingConflict = existingBookings.some((b) =>
      timesOverlap(slotStart, slotEnd, b.startTime, b.endTime)
    );

    const hasBlockedConflict = blocked.some((b) =>
      timesOverlap(slotStart, slotEnd, b.startTime, b.endTime)
    );

    const hasGoogleConflict = googleBusy.some((b) => {
      if (!b.start || !b.end) return false;
      const busyStart = format(new Date(b.start), "HH:mm");
      const busyEnd = format(new Date(b.end), "HH:mm");
      return timesOverlap(slotStart, slotEnd, busyStart, busyEnd);
    });

    slots.push({
      time: slotStart,
      available: !hasBookingConflict && !hasBlockedConflict && !hasGoogleConflict,
    });

    current = addMinutes(current, SLOT_INTERVAL);
  }

  // Fetch slot groups so the wizard can render grouped time blocks
  const groups = await db
    .select()
    .from(slotGroups)
    .where(eq(slotGroups.active, true))
    .orderBy(slotGroups.sortOrder);

  return NextResponse.json({ slots, service, groups });
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, staff, adminRoles, whatsappSessions, whatsappLinkTokens } from "@/db/schema";
import { eq, and, isNull, isNotNull, ne, lt } from "drizzle-orm";
import { addMinutes, format, parse, addHours } from "date-fns";
import { sendText } from "@/lib/whatsapp";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateEs(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/**
 * Cron route — runs every 30 minutes via system crontab or PM2 cron.
 * Finds bookings starting 50–70 minutes from now and sends WhatsApp reminders.
 *
 * REQUIRES Authorization: Bearer <CRON_SECRET> header at all times.
 *
 * VPS crontab example:
 *   *\/30 * * * * curl -s -X GET https://caienanails.com/api/cron/reminders \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/reminders] CRON_SECRET is not set — endpoint is disabled");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [notified, cleaned] = await Promise.all([sendReminders(), cleanExpiredSessions()]);
    return NextResponse.json({ ok: true, notified, cleaned });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

/** Returns a Date object whose local time matches the current time in America/Chicago */
function nowInChicago(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
}

async function sendReminders(): Promise<number> {
  // Use Chicago local time for all comparisons (bookings are stored in Chicago time)
  const now = nowInChicago();
  const windowStart = addMinutes(now, 50);
  const windowEnd = addMinutes(now, 70);

  const todayStr = format(now, "yyyy-MM-dd");
  const tomorrowStr = format(addHours(now, 24), "yyyy-MM-dd");

  // Fetch confirmed bookings not yet reminded for today and tomorrow
  const pending = await db
    .select()
    .from(bookings)
    .where(
      and(
        ne(bookings.status, "cancelled"),
        isNull(bookings.reminderSentAt)
      )
    );

  // Filter those in the 50-70 min window (using Chicago local time)
  const due = pending.filter((b) => {
    if (b.date !== todayStr && b.date !== tomorrowStr) return false;
    const apptDT = parse(`${b.date} ${b.startTime}`, "yyyy-MM-dd HH:mm", new Date());
    return apptDT >= windowStart && apptDT <= windowEnd;
  });

  if (!due.length) return 0;

  const staffWithPhones = await db
    .select({ id: staff.id, name: staff.name, phone: staff.phone })
    .from(staff)
    .innerJoin(adminRoles, eq(adminRoles.staffId, staff.id))
    .where(and(eq(staff.active, true), isNotNull(staff.phone)));

  let notified = 0;

  for (const booking of due) {
    await db
      .update(bookings)
      .set({ reminderSentAt: new Date() })
      .where(eq(bookings.id, booking.id));

    const dateLabel = formatDateEs(booking.date);
    const svcNote = booking.notes ? ` (${booking.notes})` : "";

    for (const member of staffWithPhones) {
      if (!member.phone) continue;
      await sendText(
        member.phone,
        `⏰ *Recordatorio de cita en 1 hora*\n\n` +
        `👤 Cliente: ${booking.clientName}\n` +
        `📅 ${dateLabel}\n` +
        `🕐 ${booking.startTime} – ${booking.endTime}${svcNote}\n\n` +
        `Responde *CONF_${booking.id.slice(0, 8)}* para confirmar o *CANC_${booking.id.slice(0, 8)}* para cancelar.`
      );
    }

    await sendText(
      booking.clientPhone,
      `⏰ *Recordatorio: tienes una cita en 1 hora*\n\n` +
      `📅 ${dateLabel}\n` +
      `🕐 ${booking.startTime} – ${booking.endTime}\n\n` +
      `Te esperamos en Caiena Beauty Nails. ¡Hasta pronto! 🌸`
    );

    notified++;
  }

  return notified;
}

async function cleanExpiredSessions(): Promise<number> {
  const now = new Date();
  const [s, l] = await Promise.all([
    db.delete(whatsappSessions).where(lt(whatsappSessions.expiresAt, now)),
    db.delete(whatsappLinkTokens).where(lt(whatsappLinkTokens.expiresAt, now)),
  ]);
  return (s.rowCount ?? 0) + (l.rowCount ?? 0);
}

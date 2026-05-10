import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, staff, adminRoles } from "@/db/schema";
import { eq, and, isNull, isNotNull, ne } from "drizzle-orm";
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
 * Protect with CRON_SECRET header: Authorization: Bearer <CRON_SECRET>
 *
 * VPS crontab example:
 *   *\/30 * * * * curl -s -X GET https://caienanails.com/api/cron/reminders \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const notified = await sendReminders();
    return NextResponse.json({ ok: true, notified });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

async function sendReminders(): Promise<number> {
  const now = new Date();
  // Target: bookings starting 50–70 minutes from now
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

  // Filter those in the 50-70 min window in-process
  const due = pending.filter((b) => {
    if (b.date !== todayStr && b.date !== tomorrowStr) return false;
    // Parse booking datetime (treating stored times as local/server time)
    const apptDT = parse(`${b.date} ${b.startTime}`, "yyyy-MM-dd HH:mm", new Date());
    return apptDT >= windowStart && apptDT <= windowEnd;
  });

  if (!due.length) return 0;

  // Fetch admins/managers with phones for new-booking notification
  // (reused here to send staff reminders)
  const staffWithPhones = await db
    .select({ id: staff.id, name: staff.name, phone: staff.phone })
    .from(staff)
    .innerJoin(adminRoles, eq(adminRoles.staffId, staff.id))
    .where(and(eq(staff.active, true), isNotNull(staff.phone)));

  let notified = 0;

  for (const booking of due) {
    // Mark as reminded first to prevent duplicate sends
    await db
      .update(bookings)
      .set({ reminderSentAt: now })
      .where(eq(bookings.id, booking.id));

    const dateLabel = formatDateEs(booking.date);
    const svcNote = booking.notes ? ` (${booking.notes})` : "";

    // Notify staff (all active managers/admins)
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

    // Notify client
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

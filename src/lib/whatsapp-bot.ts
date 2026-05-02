/**
 * WhatsApp booking bot — stateless button-payload flow
 *
 * State is encoded in button/list IDs (no DB session for the happy path):
 *   action_book                          → show service list
 *   SVC|{svcId}                          → service selected
 *   DATE|{svcId}|{YYYY-MM-DD}            → date selected
 *   TIME|{svcId}|{YYYY-MM-DD}|{HHmm}    → time selected (HHmm = "0900")
 *   CONFIRM|{svcId}|{YYYY-MM-DD}|{HHmm} → confirm and create booking
 *   CANCEL_BOOKING                        → back to service list
 *   REMIND_CONFIRM|{bookingId}|{party}   → 1-hour reminder confirmed (staff|client)
 *   REMIND_CANCEL|{bookingId}|{party}    → 1-hour reminder declined
 *
 * Sessions (whatsappSessions) are used ONLY when awaiting a new user's name.
 * The session stores {svcId, date, time} and is deleted immediately after the
 * user provides their name.
 */

import { db } from "@/db";
import {
  whatsappSessions,
  services,
  bookings,
  blockedTimes,
  waUsers,
  whatsappLinkTokens,
} from "@/db/schema";
import { eq, and, gte, lte, gt, isNull, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  addDays,
  addHours,
  addMinutes,
  format,
  isBefore,
  isAfter,
  parse,
} from "date-fns";
import {
  BUSINESS_HOURS,
  MIN_ADVANCE_HOURS,
  SLOT_INTERVAL,
} from "@/lib/booking-config";
import { buildCalendarEvent } from "@/lib/calendar";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import {
  sendText,
  sendButtons,
  sendList,
  type KapsoMessage,
  extractInput,
} from "@/lib/whatsapp";

// ─── Spanish date helpers ─────────────────────────────────────────────────────

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateEs(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

/** "09:00" → "0900" (for button IDs) */
function toHHmm(display: string): string {
  return display.replace(":", "");
}

/** "0900" → "09:00" (for display and DB) */
function fromHHmm(hhmm: string): string {
  return hhmm.slice(0, 2) + ":" + hhmm.slice(2);
}

// ─── Availability ─────────────────────────────────────────────────────────────

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && e1 > s2;
}

function computeSlots(
  dateStr: string,
  durationMinutes: number,
  existingBookings: Array<{ startTime: string; endTime: string }>,
  blocked: Array<{ startTime: string; endTime: string }>
): string[] {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay() as keyof typeof BUSINESS_HOURS;
  const hours = BUSINESS_HOURS[dow];
  if (!hours) return [];

  const now = new Date();
  const dayStart = parse(hours.start, "HH:mm", d);
  const dayEnd = parse(hours.end, "HH:mm", d);

  const slots: string[] = [];
  let current = dayStart;

  while (isBefore(current, dayEnd)) {
    const slotStart = format(current, "HH:mm");
    const slotEnd = format(addMinutes(current, durationMinutes), "HH:mm");

    if (isAfter(addMinutes(current, durationMinutes), dayEnd)) break;

    const slotDT = parse(`${dateStr} ${slotStart}`, "yyyy-MM-dd HH:mm", new Date());
    if (isBefore(slotDT, addHours(now, MIN_ADVANCE_HOURS))) {
      current = addMinutes(current, SLOT_INTERVAL);
      continue;
    }

    const conflict =
      existingBookings.some((b) => timesOverlap(slotStart, slotEnd, b.startTime, b.endTime)) ||
      blocked.some((b) => timesOverlap(slotStart, slotEnd, b.startTime, b.endTime));

    if (!conflict) slots.push(slotStart);
    current = addMinutes(current, SLOT_INTERVAL);
  }

  return slots;
}

/** Get candidate open days (ignores availability — just checks BUSINESS_HOURS) */
function getOpenDays(lookAhead = 30): Array<{ dateStr: string; label: string; short: string }> {
  const days = [];
  let offset = 1;
  while (days.length < lookAhead && offset <= 60) {
    const d = addDays(new Date(), offset++);
    const dow = d.getDay() as keyof typeof BUSINESS_HOURS;
    if (BUSINESS_HOURS[dow] !== null) {
      const dateStr = format(d, "yyyy-MM-dd");
      days.push({ dateStr, label: formatDateEs(dateStr), short: formatDateShort(dateStr) });
    }
  }
  return days;
}

/**
 * Returns up to maxDates open days that have at least one available slot.
 * Uses 2 DB queries total (bookings + blocked times for the whole range).
 */
async function getAvailableDates(
  svcDuration: number,
  maxDates = 10
): Promise<Array<{ dateStr: string; label: string; short: string; slotCount: number }>> {
  const candidates = getOpenDays(30);
  if (!candidates.length) return [];

  const firstDate = candidates[0].dateStr;
  const lastDate = candidates[candidates.length - 1].dateStr;

  const [allBookings, allBlocked] = await Promise.all([
    db
      .select({ date: bookings.date, startTime: bookings.startTime, endTime: bookings.endTime })
      .from(bookings)
      .where(
        and(
          gte(bookings.date, firstDate),
          lte(bookings.date, lastDate),
          eq(bookings.status, "confirmed")
        )
      ),
    db
      .select({ date: blockedTimes.date, startTime: blockedTimes.startTime, endTime: blockedTimes.endTime })
      .from(blockedTimes)
      .where(and(gte(blockedTimes.date, firstDate), lte(blockedTimes.date, lastDate))),
  ]);

  const result: Array<{ dateStr: string; label: string; short: string; slotCount: number }> = [];

  for (const day of candidates) {
    if (result.length >= maxDates) break;
    const dayBookings = allBookings.filter((b) => b.date === day.dateStr);
    const dayBlocked = allBlocked.filter((b) => b.date === day.dateStr);
    const slots = computeSlots(day.dateStr, svcDuration, dayBookings, dayBlocked);
    if (slots.length > 0) {
      result.push({ ...day, slotCount: slots.length });
    }
  }

  return result;
}

/** Get available slots for a specific date (2 DB queries). */
async function getAvailableSlots(dateStr: string, durationMinutes: number): Promise<string[]> {
  const [bk, bl] = await Promise.all([
    db
      .select({ startTime: bookings.startTime, endTime: bookings.endTime })
      .from(bookings)
      .where(and(eq(bookings.date, dateStr), eq(bookings.status, "confirmed"))),
    db
      .select({ startTime: blockedTimes.startTime, endTime: blockedTimes.endTime })
      .from(blockedTimes)
      .where(eq(blockedTimes.date, dateStr)),
  ]);
  return computeSlots(dateStr, durationMinutes, bk, bl);
}

// ─── User lookup ──────────────────────────────────────────────────────────────

async function getKnownUser(phone: string) {
  const [user] = await db.select().from(waUsers).where(eq(waUsers.phone, phone));
  return user ?? null;
}

// ─── Minimal session (await_name only) ───────────────────────────────────────

interface NameSessionData {
  svcId: number;
  date: string;   // YYYY-MM-DD
  time: string;   // HHmm (no colon)
}

async function getNameSession(phone: string): Promise<NameSessionData | null> {
  const [row] = await db
    .select()
    .from(whatsappSessions)
    .where(eq(whatsappSessions.phone, phone));

  if (!row) return null;
  if (new Date() > new Date(row.expiresAt)) {
    await db.delete(whatsappSessions).where(eq(whatsappSessions.phone, phone));
    return null;
  }
  if (row.step !== "await_name") return null;

  return row.data as unknown as NameSessionData;
}

async function saveNameSession(phone: string, data: NameSessionData): Promise<void> {
  const expiresAt = addHours(new Date(), 2);
  const [existing] = await db
    .select({ id: whatsappSessions.id })
    .from(whatsappSessions)
    .where(eq(whatsappSessions.phone, phone));

  if (existing) {
    await db
      .update(whatsappSessions)
      .set({ step: "await_name", data: data as unknown as Record<string, unknown>, expiresAt, updatedAt: new Date() })
      .where(eq(whatsappSessions.phone, phone));
  } else {
    await db.insert(whatsappSessions).values({
      phone,
      step: "await_name",
      data: data as unknown as Record<string, unknown>,
      expiresAt,
    });
  }
}

async function deleteSession(phone: string): Promise<void> {
  await db.delete(whatsappSessions).where(eq(whatsappSessions.phone, phone));
}

// ─── WhatsApp deep-link verification ─────────────────────────────────────────

async function handleVerifyLink(from: string, token: string): Promise<void> {
  const [row] = await db
    .select()
    .from(whatsappLinkTokens)
    .where(
      and(
        eq(whatsappLinkTokens.token, token.toUpperCase()),
        gt(whatsappLinkTokens.expiresAt, new Date()),
        isNull(whatsappLinkTokens.usedAt)
      )
    );

  if (!row) {
    await sendText(from, "Este enlace no es válido o ya expiró. Vuelve a la web y solicita uno nuevo.");
    return;
  }

  await db
    .update(whatsappLinkTokens)
    .set({ phone: from, usedAt: new Date() })
    .where(eq(whatsappLinkTokens.id, row.id));

  await sendText(from, "✅ ¡Verificado! Regresa a la web para continuar con tu reserva. 🌸");
}

async function handleBookingRequest(from: string, idsStr: string): Promise<void> {
  const ids = idsStr
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  if (!ids.length) {
    await sendWelcome(from);
    return;
  }

  const found = await db.select().from(services).where(inArray(services.id, ids));
  if (!found.length) {
    await sendText(from, "No pudimos encontrar los servicios seleccionados. Intenta de nuevo desde la web.");
    return;
  }

  const serviceList = found.map((s) => `• ${s.name}`).join("\n");
  await sendText(
    from,
    `¡Hola! Quieres agendar:\n${serviceList}\n\n¿Para qué fecha te gustaría? 📅`
  );

  // Show available dates for the first service
  const firstSvc = found[0];
  await handleSvcSelected(from, firstSvc.id);
}

// ─── Bot step functions ───────────────────────────────────────────────────────

async function sendWelcome(to: string): Promise<void> {
  await sendButtons(
    to,
    "👋 ¡Hola! Soy el asistente de *Caiena Beauty Nails*.\n\n¿En qué te puedo ayudar?",
    [{ id: "action_book", title: "📅 Agendar cita" }]
  );
}

async function sendServiceList(to: string): Promise<void> {
  const activeServices = await db
    .select()
    .from(services)
    .where(eq(services.active, true));

  if (!activeServices.length) {
    await sendText(to, "Lo siento, no hay servicios disponibles en este momento. Contáctanos directamente.");
    return;
  }

  const rows = activeServices.map((s) => ({
    id: `SVC|${s.id}`,
    title: s.name.slice(0, 24),
    description: `$${s.price} · ${s.durationMinutes} min`.slice(0, 72),
  }));

  await sendList(to, "¿Qué servicio deseas agendar?", "Ver servicios", [
    { title: "Servicios disponibles", rows },
  ]);
}

async function handleSvcSelected(to: string, svcId: number): Promise<void> {
  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service || !service.active) {
    await sendServiceList(to);
    return;
  }

  const dates = await getAvailableDates(service.durationMinutes);

  if (!dates.length) {
    await sendText(
      to,
      `Lo siento, no hay fechas disponibles en los próximos días para *${service.name}*.\n\nContáctanos directamente para agendar.`
    );
    return;
  }

  const rows = dates.map((d) => ({
    id: `DATE|${svcId}|${d.dateStr}`,
    title: d.short.slice(0, 24),
    description: `${d.slotCount} horario${d.slotCount !== 1 ? "s" : ""} disponible${d.slotCount !== 1 ? "s" : ""}`,
  }));

  await sendList(
    to,
    `✅ *${service.name}*\n$${service.price} · ${service.durationMinutes} min\n\n¿Para qué fecha deseas la cita?`,
    "Ver fechas",
    [{ title: "Próximas fechas", rows }]
  );
}

async function handleDateSelected(to: string, svcId: number, dateStr: string): Promise<void> {
  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service) {
    await sendServiceList(to);
    return;
  }

  const slots = await getAvailableSlots(dateStr, service.durationMinutes);

  if (!slots.length) {
    await sendText(to, `No hay horarios disponibles el *${formatDateEs(dateStr)}*. Elige otra fecha:`);
    await handleSvcSelected(to, svcId);
    return;
  }

  const dateLabel = formatDateEs(dateStr);
  const bodyText = `📅 *${dateLabel}*\n\n¿A qué hora prefieres?`;

  if (slots.length <= 3) {
    await sendButtons(
      to,
      bodyText,
      slots.map((t) => ({ id: `TIME|${svcId}|${dateStr}|${toHHmm(t)}`, title: t }))
    );
  } else {
    const rows = slots.slice(0, 10).map((t) => ({
      id: `TIME|${svcId}|${dateStr}|${toHHmm(t)}`,
      title: t,
    }));
    await sendList(to, bodyText, "Ver horarios", [{ title: "Horarios disponibles", rows }]);
  }
}

async function showConfirmScreen(
  to: string,
  service: { id: number; name: string; price: number; durationMinutes: number },
  dateStr: string,
  hhmm: string,
  clientName: string
): Promise<void> {
  const startTime = fromHHmm(hhmm);
  const endTime = format(addMinutes(parse(startTime, "HH:mm", new Date()), service.durationMinutes), "HH:mm");

  const summary =
    `📋 *Confirma tu cita:*\n\n` +
    `💅 ${service.name}\n` +
    `📅 ${formatDateEs(dateStr)}\n` +
    `🕐 ${startTime} – ${endTime}\n` +
    `👤 ${clientName}\n` +
    `💵 $${service.price}`;

  await sendButtons(to, summary, [
    { id: `CONFIRM|${service.id}|${dateStr}|${hhmm}`, title: "✅ Confirmar" },
    { id: "CANCEL_BOOKING", title: "❌ Cancelar" },
  ]);
}

async function handleTimeSelected(to: string, svcId: number, dateStr: string, hhmm: string): Promise<void> {
  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service) {
    await sendServiceList(to);
    return;
  }

  const knownUser = await getKnownUser(to);

  if (knownUser) {
    await showConfirmScreen(to, service, dateStr, hhmm, knownUser.name);
  } else {
    await saveNameSession(to, { svcId, date: dateStr, time: hhmm });
    await sendText(
      to,
      `¿Cuál es tu nombre completo?\n\n_(Solo la primera vez — lo recordamos para futuras citas)_`
    );
  }
}

async function handleNameInput(to: string, name: string, session: NameSessionData): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    await sendText(to, "Por favor ingresa tu nombre completo para continuar.");
    return;
  }

  // Save/update user
  const [existing] = await db.select({ id: waUsers.id }).from(waUsers).where(eq(waUsers.phone, to));
  if (existing) {
    await db.update(waUsers).set({ name: trimmed, updatedAt: new Date() }).where(eq(waUsers.phone, to));
  } else {
    await db.insert(waUsers).values({ phone: to, name: trimmed });
  }

  await deleteSession(to);

  const [service] = await db.select().from(services).where(eq(services.id, session.svcId));
  if (!service) {
    await sendServiceList(to);
    return;
  }

  await showConfirmScreen(to, service, session.date, session.time, trimmed);
}

async function handleConfirm(to: string, svcIdStr: string, dateStr: string, hhmm: string): Promise<void> {
  const svcId = parseInt(svcIdStr);

  const knownUser = await getKnownUser(to);
  if (!knownUser) {
    await sendText(to, "No pudimos identificarte. Por favor inicia de nuevo enviando cualquier mensaje.");
    await sendWelcome(to);
    return;
  }

  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service || !service.active) {
    await sendText(to, "Ocurrió un error. Por favor intenta de nuevo.");
    await sendServiceList(to);
    return;
  }

  const startTime = fromHHmm(hhmm);

  // Re-check availability to prevent double-booking
  const slots = await getAvailableSlots(dateStr, service.durationMinutes);
  if (!slots.includes(startTime)) {
    await sendText(
      to,
      `Lo siento, ese horario ya no está disponible. Por favor elige otro:`
    );
    await handleSvcSelected(to, service.id);
    return;
  }

  const endTime = format(
    addMinutes(parse(startTime, "HH:mm", new Date()), service.durationMinutes),
    "HH:mm"
  );

  const bookingId = uuidv4();
  const calendarEvent = buildCalendarEvent(
    { clientName: knownUser.name, date: dateStr, startTime, endTime, notes: "Reserva vía WhatsApp" },
    service
  );

  let googleEventId: string | null = null;
  try {
    googleEventId = await createGoogleCalendarEvent(calendarEvent);
  } catch {
    // Google Calendar not configured — continue
  }

  await db.insert(bookings).values({
    id: bookingId,
    serviceId: service.id,
    clientName: knownUser.name,
    clientPhone: to,
    date: dateStr,
    startTime,
    endTime,
    googleEventId,
    notes: "Reserva vía WhatsApp",
    status: "confirmed",
  });

  await sendText(
    to,
    `✅ *¡Cita confirmada!*\n\n` +
    `💅 ${service.name}\n` +
    `📅 ${formatDateEs(dateStr)}\n` +
    `🕐 ${startTime} – ${endTime}\n\n` +
    `Te esperamos en Caiena Beauty Nails. ¡Hasta pronto! 🌸`
  );
}

async function handleRemindConfirm(to: string, bookingId: string, party: string): Promise<void> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking || booking.status === "cancelled") {
    await sendText(to, "Esta cita ya fue cancelada.");
    return;
  }

  if (party === "staff") {
    await db
      .update(bookings)
      .set({ confirmStaff: true, confirmedStaffAt: new Date() })
      .where(eq(bookings.id, bookingId));

    await sendText(to, "✅ Confirmaste la cita. Se enviará confirmación a la cliente.");

    // TODO: send reminder template to client
    // await sendTemplate(booking.clientPhone, "appointment_reminder_1h", "es",
    //   [...], [{ payload: `REMIND_CONFIRM|${bookingId}|client` }, { payload: `REMIND_CANCEL|${bookingId}|client` }]);
  } else if (party === "client") {
    await db
      .update(bookings)
      .set({ confirmClient: true, confirmedClientAt: new Date() })
      .where(eq(bookings.id, bookingId));

    await sendText(to, "✅ ¡Nos vemos pronto! Tu cita está confirmada. 🌸");
  }
}

async function handleRemindCancel(to: string, bookingId: string, party: string): Promise<void> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking || booking.status === "cancelled") {
    await sendText(to, "Esta cita ya no está activa.");
    return;
  }

  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledBy: party })
    .where(eq(bookings.id, bookingId));

  await sendText(
    to,
    party === "staff"
      ? "Cita cancelada. Se notificará a la cliente."
      : "Entendido, cita cancelada. ¡Cuando quieras puedes agendar de nuevo! 😊"
  );

  // Notify the other party
  const otherPhone = party === "staff" ? booking.clientPhone : null; // TODO: staff phone lookup
  if (otherPhone && party === "staff") {
    await sendText(
      otherPhone,
      `😔 Tu cita del *${formatDateEs(booking.date)}* a las *${booking.startTime}* fue cancelada.\n\n` +
      `Puedes agendar una nueva cita cuando quieras.`
    );
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function handleMessage(from: string, message: KapsoMessage): Promise<void> {
  const input = extractInput(message);

  // Multi-service booking from landing page catalog
  if (input && input.startsWith("BOOKING|")) {
    const idsStr = input.slice("BOOKING|".length).trim();
    await handleBookingRequest(from, idsStr);
    return;
  }

  // Deep-link verification: user tapped "Continuar con WhatsApp" on the web
  // and sent "CAIENA|VERIFY|{TOKEN}" from their phone
  if (input && input.startsWith("CAIENA|VERIFY|")) {
    const token = input.slice("CAIENA|VERIFY|".length).trim();
    await handleVerifyLink(from, token);
    return;
  }

  // Check if user is in the middle of providing their name
  if (input && message.type === "text") {
    const nameSession = await getNameSession(from);
    if (nameSession) {
      await handleNameInput(from, input, nameSession);
      return;
    }
  }

  const isGreeting =
    !input ||
    /^(hola|hi|hello|buenas|buenos|buen\s+d[íi]a|empezar|inicio|men[úu]|start)$/i.test(input.trim());

  if (isGreeting) {
    await sendWelcome(from);
    return;
  }

  // Route by payload prefix
  if (input === "action_book") {
    await sendServiceList(from);
    return;
  }

  if (input === "CANCEL_BOOKING") {
    await sendServiceList(from);
    return;
  }

  if (input.startsWith("SVC|")) {
    const svcId = parseInt(input.slice(4));
    if (!isNaN(svcId)) await handleSvcSelected(from, svcId);
    else await sendServiceList(from);
    return;
  }

  if (input.startsWith("DATE|")) {
    const parts = input.split("|"); // DATE|svcId|date
    const svcId = parseInt(parts[1]);
    const dateStr = parts[2];
    if (!isNaN(svcId) && dateStr) await handleDateSelected(from, svcId, dateStr);
    else await sendServiceList(from);
    return;
  }

  if (input.startsWith("TIME|")) {
    const parts = input.split("|"); // TIME|svcId|date|HHmm
    const svcId = parseInt(parts[1]);
    const dateStr = parts[2];
    const hhmm = parts[3];
    if (!isNaN(svcId) && dateStr && hhmm) await handleTimeSelected(from, svcId, dateStr, hhmm);
    else await sendServiceList(from);
    return;
  }

  if (input.startsWith("CONFIRM|")) {
    const parts = input.split("|"); // CONFIRM|svcId|date|HHmm
    const svcIdStr = parts[1];
    const dateStr = parts[2];
    const hhmm = parts[3];
    if (svcIdStr && dateStr && hhmm) await handleConfirm(from, svcIdStr, dateStr, hhmm);
    else await sendWelcome(from);
    return;
  }

  if (input.startsWith("REMIND_CONFIRM|")) {
    const parts = input.split("|"); // REMIND_CONFIRM|bookingId|party
    await handleRemindConfirm(from, parts[1], parts[2]);
    return;
  }

  if (input.startsWith("REMIND_CANCEL|")) {
    const parts = input.split("|"); // REMIND_CANCEL|bookingId|party
    await handleRemindCancel(from, parts[1], parts[2]);
    return;
  }

  // Unknown input — show welcome
  await sendWelcome(from);
}

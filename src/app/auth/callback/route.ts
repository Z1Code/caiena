import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { whatsappAuthTokens, waUsers, whatsappSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { exchangeCodeForProfile, isRealName } from "@/lib/google-oauth";
import { sendText, sendButtons } from "@/lib/whatsapp";
import { addHours, format, addMinutes } from "date-fns";

const APP_URL = process.env.APP_URL ?? "https://caienanails.com";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/auth/success?error=missing_params`);
  }

  // ── Web booking flow ──────────────────────────────────────────────────────
  // State prefix "web:" means this came from the /reservar booking wizard.
  if (state.startsWith("web:")) {
    let profile: { id: string; name: string; email: string };
    try {
      profile = await exchangeCodeForProfile(code);
    } catch {
      return NextResponse.redirect(`${APP_URL}/reservar?auth_error=google_failed`);
    }
    const params = new URLSearchParams({ auth: "ok", name: profile.name, email: profile.email });
    return NextResponse.redirect(`${APP_URL}/reservar?${params.toString()}`);
  }
  // ── End web booking flow ──────────────────────────────────────────────────

  // Load auth token record
  const [authToken] = await db
    .select()
    .from(whatsappAuthTokens)
    .where(eq(whatsappAuthTokens.token, state));

  if (!authToken || authToken.usedAt || new Date() > new Date(authToken.expiresAt)) {
    return NextResponse.redirect(`${APP_URL}/auth/success?error=expired`);
  }

  // Exchange code for Google profile
  let profile: { id: string; name: string; email: string };
  try {
    profile = await exchangeCodeForProfile(code);
  } catch {
    return NextResponse.redirect(`${APP_URL}/auth/success?error=google_failed`);
  }

  const phone = authToken.phone;
  const sessionData = authToken.sessionData as Record<string, unknown>;

  // If name is suspicious, collect it via the setup-name page
  if (!isRealName(profile.name)) {
    await db
      .update(whatsappAuthTokens)
      .set({
        googleEmail: profile.email,
        googleName: profile.name,
        googleId: profile.id,
      })
      .where(eq(whatsappAuthTokens.token, state));

    return NextResponse.redirect(`${APP_URL}/auth/setup-name?t=${state}`);
  }

  // Good name — save user and advance the WhatsApp session
  await saveUserAndContinue({
    phone,
    name: profile.name,
    email: profile.email,
    googleId: profile.id,
    sessionData,
    authToken: state,
  });

  return NextResponse.redirect(`${APP_URL}/auth/success?name=${encodeURIComponent(profile.name)}`);
}

// ─── Shared helper used by both callback and setup-name action ─────────────────

export async function saveUserAndContinue({
  phone,
  name,
  email,
  googleId,
  sessionData,
  authToken,
}: {
  phone: string;
  name: string;
  email: string;
  googleId: string;
  sessionData: Record<string, unknown>;
  authToken: string;
}) {
  // Upsert user record
  const [existingUser] = await db
    .select({ id: waUsers.id })
    .from(waUsers)
    .where(eq(waUsers.phone, phone));

  if (existingUser) {
    await db
      .update(waUsers)
      .set({ name, email, googleId, updatedAt: new Date() })
      .where(eq(waUsers.phone, phone));
  } else {
    await db.insert(waUsers).values({ phone, name, email, googleId });
  }

  // Mark token as used
  await db
    .update(whatsappAuthTokens)
    .set({ usedAt: new Date() })
    .where(eq(whatsappAuthTokens.token, authToken));

  // Restore booking data and advance WA session to confirm step
  const updatedData = { ...sessionData, clientName: name };
  const expiresAt = addHours(new Date(), 24);

  const [existingSession] = await db
    .select({ id: whatsappSessions.id })
    .from(whatsappSessions)
    .where(eq(whatsappSessions.phone, phone));

  if (existingSession) {
    await db
      .update(whatsappSessions)
      .set({ step: "confirm", data: updatedData, expiresAt, updatedAt: new Date() })
      .where(eq(whatsappSessions.phone, phone));
  } else {
    await db.insert(whatsappSessions).values({
      phone,
      step: "confirm",
      data: updatedData,
      expiresAt,
    });
  }

  // Send WhatsApp confirmation summary
  const d = updatedData as {
    serviceName?: string;
    dateLabel?: string;
    startTime?: string;
    servicePrice?: number;
  };

  const summary =
    `✅ *¡Identidad verificada, ${name}!*\n\n` +
    `📋 *Resumen de tu cita:*\n\n` +
    `💅 Servicio: ${d.serviceName ?? ""}\n` +
    `📅 Fecha: ${d.dateLabel ?? ""}\n` +
    `🕐 Hora: ${d.startTime ?? ""}\n` +
    `👤 Nombre: ${name}\n` +
    `💵 Precio: $${d.servicePrice ?? ""}`;

  await sendButtons(phone, summary, [
    { id: "confirm_yes", title: "✅ Confirmar" },
    { id: "confirm_no", title: "❌ Cancelar" },
  ]);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/db";
import { bookingRequests } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { addHours } from "date-fns";

const BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "";

/** POST — authenticated user creates a booking request, returns token + wa.me URL */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { styleId, styleName, desiredDate, desiredTime, notes } = await req.json();
  if (!styleName || !desiredDate || !desiredTime) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const token = randomBytes(16).toString("hex").toUpperCase();
  const expiresAt = addHours(new Date(), 2);

  await db.insert(bookingRequests).values({
    token,
    googleId:    session.user.id!,
    email:       session.user.email!,
    name:        session.user.name ?? session.user.email!,
    styleId:     styleId ?? null,
    styleName,
    desiredDate,
    desiredTime,
    notes:       notes ?? null,
    expiresAt,
  });

  if (!BUSINESS_PHONE) {
    return NextResponse.json({ error: "WHATSAPP_BUSINESS_PHONE not configured" }, { status: 500 });
  }

  const text  = encodeURIComponent(`CAIENA|BOOK|${token}`);
  const waUrl = `https://wa.me/${BUSINESS_PHONE}?text=${text}`;

  return NextResponse.json({ token, waUrl });
}

/** GET ?token=xxx — poll for phone_linked status (requires auth + token ownership) */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const [row] = await db
    .select()
    .from(bookingRequests)
    .where(and(eq(bookingRequests.token, token), gt(bookingRequests.expiresAt, new Date())));

  if (!row) return NextResponse.json({ expired: true });

  // Ensure the token belongs to the authenticated user
  if (row.googleId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    status: row.status,
    phone:  row.phone ?? null,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { whatsappLinkTokens, waUsers } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { addMinutes } from "date-fns";

const BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "";

/** POST — create a new verification token and return the wa.me URL */
export async function POST() {
  if (!BUSINESS_PHONE) {
    return NextResponse.json({ error: "WHATSAPP_BUSINESS_PHONE not configured" }, { status: 500 });
  }

  const token = randomBytes(4).toString("hex").toUpperCase(); // e.g. "A1B2C3D4"
  const expiresAt = addMinutes(new Date(), 10);

  await db.insert(whatsappLinkTokens).values({ token, expiresAt });

  const text = encodeURIComponent(`CAIENA|VERIFY|${token}`);
  const waUrl = `https://wa.me/${BUSINESS_PHONE}?text=${text}`;

  return NextResponse.json({ token, waUrl });
}

/** GET ?token=xxx — poll for verification status */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const [row] = await db
    .select()
    .from(whatsappLinkTokens)
    .where(
      and(
        eq(whatsappLinkTokens.token, token),
        gt(whatsappLinkTokens.expiresAt, new Date())
      )
    );

  if (!row) {
    return NextResponse.json({ expired: true });
  }

  if (!row.phone) {
    return NextResponse.json({ verified: false });
  }

  // Verified — look up user name if they exist
  const [user] = await db.select().from(waUsers).where(eq(waUsers.phone, row.phone));

  return NextResponse.json({
    verified: true,
    phone: row.phone,
    name: user?.name ?? null,
  });
}

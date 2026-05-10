import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";

const BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "";

/**
 * GET ?svcId=X&date=YYYY-MM-DD&time=HHmm
 * Returns a wa.me URL with the booking info pre-filled as a TIME| payload.
 * The bot parses it and handles the rest.
 */
export async function GET(request: NextRequest) {
  const svcId = parseInt(request.nextUrl.searchParams.get("svcId") ?? "");
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const time = request.nextUrl.searchParams.get("time") ?? ""; // HHmm

  if (!svcId || !date || !time) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (!BUSINESS_PHONE) {
    return NextResponse.json({ error: "WhatsApp not configured" }, { status: 500 });
  }

  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const payload = `TIME|${svcId}|${date}|${time}`;
  const waUrl = `https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(payload)}`;

  return NextResponse.json({ waUrl, service: service.name });
}

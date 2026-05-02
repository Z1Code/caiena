import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { inArray } from "drizzle-orm";

const BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "";

/**
 * GET ?svcIds=1,2,3
 * Returns { waUrl: "https://wa.me/12057940509?text=BOOKING|1,2,3", serviceNames: [...] }
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("svcIds") ?? "";
  const ids = raw
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  if (!ids.length) {
    return NextResponse.json({ error: "Missing svcIds" }, { status: 400 });
  }

  if (!BUSINESS_PHONE) {
    return NextResponse.json({ error: "WhatsApp not configured" }, { status: 500 });
  }

  const found = await db.select().from(services).where(inArray(services.id, ids));
  if (!found.length) return NextResponse.json({ error: "No services found" }, { status: 404 });

  const serviceNames = found.map((s) => s.name);
  const payload = `BOOKING|${ids.join(",")}`;
  const waUrl = `https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(payload)}`;

  return NextResponse.json({ waUrl, serviceNames });
}

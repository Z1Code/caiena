import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { waUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

/** GET ?phone=... — look up a user by phone, returns { name } or {} */
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({});

  const [user] = await db.select({ name: waUsers.name }).from(waUsers).where(eq(waUsers.phone, phone));
  return NextResponse.json(user ? { name: user.name } : {});
}

/** POST { phone, name } — register a new user by phone + name */
export async function POST(request: NextRequest) {
  const { phone, name } = await request.json();
  if (!phone?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "phone and name required" }, { status: 400 });
  }

  const [existing] = await db.select({ id: waUsers.id }).from(waUsers).where(eq(waUsers.phone, phone.trim()));
  if (existing) {
    await db.update(waUsers).set({ name: name.trim(), updatedAt: new Date() }).where(eq(waUsers.phone, phone.trim()));
  } else {
    await db.insert(waUsers).values({ phone: phone.trim(), name: name.trim() });
  }

  return NextResponse.json({ ok: true });
}

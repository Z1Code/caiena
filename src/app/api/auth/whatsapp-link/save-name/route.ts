import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { waUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const { phone, name } = await request.json();
  if (!phone || !name?.trim()) {
    return NextResponse.json({ error: "phone and name required" }, { status: 400 });
  }

  const [existing] = await db.select({ id: waUsers.id }).from(waUsers).where(eq(waUsers.phone, phone));
  if (existing) {
    await db.update(waUsers).set({ name: name.trim(), updatedAt: new Date() }).where(eq(waUsers.phone, phone));
  } else {
    await db.insert(waUsers).values({ phone, name: name.trim() });
  }

  return NextResponse.json({ ok: true });
}

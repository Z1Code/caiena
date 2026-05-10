import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nailStyles } from "@/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "../../../../../auth";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await db
    .select()
    .from(nailStyles)
    .orderBy(asc(nailStyles.sortOrder), asc(nailStyles.id));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const { name, description, category, prompt, color, acabado, forma, estilo, badge, discountPercent, sortOrder } = body;
  if (!name || !category || !prompt) {
    return NextResponse.json(
      { error: "name, category y prompt son requeridos" },
      { status: 400 }
    );
  }
  const [created] = await db
    .insert(nailStyles)
    .values({
      name, description: description ?? "", category, prompt,
      color: color ?? null, acabado: acabado ?? null, forma: forma ?? null, estilo: estilo ?? null,
      badge: badge ?? null, discountPercent: discountPercent ?? null,
      sortOrder: sortOrder ?? 0,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

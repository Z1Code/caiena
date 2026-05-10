import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "../../../../../auth"

export async function GET() {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const rows = await db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.id));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await request.json();
  const { name, description, durationMinutes, price, category } = body;

  if (!name || !description || !durationMinutes || price == null || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [created] = await db
    .insert(services)
    .values({ name, description, durationMinutes, price, category })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

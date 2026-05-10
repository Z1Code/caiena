import { NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const allServices = await db
    .select()
    .from(services)
    .where(eq(services.active, true));

  return NextResponse.json(allServices);
}

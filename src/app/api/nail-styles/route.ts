import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nailStyles } from "@/db/schema";
import { eq, and, asc, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const color   = searchParams.get("color");
  const acabado = searchParams.get("acabado");
  const forma   = searchParams.get("forma");
  const estilo  = searchParams.get("estilo");
  const category = searchParams.get("category");

  const conditions: SQL[] = [eq(nailStyles.active, true)];
  if (color)    conditions.push(eq(nailStyles.color, color));
  if (acabado)  conditions.push(eq(nailStyles.acabado, acabado));
  if (forma)    conditions.push(eq(nailStyles.forma, forma));
  if (estilo)   conditions.push(eq(nailStyles.estilo, estilo));
  if (category) conditions.push(eq(nailStyles.category, category));

  const rows = await db
    .select()
    .from(nailStyles)
    .where(and(...conditions))
    .orderBy(asc(nailStyles.sortOrder), asc(nailStyles.id));

  return NextResponse.json(rows);
}

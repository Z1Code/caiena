import { NextResponse } from "next/server";
import { db } from "@/db";
import { nailStyles, nailStyleVariants } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const styles = await db
    .select()
    .from(nailStyles)
    .where(eq(nailStyles.published, true))
    .orderBy(asc(nailStyles.sortOrder), asc(nailStyles.id));

  if (styles.length === 0) return NextResponse.json([]);

  const variants = await db
    .select()
    .from(nailStyleVariants)
    .where(eq(nailStyleVariants.status, "done"));

  const variantsByStyle = variants.reduce<Record<number, typeof variants>>(
    (acc, v) => {
      if (!acc[v.styleId]) acc[v.styleId] = [];
      acc[v.styleId].push(v);
      return acc;
    },
    {}
  );

  const BASE_ORDER = ["garra", "ascendente", "doble", "rocio"];

  const result = styles.map((style) => ({
    ...style,
    variants: (variantsByStyle[style.id] ?? []).sort(
      (a, b) => BASE_ORDER.indexOf(a.baseId) - BASE_ORDER.indexOf(b.baseId)
    ),
  }));

  return NextResponse.json(result);
}

import { db } from "@/db";
import { nailStyles, nailStyleVariants } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { CatalogClient } from "./CatalogClient";

export async function CatalogSection() {
  const styles = await db
    .select()
    .from(nailStyles)
    .where(eq(nailStyles.published, true))
    .orderBy(asc(nailStyles.sortOrder), asc(nailStyles.id));

  if (styles.length === 0) return null;

  const variants = await db
    .select()
    .from(nailStyleVariants)
    .where(eq(nailStyleVariants.status, "done"));

  const variantsByStyle = variants.reduce<Record<number, typeof variants>>(
    (acc, v) => {
      (acc[v.styleId] ??= []).push(v);
      return acc;
    },
    {}
  );

  const BASE_ORDER = ["garra", "ascendente", "doble", "rocio"];

  const data = styles.map((s) => ({
    ...s,
    variants: (variantsByStyle[s.id] ?? []).sort(
      (a, b) => BASE_ORDER.indexOf(a.baseId) - BASE_ORDER.indexOf(b.baseId)
    ),
  }));

  return <CatalogClient styles={data} />;
}

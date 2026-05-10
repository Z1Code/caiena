import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { db } from "@/db";
import { nailStyles } from "@/db/schema";
import { eq, max } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ styleId: string }> }
) {
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { styleId } = await params;
  const id = parseInt(styleId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const [maxRow] = await db.select({ m: max(nailStyles.sortOrder) }).from(nailStyles);
  const nextOrder = (maxRow?.m ?? 0) + 1;

  await db.update(nailStyles).set({ published: true, sortOrder: nextOrder }).where(eq(nailStyles.id, id));
  return NextResponse.json({ ok: true });
}

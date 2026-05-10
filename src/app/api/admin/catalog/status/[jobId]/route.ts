import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { db } from "@/db";
import { catalogQueue, nailStyleVariants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const [job] = await db.select().from(catalogQueue).where(eq(catalogQueue.id, parseInt(jobId)));
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const variants = job.styleId
    ? await db.select().from(nailStyleVariants).where(eq(nailStyleVariants.styleId, job.styleId))
    : [];

  return NextResponse.json({ job, variants });
}

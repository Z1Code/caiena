import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "../../../../../../../../auth"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id, filename } = await params;
  const svcId = parseInt(id);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Sanitize filename — no path traversal
  const safeName = path.basename(filename);
  const url = `/uploads/services/${safeName}`;

  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updatedImages = (service.images ?? []).filter((img) => img !== url);
  await db.update(services).set({ images: updatedImages }).where(eq(services.id, svcId));

  try {
    const filePath = path.join(process.cwd(), "public", "uploads", "services", safeName);
    await unlink(filePath);
  } catch {
    // File already gone — that's fine
  }

  return NextResponse.json({ ok: true });
}

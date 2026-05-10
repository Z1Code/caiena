import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nailStyles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { auth } from "../../../../../../../auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const styleId = parseInt(id);
  if (isNaN(styleId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [style] = await db.select().from(nailStyles).where(eq(nailStyles.id, styleId));
  if (!style) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no válido" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `style-${styleId}-${Date.now()}.${ext}`;
  const savePath = path.join(process.cwd(), "public", "uploads", "nail-styles", filename);

  await writeFile(savePath, Buffer.from(await file.arrayBuffer()));

  // Remove old thumbnail
  if (style.thumbnailUrl) {
    try {
      await unlink(path.join(process.cwd(), "public", style.thumbnailUrl));
    } catch { /* ignore */ }
  }

  const url = `/uploads/nail-styles/${filename}`;
  await db.update(nailStyles).set({ thumbnailUrl: url }).where(eq(nailStyles.id, styleId));

  return NextResponse.json({ url }, { status: 201 });
}

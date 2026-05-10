import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "../../../../../../../auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params;
  const svcId = parseInt(id);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [service] = await db.select().from(services).where(eq(services.id, svcId));
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingImages = service.images ?? [];
  if (existingImages.length >= 6) {
    return NextResponse.json({ error: "Maximum 6 images per service" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `svc-${svcId}-${Date.now()}.${ext}`;
  const savePath = path.join(process.cwd(), "public", "uploads", "services", filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(savePath, buffer);

  const url = `/uploads/services/${filename}`;
  const updatedImages = [...existingImages, url];

  await db.update(services).set({ images: updatedImages }).where(eq(services.id, svcId));

  return NextResponse.json({ url }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { auth } from "../../../../auth";

// GET — return the current stored hand photo URL
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ handPhotoUrl: null });
  }
  const [profile] = await db
    .select({ handPhotoUrl: userProfiles.handPhotoUrl })
    .from(userProfiles)
    .where(eq(userProfiles.googleId, session.user.id));
  return NextResponse.json({ handPhotoUrl: profile?.handPhotoUrl ?? null });
}

// POST — upload and store a hand photo for this user
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no válido" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen debe ser menor a 10MB" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `hand-${session.user.id.slice(-8)}-${Date.now()}.${ext}`;
  const savePath = path.join(process.cwd(), "public", "uploads", "hands", filename);

  await writeFile(savePath, Buffer.from(await file.arrayBuffer()));

  // Remove old hand photo if exists
  const [existing] = await db
    .select({ handPhotoUrl: userProfiles.handPhotoUrl })
    .from(userProfiles)
    .where(eq(userProfiles.googleId, session.user.id));

  if (existing?.handPhotoUrl) {
    try {
      await unlink(path.join(process.cwd(), "public", existing.handPhotoUrl));
    } catch { /* ignore */ }
  }

  const url = `/uploads/hands/${filename}`;
  await db
    .update(userProfiles)
    .set({ handPhotoUrl: url })
    .where(eq(userProfiles.googleId, session.user.id));

  return NextResponse.json({ handPhotoUrl: url }, { status: 201 });
}

// DELETE — remove stored hand photo
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [profile] = await db
    .select({ handPhotoUrl: userProfiles.handPhotoUrl })
    .from(userProfiles)
    .where(eq(userProfiles.googleId, session.user.id));

  if (profile?.handPhotoUrl) {
    try {
      await unlink(path.join(process.cwd(), "public", profile.handPhotoUrl));
    } catch { /* ignore */ }
    await db
      .update(userProfiles)
      .set({ handPhotoUrl: null })
      .where(eq(userProfiles.googleId, session.user.id));
  }

  return NextResponse.json({ ok: true });
}

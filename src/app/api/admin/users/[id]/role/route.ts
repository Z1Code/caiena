import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { role } = await req.json()

  if (role !== "admin" && role !== "user") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Find the target user
  const target = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, parseInt(id, 10)),
  })

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Prevent modifying superadmin emails
  if (SUPERADMIN_EMAILS.includes(target.email.toLowerCase())) {
    return NextResponse.json({ error: "Cannot modify superadmin" }, { status: 403 })
  }

  await db
    .update(userProfiles)
    .set({ role })
    .where(eq(userProfiles.id, parseInt(id, 10)))

  return NextResponse.json({ ok: true })
}

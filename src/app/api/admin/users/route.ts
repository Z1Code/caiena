import { NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { desc } from "drizzle-orm"

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await db
    .select()
    .from(userProfiles)
    .orderBy(desc(userProfiles.createdAt))

  const enriched = users.map((u) => ({
    ...u,
    role: SUPERADMIN_EMAILS.includes(u.email.toLowerCase()) ? "superadmin" : u.role,
  }))

  return NextResponse.json(enriched)
}

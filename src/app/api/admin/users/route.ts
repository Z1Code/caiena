import { NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await db
    .select()
    .from(userProfiles)
    .orderBy(desc(userProfiles.createdAt))

  return NextResponse.json(users)
}

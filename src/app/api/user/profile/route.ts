import { NextRequest, NextResponse } from "next/server"
import { auth, unstable_update } from "../../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { displayName } = await req.json()
  if (!displayName || typeof displayName !== "string" || displayName.trim().length < 2) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 })
  }

  const name = displayName.trim()

  await db
    .update(userProfiles)
    .set({ displayName: name })
    .where(eq(userProfiles.googleId, session.user.id))

  // Trigger a JWT refresh so the new name shows immediately
  await unstable_update({ user: { displayName: name } })

  return NextResponse.json({ ok: true })
}

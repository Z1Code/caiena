import { NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ linked: false, profile: null })
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.googleId, session.user.id),
  })

  return NextResponse.json({
    linked: !!profile?.whatsappPhone,
    profile: profile
      ? {
          whatsappPhone: profile.whatsappPhone,
          displayName: profile.displayName,
          role: profile.role,
        }
      : null,
  })
}

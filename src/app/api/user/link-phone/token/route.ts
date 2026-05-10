import { NextResponse } from "next/server"
import { auth } from "../../../../../../auth"
import crypto from "crypto"

const WHATSAPP_BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "12057940509"
const TOKEN_TTL_SECONDS = 900 // 15 minutes

export async function POST() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const secret = process.env.AUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

  const payload = Buffer.from(
    JSON.stringify({ sub: session.user.id, iat: Math.floor(Date.now() / 1000) })
  ).toString("base64url")

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url")

  const token = `LINK|${payload}.${hmac}`
  const waUrl = `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(token)}`

  return NextResponse.json({ waUrl, expiresIn: TOKEN_TTL_SECONDS })
}

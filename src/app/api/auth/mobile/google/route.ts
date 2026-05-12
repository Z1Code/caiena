import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createTokenPair, verifyMobileToken } from "@/lib/mobile-jwt";

/**
 * POST /api/auth/mobile/google
 * iOS app sends the Google ID token obtained from GoogleSignIn SDK.
 * Returns { accessToken, refreshToken, expiresIn } for Bearer auth on subsequent requests.
 *
 * Body: { idToken: string }
 */
export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "idToken required" }, { status: 400 });
  }

  // Verify Google ID token via tokeninfo endpoint
  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!tokenInfoRes.ok) {
    return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
  }

  const tokenInfo = await tokenInfoRes.json();

  // Validate audience matches our OAuth client
  const clientId = process.env.AUTH_GOOGLE_ID;
  if (!clientId || tokenInfo.aud !== clientId) {
    return NextResponse.json({ error: "Token audience mismatch" }, { status: 401 });
  }

  const googleId: string = tokenInfo.sub;
  const email: string = tokenInfo.email;
  const name: string = tokenInfo.name ?? tokenInfo.email;

  if (!googleId || !email) {
    return NextResponse.json({ error: "Invalid token claims" }, { status: 401 });
  }

  // Upsert user profile
  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.googleId, googleId));

  let role = "user";
  if (existing) {
    role = existing.role;
    // Update display name if changed
    if (existing.displayName !== name) {
      await db
        .update(userProfiles)
        .set({ displayName: name })
        .where(eq(userProfiles.googleId, googleId));
    }
  } else {
    // Check if this email is a superadmin
    const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
    if (superadminEmails.includes(email)) role = "superadmin";

    await db.insert(userProfiles).values({
      googleId,
      email,
      displayName: name,
      role,
    });
  }

  const tokens = createTokenPair({ sub: googleId, email, name, role });

  return NextResponse.json(tokens);
}

/**
 * POST /api/auth/mobile/google/refresh
 * Exchange a valid refresh token for a new access token.
 *
 * Body: { refreshToken: string }
 */
export async function PUT(req: NextRequest) {
  const { refreshToken } = await req.json().catch(() => ({}));
  if (!refreshToken || typeof refreshToken !== "string") {
    return NextResponse.json({ error: "refreshToken required" }, { status: 400 });
  }

  const payload = verifyMobileToken(refreshToken);
  if (!payload || payload.type !== "refresh") {
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }

  // Re-fetch role in case it changed
  const [profile] = await db
    .select({ role: userProfiles.role, displayName: userProfiles.displayName })
    .from(userProfiles)
    .where(eq(userProfiles.googleId, payload.sub));

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const tokens = createTokenPair({
    sub: payload.sub,
    email: payload.email,
    name: profile.displayName ?? payload.name,
    role: profile.role,
  });

  return NextResponse.json(tokens);
}

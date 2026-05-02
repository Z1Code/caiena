import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { whatsappAuthTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { saveUserAndContinue } from "@/app/auth/callback/route";

export async function POST(request: NextRequest) {
  const { token, name } = await request.json();

  if (!token || !name || name.trim().length < 2) {
    return NextResponse.json({ error: "Nombre inválido." }, { status: 400 });
  }

  const [authToken] = await db
    .select()
    .from(whatsappAuthTokens)
    .where(eq(whatsappAuthTokens.token, token));

  if (!authToken) {
    return NextResponse.json({ error: "Enlace no encontrado." }, { status: 404 });
  }

  if (authToken.usedAt) {
    return NextResponse.json({ error: "Este enlace ya fue utilizado." }, { status: 410 });
  }

  if (new Date() > new Date(authToken.expiresAt)) {
    return NextResponse.json({ error: "Este enlace ha expirado." }, { status: 410 });
  }

  if (!authToken.googleId || !authToken.googleEmail) {
    return NextResponse.json({ error: "Datos de Google no encontrados." }, { status: 400 });
  }

  await saveUserAndContinue({
    phone: authToken.phone,
    name: name.trim(),
    email: authToken.googleEmail,
    googleId: authToken.googleId,
    sessionData: authToken.sessionData as Record<string, unknown>,
    authToken: token,
  });

  return NextResponse.json({ name: name.trim() });
}

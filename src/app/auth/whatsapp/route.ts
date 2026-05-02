import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { whatsappAuthTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildAuthUrl } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t");

  if (!t) {
    return new NextResponse("Enlace inválido.", { status: 400 });
  }

  const [authToken] = await db
    .select()
    .from(whatsappAuthTokens)
    .where(eq(whatsappAuthTokens.token, t));

  if (!authToken) {
    return new NextResponse("Enlace no encontrado.", { status: 404 });
  }

  if (new Date() > new Date(authToken.expiresAt)) {
    return new NextResponse(
      "Este enlace ha expirado. Regresa a WhatsApp y envía 'hola' para obtener uno nuevo.",
      { status: 410 }
    );
  }

  if (authToken.usedAt) {
    return new NextResponse(
      "Este enlace ya fue utilizado. Regresa a WhatsApp para continuar.",
      { status: 410 }
    );
  }

  // Use the token itself as the OAuth state (ties callback → auth record)
  const authUrl = buildAuthUrl(t);
  return NextResponse.redirect(authUrl);
}

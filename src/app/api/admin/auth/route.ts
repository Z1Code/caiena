import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSession, logout } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Contrasena incorrecta" }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await logout();
  return NextResponse.json({ ok: true });
}

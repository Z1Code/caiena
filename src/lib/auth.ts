import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "caiena2024";
const SESSION_SECRET = process.env.SESSION_SECRET || "caiena-secret-change-me";
const SESSION_COOKIE = "caiena_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function hashToken(token: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(token).digest("hex");
}

export function generateSessionToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  return token;
}

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function createSession(): Promise<string> {
  const token = generateSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, hashToken(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return token;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return !!session?.value;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

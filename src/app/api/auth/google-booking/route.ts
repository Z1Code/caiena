import { buildAuthUrl } from "@/lib/google-oauth";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Generates a Google OAuth URL for the web booking flow.
// State prefix "web:" distinguishes it from WhatsApp tokens in the callback.
export async function GET() {
  const state = "web:" + crypto.randomBytes(16).toString("hex");
  const url = buildAuthUrl(state);
  return NextResponse.json({ url });
}

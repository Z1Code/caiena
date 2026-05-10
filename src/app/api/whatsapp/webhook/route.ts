import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/whatsapp";
import { handleMessage } from "@/lib/whatsapp-bot";
import type { KapsoMessage } from "@/lib/whatsapp";

// Actual Kapso payload shape (event is in X-Webhook-Event header, not body)
interface KapsoPayload {
  message: KapsoMessage;
  conversation?: Record<string, unknown>;
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify HMAC signature (skipped if KAPSO_WEBHOOK_SECRET not set)
  const signature = request.headers.get("x-webhook-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Event is in header, not body
  const event = request.headers.get("x-webhook-event") ?? "";
  if (event !== "whatsapp.message.received") {
    return NextResponse.json({ ok: true });
  }

  let payload: KapsoPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = payload.message;
  if (!message?.from) {
    return NextResponse.json({ ok: true });
  }

  const from = message.from;

  try {
    await handleMessage(from, message);
  } catch (err) {
    console.error("[webhook] handleMessage error:", err);
  }

  // Always return 200 so Kapso doesn't retry
  return NextResponse.json({ ok: true });
}

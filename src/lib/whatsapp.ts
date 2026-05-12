import crypto from "crypto";

const KAPSO_API_BASE = "https://api.kapso.ai/meta/whatsapp/v24.0";

function getConfig() {
  return {
    phoneNumberId: process.env.KAPSO_PHONE_NUMBER_ID!,
    apiKey: process.env.KAPSO_API_KEY!,
  };
}

async function post(phoneNumberId: string, apiKey: string, body: unknown): Promise<void> {
  const res = await fetch(`${KAPSO_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[whatsapp] send failed ${res.status}:`, text);
  }
}

export async function sendText(to: string, text: string): Promise<void> {
  const { phoneNumberId, apiKey } = getConfig();
  await post(phoneNumberId, apiKey, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: text, preview_url: false },
  });
}

export interface ButtonItem {
  id: string;   // max 256 chars
  title: string; // max 20 chars
}

export async function sendButtons(
  to: string,
  bodyText: string,
  buttons: ButtonItem[] // max 3
): Promise<void> {
  const { phoneNumberId, apiKey } = getConfig();
  await post(phoneNumberId, apiKey, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

export interface ListRow {
  id: string;          // max 200 chars
  title: string;       // max 24 chars
  description?: string; // max 72 chars
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export async function sendList(
  to: string,
  bodyText: string,
  buttonLabel: string, // max 20 chars — button that opens the list
  sections: ListSection[] // max 10 rows total
): Promise<void> {
  const { phoneNumberId, apiKey } = getConfig();
  await post(phoneNumberId, apiKey, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonLabel,
        sections,
      },
    },
  });
}

// ─── Webhook signature verification ─────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.KAPSO_WEBHOOK_SECRET;
  if (!secret) return false; // secret not configured — deny all requests

  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Kapso may send raw hex or "sha256=<hex>"
  const normalized = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  if (normalized.length !== expectedHex.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(normalized),
    Buffer.from(expectedHex)
  );
}

// ─── Template messages ───────────────────────────────────────────────────────

export interface TemplateQuickReply {
  payload: string; // max 256 chars — returned verbatim when user taps
}

/**
 * Send a pre-approved template message with optional body variables and
 * quick-reply buttons (max 3). Template must be approved in Meta Business Manager.
 */
export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[],
  quickReplies: TemplateQuickReply[] = []
): Promise<void> {
  const { phoneNumberId, apiKey } = getConfig();

  const components: unknown[] = [];

  if (bodyParams.length > 0) {
    components.push({
      type: "body",
      parameters: bodyParams.map((text) => ({ type: "text", text })),
    });
  }

  quickReplies.forEach((qr, index) => {
    components.push({
      type: "button",
      sub_type: "quick_reply",
      index: String(index),
      parameters: [{ type: "payload", payload: qr.payload }],
    });
  });

  await post(phoneNumberId, apiKey, {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
}

// ─── Incoming message types ──────────────────────────────────────────────────

export interface KapsoWebhookPayload {
  event: string;
  data: {
    message: KapsoMessage;
    conversation: { phone_number: string; phone_number_id: string };
    phone_number_id: string;
  };
}

export interface KapsoMessage {
  id: string;
  type: "text" | "interactive" | "button" | "image" | "audio" | "document" | string;
  from: string;
  text?: { body: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  /** Present when type === "button" — template quick-reply tapped by user */
  button?: { payload: string; text: string };
}

/** Returns the selected ID (button or list) or free text, or null for unsupported types */
export function extractInput(msg: KapsoMessage): string | null {
  if (msg.type === "text") return msg.text?.body?.trim() ?? null;
  if (msg.type === "interactive") {
    if (msg.interactive?.type === "button_reply")
      return msg.interactive.button_reply?.id ?? null;
    if (msg.interactive?.type === "list_reply")
      return msg.interactive.list_reply?.id ?? null;
  }
  // Template quick-reply buttons come back as type "button" with a payload
  if (msg.type === "button") return msg.button?.payload ?? null;
  return null;
}

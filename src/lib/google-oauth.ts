import { google } from "googleapis";

function getRedirectUri() {
  const base = process.env.APP_URL ?? "https://caienanails.com";
  return `${base}/auth/callback`;
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    getRedirectUri()
  );
}

export function buildAuthUrl(state: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "profile", "email"],
    state,
    prompt: "select_account",
  });
}

export async function exchangeCodeForProfile(
  code: string
): Promise<{ id: string; name: string; email: string }> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();

  return {
    id: data.id ?? "",
    name: data.name ?? "",
    email: data.email ?? "",
  };
}

/**
 * Returns true if the name looks like a real human name.
 * Rejects email addresses, usernames, numeric strings, etc.
 */
export function isRealName(name: string): boolean {
  if (!name || name.trim().length < 2) return false;
  if (name.includes("@")) return false;                  // email-like
  if (/^\d+$/.test(name.trim())) return false;           // all numbers
  if (/\d{3,}/.test(name)) return false;                 // 3+ consecutive digits
  if (/[_+]/.test(name) && !name.includes(" ")) return false; // username-like (no spaces)
  if (name.toLowerCase().trim() === "google user") return false;
  if (name.toLowerCase().trim() === "unknown") return false;
  return true;
}

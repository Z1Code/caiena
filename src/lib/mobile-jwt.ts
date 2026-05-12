import { createHmac, timingSafeEqual } from "crypto";

export interface MobileTokenPayload {
  sub: string;       // googleId
  email: string;
  name: string;
  role: string;
  type: "access" | "refresh";
  exp: number;       // unix seconds
  iat: number;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

export function signMobileToken(payload: MobileTokenPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;

    const expectedSig = createHmac("sha256", secret())
      .update(`${header}.${body}`)
      .digest("base64url");

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload: MobileTokenPayload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createTokenPair(payload: Omit<MobileTokenPayload, "type" | "exp" | "iat">) {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = signMobileToken({ ...payload, type: "access", iat: now, exp: now + 3600 });         // 1h
  const refreshToken = signMobileToken({ ...payload, type: "refresh", iat: now, exp: now + 2592000 });    // 30d
  return { accessToken, refreshToken, expiresIn: 3600 };
}

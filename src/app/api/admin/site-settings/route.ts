import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

const DEFAULTS: Record<string, string> = {
  show_gallery: "false",
  show_about:   "false",
};

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(siteSettings);
  const result: Record<string, boolean> = { ...Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, v === "true"])) };
  for (const row of rows) result[row.key] = row.value === "true";
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: Record<string, boolean> = await req.json();
  for (const [key, val] of Object.entries(body)) {
    if (!(key in DEFAULTS)) continue;
    await db.insert(siteSettings).values({ key, value: String(val) })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: String(val) } });
  }
  return NextResponse.json({ ok: true });
}

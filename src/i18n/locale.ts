"use server";

import { cookies } from "next/headers";
import type { Locale } from "./index";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const val = jar.get("locale")?.value;
  return val === "en" ? "en" : "es";
}

export async function setLocaleCookie(locale: Locale): Promise<void> {
  const jar = await cookies();
  jar.set("locale", locale, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    sameSite: "lax",
  });
}

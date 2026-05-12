"use client";

import { useTransition } from "react";
import { setLocaleCookie } from "@/i18n/locale";
import { getClientLocale } from "@/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  const locale = getClientLocale();
  const next = locale === "es" ? "en" : "es";
  const label = locale === "es" ? "EN" : "ES";

  function toggle() {
    startTransition(async () => {
      await setLocaleCookie(next);
      window.location.reload();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={`Switch to ${next.toUpperCase()}`}
      className={`text-xs font-medium tracking-[0.1em] uppercase border border-current/30 rounded-full px-2.5 py-1 hover:border-current/60 transition-colors disabled:opacity-50 ${className ?? ""}`}
    >
      {pending ? "…" : label}
    </button>
  );
}

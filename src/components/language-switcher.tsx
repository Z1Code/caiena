"use client";

import { useSiteLocale } from "@/components/site-locale-context";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useSiteLocale();
  const next = locale === "es" ? "en" : "es";
  const label = locale === "es" ? "EN" : "ES";

  return (
    <button
      onClick={() => setLocale(next)}
      aria-label={`Switch to ${next.toUpperCase()}`}
      className={`text-xs font-medium tracking-[0.1em] uppercase border border-current/30 rounded-full px-2.5 py-1 hover:border-current/60 transition-colors ${className ?? ""}`}
    >
      {label}
    </button>
  );
}

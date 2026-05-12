"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { setLocaleCookie } from "@/i18n/locale";
import { getT, type Locale, type Dict } from "@/i18n";

interface SiteLocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
}

const SiteLocaleContext = createContext<SiteLocaleContextValue | null>(null);

export function SiteLocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(next: Locale) {
    setLocaleState(next);
    setLocaleCookie(next);
  }

  return (
    <SiteLocaleContext.Provider value={{ locale, setLocale, t: getT(locale) }}>
      {children}
    </SiteLocaleContext.Provider>
  );
}

export function useSiteLocale() {
  const ctx = useContext(SiteLocaleContext);
  if (!ctx) throw new Error("useSiteLocale must be used inside SiteLocaleProvider");
  return ctx;
}

/** Shortcut — just the translations */
export function useSiteT(): Dict {
  return useSiteLocale().t;
}

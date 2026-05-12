"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { setLocaleCookie } from "@/i18n/locale";
import { getAdminT, type AdminLocale, type AdminTranslations } from "@/i18n/admin";

interface AdminLocaleContextValue {
  locale: AdminLocale;
  setLocale: (l: AdminLocale) => void;
  t: AdminTranslations;
}

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

export function AdminLocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: AdminLocale;
}) {
  const [locale, setLocaleState] = useState<AdminLocale>(initialLocale);

  function setLocale(next: AdminLocale) {
    setLocaleState(next);
    setLocaleCookie(next); // persist for server-rendered pages + public site
  }

  return (
    <AdminLocaleContext.Provider value={{ locale, setLocale, t: getAdminT(locale) }}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  const ctx = useContext(AdminLocaleContext);
  if (!ctx) throw new Error("useAdminLocale must be used inside AdminLocaleProvider");
  return ctx;
}

/** Shortcut — just the translations */
export function useAdminT(): AdminTranslations {
  return useAdminLocale().t;
}

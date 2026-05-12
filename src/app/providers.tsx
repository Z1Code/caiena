"use client"

import { SessionProvider } from "next-auth/react"
import { SiteLocaleProvider } from "@/components/site-locale-context"
import type { Locale } from "@/i18n"

export function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  return (
    <SessionProvider>
      <SiteLocaleProvider initialLocale={initialLocale}>
        {children}
      </SiteLocaleProvider>
    </SessionProvider>
  )
}

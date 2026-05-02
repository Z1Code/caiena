"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"

export function AuthWidget() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-accent-light/30 animate-pulse" />
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="shimmer-btn ml-4 bg-foreground text-white text-xs px-6 py-2.5 rounded-full tracking-[0.1em] uppercase hover:bg-accent-dark transition-colors"
      >
        Iniciar sesión
      </button>
    )
  }

  const displayName = session.user.displayName || session.user.name || "Usuario"
  const firstName = displayName.split(" ")[0]

  return (
    <div ref={ref} className="relative ml-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-accent-light/40 px-3 py-1.5 hover:bg-accent-light/10 transition-colors"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={displayName}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-xs font-medium text-accent-dark">
              {firstName[0].toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-xs text-foreground/70 max-w-[80px] truncate">{firstName}</span>
        <svg className="w-3 h-3 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-accent-light/30 shadow-lg shadow-accent/5 py-1 z-50">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-accent-light/10 transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Mi panel
          </a>
          <div className="border-t border-accent-light/20 my-1" />
          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }) }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  {
    href: "/dashboard/bookings",
    label: "Reservas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/dashboard/staff",
    label: "Empleadas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/dashboard/schedule",
    label: "Horarios",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    href: "/dashboard/groups",
    label: "Grupos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/services",
    label: "Servicios",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
        <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
        <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
        <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
        <path d="M15.5 9H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5S16.33 9 15.5 9z" />
        <path d="M10 9.5C10 8.67 9.33 8 8.5 8H3.5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z" />
        <path d="M8.5 15H10v-1.5c0-.83-.67-1.5-1.5-1.5S7 12.67 7 13.5 7.67 15 8.5 15z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/catalog",
    label: "Diseños",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/site",
    label: "Sitio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M12 2a10 10 0 0 1 0 20M12 2a10 10 0 0 0 0 20" />
      </svg>
    ),
  },
];

const USERS_ITEM = {
  href: "/dashboard/users",
  label: "Usuarios",
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export function AdminSidebar({ canManageUsers }: { canManageUsers: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const items = canManageUsers ? [...NAV_ITEMS, USERS_ITEM] : NAV_ITEMS;

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold text-foreground">Caiena</span>
          <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent-dark)] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">Admin</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${
                active
                  ? "bg-[var(--accent)]/10 text-[var(--accent-dark)]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <span className={active ? "text-[var(--accent)]" : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-1">
        <a
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-gray-400">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Ver sitio
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* ── Desktop sidebar (lg+) ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-gray-200 min-h-screen sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold text-foreground">Caiena</span>
          <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent-dark)] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">Admin</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── Mobile drawer overlay ───────────────────────────────── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

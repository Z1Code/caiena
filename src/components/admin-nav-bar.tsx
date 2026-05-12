"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard/bookings", label: "Reservas" },
  { href: "/dashboard/staff", label: "Empleadas" },
  { href: "/dashboard/schedule", label: "Horarios" },
  { href: "/dashboard/groups", label: "Grupos" },
  { href: "/dashboard/services", label: "Servicios" },
  { href: "/dashboard/catalog", label: "Diseños" },
  { href: "/dashboard/site", label: "Sitio" },
];

export function AdminNavBar({ canManageUsers }: { canManageUsers: boolean }) {
  const pathname = usePathname();
  const items = canManageUsers
    ? [...NAV_ITEMS, { href: "/dashboard/users", label: "Usuarios" }]
    : NAV_ITEMS;

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-semibold text-foreground">Caiena</span>
            <span className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">Ver sitio</a>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                pathname === item.href
                  ? "border-accent text-accent-dark"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

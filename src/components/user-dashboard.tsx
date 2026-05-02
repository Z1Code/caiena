"use client";

import type { Session } from "next-auth";

interface UserDashboardProps {
  session: Session;
}

export function UserDashboard({ session }: UserDashboardProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mi Dashboard</h1>
      <p className="text-gray-600">Bienvenido, {session.user?.name || "Usuario"}.</p>
      <p className="text-sm text-gray-500 mt-2">Esta sección estará disponible próximamente.</p>
    </div>
  );
}

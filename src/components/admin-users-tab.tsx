"use client"

import { useState, useEffect } from "react"

interface UserProfile {
  id: number
  googleId: string
  email: string
  role: string
  whatsappPhone: string | null
  displayName: string | null
  linkedAt: string | null
  createdAt: string
}

export function AdminUsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  async function fetchUsers() {
    const res = await fetch("/api/admin/users")
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function changeRole(id: number, newRole: "admin" | "user") {
    setUpdating(id)
    await fetch(`/api/admin/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    await fetchUsers()
    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Usuarios registrados</h2>
        <p className="text-sm text-gray-500">
          Los cambios de rol se aplican en la próxima sesión del usuario (máx. 5 min).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No hay usuarios registrados aún
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-4 py-3">
                {/* Avatar placeholder */}
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-accent-dark">
                    {(user.displayName ?? user.email)[0].toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.displayName ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  {user.whatsappPhone && (
                    <p className="text-xs text-gray-400 truncate">
                      📱 {user.whatsappPhone}
                    </p>
                  )}
                </div>

                {/* Role badge */}
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    user.role === "superadmin"
                      ? "bg-purple-100 text-purple-700"
                      : user.role === "admin"
                      ? "bg-accent/10 text-accent-dark"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {user.role}
                </span>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {user.role === "superadmin" ? null : user.role === "user" ? (
                    <button
                      onClick={() => changeRole(user.id, "admin")}
                      disabled={updating === user.id}
                      className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
                    >
                      {updating === user.id ? "..." : "Hacer admin"}
                    </button>
                  ) : (
                    <button
                      onClick={() => changeRole(user.id, "user")}
                      disabled={updating === user.id}
                      className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {updating === user.id ? "..." : "Quitar admin"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

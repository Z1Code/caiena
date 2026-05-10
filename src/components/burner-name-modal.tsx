"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

export function BurnerNameModal() {
  const { update } = useSession()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return
    setLoading(true)
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      })
      await update({ displayName: name.trim() })
      setDismissed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-1">
          ¿Cómo te llamamos?
        </h2>
        <p className="text-sm text-foreground/50 mb-5">
          Tu nombre de Google no parece un nombre real. ¿Cómo prefieres que te llamemos?
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors mb-4"
            autoFocus
          />
          <button
            type="submit"
            disabled={name.trim().length < 2 || loading}
            className="w-full bg-accent text-white py-3 rounded-full text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full mt-2 text-xs text-foreground/40 hover:text-foreground/60 py-2"
          >
            Saltar por ahora
          </button>
        </form>
      </div>
    </div>
  )
}

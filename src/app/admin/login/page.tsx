"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Contrasena incorrecta");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blush/60 border-2 border-accent-light flex items-center justify-center mx-auto mb-4">
            <span className="font-serif text-2xl text-accent-dark">C</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Admin
          </h1>
          <p className="text-sm text-foreground/50 mt-1">Caiena Beauty Nails</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-accent-light/30 p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block text-sm text-foreground/60 mb-1.5">
            Contrasena
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contrasena"
            className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors mb-4"
            autoFocus
          />

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-accent text-white py-3 rounded-full text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SetupNameForm() {
  const params = useSearchParams();
  const router = useRouter();
  const t = params.get("t") ?? "";
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isValid = name.trim().split(/\s+/).filter(Boolean).length >= 1 && name.trim().length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("Por favor escribe tu nombre.");
      return;
    }
    setError("");

    startTransition(async () => {
      const res = await fetch("/api/auth/confirm-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, name: name.trim() }),
      });

      if (res.ok) {
        const { name: savedName } = await res.json();
        router.push(`/auth/success?name=${encodeURIComponent(savedName)}`);
      } else {
        const { error: msg } = await res.json();
        setError(msg ?? "Algo salió mal. Intenta de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm text-[#8a6e5f] font-medium tracking-wide">
          ¿Cómo te llamas?
        </label>
        <input
          id="name"
          type="text"
          autoFocus
          autoComplete="given-name"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          className="w-full px-4 py-3.5 rounded-2xl border border-[#e8d5cc] bg-white text-[#4a2f23] placeholder:text-[#c9a088] text-lg focus:outline-none focus:ring-2 focus:ring-[#c9a088] transition"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={!isValid || isPending}
        className="w-full py-3.5 rounded-2xl bg-[#c9a088] text-white font-semibold text-base tracking-wide hover:bg-[#b8896f] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Guardando…" : "Continuar →"}
      </button>
    </form>
  );
}

export default function SetupNamePage() {
  return (
    <main className="min-h-screen bg-[#fdf5f0] flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Logo / branding */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-['Playfair_Display'] text-3xl text-[#4a2f23] tracking-tight">
            Caiena
          </span>
          <span className="text-xs text-[#c9a088] uppercase tracking-[0.2em]">
            Beauty Nails
          </span>
        </div>

        {/* Greeting */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">👋</span>
          <h1 className="text-xl font-semibold text-[#4a2f23]">
            Un último paso
          </h1>
          <p className="text-sm text-[#8a6e5f] leading-relaxed">
            Necesitamos tu nombre para confirmar la cita.
          </p>
        </div>

        <Suspense>
          <SetupNameForm />
        </Suspense>
      </div>
    </main>
  );
}

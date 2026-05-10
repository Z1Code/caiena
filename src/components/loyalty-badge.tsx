"use client";

import { useState } from "react";

const tierInfo = {
  bronze: { label: "Bronce", color: "text-amber-700 bg-amber-50 border-amber-200", perk: "" },
  silver: { label: "Plata", color: "text-gray-600 bg-gray-50 border-gray-200", perk: "5% descuento" },
  gold: { label: "Oro", color: "text-yellow-700 bg-yellow-50 border-yellow-200", perk: "10% descuento + prioridad" },
};

export function LoyaltyBadge() {
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<{
    points: number;
    totalEarned: number;
    tier: string;
    exists: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty?phone=${encodeURIComponent(phone)}`);
      setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const tier = data ? tierInfo[data.tier as keyof typeof tierInfo] : null;

  return (
    <div className="bg-white rounded-2xl border border-accent-light/30 p-6">
      <h3 className="font-serif text-lg font-medium text-foreground mb-4">
        Programa de Lealtad
      </h3>
      <p className="text-sm text-foreground/50 mb-4">
        Gana puntos con cada visita. $1 = 1 punto. Sube de nivel y obtene descuentos.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Tu telefono"
          className="flex-1 px-4 py-2.5 rounded-xl border border-accent-light/40 bg-cream/30 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60"
        />
        <button
          onClick={handleCheck}
          disabled={loading || !phone.trim()}
          className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Ver"}
        </button>
      </div>

      {data && tier && (
        <div className={`rounded-xl border p-4 ${tier.color}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Nivel: {tier.label}</span>
            {tier.perk && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/60">
                {tier.perk}
              </span>
            )}
          </div>
          <p className="text-2xl font-serif font-semibold">{data.points} pts</p>
          <p className="text-xs opacity-60 mt-1">
            Total acumulado: {data.totalEarned} pts
          </p>

          {/* Progress to next tier */}
          {data.tier !== "gold" && (
            <div className="mt-3">
              <div className="flex justify-between text-xs opacity-60 mb-1">
                <span>{data.tier === "bronze" ? "Plata: 100 pts" : "Oro: 300 pts"}</span>
                <span>
                  {data.tier === "bronze"
                    ? `${Math.max(0, 100 - data.totalEarned)} pts mas`
                    : `${Math.max(0, 300 - data.totalEarned)} pts mas`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      data.tier === "bronze"
                        ? (data.totalEarned / 100) * 100
                        : (data.totalEarned / 300) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {data && !data.exists && (
        <p className="text-xs text-foreground/40 mt-2">
          Aun no tienes puntos. Reserva tu primera cita para empezar a acumular.
        </p>
      )}
    </div>
  );
}

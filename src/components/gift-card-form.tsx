"use client";

import { useState } from "react";

const presetAmounts = [25, 50, 75, 100];

export function GiftCardForm() {
  const [tab, setTab] = useState<"buy" | "check">("buy");
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string; amount: number } | null>(null);
  const [error, setError] = useState("");

  // Check balance state
  const [checkCode, setCheckCode] = useState("");
  const [balance, setBalance] = useState<{ code: string; amount: number; balance: number; status: string } | null>(null);

  const handlePurchase = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || !purchaserName) {
      setError("Nombre y monto son requeridos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          purchaserName,
          purchaserEmail,
          recipientName,
          recipientEmail,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al comprar");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    if (!checkCode.trim()) return;
    setLoading(true);
    setError("");
    setBalance(null);

    try {
      const res = await fetch(`/api/gift-cards/${checkCode.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gift card no encontrada");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white rounded-3xl border border-accent-light/30 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">Gift Card Lista</h3>
        <p className="text-foreground/50 mb-6">Comparte este codigo con la persona afortunada:</p>

        <div className="bg-cream/50 rounded-2xl p-6 mb-6">
          <p className="text-xs text-foreground/40 mb-2">Codigo</p>
          <p className="font-mono text-3xl font-bold text-accent-dark tracking-widest">{result.code}</p>
          <p className="text-sm text-foreground/50 mt-3">Valor: ${result.amount}</p>
        </div>

        <p className="text-xs text-foreground/40 mb-6">
          Presenta este codigo al momento de tu cita para aplicar el descuento.
        </p>

        <button
          onClick={() => {
            setResult(null);
            setPurchaserName("");
            setCustomAmount("");
            setMessage("");
          }}
          className="text-sm text-accent-dark hover:text-foreground transition-colors"
        >
          Comprar otra
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-accent-light/30 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-accent-light/20">
        <button
          onClick={() => setTab("buy")}
          className={`flex-1 py-3 text-sm text-center transition-colors ${
            tab === "buy" ? "bg-accent/10 text-accent-dark font-medium" : "text-foreground/40"
          }`}
        >
          Comprar
        </button>
        <button
          onClick={() => setTab("check")}
          className={`flex-1 py-3 text-sm text-center transition-colors ${
            tab === "check" ? "bg-accent/10 text-accent-dark font-medium" : "text-foreground/40"
          }`}
        >
          Verificar Saldo
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {tab === "buy" ? (
          <div className="space-y-5">
            {/* Amount selection */}
            <div>
              <label className="block text-sm text-foreground/60 mb-2">Monto</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {presetAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustomAmount(""); }}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      amount === a && !customAmount
                        ? "bg-accent text-white"
                        : "border border-accent-light/30 text-foreground/60 hover:border-accent/40"
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="O ingresa un monto personalizado ($10-$500)"
                className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-foreground/60 mb-1.5">Tu nombre *</label>
              <input
                type="text"
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm text-foreground/60 mb-1.5">Para quien es (opcional)</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors"
                placeholder="Nombre del destinatario"
              />
            </div>

            <div>
              <label className="block text-sm text-foreground/60 mb-1.5">Mensaje personal (opcional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors resize-none"
                placeholder="Un mensaje especial..."
              />
            </div>

            <button
              onClick={handlePurchase}
              disabled={loading || !purchaserName}
              className="w-full bg-accent text-white py-3.5 rounded-full text-sm hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Procesando..." : `Comprar Gift Card - $${customAmount || amount}`}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-foreground/60 mb-1.5">Codigo de Gift Card</label>
              <input
                type="text"
                value={checkCode}
                onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground font-mono text-lg tracking-widest placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors text-center uppercase"
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>

            <button
              onClick={handleCheckBalance}
              disabled={loading || checkCode.length < 8}
              className="w-full bg-accent text-white py-3.5 rounded-full text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar Saldo"}
            </button>

            {balance && (
              <div className="bg-cream/50 rounded-2xl p-6 text-center">
                <p className="text-xs text-foreground/40 mb-1">Saldo disponible</p>
                <p className="font-serif text-3xl font-semibold text-accent-dark">${balance.balance}</p>
                <p className="text-xs text-foreground/40 mt-2">
                  de ${balance.amount} original &middot;{" "}
                  <span className={balance.status === "active" ? "text-green-600" : "text-red-500"}>
                    {balance.status === "active" ? "Activa" : balance.status === "used" ? "Usada" : "Expirada"}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import type { CatalogStyle } from "./NailCarousel";

const BASES_ORDER = ["garra", "ascendente", "doble", "rocio"];
const BASES_LABELS: Record<string, string> = {
  garra: "Garra",
  ascendente: "Ascendente",
  doble: "Doble Mano",
  rocio: "Rocío",
};

const STACK_OFFSETS = [
  { tx: 0,  ty: 0,   rot: 0, scale: 1    },
  { tx: 4,  ty: -8,  rot: 2, scale: 0.96 },
  { tx: 8,  ty: -16, rot: 4, scale: 0.92 },
  { tx: 12, ty: -24, rot: 6, scale: 0.88 },
];

interface Props {
  style: CatalogStyle;
  onClose: () => void;
  onSelectDesign?: (styleId: number, baseId: string) => void;
}

type BookingStep = "idle" | "form" | "whatsapp" | "confirmed";

function BookingFlow({ style }: { style: CatalogStyle }) {
  const { data: session, status } = useSession();
  const [step, setStep]           = useState<BookingStep>("idle");
  const [date, setDate]           = useState("");
  const [time, setTime]           = useState("10:00");
  const [notes, setNotes]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [waUrl, setWaUrl]         = useState("");
  const [token, setToken]         = useState("");
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const times = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

  useEffect(() => {
    if (step !== "whatsapp" || !token) return;
    pollRef.current = setInterval(async () => {
      const res  = await fetch(`/api/booking/request?token=${token}`);
      const data = await res.json();
      if (data.status === "phone_linked") {
        clearInterval(pollRef.current!);
        setStep("confirmed");
      }
    }, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, token]);

  async function submitForm() {
    if (!date) return;
    setLoading(true);
    const res  = await fetch("/api/booking/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleId: style.id, styleName: style.name, desiredDate: date, desiredTime: time, notes }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.waUrl) { setWaUrl(data.waUrl); setToken(data.token); setStep("whatsapp"); }
  }

  if (step === "confirmed") {
    return (
      <div className="text-center space-y-2">
        <p className="text-lg" style={{ color: "var(--caiena-plum)", fontFamily: "var(--font-cormorant), serif" }}>
          ¡Listo! Te confirmamos por WhatsApp 🌸
        </p>
        <p className="text-xs" style={{ color: "var(--caiena-rose)" }}>Revisaremos disponibilidad y te avisamos pronto.</p>
      </div>
    );
  }

  if (step === "whatsapp") {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm" style={{ color: "var(--caiena-plum)" }}>
          Toca el botón para enviar el mensaje de confirmación:
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "#25D366", color: "white" }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.533 5.857L.057 23.57a.5.5 0 00.614.614l5.763-1.478A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.775-.5-5.362-1.376l-.383-.22-3.971 1.018 1.036-3.878-.241-.395A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          Enviar por WhatsApp
        </a>
        <p className="text-xs" style={{ color: "var(--caiena-rose)" }}>Esperando tu mensaje…</p>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="space-y-4 w-72">
        <div className="space-y-1">
          <label className="text-xs tracking-widest uppercase" style={{ color: "var(--caiena-rose-dark)" }}>Fecha</label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ borderColor: "var(--caiena-champagne)", color: "var(--caiena-plum)", background: "rgba(255,255,255,0.8)" }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs tracking-widest uppercase" style={{ color: "var(--caiena-rose-dark)" }}>Hora aproximada</label>
          <select
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ borderColor: "var(--caiena-champagne)", color: "var(--caiena-plum)", background: "rgba(255,255,255,0.8)" }}
          >
            {times.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs tracking-widest uppercase" style={{ color: "var(--caiena-rose-dark)" }}>Notas (opcional)</label>
          <input
            type="text"
            placeholder="Ej: color preferido, largo..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ borderColor: "var(--caiena-champagne)", color: "var(--caiena-plum)", background: "rgba(255,255,255,0.8)" }}
          />
        </div>
        <button
          onClick={submitForm}
          disabled={!date || loading}
          className="w-full py-3 rounded-full text-sm tracking-widest uppercase transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--caiena-plum)", color: "white" }}
        >
          {loading ? "Procesando…" : "Continuar con WhatsApp →"}
        </button>
      </div>
    );
  }

  // idle
  if (status === "loading") return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="px-8 py-3 rounded-full text-sm tracking-widest uppercase transition-all hover:opacity-80"
        style={{ background: "var(--caiena-plum)", color: "white" }}
      >
        Agendar
      </button>
    );
  }

  return (
    <button
      onClick={() => setStep("form")}
      className="px-8 py-3 rounded-full text-sm tracking-widest uppercase transition-all hover:opacity-80"
      style={{ background: "var(--caiena-plum)", color: "white" }}
    >
      Agendar este diseño
    </button>
  );
}

export function DesignOverlay({ style, onClose, onSelectDesign }: Props) {
  const [poseIdx, setPoseIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const variants = BASES_ORDER
    .map((baseId) => style.variants.find((v) => v.baseId === baseId))
    .filter((v): v is NonNullable<typeof v> => v != null);

  const total = variants.length;

  const goNext = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setPoseIdx((i) => (i + 1) % total);
    setTimeout(() => setAnimating(false), 520);
  }, [animating, total]);

  const goPrev = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setPoseIdx((i) => (i - 1 + total) % total);
    setTimeout(() => setAnimating(false), 520);
  }, [animating, total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); }
  };

  const activeVariant = variants[poseIdx];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-4 py-20 overflow-y-auto"
      style={{ background: "rgba(254,249,247,0.88)", backdropFilter: "blur(10px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Back button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm tracking-widest uppercase transition-opacity hover:opacity-60"
        style={{ color: "var(--caiena-plum)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Catálogo
      </button>

      {/* Card stack + arrows */}
      <div
        className="relative flex items-center gap-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left arrow */}
        {total > 1 && (
          <button
            onClick={goPrev}
            disabled={animating}
            className="flex-none w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105 disabled:opacity-40"
            style={{ borderColor: "var(--caiena-plum)", color: "var(--caiena-plum)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Stack */}
        <div
          className="relative"
          style={{ width: "clamp(220px, 32vw, 340px)", aspectRatio: "2/3" }}
        >
          {variants.map((v, i) => {
            const pos = (i - poseIdx + total) % total;
            const offset = STACK_OFFSETS[Math.min(pos, 3)];
            const isActive = pos === 0;

            return (
              <div
                key={v.id}
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{
                  transform: `translate(${offset.tx}px, ${offset.ty}px) rotate(${offset.rot}deg) scale(${offset.scale})`,
                  transition: animating
                    ? "transform 0.52s cubic-bezier(.34,1.15,.64,1), opacity 0.4s ease"
                    : "none",
                  zIndex: total - pos,
                  opacity: pos === 0 ? 1 : pos === 1 ? 0.8 : pos === 2 ? 0.6 : 0.4,
                  boxShadow: isActive ? "0 24px 60px rgba(58,16,32,0.18)" : "none",
                }}
              >
                {v.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.imagePath}
                    alt={`${style.name} — ${BASES_LABELS[v.baseId] ?? v.baseId}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: "var(--caiena-bg2)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        {total > 1 && (
          <button
            onClick={goNext}
            disabled={animating}
            className="flex-none w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105 disabled:opacity-40"
            style={{ borderColor: "var(--caiena-plum)", color: "var(--caiena-plum)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Info + CTA */}
      <div
        className="text-center"
        style={{ animation: "cardEntrance 0.5s ease both" }}
      >
        <p
          className="text-2xl font-light italic mb-1"
          style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            color: "var(--caiena-plum)",
          }}
        >
          {style.name}
        </p>
        <p
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: "var(--caiena-rose)" }}
        >
          {total > 1 && `${poseIdx + 1} / ${total}`}
        </p>

        {/* Pose dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {variants.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (animating) return;
                setAnimating(true);
                setPoseIdx(i);
                setTimeout(() => setAnimating(false), 520);
              }}
              aria-label={`Pose ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === poseIdx ? "16px" : "5px",
                height: "5px",
                background: i === poseIdx ? "var(--caiena-plum)" : "var(--caiena-champagne)",
              }}
            />
          ))}
        </div>

        <BookingFlow style={style} />

        {onSelectDesign && activeVariant && (
          <button
            onClick={() => {
              onSelectDesign(style.id, activeVariant.baseId);
              onClose();
            }}
            className="mt-3 px-8 py-3 rounded-full text-sm tracking-widest uppercase transition-all hover:opacity-80"
            style={{ border: "1px solid var(--caiena-plum)", color: "var(--caiena-plum)" }}
          >
            Seleccionar este diseño
          </button>
        )}
      </div>
    </div>
  );
}

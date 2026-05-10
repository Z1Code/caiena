"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
      className="fixed inset-0 z-50 flex items-center justify-center"
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
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center"
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
          {activeVariant ? (BASES_LABELS[activeVariant.baseId] ?? activeVariant.baseId) : ""}
          {total > 1 && ` — ${poseIdx + 1} / ${total}`}
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

        {onSelectDesign && activeVariant && (
          <button
            onClick={() => {
              onSelectDesign(style.id, activeVariant.baseId);
              onClose();
            }}
            className="px-8 py-3 rounded-full text-sm tracking-widest uppercase transition-all hover:opacity-80"
            style={{ background: "var(--caiena-plum)", color: "white" }}
          >
            Seleccionar este diseño
          </button>
        )}
      </div>
    </div>
  );
}

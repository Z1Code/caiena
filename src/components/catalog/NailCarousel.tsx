"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export interface NailVariant {
  id: number;
  styleId: number;
  baseId: string;
  imagePath: string;
}

export interface CatalogStyle {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  color: string | null;
  acabado: string | null;
  forma: string | null;
  estilo: string | null;
  badge: string | null;
  variants: NailVariant[];
}

interface Props {
  styles: CatalogStyle[];
  onSelect?: (style: CatalogStyle) => void;
}

const SPEED = 38; // px/sec

export function NailCarousel({ styles, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const playingRef = useRef(true);

  useEffect(() => { playingRef.current = playing; }, [playing]);

  const loop = useCallback((ts: number) => {
    const track = trackRef.current;
    if (!track || !playingRef.current) { lastTsRef.current = null; return; }
    if (lastTsRef.current !== null) {
      const dt = (ts - lastTsRef.current) / 1000;
      const max = track.scrollWidth - track.clientWidth;
      if (max > 0) {
        track.scrollLeft += SPEED * dt;
        if (track.scrollLeft >= max - 1) {
          track.style.scrollBehavior = "auto";
          track.scrollLeft = 0;
          track.style.scrollBehavior = "";
        }
        const cardWidth = max / Math.max(styles.length - 1, 1);
        setActiveIdx(Math.min(Math.round(track.scrollLeft / cardWidth), styles.length - 1));
      }
    }
    lastTsRef.current = ts;
    rafRef.current = requestAnimationFrame(loop);
  }, [styles.length]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, loop]);

  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setPlaying(true), 1800);
  };

  if (styles.length === 0) return null;

  return (
    <section className="relative py-16 overflow-hidden" style={{ background: "var(--caiena-bg)" }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-8 flex items-end justify-between">
        <div>
          <p
            className="text-xs tracking-[0.4em] uppercase mb-2"
            style={{ color: "var(--caiena-rose-dark)" }}
          >
            Colección
          </p>
          <h2
            className="text-4xl sm:text-5xl font-light italic"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              color: "var(--caiena-plum)",
            }}
          >
            Nuestros Diseños
          </h2>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-2 text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-colors"
          style={{ borderColor: "var(--caiena-rose-dark)", color: "var(--caiena-rose-dark)" }}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {playing ? "Pausar" : "Ver"}
        </button>
      </div>

      {/* Carousel with edge fades */}
      <div
        className="relative"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
        }}
      >
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto pb-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onMouseEnter={() => setPlaying(false)}
          onMouseLeave={() => setPlaying(true)}
          onTouchStart={() => setPlaying(false)}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex-none w-16 shrink-0" aria-hidden />
          {styles.map((style, i) => (
            <CarouselCard key={style.id} style={style} onClick={() => onSelect?.(style)} poseIndex={i} />
          ))}
          <div className="flex-none w-16 shrink-0" aria-hidden />
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-6">
        {styles.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const track = trackRef.current;
              if (!track) return;
              const max = track.scrollWidth - track.clientWidth;
              const cardWidth = max / Math.max(styles.length - 1, 1);
              track.style.scrollBehavior = "smooth";
              track.scrollLeft = i * cardWidth;
              setActiveIdx(i);
            }}
            aria-label={`Diseño ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIdx ? "20px" : "6px",
              height: "6px",
              background:
                i === activeIdx
                  ? "var(--caiena-rose-dark)"
                  : "var(--caiena-champagne)",
            }}
          />
        ))}
      </div>
    </section>
  );
}

const POSE_ORDER = ["garra", "ascendente", "doble", "rocio"] as const;

function CarouselCard({
  style,
  onClick,
  poseIndex,
}: {
  style: CatalogStyle;
  onClick: () => void;
  poseIndex: number;
}) {
  const poseId = POSE_ORDER[poseIndex % 4];
  const variant = style.variants.find((v) => v.baseId === poseId);
  const thumb = variant?.imagePath ?? style.variants[0]?.imagePath ?? style.thumbnailUrl ?? null;

  return (
    <div
      className="flex-none cursor-pointer group"
      style={{ width: "clamp(180px, 22vw, 260px)" }}
      onClick={onClick}
    >
      {/* 2:3 image */}
      <div
        className="overflow-hidden rounded-lg mb-3 transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ aspectRatio: "2/3", background: "var(--caiena-bg2)" }}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={style.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-8 h-8"
              style={{ opacity: 0.3, color: "var(--caiena-rose)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Card info */}
      <p
        className="text-sm font-light mb-1 leading-snug"
        style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          color: "var(--caiena-plum)",
          letterSpacing: "0.04em",
        }}
      >
        {style.name}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {style.badge && (
          <span
            className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{ background: "var(--caiena-rose-dark)", color: "white" }}
          >
            {style.badge}
          </span>
        )}
        {style.acabado && (
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ color: "var(--caiena-rose)" }}
          >
            {style.acabado}
          </span>
        )}
      </div>
    </div>
  );
}

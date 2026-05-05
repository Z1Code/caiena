"use client";

import { useRef, useState } from "react";

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

// Approximate px per card (width + gap) for duration calc
const CARD_PX = 245;
const SPEED_PX_S = 38;

const POSE_ORDER = ["garra", "ascendente", "doble", "rocio"] as const;

export function NailCarousel({ styles, onSelect }: Props) {
  const [paused, setPaused] = useState(false);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (styles.length === 0) return null;

  // Duplicate content so the seamless loop works: animate translateX(0 → -50%)
  const doubled = [...styles, ...styles];
  const duration = (styles.length * CARD_PX) / SPEED_PX_S; // seconds

  const handleTouchStart = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    setPaused(true);
  };
  const handleTouchEnd = () => {
    touchTimerRef.current = setTimeout(() => setPaused(false), 1800);
  };

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex gap-4"
        style={{
          width: "max-content",
          animation: `scrollCarousel ${duration}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
          willChange: "transform",
        }}
      >
        {doubled.map((style, i) => (
          <CarouselCard
            key={`${style.id}-${i}`}
            style={style}
            poseIndex={i}
            onClick={() => onSelect?.(style)}
          />
        ))}
      </div>
    </div>
  );
}

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
      className="flex-none cursor-pointer group relative overflow-hidden rounded-3xl transition-transform duration-300 group-hover:scale-[1.02]"
      style={{ width: "clamp(180px, 22vw, 260px)", aspectRatio: "2/3", background: "var(--caiena-bg)" }}
      onClick={onClick}
    >
      {/* Image */}
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={style.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
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

      {/* Bottom text overlay — always visible inside the card */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)" }}
      >
        <p
          className="text-white text-sm font-light leading-snug truncate"
          style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            letterSpacing: "0.04em",
          }}
        >
          {style.name}
        </p>
        {(style.badge || style.acabado) && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {style.badge && (
              <span
                className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full"
                style={{ background: "rgba(183,110,121,0.8)", color: "white" }}
              >
                {style.badge}
              </span>
            )}
            {style.acabado && (
              <span className="text-[9px] tracking-widest uppercase text-white/60">
                {style.acabado}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";

const NICHES = [
  { id: 3,  img: "/catalog-preview/3/garra.jpg",  name: "Flores Preservadas" },
  { id: 4,  img: "/catalog-preview/4/garra.jpg",  name: "Nude Dorado" },
  { id: 5,  img: "/catalog-preview/5/garra.jpg",  name: "Salvia & Ópalo" },
  { id: 6,  img: "/catalog-preview/6/garra.jpg",  name: "Azul & Oro" },
  { id: 7,  img: "/catalog-preview/7/garra.jpg",  name: "Cerezas & Escarcha" },
  { id: 8,  img: "/catalog-preview/8/garra.jpg",  name: "Francesa Dorada" },
  { id: 9,  img: "/catalog-preview/9/garra.jpg",  name: "Francesa Almendra" },
  { id: 10, img: "/catalog-preview/10/garra.jpg", name: "Francesa Carey" },
];

export default function DemoRoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<typeof NICHES[0] | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  // Mouse parallax — raw values
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-smoothed for organic camera feel
  const springX = useSpring(rawX, { stiffness: 35, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 35, damping: 22 });

  // Map to subtle rotation (like AP's camera parallax)
  const rotateY = useTransform(springX, [-0.5, 0.5], [6, -6]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [-4, 4]);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className="bg-[#06000a] min-h-screen overflow-hidden"
      style={{ perspective: "1100px" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Ambient background glow ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 38%, rgba(183,110,121,0.18) 0%, transparent 70%)",
        }}
      />

      {/* ── 3D Scene — whole room rotates with mouse ── */}
      <motion.div
        className="relative w-full h-screen"
        style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
      >

        {/* ── Back wall / cabinet ── */}
        <div
          className="absolute"
          style={{
            top: "6%", left: "9%", right: "9%", bottom: "14%",
            background: "linear-gradient(175deg, #180a10 0%, #0c0006 55%, #06000a 100%)",
            transform: "translateZ(-90px)",
            transformStyle: "preserve-3d",
            border: "1px solid rgba(183,110,121,0.1)",
            boxShadow:
              "inset 0 0 120px rgba(183,110,121,0.06), 0 0 60px rgba(0,0,0,0.8)",
          }}
        >
          {/* Cabinet top molding glow */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: "40px",
              background:
                "linear-gradient(to bottom, rgba(183,110,121,0.18), transparent)",
              borderBottom: "1px solid rgba(183,110,121,0.15)",
            }}
          />

          {/* Vertical dividers */}
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="absolute top-[12%] bottom-[4%]"
              style={{
                left: `calc(${n * 25}% - 0.5px)`,
                width: "1px",
                background:
                  "linear-gradient(to bottom, transparent, rgba(183,110,121,0.12), transparent)",
              }}
            />
          ))}

          {/* Horizontal shelf divider */}
          <div
            className="absolute left-[3%] right-[3%]"
            style={{
              top: "53%",
              height: "1px",
              background:
                "linear-gradient(to right, transparent, rgba(183,110,121,0.2), transparent)",
            }}
          />

          {/* ── Niche grid — 4×2 ── */}
          <div
            className="absolute grid gap-3"
            style={{
              inset: "12% 3% 4% 3%",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridTemplateRows: "repeat(2, 1fr)",
            }}
          >
            {NICHES.map((niche, i) => (
              <NicheCard
                key={niche.id}
                niche={niche}
                index={i}
                isHovered={hovered === niche.id}
                onHover={() => setHovered(niche.id)}
                onLeave={() => setHovered(null)}
                onClick={() => setSelected(niche)}
              />
            ))}
          </div>
        </div>

        {/* ── Side walls ── */}
        <Wall side="left" />
        <Wall side="right" />

        {/* ── Floor ── */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "18%",
            background: "linear-gradient(to bottom, #06000a 0%, #120008 80%)",
            transform: "rotateX(58deg)",
            transformOrigin: "bottom center",
          }}
        />

        {/* ── Ceiling light strip ── */}
        <div
          className="absolute"
          style={{
            top: "5%",
            left: "18%",
            right: "18%",
            height: "2px",
            background:
              "linear-gradient(to right, transparent, rgba(183,110,121,0.9), transparent)",
            filter: "blur(4px)",
            boxShadow: "0 0 24px rgba(183,110,121,0.6)",
          }}
        />

        {/* ── Corner pillars ── */}
        <Pillar side="left" />
        <Pillar side="right" />

        {/* ── CTA — centered at bottom ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 pointer-events-none z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-4 pointer-events-auto"
          >
            <p className="text-[9px] text-[#b76e79]/50 tracking-[0.6em] uppercase">
              Nail Art Studio · Leander, TX
            </p>
            <h1
              className="text-6xl sm:text-8xl font-light italic text-white leading-none"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                textShadow: "0 0 80px rgba(183,110,121,0.5)",
              }}
            >
              Caiena
            </h1>
            <a
              href="/reservar"
              className="inline-block mt-1 px-10 py-3 rounded-full text-[10px] tracking-[0.25em] uppercase border border-[#b76e79]/55 text-[#b76e79] hover:bg-[#b76e79] hover:text-white transition-all duration-300"
            >
              Agendar cita
            </a>
          </motion.div>
        </div>

      </motion.div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-72 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-[2/3] relative">
                <Image
                  src={selected.img}
                  alt={selected.name}
                  fill
                  className="object-cover"
                  sizes="288px"
                />
              </div>
              <div className="bg-[#1a0810] p-5 space-y-3">
                <p
                  className="text-white font-light text-base"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {selected.name}
                </p>
                <a
                  href="/reservar"
                  className="block text-center py-2.5 rounded-full bg-[#b76e79] text-white text-[10px] tracking-widest uppercase hover:bg-[#8c4f5c] transition-colors"
                >
                  Agendar este estilo
                </a>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 text-white/60 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Niche card — entrance + float + hover ────────────────────────────────────
function NicheCard({
  niche, index, isHovered, onHover, onLeave, onClick,
}: {
  niche: typeof NICHES[0];
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    // Entrance wrapper
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.25 + index * 0.09,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative"
    >
      {/* Float wrapper — each item bobs at a different rhythm */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{
          duration: 3.5 + (index % 4) * 0.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.35,
        }}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={onClick}
        className="relative cursor-pointer h-full"
        style={{
          background: "linear-gradient(180deg, #1c0c14 0%, #0d0008 100%)",
          border: `1px solid ${
            isHovered ? "rgba(183,110,121,0.55)" : "rgba(183,110,121,0.12)"
          }`,
          boxShadow: isHovered
            ? "0 0 35px rgba(183,110,121,0.32), inset 0 0 20px rgba(183,110,121,0.1)"
            : "inset 0 0 14px rgba(0,0,0,0.9)",
          transition: "box-shadow 0.4s, border-color 0.4s",
          minHeight: "120px",
        }}
      >
        {/* Top niche lighting */}
        <div
          className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(183,110,121,0.14), transparent)",
          }}
        />

        {/* Nail image */}
        <div className="absolute inset-0">
          <Image
            src={niche.img}
            alt={niche.name}
            fill
            className="object-cover"
            sizes="160px"
            style={{
              filter: isHovered
                ? "brightness(1.15) saturate(1.1)"
                : "brightness(0.65) saturate(0.85)",
              transition: "filter 0.4s",
            }}
          />
        </div>

        {/* Bottom name label — slides in on hover */}
        <motion.div
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 6 }}
          transition={{ duration: 0.25 }}
          className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88), transparent)",
          }}
        >
          <p className="text-white/90 text-[8px] tracking-widest uppercase text-center truncate">
            {niche.name}
          </p>
        </motion.div>

        {/* Hover corner icon */}
        <motion.div
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full border border-white/50 flex items-center justify-center"
        >
          <span className="text-white text-[9px]">+</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Side wall ────────────────────────────────────────────────────────────────
function Wall({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div
      className="absolute top-0 bottom-0"
      style={{
        [isLeft ? "left" : "right"]: 0,
        width: "12%",
        background: isLeft
          ? "linear-gradient(to right, #040002, #100007)"
          : "linear-gradient(to left, #040002, #100007)",
        transform: `rotateY(${isLeft ? 52 : -52}deg)`,
        transformOrigin: isLeft ? "left center" : "right center",
        [isLeft ? "borderRight" : "borderLeft"]:
          "1px solid rgba(183,110,121,0.07)",
      }}
    />
  );
}

// ── Corner pillar ────────────────────────────────────────────────────────────
function Pillar({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div
      className="absolute top-0 bottom-0"
      style={{
        [isLeft ? "left" : "right"]: "8%",
        width: "20px",
        background: isLeft
          ? "linear-gradient(to right, #040002, rgba(183,110,121,0.1), transparent)"
          : "linear-gradient(to left, #040002, rgba(183,110,121,0.1), transparent)",
      }}
    />
  );
}

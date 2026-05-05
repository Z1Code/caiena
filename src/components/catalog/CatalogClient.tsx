"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NailCarousel, type CatalogStyle } from "./NailCarousel";
import { DesignOverlay } from "./DesignOverlay";

const CHIPS = [
  { label: "Todos",       value: "" },
  { label: "French",      value: "french" },
  { label: "Nail Art",    value: "nail_art" },
  { label: "Floral",      value: "floral" },
  { label: "Glitter",     value: "glitter_foil" },
  { label: "Ombre",       value: "ombre" },
  { label: "Minimalista", value: "minimalista" },
  { label: "Chrome",      value: "chrome" },
  { label: "Sólido",      value: "solid" },
  { label: "Geométrico",  value: "geometrico" },
];

function ChipScroll({
  active,
  onSelect,
  counts,
}: {
  active: string;
  onSelect: (v: string) => void;
  counts: Record<string, number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragged = useRef(false);

  // Only show chips that have at least 1 style (or "Todos")
  const visible = CHIPS.filter((c) => c.value === "" || (counts[c.value] ?? 0) > 0);

  return (
    <div
      ref={ref}
      onMouseDown={(e) => {
        dragged.current = false;
        startX.current = e.pageX - (ref.current?.offsetLeft ?? 0);
        scrollLeft.current = ref.current?.scrollLeft ?? 0;
      }}
      onMouseMove={(e) => {
        if (!e.buttons) return;
        dragged.current = true;
        const x = e.pageX - (ref.current?.offsetLeft ?? 0);
        if (ref.current) ref.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5;
      }}
      className="flex gap-2 overflow-x-auto cursor-grab active:cursor-grabbing select-none"
      style={{ scrollbarWidth: "none" }}
    >
      {visible.map((chip) => {
        const isActive = active === chip.value;
        return (
          <motion.button
            key={chip.value}
            whileTap={{ scale: 0.93 }}
            onClick={() => { if (!dragged.current) onSelect(chip.value); }}
            className={`relative flex-shrink-0 px-5 py-2 rounded-full text-xs tracking-[0.08em] uppercase transition-colors duration-300 border font-medium ${
              isActive
                ? "bg-[#3A1020] text-white border-[#3A1020]"
                : "border-[#dcc8bc] text-[#8c6854] hover:border-[#b8907a] hover:text-[#3A1020]"
            }`}
          >
            {chip.label}
            {chip.value !== "" && (
              <span className={`ml-1.5 text-[9px] ${isActive ? "opacity-60" : "opacity-40"}`}>
                {counts[chip.value] ?? 0}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

interface Props {
  styles: CatalogStyle[];
}

export function CatalogClient({ styles }: Props) {
  const [activeChip, setActiveChip] = useState("");
  const [selected, setSelected] = useState<CatalogStyle | null>(null);

  // Count styles per estilo
  const counts = styles.reduce<Record<string, number>>((acc, s) => {
    if (s.estilo) acc[s.estilo] = (acc[s.estilo] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = activeChip === ""
    ? styles
    : styles.filter((s) => s.estilo === activeChip);

  return (
    <>
      <section className="relative pt-8 pb-16 overflow-hidden px-4 sm:px-6" style={{ background: "var(--caiena-bg2)" }}>
        <div className="max-w-7xl mx-auto">
          {/* Header + chips — aligned to carousel card edges */}
          <div className="mb-8 space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <p
                  className="text-xs tracking-[0.4em] uppercase mb-2"
                  style={{ color: "var(--caiena-rose-dark)" }}
                >
                  Colección
                </p>
                <h2
                  className="text-4xl sm:text-5xl font-light italic"
                  style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "var(--caiena-plum)" }}
                >
                  Nuestros Diseños
                </h2>
              </div>
              <a
                href="/estilos"
                className="hidden sm:flex items-center gap-1.5 text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-colors"
                style={{ borderColor: "var(--caiena-rose-dark)", color: "var(--caiena-rose-dark)" }}
              >
                Ver todos
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Chip scroll */}
            <ChipScroll active={activeChip} onSelect={setActiveChip} counts={counts} />
          </div>

          {/* Carousel — same width as hero card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChip}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <NailCarousel styles={filtered} onSelect={setSelected} />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {selected && (
        <DesignOverlay style={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";

// ─── Real Caiena data ──────────────────────────────────────────────────────────

const nailStyles = [
  { id: 3,  name: "Flores Preservadas",     img: "/catalog-preview/3/garra.jpg",  tag: "Floral" },
  { id: 4,  name: "Nude Dorado",            img: "/catalog-preview/4/garra.jpg",  tag: "Nail Art" },
  { id: 5,  name: "Salvia & Ópalo",         img: "/catalog-preview/5/garra.jpg",  tag: "Glitter" },
  { id: 6,  name: "Azul & Oro",             img: "/catalog-preview/6/garra.jpg",  tag: "Nail Art" },
  { id: 7,  name: "Cerezas & Escarcha",     img: "/catalog-preview/7/garra.jpg",  tag: "Glitter" },
  { id: 8,  name: "Francesa Dorada",        img: "/catalog-preview/8/garra.jpg",  tag: "French" },
  { id: 9,  name: "Francesa Almendra",      img: "/catalog-preview/9/garra.jpg",  tag: "French" },
  { id: 10, name: "Francesa Carey",         img: "/catalog-preview/10/garra.jpg", tag: "French" },
  { id: 11, name: "Carey & Oro",            img: "/catalog-preview/11/garra.jpg", tag: "French" },
  { id: 12, name: "Lunares Café",           img: "/catalog-preview/12/garra.jpg", tag: "Nail Art" },
  { id: 13, name: "Nude Elegante",          img: "/catalog-preview/13/garra.jpg", tag: "Sólido" },
  { id: 14, name: "Café & Puntos Dorados",  img: "/catalog-preview/14/garra.jpg", tag: "Nail Art" },
  { id: 15, name: "Negra Lunares",          img: "/catalog-preview/15/garra.jpg", tag: "Nail Art" },
  { id: 16, name: "Estelar & Floral",       img: "/catalog-preview/16/garra.jpg", tag: "Nail Art" },
  { id: 17, name: "Invierno Rosado",        img: "/catalog-preview/17/garra.jpg", tag: "Glitter" },
  { id: 18, name: "Nude & Lazos",           img: "/catalog-preview/18/garra.jpg", tag: "Nail Art" },
  { id: 19, name: "Acentos Dorados",        img: "/catalog-preview/19/garra.jpg", tag: "Nail Art" },
  { id: 20, name: "Navideña Burdeos",       img: "/catalog-preview/20/garra.jpg", tag: "Nail Art" },
  { id: 21, name: "Burdeos & Blanca",       img: "/catalog-preview/21/garra.jpg", tag: "Nail Art" },
  { id: 22, name: "Cerezas & Perlas",       img: "/catalog-preview/22/garra.jpg", tag: "Nail Art" },
];

const chipFilters = ["Todos", "French", "Nail Art", "Floral", "Glitter", "Sólido", "Ombre", "Chrome"];

// ─── 1. MARQUEE ────────────────────────────────────────────────────────────────
function Marquee() {
  const text = "CAIENA BEAUTY NAILS · ARTE EN TUS UÑAS · LEANDER, TEXAS · HOME STUDIO · ";
  const repeated = text.repeat(4);
  return (
    <div className="overflow-hidden border-y border-[#1a1215]/10 py-4 bg-[#1a1215]">
      <motion.div
        className="flex whitespace-nowrap text-[11px] tracking-[0.3em] uppercase text-white/70 font-light"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <span>{repeated}</span>
        <span>{repeated}</span>
      </motion.div>
    </div>
  );
}

// ─── 2. CHIP SCROLL ────────────────────────────────────────────────────────────
function ChipScroll({ active, onSelect }: { active: string; onSelect: (c: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragged = useRef(false);

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
        if (ref.current) ref.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.4;
      }}
      className="flex gap-2 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing select-none"
      style={{ scrollbarWidth: "none" }}
    >
      {chipFilters.map((chip) => (
        <motion.button
          key={chip}
          whileTap={{ scale: 0.94 }}
          onClick={() => { if (!dragged.current) onSelect(chip); }}
          className={`flex-shrink-0 px-5 py-2 rounded-full text-xs tracking-[0.08em] uppercase transition-all duration-300 border font-medium ${
            active === chip
              ? "bg-[#1a1215] text-white border-[#1a1215]"
              : "border-[#dcc8bc] text-[#8c6854] hover:border-[#b8907a]"
          }`}
        >
          {chip}
        </motion.button>
      ))}
    </div>
  );
}

// ─── 3. NAIL CARD GRID ─────────────────────────────────────────────────────────
function NailCard({ style, index }: { style: typeof nailStyles[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image src={style.img} alt={style.name} fill className="object-cover" sizes="300px" />

      {/* tag chip */}
      <div className="absolute top-2.5 left-2.5 bg-white/80 backdrop-blur-sm text-[10px] text-[#8c6854] px-2.5 py-1 rounded-full font-medium tracking-wide">
        {style.tag}
      </div>

      {/* hover overlay */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-gradient-to-t from-[#1a1215]/80 via-[#1a1215]/20 to-transparent flex items-end p-4"
      >
        <div>
          <p className="text-white text-sm font-medium leading-tight">{style.name}</p>
          <motion.button
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: hovered ? 0 : 8, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="mt-2 bg-white text-[#1a1215] text-xs px-4 py-1.5 rounded-full font-medium hover:bg-[#b8907a] hover:text-white transition-colors"
          >
            Agendar este estilo
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 4. PARALLAX HERO STRIP ────────────────────────────────────────────────────
function ParallaxStrip() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <div ref={ref} className="relative h-[480px] rounded-3xl overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-[-15%]">
        <Image
          src="/caiena_instagram.png"
          alt="Caiena nail art"
          fill
          className="object-cover"
          sizes="800px"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1215]/70 via-transparent to-transparent" />
      <div className="absolute bottom-8 left-8 right-8">
        <TextReveal />
      </div>
    </div>
  );
}

// ─── 5. TEXT REVEAL ────────────────────────────────────────────────────────────
function TextReveal() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const words = "Donde cada uña es una obra de arte".split(" ");

  return (
    <div ref={ref} className="flex flex-wrap gap-x-2.5 gap-y-1">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-3xl text-white italic"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

// ─── 6. LOADER ─────────────────────────────────────────────────────────────────
function LoaderDemo() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);

  const run = () => {
    if (running) return;
    setRunning(true); setDone(false); setCount(0);
    let n = 0;
    const iv = setInterval(() => {
      n += Math.floor(Math.random() * 7) + 2;
      if (n >= 100) { n = 100; clearInterval(iv); setDone(true); setRunning(false); }
      setCount(n);
    }, 55);
  };

  return (
    <div className="bg-[#1a1215] rounded-3xl p-10 space-y-6">
      <div className="relative h-px bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[#b8907a] rounded-full"
          animate={{ width: `${count}%` }}
          transition={{ duration: 0.08 }}
        />
      </div>
      <div className="flex items-end justify-between">
        <motion.span className="font-serif text-7xl text-white tabular-nums leading-none">
          {String(count).padStart(2, "0")}
        </motion.span>
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-right"
            >
              <p className="text-[#b8907a] text-xs tracking-[0.3em] uppercase">Caiena</p>
              <p className="text-white/40 text-[10px] tracking-widest">Beauty Nails</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button
        onClick={run}
        className="text-xs text-white/40 border border-white/10 px-5 py-2 rounded-full hover:border-[#b8907a] hover:text-[#b8907a] transition-colors"
      >
        {running ? "Cargando..." : "▶ Reproducir"}
      </button>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function DemoAnimaciones() {
  const [activeChip, setActiveChip] = useState("Todos");

  const filtered = activeChip === "Todos"
    ? nailStyles
    : nailStyles.filter((s) => s.tag === activeChip);

  return (
    <div className="bg-[#faf8f6] min-h-screen">

      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-12">
        <p className="text-[10px] text-[#a09490] tracking-[0.4em] uppercase mb-3">Demo de animaciones</p>
        <h1 className="font-serif text-5xl font-semibold text-[#1a1215] leading-tight">
          Caiena<br /><span className="italic text-[#b8907a]">en movimiento</span>
        </h1>
      </div>

      {/* 01 — Marquee */}
      <section className="mb-20">
        <SectionLabel n="01" title="Marquee" note="Texto infinito entre secciones" />
        <Marquee />
      </section>

      <div className="max-w-3xl mx-auto px-6 space-y-20">

        {/* 02 — Chip scroll + catálogo real */}
        <section>
          <SectionLabel n="02" title="Chip scroll + catálogo" note="Arrastra los chips · hover en cards para ver el botón" />
          <div className="space-y-5">
            <ChipScroll active={activeChip} onSelect={setActiveChip} />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChip}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {filtered.slice(0, 8).map((s, i) => (
                  <NailCard key={s.id} style={s} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* 03 — Parallax + text reveal */}
        <section>
          <SectionLabel n="03" title="Parallax + text reveal" note="Scrollea para ver el efecto" />
          <ParallaxStrip />
        </section>

        {/* 04 — Loader */}
        <section>
          <SectionLabel n="04" title="Loader de entrada" note="Como ever.co.id antes de mostrar el contenido" />
          <LoaderDemo />
        </section>

      </div>

      <div className="h-32" />
    </div>
  );
}

function SectionLabel({ n, title, note }: { n: string; title: string; note: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 mb-5 flex items-baseline gap-4">
      <span className="text-xs text-[#a09490]/50 font-mono">{n}</span>
      <div>
        <h2 className="text-sm font-medium text-[#1a1215] uppercase tracking-widest">{title}</h2>
        <p className="text-xs text-[#a09490] mt-0.5">{note}</p>
      </div>
    </div>
  );
}

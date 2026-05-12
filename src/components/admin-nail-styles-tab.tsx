"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdminT } from "@/components/admin-locale-context";

interface Variant {
  baseId: string;
  imagePath: string;
  status: string;
}

interface VariantLightboxProps {
  styleName: string;
  variants: Variant[];
  onClose: () => void;
}

const BASE_LABELS: Record<string, string> = {
  garra: "Garra",
  ascendente: "Ascendente",
  doble: "Doble",
  rocio: "Rocío",
};

function VariantLightbox({ styleName, variants, onClose }: VariantLightboxProps) {
  const [idx, setIdx] = useState(0);
  const done = variants.filter((v) => v.status === "done" && v.imagePath);

  const prev = useCallback(() => setIdx((i) => (i - 1 + done.length) % done.length), [done.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % done.length), [done.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  if (done.length === 0) return null;
  const current = done[idx];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={onClose}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {done.length > 1 && (
        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors" onClick={(e) => { e.stopPropagation(); prev(); }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      <div className="flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img src={current.imagePath} alt={BASE_LABELS[current.baseId] ?? current.baseId} className="max-h-[78vh] max-w-[70vw] object-contain rounded-xl shadow-2xl" />
        <p className="text-white/60 text-sm tracking-wide">{styleName} — {BASE_LABELS[current.baseId] ?? current.baseId}</p>
        {done.length > 1 && (
          <div className="flex gap-2">
            {done.map((v, i) => (
              <button key={v.baseId} onClick={() => setIdx(i)} className={`px-3 py-1 rounded-full text-xs transition-colors ${i === idx ? "bg-white text-black font-medium" : "bg-white/20 text-white/70 hover:bg-white/30"}`}>
                {BASE_LABELS[v.baseId] ?? v.baseId}
              </button>
            ))}
          </div>
        )}
      </div>
      {done.length > 1 && (
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors" onClick={(e) => { e.stopPropagation(); next(); }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>
  );
}

interface NailStyle {
  id: number;
  name: string;
  description: string;
  category: string;
  prompt: string;
  thumbnailUrl: string | null;
  color: string | null;
  acabado: string | null;
  forma: string | null;
  estilo: string | null;
  badge: string | null;
  discountPercent: number | null;
  active: boolean;
  sortOrder: number;
}

const CATEGORIES = [
  { value: "french", label: "French" },
  { value: "gel", label: "Gel" },
  { value: "chrome", label: "Chrome" },
  { value: "nail_art", label: "Nail Art" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "seasonal", label: "Temporada" },
];

const BADGE_COLORS: Record<string, string> = {
  Nuevo: "bg-emerald-500",
  Promo: "bg-red-500",
  Temporada: "bg-purple-500",
  Popular: "bg-orange-500",
  Limitado: "bg-gray-800",
};

export function AdminNailStylesTab() {
  const t = useAdminT();
  const [styles, setStyles] = useState<NailStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ name: string; variants: Variant[] } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/nail-styles");
    setStyles(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openVariants(style: NailStyle) {
    const res = await fetch(`/api/admin/nail-styles/${style.id}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.variants?.length) return;
    setLightbox({ name: style.name, variants: data.variants });
  }

  async function handleToggleActive(style: NailStyle) {
    await fetch(`/api/admin/nail-styles/${style.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !style.active }),
    });
    await load();
  }

  async function handleDelete(style: NailStyle) {
    if (!confirm(t.nailStyles.deleteConfirm.replace("{name}", style.name))) return;
    await fetch(`/api/admin/nail-styles/${style.id}`, { method: "DELETE" });
    await load();
  }

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">{t.nailStyles.loading}</div>;

  return (
    <div className="space-y-6">
      {lightbox && (
        <VariantLightbox
          styleName={lightbox.name}
          variants={lightbox.variants}
          onClose={() => setLightbox(null)}
        />
      )}

      <h2 className="text-lg font-medium text-gray-800">{t.nailStyles.title}</h2>

      {/* ── Styles grid ──────────────────────────────────────────────────── */}
      {styles.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          {t.nailStyles.noData}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {styles.map((style) => (
            <div
              key={style.id}
              className={`border rounded-xl overflow-hidden ${
                style.active ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              {/* Thumbnail — click to see variants */}
              <div
                className="relative aspect-square bg-gray-50 cursor-pointer group"
                onClick={() => openVariants(style)}
                title="Ver variantes"
              >
                {style.thumbnailUrl ? (
                  <img src={style.thumbnailUrl} alt={style.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs flex-col gap-2">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                    </svg>
                  </div>
                )}
                {style.badge && (
                  <div className={`absolute top-2 left-2 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_COLORS[style.badge] ?? "bg-gray-600"}`}>
                    {style.badge}
                  </div>
                )}
                {style.discountPercent != null && style.discountPercent > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{style.discountPercent}%
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
              </div>

              {/* Info row */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{style.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <span className="inline-block px-2 py-0.5 bg-accent/10 text-accent-dark text-[10px] rounded-full">
                        {CATEGORIES.find((c) => c.value === style.category)?.label ?? style.category}
                      </span>
                      {style.color && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">{style.color}</span>
                      )}
                      {style.acabado && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">{style.acabado}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Edit → navigate to dedicated page */}
                    <Link
                      href={`/dashboard/catalog/${style.id}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      title={t.nailStyles.edit}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleToggleActive(style)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      title={style.active ? t.nailStyles.deactivate : t.nailStyles.activate}
                    >
                      {style.active ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><circle cx="12" cy="12" r="3" strokeWidth={2} />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(style)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title={t.nailStyles.delete}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                {style.description && (
                  <p className="text-xs text-gray-400 mt-1.5 truncate">{style.description}</p>
                )}
                {!style.thumbnailUrl && (
                  <p className="text-[10px] text-amber-500 mt-1">{t.nailStyles.noPhotoWarning}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

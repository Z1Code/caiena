"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminT } from "@/components/admin-locale-context";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Variant {
  id: number;
  styleId: number;
  baseId: string;
  imagePath: string;
  status: string;
}

interface NailStyleDetail {
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
  variants: Variant[];
}

interface StyleForm {
  name: string;
  description: string;
  category: string;
  prompt: string;
  color: string;
  acabado: string;
  forma: string;
  estilo: string;
  badge: string;
  discountPercent: string;
  sortOrder: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "french", label: "French" },
  { value: "gel", label: "Gel" },
  { value: "chrome", label: "Chrome" },
  { value: "nail_art", label: "Nail Art" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "seasonal", label: "Temporada" },
];

const ESTILOS = [
  { value: "", label: "Sin especificar" },
  { value: "french", label: "French" },
  { value: "solid", label: "Sólido" },
  { value: "floral", label: "Floral" },
  { value: "geometrico", label: "Geométrico" },
  { value: "glitter_foil", label: "Glitter / Foil" },
  { value: "ombre", label: "Ombre" },
  { value: "chrome", label: "Chrome" },
  { value: "minimalista", label: "Minimalista" },
  { value: "nail_art", label: "Nail Art" },
];

const COLORES = [
  { value: "", label: "Sin especificar" },
  { value: "nude", label: "Nude" }, { value: "rosa", label: "Rosa" },
  { value: "rojo", label: "Rojo" }, { value: "burdeos", label: "Burdeos" },
  { value: "blanco", label: "Blanco" }, { value: "negro", label: "Negro" },
  { value: "azul", label: "Azul" }, { value: "verde", label: "Verde" },
  { value: "morado", label: "Morado" }, { value: "lila", label: "Lila" },
  { value: "coral", label: "Coral" }, { value: "amarillo", label: "Amarillo" },
  { value: "naranja", label: "Naranja" }, { value: "multicolor", label: "Multicolor" },
  { value: "plateado", label: "Plateado" }, { value: "dorado", label: "Dorado" },
  { value: "gris", label: "Gris" }, { value: "beige", label: "Beige" },
];

const ACABADOS = [
  { value: "", label: "Sin especificar" },
  { value: "glossy", label: "Glossy" }, { value: "matte", label: "Matte" },
  { value: "chrome", label: "Chrome" }, { value: "glitter", label: "Glitter" },
  { value: "satinado", label: "Satinado" },
];

const FORMAS = [
  { value: "", label: "Sin especificar" },
  { value: "cuadrada", label: "Cuadrada" }, { value: "redonda", label: "Redonda" },
  { value: "oval", label: "Oval" }, { value: "almendra", label: "Almendra" },
  { value: "stiletto", label: "Stiletto" }, { value: "coffin", label: "Coffin" },
];

const BADGES = [
  { value: "", label: "Sin badge" },
  { value: "Nuevo", label: "Nuevo" },
  { value: "Promo", label: "Promo" },
  { value: "Temporada", label: "Temporada" },
  { value: "Popular", label: "Popular" },
  { value: "Limitado", label: "Limitado" },
];

const BADGE_COLORS: Record<string, string> = {
  Nuevo: "bg-emerald-500",
  Promo: "bg-red-500",
  Temporada: "bg-purple-500",
  Popular: "bg-orange-500",
  Limitado: "bg-gray-800",
};

const BASE_LABELS: Record<string, string> = {
  garra: "Garra",
  ascendente: "Ascendente",
  doble: "Doble",
  rocio: "Rocío",
};

// ── Lightbox ───────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: { src: string; label: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  const current = images[idx];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Anterior"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div
        className="flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.label}
          className="max-h-[80vh] max-w-[80vw] object-contain rounded-xl shadow-2xl"
        />
        <p className="text-white/60 text-sm tracking-wide">{current.label}</p>
        {images.length > 1 && (
          <div className="flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === idx ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Siguiente"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Image card ─────────────────────────────────────────────────────────────────

function ImageCard({
  src,
  label,
  isMain,
  onZoom,
  onUpload,
  uploading,
}: {
  src: string | null;
  label: string;
  isMain?: boolean;
  onZoom?: () => void;
  onUpload?: () => void;
  uploading?: boolean;
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
      <div className="aspect-[2/3] relative">
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
            </svg>
            <span className="text-xs text-gray-300">Sin imagen</span>
          </div>
        )}

        {/* Hover actions */}
        {src && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onZoom && (
              <button
                onClick={onZoom}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                title="Ver ampliada"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
            )}
            {onUpload && (
              <button
                onClick={onUpload}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                title="Cambiar foto"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}

        {/* No-image upload prompt */}
        {!src && onUpload && (
          <button
            onClick={onUpload}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        )}
      </div>

      {/* Label */}
      <div className="px-2 py-1.5 flex items-center justify-between gap-1">
        <span className="text-[11px] text-gray-500 truncate">{label}</span>
        {isMain && (
          <span className="text-[9px] bg-accent/10 text-accent-dark px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
            Principal
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminDesignDetail({ id }: { id: number }) {
  const t = useAdminT();
  const router = useRouter();

  const [style, setStyle] = useState<NailStyleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<StyleForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: { src: string; label: string }[]; index: number } | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch(`/api/admin/nail-styles/${id}`);
    if (!res.ok) { router.push("/dashboard/catalog"); return; }
    const data: NailStyleDetail = await res.json();
    setStyle(data);
    setForm({
      name: data.name,
      description: data.description,
      category: data.category,
      prompt: data.prompt,
      color: data.color ?? "",
      acabado: data.acabado ?? "",
      forma: data.forma ?? "",
      estilo: data.estilo ?? "",
      badge: data.badge ?? "",
      discountPercent: data.discountPercent != null ? String(data.discountPercent) : "",
      sortOrder: data.sortOrder,
    });
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!form || !style) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountPercent: form.discountPercent !== "" ? parseInt(form.discountPercent) : null,
        color: form.color || null,
        acabado: form.acabado || null,
        forma: form.forma || null,
        estilo: form.estilo || null,
        badge: form.badge || null,
      };
      await fetch(`/api/admin/nail-styles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!style) return;
    await fetch(`/api/admin/nail-styles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !style.active }),
    });
    await load();
  }

  async function handleDelete() {
    if (!style) return;
    if (!confirm(t.nailStyles.deleteConfirm.replace("{name}", style.name))) return;
    await fetch(`/api/admin/nail-styles/${id}`, { method: "DELETE" });
    router.push("/dashboard/catalog");
  }

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setUploadingThumb(true);
    const formData = new FormData();
    formData.append("image", e.target.files[0]);
    await fetch(`/api/admin/nail-styles/${id}/image`, { method: "POST", body: formData });
    e.target.value = "";
    setUploadingThumb(false);
    await load();
  }

  // Build images array for lightbox
  function buildImages(s: NailStyleDetail): { src: string; label: string }[] {
    const imgs: { src: string; label: string }[] = [];
    if (s.thumbnailUrl) imgs.push({ src: s.thumbnailUrl, label: "Miniatura (principal)" });
    for (const base of ["garra", "ascendente", "doble", "rocio"]) {
      const v = s.variants.find((v) => v.baseId === base);
      if (v?.imagePath && v.status === "done") {
        imgs.push({ src: v.imagePath, label: BASE_LABELS[base] ?? base });
      }
    }
    return imgs;
  }

  function openLightbox(index: number) {
    if (!style) return;
    const imgs = buildImages(style);
    if (imgs.length === 0) return;
    setLightbox({ images: imgs, index: Math.min(index, imgs.length - 1) });
  }

  if (loading || !style || !form) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm">{t.nailStyles.loading}</div>
    );
  }

  const BASE_ORDER = ["garra", "ascendente", "doble", "rocio"];
  const allImages = buildImages(style);
  // Index of each image in the lightbox array
  const thumbLightboxIdx = style.thumbnailUrl ? 0 : -1;
  const variantLightboxIdx = (baseId: string) => {
    let i = style.thumbnailUrl ? 1 : 0;
    for (const b of BASE_ORDER) {
      const v = style.variants.find((v) => v.baseId === b);
      if (v?.imagePath && v.status === "done") {
        if (b === baseId) return i;
        i++;
      }
    }
    return -1;
  };

  return (
    <>
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />

      <div className="max-w-3xl space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/catalog")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.nailStyles.title}
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{style.name}</span>

          <div className="ml-auto flex items-center gap-2">
            {/* Active toggle */}
            <button
              onClick={handleToggleActive}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                style.active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {style.active ? "● Activo" : "○ Inactivo"}
            </button>
            {/* Delete */}
            <button
              onClick={handleDelete}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
            >
              {t.nailStyles.delete}
            </button>
          </div>
        </div>

        {/* ── Image gallery ── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-[0.2em] mb-3">Imágenes</p>
          <div className="grid grid-cols-5 gap-3">
            {/* Thumbnail slot */}
            <ImageCard
              src={style.thumbnailUrl}
              label="Miniatura"
              isMain
              onZoom={thumbLightboxIdx >= 0 ? () => openLightbox(thumbLightboxIdx) : undefined}
              onUpload={() => thumbInputRef.current?.click()}
              uploading={uploadingThumb}
            />

            {/* 4 pose variants */}
            {BASE_ORDER.map((base) => {
              const variant = style.variants.find((v) => v.baseId === base);
              const lbIdx = variantLightboxIdx(base);
              return (
                <ImageCard
                  key={base}
                  src={variant?.status === "done" ? variant.imagePath : null}
                  label={BASE_LABELS[base] ?? base}
                  onZoom={lbIdx >= 0 ? () => openLightbox(lbIdx) : undefined}
                />
              );
            })}
          </div>
          {allImages.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Clic en una imagen para ampliarla · Hover sobre la miniatura para cambiarla
            </p>
          )}
        </div>

        {/* ── Edit form ── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-[0.2em]">Atributos</p>

          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm text-emerald-700">
              ✓ Guardado
            </div>
          )}

          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.name}</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.category}</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.description}</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.style}</label>
              <select value={form.estilo} onChange={(e) => setForm({ ...form, estilo: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {ESTILOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.color}</label>
              <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {COLORES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.finish}</label>
              <select value={form.acabado} onChange={(e) => setForm({ ...form, acabado: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {ACABADOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.shape}</label>
              <select value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {FORMAS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Badge + discount + order */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.badge}</label>
              <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {BADGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.discount}</label>
              <input
                type="number" min={0} max={100}
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.order}</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t.nailStyles.aiPrompt}{" "}
              <span className="text-gray-400 font-normal">({t.nailStyles.aiPromptDesc})</span>
            </label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.prompt}
              className="px-6 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-dark disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? t.nailStyles.saving : t.nailStyles.save}
            </button>
            <button
              onClick={() => router.push("/dashboard/catalog")}
              className="px-6 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              {t.nailStyles.cancel}
            </button>
          </div>
        </div>

        {/* Badge preview */}
        {(style.badge || style.discountPercent) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Vista previa:</span>
            {style.badge && (
              <span className={`text-white text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_COLORS[style.badge] ?? "bg-gray-600"}`}>
                {style.badge}
              </span>
            )}
            {style.discountPercent != null && style.discountPercent > 0 && (
              <span className="text-white text-xs font-bold px-2.5 py-1 rounded-full bg-red-500">
                -{style.discountPercent}%
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

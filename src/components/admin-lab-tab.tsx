"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAdminT } from "@/components/admin-locale-context";

// ── Shared types & constants ───────────────────────────────────────────────────

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

const EMPTY_FORM: StyleForm = {
  name: "", description: "", category: "french", prompt: "",
  color: "", acabado: "", forma: "", estilo: "",
  badge: "", discountPercent: "", sortOrder: 0,
};

const BADGE_COLORS: Record<string, string> = {
  Nuevo: "bg-emerald-500",
  Promo: "bg-red-500",
  Temporada: "bg-purple-500",
  Popular: "bg-orange-500",
  Limitado: "bg-gray-800",
};

// ── Root component ─────────────────────────────────────────────────────────────

export function AdminLabTab() {
  const t = useAdminT();
  const [activeSection, setActiveSection] = useState<"generate" | "manual">("generate");
  const [recentStyles, setRecentStyles] = useState<NailStyle[]>([]);

  const loadRecent = useCallback(async () => {
    const res = await fetch("/api/admin/nail-styles");
    if (!res.ok) return;
    const all: NailStyle[] = await res.json();
    // Sort by id desc to get most recently created first
    setRecentStyles(all.sort((a, b) => b.id - a.id).slice(0, 5));
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  return (
    <div className="space-y-8">
      {/* ── Creation panel ── */}
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveSection("generate")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === "generate"
                ? "bg-white text-foreground shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ✦ {t.nailStyles.generateVariants}
          </button>
          <button
            onClick={() => setActiveSection("manual")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === "manual"
                ? "bg-white text-foreground shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            + {t.nailStyles.addNew}
          </button>
        </div>

        {activeSection === "generate" ? (
          <div className="p-5 rounded-2xl border border-accent-light/30 bg-cream/30">
            <GenerateVariantsPanel onCreated={loadRecent} />
          </div>
        ) : (
          <ManualCreateForm onCreated={loadRecent} />
        )}
      </div>

      {/* ── Recent designs strip ── */}
      <RecentStrip styles={recentStyles} onReload={loadRecent} />
    </div>
  );
}

// ── Recent designs strip ───────────────────────────────────────────────────────

function RecentStrip({ styles, onReload }: { styles: NailStyle[]; onReload: () => void }) {
  const t = useAdminT();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StyleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function startEdit(style: NailStyle) {
    if (editingId === style.id) { setEditingId(null); return; }
    setEditingId(style.id);
    setForm({
      name: style.name,
      description: style.description,
      category: style.category,
      prompt: style.prompt,
      color: style.color ?? "",
      acabado: style.acabado ?? "",
      forma: style.forma ?? "",
      estilo: style.estilo ?? "",
      badge: style.badge ?? "",
      discountPercent: style.discountPercent != null ? String(style.discountPercent) : "",
      sortOrder: style.sortOrder,
    });
  }

  async function handleSave() {
    if (!editingId) return;
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
      await fetch(`/api/admin/nail-styles/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditingId(null);
      onReload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(style: NailStyle) {
    if (!confirm(t.nailStyles.deleteConfirm.replace("{name}", style.name))) return;
    await fetch(`/api/admin/nail-styles/${style.id}`, { method: "DELETE" });
    if (editingId === style.id) setEditingId(null);
    onReload();
  }

  if (styles.length === 0) return null;

  const editingStyle = styles.find((s) => s.id === editingId) ?? null;

  return (
    <div>
      {/* Divider + heading */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gray-100" />
        <p className="text-xs font-medium text-gray-400 uppercase tracking-[0.2em]">Últimos diseños</p>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      {/* 5-column grid */}
      <div className="grid grid-cols-5 gap-3">
        {styles.map((style) => {
          const isActive = editingId === style.id;
          return (
            <div
              key={style.id}
              className={`rounded-xl border overflow-hidden transition-all ${
                isActive
                  ? "border-accent/50 ring-2 ring-accent/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-[2/3] bg-gray-50 cursor-pointer group"
                onClick={() => startEdit(style)}
              >
                {style.thumbnailUrl ? (
                  <img src={style.thumbnailUrl} alt={style.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                    </svg>
                  </div>
                )}
                {style.badge && (
                  <div className={`absolute top-1.5 left-1.5 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${BADGE_COLORS[style.badge] ?? "bg-gray-600"}`}>
                    {style.badge}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </div>
              </div>

              {/* Name + actions */}
              <div className="px-2 py-2">
                <p className="text-xs font-medium text-gray-700 truncate leading-tight mb-2">{style.name}</p>
                <div className="flex items-center justify-between gap-0.5">
                  <button
                    onClick={() => startEdit(style)}
                    className={`p-1.5 rounded transition-colors ${isActive ? "bg-accent/10 text-accent" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
                    title={t.nailStyles.edit}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(style)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title={t.nailStyles.delete}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline edit form — appears below the strip when a card is selected */}
      {editingStyle && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700 text-sm">
              {t.nailStyles.editTitle}: <span className="text-accent-dark">{editingStyle.name}</span>
            </h3>
            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.name}</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.category}</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.style}</label>
              <select value={form.estilo} onChange={(e) => setForm({ ...form, estilo: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {ESTILOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.color}</label>
              <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {COLORES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.finish}</label>
              <select value={form.acabado} onChange={(e) => setForm({ ...form, acabado: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {ACABADOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.shape}</label>
              <select value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {FORMAS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Badge + discount + order */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.badge}</label>
              <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {BADGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.discount}</label>
              <input type="number" min={0} max={100} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.order}</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
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
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.prompt}
              className="px-5 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-dark disabled:opacity-50 transition-colors"
            >
              {saving ? t.nailStyles.saving : t.nailStyles.save}
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="px-5 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              {t.nailStyles.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI generation panel ────────────────────────────────────────────────────────

function GenerateVariantsPanel({ onCreated }: { onCreated: () => void }) {
  const t = useAdminT();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [variants, setVariants] = useState<Array<{ baseId: string; imagePath: string; status: string }>>([]);
  const [styleId, setStyleId] = useState<number | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setName("");
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    setClassifying(true);
    try {
      const fd = new FormData();
      fd.append("image", f);
      const res = await fetch("/api/admin/nail-styles/classify", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.name) setName(data.name);
      }
    } catch { /* user can type manually */ }
    finally { setClassifying(false); }
  };

  const handleGenerate = async () => {
    if (!file) return;
    setStatus("generating");
    setVariants([]);
    const form = new FormData();
    form.append("image", file);
    form.append("name", name || file.name.replace(/\.\w+$/, ""));
    const res = await fetch("/api/admin/catalog/generate", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) { setStatus("error"); return; }
    setStyleId(data.styleId);
    setStatus(data.status === "done" ? "done" : "error");
    const statusRes = await fetch(`/api/admin/catalog/status/${data.jobId}`);
    const statusData = await statusRes.json();
    setVariants(statusData.variants ?? []);
  };

  const handlePublish = async () => {
    if (!styleId) return;
    setPublishLoading(true);
    await fetch(`/api/admin/catalog/publish/${styleId}`, { method: "POST" });
    setPublishLoading(false);
    alert("Diseño publicado. Aparecerá en el carrusel.");
    setStatus("idle"); setFile(null); setPreview(null); setName(""); setVariants([]); setStyleId(null);
    onCreated();
  };

  const BASES_LABELS: Record<string, string> = {
    garra: t.nailStyles.baseGarra,
    ascendente: t.nailStyles.baseAscendente,
    doble: t.nailStyles.baseDoble,
    rocio: t.nailStyles.baseRocio,
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-start">
        <div
          className="w-24 h-32 rounded-xl border-2 border-dashed border-accent-light/40 flex items-center justify-center cursor-pointer hover:border-accent/40 transition-colors overflow-hidden flex-shrink-0"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? <img src={preview} alt="preview" className="w-full h-full object-cover" /> : (
            <span className="text-xs text-foreground/30 text-center px-1">+ {t.nailStyles.referencePhoto}</span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder={classifying ? t.nailStyles.analyzingDesign : t.nailStyles.designName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={classifying}
              className="w-full text-sm border border-accent-light/30 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-accent/50 disabled:bg-gray-50 disabled:text-gray-400 pr-8"
            />
            {classifying && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!file || status === "generating"}
            className="w-full bg-foreground text-white text-sm py-2.5 rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {status === "generating" ? t.nailStyles.generating : t.nailStyles.generate4}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {status === "done" && variants.length > 0 && (
        <div>
          <p className="text-xs text-foreground/50 mb-3">{t.nailStyles.generated}</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {variants.filter(v => v.status === "done" && v.imagePath).map((v) => (
              <div key={v.baseId} className="space-y-1">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-cream">
                  <img src={v.imagePath} alt={v.baseId} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-center text-foreground/50">{BASES_LABELS[v.baseId] ?? v.baseId}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handlePublish}
            disabled={publishLoading}
            className="w-full bg-emerald-600 text-white text-sm py-2.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {publishLoading ? t.nailStyles.publishing : t.nailStyles.publish}
          </button>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">{t.nailStyles.errorGenerating}</p>
      )}
    </div>
  );
}

// ── Manual create form ─────────────────────────────────────────────────────────

function ManualCreateForm({ onCreated }: { onCreated: () => void }) {
  const t = useAdminT();
  const [form, setForm] = useState<StyleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [createPreview, setCreatePreview] = useState<string | null>(null);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [classifying, setClassifying] = useState(false);
  const classifyInputRef = useRef<HTMLInputElement>(null);

  async function handleClassifyImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCreatePreview(reader.result as string);
    reader.readAsDataURL(file);
    setCreateImageFile(file);
    setClassifying(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/nail-styles/classify", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm((f) => ({
        ...f,
        name: data.name ?? f.name,
        description: data.description ?? f.description,
        category: data.category ?? f.category,
        estilo: data.estilo ?? f.estilo,
        color: data.color ?? f.color,
        acabado: data.acabado ?? f.acabado,
        forma: data.forma ?? f.forma,
        prompt: data.prompt ?? f.prompt,
      }));
    } catch { /* user fills manually */ }
    finally { setClassifying(false); e.target.value = ""; }
  }

  async function handleSave() {
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
      const res = await fetch("/api/admin/nail-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      if (createImageFile && created.id) {
        const imgForm = new FormData();
        imgForm.append("image", createImageFile);
        await fetch(`/api/admin/nail-styles/${created.id}/image`, { method: "POST", body: imgForm });
      }
      setForm(EMPTY_FORM);
      setCreatePreview(null);
      setCreateImageFile(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-5">
      <input ref={classifyInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleClassifyImage} className="hidden" />

      {done && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">
          ✓ Diseño creado — aparece abajo en la tira de últimos diseños.
        </div>
      )}

      {/* Image upload + AI classify */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          {t.nailStyles.uploadPhoto}{" "}
          <span className="text-gray-400 font-normal">— {t.nailStyles.aiAutoDetect}</span>
        </p>
        <div className="flex items-start gap-4">
          <div
            className="relative w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer flex-shrink-0 hover:border-accent/50 transition-colors"
            onClick={() => classifyInputRef.current?.click()}
          >
            {createPreview ? (
              <img src={createPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-300">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.023 10.9" />
                </svg>
                <span className="text-[10px]">{t.nailStyles.selectFile}</span>
              </div>
            )}
            {classifying && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                <span className="text-[10px] text-accent-dark">{t.nailStyles.analyzing}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400 pt-2 space-y-1">
            <p>{t.nailStyles.step1}</p>
            <p>{t.nailStyles.step2}</p>
            <p>{t.nailStyles.step3}</p>
            <p>{t.nailStyles.step4}</p>
          </div>
        </div>
      </div>

      {/* Name + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.name}</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="French Clásico Nude"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.category}</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.description}</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          placeholder="Elegante y atemporal"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.style}</label>
          <select value={form.estilo} onChange={(e) => setForm({ ...form, estilo: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {ESTILOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.color}</label>
          <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {COLORES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.finish}</label>
          <select value={form.acabado} onChange={(e) => setForm({ ...form, acabado: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {ACABADOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.shape}</label>
          <select value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {FORMAS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.badge}</label>
          <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {BADGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.discount}</label>
          <input type="number" min={0} max={100} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.nailStyles.order}</label>
          <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t.nailStyles.aiPrompt}{" "}
          <span className="text-gray-400 font-normal">({t.nailStyles.aiPromptDesc})</span>
        </label>
        <textarea
          value={form.prompt}
          onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="classic french manicure with white tips and natural pink base, clean crisp lines, glossy finish"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.prompt}
          className="px-5 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-dark disabled:opacity-50 transition-colors"
        >
          {saving ? t.nailStyles.saving : t.nailStyles.save}
        </button>
        <button
          onClick={() => { setForm(EMPTY_FORM); setCreatePreview(null); setCreateImageFile(null); }}
          className="px-5 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          {t.nailStyles.cancel}
        </button>
      </div>
    </div>
  );
}

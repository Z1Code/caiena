"use client";

import { useState, useEffect, useRef } from "react";

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

export function AdminNailStylesTab() {
  const [styles, setStyles] = useState<NailStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NailStyle | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<StyleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Image upload for existing styles
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [imageTargetId, setImageTargetId] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Create-form image + auto-classify
  const [createPreview, setCreatePreview] = useState<string | null>(null);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [classifying, setClassifying] = useState(false);
  const classifyInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/nail-styles");
    setStyles(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // ─── Classify a new image (create flow) ────────────────────────────────────

  async function handleClassifyImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setCreatePreview(reader.result as string);
    reader.readAsDataURL(file);
    setCreateImageFile(file);

    setClassifying(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/nail-styles/classify", { method: "POST", body: formData });
      if (!res.ok) throw new Error("classify failed");
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
    } catch {
      // If classify fails, user fills manually — no error shown
    } finally {
      setClassifying(false);
      e.target.value = "";
    }
  }

  // ─── Save (create or edit) ─────────────────────────────────────────────────

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

      if (editing) {
        await fetch(`/api/admin/nail-styles/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create style first, then upload image if provided
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
      }

      cancelForm();
      await load();
    } finally {
      setSaving(false);
    }
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
    if (!confirm(`¿Eliminar "${style.name}"?`)) return;
    await fetch(`/api/admin/nail-styles/${style.id}`, { method: "DELETE" });
    await load();
  }

  function startEdit(style: NailStyle) {
    setEditing(style);
    setCreating(false);
    setCreatePreview(null);
    setCreateImageFile(null);
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

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setCreatePreview(null);
    setCreateImageFile(null);
    setForm(EMPTY_FORM);
  }

  function cancelForm() {
    setEditing(null);
    setCreating(false);
    setCreatePreview(null);
    setCreateImageFile(null);
    setForm(EMPTY_FORM);
  }

  // ─── Image upload for existing styles ──────────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!imageTargetId || !e.target.files?.[0]) return;
    setUploadingId(imageTargetId);
    const formData = new FormData();
    formData.append("image", e.target.files[0]);
    await fetch(`/api/admin/nail-styles/${imageTargetId}/image`, { method: "POST", body: formData });
    setUploadingId(null);
    setImageTargetId(null);
    e.target.value = "";
    await load();
  }

  function triggerImageUpload(id: number) {
    setImageTargetId(id);
    imageInputRef.current?.click();
  }

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>;

  const showForm = creating || editing !== null;

  return (
    <div className="space-y-6">
      {/* ── Generate from reference image ── */}
      <div className="mb-8 p-5 rounded-2xl border border-accent-light/30 bg-cream/30">
        <h3 className="font-serif text-base font-semibold mb-4">Generar variantes desde foto de referencia</h3>
        <GenerateVariantsPanel />
      </div>

      {/* Hidden inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <input ref={classifyInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleClassifyImage} className="hidden" />

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Diseños de Uñas</h2>
        {!showForm && (
          <button
            onClick={startCreate}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-dark transition-colors"
          >
            + Nuevo Diseño
          </button>
        )}
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-5">
          <h3 className="font-medium text-gray-700">{editing ? "Editar Diseño" : "Nuevo Diseño"}</h3>

          {/* Image + auto-classify (create only) */}
          {!editing && (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Foto del diseño{" "}
                <span className="text-gray-400 font-normal">— la IA detectará automáticamente los campos</span>
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
                      <span className="text-[10px]">Subir foto</span>
                    </div>
                  )}
                  {classifying && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      <span className="text-[10px] text-accent-dark">Analizando...</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 pt-2 space-y-1">
                  <p>1. Sube una foto del diseño</p>
                  <p>2. La IA detecta estilo, color, acabado y forma</p>
                  <p>3. Revisa y ajusta los campos</p>
                  <p>4. Guarda</p>
                </div>
              </div>
            </div>
          )}

          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="French Clásico Nude"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descripción</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Elegante y atemporal"
            />
          </div>

          {/* Classification fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estilo</label>
              <select
                value={form.estilo}
                onChange={(e) => setForm({ ...form, estilo: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {ESTILOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color</label>
              <select
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {COLORES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Acabado</label>
              <select
                value={form.acabado}
                onChange={(e) => setForm({ ...form, acabado: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {ACABADOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Forma</label>
              <select
                value={form.forma}
                onChange={(e) => setForm({ ...form, forma: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {FORMAS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Badge + discount + sortOrder */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Badge</label>
              <select
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {BADGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descuento (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Orden</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Prompt para IA{" "}
              <span className="text-gray-400 font-normal">(descripción técnica en inglés — usada cuando no hay foto)</span>
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
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={cancelForm}
              className="px-5 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Styles grid ──────────────────────────────────────────────────── */}
      {styles.length === 0 && !showForm ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          No hay diseños todavía. Crea el primero.
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
              {/* Thumbnail — click to replace */}
              <div
                className="relative aspect-square bg-gray-50 cursor-pointer group"
                onClick={() => triggerImageUpload(style.id)}
                title="Clic para cambiar foto"
              >
                {style.thumbnailUrl ? (
                  <img src={style.thumbnailUrl} alt={style.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs flex-col gap-2">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                    </svg>
                    Subir foto
                  </div>
                )}
                {/* Badge overlay */}
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
                  <span className="text-white text-xs font-medium">
                    {uploadingId === style.id ? "Subiendo..." : "Cambiar foto"}
                  </span>
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
                    <button
                      onClick={() => startEdit(style)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Editar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(style)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      title={style.active ? "Desactivar" : "Activar"}
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
                      title="Eliminar"
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
                  <p className="text-[10px] text-amber-500 mt-1">Sin foto — se usará prompt de texto</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  Nuevo: "bg-emerald-500",
  Promo: "bg-red-500",
  Temporada: "bg-purple-500",
  Popular: "bg-orange-500",
  Limitado: "bg-gray-800",
};

function GenerateVariantsPanel() {
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

    // Auto-classify to get name
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
    // Fetch variants
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
  };

  const BASES_LABELS: Record<string, string> = { garra: "Garra", ascendente: "Ascendente", doble: "Doble", rocio: "Rocío" };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-start">
        <div
          className="w-24 h-32 rounded-xl border-2 border-dashed border-accent-light/40 flex items-center justify-center cursor-pointer hover:border-accent/40 transition-colors overflow-hidden flex-shrink-0"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? <img src={preview} alt="preview" className="w-full h-full object-cover" /> : (
            <span className="text-xs text-foreground/30 text-center px-1">+ Foto de referencia</span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder={classifying ? "Analizando diseño..." : "Nombre del diseño"}
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
            {status === "generating" ? "Generando variantes..." : "Generar 4 variantes"}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {status === "done" && variants.length > 0 && (
        <div>
          <p className="text-xs text-foreground/50 mb-3">Variantes generadas:</p>
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
            {publishLoading ? "Publicando..." : "Publicar diseño en el carrusel"}
          </button>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">Error generando variantes. Intenta de nuevo.</p>
      )}
    </div>
  );
}

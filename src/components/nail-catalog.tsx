"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

interface NailStyle {
  id: number;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  color: string | null;
  acabado: string | null;
  forma: string | null;
  estilo: string | null;
  badge: string | null;
  discountPercent: number | null;
}

interface Filters {
  estilo: string;
  color: string;
  acabado: string;
  forma: string;
}

// ─── Filter options ────────────────────────────────────────────────────────────

const ESTILOS = [
  { value: "", label: "Todos los estilos" },
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
  { value: "", label: "Todos los colores" },
  { value: "nude", label: "Nude / Beige", swatch: "#E8CDB5" },
  { value: "rosa", label: "Rosa", swatch: "#F4A7B9" },
  { value: "rojo", label: "Rojo", swatch: "#C0392B" },
  { value: "burdeos", label: "Burdeos / Vino", swatch: "#6D1A36" },
  { value: "blanco", label: "Blanco", swatch: "#F5F5F5" },
  { value: "negro", label: "Negro", swatch: "#1C1C1C" },
  { value: "lila", label: "Lila / Morado", swatch: "#B39DDB" },
  { value: "azul", label: "Azul", swatch: "#5C9BD6" },
  { value: "verde", label: "Verde", swatch: "#66BB6A" },
  { value: "coral", label: "Coral / Naranja", swatch: "#FF7043" },
  { value: "multicolor", label: "Multicolor", swatch: "linear-gradient(135deg,#f06,#f90,#0cf)" },
];

const ACABADOS = [
  { value: "", label: "Cualquier acabado" },
  { value: "glossy", label: "Glossy" },
  { value: "matte", label: "Matte" },
  { value: "chrome", label: "Chrome / Espejo" },
  { value: "glitter", label: "Glitter" },
  { value: "satinado", label: "Satinado" },
];

const FORMAS = [
  { value: "", label: "Cualquier forma" },
  { value: "cuadrada", label: "Cuadrada" },
  { value: "redonda", label: "Redonda" },
  { value: "oval", label: "Oval" },
  { value: "almendra", label: "Almendra" },
  { value: "stiletto", label: "Stiletto" },
  { value: "coffin", label: "Coffin" },
];

const EMPTY_FILTERS: Filters = { estilo: "", color: "", acabado: "", forma: "" };

// ─── Component ────────────────────────────────────────────────────────────────

export function NailCatalog() {
  const { data: session } = useSession();
  const [styles, setStyles] = useState<NailStyle[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NailStyle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hand photo state
  const [handPhotoUrl, setHandPhotoUrl] = useState<string | null>(null);
  const [handPhotoLocal, setHandPhotoLocal] = useState<string | null>(null); // base64 for anonymous
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  const handFileRef = useRef<HTMLInputElement>(null);
  const handUploadRef = useRef<HTMLInputElement>(null);

  // Load hand photo from profile (logged-in users)
  useEffect(() => {
    if (!session) return;
    fetch("/api/profile/hand-photo")
      .then((r) => r.json())
      .then((d) => { if (d.handPhotoUrl) setHandPhotoUrl(d.handPhotoUrl); })
      .catch(() => {});
  }, [session]);

  // Fetch styles whenever filters change
  const fetchStyles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.estilo)  params.set("estilo", filters.estilo);
    if (filters.color)   params.set("color", filters.color);
    if (filters.acabado) params.set("acabado", filters.acabado);
    if (filters.forma)   params.set("forma", filters.forma);
    const res = await fetch(`/api/nail-styles?${params}`);
    const data = await res.json();
    setStyles(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchStyles(); }, [fetchStyles]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ─── Hand photo handlers ───────────────────────────────────────────────────

  const handleHandFileLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setHandPhotoLocal(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleHandUploadToProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/profile/hand-photo", { method: "POST", body: form });
    const data = await res.json();
    if (data.handPhotoUrl) setHandPhotoUrl(data.handPhotoUrl);
  };

  const effectiveHandImage = session ? handPhotoUrl : handPhotoLocal;

  // ─── Try-on ───────────────────────────────────────────────────────────────

  const handleTryOn = async (style: NailStyle) => {
    if (!effectiveHandImage) return;
    setTryOnLoading(true);
    setTryOnError("");
    setTryOnResult(null);
    setSelected(style);

    try {
      // For profile photo (URL), fetch and convert to base64
      let imageData = effectiveHandImage;
      if (imageData.startsWith("/")) {
        const resp = await fetch(imageData);
        const blob = await resp.blob();
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const res = await fetch("/api/ai/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, styleId: style.id }),
      });
      const data = await res.json();
      if (!res.ok) { setTryOnError(data.error ?? "Error al generar"); return; }
      setTryOnResult(data.image);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch {
      setTryOnError("Error al generar. Intenta de nuevo.");
    } finally {
      setTryOnLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-cream to-white">

      {/* ── Mobile filter overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-accent-light/20 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-accent-light/20">
          <h2 className="font-serif text-base font-semibold text-foreground">Filtros</h2>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs text-accent hover:text-accent-dark transition-colors"
            >
              Limpiar ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Estilo */}
          <FilterGroup label="Estilo">
            {ESTILOS.map((o) => (
              <FilterOption
                key={o.value}
                label={o.label}
                active={filters.estilo === o.value}
                onClick={() => setFilters((f) => ({ ...f, estilo: o.value }))}
              />
            ))}
          </FilterGroup>

          {/* Color */}
          <FilterGroup label="Color">
            <div className="flex flex-wrap gap-2">
              {COLORES.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFilters((f) => ({ ...f, color: o.value }))}
                  title={o.label}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    filters.color === o.value
                      ? "border-accent scale-110 shadow-sm"
                      : "border-transparent hover:border-accent-light/60"
                  }`}
                  style={
                    o.value === ""
                      ? { background: "conic-gradient(#f06,#f90,#ff0,#0c6,#0cf,#f06)" }
                      : o.swatch?.startsWith("linear")
                      ? { backgroundImage: o.swatch }
                      : { backgroundColor: o.swatch }
                  }
                />
              ))}
            </div>
            {filters.color && (
              <p className="text-xs text-accent mt-1">
                {COLORES.find((c) => c.value === filters.color)?.label}
              </p>
            )}
          </FilterGroup>

          {/* Acabado */}
          <FilterGroup label="Acabado">
            {ACABADOS.map((o) => (
              <FilterOption
                key={o.value}
                label={o.label}
                active={filters.acabado === o.value}
                onClick={() => setFilters((f) => ({ ...f, acabado: o.value }))}
              />
            ))}
          </FilterGroup>

          {/* Forma */}
          <FilterGroup label="Forma de uña">
            {FORMAS.map((o) => (
              <FilterOption
                key={o.value}
                label={o.label}
                active={filters.forma === o.value}
                onClick={() => setFilters((f) => ({ ...f, forma: o.value }))}
              />
            ))}
          </FilterGroup>
        </div>

        {/* ── Hand photo section ── */}
        <div className="border-t border-accent-light/20 p-5 space-y-3">
          <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
            Foto de tu mano
          </p>
          {effectiveHandImage ? (
            <div className="relative">
              <img
                src={effectiveHandImage.startsWith("/") ? effectiveHandImage : effectiveHandImage}
                alt="Tu mano"
                className="w-full aspect-video object-cover rounded-xl border border-accent-light/30"
              />
              <button
                onClick={() => {
                  if (session) handUploadRef.current?.click();
                  else handFileRef.current?.click();
                }}
                className="absolute bottom-2 right-2 bg-white/90 text-xs px-2 py-1 rounded-lg hover:bg-white transition-colors shadow-sm"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (session) handUploadRef.current?.click();
                else handFileRef.current?.click();
              }}
              className="w-full py-3 rounded-xl border-2 border-dashed border-accent-light/40 hover:border-accent/40 text-xs text-foreground/40 hover:text-accent-dark transition-colors"
            >
              + Subir foto de tu mano
            </button>
          )}
          {session ? (
            <p className="text-[10px] text-foreground/30">
              Se guarda en tu perfil para uso futuro
            </p>
          ) : (
            <p className="text-[10px] text-foreground/30">
              Inicia sesión para guardarla en tu perfil
            </p>
          )}
        </div>

        {/* Hidden file inputs */}
        <input ref={handFileRef} type="file" accept="image/*" capture="environment" onChange={handleHandFileLocal} className="hidden" />
        <input ref={handUploadRef} type="file" accept="image/*" capture="environment" onChange={handleHandUploadToProfile} className="hidden" />
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-accent-light/30 rounded-lg text-sm text-foreground/60 hover:border-accent/40 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M10 12h4" />
            </svg>
            Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          <div className="flex-1">
            <p className="text-xs text-foreground/40">
              {loading ? "Buscando..." : `${styles.length} diseño${styles.length !== 1 ? "s" : ""}`}
              {activeFilterCount > 0 && " encontrados"}
            </p>
          </div>

          {!effectiveHandImage && (
            <p className="hidden sm:block text-xs text-accent-dark bg-accent/5 px-3 py-1.5 rounded-full border border-accent/20">
              Sube tu foto para el Try-On →
            </p>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-cream/60 animate-pulse" />
            ))}
          </div>
        ) : styles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-foreground/30 text-sm mb-3">No hay diseños con esos filtros</p>
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs text-accent hover:text-accent-dark transition-colors underline"
            >
              Ver todos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {styles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                hasHand={!!effectiveHandImage}
                isSelected={selected?.id === style.id}
                isTryingOn={tryOnLoading && selected?.id === style.id}
                onTryOn={() => handleTryOn(style)}
                onSelect={() => setSelected(style)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Try-on result modal ─────────────────────────────────────────── */}
      {(tryOnResult || tryOnLoading || tryOnError) && selected && (
        <TryOnModal
          style={selected}
          handImage={effectiveHandImage!}
          result={tryOnResult}
          loading={tryOnLoading}
          error={tryOnError}
          remaining={remaining}
          onClose={() => { setTryOnResult(null); setTryOnError(""); }}
          onRetry={() => handleTryOn(selected)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterOption({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? "bg-accent/10 text-accent-dark font-medium"
          : "text-foreground/60 hover:bg-cream hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

const BADGE_STYLE: Record<string, string> = {
  Nuevo: "bg-emerald-500",
  Promo: "bg-red-500",
  Temporada: "bg-purple-500",
  Popular: "bg-orange-500",
  Limitado: "bg-gray-800",
};

function StyleCard({
  style, hasHand, isSelected, isTryingOn, onTryOn, onSelect,
}: {
  style: NailStyle;
  hasHand: boolean;
  isSelected: boolean;
  isTryingOn: boolean;
  onTryOn: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-2 ring-accent shadow-lg shadow-accent/20" : "ring-1 ring-black/5 hover:ring-accent-light/50"
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      {style.thumbnailUrl ? (
        <img
          src={style.thumbnailUrl}
          alt={style.name}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div className="w-full aspect-square bg-cream/60 flex items-center justify-center">
          <svg className="w-8 h-8 text-accent-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
        </div>
      )}

      {/* Badge chip (top-left) */}
      {style.badge && (
        <div className={`absolute top-2 left-2 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${BADGE_STYLE[style.badge] ?? "bg-gray-700"}`}>
          {style.badge}
        </div>
      )}

      {/* Discount chip (top-right when no selected checkmark) */}
      {!isSelected && style.discountPercent != null && style.discountPercent > 0 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          -{style.discountPercent}%
        </div>
      )}

      {/* Gradient + name */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-8 pb-2.5 px-2.5">
        <p className="text-xs font-medium text-white truncate leading-tight">{style.name}</p>
      </div>

      {/* Try-On button — appears on hover or when selected */}
      {hasHand && (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <div className="absolute inset-0 bg-black/30" />
          <button
            onClick={(e) => { e.stopPropagation(); onTryOn(); }}
            disabled={isTryingOn}
            className="relative z-10 bg-white text-foreground text-xs font-medium px-4 py-2 rounded-full shadow-lg hover:bg-accent hover:text-white transition-colors disabled:opacity-70 flex items-center gap-1.5"
          >
            {isTryingOn ? (
              <>
                <div className="w-3 h-3 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                Probando...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Try-On
              </>
            )}
          </button>
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && !isTryingOn && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}
    </div>
  );
}

function TryOnModal({
  style, handImage, result, loading, error, remaining, onClose, onRetry,
}: {
  style: NailStyle;
  handImage: string;
  result: string | null;
  loading: boolean;
  error: string;
  remaining: number | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-accent-light/20">
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">{style.name}</h3>
            {remaining !== null && (
              <p className="text-xs text-foreground/40 mt-0.5">
                {remaining} prueba{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""} esta hora
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-sm text-foreground/50">Aplicando el diseño a tu mano...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={onRetry} className="text-xs text-accent hover:text-accent-dark transition-colors underline">
                Intentar de nuevo
              </button>
            </div>
          ) : result ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-foreground/40 mb-1.5">Tu mano</p>
                  <img src={handImage} alt="Original" className="rounded-2xl border border-accent-light/20 w-full" />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 mb-1.5">Con {style.name}</p>
                  <img src={result} alt="Preview" className="rounded-2xl border border-accent/30 shadow-md shadow-accent/10 w-full" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <a
                  href="/reservar"
                  className="flex-1 bg-accent text-white py-2.5 rounded-full text-sm text-center hover:bg-accent-dark transition-colors"
                >
                  Reservar este diseño
                </a>
                <button
                  onClick={onRetry}
                  className="px-4 py-2.5 border border-accent/30 text-accent-dark text-sm rounded-full hover:bg-cream transition-colors"
                >
                  Regenerar
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

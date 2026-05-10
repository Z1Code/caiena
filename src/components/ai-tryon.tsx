"use client";

import { useState, useRef, useEffect } from "react";

interface NailStyle {
  id: number;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
}

const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "french", label: "French" },
  { key: "gel", label: "Gel" },
  { key: "chrome", label: "Chrome" },
  { key: "nail_art", label: "Nail Art" },
  { key: "minimal", label: "Minimal" },
  { key: "bold", label: "Bold" },
  { key: "seasonal", label: "Temporada" },
];

export function AITryOn() {
  const [handImage, setHandImage] = useState<string | null>(null);
  const [styles, setStyles] = useState<NailStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<NailStyle | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [customPrompt, setCustomPrompt] = useState("");
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/nail-styles")
      .then((r) => r.json())
      .then((data) => setStyles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen debe ser menor a 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setHandImage(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
    setResultImage(null);
  };

  const filteredStyles =
    activeCategory === "all" ? styles : styles.filter((s) => s.category === activeCategory);

  // Only show category tabs that have styles
  const usedCategories = CATEGORIES.filter(
    (c) => c.key === "all" || styles.some((s) => s.category === c.key)
  );

  const handleGenerate = async () => {
    if (!handImage) { setError("Sube una foto de tu mano primero"); return; }
    if (mode === "catalog" && !selectedStyle) { setError("Selecciona un diseño"); return; }
    if (mode === "custom" && !customPrompt.trim()) { setError("Describe el diseño"); return; }

    setLoading(true);
    setError("");
    setResultImage(null);

    try {
      const body =
        mode === "catalog"
          ? { image: handImage, styleId: selectedStyle!.id }
          : { image: handImage, designPrompt: customPrompt };

      const res = await fetch("/api/ai/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al generar"); return; }
      setResultImage(data.image);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch {
      setError("Error al generar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step 1: Upload hand photo */}
      <div>
        <h3 className="font-serif text-lg font-medium text-foreground mb-3">
          1. Sube una foto de tu mano
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
        {handImage ? (
          <div className="relative w-full max-w-sm">
            <img
              src={handImage}
              alt="Tu mano"
              className="rounded-2xl border border-accent-light/30"
            />
            <button
              onClick={() => { setHandImage(null); setResultImage(null); }}
              className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5 hover:bg-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm aspect-[4/3] rounded-2xl border-2 border-dashed border-accent-light/50 hover:border-accent/50 transition-colors flex flex-col items-center justify-center gap-3 text-foreground/40 hover:text-accent-dark"
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-sm">Toca para subir o tomar foto</span>
          </button>
        )}
      </div>

      {/* Step 2: Choose design */}
      {handImage && (
        <div>
          <h3 className="font-serif text-lg font-medium text-foreground mb-3">
            2. Elige el diseño
          </h3>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            {(["catalog", "custom"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  mode === m
                    ? "bg-accent text-white"
                    : "bg-cream border border-accent-light/30 text-foreground/60 hover:border-accent/40"
                }`}
              >
                {m === "catalog" ? "Catálogo" : "Personalizado"}
              </button>
            ))}
          </div>

          {mode === "catalog" && (
            <>
              {/* Category filter */}
              {usedCategories.length > 1 && (
                <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                  {usedCategories.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setActiveCategory(c.key)}
                      className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                        activeCategory === c.key
                          ? "bg-accent/15 text-accent-dark font-medium border border-accent/30"
                          : "border border-accent-light/20 text-foreground/50 hover:border-accent/30"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              {filteredStyles.length === 0 ? (
                <p className="text-sm text-foreground/40 py-6 text-center">
                  No hay diseños disponibles aún.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredStyles.map((style) => {
                    const selected = selectedStyle?.id === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style)}
                        className={`group relative rounded-2xl overflow-hidden transition-all duration-200 text-left ${
                          selected
                            ? "ring-2 ring-accent shadow-lg shadow-accent/25 scale-[1.02]"
                            : "ring-1 ring-black/5 hover:ring-accent-light/60 hover:scale-[1.01]"
                        }`}
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
                            <svg className="w-8 h-8 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                            </svg>
                          </div>
                        )}

                        {/* Gradient mask + name overlay — always visible */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-6 pb-2.5 px-2.5">
                          <p className="text-xs font-medium text-white leading-tight truncate">
                            {style.name}
                          </p>
                          {style.description && (
                            <p className="text-[10px] text-white/60 truncate mt-0.5">
                              {style.description}
                            </p>
                          )}
                        </div>

                        {/* Selected checkmark badge */}
                        {selected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-md">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {mode === "custom" && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe el diseño que quieres... ej: uñas rosa pastel con flores delicadas y acabado glossy"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors resize-none"
            />
          )}
        </div>
      )}

      {/* Remaining requests */}
      {remaining !== null && (
        <p className="text-xs text-foreground/40 text-center">
          {remaining} prueba{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""} esta hora
        </p>
      )}

      {/* Generate button */}
      {handImage && (
        <button
          onClick={handleGenerate}
          disabled={
            loading ||
            (mode === "catalog" && !selectedStyle) ||
            (mode === "custom" && !customPrompt.trim())
          }
          className="w-full bg-accent text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generando preview...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Probar Diseño con IA
            </>
          )}
        </button>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result comparison */}
      {resultImage && (
        <div>
          <h3 className="font-serif text-lg font-medium text-foreground mb-3">
            Tu Preview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/40 mb-2">Original</p>
              <img
                src={handImage!}
                alt="Original"
                className="rounded-2xl border border-accent-light/30"
              />
            </div>
            <div>
              <p className="text-xs text-foreground/40 mb-2">
                Con {selectedStyle?.name ?? "diseño personalizado"}
              </p>
              <img
                src={resultImage}
                alt="Preview"
                className="rounded-2xl border border-accent/30 shadow-lg shadow-accent/10"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <a
              href="/reservar"
              className="flex-1 bg-accent text-white py-3 rounded-full text-sm text-center hover:bg-accent-dark transition-colors"
            >
              Reservar Este Diseño
            </a>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 rounded-full text-sm border border-accent/40 text-accent-dark hover:bg-cream transition-colors"
            >
              Regenerar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

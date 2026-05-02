"use client";

import { useState } from "react";

const styles = ["Gel", "Acrilico", "Polygel", "Chrome", "Matte", "Glitter", "French", "Ombre"];
const shapes = ["Coffin", "Almond", "Stiletto", "Square", "Oval", "Round"];
const colors = ["Rosa", "Rojo", "Negro", "Blanco", "Nude", "Dorado", "Azul", "Morado", "Verde"];

export function NailGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [shape, setShape] = useState("");
  const [color, setColor] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt && !style) {
      setError("Describe el diseno o elige un estilo");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, shape, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages((prev) => [data.image, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-foreground/60 mb-1.5">
          Describe tu diseno ideal
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="ej: unas rosa pastel con mariposas 3D y cristales pequenos..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-foreground/40 mb-2">Estilo</label>
          <div className="flex flex-wrap gap-1.5">
            {styles.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(style === s ? "" : s)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  style === s
                    ? "bg-accent text-white"
                    : "bg-cream border border-accent-light/30 text-foreground/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-foreground/40 mb-2">Forma</label>
          <div className="flex flex-wrap gap-1.5">
            {shapes.map((s) => (
              <button
                key={s}
                onClick={() => setShape(shape === s ? "" : s)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  shape === s
                    ? "bg-accent text-white"
                    : "bg-cream border border-accent-light/30 text-foreground/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-foreground/40 mb-2">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(color === c ? "" : c)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  color === c
                    ? "bg-accent text-white"
                    : "bg-cream border border-accent-light/30 text-foreground/60"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || (!prompt && !style)}
        className="w-full bg-accent text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creando diseno...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Generar Diseno
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div>
          <h3 className="font-serif text-lg font-medium text-foreground mb-3">
            Disenos Generados
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img}
                  alt={`Diseno ${i + 1}`}
                  className="rounded-2xl border border-accent-light/30 w-full"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 rounded-2xl transition-colors flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                  <a
                    href="/reservar"
                    className="bg-accent text-white px-4 py-2 rounded-full text-xs hover:bg-accent-dark transition-colors"
                  >
                    Reservar Este Diseno
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

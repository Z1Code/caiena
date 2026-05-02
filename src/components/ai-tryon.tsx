"use client";

import { useState, useRef } from "react";

const presetDesigns = [
  { label: "Rosa Clasico", prompt: "classic soft pink gel nails with glossy finish" },
  { label: "Rojo Elegante", prompt: "deep red gel nails with glossy finish, elegant and classic" },
  { label: "French Tips", prompt: "classic french manicure with white tips and natural pink base, clean lines" },
  { label: "Ombre Rosa", prompt: "pink to white ombre gradient nails with glossy finish" },
  { label: "Negro Matte", prompt: "matte black nails with a sophisticated velvet finish" },
  { label: "Chrome Dorado", prompt: "gold chrome mirror nails, highly reflective metallic finish" },
  { label: "Nail Art Floral", prompt: "white base nails with delicate hand-painted pink and purple flowers" },
  { label: "Glitter Festivo", prompt: "silver and gold glitter nails, sparkly party nails" },
];

export function AITryOn() {
  const [handImage, setHandImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"preset" | "custom" | "reference">("preset");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen debe ser menor a 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

  const handleGenerate = async () => {
    if (!handImage) {
      setError("Sube una foto de tu mano primero");
      return;
    }

    setLoading(true);
    setError("");
    setResultImage(null);

    const designPrompt =
      mode === "preset"
        ? presetDesigns.find((d) => d.label === selectedPreset)?.prompt
        : mode === "custom"
        ? customPrompt
        : undefined;

    try {
      const res = await fetch("/api/ai/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: handImage,
          designPrompt,
          referenceImage: mode === "reference" ? referenceImage : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
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
          onChange={(e) => handleImageUpload(e, setHandImage)}
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
              onClick={() => {
                setHandImage(null);
                setResultImage(null);
              }}
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
            2. Elige el diseno
          </h3>
          <div className="flex gap-2 mb-4">
            {([
              { key: "preset" as const, label: "Estilos" },
              { key: "custom" as const, label: "Describir" },
              { key: "reference" as const, label: "Imagen Ref." },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  mode === key
                    ? "bg-accent text-white"
                    : "bg-cream border border-accent-light/30 text-foreground/60 hover:border-accent/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "preset" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetDesigns.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setSelectedPreset(d.label)}
                  className={`p-3 rounded-xl text-sm text-center transition-all ${
                    selectedPreset === d.label
                      ? "bg-accent text-white"
                      : "border border-accent-light/30 text-foreground/60 hover:border-accent/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {mode === "custom" && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe el diseno que quieres... ej: unas rosa pastel con flores delicadas y acabado glossy"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-accent-light/40 bg-cream/30 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/60 transition-colors resize-none"
            />
          )}

          {mode === "reference" && (
            <div>
              <input
                ref={refInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setReferenceImage)}
                className="hidden"
              />
              {referenceImage ? (
                <div className="relative w-48">
                  <img
                    src={referenceImage}
                    alt="Referencia"
                    className="rounded-xl border border-accent-light/30"
                  />
                  <button
                    onClick={() => setReferenceImage(null)}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => refInputRef.current?.click()}
                  className="w-48 aspect-square rounded-xl border-2 border-dashed border-accent-light/50 hover:border-accent/50 flex flex-col items-center justify-center gap-2 text-foreground/40 text-sm"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                  </svg>
                  Subir imagen de referencia
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Generate button */}
      {handImage && (
        <button
          onClick={handleGenerate}
          disabled={
            loading ||
            (mode === "preset" && !selectedPreset) ||
            (mode === "custom" && !customPrompt) ||
            (mode === "reference" && !referenceImage)
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
              Probar Diseno con IA
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
              <p className="text-xs text-foreground/40 mb-2">Con diseno</p>
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
              Reservar Este Diseno
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

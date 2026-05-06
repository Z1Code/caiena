"use client";

import { useEffect, useState } from "react";

interface Settings {
  show_gallery: boolean;
  show_about:   boolean;
}

const LABELS: Record<keyof Settings, { title: string; desc: string }> = {
  show_gallery: { title: "Galería",     desc: "Sección de galería de fotos en la página principal" },
  show_about:   { title: "La Artista",  desc: "Sección 'Sobre mí / Roxanna' en la página principal" },
};

export function AdminSiteTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-settings").then(r => r.json()).then(setSettings);
  }, []);

  async function toggle(key: keyof Settings) {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(true);
    await fetch("/api/admin/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
    setSaving(false);
  }

  if (!settings) return <div className="p-8 text-sm text-gray-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Secciones del sitio</h2>
        {saving && <span className="text-xs text-gray-400">Guardando…</span>}
      </div>
      <div className="space-y-3">
        {(Object.keys(LABELS) as (keyof Settings)[]).map(key => (
          <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">{LABELS[key].title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{LABELS[key].desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                settings[key] ? "bg-accent" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  settings[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400">Los cambios se aplican de inmediato en el sitio.</p>
    </div>
  );
}

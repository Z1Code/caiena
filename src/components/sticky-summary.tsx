"use client";

import { useState } from "react";

interface SelectedService {
  id: number;
  name: string;
}

interface StickySummaryProps {
  selected: SelectedService[];
  onRemove: (id: number) => void;
}

export function StickySummary({ selected, onRemove }: StickySummaryProps) {
  const [loading, setLoading] = useState(false);

  if (selected.length === 0) return null;

  async function handleWhatsApp() {
    if (loading) return;
    setLoading(true);
    try {
      const ids = selected.map((s) => s.id).join(",");
      const res = await fetch(`/api/booking/wa-link-multi?svcIds=${ids}`);
      const data = await res.json();
      if (data.waUrl) {
        window.open(data.waUrl, "_blank");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${selected.length > 0 ? "translate-y-0" : "translate-y-full"}
      `}
    >
      <div className="glass-card border-t border-white/60 shadow-2xl shadow-accent/10 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Selected chips */}
          <div className="flex-1 flex flex-wrap gap-2">
            {selected.map((svc) => (
              <span
                key={svc.id}
                className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent-dark text-xs px-3 py-1.5 rounded-full"
              >
                {svc.name}
                <button
                  onClick={() => onRemove(svc.id)}
                  className="text-accent/50 hover:text-accent transition-colors ml-0.5"
                  aria-label={`Remove ${svc.name}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <button
            onClick={handleWhatsApp}
            disabled={loading}
            className="flex-shrink-0 flex items-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white px-6 py-3.5 rounded-2xl font-medium text-sm tracking-wide shadow-lg shadow-[#25D366]/25 transition-all active:scale-95 disabled:opacity-70"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {loading ? "Generando enlace..." : `Reservar por WhatsApp (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

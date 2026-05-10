"use client";

import { useState, useEffect, useCallback } from "react";

interface ServiceCardProps {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  images: string[];
  selected: boolean;
  onToggle: (id: number) => void;
  index: number;
}

export function ServiceCard({
  id,
  name,
  description,
  durationMinutes,
  images,
  selected,
  onToggle,
  index,
}: ServiceCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const hasImages = images.length > 0;

  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentImage((i) => (i + 1) % images.length);
    }
  }, [images.length]);

  // Auto-cycle every 3s, pause on hover handled by CSS
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(nextImage, 3000);
    return () => clearInterval(interval);
  }, [images.length, nextImage]);

  return (
    <div
      onClick={() => onToggle(id)}
      style={{ animationDelay: `${index * 80}ms` }}
      className={`
        relative rounded-3xl overflow-hidden cursor-pointer select-none
        transition-all duration-300
        ${selected
          ? "ring-2 ring-accent scale-[1.02] shadow-xl shadow-accent/15"
          : "hover:scale-[1.01] hover:shadow-lg hover:shadow-accent/10"}
        glass-card
        animate-fade-up
      `}
    >
      {/* Image carousel */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blush/40 to-accent-light/20 group">
        {hasImages ? (
          <>
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${name} ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  i === currentImage ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            {/* Carousel dots */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentImage ? "bg-white w-3" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full">
          {durationMinutes} min
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-medium text-foreground truncate">
              {name}
            </h3>
            <p className="text-xs text-foreground/45 leading-relaxed mt-1 line-clamp-2">
              {description}
            </p>
          </div>

          {/* Select toggle */}
          <div
            className={`
              flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center
              transition-all duration-200
              ${selected
                ? "bg-accent border-accent text-white scale-110"
                : "border-accent-light/50 bg-white/50"}
            `}
          >
            {selected && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Selected overlay accent */}
      {selected && (
        <div className="absolute inset-0 rounded-3xl ring-2 ring-accent pointer-events-none" />
      )}
    </div>
  );
}

import Image from "next/image";
import { GalleryBookButton, GalleryWhatsAppButton } from "@/components/gallery-book-button";
import { ScrollReveal, ScrollRevealGroup } from "@/components/scroll-reveal";

const galleryItems = [
  {
    caption: "Nail Art Creativo",
    src: "/caiena_instagram.png",
    isReal: true,
    span: "md:col-span-2 md:row-span-2",
    aspectClass: "aspect-square",
  },
  {
    caption: "Gel Elegante",
    src: "/blue.webp",
    isReal: true,
    span: "",
    aspectClass: "aspect-square",
  },
  {
    caption: "Rojo Clasico",
    src: "/red.webp",
    isReal: true,
    span: "",
    aspectClass: "aspect-square",
  },
  {
    caption: "Festival Nails",
    src: null,
    isReal: false,
    gradient: "from-rose/40 via-blush/60 to-accent-light/40",
    span: "",
    aspectClass: "aspect-square",
  },
  {
    caption: "Polygel Natural",
    src: null,
    isReal: false,
    gradient: "from-cream via-blush/50 to-accent-light/30",
    span: "",
    aspectClass: "aspect-square",
  },
  {
    caption: "Sugar Pink",
    src: null,
    isReal: false,
    gradient: "from-blush/60 via-rose/30 to-accent-light/50",
    span: "",
    aspectClass: "aspect-square",
  },
];

export function Gallery() {
  return (
    <section id="galeria" className="py-28 sm:py-36 bg-gradient-to-b from-white via-cream/30 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <ScrollReveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-16 gap-4">
          <div>
            <p className="text-muted tracking-[0.4em] uppercase text-[10px] mb-3">Galería</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-tight">
              Elige tu<br />
              <span className="italic gradient-text">inspiración</span>
            </h2>
          </div>
          <p className="text-xs text-muted/70 max-w-xs sm:text-right leading-relaxed">
            Selecciona un diseño y agenda directamente.<br />
            Cada uña, una obra de arte.
          </p>
        </ScrollReveal>

        {/* Editorial grid */}
        <ScrollRevealGroup className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[220px] md:auto-rows-[200px]">
          {galleryItems.map((item, i) => (
            <ScrollReveal
              key={i}
              index={i}
              className={`group relative overflow-hidden rounded-2xl border border-accent-light/20 hover:border-accent/40 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10 cursor-pointer ${item.span}`}
            >
              {/* Image or gradient bg */}
              {item.isReal && item.src ? (
                <Image
                  src={item.src}
                  alt={item.caption}
                  fill
                  sizes="(max-width:768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} transition-transform duration-700 group-hover:scale-105`}>
                  {/* Decorative nail polish icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-14 h-14 text-accent/20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8 2 5 5.5 5 9c0 2.5 1.2 4.7 3 6.1V20a2 2 0 002 2h4a2 2 0 002-2v-4.9c1.8-1.4 3-3.6 3-6.1 0-3.5-3-7-7-7z"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Gradient overlay always visible at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

              {/* Caption always visible */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-[11px] tracking-[0.15em] uppercase font-medium mb-2 drop-shadow-sm">
                  {item.caption}
                </p>

                {/* Action buttons — appear on hover */}
                <div className="flex flex-col gap-1.5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <GalleryBookButton caption={item.caption} />
                  <GalleryWhatsAppButton caption={item.caption} />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </ScrollRevealGroup>

        {/* Instagram link */}
        <ScrollReveal className="text-center mt-12">
          <a
            href="https://www.instagram.com/caiena.us"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-sm text-accent-dark hover:text-foreground transition-colors group"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span>Ver más en Instagram</span>
            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}

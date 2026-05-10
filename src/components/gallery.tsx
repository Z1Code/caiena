import { ScrollReveal, ScrollRevealGroup } from "@/components/scroll-reveal";

const galleryItems = [
  { caption: "Festival Nails", color: "from-rose/30 to-accent-light/30" },
  { caption: "Gel Elegante", color: "from-accent-light/30 to-blush/30" },
  { caption: "Polygel Natural", color: "from-blush/30 to-cream" },
  { caption: "Nail Art Creativo", color: "from-accent/20 to-rose/20" },
  { caption: "Rojo Clasico", color: "from-rose/40 to-accent/20" },
  { caption: "Sugar Pink", color: "from-blush/50 to-accent-light/20" },
];

export function Gallery() {
  return (
    <section id="galeria" className="py-24 bg-cream/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">Nuestro Trabajo</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">Galeria</h2>
          <div className="w-16 h-px bg-accent mx-auto mt-4" />
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryItems.map((item, i) => (
            <ScrollReveal key={i} index={i}>
              <div
                className={`group relative aspect-square rounded-2xl bg-gradient-to-br ${item.color} overflow-hidden border border-accent-light/20 hover:border-accent/30 transition-all duration-300 cursor-pointer`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-accent/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                    </svg>
                    <p className="text-xs text-accent-dark/60">{item.caption}</p>
                  </div>
                </div>

                {/* Glass hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 glass-card flex items-end p-3">
                  <span className="text-xs font-medium text-accent-dark">{item.caption}</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </ScrollRevealGroup>

        <ScrollReveal className="text-center mt-10">
          <a
            href="https://www.instagram.com/caiena.us"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent-dark hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Ver mas en Instagram
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}

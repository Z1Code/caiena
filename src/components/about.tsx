import { ScrollReveal, SpringReveal } from "@/components/scroll-reveal";

export function About() {
  return (
    <section id="sobre-mi" className="py-28 sm:py-36 relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-white" />

      {/* Blobs */}
      <div className="blob blob-warm w-[400px] h-[400px] bottom-[-80px] left-[-100px] opacity-25" />
      <div className="blob blob-b blob-gold w-[300px] h-[300px] top-[-40px] right-[-60px] opacity-20" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Image side */}
          <SpringReveal className="lg:col-span-5 relative">
            <div className="aspect-[3/4] rounded-[2rem] bg-gradient-to-br from-blush/60 via-accent-light/30 to-cream overflow-hidden relative">
              <div className="absolute inset-3 rounded-[1.5rem] border border-white/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/60 border border-accent-light/40 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-accent/5">
                    <span className="font-serif text-2xl text-accent-dark italic">R</span>
                  </div>
                  <p className="text-sm font-medium text-accent-dark">Roxanna</p>
                  <p className="text-[10px] text-muted tracking-wider">@roxannaacosta</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-light/20 to-blush/30 -z-10 hidden lg:block" />
            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-rose/10 -z-10 hidden lg:block" />
          </SpringReveal>

          {/* Content side */}
          <div className="lg:col-span-6 lg:col-start-7">
            <ScrollReveal index={0}>
              <p className="text-muted tracking-[0.4em] uppercase text-[10px] mb-3">La Artista</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-tight mb-8">
                Hola, soy
                <br />
                <span className="italic gradient-text">Roxanna</span>
              </h2>
            </ScrollReveal>

            <div className="space-y-5 text-foreground/50 leading-relaxed">
              <ScrollReveal index={1}>
                <p>
                  Soy una apasionada del arte en unas con anos de experiencia
                  creando disenos unicos para cada clienta.
                </p>
              </ScrollReveal>
              <ScrollReveal index={2}>
                <p>
                  Trabajo desde la comodidad de mi hogar en Leander, TX, ofreciendo
                  un ambiente relajado y privado donde disfrutas de un servicio
                  profesional sin las prisas de un salon tradicional.
                </p>
              </ScrollReveal>
              <ScrollReveal index={3}>
                <p className="text-foreground/70 font-medium">
                  Cada set de unas es una oportunidad para expresar tu personalidad.
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal index={4} className="mt-10">
              <a
                href="https://www.instagram.com/caiena.us"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-sm w-fit"
              >
                <div className="w-10 h-10 rounded-full border border-accent-light/40 flex items-center justify-center group-hover:bg-accent group-hover:text-white group-hover:border-accent text-accent-dark transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </div>
                <span className="text-foreground/50 group-hover:text-accent-dark transition-colors">@caiena.us</span>
              </a>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function Hero() {
  const topServices = await db
    .select({ name: services.name, durationMinutes: services.durationMinutes })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder), asc(services.id))
    .limit(3);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay"
    >
      {/* Layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-blush/20" />

      {/* Morphing blobs */}
      <div className="blob blob-rose w-[480px] h-[480px] top-[-60px] right-[-80px] opacity-70" />
      <div className="blob blob-b blob-gold w-[360px] h-[360px] bottom-[-40px] left-[-60px] opacity-60" />
      <div className="blob blob-warm w-[280px] h-[280px] top-[40%] left-[15%] opacity-40" />
      <div className="blob blob-b blob-rose w-[200px] h-[200px] bottom-[20%] right-[10%] opacity-30" />

      {/* Diagonal accent line */}
      <div className="absolute top-0 right-[30%] w-px h-[40vh] bg-gradient-to-b from-transparent via-accent-light/30 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left: main content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Logo mark */}
            <div className="animate-scale-in mb-10 flex justify-center lg:justify-start">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blush/80 to-accent-light/50 border border-accent-light/40 flex items-center justify-center shadow-lg shadow-accent/10">
                <span className="font-serif text-4xl text-accent-dark italic">C</span>
              </div>
            </div>

            {/* Tagline */}
            <p className="animate-fade-up text-muted tracking-[0.4em] uppercase text-[10px] sm:text-xs mb-6 font-medium">
              Nail Art Studio &middot; Leander, Texas
            </p>

            {/* Main title */}
            <h1 className="animate-fade-up [animation-delay:100ms] font-serif text-6xl sm:text-7xl md:text-8xl font-semibold text-foreground leading-[0.9] tracking-tight mb-8">
              <span className="block">Cai</span>
              <span className="block gradient-text italic">ena</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-up [animation-delay:200ms] text-base sm:text-lg text-foreground/50 max-w-md mx-auto lg:mx-0 mb-4 leading-relaxed font-light">
              Donde cada una es una obra de arte.
              <br className="hidden sm:block" />
              Manicure, pedicure y disenos personalizados.
            </p>

            {/* Location badge */}
            <div className="animate-fade-up [animation-delay:300ms] inline-flex items-center gap-2 text-xs text-muted mb-12 px-4 py-2 rounded-full border border-accent-light/30 bg-white/50">
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Home Studio &middot; Leander, TX
            </div>

            {/* CTAs */}
            <div className="animate-fade-up [animation-delay:400ms] flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#servicios"
                className="shimmer-btn bg-foreground text-white px-10 py-4 rounded-full text-sm tracking-[0.15em] uppercase hover:bg-accent-dark transition-colors shadow-xl shadow-foreground/10"
              >
                Ver Servicios
              </a>
              <a
                href="/prueba-virtual"
                className="group flex items-center gap-2 px-8 py-4 rounded-full text-sm tracking-wide text-foreground/70 border border-foreground/10 hover:border-accent/40 hover:text-accent-dark transition-all"
              >
                <svg className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Probar con IA
              </a>
            </div>

            {/* Stats row */}
            <div className="animate-fade-up [animation-delay:600ms] mt-16 flex items-center justify-center lg:justify-start gap-12 sm:gap-16">
              <div className="text-center">
                <span className="block font-serif text-3xl sm:text-4xl font-semibold gradient-text">★ 5.0</span>
                <span className="text-[10px] text-muted tracking-widest uppercase mt-1 block">Rating</span>
              </div>
              <div className="w-px h-10 bg-accent-light/40" />
              <div className="text-center">
                <span className="block font-serif text-3xl sm:text-4xl font-semibold gradient-text">200+</span>
                <span className="text-[10px] text-muted tracking-widest uppercase mt-1 block">Trabajos</span>
              </div>
              <div className="w-px h-10 bg-accent-light/40" />
              <div className="text-center">
                <span className="block font-serif text-3xl sm:text-4xl font-semibold gradient-text">5+</span>
                <span className="text-[10px] text-muted tracking-widest uppercase mt-1 block">Anos Exp.</span>
              </div>
            </div>
          </div>

          {/* Right: floating glass card — top services */}
          {topServices.length > 0 && (
            <div className="animate-fade-up [animation-delay:500ms] w-full lg:w-72 flex-shrink-0">
              <div className="glass-card rounded-3xl p-6">
                <p className="text-[10px] text-muted tracking-[0.3em] uppercase mb-4">Servicios populares</p>
                <div className="flex flex-col gap-3">
                  {topServices.map((svc, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-accent-light/20 last:border-0">
                      <span className="text-sm font-medium text-foreground/80">{svc.name}</span>
                      <span className="text-xs text-muted ml-2 whitespace-nowrap">{svc.durationMinutes} min</span>
                    </div>
                  ))}
                </div>
                <a
                  href="#servicios"
                  className="mt-5 w-full block text-center text-xs tracking-[0.1em] uppercase text-accent-dark border border-accent/30 rounded-full py-2.5 hover:bg-accent hover:text-white transition-all"
                >
                  Ver todos
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in [animation-delay:1s]">
        <div className="w-5 h-8 rounded-full border border-accent-light/40 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-accent/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

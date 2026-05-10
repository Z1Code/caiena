import Image from "next/image";
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Warm background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-blush/20" />
      <div className="blob blob-rose w-[400px] h-[400px] top-[-80px] right-[-60px] opacity-30" />
      <div className="blob blob-b blob-gold w-[280px] h-[280px] bottom-[-40px] left-[-40px] opacity-25" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

          {/* Left: main content */}
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            {/* Eyebrow */}
            <p className="animate-fade-up text-muted tracking-[0.4em] uppercase text-[10px] sm:text-xs mb-6 font-medium">
              Nail Art Studio &middot; Leander, Texas
            </p>

            {/* Main title */}
            <h1 className="animate-fade-up [animation-delay:100ms] font-serif text-6xl sm:text-7xl md:text-8xl font-semibold text-foreground leading-[0.9] tracking-tight mb-8">
              <span className="block">Cai</span>
              <span className="block gradient-text italic">ena</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-up [animation-delay:200ms] text-base sm:text-lg text-foreground/50 max-w-md mx-auto lg:mx-0 mb-12 leading-relaxed font-light">
              Donde cada una es una obra de arte.
              <br className="hidden sm:block" />
              Manicure, pedicure y dise\u00f1os personalizados.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up [animation-delay:400ms] flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="/reservar"
                className="shimmer-btn bg-foreground text-white px-10 py-4 rounded-full text-sm tracking-[0.15em] uppercase hover:bg-accent-dark transition-colors shadow-xl shadow-foreground/10"
              >
                Agendar
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
                <span className="block font-serif text-3xl sm:text-4xl font-semibold gradient-text">\u2605 5.0</span>
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
                <span className="text-[10px] text-muted tracking-widest uppercase mt-1 block">A\u00f1os Exp.</span>
              </div>
            </div>
          </div>

          {/* Right: editorial image with services overlay */}
          <div className="animate-fade-up [animation-delay:300ms] order-1 lg:order-2 w-full lg:w-[420px] flex-shrink-0 relative">
            {/* Editorial photo frame */}
            <div className="relative rounded-[2rem] overflow-hidden aspect-[3/4] shadow-2xl shadow-accent/20">
              <Image
                src="/caiena_instagram.png"
                alt="Caiena nail art"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 90vw, 420px"
              />
              {/* Subtle warm overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />

              {/* Bottom caption overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white/90 text-xs tracking-[0.2em] uppercase font-medium">Arte en tus u\u00f1as</p>
              </div>
            </div>

            {/* Floating services glass card */}
            {topServices.length > 0 && (
              <div className="absolute -bottom-6 -left-6 w-56 glass-card rounded-2xl p-4 shadow-xl hidden sm:block">
                <p className="text-[9px] text-muted tracking-[0.3em] uppercase mb-3">Servicios populares</p>
                <div className="flex flex-col gap-2">
                  {topServices.map((svc, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-accent-light/20 last:border-0">
                      <span className="text-xs font-medium text-foreground/80">{svc.name}</span>
                      <span className="text-[10px] text-muted ml-2 whitespace-nowrap">{svc.durationMinutes} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decorative corner accent */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-blush/40 to-accent-light/20 -z-10" />
          </div>

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

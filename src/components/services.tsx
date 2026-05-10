import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ServicesCatalog } from "@/components/services-catalog";

export async function Services() {
  const activeServices = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      images: services.images,
      sortOrder: services.sortOrder,
    })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder), asc(services.id));

  return (
    <section id="servicios" className="py-28 sm:py-36 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream/30 to-white" />

      {/* Blob accent */}
      <div className="blob blob-rose w-[500px] h-[500px] top-[-100px] right-[-150px] opacity-20" />

      {/* Decorative corner */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-8 left-8 w-px h-16 bg-accent-light/40" />
        <div className="absolute top-8 left-8 w-16 h-px bg-accent-light/40" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-16 gap-4">
          <div>
            <p className="text-muted tracking-[0.4em] uppercase text-[10px] mb-3">
              Servicios
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-tight">
              Elige tu
              <br />
              <span className="italic gradient-text">experiencia</span>
            </h2>
          </div>
          <p className="text-xs text-muted/70 max-w-xs sm:text-right">
            Selecciona uno o más servicios y reserva directo por WhatsApp
          </p>
        </div>

        <ServicesCatalog services={activeServices} />
      </div>
    </section>
  );
}

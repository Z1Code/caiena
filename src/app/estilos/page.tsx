import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { NailCatalog } from "@/components/nail-catalog";
import { getLocale } from "@/i18n/locale";
import { getT } from "@/i18n";

export const metadata = {
  title: "Catálogo de Diseños | Caiena Beauty Nails",
  description:
    "Explora todos nuestros diseños de uñas. Filtra por estilo, color y acabado. Prueba cualquier diseño en tu mano con IA.",
};

export default async function EstilosPage() {
  const locale = await getLocale();
  const t = getT(locale).catalog;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 sm:px-6 py-8 pb-4">
            <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-2">
              {t.label}
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
              {t.heading}
            </h1>
            <p className="text-foreground/50 mt-1 text-sm max-w-md">
              {t.sub}
            </p>
          </div>
          <NailCatalog />
        </div>
      </main>
      <Footer />
    </>
  );
}

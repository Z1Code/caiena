import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { NailGenerator } from "@/components/nail-generator";

export const metadata = {
  title: "Generador de Nail Art con IA | Caiena Beauty Nails",
  description:
    "Crea disenos unicos de nail art con inteligencia artificial. Describe tu idea y la IA la genera.",
};

export default function GeneradorPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-b from-cream to-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">
              Inteligencia Artificial
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              Generador de Disenos
            </h1>
            <p className="text-foreground/50 mt-3 max-w-md mx-auto">
              Describe el diseno de tus suenos y nuestra IA lo creara para ti.
            </p>
            <div className="w-16 h-px bg-accent mx-auto mt-4" />
          </div>
          <NailGenerator />
        </div>
      </main>
      <Footer />
    </>
  );
}

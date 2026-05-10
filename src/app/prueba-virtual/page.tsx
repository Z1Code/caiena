import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AITryOn } from "@/components/ai-tryon";

export const metadata = {
  title: "Prueba Virtual con IA | Caiena Beauty Nails",
  description:
    "Prueba diferentes disenos de unas en tu propia mano usando inteligencia artificial.",
};

export default function PruebaVirtualPage() {
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
              Prueba Virtual
            </h1>
            <p className="text-foreground/50 mt-3 max-w-md mx-auto">
              Sube una foto de tu mano y prueba diferentes disenos con IA antes
              de tu cita.
            </p>
            <div className="w-16 h-px bg-accent mx-auto mt-4" />
          </div>
          <AITryOn />
        </div>
      </main>
      <Footer />
    </>
  );
}

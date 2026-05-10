import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { GiftCardForm } from "@/components/gift-card-form";

export const metadata = {
  title: "Gift Cards | Caiena Beauty Nails",
  description: "Regala una experiencia de belleza. Compra una gift card de Caiena Beauty Nails.",
};

export default function GiftCardsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-b from-cream to-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">
              El Regalo Perfecto
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              Gift Cards
            </h1>
            <p className="text-foreground/50 mt-3 max-w-md mx-auto">
              Regala una experiencia de belleza a alguien especial.
            </p>
            <div className="w-16 h-px bg-accent mx-auto mt-4" />
          </div>
          <GiftCardForm />
        </div>
      </main>
      <Footer />
    </>
  );
}

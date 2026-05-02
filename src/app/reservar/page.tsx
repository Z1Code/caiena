import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BookingWizard } from "@/components/booking-wizard";

export const metadata = {
  title: "Reservar Cita | Caiena Beauty Nails",
  description: "Reserva tu cita de manicure, pedicure o nail art en Caiena Beauty Nails, Leander TX.",
};

export default function ReservarPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-b from-cream to-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">
              Agenda tu Cita
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              Reservar
            </h1>
            <div className="w-16 h-px bg-accent mx-auto mt-4" />
          </div>
          <Suspense fallback={<div className="h-96 animate-pulse bg-cream/50 rounded-3xl" />}>
            <BookingWizard />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

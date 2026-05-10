import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { Gallery } from "@/components/gallery";
import { Testimonials } from "@/components/testimonials";
import { About } from "@/components/about";
import { Booking } from "@/components/booking";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Gallery />
        <Testimonials />
        <About />
        <Booking />
      </main>
      <Footer />
    </>
  );
}

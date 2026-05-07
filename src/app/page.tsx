import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { Gallery } from "@/components/gallery";
import { Testimonials } from "@/components/testimonials";
import { About } from "@/components/about";
import { Footer } from "@/components/footer";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

async function getSiteSettings() {
  try {
    const rows = await db.select().from(siteSettings);
    const map = Object.fromEntries(rows.map(r => [r.key, r.value === "true"]));
    return { showGallery: map.show_gallery ?? false, showAbout: map.show_about ?? false };
  } catch {
    return { showGallery: false, showAbout: false };
  }
}

export default async function Home() {
  const { showGallery, showAbout } = await getSiteSettings();
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CatalogSection />
        {showGallery && <Gallery />}
        <Testimonials />
        {showAbout && <About />}
      </main>
      <Footer />
    </>
  );
}

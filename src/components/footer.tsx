"use client";

import { useSiteT } from "@/components/site-locale-context";

export function Footer() {
  const t = useSiteT();

  const navLinks = [
    { href: "/reservar", label: t.footer.bookAppointment },
    { href: "/prueba-virtual", label: t.footer.aiVirtualTryOn },
    { href: "/generador", label: t.footer.designGenerator },
    { href: "/gift-cards", label: "Gift Cards" },
  ];

  return (
    <footer className="relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-foreground" />
      {/* Subtle blob */}
      <div className="blob blob-b blob-rose w-[500px] h-[500px] bottom-[-200px] right-[-100px] opacity-[0.06]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                <span className="font-serif text-sm text-accent italic">C</span>
              </div>
              <span className="font-serif text-xl text-white tracking-wide">Caiena</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed max-w-[240px]">
              {t.footer.tagline}
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-4">
              {t.footer.navigate}
            </p>
            <div className="flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-4">
              {t.footer.contact}
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-white/40">
              <span>Leander, TX 78641</span>
              <span>{t.footer.byAppointment}</span>
              <a
                href="https://www.instagram.com/caiena.us"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                @caiena.us
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-white/20 tracking-wider">
            &copy; {new Date().getFullYear()} Caiena Beauty Nails
          </p>
          <p className="text-[10px] text-white/20 tracking-wider">
            {t.footer.madeWithLove}
          </p>
        </div>
      </div>
    </footer>
  );
}

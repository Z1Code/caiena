"use client";

import { useState, useEffect } from "react";
import { AuthWidget } from "./auth-widget";

const links = [
  { href: "/#servicios", label: "Servicios" },
  { href: "/prueba-virtual", label: "Prueba IA" },
  { href: "/generador", label: "Generador" },
  { href: "/gift-cards", label: "Gift Cards" },
  { href: "/reservar", label: "Reservar" },
];

function CaienaLogo() {
  return (
    <svg
      viewBox="0 0 220 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-auto"
      aria-label="Caiena Beauty Nails"
    >
      {/* Nail drop ornament above the C */}
      <ellipse cx="19" cy="6" rx="4.5" ry="7" fill="#B76E79" opacity="0.9" />
      <path d="M14.5 10 Q19 18 23.5 10" stroke="#B76E79" strokeWidth="1.2" fill="none" />

      {/* Main wordmark: "Caiena" in plum */}
      <text
        x="0"
        y="36"
        fontFamily="var(--font-cormorant), 'Cormorant Garamond', Georgia, serif"
        fontSize="34"
        fontWeight="400"
        fill="#3A1020"
        letterSpacing="1"
      >
        Caiena
      </text>

      {/* Subtitle: "BEAUTY NAILS" in rose gold */}
      <text
        x="2"
        y="50"
        fontFamily="var(--font-jost), 'Jost', sans-serif"
        fontSize="9"
        fontWeight="300"
        fill="#B76E79"
        letterSpacing="4"
      >
        BEAUTY NAILS
      </text>
    </svg>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass border-b border-accent-light/20 shadow-sm shadow-accent/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo */}
          <a href="/" className="flex items-center group">
            <CaienaLogo />
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="elegant-underline text-sm text-foreground/70 hover:text-foreground transition-colors tracking-[0.06em] uppercase px-4 py-2"
              >
                {link.label}
              </a>
            ))}
            <AuthWidget />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-foreground/60"
            aria-label="Toggle menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`block h-px bg-current transition-all duration-300 ${open ? "rotate-45 translate-y-[4px]" : ""}`} />
              <span className={`block h-px bg-current transition-all duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`block h-px bg-current transition-all duration-300 ${open ? "-rotate-45 -translate-y-[4px]" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-6 animate-fade-in">
            <div className="flex flex-col gap-1 pt-2">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-foreground/60 hover:text-foreground px-3 py-2.5 rounded-xl hover:bg-accent-light/10 transition-colors tracking-wide"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/reservar"
                onClick={() => setOpen(false)}
                className="bg-foreground text-white text-sm px-5 py-3 rounded-full text-center mt-3 tracking-wide"
              >
                Agendar
              </a>
              <a
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="border border-foreground/20 text-foreground/70 text-sm px-5 py-3 rounded-full text-center mt-1 tracking-wide"
              >
                Mi panel
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

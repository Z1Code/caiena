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
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush/80 to-accent-light/50 border border-accent-light/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="font-serif text-sm text-accent-dark italic">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-semibold text-foreground leading-none tracking-wide">
                Caiena
              </span>
              <span className="text-[8px] text-muted tracking-[0.25em] uppercase leading-none mt-0.5">
                Beauty Nails
              </span>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="elegant-underline text-xs text-foreground/60 hover:text-foreground transition-colors tracking-[0.08em] uppercase px-4 py-2"
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
              <span
                className={`block h-px bg-current transition-all duration-300 ${
                  open ? "rotate-45 translate-y-[4px]" : ""
                }`}
              />
              <span
                className={`block h-px bg-current transition-all duration-300 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-px bg-current transition-all duration-300 ${
                  open ? "-rotate-45 -translate-y-[4px]" : ""
                }`}
              />
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
                  className="text-sm text-foreground/60 hover:text-accent-dark px-3 py-2.5 rounded-xl hover:bg-accent-light/10 transition-colors tracking-wide"
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
                href="/login"
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

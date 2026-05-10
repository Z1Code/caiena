export function Booking() {
  return (
    <section id="reservar" className="py-24 bg-gradient-to-br from-blush/40 via-cream to-accent-light/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">
          Agenda tu Cita
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
          Reserva tu Cita
        </h2>
        <div className="w-16 h-px bg-accent mx-auto mt-2 mb-8" />

        <p className="text-foreground/60 max-w-lg mx-auto mb-10 leading-relaxed">
          Elige el servicio que desees y agenda tu cita. Te atendere en un
          ambiente comodo y profesional desde mi estudio en Leander, TX.
        </p>

        {/* Booking options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          {/* Online Booking */}
          <a
            href="/reservar"
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-accent-light/30 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-full bg-blush/50 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white text-accent-dark transition-colors duration-300">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-1">
              Reservar Online
            </h3>
            <p className="text-sm text-foreground/50">
              Elige servicio, fecha y hora
            </p>
          </a>

          {/* Instagram DM */}
          <a
            href="https://www.instagram.com/caiena.us"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-accent-light/30 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-full bg-blush/50 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white text-accent-dark transition-colors duration-300">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-1">
              Instagram DM
            </h3>
            <p className="text-sm text-foreground/50">
              Escribe por mensaje directo
            </p>
          </a>
        </div>

        {/* Info cards */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Leander, TX
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Home Based Studio
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Solo con cita previa
          </div>
        </div>
      </div>
    </section>
  );
}

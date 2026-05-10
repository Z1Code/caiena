import { Suspense } from "react";
import { redirect } from "next/navigation";

// Error messages for each error code
const ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Enlace inválido. Regresa a WhatsApp y reintenta.",
  expired: "Este enlace ha expirado. Escribe 'hola' en WhatsApp para obtener uno nuevo.",
  google_failed: "No pudimos conectar con Google. Intenta de nuevo.",
};

async function SuccessContent({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const name = params.name ? decodeURIComponent(params.name) : null;
  const errorCode = params.error;
  const isError = Boolean(errorCode);

  const WA_NUMBER = "12057940509";
  const waLink = `https://wa.me/${WA_NUMBER}`;

  return (
    <main className="min-h-screen bg-[#fdf5f0] flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-['Playfair_Display'] text-3xl text-[#4a2f23] tracking-tight">
            Caiena
          </span>
          <span className="text-xs text-[#c9a088] uppercase tracking-[0.2em]">
            Beauty Nails
          </span>
        </div>

        {isError ? (
          <>
            <span className="text-5xl">😕</span>
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold text-[#4a2f23]">Algo salió mal</h1>
              <p className="text-sm text-[#8a6e5f] leading-relaxed">
                {ERROR_MESSAGES[errorCode!] ?? "Ocurrió un error inesperado."}
              </p>
            </div>
          </>
        ) : (
          <>
            <span className="text-5xl">🌸</span>
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold text-[#4a2f23]">
                {name ? `¡Listo, ${name.split(" ")[0]}!` : "¡Listo!"}
              </h1>
              <p className="text-sm text-[#8a6e5f] leading-relaxed">
                Tu identidad fue verificada. Regresa a WhatsApp para confirmar tu cita.
              </p>
            </div>

            <a
              href={waLink}
              className="w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-semibold text-base tracking-wide flex items-center justify-center gap-2 hover:bg-[#1ebe5d] active:scale-95 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Volver a WhatsApp
            </a>
          </>
        )}
      </div>
    </main>
  );
}

export default function SuccessPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return (
    <Suspense>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}

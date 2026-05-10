"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  caption: string;
  serviceHint?: string;
}

export function GalleryBookButton({ caption, serviceHint }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleBook = () => {
    const style = encodeURIComponent(caption);
    const callbackUrl = `/reservar?style=${style}`;
    if (session) {
      router.push(callbackUrl);
    } else {
      signIn("google", { callbackUrl });
    }
  };

  return (
    <button
      onClick={handleBook}
      className="w-full flex items-center justify-center gap-2 bg-foreground/90 backdrop-blur-sm text-white text-[11px] tracking-[0.12em] uppercase py-2.5 px-4 rounded-full hover:bg-foreground transition-colors duration-200 shadow-lg"
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Agendar este estilo
    </button>
  );
}

export function GalleryWhatsAppButton({ caption }: { caption: string }) {
  const phone = "15122870373"; // Kapso number
  const msg = encodeURIComponent(
    `Hola! Vi el diseño "${caption}" en tu galería y quiero agendar una cita 💅`
  );
  return (
    <a
      href={`https://wa.me/${phone}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 bg-[#25D366]/90 backdrop-blur-sm text-white text-[11px] tracking-[0.12em] uppercase py-2.5 px-4 rounded-full hover:bg-[#25D366] transition-colors duration-200 shadow-lg"
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.552 4.116 1.522 5.84L0 24l6.335-1.504A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.51-5.17-1.4l-.37-.22-3.76.893.896-3.67-.24-.38A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
      WhatsApp
    </a>
  );
}

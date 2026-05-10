import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display, Cormorant_Garamond, Jost } from "next/font/google";
import { AIChatbot } from "@/components/ai-chatbot";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});

export const metadata: Metadata = {
  title: "Caiena Beauty Nails | Manicure & Pedicure | Leander, TX",
  description:
    "Servicios profesionales de manicure, pedicure, gel nails y polygel en Leander, TX. Home-based nail salon. Reserva tu cita hoy.",
  keywords: [
    "nails",
    "manicure",
    "pedicure",
    "gel nails",
    "polygel",
    "Leander TX",
    "Austin nails",
    "nail salon",
  ],
  openGraph: {
    title: "Caiena Beauty Nails",
    description:
      "Servicios profesionales de unas en Leander, TX. Manicure, pedicure, gel nails y mas.",
    type: "website",
    locale: "es_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${playfair.variable} ${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <AIChatbot />
        </Providers>
      </body>
    </html>
  );
}

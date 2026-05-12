export type Locale = "es" | "en";

const dict = {
  es: {
    nav: {
      services: "Servicios",
      aiTryOn: "Prueba IA",
      generator: "Generador",
      giftCards: "Gift Cards",
      book: "Reservar",
      bookCta: "Agendar",
      myDashboard: "Mi panel",
      signIn: "Iniciar sesión",
      signOut: "Cerrar sesión",
      toggleMenu: "Abrir menú",
    },
    footer: {
      tagline: "Arte en cada una. Servicios profesionales de manicure y pedicure en Leander, TX.",
      navigate: "Navegar",
      bookAppointment: "Reservar Cita",
      aiVirtualTryOn: "Prueba Virtual IA",
      designGenerator: "Generador de Diseños",
      contact: "Contacto",
      byAppointment: "Solo con cita previa",
      madeWithLove: "Hecho con amor en Texas",
    },
    hero: {
      word1: "Artesanal",
      word2: "Colorido",
    },
    testimonials: {
      label: "Testimonios",
      heading: "Lo que dicen nuestras clientas",
    },
    about: {
      label: "La Artista",
      greeting: "Hola, soy",
      p1: "Soy una apasionada del arte en uñas con años de experiencia creando diseños únicos para cada clienta.",
      p2: "Trabajo desde la comodidad de mi hogar en Leander, TX, ofreciendo un ambiente relajado y privado donde disfrutas de un servicio profesional sin las prisas de un salón tradicional.",
      p3: "Cada set de uñas es una oportunidad para expresar tu personalidad.",
    },
    dashboard: {
      backToSite: "Volver al sitio",
      loyaltyCard: "Tarjeta de lealtad",
      rewardRedeemed: "recompensa canjeada",
      rewardsRedeemed: "recompensas canjeadas",
      chooseDesign: "Elige tu diseño",
      chooseDesignSub: "Selecciona el estilo que quieres en tu próxima cita",
      upcomingAppointments: "Próximas citas",
      noUpcoming: "No tienes citas próximas",
      book: "Reservar",
      visitHistory: "Historial de visitas",
      noHistory: "Aún no tienes visitas registradas.",
      repeat: "Repetir",
      newBooking: "Nueva reserva",
      startFirst: "¡Agenda tu primera cita para comenzar!",
      completedMilestone: "🎉 ¡Completaste {n} visitas! Habla con nosotros para reclamar tu recompensa.",
      stampsProgress: "{done} de {total} visitas — te faltan {remaining} para tu recompensa",
    },
    whatsapp: {
      title: "Conecta tu WhatsApp",
      description: "Para ver tus citas e historial, necesitamos vincular tu cuenta con tu número de WhatsApp.",
      validate: "Validar por WhatsApp",
      generating: "Generando enlace...",
      waiting: "Esperando confirmación...",
      waitingHint: "Envía el mensaje que se abrió en WhatsApp para confirmar",
      cancel: "Cancelar",
      errorTimeout: "El tiempo expiró. Genera un nuevo enlace e inténtalo de nuevo.",
      errorGenerate: "No se pudo generar el enlace. Intenta de nuevo.",
    },
    booking: {
      label: "Agenda tu Cita",
      heading: "Reservar",
    },
    catalog: {
      label: "Catálogo",
      heading: "Diseños de Uñas",
      sub: "Filtra por estilo, color o forma. Sube tu foto y prueba cualquier diseño en tu mano.",
    },
    generator: {
      label: "Inteligencia Artificial",
      heading: "Generador de Diseños",
      sub: "Describe el diseño de tus sueños y nuestra IA lo creará para ti.",
    },
    tryon: {
      label: "Inteligencia Artificial",
      heading: "Prueba Virtual",
      sub: "Sube una foto de tu mano y prueba diferentes diseños con IA antes de tu cita.",
    },
    giftCards: {
      label: "El Regalo Perfecto",
      heading: "Gift Cards",
      sub: "Regala una experiencia de belleza a alguien especial.",
    },
    lang: {
      switchTo: "EN",
      current: "ES",
    },
  },
  en: {
    nav: {
      services: "Services",
      aiTryOn: "AI Try-On",
      generator: "Generator",
      giftCards: "Gift Cards",
      book: "Book",
      bookCta: "Book Now",
      myDashboard: "My Dashboard",
      signIn: "Sign in",
      signOut: "Sign out",
      toggleMenu: "Toggle menu",
    },
    footer: {
      tagline: "Art in every nail. Professional manicure and pedicure services in Leander, TX.",
      navigate: "Navigate",
      bookAppointment: "Book Appointment",
      aiVirtualTryOn: "AI Virtual Try-On",
      designGenerator: "Design Generator",
      contact: "Contact",
      byAppointment: "By appointment only",
      madeWithLove: "Made with love in Texas",
    },
    hero: {
      word1: "Artisanal",
      word2: "Colorful",
    },
    testimonials: {
      label: "Testimonials",
      heading: "What our clients say",
    },
    about: {
      label: "The Artist",
      greeting: "Hi, I'm",
      p1: "I'm passionate about nail art with years of experience creating unique designs for each client.",
      p2: "I work from the comfort of my home in Leander, TX, offering a relaxed and private setting where you enjoy professional service without the rush of a traditional salon.",
      p3: "Every nail set is an opportunity to express your personality.",
    },
    dashboard: {
      backToSite: "Back to site",
      loyaltyCard: "Loyalty card",
      rewardRedeemed: "reward redeemed",
      rewardsRedeemed: "rewards redeemed",
      chooseDesign: "Choose your design",
      chooseDesignSub: "Select the style you want for your next appointment",
      upcomingAppointments: "Upcoming appointments",
      noUpcoming: "You have no upcoming appointments",
      book: "Book",
      visitHistory: "Visit history",
      noHistory: "No visits recorded yet.",
      repeat: "Repeat",
      newBooking: "New booking",
      startFirst: "Book your first appointment to get started!",
      completedMilestone: "🎉 You completed {n} visits! Talk to us to claim your reward.",
      stampsProgress: "{done} of {total} visits — {remaining} more to your reward",
    },
    whatsapp: {
      title: "Connect your WhatsApp",
      description: "To see your appointments and history, we need to link your account to your WhatsApp number.",
      validate: "Verify via WhatsApp",
      generating: "Generating link...",
      waiting: "Waiting for confirmation...",
      waitingHint: "Send the message that opened in WhatsApp to confirm",
      cancel: "Cancel",
      errorTimeout: "Time expired. Generate a new link and try again.",
      errorGenerate: "Could not generate the link. Please try again.",
    },
    booking: {
      label: "Book your Appointment",
      heading: "Book",
    },
    catalog: {
      label: "Catalog",
      heading: "Nail Designs",
      sub: "Filter by style, color, or shape. Upload your photo and try any design on your hand.",
    },
    generator: {
      label: "Artificial Intelligence",
      heading: "Design Generator",
      sub: "Describe your dream design and our AI will create it for you.",
    },
    tryon: {
      label: "Artificial Intelligence",
      heading: "Virtual Try-On",
      sub: "Upload a photo of your hand and try different designs with AI before your appointment.",
    },
    giftCards: {
      label: "The Perfect Gift",
      heading: "Gift Cards",
      sub: "Give someone special a beauty experience.",
    },
    lang: {
      switchTo: "ES",
      current: "EN",
    },
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeepString<T> = T extends string ? string : { [K in keyof T]: DeepString<T[K]> };
export type Dict = DeepString<typeof dict.es>;

export function getT(locale: Locale): Dict {
  return dict[locale] as Dict ?? dict.es as Dict;
}

/** Read locale from <html lang="..."> — safe in SSR (returns "es"). */
export function getClientLocale(): Locale {
  if (typeof document === "undefined") return "es";
  const lang = document.documentElement.lang;
  return lang === "en" ? "en" : "es";
}

import { db } from "@/db"
import { userProfiles, bookings, services, nailStyles, nailStyleVariants } from "@/db/schema"
import { eq, and, desc, gt, count, asc, inArray } from "drizzle-orm"
import { LinkWhatsAppCard } from "./link-whatsapp-card"
import { BurnerNameModal } from "./burner-name-modal"
import { DashboardCatalogClient } from "./catalog/DashboardCatalogClient"
import Image from "next/image"
import type { Session } from "next-auth"
import { getLocale } from "@/i18n/locale"
import { getT } from "@/i18n"

const LOYALTY_MILESTONE = parseInt(process.env.LOYALTY_MILESTONE ?? "10", 10)
const WHATSAPP_BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? "12057940509"

function looksLikeBurner(name: string | null | undefined): boolean {
  if (!name) return true
  const t = name.trim()
  return t.length < 4 || !/\s/.test(t) || /\d{4,}/.test(t)
}

export async function UserDashboard({ session }: { session: Session }) {
  const locale = await getLocale()
  const t = getT(locale).dashboard

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.googleId, session.user.id),
  })

  // Not yet linked to a WhatsApp number
  if (!profile?.whatsappPhone) {
    return <LinkWhatsAppCard />
  }

  const phone = profile.whatsappPhone
  const today = new Date().toISOString().slice(0, 10)

  // Fetch upcoming bookings
  const upcomingBookings = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      serviceName: services.name,
      serviceId: bookings.serviceId,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.clientPhone, phone),
        gt(bookings.date, today)
      )
    )
    .orderBy(bookings.date, bookings.startTime)
    .limit(5)

  // Fetch booking history
  const historyBookings = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      serviceName: services.name,
      serviceId: bookings.serviceId,
      durationMinutes: services.durationMinutes,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.clientPhone, phone),
        eq(bookings.status, "completed")
      )
    )
    .orderBy(desc(bookings.date))
    .limit(20)

  // Loyalty stamp count
  const [loyaltyResult] = await db
    .select({ count: count() })
    .from(bookings)
    .where(and(eq(bookings.clientPhone, phone), eq(bookings.status, "completed")))

  // Fetch published catalog for design selection
  const catalogStyles = await db
    .select()
    .from(nailStyles)
    .where(eq(nailStyles.published, true))
    .orderBy(asc(nailStyles.sortOrder), asc(nailStyles.id));

  const catalogVariants = catalogStyles.length > 0
    ? await db.select().from(nailStyleVariants).where(
        and(eq(nailStyleVariants.status, "done"), inArray(nailStyleVariants.styleId, catalogStyles.map(s => s.id)))
      )
    : [];

  const variantsByStyle = catalogVariants.reduce<Record<number, typeof catalogVariants>>(
    (acc, v) => { (acc[v.styleId] ??= []).push(v); return acc; },
    {}
  );

  const catalogData = catalogStyles.map((s) => ({
    ...s,
    variants: (variantsByStyle[s.id] ?? []).sort((a, b) => {
      const order = ["garra", "ascendente", "doble", "rocio"];
      return order.indexOf(a.baseId) - order.indexOf(b.baseId);
    }),
  }));

  const totalVisits = loyaltyResult?.count ?? 0
  const stampsInCurrentCycle = totalVisits % LOYALTY_MILESTONE
  const cyclesCompleted = Math.floor(totalVisits / LOYALTY_MILESTONE)
  const displayName = profile.displayName || session.user.displayName || session.user.name || "Clienta"
  const showBurnerModal = looksLikeBurner(profile.displayName ?? session.user.displayName)

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">
      {showBurnerModal && <BurnerNameModal />}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={displayName}
              width={56}
              height={56}
              className="rounded-full border-2 border-accent-light/40"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blush/50 border-2 border-accent-light/40 flex items-center justify-center">
              <span className="font-serif text-xl text-accent-dark">{displayName[0]}</span>
            </div>
          )}
          <div>
            <h1 className="font-serif text-xl font-semibold text-foreground">{displayName}</h1>
            <p className="text-sm text-foreground/50">{session.user.email}</p>
          </div>
          <a
            href="/"
            className="ml-auto text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            {t.backToSite}
          </a>
        </div>

        {/* Loyalty card */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted tracking-widest uppercase">{t.loyaltyCard}</p>
            {cyclesCompleted > 0 && (
              <span className="text-xs bg-gold/20 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                ✨ {cyclesCompleted} {cyclesCompleted > 1 ? t.rewardsRedeemed : t.rewardRedeemed}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {Array.from({ length: LOYALTY_MILESTONE }).map((_, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                  i < stampsInCurrentCycle
                    ? "bg-accent border-accent text-white"
                    : "border-accent-light/40 text-foreground/20"
                }`}
              >
                {i < stampsInCurrentCycle ? "✓" : "○"}
              </div>
            ))}
          </div>
          {stampsInCurrentCycle === 0 && totalVisits === 0 ? (
            <p className="text-sm text-foreground/50">{t.startFirst}</p>
          ) : stampsInCurrentCycle === 0 && totalVisits > 0 ? (
            <p className="text-sm text-accent-dark font-medium">
              {t.completedMilestone.replace("{n}", String(LOYALTY_MILESTONE))}
            </p>
          ) : (
            <p className="text-sm text-foreground/60">
              {t.stampsProgress
                .replace("{done}", String(stampsInCurrentCycle))
                .replace("{total}", String(LOYALTY_MILESTONE))
                .replace("{remaining}", String(LOYALTY_MILESTONE - stampsInCurrentCycle))}
            </p>
          )}
        </div>

        {/* Catalog carousel for design selection */}
        {catalogData.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-2 px-6">{t.chooseDesign}</h2>
            <p className="text-sm text-muted mb-4 px-6">{t.chooseDesignSub}</p>
            <DashboardCatalogClient styles={catalogData} />
          </section>
        )}

        {/* Upcoming appointments */}
        <section className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-3">{t.upcomingAppointments}</h2>
          {upcomingBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-sm text-foreground/50 mb-3">{t.noUpcoming}</p>
              <a
                href="/reservar"
                className="inline-block bg-foreground text-white text-xs px-6 py-2.5 rounded-full tracking-wide hover:bg-accent-dark transition-colors"
              >
                {t.book}
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{b.serviceName}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {b.date} · {b.startTime} – {b.endTime}
                    </p>
                  </div>
                  <span className="text-xs bg-accent/10 text-accent-dark px-2 py-1 rounded-full">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-3">{t.visitHistory}</h2>
          {historyBookings.length === 0 ? (
            <p className="text-sm text-foreground/50">{t.noHistory}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {historyBookings.map((b) => (
                <div key={b.id} className="bg-white/60 rounded-xl px-4 py-3 flex items-center justify-between border border-accent-light/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.serviceName}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">{b.date}</p>
                  </div>
                  <a
                    href={`https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(`BOOKING|${b.serviceId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                  >
                    {t.repeat}
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* New booking CTA */}
        <a
          href="/reservar"
          className="block w-full text-center bg-foreground text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-accent-dark transition-colors"
        >
          {t.newBooking}
        </a>
      </div>
    </div>
  )
}

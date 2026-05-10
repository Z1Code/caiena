"use client";

import { useState, useEffect } from "react";
import type { Service } from "@/db/schema";
import { format, addDays, startOfDay, getDay } from "date-fns";
import { es } from "date-fns/locale";

type Step = "service" | "date" | "time" | "whatsapp";

interface SlotGroup {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  color: string | null;
  icon: string | null;
}

export function BookingWizard() {
  // Wizard state
  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<Array<{ time: string; available: boolean }>>([]);
  const [slotGroups, setSlotGroups] = useState<SlotGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");

  // WhatsApp step state
  const [waLoading, setWaLoading] = useState(false);

  // Load services
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
      .catch(() => setError("Error cargando servicios"));
  }, []);

  // Load availability when date changes
  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    setSelectedTime("");
    fetch(`/api/availability?date=${selectedDate}&serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        const groups: SlotGroup[] = data.groups || [];
        setSlotGroups(groups);
        if (groups.length > 0) {
          const firstWithSlots = groups.find((g) =>
            (data.slots || []).some(
              (s: { time: string; available: boolean }) =>
                s.available && s.time >= g.startTime && s.time < g.endTime
            )
          );
          if (firstWithSlots) setExpandedGroups(new Set([firstWithSlots.id]));
          else setExpandedGroups(new Set([groups[0].id]));
        }
        setLoadingSlots(false);
      })
      .catch(() => { setError("Error cargando horarios"); setLoadingSlots(false); });
  }, [selectedDate, selectedService]);

  const handleOpenWhatsApp = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setWaLoading(true);
    setError("");
    try {
      const timeParam = selectedTime.replace(":", "");
      const res = await fetch(
        `/api/booking/wa-link?svcId=${selectedService.id}&date=${selectedDate}&time=${timeParam}`
      );
      const data = await res.json();
      if (!res.ok || !data.waUrl) throw new Error(data.error || "Error generando enlace");
      window.open(data.waUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error abriendo WhatsApp");
    } finally {
      setWaLoading(false);
    }
  };

  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), i + 1);
    return {
      date: format(date, "yyyy-MM-dd"),
      label: format(date, "EEE d MMM", { locale: es }),
      closed: getDay(date) === 0,
    };
  });

  const groupedServices = {
    manicure: services.filter((s) => s.category === "manicure"),
    pedicure: services.filter((s) => s.category === "pedicure"),
    extras: services.filter((s) => s.category === "extras"),
  };

  const stepOrder: Step[] = ["service", "date", "time", "whatsapp"];
  const visibleSteps = ["service", "date", "time", "whatsapp"] as const;
  const stepLabels = ["Servicio", "Fecha", "Hora", "Reservar"];

  function toggleGroup(id: number) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderSlots() {
    if (loadingSlots) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      );
    }
    if (slots.length === 0) {
      return <p className="text-center text-foreground/50 py-8">No hay horarios disponibles para esta fecha.</p>;
    }

    if (slotGroups.length > 0) {
      const ungrouped = slots.filter(
        (s) => !slotGroups.some((g) => s.time >= g.startTime && s.time < g.endTime)
      );

      return (
        <div className="space-y-3">
          {slotGroups.map((group) => {
            const groupSlots = slots.filter(
              (s) => s.time >= group.startTime && s.time < group.endTime
            );
            if (groupSlots.length === 0) return null;
            const availableCount = groupSlots.filter((s) => s.available).length;
            const isExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id} className="border border-accent-light/30 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-cream/30 hover:bg-cream/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {group.icon && <span>{group.icon}</span>}
                    <span className="font-medium text-sm text-foreground">{group.name}</span>
                    <span className="text-xs text-foreground/40">{group.startTime}–{group.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${availableCount > 0 ? "bg-accent/10 text-accent-dark" : "bg-gray-100 text-gray-400"}`}>
                      {availableCount} disponibles
                    </span>
                    <svg className={`w-4 h-4 text-foreground/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>
                {isExpanded && (
                  <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {groupSlots.map((slot) => (
                      <SlotButton
                        key={slot.time}
                        slot={slot}
                        selected={selectedTime === slot.time}
                        onSelect={() => { setSelectedTime(slot.time); setStep("whatsapp"); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {ungrouped.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ungrouped.map((slot) => (
                <SlotButton
                  key={slot.time}
                  slot={slot}
                  selected={selectedTime === slot.time}
                  onSelect={() => { setSelectedTime(slot.time); setStep("whatsapp"); }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => (
          <SlotButton
            key={slot.time}
            slot={slot}
            selected={selectedTime === slot.time}
            onSelect={() => { setSelectedTime(slot.time); setStep("whatsapp"); }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-accent-light/30 shadow-sm overflow-hidden">
      {/* Progress bar */}
      <div className="flex border-b border-accent-light/20">
        {visibleSteps.map((s, i) => {
          const currentIndex = stepOrder.indexOf(step);
          const isActive = stepOrder.indexOf(s) <= currentIndex;
          return (
            <div
              key={s}
              className={`flex-1 py-3 text-center text-xs tracking-wide transition-colors ${
                isActive ? "bg-accent/10 text-accent-dark font-medium" : "text-foreground/30"
              }`}
            >
              <span className="hidden sm:inline">{stepLabels[i]}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
          );
        })}
      </div>

      <div className="p-6 sm:p-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Service */}
        {step === "service" && (
          <div>
            <h3 className="font-serif text-xl font-medium text-foreground mb-6">Elige tu servicio</h3>
            {Object.entries(groupedServices).map(([category, items]) => {
              if (items.length === 0) return null;
              const labels: Record<string, string> = { manicure: "Manicure", pedicure: "Pedicure", extras: "Extras" };
              return (
                <div key={category} className="mb-6">
                  <p className="text-xs text-accent-dark tracking-widest uppercase mb-3">{labels[category]}</p>
                  <div className="space-y-2">
                    {items.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => { setSelectedService(service); setStep("date"); }}
                        className="w-full text-left p-4 rounded-xl border border-accent-light/30 hover:border-accent/40 hover:bg-cream/50 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground group-hover:text-accent-dark transition-colors">{service.name}</p>
                            <p className="text-xs text-foreground/50 mt-1">{service.description}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="font-serif text-lg text-accent-dark">${service.price}</p>
                            <p className="text-xs text-foreground/40">{service.durationMinutes} min</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 2: Date */}
        {step === "date" && (
          <div>
            <BackButton label="Cambiar servicio" onClick={() => setStep("service")} />
            <SummaryBar service={selectedService} />
            <h3 className="font-serif text-xl font-medium text-foreground mb-6">Elige una fecha</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
              {availableDates.map((d) => (
                <button
                  key={d.date}
                  disabled={d.closed}
                  onClick={() => { setSelectedDate(d.date); setStep("time"); }}
                  className={`p-3 rounded-xl text-center text-sm transition-all ${
                    d.closed
                      ? "bg-gray-50 text-foreground/20 cursor-not-allowed"
                      : selectedDate === d.date
                      ? "bg-accent text-white"
                      : "border border-accent-light/30 hover:border-accent/40 hover:bg-cream/50 text-foreground/70"
                  }`}
                >
                  <span className="capitalize">{d.label}</span>
                  {d.closed && <span className="block text-xs mt-1">Cerrado</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Time */}
        {step === "time" && (
          <div>
            <BackButton label="Cambiar fecha" onClick={() => setStep("date")} />
            <div className="mb-4 p-3 bg-cream/50 rounded-xl text-sm">
              <span className="text-accent-dark font-medium">{selectedService?.name}</span>
              <span className="text-foreground/40">
                {" "}&middot; {format(new Date(selectedDate + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
              </span>
            </div>
            <h3 className="font-serif text-xl font-medium text-foreground mb-6">Elige una hora</h3>
            {renderSlots()}
          </div>
        )}

        {/* Step 4: WhatsApp booking */}
        {step === "whatsapp" && selectedService && (
          <div>
            <BackButton label="Cambiar hora" onClick={() => setStep("time")} />

            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
                <WhatsAppIcon size={28} />
              </div>
              <h3 className="font-serif text-xl font-medium text-foreground mb-1">¡Ya casi lista!</h3>
              <p className="text-sm text-foreground/50">Revisa tu reserva y confírmala por WhatsApp en un toque.</p>
            </div>

            {/* Booking summary */}
            <div className="bg-cream/50 rounded-2xl p-5 mb-8 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/50">Servicio</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/50">Fecha</span>
                <span className="font-medium capitalize">
                  {format(new Date(selectedDate + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/50">Hora</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between border-t border-accent-light/30 pt-3">
                <span className="text-foreground/50">Total</span>
                <span className="font-serif text-lg text-accent-dark">${selectedService.price}</span>
              </div>
            </div>

            {/* Giant WhatsApp button */}
            <button
              onClick={handleOpenWhatsApp}
              disabled={waLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#17a34a] text-white py-5 rounded-2xl text-base font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-[#25D366]/20"
            >
              {waLoading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <WhatsAppIcon size={24} />}
              {waLoading ? "Abriendo WhatsApp..." : "Reservar por WhatsApp"}
            </button>

            <p className="text-center text-xs text-foreground/35 mt-4">
              Solo presiona <strong className="font-medium">Enviar</strong> en WhatsApp — nosotros hacemos el resto
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function SlotButton({ slot, selected, onSelect }: { slot: { time: string; available: boolean }; selected: boolean; onSelect: () => void }) {
  return (
    <button
      disabled={!slot.available}
      onClick={onSelect}
      className={`py-3 px-2 rounded-xl text-sm text-center transition-all ${
        !slot.available
          ? "bg-gray-50 text-foreground/20 cursor-not-allowed line-through"
          : selected
          ? "bg-accent text-white scale-95"
          : "border border-accent-light/30 hover:border-accent/40 hover:bg-cream/50 text-foreground/70 hover:scale-[1.02]"
      }`}
    >
      {slot.time}
    </button>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-accent-dark hover:text-foreground mb-4 flex items-center gap-1">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      {label}
    </button>
  );
}

function SummaryBar({ service }: { service: Service | null }) {
  if (!service) return null;
  return (
    <div className="mb-4 p-3 bg-cream/50 rounded-xl text-sm">
      <span className="text-accent-dark font-medium">{service.name}</span>
      <span className="text-foreground/40"> &middot; ${service.price} &middot; {service.durationMinutes} min</span>
    </div>
  );
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

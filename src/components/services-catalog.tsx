"use client";

import { useState, useCallback } from "react";
import { ServiceCard } from "@/components/service-card";
import { StickySummary } from "@/components/sticky-summary";

interface Service {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  images: string[] | null;
}

interface ServicesCatalogProps {
  services: Service[];
}

export function ServicesCatalog({ services }: ServicesCatalogProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleService = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const removeService = useCallback((id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const selectedServices = services
    .filter((s) => selectedIds.includes(s.id))
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            name={service.name}
            description={service.description}
            durationMinutes={service.durationMinutes}
            images={service.images ?? []}
            selected={selectedIds.includes(service.id)}
            onToggle={toggleService}
            index={index}
          />
        ))}
      </div>

      <StickySummary selected={selectedServices} onRemove={removeService} />
    </>
  );
}

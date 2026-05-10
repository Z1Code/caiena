"use client";

import { useState } from "react";
import { NailCarousel, type CatalogStyle } from "./NailCarousel";
import { DesignOverlay } from "./DesignOverlay";

interface Props {
  styles: CatalogStyle[];
  onDesignSelected?: (styleId: number, baseId: string, styleName: string) => void;
}

export function DashboardCatalogClient({ styles, onDesignSelected }: Props) {
  const [selected, setSelected] = useState<CatalogStyle | null>(null);

  return (
    <>
      <NailCarousel styles={styles} onSelect={setSelected} />
      {selected && (
        <DesignOverlay
          style={selected}
          onClose={() => setSelected(null)}
          onSelectDesign={(styleId, baseId) => {
            onDesignSelected?.(styleId, baseId, selected.name);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

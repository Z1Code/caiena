"use client";

import { useState } from "react";
import { NailCarousel, type CatalogStyle } from "./NailCarousel";
import { DesignOverlay } from "./DesignOverlay";

interface Props {
  styles: CatalogStyle[];
}

export function CatalogClient({ styles }: Props) {
  const [selected, setSelected] = useState<CatalogStyle | null>(null);

  return (
    <>
      <NailCarousel styles={styles} onSelect={setSelected} />
      {selected && (
        <DesignOverlay style={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

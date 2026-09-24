"use client";

import { ChevronDown, LayoutGrid } from "lucide-react";
import { useUI } from "@/providers/UIProvider";

/** Header'dagi «Katalog» tugmasi (desktop). Menyu `CatalogPanel` da ochiladi. */
export function CatalogTrigger() {
  const { catalogOpen, toggleCatalog } = useUI();

  return (
    <button
      type="button"
      onClick={toggleCatalog}
      aria-expanded={catalogOpen}
      aria-haspopup="dialog"
      className="hidden h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-black lg:inline-flex"
    >
      <LayoutGrid className="size-4" aria-hidden="true" />
      Katalog
      <ChevronDown
        className={`size-4 transition-transform ${catalogOpen ? "rotate-180" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

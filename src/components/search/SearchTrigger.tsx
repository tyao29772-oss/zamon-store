"use client";

import { Search } from "lucide-react";
import { useUI } from "@/providers/UIProvider";

/** Header'dagi qidiruv ikonkasi — bosilganda `SearchOverlay` ochiladi. */
export function SearchTrigger({ className }: { className?: string }) {
  const { searchOpen, openSearch } = useUI();

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-haspopup="dialog"
      aria-expanded={searchOpen}
      aria-label="Qidiruv"
      className={`inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 ${className ?? ""}`}
    >
      <Search className="size-5" aria-hidden="true" />
    </button>
  );
}

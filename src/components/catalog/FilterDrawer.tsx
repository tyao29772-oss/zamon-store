"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

/**
 * Mobil filter paneli: pastdan chiqadigan varaq. Ichidagi filter havolalar bosilganda
 * sahifa yumshoq yangilanadi, panel esa ochiq qoladi — foydalanuvchi bir nechta
 * filterni ketma-ket tanlab, oxirida o‘zi yopadi.
 */
export function FilterDrawer({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Filter
        {count > 0 && (
          <span
            aria-hidden="true"
            className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white"
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fade-in fixed inset-0 z-[55] bg-ink/45 backdrop-blur-[2px]"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filterlar"
            tabIndex={-1}
            className="sheet-in fixed inset-x-0 bottom-0 z-[60] max-h-[86dvh] overflow-y-auto rounded-t-[28px] bg-surface p-5 pb-8 shadow-pop outline-none"
          >
            {/* Sarlavha ProductFilters ichida chiqadi («Filterlar»), shu yerda faqat yopish tugmasi. */}
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Yopish"
                className="inline-flex size-11 items-center justify-center rounded-full bg-surface-muted"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            {children}
          </div>
        </>
      )}
    </>
  );
}

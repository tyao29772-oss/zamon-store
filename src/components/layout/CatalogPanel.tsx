"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import { useUI } from "@/providers/UIProvider";
import type { CategoryNode } from "@/types";

/**
 * Katalog menyusi: desktopda header ostida mega-menyu, mobilda pastdan chiqadigan varaq.
 * Esc, fon bosish, sahifaga o‘tish va havola bosilganda yopiladi.
 */
export function CatalogPanel({ tree }: { tree: CategoryNode[] }) {
  const { catalogOpen, closeCatalog } = useUI();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Sahifa o‘zgarganda yopiladi.
  useEffect(() => {
    closeCatalog();
  }, [pathname, closeCatalog]);

  useEffect(() => {
    if (!catalogOpen) return;

    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCatalog();
    };
    document.addEventListener("keydown", onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus();
    };
  }, [catalogOpen, closeCatalog]);

  if (!catalogOpen) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={closeCatalog}
        className="fade-in fixed inset-0 z-[55] bg-ink/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Katalog"
        tabIndex={-1}
        className="sheet-in fixed inset-x-0 bottom-0 z-[60] max-h-[86dvh] overflow-y-auto rounded-t-[28px] bg-surface p-5 pb-8 shadow-pop outline-none lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-[84px] lg:w-[min(1216px,calc(100%-64px))] lg:-translate-x-1/2 lg:rounded-[28px] lg:p-8 lg:pb-8"
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <h2 className="font-display text-3xl font-semibold">Katalog</h2>
          <button
            type="button"
            onClick={closeCatalog}
            aria-label="Yopish"
            className="inline-flex size-11 items-center justify-center rounded-full bg-surface-muted"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          {tree.map((root) => (
            <section key={root.id} aria-labelledby={`catalog-${root.id}`}>
              <Link
                href={root.href}
                id={`catalog-${root.id}`}
                className="group inline-flex items-center gap-2 font-display text-[28px] font-semibold text-ink"
              >
                {root.name}
                <ArrowRight
                  className="size-5 text-accent-ink transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <ul className="mt-3 space-y-0.5">
                {root.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={child.href}
                      className="block rounded-xl px-3 py-2 text-[15px] font-medium text-ink transition-colors hover:bg-accent-soft"
                    >
                      {child.name}
                    </Link>
                    {child.children.length > 0 && (
                      <ul className="mb-1 ml-3 flex flex-wrap gap-x-4 gap-y-1 border-l border-line pl-3">
                        {child.children.map((grandchild) => (
                          <li key={grandchild.id}>
                            <Link
                              href={grandchild.href}
                              className="inline-block py-1 text-[13px] text-ink-muted transition-colors hover:text-ink"
                            >
                              {grandchild.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { Pencil, ShieldCheck } from "lucide-react";
import { ADMIN_HINT_COOKIE } from "@/lib/admin/hint";

/**
 * Saytda faqat admin ko‘radigan tugmalar. Belgi cookie'si brauzerda o‘qiladi — sahifalar
 * keshdan beriladi va xaridorlar (hamda Google) bu tugmalarni umuman ko‘rmaydi.
 */

function subscribe(onChange: () => void) {
  // Boshqa oynada kirib/chiqib kelganda ham yangilansin.
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const hasHint = () => document.cookie.split(/;\s*/).includes(`${ADMIN_HINT_COOKIE}=1`);

export function useIsAdmin(): boolean {
  return useSyncExternalStore(subscribe, hasHint, () => false);
}

/** Header'dagi «Admin» tugmasi. */
export function AdminHeaderLink() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <a
      href="/admin"
      className="inline-flex h-11 items-center gap-1.5 rounded-full border border-ink/15 bg-white/70 px-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-white"
      title="Admin panel"
    >
      <ShieldCheck className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">Admin</span>
      <span className="sr-only sm:hidden">Admin panel</span>
    </a>
  );
}

/** Mahsulot sahifasida — shu mahsulotni admin panelda ochish. */
export function AdminEditProductLink({ productId }: { productId: string }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <a
      href={`/admin/mahsulotlar/${productId}`}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black"
    >
      <Pencil className="size-3.5" aria-hidden="true" />
      Tahrirlash (admin)
    </a>
  );
}

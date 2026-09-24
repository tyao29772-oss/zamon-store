"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * `/qidiruv?q=` sahifasiga to‘g‘ridan-to‘g‘ri (overlay orqali emas — masalan ulashilgan havola
 * yoki formani jo‘natish orqali) kelinganda ham `search` eventi yozilishi uchun.
 */
export function SearchTracker({ query, resultCount }: { query: string; resultCount: number }) {
  useEffect(() => {
    if (!query) return;
    trackEvent("search", { query, resultCount });
    // Faqat sahifa yuklanganda bir marta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return null;
}

"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/providers/ToastProvider";

interface FavoriteButtonProps {
  productId: string;
  productName: string;
  className?: string;
}

/** Yurakcha tugmasi: sevimlilarga qo‘shadi/o‘chiradi va toast ko‘rsatadi. Teginish maydoni 44px. */
export function FavoriteButton({ productId, productName, className }: FavoriteButtonProps) {
  const { has, toggle } = useFavorites();
  const { show } = useToast();
  const active = has(productId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `${productName} — sevimlilardan o‘chirish`
          : `${productName} — sevimlilarga qo‘shish`
      }
      onClick={(event) => {
        // Karta ichidagi butun-karta havolasi bosilib ketmasligi uchun.
        event.preventDefault();
        event.stopPropagation();
        const added = toggle(productId);
        show(added ? "Sevimlilarga qo‘shildi" : "Sevimlilardan o‘chirildi");
        trackEvent("favorite_toggle", { productId, added });
      }}
      className={`inline-flex size-11 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white active:scale-95 ${className ?? ""}`}
    >
      <Heart
        className={`size-5 transition-colors ${active ? "fill-sale text-sale" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

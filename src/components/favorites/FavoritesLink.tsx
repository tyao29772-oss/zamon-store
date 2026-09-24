"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

/** Header'dagi sevimlilar ikonkasi, soni bilan. */
export function FavoritesLink({ className }: { className?: string }) {
  const { count } = useFavorites();

  return (
    <Link
      href="/sevimlilar"
      aria-label={count > 0 ? `Sevimlilar, ${count} ta mahsulot` : "Sevimlilar"}
      className={`relative inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 ${className ?? ""}`}
    >
      <Heart className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex min-w-[18px] items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold leading-[18px] text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

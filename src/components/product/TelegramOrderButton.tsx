"use client";

import { Send } from "lucide-react";
import { useStoreContact } from "@/providers/StoreContactProvider";
import { trackEvent } from "@/lib/analytics";
import { describeVariantForOrder, getVariantStockStatus } from "@/lib/product";
import { createTelegramOrderLink } from "@/lib/telegram";
import { absoluteUrl, productHref } from "@/lib/urls";
import type { Product, ProductVariant } from "@/types";

type Variant = "solid" | "outline" | "compact";

const STYLES: Record<Variant, string> = {
  solid: "h-12 rounded-full bg-ink px-6 text-sm text-white hover:bg-black",
  outline: "h-12 rounded-full border border-ink/15 px-6 text-sm text-ink hover:border-ink/40 hover:bg-white/60",
  compact: "h-9 rounded-full bg-ink px-3.5 text-xs text-white hover:bg-black",
};

interface TelegramOrderButtonProps {
  product: Product;
  variant: ProductVariant;
  style?: Variant;
  className?: string;
  /** Standart: «Telegram orqali buyurtma berish». Tugagan variantda har doim «Xabar bering». */
  label?: string;
  category?: string;
}

/**
 * Tezkor (Variant A) yo‘l: bosilganda to‘g‘ridan-to‘g‘ri tayyor xabar bilan Telegram ochiladi,
 * forma/backend shart emas. Kartada («so‘rash») va tugagan variantlarda («Xabar bering») ishlatiladi.
 * To‘liq forma (Variant B) — mahsulot sahifasidagi asosiy CTA, `OrderModal` orqali.
 */
export function TelegramOrderButton({
  product,
  variant,
  style = "solid",
  className,
  label: labelProp,
  category,
}: TelegramOrderButtonProps) {
  const { telegramUsername, storeName } = useStoreContact();
  const outOfStock = getVariantStockStatus(variant) === "out_of_stock";
  const label = outOfStock ? "Xabar bering" : (labelProp ?? "Telegram orqali buyurtma berish");

  const href = createTelegramOrderLink(telegramUsername, {
    productName: product.name,
    variantText: describeVariantForOrder(product, variant),
    price: variant.price,
    productUrl: absoluteUrl(productHref(product.slug, variant.id)),
    storeName,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        event.stopPropagation();
        trackEvent("telegram_order_click", {
          productId: product.id,
          productName: product.name,
          price: variant.price,
          category: category ?? null,
          selectedColor: variant.color ?? null,
          selectedStorage: variant.storage ?? null,
        });
      }}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors ${STYLES[style]} ${className ?? ""}`}
    >
      <Send className={style === "compact" ? "size-3.5" : "size-4"} aria-hidden="true" />
      {label}
    </a>
  );
}

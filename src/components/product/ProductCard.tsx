import Link from "next/link";
import { Star } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ProductImage } from "@/components/product/ProductImage";
import { StockBadge } from "@/components/product/StockBadge";
import { TelegramOrderButton } from "@/components/product/TelegramOrderButton";
import { formatDiscount, formatPrice, formatRating } from "@/lib/format";
import { getDefaultVariant, getPriceInfo, getProductStockStatus, getShortSpec } from "@/lib/product";
import { productHref } from "@/lib/urls";
import type { Brand, Product } from "@/types";

interface ProductCardProps {
  product: Product;
  brand?: Brand;
  /** Birinchi ekrandagi kartalar uchun (LCP). */
  eager?: boolean;
}

export function ProductCard({ product, brand, eager }: ProductCardProps) {
  const variant = getDefaultVariant(product);
  const price = getPriceInfo(product);
  const status = getProductStockStatus(product);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line/70 transition duration-300 hover:-translate-y-1 hover:shadow-pop">
      <div className="relative m-2 overflow-hidden rounded-[18px] bg-[radial-gradient(circle_at_50%_38%,#fffaf3_0%,#efe3d4_70%,#e6d8c6_100%)]">
        <ProductImage product={product} variant={variant} eager={eager} />
        {price.hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2.5 py-1 text-xs font-semibold text-white">
            {formatDiscount(price.discountPercent)}
          </span>
        )}
        <FavoriteButton
          productId={product.id}
          productName={product.name}
          className="absolute right-2 top-2 z-10"
        />
        {status === "out_of_stock" && (
          <div aria-hidden="true" className="absolute inset-0 bg-page/40" />
        )}
        <StockBadge status={status} className="absolute bottom-3 left-3" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-2">
        {brand && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
            {brand.name}
          </p>
        )}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          <Link
            href={productHref(product.slug)}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <p className="line-clamp-1 text-[13px] text-ink-muted">{getShortSpec(product, variant)}</p>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          <span className={`text-lg font-bold tracking-tight ${price.hasDiscount ? "text-sale" : "text-ink"}`}>
            {formatPrice(price.price)}
          </span>
          {price.oldPrice && (
            <span className="text-[13px] text-ink-muted line-through">{formatPrice(price.oldPrice)}</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-ink-muted">
          <Star className="size-3.5 fill-[#e0a23a] text-[#e0a23a]" aria-hidden="true" />
          <span className="font-semibold text-ink">{formatRating(product.ratingAvg)}</span>
          <span>({product.ratingCount})</span>
        </div>

        <TelegramOrderButton
          product={product}
          variant={variant}
          style="compact"
          label="Telegram orqali so‘rash"
          className="relative z-10 mt-1 w-full"
        />
      </div>
    </article>
  );
}

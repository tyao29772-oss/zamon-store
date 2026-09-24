"use client";

import Link from "next/link";
import { MapPin, Send, ShieldCheck, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ProductArt } from "@/components/art/ProductArt";
import { OrderModal } from "@/components/product/OrderModal";
import { ProductGallery } from "@/components/product/ProductGallery";
import { StockBadge } from "@/components/product/StockBadge";
import { TelegramOrderButton } from "@/components/product/TelegramOrderButton";
import { VariantOptionGroup, type VariantOption } from "@/components/product/VariantOptionGroup";
import { trackEvent } from "@/lib/analytics";
import { formatCount, formatDiscount, formatPrice, formatRating } from "@/lib/format";
import {
  CONDITION_LABELS,
  findVariant,
  getAxisValues,
  getDefaultVariant,
  getVariantAxes,
  getVariantPriceInfo,
  getVariantStockStatus,
  isAxisValueAvailable,
  resolveVariant,
  variantToSelection,
  type VariantAxis,
} from "@/lib/product";
import { brandHref, productHref } from "@/lib/urls";
import type { Brand, Product, ProductVariant, Store } from "@/types";

const AXIS_LABELS: Record<VariantAxis, string> = {
  color: "Rang",
  storage: "Xotira",
  ram: "Operativ xotira (RAM)",
  size: "O‘lcham",
};

const CONDITION_ORDER = Object.keys(CONDITION_LABELS) as (keyof typeof CONDITION_LABELS)[];

function getColorHex(pool: ProductVariant[], color: string): string | undefined {
  return pool.find((v) => v.color === color && v.colorHex)?.colorHex;
}

interface ProductViewProps {
  product: Product;
  brand: Brand | null;
  categoryName: string;
  categoryHref: string;
  store: Store;
  /** `?v=` orqali kelgan boshlang‘ich variant id (bo‘lmasa yoki noto‘g‘ri bo‘lsa standart variant olinadi). */
  initialVariantId?: string;
}

export function ProductView({ product, brand, categoryName, categoryHref, store, initialVariantId }: ProductViewProps) {
  const initial = findVariant(product, initialVariantId) ?? getDefaultVariant(product);
  const [variantId, setVariantId] = useState(initial.id);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const variant = findVariant(product, variantId) ?? initial;
  const selection = useMemo(() => variantToSelection(variant), [variant]);
  const pool = useMemo(
    () => product.variants.filter((v) => v.condition === variant.condition),
    [product.variants, variant.condition],
  );
  const axes = useMemo(() => getVariantAxes(pool), [pool]);
  const conditions = useMemo(
    () => CONDITION_ORDER.filter((c) => product.variants.some((v) => v.condition === c)),
    [product.variants],
  );

  const price = getVariantPriceInfo(variant);
  const stockStatus = getVariantStockStatus(variant);

  // URL'dagi `?v=` ni tanlangan variantga moslab yangilaydi — sahifani qayta yuklamasdan,
  // shunda variant ulashish uchun havola sifatida ishlaydi.
  useEffect(() => {
    window.history.replaceState(null, "", productHref(product.slug, variant.id));
  }, [product.slug, variant.id]);

  useEffect(() => {
    trackEvent("product_view", {
      productId: product.id,
      productName: product.name,
      price: variant.price,
      category: categoryName,
    });
    // Faqat sahifaga birinchi kirganda — variant almashtirish qayta hisoblanmaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function openOrderModal() {
    trackEvent("telegram_order_click", {
      productId: product.id,
      productName: product.name,
      price: variant.price,
      category: categoryName,
      selectedColor: variant.color ?? null,
      selectedStorage: variant.storage ?? null,
    });
    setOrderModalOpen(true);
  }

  // Pastdagi sticky buyurtma paneli mobilda navigatsiya ustiga qo‘shimcha joy egallaydi —
  // Footer shu o‘zgaruvchi orqali pastki paddingini kengaytiradi (sahifadan chiqilganda tozalanadi).
  useEffect(() => {
    document.documentElement.style.setProperty("--sticky-bottom-bar", "76px");
    return () => {
      document.documentElement.style.setProperty("--sticky-bottom-bar", "0px");
    };
  }, []);

  function selectCondition(condition: string) {
    const nextPool = product.variants.filter((v) => v.condition === condition);
    setVariantId(resolveVariant(nextPool, {}).id);
  }

  function selectAxis(axis: VariantAxis, value: string) {
    setVariantId(resolveVariant(pool, { ...selection, [axis]: value }).id);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
      <ProductGallery
        images={product.images}
        productName={product.name}
        art={<ProductArt product={product} variant={variant} className="h-full w-full" />}
      />

      <div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {brand && (
            <Link href={brandHref(brand.slug)} className="font-semibold text-accent-ink hover:underline">
              {brand.name}
            </Link>
          )}
          <span aria-hidden="true" className="text-ink-muted">
            ·
          </span>
          <Link href={categoryHref} className="text-ink-muted hover:text-ink hover:underline">
            {categoryName}
          </Link>
        </div>

        <h1 className="mt-2 font-display text-[32px] font-semibold leading-[1.08] tracking-tight text-ink md:text-[40px]">
          {product.name}
        </h1>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
          <Star className="size-4 fill-[#e0a23a] text-[#e0a23a]" aria-hidden="true" />
          <span className="font-semibold text-ink">{formatRating(product.ratingAvg)}</span>
          <span>({formatCount(product.ratingCount, "sharh")})</span>
        </div>

        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            data-testid="pdp-price"
            className={`text-[32px] font-bold tracking-tight ${price.hasDiscount ? "text-sale" : "text-ink"}`}
          >
            {formatPrice(price.price)}
          </span>
          {price.oldPrice && (
            <span className="text-lg text-ink-muted line-through">{formatPrice(price.oldPrice)}</span>
          )}
          {price.hasDiscount && (
            <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-semibold text-white">
              {formatDiscount(price.discountPercent)}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StockBadge status={stockStatus} />
          {stockStatus === "low" && <span className="text-[13px] text-ink-muted">Sotuvda {variant.stock} dona qoldi</span>}
          {variant.note && <span className="text-[13px] text-ink-muted">{variant.note}</span>}
        </div>

        <div className="mt-7 space-y-6">
          {conditions.length > 1 && (
            <VariantOptionGroup
              label="Holati"
              selected={variant.condition}
              onSelect={selectCondition}
              options={conditions.map((c) => ({ value: c, label: CONDITION_LABELS[c], disabled: false }))}
            />
          )}

          {axes.map((axis) => {
            const values = getAxisValues(pool, axis);
            const options: VariantOption[] = values.map((value) => ({
              value,
              label: axis === "storage" || axis === "ram" ? value.replace(/^(\d+)(GB|TB)$/i, "$1 $2") : value,
              disabled: !isAxisValueAvailable(pool, selection, axis, value),
              swatchHex: axis === "color" ? getColorHex(pool, value) : undefined,
            }));
            return (
              <VariantOptionGroup
                key={axis}
                label={AXIS_LABELS[axis]}
                selected={selection[axis]}
                onSelect={(value) => selectAxis(axis, value)}
                options={options}
                kind={axis === "color" ? "swatch" : "pill"}
              />
            );
          })}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {stockStatus === "out_of_stock" ? (
            <TelegramOrderButton product={product} variant={variant} className="flex-1" />
          ) : (
            <button
              type="button"
              onClick={openOrderModal}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              <Send className="size-4" aria-hidden="true" />
              Telegram orqali buyurtma berish
            </button>
          )}
          <FavoriteButton
            productId={product.id}
            productName={product.name}
            className="h-12 w-full rounded-full border border-ink/15 bg-transparent sm:w-12"
          />
        </div>

        <ul className="mt-7 space-y-2.5 rounded-2xl border border-line bg-surface/60 p-4 text-[13px] text-ink-muted">
          <li className="flex gap-2.5">
            <ShieldCheck className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
            <span>
              Kafolat: <span className="font-medium text-ink">{variant.warrantyMonths} oy</span>
            </span>
          </li>
          <li className="flex gap-2.5">
            <Truck className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
            <span>{store.deliveryPolicy[0]}</span>
          </li>
          <li className="flex gap-2.5">
            <MapPin className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
            <span>{store.address}</span>
          </li>
        </ul>
      </div>

      {/* Mobilda doim ko‘rinadigan buyurtma paneli — pastki navigatsiya ustida. */}
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-line/70 bg-surface/95 px-4 py-3 shadow-pop backdrop-blur-lg lg:hidden">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-base font-bold ${price.hasDiscount ? "text-sale" : "text-ink"}`}>
            {formatPrice(price.price)}
          </p>
          <p className="truncate text-[11px] text-ink-muted">{product.name}</p>
        </div>
        {stockStatus === "out_of_stock" ? (
          <TelegramOrderButton product={product} variant={variant} style="compact" className="!h-11 shrink-0" />
        ) : (
          <button
            type="button"
            onClick={openOrderModal}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            <Send className="size-4" aria-hidden="true" />
            Buyurtma berish
          </button>
        )}
      </div>

      {orderModalOpen && (
        <OrderModal product={product} variant={variant} onClose={() => setOrderModalOpen(false)} />
      )}
    </div>
  );
}

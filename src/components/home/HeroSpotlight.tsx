import Image from "next/image";
import { ArrowRight, BadgeCheck, ShieldCheck, Truck } from "lucide-react";
import { ProductArt } from "@/components/art/ProductArt";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatDiscount, formatPrice } from "@/lib/format";
import { getDefaultVariant, getPriceInfo, getShortSpec } from "@/lib/product";
import { productHref } from "@/lib/urls";
import type { Product } from "@/types";

const PERKS = [
  { icon: BadgeCheck, label: "Original mahsulot" },
  { icon: ShieldCheck, label: "12 oygacha kafolat" },
  { icon: Truck, label: "Toshkent bo‘ylab yetkazish" },
];

/** Bosh sahifaning birinchi ekrani: qorong‘i panel, nur doirasi va katta mahsulot. */
export function HeroSpotlight({ product, catalogHref }: { product: Product; catalogHref: string }) {
  const variant = getDefaultVariant(product);
  const price = getPriceInfo(product);

  return (
    <section aria-labelledby="hero-title" className="container-page pt-4 md:pt-6">
      <div className="grain relative isolate overflow-hidden rounded-[32px] bg-dark text-white md:rounded-[44px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_0%_0%,rgba(166,124,85,0.28),transparent_60%),radial-gradient(700px_400px_at_100%_100%,rgba(255,255,255,0.05),transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-[46%] size-[440px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,246,235,0.26)_0%,rgba(255,246,235,0.15)_52%,rgba(255,246,235,0.04)_64%,transparent_67%)] blur-[1px] md:-right-16 md:size-[720px]"
        />

        <div className="relative grid items-center gap-2 px-6 pb-8 pt-10 md:grid-cols-[1.02fr_1fr] md:gap-6 md:px-14 md:pb-14 md:pt-16">
          <div className="order-2 md:order-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Haftaning tanlovi
            </p>
            <h1
              id="hero-title"
              className="mt-5 text-[40px] font-bold leading-[1.02] tracking-tight md:text-[68px]"
            >
              {product.name}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70 md:text-base">
              {product.shortDescription} Original, kafolat bilan. Narxi va mavjudligini Telegram orqali
              tasdiqlab beramiz.
            </p>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[28px] font-bold tracking-tight md:text-4xl">
                {formatPrice(price.price)}
              </span>
              {price.oldPrice && (
                <span className="text-base text-white/45 line-through">{formatPrice(price.oldPrice)}</span>
              )}
              {price.hasDiscount && (
                <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-semibold">
                  {formatDiscount(price.discountPercent)}
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-white/50">
              {getShortSpec(product, variant)}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={productHref(product.slug)} variant="light">
                Ko‘rish
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href={catalogHref} variant="outline-light">
                Barcha telefonlar
              </ButtonLink>
            </div>

            <ul className="mt-9 hidden flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/60 md:flex">
              {PERKS.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon className="size-4 text-accent" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative order-1 flex justify-center md:order-2">
            {product.heroImage ? (
              <div className="relative h-[300px] w-full sm:h-[380px] md:h-[520px]">
                <Image
                  src={product.heroImage}
                  alt={product.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  loading="eager"
                  fetchPriority="high"
                  className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
                />
              </div>
            ) : (
              <ProductArt
                product={product}
                variant={variant}
                className="h-[300px] w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)] sm:h-[380px] md:h-[520px]"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

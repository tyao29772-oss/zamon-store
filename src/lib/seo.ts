import { getPriceInfo } from "@/lib/product";
import { absoluteUrl, productHref } from "@/lib/urls";
import type { Crumb } from "@/components/layout/Breadcrumbs";
import type { Brand, Product } from "@/types";

/**
 * `<script type="application/ld+json">` uchun xavfsiz JSON: `<` belgisi unicode bilan
 * almashtiriladi (XSS'ning oldini olish uchun — Next.js hujjatidagi rasmiy tavsiya).
 */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Mahsulot uchun schema.org `Product` — narx UZS'da, mavjudlik holati bilan. */
export function buildProductJsonLd(product: Product, brand: Brand | null): Record<string, unknown> {
  const prices = product.variants.map((v) => v.price);
  const inStock = product.variants.some((v) => v.stock > 0 || v.preorder);
  const price = getPriceInfo(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.variants[0]?.sku,
    ...(product.images.length > 0 ? { image: product.images.map((src) => absoluteUrl(src)) } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand.name } } : {}),
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "UZS",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: product.variants.length,
      price: price.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(productHref(product.slug)),
    },
  };
}

/**
 * `Breadcrumbs` komponentiga beriladigan `items` ro‘yxatidan schema.org `BreadcrumbList`
 * quradi. Oxirgi elementda `href` bo‘lmasa ham (joriy sahifa), to‘liq URL o‘ziga tegishli
 * `item` sifatida qo‘shiladi — Google hujjatlari buni talab qilmaydi, lekin ziyoni yo‘q.
 */
export function buildBreadcrumbJsonLd(items: Crumb[], currentUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href ?? currentUrl),
    })),
  };
}

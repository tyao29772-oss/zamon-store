import { publicEnv } from "@/config/env";

/** `/mahsulot/iphone-15-pro-max` yoki variant bilan `?v=…` */
export function productHref(slug: string, variantId?: string): string {
  const base = `/mahsulot/${slug}`;
  return variantId ? `${base}?v=${encodeURIComponent(variantId)}` : base;
}

export function brandHref(slug: string): string {
  return `/brendlar/${slug}`;
}

export function searchHref(query: string): string {
  return `/qidiruv?q=${encodeURIComponent(query)}`;
}

/** Nisbiy yo‘lni to‘liq URL'ga aylantiradi (Telegram xabari, sitemap, JSON-LD uchun). */
export function absoluteUrl(path: string): string {
  return `${publicEnv.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Tashqi (https://) havola yangi oynada ochiladi; ichki yo‘l uchun hech narsa qo‘shilmaydi. */
export function externalLinkProps(href: string): { target?: "_blank"; rel?: string } {
  return /^https:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

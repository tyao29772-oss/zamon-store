import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env";
import { brandHref, productHref } from "@/lib/urls";
import { getBrands } from "@/lib/repo/brands";
import { getCategories } from "@/lib/repo/categories";
import { getAllProducts } from "@/lib/repo/products";

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/katalog", priority: 0.9, changeFrequency: "daily" },
  { path: "/aksiyalar", priority: 0.8, changeFrequency: "daily" },
  { path: "/magazin-haqida", priority: 0.4, changeFrequency: "monthly" },
  { path: "/aloqa", priority: 0.4, changeFrequency: "monthly" },
  { path: "/kafolat", priority: 0.3, changeFrequency: "yearly" },
  { path: "/yetkazib-berish", priority: 0.3, changeFrequency: "yearly" },
  { path: "/maxfiylik", priority: 0.2, changeFrequency: "yearly" },
];

/**
 * Qidiruv (`/qidiruv`) va sevimlilar (`/sevimlilar`) atayin kiritilmagan — ular `noindex`
 * va foydalanuvchiga xos/dinamik mazmun, qidiruv tizimlari uchun foydali emas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, brands, products] = await Promise.all([getCategories(), getBrands(), getAllProducts()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${publicEnv.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${publicEnv.siteUrl}${category.href}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandEntries: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${publicEnv.siteUrl}${brandHref(brand.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${publicEnv.siteUrl}${productHref(product.slug)}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  return [...staticEntries, ...categoryEntries, ...brandEntries, ...productEntries];
}

import imageManifest from "@/data/image-manifest.json";
import { allProducts } from "@/data/products";
import {
  getDefaultVariant,
  getMaxDiscountPercent,
  hasDiscount,
  isProductAvailable,
  toStringList,
} from "@/lib/product";
import { getDescendantIds, getRootCategoryId } from "@/lib/repo/categories";
import type { Product } from "@/types";

/**
 * Mahsulot repository'si. Hozir data fayldan o‘qiydi; keyin DB'ga almashtiriladi —
 * funksiya imzolari (async) o‘zgarmaydi.
 */

type ImageManifest = Record<string, { images: string[]; hero?: string }>;

/** `public/products/` dan topilgan haqiqiy fotolarni mahsulotga biriktiradi (`npm run images`). */
function withPhotos(product: Product): Product {
  const found = (imageManifest as ImageManifest)[product.slug];
  if (!found) return product;
  return {
    ...product,
    images: product.images.length > 0 ? product.images : found.images,
    heroImage: product.heroImage ?? found.hero,
  };
}

const published: Product[] = allProducts.filter((p) => p.isPublished).map(withPhotos);
const bySlug = new Map(published.map((p) => [p.slug, p]));

const ESSENTIAL_ACCESSORY_CATEGORIES = new Set([
  "aksessuarlar-zaryadchiklar-adapterlar",
  "aksessuarlar-simsiz-quloqchinlar",
  "aksessuarlar-powerbanklar",
  "aksessuarlar-zaryadchiklar-simsiz",
]);

export async function getAllProducts(): Promise<Product[]> {
  return published;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return bySlug.get(slug) ?? null;
}

/** Berilgan tartibni saqlaydi, topilmagan id'lar tashlab yuboriladi. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const product = bySlug.get(id);
    if (product) result.push(product);
  }
  return result;
}

/** Kategoriya va uning barcha avlodlaridagi mahsulotlar. */
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const ids = new Set(await getDescendantIds(categoryId));
  return published.filter((p) => ids.has(p.categoryId));
}

export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  return published.filter((p) => p.brandId === brandId);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return [...published]
    .filter((p) => p.featured && isProductAvailable(p))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export async function getPopularProducts(limit = 8): Promise<Product[]> {
  return [...published]
    .filter(isProductAvailable)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export async function getNewProducts(limit = 8): Promise<Product[]> {
  return [...published]
    .filter(isProductAvailable)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getSaleProducts(limit?: number): Promise<Product[]> {
  const sale = published
    .filter((p) => hasDiscount(p) && isProductAvailable(p))
    .sort((a, b) => getMaxDiscountPercent(b) - getMaxDiscountPercent(a) || b.popularity - a.popularity);
  return limit ? sale.slice(0, limit) : sale;
}

/** Moslik kalitlari: aksessuarda `compatibility`, telefonda uning `model`i. */
function getCompatibilityKeys(product: Product): string[] {
  const keys = toStringList(product.attributes.compatibility);
  return product.model ? [...keys, product.model] : keys;
}

function sharesCompatibility(a: Product, b: Product): boolean {
  const second = getCompatibilityKeys(b);
  return getCompatibilityKeys(a).some((item) => second.includes(item));
}

/** O‘xshash mahsulotlar: avval qo‘lda berilganlar, so‘ng bir turkumdagi yaqin narxlilar. */
export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const explicit = await getProductsByIds(product.relatedIds ?? []);
  const rootId = await getRootCategoryId(product.categoryId);
  const price = getDefaultVariant(product).price;

  const scored: { product: Product; score: number }[] = [];
  for (const candidate of published) {
    if (candidate.id === product.id) continue;
    if (explicit.some((p) => p.id === candidate.id)) continue;
    if ((await getRootCategoryId(candidate.categoryId)) !== rootId) continue;

    const candidatePrice = getDefaultVariant(candidate).price;
    const closeness = 1 - Math.min(1, Math.abs(candidatePrice - price) / Math.max(price, 1));

    let score = closeness * 20;
    if (candidate.categoryId === product.categoryId) score += 100;
    if (candidate.brandId === product.brandId) score += 15;
    if (sharesCompatibility(candidate, product)) score += 50;
    if (!isProductAvailable(candidate)) score -= 30;
    scored.push({ product: candidate, score });
  }

  scored.sort((a, b) => b.score - a.score || b.product.popularity - a.product.popularity);
  return [...explicit, ...scored.map((s) => s.product)].slice(0, limit);
}

/** «Bu mahsulot bilan birga olishadi»: qo‘lda berilgan yoki telefon uchun mos aksessuarlar. */
export async function getBundleProducts(product: Product, limit = 6): Promise<Product[]> {
  const explicit = (await getProductsByIds(product.bundleIds ?? [])).filter(isProductAvailable);
  if (explicit.length > 0) return explicit.slice(0, limit);

  const rootId = await getRootCategoryId(product.categoryId);
  if (rootId !== "telefonlar") return [];

  const compatible = published.filter(
    (p) => p.id !== product.id && isProductAvailable(p) && sharesCompatibility(p, product),
  );
  const essentials = published
    .filter(
      (p) =>
        ESSENTIAL_ACCESSORY_CATEGORIES.has(p.categoryId) &&
        isProductAvailable(p) &&
        !compatible.includes(p),
    )
    .sort(
      (a, b) =>
        Number(b.brandId === product.brandId) - Number(a.brandId === product.brandId) ||
        b.popularity - a.popularity,
    );

  return [...compatible, ...essentials].slice(0, limit);
}

import { z } from "zod";
import type { Product } from "@/types";

/**
 * `products` jadvali qatori va sayt `Product` tipi o‘rtasidagi o‘girish hamda
 * bazaga yozishdan oldingi tekshiruv. Seed skripti, repo va admin action'lar shuni ishlatadi.
 */

const money = z.number().int().nonnegative().max(10_000_000_000);
const shortText = (max: number) => z.string().trim().max(max);

export const variantSchema = z.object({
  id: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(80),
  color: shortText(60).optional(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  storage: shortText(30).optional(),
  ram: shortText(30).optional(),
  size: shortText(30).optional(),
  condition: z.enum(["new", "used", "open-box"]),
  simType: shortText(60).optional(),
  price: money.positive(),
  oldPrice: money.positive().optional(),
  stock: z.number().int().min(0).max(100_000),
  preorder: z.boolean().optional(),
  warrantyMonths: z.number().int().min(0).max(120),
  note: shortText(200).optional(),
});

const specGroupSchema = z.object({
  title: shortText(80).min(1),
  items: z.array(z.object({ label: shortText(80).min(1), value: shortText(300).min(1) })).max(50),
});

const attributeValue = z.union([z.string().max(200), z.number(), z.array(z.string().max(200)).max(50)]);

export const productSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(120),
  slug: z.string(),
  name: shortText(200).min(2),
  brandId: shortText(60).min(1),
  categoryId: shortText(120).min(1),
  model: shortText(120).optional(),
  shortDescription: shortText(300),
  description: shortText(5000),
  images: z.array(z.string().min(1).max(500)).max(20),
  heroImage: z.string().max(500).optional(),
  variants: z.array(variantSchema).min(1).max(200),
  specs: z.array(specGroupSchema).max(30),
  attributes: z.record(z.string().max(60), attributeValue),
  keywords: z.array(z.string().trim().max(60)).max(50),
  featured: z.boolean(),
  popularity: z.number().int().min(0).max(1_000_000),
  ratingAvg: z.number().min(0).max(5),
  ratingCount: z.number().int().min(0),
  relatedIds: z.array(z.string()).max(50).optional(),
  bundleIds: z.array(z.string()).max(50).optional(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  seo: z.object({ title: z.string().max(120).optional(), description: z.string().max(300).optional() }).optional(),
}).refine((p) => p.slug === p.id, { message: "slug va id bir xil bo‘lishi kerak", path: ["slug"] })
  .refine((p) => new Set(p.variants.map((v) => v.id)).size === p.variants.length, {
    message: "Variant id'lari takrorlanmasligi kerak",
    path: ["variants"],
  });

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand_id: string;
  category_id: string;
  model: string | null;
  short_description: string;
  description: string;
  images: string[];
  hero_image: string | null;
  variants: Product["variants"];
  specs: Product["specs"];
  attributes: Product["attributes"];
  keywords: string[];
  featured: boolean;
  popularity: number;
  /** PostgREST `numeric` ni son yoki matn qilib qaytarishi mumkin. */
  rating_avg: number | string;
  rating_count: number;
  related_ids: string[] | null;
  bundle_ids: string[] | null;
  is_published: boolean;
  seo: Product["seo"] | null;
  created_at: string;
  updated_at: string;
}

/** JSONB ichida `null` saqlanmasin — ixtiyoriy maydonlar umuman yozilmaydi. */
function stripUndefined<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function productToRow(product: Product): ProductRow {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand_id: product.brandId,
    category_id: product.categoryId,
    model: product.model ?? null,
    short_description: product.shortDescription,
    description: product.description,
    images: product.images,
    hero_image: product.heroImage ?? null,
    variants: stripUndefined(product.variants),
    specs: product.specs,
    attributes: product.attributes,
    keywords: product.keywords,
    featured: product.featured,
    popularity: product.popularity,
    rating_avg: product.ratingAvg,
    rating_count: product.ratingCount,
    related_ids: product.relatedIds ?? null,
    bundle_ids: product.bundleIds ?? null,
    is_published: product.isPublished,
    seo: product.seo ? stripUndefined(product.seo) : null,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandId: row.brand_id,
    categoryId: row.category_id,
    model: row.model ?? undefined,
    shortDescription: row.short_description,
    description: row.description,
    images: row.images ?? [],
    heroImage: row.hero_image ?? undefined,
    variants: row.variants,
    specs: row.specs ?? [],
    attributes: row.attributes ?? {},
    keywords: row.keywords ?? [],
    featured: row.featured,
    popularity: row.popularity,
    ratingAvg: Number(row.rating_avg),
    ratingCount: row.rating_count,
    relatedIds: row.related_ids ?? undefined,
    bundleIds: row.bundle_ids ?? undefined,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    seo: row.seo ?? undefined,
  };
}

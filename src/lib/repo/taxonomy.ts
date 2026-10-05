import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { brands as defaultBrands } from "@/data/brands";
import { categories as defaultCategories } from "@/data/categories";
import { DbError, dbSelectAll, isDbConfigured } from "@/lib/db/supabase";
import type { Brand, Category } from "@/types";

/**
 * Brendlar va kategoriyalar: Supabase (`brands`, `categories`) yoki — jadval yo‘q/bo‘sh bo‘lsa —
 * `src/data` dagi standart ro‘yxat. Keshlanadi; admin o‘zgartirganda `TAXONOMY_TAG` bilan yangilanadi.
 */

export const TAXONOMY_TAG = "taxonomy";

export interface BrandRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  sort_order: number;
}

export interface CategoryRow {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  sort_order: number;
}

export function brandFromRow(row: BrandRow): Brand {
  return { id: row.id, slug: row.slug, name: row.name, description: row.description, logo: row.logo ?? undefined };
}

export function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    parentId: row.parent_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image: row.image ?? undefined,
    sortOrder: row.sort_order,
  };
}

export function brandToRow(brand: Brand, sortOrder: number): BrandRow {
  return { id: brand.id, slug: brand.slug, name: brand.name, description: brand.description, logo: brand.logo ?? null, sort_order: sortOrder };
}

export function categoryToRow(category: Category): CategoryRow {
  return {
    id: category.id,
    parent_id: category.parentId,
    slug: category.slug,
    name: category.name,
    description: category.description,
    image: category.image ?? null,
    sort_order: category.sortOrder,
  };
}

const loadFromDb = unstable_cache(
  async (): Promise<{ brands: Brand[]; categories: Category[] }> => {
    // Jadval hali yaratilmagan (404) — bo‘sh ro‘yxat sifatida keshlanadi, har sahifada qayta so‘ralmaydi.
    const orEmpty = <T,>(promise: Promise<T[]>) =>
      promise.catch((error: unknown) => {
        if (error instanceof DbError && error.status === 404) return [] as T[];
        throw error;
      });
    const [brandRows, categoryRows] = await Promise.all([
      orEmpty(dbSelectAll<BrandRow>("brands", "select=*&order=sort_order.asc,name.asc")),
      orEmpty(dbSelectAll<CategoryRow>("categories", "select=*&order=sort_order.asc,name.asc")),
    ]);
    return { brands: brandRows.map(brandFromRow), categories: categoryRows.map(categoryFromRow) };
  },
  ["taxonomy:v1"],
  { tags: [TAXONOMY_TAG], revalidate: 3600 },
);

export interface Taxonomy {
  brands: Brand[];
  categories: Category[];
  /** Admin uchun: ro‘yxat bazadanmi yoki standart (hali ko‘chirilmagan). */
  fromDb: { brands: boolean; categories: boolean };
}

/** Bitta so‘rov ichida bir marta. Baza ishlamasa yoki jadval yo‘q bo‘lsa — standart ro‘yxat. */
export const loadTaxonomy = cache(async (): Promise<Taxonomy> => {
  const fallback: Taxonomy = { brands: defaultBrands, categories: defaultCategories, fromDb: { brands: false, categories: false } };
  if (!isDbConfigured()) return fallback;
  try {
    const db = await loadFromDb();
    return {
      brands: db.brands.length > 0 ? db.brands : defaultBrands,
      categories: db.categories.length > 0 ? db.categories : defaultCategories,
      fromDb: { brands: db.brands.length > 0, categories: db.categories.length > 0 },
    };
  } catch (error) {
    console.error("[repo/taxonomy] brend/kategoriyalarni o‘qib bo‘lmadi, standart ro‘yxat ishlatiladi:", error);
    return fallback;
  }
});

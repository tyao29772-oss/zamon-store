import "server-only";
import { brands as defaultBrands } from "@/data/brands";
import { categories as defaultCategories } from "@/data/categories";
import { DbError, dbCount, dbDelete, dbInsert, dbSelectAll, dbUpdate, dbUpsert } from "@/lib/db/supabase";
import { buildCategoryIndex } from "@/lib/repo/categories";
import {
  brandFromRow,
  brandToRow,
  categoryFromRow,
  categoryToRow,
  type BrandRow,
  type CategoryRow,
} from "@/lib/repo/taxonomy";
import type { Brand, Category } from "@/types";

/**
 * Admin uchun brend/kategoriya yozish va keshsiz o‘qish. Jadval bo‘sh bo‘lsa, birinchi
 * o‘zgarishdan oldin standart ro‘yxat avtomatik ko‘chiriladi — aks holda admin bitta brend
 * qo‘shganda qolganlari saytdan «yo‘qolib» qolardi.
 */

export class TaxonomyConflictError extends Error {}

/** Jadvallar bo‘sh bo‘lsa — standart ro‘yxatni ko‘chiradi (bor yozuvga tegmaydi). */
export async function ensureTaxonomySeeded(): Promise<void> {
  const [brandCount, categoryCount] = await Promise.all([dbCount("brands"), dbCount("categories")]);
  if (brandCount === 0) {
    await dbUpsert("brands", defaultBrands.map((b, i) => brandToRow(b, i + 1) as unknown as Record<string, unknown>), "ignore");
  }
  if (categoryCount === 0) {
    const ordered = [...buildCategoryIndex(defaultCategories).list].sort((a, b) => a.depth - b.depth);
    await dbUpsert("categories", ordered.map((c) => categoryToRow(c) as unknown as Record<string, unknown>), "ignore");
  }
}

/* ------------------------------------------------------------------ Brendlar */

export async function listBrandsForAdmin(): Promise<(Brand & { sortOrder: number })[]> {
  const rows = await dbSelectAll<BrandRow>("brands", "select=*&order=sort_order.asc,name.asc");
  return rows.map((r) => ({ ...brandFromRow(r), sortOrder: r.sort_order }));
}

export async function insertBrand(input: { id: string; name: string; description: string }): Promise<void> {
  const rows = await listBrandsForAdmin();
  if (rows.some((b) => b.id === input.id)) throw new TaxonomyConflictError("Bu manzil (slug) bilan brend bor");
  const sortOrder = Math.max(0, ...rows.map((b) => b.sortOrder)) + 1;
  await dbInsert("brands", brandToRow({ id: input.id, slug: input.id, name: input.name, description: input.description }, sortOrder) as unknown as Record<string, unknown>);
}

export async function updateBrand(id: string, patch: { name: string; description: string }): Promise<boolean> {
  const rows = await dbUpdate<BrandRow>("brands", `id=eq.${encodeURIComponent(id)}`, patch);
  return rows.length > 0;
}

export async function deleteBrand(id: string): Promise<boolean> {
  return (await dbDelete<BrandRow>("brands", `id=eq.${encodeURIComponent(id)}`)).length > 0;
}

/** Tartibni o‘zgartiradi: qo‘shni yozuv bilan joy almashtiradi. */
export async function moveBrand(id: string, direction: -1 | 1): Promise<void> {
  const list = await listBrandsForAdmin();
  await swapOrder(
    "brands",
    list.map((b) => ({ id: b.id, sortOrder: b.sortOrder })),
    id,
    direction,
  );
}

/* ------------------------------------------------------------------ Kategoriyalar */

export async function listCategoriesForAdmin(): Promise<Category[]> {
  const rows = await dbSelectAll<CategoryRow>("categories", "select=*&order=sort_order.asc,name.asc");
  return rows.map(categoryFromRow);
}

export async function insertCategory(category: Category): Promise<void> {
  try {
    await dbInsert("categories", categoryToRow(category) as unknown as Record<string, unknown>);
  } catch (error) {
    if (error instanceof DbError && error.status === 409) throw new TaxonomyConflictError("Bu nomdagi bo‘lim shu joyda allaqachon bor");
    throw error;
  }
}

export async function updateCategory(id: string, patch: { name: string; description: string }): Promise<boolean> {
  return (await dbUpdate<CategoryRow>("categories", `id=eq.${encodeURIComponent(id)}`, patch)).length > 0;
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    return (await dbDelete<CategoryRow>("categories", `id=eq.${encodeURIComponent(id)}`)).length > 0;
  } catch (error) {
    // 409 — ichida bo‘limi bor (FK restrict).
    if (error instanceof DbError && error.status === 409) throw new TaxonomyConflictError("Ichida bo‘limlari bor");
    throw error;
  }
}

/** Faqat bir xil ota ostidagi qo‘shnilar orasida joy almashtiradi. */
export async function moveCategory(id: string, direction: -1 | 1): Promise<void> {
  const list = await listCategoriesForAdmin();
  const target = list.find((c) => c.id === id);
  if (!target) return;
  const siblings = list.filter((c) => c.parentId === target.parentId);
  await swapOrder("categories", siblings.map((c) => ({ id: c.id, sortOrder: c.sortOrder })), id, direction);
}

/* ------------------------------------------------------------------ Yordamchi */

/**
 * Ro‘yxatni joriy tartibda olib, `id` ni qo‘shnisi bilan almashtiradi va hammaga ketma-ket
 * 1, 2, 3 ... tartib raqamlarini beradi (teng raqamlar bo‘lsa ham to‘g‘ri ishlaydi).
 */
async function swapOrder(table: "brands" | "categories", items: { id: string; sortOrder: number }[], id: string, direction: -1 | 1): Promise<void> {
  const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = ordered.findIndex((item) => item.id === id);
  const other = index + direction;
  if (index < 0 || other < 0 || other >= ordered.length) return;
  [ordered[index], ordered[other]] = [ordered[other]!, ordered[index]!];
  // Faqat tartib raqami haqiqatan o‘zgarganlari yoziladi.
  const before = new Map(items.map((item) => [item.id, item.sortOrder]));
  const changes = ordered.map((item, i) => ({ id: item.id, sortOrder: i + 1 })).filter((c) => before.get(c.id) !== c.sortOrder);
  for (const change of changes) {
    await dbUpdate(table, `id=eq.${encodeURIComponent(change.id)}`, { sort_order: change.sortOrder });
  }
}

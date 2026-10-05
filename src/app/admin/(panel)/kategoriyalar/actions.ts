"use server";

import { updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { DbError, isDbConfigured } from "@/lib/db/supabase";
import { buildCategoryIndex } from "@/lib/repo/categories";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import { TAXONOMY_TAG } from "@/lib/repo/taxonomy";
import {
  deleteCategory,
  ensureTaxonomySeeded,
  insertCategory,
  listCategoriesForAdmin,
  moveCategory,
  TaxonomyConflictError,
  updateCategory,
} from "@/lib/repo/taxonomy-admin";
import type { TaxonomyResult } from "../brendlar/actions";

/** Daraxt ko‘pi bilan 3 qavat: Aksessuarlar › Zaryadchiklar › Adapterlar. */
const MAX_DEPTH = 2;

const fieldsSchema = z.object({
  name: z.string().trim().min(1, "Bo‘lim nomini yozing").max(60, "Nom ko‘pi bilan 60 belgi"),
  description: z.string().trim().max(500, "Tavsif ko‘pi bilan 500 belgi"),
});
const idSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(120);

function explain(error: unknown): string {
  if (error instanceof DbError && error.status === 404) return "Jadvallar yo‘q — Supabase SQL Editor’da 0006_taxonomy.sql ni ishga tushiring.";
  return "Saqlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.";
}

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) errors[String(issue.path[0])] ??= issue.message;
  return errors;
}

async function guard(): Promise<TaxonomyResult | null> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan." };
  await ensureTaxonomySeeded();
  return null;
}

export async function createCategoryAction(values: { parentId: string | null; name: string; slug: string; description: string }): Promise<TaxonomyResult> {
  try {
    const blocked = await guard();
    if (blocked) return blocked;
    const fields = fieldsSchema.safeParse(values);
    const slug = slugify(values.slug || values.name || "");
    const fieldErrors = fields.success ? {} : fieldErrorsOf(fields.error.issues);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60) fieldErrors.slug = "Manzil: lotin harf, raqam va «-» (masalan, smart-soatlar)";
    if (Object.keys(fieldErrors).length > 0 || !fields.success) return { ok: false, error: "Maydonlarni tekshiring.", fieldErrors };

    const list = await listCategoriesForAdmin();
    const index = buildCategoryIndex(list);

    if (values.parentId !== null) {
      const parent = index.byId.get(values.parentId);
      if (!parent) return { ok: false, error: "Ota bo‘lim topilmadi — sahifani yangilang." };
      if (parent.depth >= MAX_DEPTH) return { ok: false, error: "Bo‘limlar ko‘pi bilan 3 qavat bo‘lishi mumkin." };
      // Mahsulotlari bor bo‘lim ichiga bo‘lim qo‘shilsa, o‘sha mahsulotlar «osilib» qolardi.
      const direct = (await getAllProductsForAdmin()).filter((p) => p.categoryId === parent.id).length;
      if (direct > 0) {
        return { ok: false, error: `«${parent.name}» bo‘limida ${direct} ta mahsulot bor. Ichki bo‘lim qo‘shishdan oldin ularni boshqa bo‘limga o‘tkazing.` };
      }

    }

    const id = values.parentId ? `${values.parentId}-${slug}` : slug;
    if (!idSchema.safeParse(id).success) return { ok: false, error: "Manzil juda uzun — qisqaroq nom yozing.", fieldErrors: { slug: "Juda uzun" } };
    if (index.byId.has(id)) return { ok: false, error: "Bu manzil band.", fieldErrors: { slug: "Bu manzil band — boshqasini yozing" } };

    const siblings = list.filter((c) => c.parentId === values.parentId);
    await insertCategory({
      id,
      parentId: values.parentId,
      slug,
      name: fields.data.name,
      description: fields.data.description,
      sortOrder: Math.max(0, ...siblings.map((c) => c.sortOrder)) + 1,
    });
    updateTag(TAXONOMY_TAG);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof TaxonomyConflictError) return { ok: false, error: error.message, fieldErrors: { slug: "Bu manzil band" } };
    console.error("[admin/categories] qo‘shish:", error);
    return { ok: false, error: explain(error) };
  }
}

export async function updateCategoryAction(id: string, values: { name: string; description: string }): Promise<TaxonomyResult> {
  try {
    const blocked = await guard();
    if (blocked) return blocked;
    if (!idSchema.safeParse(id).success) return { ok: false, error: "Noto‘g‘ri bo‘lim." };
    const fields = fieldsSchema.safeParse(values);
    if (!fields.success) return { ok: false, error: "Maydonlarni tekshiring.", fieldErrors: fieldErrorsOf(fields.error.issues) };
    if (!(await updateCategory(id, fields.data))) return { ok: false, error: "Bo‘lim topilmadi." };
    updateTag(TAXONOMY_TAG);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[admin/categories] tahrirlash:", error);
    return { ok: false, error: explain(error) };
  }
}

export async function deleteCategoryAction(id: string): Promise<TaxonomyResult> {
  try {
    const blocked = await guard();
    if (blocked) return blocked;
    if (!idSchema.safeParse(id).success) return { ok: false, error: "Noto‘g‘ri bo‘lim." };
    const list = await listCategoriesForAdmin();
    if (list.some((c) => c.parentId === id)) return { ok: false, error: "Ichida bo‘limlari bor — avval ularni o‘chiring." };
    const used = (await getAllProductsForAdmin()).filter((p) => p.categoryId === id).length;
    if (used > 0) return { ok: false, error: `Bu bo‘limda ${used} ta mahsulot bor. Avval ularni boshqa bo‘limga o‘tkazing.` };
    if (!(await deleteCategory(id))) return { ok: false, error: "Bo‘lim topilmadi." };
    updateTag(TAXONOMY_TAG);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof TaxonomyConflictError) return { ok: false, error: "Ichida bo‘limlari bor — avval ularni o‘chiring." };
    console.error("[admin/categories] o‘chirish:", error);
    return { ok: false, error: explain(error) };
  }
}

export async function moveCategoryAction(id: string, direction: -1 | 1): Promise<TaxonomyResult> {
  try {
    const blocked = await guard();
    if (blocked) return blocked;
    if (!idSchema.safeParse(id).success || (direction !== -1 && direction !== 1)) return { ok: false, error: "Noto‘g‘ri so‘rov." };
    await moveCategory(id, direction);
    updateTag(TAXONOMY_TAG);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[admin/categories] tartib:", error);
    return { ok: false, error: explain(error) };
  }
}

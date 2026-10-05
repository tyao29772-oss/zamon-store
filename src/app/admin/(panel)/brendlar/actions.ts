"use server";

import { updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { DbError, isDbConfigured } from "@/lib/db/supabase";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import { TAXONOMY_TAG } from "@/lib/repo/taxonomy";
import {
  deleteBrand,
  ensureTaxonomySeeded,
  insertBrand,
  moveBrand,
  TaxonomyConflictError,
  updateBrand,
} from "@/lib/repo/taxonomy-admin";

export type TaxonomyResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const fieldsSchema = z.object({
  name: z.string().trim().min(1, "Brend nomini yozing").max(60, "Nom ko‘pi bilan 60 belgi"),
  description: z.string().trim().max(500, "Tavsif ko‘pi bilan 500 belgi"),
});

const idSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60);

function explain(error: unknown): string {
  if (error instanceof DbError && error.status === 404) return "Jadvallar yo‘q — Supabase SQL Editor’da 0006_taxonomy.sql ni ishga tushiring.";
  return "Saqlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.";
}

async function guard(): Promise<TaxonomyResult | null> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan." };
  await ensureTaxonomySeeded();
  return null;
}

export async function createBrandAction(values: { name: string; slug: string; description: string }): Promise<TaxonomyResult> {
  try {
    const blocked = await guard();
    if (blocked) return blocked;
    const fields = fieldsSchema.safeParse(values);
    const slug = slugify(values.slug || values.name || "");
    const fieldErrors: Record<string, string> = {};
    if (!fields.success) for (const issue of fields.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    if (!idSchema.safeParse(slug).success) fieldErrors.slug = "Manzil: lotin harf, raqam va «-» (masalan, vivo)";
    if (Object.keys(fieldErrors).length > 0 || !fields.success) return { ok: false, error: "Maydonlarni tekshiring.", fieldErrors };

    await insertBrand({ id: slug, ...fields.data });
    updateTag(TAXONOMY_TAG);
    return { ok: true };
  } catch (error) {
    // Kirish muddati tugagan bo‘lsa — login sahifasiga yo‘naltirish signali xato emas.
    unstable_rethrow(error);
    if (error instanceof TaxonomyConflictError) return { ok: false, error: error.message, fieldErrors: { slug: "Bu manzil band — boshqasini yozing" } };
    console.error("[admin/brands] qo‘shish:", error);
    return { ok: false, error: explain(error) };
  }
}

export async function updateBrandAction(id: string, values: { name: string; description: string }): Promise<TaxonomyResult> {
  try {
    const blocked = await guard();
    if (blocked) return blocked;
    const fields = fieldsSchema.safeParse(values);
    if (!idSchema.safeParse(id).success) return { ok: false, error: "Noto‘g‘ri brend." };
    if (!fields.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of fields.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
      return { ok: false, error: "Maydonlarni tekshiring.", fieldErrors };
    }
    if (!(await updateBrand(id, fields.data))) return { ok: false, error: "Brend topilmadi." };
    updateTag(TAXONOMY_TAG);
    return { ok: true };
  } catch (error) {
    // Kirish muddati tugagan bo‘lsa — login sahifasiga yo‘naltirish signali xato emas.
    unstable_rethrow(error);
    console.error("[admin/brands] tahrirlash:", error);
    return { ok: false, error: explain(error) };
  }
}

export async function deleteBrandAction(id: string): Promise<TaxonomyResult> {
  try {
    const blocked = await guard();
    if (blocked) return blocked;
    if (!idSchema.safeParse(id).success) return { ok: false, error: "Noto‘g‘ri brend." };
    // Mahsulotlari bor brend o‘chmaydi — aks holda ular brendsiz qolib, saytda xato chiqardi.
    const used = (await getAllProductsForAdmin()).filter((p) => p.brandId === id).length;
    if (used > 0) return { ok: false, error: `Bu brendda ${used} ta mahsulot bor. Avval ularni boshqa brendga o‘tkazing yoki o‘chiring.` };
    if (!(await deleteBrand(id))) return { ok: false, error: "Brend topilmadi." };
    updateTag(TAXONOMY_TAG);
    return { ok: true };
  } catch (error) {
    // Kirish muddati tugagan bo‘lsa — login sahifasiga yo‘naltirish signali xato emas.
    unstable_rethrow(error);
    console.error("[admin/brands] o‘chirish:", error);
    return { ok: false, error: explain(error) };
  }
}

export async function moveBrandAction(id: string, direction: -1 | 1): Promise<TaxonomyResult> {
  try {
    const blocked = await guard();
    if (blocked) return blocked;
    if (!idSchema.safeParse(id).success || (direction !== -1 && direction !== 1)) return { ok: false, error: "Noto‘g‘ri so‘rov." };
    await moveBrand(id, direction);
    updateTag(TAXONOMY_TAG);
    return { ok: true };
  } catch (error) {
    // Kirish muddati tugagan bo‘lsa — login sahifasiga yo‘naltirish signali xato emas.
    unstable_rethrow(error);
    console.error("[admin/brands] tartib:", error);
    return { ok: false, error: explain(error) };
  }
}

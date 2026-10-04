"use server";

import { updateTag } from "next/cache";
import { buildProductFromInput, flattenIssues, productInputSchema } from "@/lib/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/supabase";
import { productSchema } from "@/lib/repo/product-rows";
import { PRODUCTS_TAG } from "@/lib/repo/products";
import {
  getProductForAdmin,
  insertProduct,
  ProductConflictError,
  ProductExistsError,
  ProductNotFoundError,
  updateProduct,
} from "@/lib/repo/products-admin";

export type SaveProductTarget = { kind: "create" } | { kind: "update"; id: string };

export type SaveProductResult =
  | { ok: true; id: string; updatedAt: string; created: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; conflict?: boolean };

export async function saveProductAction(target: SaveProductTarget, values: unknown): Promise<SaveProductResult> {
  await requireAdmin();

  if (!isDbConfigured()) {
    return { ok: false, error: "Baza (Supabase) ulanmagan — mahsulotni saqlab bo‘lmaydi." };
  }

  const parsed = productInputSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Ba’zi maydonlar to‘ldirilmagan yoki noto‘g‘ri. Qizil bilan belgilangan joylarni tekshiring.",
      fieldErrors: flattenIssues(parsed.error.issues),
    };
  }

  try {
    const existing = target.kind === "update" ? await getProductForAdmin(target.id) : null;
    if (target.kind === "update" && !existing) {
      return { ok: false, error: "Mahsulot topilmadi — ehtimol o‘chirilgan." };
    }
    if (target.kind === "update" && !parsed.data.updatedAt) {
      return { ok: false, error: "Forma versiyasi yo‘q. Sahifani yangilab, qayta urinib ko‘ring." };
    }

    const product = buildProductFromInput(parsed.data, existing, new Date().toISOString());
    const check = productSchema.safeParse(product);
    if (!check.success) {
      console.error("[admin/products] yakuniy tekshiruv:", check.error.issues);
      return { ok: false, error: "Ma’lumotni saqlab bo‘lmadi: tekshiruvdan o‘tmadi." };
    }

    const saved =
      target.kind === "create"
        ? await insertProduct(product)
        : await updateProduct(product, parsed.data.updatedAt!);

    // Sayt (bosh sahifa, katalog, mahsulot sahifasi, qidiruv) yangi ma’lumotni darhol oladi.
    updateTag(PRODUCTS_TAG);
    return { ok: true, id: saved.id, updatedAt: saved.updatedAt, created: target.kind === "create" };
  } catch (error) {
    if (error instanceof ProductExistsError) {
      return {
        ok: false,
        error: "Bu manzil bilan mahsulot allaqachon bor.",
        fieldErrors: { slug: "Bu manzil band — boshqasini yozing (masalan, oxiriga -2 qo‘shing)" },
      };
    }
    if (error instanceof ProductConflictError) {
      return {
        ok: false,
        conflict: true,
        error: "Bu mahsulot siz formani ochganingizdan keyin boshqa joyda o‘zgartirilgan. Ma’lumot yo‘qolmasligi uchun saqlanmadi — sahifani yangilang.",
      };
    }
    if (error instanceof ProductNotFoundError) {
      return { ok: false, error: "Mahsulot topilmadi — ehtimol o‘chirilgan." };
    }
    console.error("[admin/products] saqlashda xato:", error);
    return { ok: false, error: "Saqlashda kutilmagan xato. Internetni tekshirib, qayta urinib ko‘ring." };
  }
}

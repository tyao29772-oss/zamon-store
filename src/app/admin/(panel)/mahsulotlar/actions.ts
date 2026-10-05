"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  applyQuickEdit,
  buildProductFromInput,
  flattenIssues,
  getLeafCategories,
  getRootId,
  productInputSchema,
  quickEditSchema,
  validateTaxonomy,
} from "@/lib/admin/product-form";
import { getBrands } from "@/lib/repo/brands";
import { getCategories } from "@/lib/repo/categories";
import { requireAdmin } from "@/lib/admin/auth";
import { createSignedImageUpload, IMAGE_TYPES, isOwnUploadedImage, type ImageContentType } from "@/lib/db/storage";
import { DbError, isDbConfigured } from "@/lib/db/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { productSchema } from "@/lib/repo/product-rows";
import { PRODUCTS_TAG } from "@/lib/repo/products";
import {
  getProductForAdmin,
  deleteProduct,
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

/** Saytning o‘z `public/products/` papkasidagi rasmlar (nusxa olinganda ko‘chadi). */
const LOCAL_IMAGE = /^\/products\/[a-z0-9-]+\/[\w.-]+\.(webp|png|jpe?g|avif)$/i;

export type ImageUploadResult =
  | { ok: true; uploadUrl: string; publicUrl: string }
  | { ok: false; error: string };

const UPLOAD_LIMIT = 120;
const UPLOAD_WINDOW_MS = 10 * 60_000;

/**
 * Bitta rasm uchun bir martalik yuklash havolasi. Brauzer siqilgan rasmni shu havolaga
 * to‘g‘ridan-to‘g‘ri yuklaydi (Netlify orqali o‘tmaydi — tez va hajm cheklovisiz).
 */
export async function createImageUploadAction(contentType: string): Promise<ImageUploadResult> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan — rasm yuklab bo‘lmaydi." };
  if (!Object.hasOwn(IMAGE_TYPES, contentType)) return { ok: false, error: "Faqat rasm (JPG, PNG, WebP) yuklash mumkin." };

  const rate = checkRateLimit(`admin-upload:${getClientIp(await headers())}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS);
  if (!rate.allowed) return { ok: false, error: "Juda ko‘p rasm yuklandi. Bir necha daqiqadan so‘ng davom eting." };

  try {
    const signed = await createSignedImageUpload(contentType as ImageContentType);
    return { ok: true, ...signed };
  } catch (error) {
    console.error("[admin/products] yuklash havolasi:", error);
    const status = error instanceof DbError ? error.status : undefined;
    return {
      ok: false,
      error:
        status === 404 || status === 400
          ? "Rasmlar papkasi topilmadi — Supabase'da 0003_product_images.sql ishga tushirilmagan."
          : "Rasm yuklashni boshlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.",
    };
  }
}

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

    // Rasm faqat shu mahsulotda avval bor bo‘lgan yoki o‘z papkamizga yuklangan bo‘lishi mumkin —
    // begona saytdagi rasm manzilini qo‘yib bo‘lmaydi.
    const knownImages = new Set(existing?.images ?? []);
    const foreign = parsed.data.images.filter((url) => !knownImages.has(url) && !isOwnUploadedImage(url) && !LOCAL_IMAGE.test(url));
    if (foreign.length > 0) {
      return { ok: false, error: "Rasmlardan biri noma’lum manzildan. Uni o‘chirib, qayta yuklang.", fieldErrors: { images: "Noma’lum rasm manzili" } };
    }

    const [brands, categories] = await Promise.all([getBrands(), getCategories()]);
    const taxonomyErrors = validateTaxonomy(parsed.data, {
      brandIds: new Set(brands.map((b) => b.id)),
      leafCategoryIds: new Set(getLeafCategories(categories).map((c) => c.id)),
    });
    if (Object.keys(taxonomyErrors).length > 0) {
      return { ok: false, error: "Brend yoki kategoriya topilmadi — ro‘yxatdan qayta tanlang.", fieldErrors: taxonomyErrors };
    }

    const product = buildProductFromInput(parsed.data, existing, new Date().toISOString(), getRootId(parsed.data.categoryId, categories));
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

export type QuickEditResult =
  | { ok: true; updatedAt: string }
  | { ok: false; error: string; variantErrors?: Record<string, string>; conflict?: boolean };

/** Ro‘yxatdan tez tahrir: faqat variantlarning narxi, eski narxi va qoldig‘i. */
export async function quickEditAction(values: unknown): Promise<QuickEditResult> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan — saqlab bo‘lmaydi." };

  const parsed = quickEditSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ma’lumot noto‘g‘ri." };

  try {
    const existing = await getProductForAdmin(parsed.data.id);
    if (!existing) return { ok: false, error: "Mahsulot topilmadi — ehtimol o‘chirilgan." };

    const applied = applyQuickEdit(existing, parsed.data, new Date().toISOString());
    if ("errors" in applied) {
      return { ok: false, error: "Ba’zi qatorlarni tekshiring.", variantErrors: applied.errors };
    }
    if (!productSchema.safeParse(applied.product).success) {
      return { ok: false, error: "Ma’lumotni saqlab bo‘lmadi: tekshiruvdan o‘tmadi." };
    }
    const saved = await updateProduct(applied.product, parsed.data.updatedAt);
    updateTag(PRODUCTS_TAG);
    return { ok: true, updatedAt: saved.updatedAt };
  } catch (error) {
    if (error instanceof ProductConflictError) {
      return { ok: false, conflict: true, error: "Bu mahsulot boshqa joyda o‘zgartirilgan. Sahifani yangilab, qayta urinib ko‘ring." };
    }
    if (error instanceof ProductNotFoundError) return { ok: false, error: "Mahsulot topilmadi — ehtimol o‘chirilgan." };
    console.error("[admin/products] tez tahrir:", error);
    return { ok: false, error: "Saqlashda kutilmagan xato. Internetni tekshirib, qayta urinib ko‘ring." };
  }
}

/** Mahsulotni butunlay o‘chiradi va ro‘yxatga qaytaradi. Buyurtmalardagi nusxa saqlanadi. */
export async function deleteProductAction(id: string): Promise<{ ok: false; error: string }> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan — o‘chirib bo‘lmaydi." };
  if (typeof id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return { ok: false, error: "Noto‘g‘ri mahsulot." };

  let name: string;
  try {
    const existing = await getProductForAdmin(id);
    if (!existing) return { ok: false, error: "Mahsulot topilmadi — ehtimol allaqachon o‘chirilgan." };
    name = existing.name;
    await deleteProduct(id);
  } catch (error) {
    if (error instanceof ProductNotFoundError) return { ok: false, error: "Mahsulot topilmadi — ehtimol allaqachon o‘chirilgan." };
    console.error("[admin/products] o‘chirishda xato:", error);
    return { ok: false, error: "O‘chirib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring." };
  }
  updateTag(PRODUCTS_TAG);
  redirect(`/admin/mahsulotlar?ochirildi=${encodeURIComponent(name)}`);
}

"use server";

import { updateTag } from "next/cache";
import { flattenIssues } from "@/lib/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { isOwnUploadedImage } from "@/lib/db/storage";
import { DbError, isDbConfigured } from "@/lib/db/supabase";
import { HOME_TAG, saveHomeSettings } from "@/lib/repo/home";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import { homeSettingsSchema } from "@/lib/settings/home-settings";

export type SaveHomeResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function saveHomeSettingsAction(values: unknown): Promise<SaveHomeResult> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan — bosh sahifani saqlab bo‘lmaydi." };

  const parsed = homeSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Ba’zi maydonlar noto‘g‘ri. Qizil bilan belgilangan joylarni tekshiring.",
      fieldErrors: flattenIssues(parsed.error.issues),
    };
  }
  const home = parsed.data;

  const fieldErrors: Record<string, string> = {};
  try {
    // Tanlangan mahsulotlar mavjud va saytda ko‘rinadigan bo‘lsin.
    const products = new Map((await getAllProductsForAdmin()).map((p) => [p.slug, p]));
    const checkProduct = (slug: string, path: string) => {
      const product = products.get(slug);
      if (!product) fieldErrors[path] = "Bu mahsulot topilmadi — boshqasini tanlang";
      else if (!product.isPublished) fieldErrors[path] = "Bu mahsulot yashirin — avval uni saytga chiqaring yoki boshqasini tanlang";
    };
    checkProduct(home.hero.productSlug, "hero.productSlug");
    if (home.featuresEnabled) home.features.forEach((f, i) => checkProduct(f.productSlug, `features.${i}.productSlug`));
    // Rasm faqat admin paneldan shu do‘kon papkasiga yuklangan bo‘lishi mumkin.
    home.banners.forEach((b, i) => {
      if (b.image && !isOwnUploadedImage(b.image)) fieldErrors[`banners.${i}.image`] = "Rasmni qaytadan yuklang";
    });
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, error: "Ba’zi maydonlar noto‘g‘ri. Qizil bilan belgilangan joylarni tekshiring.", fieldErrors };
    }

    await saveHomeSettings(home);
  } catch (error) {
    console.error("[admin/home] saqlashda xato:", error);
    if (error instanceof DbError && (error.status === 404 || (error.status === 400 && error.message.includes("settings_id_check")))) {
      return { ok: false, error: "Bazada bosh sahifa uchun joy yo‘q — Supabase SQL Editor’da 0007_home.sql ni ishga tushiring." };
    }
    return { ok: false, error: "Saqlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring." };
  }
  updateTag(HOME_TAG);
  return { ok: true };
}

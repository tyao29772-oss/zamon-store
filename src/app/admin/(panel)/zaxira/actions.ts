"use server";

import { updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { DEMO_CONFIRM_WORD, isDemoConfirmed } from "@/lib/admin/demo-confirm";
import { isDemoProductId } from "@/lib/admin/demo-data";
import { deleteUploadedImages } from "@/lib/db/storage";
import { isDbConfigured } from "@/lib/db/supabase";
import { getHomeSettings } from "@/lib/repo/home";
import { deleteProductsByIds } from "@/lib/repo/products-admin";
import { getAllProductsForAdmin, PRODUCTS_TAG } from "@/lib/repo/products";

export type DemoCleanupResult = { ok: true; deleted: number; images: number } | { ok: false; error: string };

/**
 * Do‘konni haqiqiy ishga tayyorlash: dastur bilan kelgan namunaviy mahsulotlarni o‘chiradi.
 * Admin o‘zi qo‘shgan mahsulotlarga tegilmaydi. Buyurtmalardagi nomi/narxi nusxa — ular buzilmaydi.
 */
export async function deleteDemoProductsAction(confirm: string): Promise<DemoCleanupResult> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan." };
  if (typeof confirm !== "string" || !isDemoConfirmed(confirm)) {
    return { ok: false, error: `Tasdiqlash uchun «${DEMO_CONFIRM_WORD}» deb yozing.` };
  }

  try {
    const all = await getAllProductsForAdmin();
    const demo = all.filter((p) => isDemoProductId(p.id));
    if (demo.length === 0) return { ok: true, deleted: 0, images: 0 };

    const deleted = await deleteProductsByIds(demo.map((p) => p.id));

    // Namunaviy mahsulotlarga admin yuklagan rasmlar — boshqa joyda ishlatilmasa, Storage’dan ham.
    const remaining = all.filter((p) => !isDemoProductId(p.id));
    const home = await getHomeSettings();
    const stillUsed = new Set([...remaining.flatMap((p) => p.images), ...home.banners.map((b) => b.image)]);
    const images = await deleteUploadedImages(deleted.flatMap((p) => p.images).filter((url) => !stillUsed.has(url)));

    updateTag(PRODUCTS_TAG);
    return { ok: true, deleted: deleted.length, images };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[admin/demo] o‘chirishda xato:", error);
    return { ok: false, error: "O‘chirib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring." };
  }
}

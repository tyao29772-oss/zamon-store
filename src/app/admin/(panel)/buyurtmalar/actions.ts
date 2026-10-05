"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { DbError, isDbConfigured } from "@/lib/db/supabase";
import { getOrderById, updateOrder } from "@/lib/repo/orders";
import { PRODUCTS_TAG } from "@/lib/repo/products";
import { getProductForAdmin, ProductConflictError, updateProduct } from "@/lib/repo/products-admin";
import type { Order, OrderStatus } from "@/types";

export type OrderActionResult =
  | { ok: true; order: Order; notice?: string }
  | { ok: false; error: string };

const idSchema = z.string().regex(/^QP-[A-Z0-9]{1,20}$/);
const statusSchema = z.enum(["new", "contacted", "done", "cancelled"]);

/** Bazada 0004-migratsiya ustunlari yo‘q bo‘lsa — tushunarli xabar. */
function explain(error: unknown): string {
  if (error instanceof DbError && error.status === 400 && /admin_note|stock_deducted|PGRST204/.test(error.message)) {
    return "Bazada yangi ustunlar yo‘q — Supabase SQL Editor’da 0004_orders_admin.sql ni ishga tushiring.";
  }
  return "Saqlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.";
}

/**
 * Variant qoldig‘ini `delta` ga o‘zgartiradi (0 dan pastga tushmaydi). Boshqa joyda bir vaqtda
 * tahrirlangan bo‘lsa — bir marta yangi versiya bilan qayta urinadi.
 */
async function adjustStock(productId: string, variantId: string, delta: number): Promise<"ok" | "missing"> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const product = await getProductForAdmin(productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    if (!product || !variant) return "missing";
    const next = {
      ...product,
      variants: product.variants.map((v) => (v.id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v)),
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateProduct(next, product.updatedAt);
      updateTag(PRODUCTS_TAG);
      return "ok";
    } catch (error) {
      if (!(error instanceof ProductConflictError) || attempt === 1) throw error;
    }
  }
  return "ok";
}

/**
 * Holatni o‘zgartiradi. `stock`:
 *  • "deduct"  — «Bajarildi»: qoldiqdan 1 dona ayiriladi (faqat bir marta);
 *  • "restore" — bekor/qaytarilganda ayirilgan 1 dona qoldiqqa qaytariladi;
 *  • "none"    — qoldiqqa tegilmaydi.
 */
export async function updateOrderStatusAction(id: string, status: OrderStatus, stock: "deduct" | "restore" | "none"): Promise<OrderActionResult> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan — buyurtmani o‘zgartirib bo‘lmaydi." };
  if (!idSchema.safeParse(id).success || !statusSchema.safeParse(status).success || !["deduct", "restore", "none"].includes(stock)) {
    return { ok: false, error: "Noto‘g‘ri so‘rov." };
  }

  try {
    const order = await getOrderById(id);
    if (!order) return { ok: false, error: "Buyurtma topilmadi." };

    const deduct = stock === "deduct" && status === "done" && !order.stockDeducted;
    const restore = stock === "restore" && status !== "done" && Boolean(order.stockDeducted);

    // Avval buyurtma (belgi bilan), keyin qoldiq — qoldiq o‘zgarmasa, belgi qaytariladi.
    const updated = await updateOrder(id, {
      status,
      ...(deduct ? { stockDeducted: true } : restore ? { stockDeducted: false } : {}),
    });
    if (!updated) return { ok: false, error: "Buyurtma topilmadi." };

    if (deduct || restore) {
      try {
        const result = await adjustStock(order.productId, order.variantId, deduct ? -1 : 1);
        if (result === "missing") {
          const reverted = await updateOrder(id, { stockDeducted: order.stockDeducted ?? false });
          return {
            ok: true,
            order: reverted ?? updated,
            notice: "Holat o‘zgardi, lekin mahsulot yoki variant o‘chirilgan — qoldiq o‘zgartirilmadi.",
          };
        }
      } catch (error) {
        console.error("[admin/orders] qoldiqni o‘zgartirib bo‘lmadi:", error);
        const reverted = await updateOrder(id, { stockDeducted: order.stockDeducted ?? false }).catch(() => null);
        return { ok: true, order: reverted ?? updated, notice: "Holat o‘zgardi, lekin qoldiqni o‘zgartirib bo‘lmadi — mahsulotni qo‘lda tekshiring." };
      }
      return { ok: true, order: { ...updated }, notice: deduct ? "Qoldiqdan 1 dona ayirildi." : "1 dona qoldiqqa qaytarildi." };
    }
    return { ok: true, order: updated };
  } catch (error) {
    console.error("[admin/orders] holat:", error);
    return { ok: false, error: explain(error) };
  }
}

export async function updateOrderNoteAction(id: string, note: string): Promise<OrderActionResult> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan — izohni saqlab bo‘lmaydi." };
  if (!idSchema.safeParse(id).success || typeof note !== "string") return { ok: false, error: "Noto‘g‘ri so‘rov." };
  const clean = note.trim();
  if (clean.length > 1000) return { ok: false, error: "Izoh 1000 belgidan oshmasin." };
  try {
    const updated = await updateOrder(id, { adminNote: clean || null });
    if (!updated) return { ok: false, error: "Buyurtma topilmadi." };
    return { ok: true, order: updated };
  } catch (error) {
    console.error("[admin/orders] izoh:", error);
    return { ok: false, error: explain(error) };
  }
}

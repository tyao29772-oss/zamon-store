import "server-only";
import { allProducts } from "@/data/products";
import { DbError, dbDelete, dbInsert, dbSelectAll, dbUpdate, isDbConfigured } from "@/lib/db/supabase";
import { productToRow, rowToProduct, type ProductRow } from "@/lib/repo/product-rows";
import { withPhotos } from "@/lib/repo/products";
import type { Product } from "@/types";

/**
 * Admin uchun mahsulot yozish/o‘qish. O‘qish keshsiz — tahrirlash formasi har doim
 * bazadagi eng so‘nggi holatni (va aniq `updated_at` ni) ko‘rishi kerak.
 */

const TABLE = "products";

export class ProductConflictError extends Error {}
export class ProductExistsError extends Error {}
export class ProductNotFoundError extends Error {}

export async function getProductForAdmin(id: string): Promise<Product | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return null;
  if (!isDbConfigured()) {
    const product = allProducts.find((p) => p.id === id);
    return product ? withPhotos(product) : null;
  }
  const rows = await dbSelectAll<ProductRow>(TABLE, `select=*&id=eq.${encodeURIComponent(id)}`);
  return rows[0] ? rowToProduct(rows[0]) : null;
}

/** Mahsulotni butunlay o‘chiradi. Buyurtmalarda nomi va narxi nusxa sifatida saqlangan — ular buzilmaydi. */
export async function deleteProduct(id: string): Promise<void> {
  const rows = await dbDelete<ProductRow>(TABLE, `id=eq.${encodeURIComponent(id)}`);
  if (rows.length === 0) throw new ProductNotFoundError(id);
}

/** Bir nechta mahsulotni o‘chiradi (so‘rov manzili uzun bo‘lmasligi uchun bo‘lib-bo‘lib). O‘chirilganlarini qaytaradi. */
export async function deleteProductsByIds(ids: string[]): Promise<Product[]> {
  const safe = ids.filter((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id));
  const deleted: Product[] = [];
  for (let i = 0; i < safe.length; i += 40) {
    const chunk = safe.slice(i, i + 40);
    const rows = await dbDelete<ProductRow>(TABLE, `id=in.(${chunk.join(",")})`);
    deleted.push(...rows.map(rowToProduct));
  }
  return deleted;
}

export async function insertProduct(product: Product): Promise<Product> {
  try {
    const row = await dbInsert<ProductRow>(TABLE, productToRow(product) as unknown as Record<string, unknown>);
    return rowToProduct(row);
  } catch (error) {
    // 409 — birlamchi kalit (manzil) band.
    if (error instanceof DbError && error.status === 409) throw new ProductExistsError(product.id);
    throw error;
  }
}

/**
 * Faqat forma ochilgandagi versiya (`expectedUpdatedAt`) bazadagi bilan bir xil bo‘lsa
 * yangilaydi — aks holda kimdir (boshqa oynada) o‘zgartirgan, ustidan yozilmaydi.
 */
export async function updateProduct(product: Product, expectedUpdatedAt: string): Promise<Product> {
  // id/slug (manzil) va yaratilgan vaqt o‘zgarmaydi — yangilanishga kiritilmaydi.
  const patch: Partial<ProductRow> = productToRow(product);
  delete patch.id;
  delete patch.slug;
  delete patch.created_at;
  const query = `id=eq.${encodeURIComponent(product.id)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`;
  const rows = await dbUpdate<ProductRow>(TABLE, query, patch as unknown as Record<string, unknown>);
  if (rows[0]) return rowToProduct(rows[0]);

  const current = await getProductForAdmin(product.id);
  if (!current) throw new ProductNotFoundError(product.id);
  throw new ProductConflictError(product.id);
}

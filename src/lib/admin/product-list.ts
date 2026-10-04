import { getDiscountPercent, getProductStockStatus, LOW_STOCK_THRESHOLD } from "@/lib/product";
import { normalizeText } from "@/lib/search/normalize";
import type { Product, StockStatus } from "@/types";

/**
 * Admin «Mahsulotlar» ro‘yxati: qidiruv, filtr, saralash va holat bo‘yicha sanoq.
 * Sof funksiyalar — holat URL'da (`?q=&holat=&...`), sahifa server komponent.
 */

export const ADMIN_STATUS_FILTERS = [
  { key: "hammasi", label: "Hammasi" },
  { key: "saytda", label: "Saytda" },
  { key: "yashirin", label: "Yashirilgan" },
  { key: "kam", label: "Kam qolgan" },
  { key: "tugagan", label: "Tugagan" },
  { key: "chegirma", label: "Chegirmada" },
] as const;

export type AdminStatusFilter = (typeof ADMIN_STATUS_FILTERS)[number]["key"];

export const ADMIN_SORTS = [
  { key: "yangi", label: "Avval yangilari" },
  { key: "tahrir", label: "Oxirgi tahrirlangan" },
  { key: "nomi", label: "Nomi (A–Z)" },
  { key: "narx-osish", label: "Narx: arzonidan" },
  { key: "narx-kamayish", label: "Narx: qimmatidan" },
  { key: "qoldiq", label: "Qoldiq: kamidan" },
] as const;

export type AdminSort = (typeof ADMIN_SORTS)[number]["key"];

export interface AdminProductRow {
  product: Product;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  variantCount: number;
  stockStatus: StockStatus;
  maxDiscount: number;
}

export interface AdminListQuery {
  q: string;
  status: AdminStatusFilter;
  categoryIds: Set<string> | null;
  brandId: string | null;
  sort: AdminSort;
}

/**
 * Admin uchun holat JAMI qoldiqdan olinadi (do‘kon kartasidagi belgi esa eng yaxshi variantga
 * qaraydi): 0 — tugagan (yoki oldindan buyurtma), 1–3 — kam qoldi, undan ko‘p — mavjud.
 */
function adminStockStatus(product: Product, totalStock: number): StockStatus {
  if (totalStock === 0) return getProductStockStatus(product) === "preorder" ? "preorder" : "out_of_stock";
  return totalStock <= LOW_STOCK_THRESHOLD ? "low" : "in_stock";
}

export function toAdminRow(product: Product): AdminProductRow {
  const prices = product.variants.map((v) => v.price);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  return {
    product,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    totalStock,
    variantCount: product.variants.length,
    stockStatus: adminStockStatus(product, totalStock),
    maxDiscount: Math.max(0, ...product.variants.map((v) => getDiscountPercent(v.price, v.oldPrice))),
  };
}

function matchesStatus(row: AdminProductRow, status: AdminStatusFilter): boolean {
  switch (status) {
    case "hammasi":
      return true;
    case "saytda":
      return row.product.isPublished;
    case "yashirin":
      return !row.product.isPublished;
    case "kam":
      return row.stockStatus === "low";
    case "tugagan":
      return row.stockStatus === "out_of_stock";
    case "chegirma":
      return row.maxDiscount > 0;
  }
}

export function countByStatus(rows: AdminProductRow[]): Record<AdminStatusFilter, number> {
  const counts = Object.fromEntries(ADMIN_STATUS_FILTERS.map((f) => [f.key, 0])) as Record<
    AdminStatusFilter,
    number
  >;
  for (const row of rows) {
    for (const { key } of ADMIN_STATUS_FILTERS) if (matchesStatus(row, key)) counts[key] += 1;
  }
  return counts;
}

/** Nom, model, slug va SKU bo‘yicha (katta-kichik harf, o‘/g‘ farqisiz) qidiradi. */
function matchesQuery(product: Product, query: string): boolean {
  if (!query) return true;
  const haystack = normalizeText(
    [product.name, product.model ?? "", product.slug, ...product.variants.map((v) => v.sku)].join(" "),
  );
  return normalizeText(query)
    .split(" ")
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

const COMPARATORS: Record<AdminSort, (a: AdminProductRow, b: AdminProductRow) => number> = {
  yangi: (a, b) => b.product.createdAt.localeCompare(a.product.createdAt),
  tahrir: (a, b) => b.product.updatedAt.localeCompare(a.product.updatedAt),
  nomi: (a, b) => a.product.name.localeCompare(b.product.name, "uz"),
  "narx-osish": (a, b) => a.minPrice - b.minPrice,
  "narx-kamayish": (a, b) => b.maxPrice - a.maxPrice,
  qoldiq: (a, b) => a.totalStock - b.totalStock,
};

export function filterAdminRows(rows: AdminProductRow[], query: AdminListQuery): AdminProductRow[] {
  return rows
    .filter(
      (row) =>
        matchesStatus(row, query.status) &&
        (!query.categoryIds || query.categoryIds.has(row.product.categoryId)) &&
        (!query.brandId || row.product.brandId === query.brandId) &&
        matchesQuery(row.product, query.q),
    )
    .sort((a, b) => COMPARATORS[query.sort](a, b) || a.product.name.localeCompare(b.product.name, "uz"));
}

export function parseStatus(value: unknown): AdminStatusFilter {
  return ADMIN_STATUS_FILTERS.some((f) => f.key === value) ? (value as AdminStatusFilter) : "hammasi";
}

export function parseSort(value: unknown): AdminSort {
  return ADMIN_SORTS.some((s) => s.key === value) ? (value as AdminSort) : "yangi";
}

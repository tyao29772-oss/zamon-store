import "server-only";
import { allProducts } from "@/data/products";

/**
 * Dastur bilan birga keladigan namunaviy mahsulotlar (`src/data/products`). Ular faqat
 * ko‘rsatish uchun — haqiqiy do‘kon ishga tushishidan oldin admin «Zaxira» bo‘limidan o‘chiradi.
 */
const DEMO_IDS = new Set(allProducts.map((p) => p.id));

export function isDemoProductId(id: string): boolean {
  return DEMO_IDS.has(id);
}

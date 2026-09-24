import { brands } from "@/data/brands";
import { categories } from "@/data/categories";
import { allProducts } from "@/data/products";
import { createSearchEngine, type SearchHit } from "@/lib/search";

/**
 * Qidiruv indeksi ilova ishga tushganda bir marta quriladi (mock data hozircha o‘zgarmas).
 * Repository funksiyasi baribir `async` — keyin DB'ga o‘tganda chaqiruvchi kod o‘zgarmaydi.
 */
const engine = createSearchEngine(
  allProducts.filter((p) => p.isPublished),
  new Map(brands.map((b) => [b.id, b])),
  new Map(categories.map((c) => [c.id, c])),
);

export async function searchProducts(query: string, limit = 24): Promise<SearchHit[]> {
  return engine.search(query, limit);
}

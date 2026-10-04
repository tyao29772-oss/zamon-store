import { brands } from "@/data/brands";
import { categories } from "@/data/categories";
import { getAllProducts } from "@/lib/repo/products";
import { createSearchEngine, type SearchHit } from "@/lib/search";
import type { Product } from "@/types";

/**
 * Qidiruv indeksi xotirada saqlanadi va faqat mahsulotlar ro‘yxati o‘zgarganda (soni yoki
 * oxirgi tahrir vaqti) qayta quriladi — har qidiruvda indeks qurilmaydi.
 */
let cached: { version: string; engine: ReturnType<typeof createSearchEngine> } | null = null;

function versionOf(products: Product[]): string {
  let latest = "";
  for (const p of products) if (p.updatedAt > latest) latest = p.updatedAt;
  return `${products.length}:${latest}`;
}

async function getEngine() {
  const products = await getAllProducts();
  const version = versionOf(products);
  if (cached?.version !== version) {
    cached = {
      version,
      engine: createSearchEngine(
        products,
        new Map(brands.map((b) => [b.id, b])),
        new Map(categories.map((c) => [c.id, c])),
      ),
    };
  }
  return cached.engine;
}

export async function searchProducts(query: string, limit = 24): Promise<SearchHit[]> {
  return (await getEngine()).search(query, limit);
}

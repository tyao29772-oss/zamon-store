import { getAllProducts } from "@/lib/repo/products";
import { loadTaxonomy } from "@/lib/repo/taxonomy";
import { createSearchEngine, type SearchHit } from "@/lib/search";
import type { Brand, Category, Product } from "@/types";

/**
 * Qidiruv indeksi xotirada saqlanadi va faqat mahsulotlar, brendlar yoki kategoriyalar
 * o‘zgarganda qayta quriladi — har qidiruvda indeks qurilmaydi.
 */
let cached: { version: string; engine: ReturnType<typeof createSearchEngine> } | null = null;

function versionOf(products: Product[], brands: Brand[], categories: Category[]): string {
  let latest = "";
  for (const p of products) if (p.updatedAt > latest) latest = p.updatedAt;
  // Brend/kategoriya nomi o‘zgarsa ham qidiruv yangilansin (masalan, «Vivo» qo‘shildi).
  const names = [...brands.map((b) => `${b.id}=${b.name}`), ...categories.map((c) => `${c.id}=${c.name}`)].join("|");
  return `${products.length}:${latest}:${names}`;
}

async function getEngine() {
  const [products, { brands, categories }] = await Promise.all([getAllProducts(), loadTaxonomy()]);
  const version = versionOf(products, brands, categories);
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

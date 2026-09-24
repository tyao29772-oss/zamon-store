import MiniSearch from "minisearch";
import { SYNONYM_GROUPS } from "@/config/synonyms";
import { toStringList } from "@/lib/product";
import { normalizeText, tokenize } from "@/lib/search/normalize";
import type { Brand, Category, Product } from "@/types";

/**
 * Butun katalog bo‘ylab qidiruv: MiniSearch ustida, `tokenize()` (stage 1'da test qilingan
 * normalizatsiya — kirill, apostrof, x/h) orqali indekslanadi va so‘raladi, shunda index va
 * so‘rov bir xil qoidalar bilan ishlaydi.
 */

interface SearchDoc {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  keywords: string;
  attributes: string;
}

const FIELDS: (keyof Omit<SearchDoc, "id">)[] = ["name", "brand", "model", "category", "keywords", "attributes"];

function attributeText(product: Product): string {
  return Object.values(product.attributes).flatMap((v) => toStringList(v)).join(" ");
}

function buildDoc(product: Product, brand: Brand | undefined, category: Category | undefined): SearchDoc {
  return {
    id: product.id,
    name: product.name,
    brand: brand?.name ?? "",
    model: product.model ?? "",
    category: category?.name ?? "",
    keywords: product.keywords.join(" "),
    attributes: attributeText(product),
  };
}

function buildIndex(products: Product[], brands: Map<string, Brand>, categories: Map<string, Category>) {
  const index = new MiniSearch<SearchDoc>({
    idField: "id",
    fields: FIELDS,
    tokenize,
    processTerm: (term) => term || null,
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { name: 4, brand: 2.5, model: 2.5, category: 1.5, keywords: 1.2, attributes: 1 },
    },
  });
  const docs = products.map((p) => buildDoc(p, brands.get(p.brandId), categories.get(p.categoryId)));
  index.addAll(docs);
  return index;
}

/** Bitta-so‘zli sinonimlar uchun: token → shu guruhdagi barcha tokenlar (o‘zi bilan birga). */
const SYNONYM_EXPANSION = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const normalized = [...new Set(group.map(normalizeText).filter((t) => t && !t.includes(" ")))];
  if (normalized.length < 2) continue;
  for (const term of normalized) {
    SYNONYM_EXPANSION.set(term, new Set(normalized));
  }
}

/** So‘rovdagi har bir so‘zni sinonimlari bilan kengaytiradi (masalan `zaryadchik` → `+adapter +charger …`). */
export function expandSearchQuery(rawQuery: string): string {
  const tokens = tokenize(rawQuery);
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const group = SYNONYM_EXPANSION.get(token);
    if (group) for (const term of group) expanded.add(term);
  }
  return [...expanded].join(" ");
}

export interface SearchHit {
  product: Product;
  score: number;
}

export interface SearchEngine {
  search: (rawQuery: string, limit?: number) => SearchHit[];
}

/** `products`/`brands`/`categories` bir marta beriladi, keyingi barcha `search()` chaqiruvlari shundan foydalanadi. */
export function createSearchEngine(
  products: Product[],
  brands: Map<string, Brand>,
  categories: Map<string, Category>,
): SearchEngine {
  const index = buildIndex(products, brands, categories);
  const byId = new Map(products.map((p) => [p.id, p]));

  return {
    search(rawQuery, limit = 24) {
      const query = expandSearchQuery(rawQuery);
      if (!query) return [];
      return index
        .search(query)
        .map((result) => ({ product: byId.get(String(result.id)), score: result.score }))
        .filter((hit): hit is SearchHit => Boolean(hit.product))
        .slice(0, limit);
    },
  };
}

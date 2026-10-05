import { NextResponse } from "next/server";
import { getPriceInfo, getProductStockStatus } from "@/lib/product";
import { getBrands } from "@/lib/repo/brands";
import { getCategories } from "@/lib/repo/categories";
import { searchProducts } from "@/lib/repo/search";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { productHref } from "@/lib/urls";

/** Har bir harf yozilganda so‘rov keladi — oddiy foydalanuvchi uchun keng, bot uchun tor. */
const RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_QUERY_LENGTH = 100;

export interface SearchSuggestion {
  slug: string;
  name: string;
  brandName: string | null;
  categoryName: string | null;
  price: number;
  hasDiscount: boolean;
  stockStatus: ReturnType<typeof getProductStockStatus>;
  href: string;
}

/** Header'dagi tezkor takliflar uchun yengil (rasmsiz) natijalar. To‘liq natija: `/qidiruv`. */
export async function GET(request: Request): Promise<NextResponse> {
  if (!checkRateLimit(`search:${getClientIp(request)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS).allowed) {
    return NextResponse.json({ error: "Juda ko‘p so‘rov. Birozdan so‘ng urinib ko‘ring." }, { status: 429 });
  }
  const query = (new URL(request.url).searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH);
  const [hits, brands, categories] = await Promise.all([
    searchProducts(query, 6),
    getBrands(),
    getCategories(),
  ]);
  const brandById = new Map(brands.map((b) => [b.id, b]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const suggestions: SearchSuggestion[] = hits.map(({ product }) => {
    const price = getPriceInfo(product);
    return {
      slug: product.slug,
      name: product.name,
      brandName: brandById.get(product.brandId)?.name ?? null,
      categoryName: categoryById.get(product.categoryId)?.name ?? null,
      price: price.price,
      hasDiscount: price.hasDiscount,
      stockStatus: getProductStockStatus(product),
      href: productHref(product.slug),
    };
  });

  return NextResponse.json({ query, results: suggestions });
}

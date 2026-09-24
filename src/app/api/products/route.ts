import { NextResponse } from "next/server";
import { getBrandsByIds } from "@/lib/repo/brands";
import { getProductsByIds } from "@/lib/repo/products";
import type { Brand, Product } from "@/types";

export interface ProductsResponse {
  products: Product[];
  brands: Brand[];
}

const MAX_IDS = 100;

/** Sevimlilar sahifasi uchun: `?ids=a,b,c` bo‘yicha to‘liq mahsulot + brend ma’lumoti. */
export async function GET(request: Request): Promise<NextResponse<ProductsResponse>> {
  const idsParam = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = [
    ...new Set(
      idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_IDS);

  const products = await getProductsByIds(ids);
  const brands = await getBrandsByIds([...new Set(products.map((p) => p.brandId))]);

  return NextResponse.json({ products, brands });
}

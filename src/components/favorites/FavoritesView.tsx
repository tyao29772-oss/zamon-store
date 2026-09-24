"use client";

import { useEffect, useState } from "react";
import { Heart, TriangleAlert } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFavorites } from "@/hooks/useFavorites";
import { formatCount } from "@/lib/format";
import type { ProductsResponse } from "@/app/api/products/route";

/** `/sevimlilar`: localStorage'dagi ID'lar bo‘yicha `/api/products` orqali to‘liq mahsulot olinadi. */
export function FavoritesView() {
  const { ids } = useFavorites();
  const idsKey = ids.join(",");

  const [data, setData] = useState<ProductsResponse | null>(null);
  // So‘nggi muvaffaqiyatli/yakunlangan so‘rov qaysi `idsKey` uchun ekanini saqlaydi — shundan
  // "loading" holati RENDER paytida hosil qilinadi, effect ichida alohida holat kerak emas.
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;

    fetch(`/api/products?ids=${encodeURIComponent(idsKey)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json() as Promise<ProductsResponse>;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setSettledKey(idsKey);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSettledKey(idsKey);
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  if (ids.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Sevimlilar bo‘sh"
        text="Yoqqan mahsulotlarni yurakcha tugmasi orqali shu yerga qo‘shing."
      >
        <ButtonLink href="/katalog">Katalogni ko‘rish</ButtonLink>
      </EmptyState>
    );
  }

  const loading = idsKey !== settledKey;

  if (error && !loading) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Yuklab bo‘lmadi"
        text="Sevimlilar ro‘yxatini olishda xatolik yuz berdi. Sahifani qayta yuklab ko‘ring."
      >
        <ButtonLink href="/sevimlilar">Qayta urinish</ButtonLink>
      </EmptyState>
    );
  }

  if (loading && !data) {
    return <ProductGridSkeleton count={ids.length} />;
  }

  const products = data?.products ?? [];
  const brands = new Map((data?.brands ?? []).map((b) => [b.id, b]));

  return (
    <div>
      <p className="text-sm text-ink-muted">{formatCount(products.length, "mahsulot")}</p>
      <div className="mt-4">
        <ProductGrid products={products} brands={brands} eagerCount={4} />
      </div>
    </div>
  );
}

import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Faqat `/aksiyalar` uchun — bu segmentda `notFound()` chaqirilmaydi, shuning uchun
 * loading.tsx qo‘yish xavfsiz (aks holda "soft 404": status 200 + noindex bo‘lib qoladi,
 * chunki javob bu Suspense chegarasidan boshlab oqib ketadi). Shu sabab `/katalog` va
 * `/brendlar` bo‘limlarida (ularning bolalari notFound() chaqiradi) loading.tsx qo‘yilmaydi.
 */
export default function Loading() {
  return (
    <main id="main" className="container-page pt-6 md:pt-10" aria-busy="true">
      <Skeleton className="h-4 w-40 rounded-full" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-10 w-56 rounded-full" />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <Skeleton className="hidden h-[420px] rounded-[24px] lg:block" />
        <ProductGridSkeleton count={8} />
      </div>
    </main>
  );
}

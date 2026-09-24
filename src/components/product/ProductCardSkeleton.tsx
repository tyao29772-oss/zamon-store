import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line/70">
      <Skeleton className="m-2 aspect-square rounded-[18px]" />
      <div className="space-y-2.5 px-4 pb-4 pt-2">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-3.5 w-2/3 rounded-full" />
        <Skeleton className="mt-4 h-5 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Mahsulotlar yuklanmoqda"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

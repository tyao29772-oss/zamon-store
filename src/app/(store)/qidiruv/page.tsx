import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductRail } from "@/components/home/ProductRail";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SearchTracker } from "@/components/search/SearchTracker";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { POPULAR_SEARCHES } from "@/config/synonyms";
import { formatCount } from "@/lib/format";
import { getBrands } from "@/lib/repo/brands";
import { getPopularProducts } from "@/lib/repo/products";
import { searchProducts } from "@/lib/repo/search";
import { searchHref } from "@/lib/urls";
import { getStore } from "@/lib/repo/store";

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/qidiruv">): Promise<Metadata> {
  const q = firstValue((await searchParams).q).trim();
  const { name } = await getStore();
  return {
    title: q ? `«${q}» bo‘yicha qidiruv` : "Qidiruv",
    description: `${name} katalogi bo‘ylab qidiring: telefon, noutbuk va aksessuarlar.`,
    robots: { index: false },
  };
}

/** «Ko‘p qidiriladi» sarlavhasi + chiplar — qidiruv landing va bo‘sh natija holatida qayta ishlatiladi. */
function PopularSearchesSection({ id }: { id: string }) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted"
      >
        <TrendingUp className="size-3.5" aria-hidden="true" />
        Ko‘p qidiriladi
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {POPULAR_SEARCHES.map((term) => (
          <li key={term}>
            <Link
              href={searchHref(term)}
              className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-ink/40"
            >
              {term}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SearchPage({ searchParams }: PageProps<"/qidiruv">) {
  const query = firstValue((await searchParams).q).trim();

  const [brandList, popular] = await Promise.all([getBrands(), getPopularProducts(8)]);
  const brands = new Map(brandList.map((b) => [b.id, b]));
  const hits = query ? await searchProducts(query, 60) : [];
  const products = hits.map((hit) => hit.product);

  return (
    <main id="main" className="container-page pt-6 md:pt-10">
      <Breadcrumbs items={[{ label: "Bosh sahifa", href: "/" }, { label: "Qidiruv" }]} />
      {query && <SearchTracker query={query} resultCount={products.length} />}

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Katalog bo‘ylab" title={query ? `«${query}»` : "Qidiruv"} />
      </div>

      <form method="get" action="/qidiruv" className="mt-6 flex max-w-xl items-center gap-2.5">
        <div className="flex h-12 flex-1 items-center gap-2.5 rounded-full border border-line bg-surface px-4">
          <Search className="size-[18px] shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="iPhone, Samsung, zaryadchik…"
            aria-label="Qidiruv so‘zi"
            autoComplete="off"
            className="h-full flex-1 min-w-0 bg-transparent text-[15px] outline-none placeholder:text-ink-muted"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          Qidirish
        </button>
      </form>

      {query ? (
        <div className="mt-8">
          {products.length > 0 ? (
            <>
              <p className="text-sm text-ink-muted">
                «{query}» bo‘yicha {formatCount(products.length, "mahsulot")} topildi
              </p>
              <div className="mt-6">
                <ProductGrid products={products} brands={brands} eagerCount={4} />
              </div>
            </>
          ) : (
            <div className="space-y-10">
              <EmptyState
                icon={SearchX}
                title={`«${query}» bo‘yicha natija topilmadi`}
                text="Yozuvni tekshirib ko‘ring yoki boshqa so‘z bilan qidiring."
              />
              <PopularSearchesSection id="popular-searches-empty" />
              <ProductRail
                id="popular-fallback"
                eyebrow="Sizga yoqishi mumkin"
                title="Mashhur mahsulotlar"
                href="/katalog"
                products={popular}
                brands={brands}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <PopularSearchesSection id="popular-searches-landing" />
          <ProductRail
            id="popular-landing"
            eyebrow="Tavsiya etamiz"
            title="Mashhur mahsulotlar"
            href="/katalog"
            products={popular}
            brands={brands}
          />
        </div>
      )}
    </main>
  );
}

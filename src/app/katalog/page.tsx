import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductFilters } from "@/components/catalog/ProductFilters";
import { SortSelect } from "@/components/catalog/SortSelect";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GENERIC_FILTERS } from "@/config/filters";
import { siteConfig } from "@/config/site";
import { applyFilters, countActiveFilters, paginate, parseFilters, sortProducts, toSearchParams } from "@/lib/catalog";
import { formatCount } from "@/lib/format";
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { getBrands } from "@/lib/repo/brands";
import { getRootCategories } from "@/lib/repo/categories";
import { getAllProducts } from "@/lib/repo/products";

const BASE_PATH = "/katalog";

export const metadata: Metadata = {
  title: "Katalog",
  description: "Barcha telefon, noutbuk va aksessuarlar — bitta sahifada. Filter va saralash bilan qidiring.",
  alternates: { canonical: BASE_PATH },
};

export default async function CatalogPage({ searchParams }: PageProps<"/katalog">) {
  const [sParams, allProducts, roots, brandList] = await Promise.all([
    searchParams,
    getAllProducts(),
    getRootCategories(),
    getBrands(),
  ]);

  const brands = new Map(brandList.map((b) => [b.id, b]));
  const fields = GENERIC_FILTERS;
  const sp = toSearchParams(sParams);
  const state = parseFilters(sParams, fields);

  const filtered = applyFilters(allProducts, state, fields);
  const sorted = sortProducts(filtered, state.sort);
  const { items, page, totalPages, total } = paginate(sorted, state.page, siteConfig.pageSize);

  const crumbs = [{ label: "Bosh sahifa", href: "/" }, { label: "Katalog" }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, BASE_PATH);

  return (
    <main id="main" className="container-page pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Barcha mahsulotlar" title="Katalog" />
      </div>

      <div className="mt-6">
        <SubcategoryChips categories={roots} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <ProductFilters basePath={BASE_PATH} sp={sp} products={allProducts} fields={fields} state={state} brands={brands} />
        </aside>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <FilterDrawer count={countActiveFilters(state)}>
                <ProductFilters basePath={BASE_PATH} sp={sp} products={allProducts} fields={fields} state={state} brands={brands} />
              </FilterDrawer>
            </div>
            <p className="hidden text-sm text-ink-muted lg:block">{formatCount(total, "mahsulot")} topildi</p>
            <SortSelect value={state.sort} />
          </div>

          {items.length > 0 ? (
            <>
              <div className="mt-6">
                <ProductGrid products={items} brands={brands} eagerCount={4} />
              </div>
              <Pagination basePath={BASE_PATH} sp={sp} page={page} totalPages={totalPages} />
            </>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={PackageSearch}
                title="Mos mahsulot topilmadi"
                text="Tanlangan filterga mos mahsulot yo‘q. Filterlarni o‘zgartirib ko‘ring yoki barchasini tozalang."
              >
                <ButtonLink href={BASE_PATH}>Filterni tozalash</ButtonLink>
              </EmptyState>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

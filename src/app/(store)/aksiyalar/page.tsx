import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductFilters } from "@/components/catalog/ProductFilters";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import {
  applyFilters,
  countActiveFilters,
  paginate,
  parseFilters,
  sortProducts,
  toSearchParams,
  type FilterField,
} from "@/lib/catalog";
import { formatCount } from "@/lib/format";
import { hasDiscount } from "@/lib/product";
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { getBrands } from "@/lib/repo/brands";
import { getAllProducts } from "@/lib/repo/products";

const FIELDS: FilterField[] = [
  { key: "brend", label: "Brend", source: "brand" },
  { key: "holat", label: "Holati", source: "variant.condition" },
];

const BASE_PATH = "/aksiyalar";
const DEFAULT_SORT = "chegirma" as const;

export const metadata: Metadata = {
  title: "Aksiyalar",
  description: "Chegirmadagi telefon, noutbuk va aksessuarlar — eng katta chegirmalardan boshlab.",
  alternates: { canonical: BASE_PATH },
};

export default async function SalePage({ searchParams }: PageProps<"/aksiyalar">) {
  const [sParams, allProducts, brandList] = await Promise.all([searchParams, getAllProducts(), getBrands()]);
  const brands = new Map(brandList.map((b) => [b.id, b]));
  const onSale = allProducts.filter(hasDiscount);

  const sp = toSearchParams(sParams);
  const state = parseFilters(sParams, FIELDS, DEFAULT_SORT);

  const filtered = applyFilters(onSale, state, FIELDS);
  const sorted = sortProducts(filtered, state.sort);
  const { items, page, totalPages, total } = paginate(sorted, state.page, siteConfig.pageSize);

  const crumbs = [{ label: "Bosh sahifa", href: "/" }, { label: "Aksiyalar" }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, BASE_PATH);

  return (
    <main id="main" className="container-page pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Chegirmadagi mahsulotlar" title="Aksiyalar" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <ProductFilters basePath={BASE_PATH} sp={sp} products={onSale} fields={FIELDS} state={state} brands={brands} />
        </aside>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <FilterDrawer count={countActiveFilters(state)}>
                <ProductFilters basePath={BASE_PATH} sp={sp} products={onSale} fields={FIELDS} state={state} brands={brands} />
              </FilterDrawer>
            </div>
            <p className="hidden text-sm text-ink-muted lg:block">{formatCount(total, "mahsulot")} topildi</p>
            <SortSelect value={state.sort} defaultSort={DEFAULT_SORT} />
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
                title="Hozircha aksiya yo‘q"
                text="Tez orada yangi chegirmalar qo‘shiladi. Hozircha butun katalogni ko‘rib chiqing."
              >
                <ButtonLink href="/katalog">Katalogni ko‘rish</ButtonLink>
              </EmptyState>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

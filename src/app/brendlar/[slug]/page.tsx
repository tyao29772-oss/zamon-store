import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { brandHref } from "@/lib/urls";
import { getBrandBySlug, getBrands } from "@/lib/repo/brands";
import { getProductsByBrand } from "@/lib/repo/products";

const FIELDS: FilterField[] = [{ key: "holat", label: "Holati", source: "variant.condition" }];

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/brendlar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return {
    title: brand.name,
    description: brand.description,
    alternates: { canonical: brandHref(brand.slug) },
  };
}

export default async function BrandPage({ params, searchParams }: PageProps<"/brendlar/[slug]">) {
  const [{ slug }, sParams] = await Promise.all([params, searchParams]);
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [products, brandList] = await Promise.all([getProductsByBrand(brand.id), getBrands()]);
  const brands = new Map(brandList.map((b) => [b.id, b]));
  const basePath = brandHref(brand.slug);
  const sp = toSearchParams(sParams);
  const state = parseFilters(sParams, FIELDS);

  const filtered = applyFilters(products, state, FIELDS);
  const sorted = sortProducts(filtered, state.sort);
  const { items, page, totalPages, total } = paginate(sorted, state.page, siteConfig.pageSize);

  const crumbs = [{ label: "Bosh sahifa", href: "/" }, { label: brand.name }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, basePath);

  return (
    <main id="main" className="container-page pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow={formatCount(total, "mahsulot")} title={brand.name} />
        <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">{brand.description}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <ProductFilters basePath={basePath} sp={sp} products={products} fields={FIELDS} state={state} brands={brands} />
        </aside>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <FilterDrawer count={countActiveFilters(state)}>
                <ProductFilters basePath={basePath} sp={sp} products={products} fields={FIELDS} state={state} brands={brands} />
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
              <Pagination basePath={basePath} sp={sp} page={page} totalPages={totalPages} />
            </>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={PackageSearch}
                title="Bu brendda hozircha mahsulot yo‘q"
                text="Boshqa brend yoki kategoriyani ko‘rib chiqing."
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

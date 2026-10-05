import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { getFilterFields } from "@/config/filters";
import { siteConfig } from "@/config/site";
import { applyFilters, countActiveFilters, paginate, parseFilters, sortProducts, toSearchParams } from "@/lib/catalog";
import { formatCount } from "@/lib/format";
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { getBrands } from "@/lib/repo/brands";
import {
  getCategoryByPath,
  getCategoryChain,
  getChildCategories,
  getRootCategoryId,
} from "@/lib/repo/categories";
import { getProductsByCategory } from "@/lib/repo/products";

export async function generateMetadata({
  params,
}: PageProps<"/katalog/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryByPath(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: category.href },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/katalog/[...slug]">) {
  const [{ slug }, sParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryByPath(slug);
  if (!category) notFound();

  const [chain, children, products, brandList, rootId] = await Promise.all([
    getCategoryChain(category.id),
    getChildCategories(category.id),
    getProductsByCategory(category.id),
    getBrands(),
    getRootCategoryId(category.id),
  ]);

  const brands = new Map(brandList.map((b) => [b.id, b]));
  const fields = getFilterFields(rootId, category.id);
  const sp = toSearchParams(sParams);
  const state = parseFilters(sParams, fields);

  const filtered = applyFilters(products, state, fields);
  const sorted = sortProducts(filtered, state.sort);
  const { items, page, totalPages, total } = paginate(sorted, state.page, siteConfig.pageSize);

  const crumbs = [
    { label: "Bosh sahifa", href: "/" },
    { label: "Katalog", href: "/katalog" },
    ...chain.map((c, index) => ({
      label: c.name,
      href: index < chain.length - 1 ? c.href : undefined,
    })),
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, category.href);

  return (
    <main id="main" className="container-page pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow={formatCount(total, "mahsulot")} title={category.name} />
        {category.description && <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">{category.description}</p>}
      </div>

      {children.length > 0 && (
        <div className="mt-6">
          <SubcategoryChips categories={children} />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <ProductFilters basePath={category.href} sp={sp} products={products} fields={fields} state={state} brands={brands} />
        </aside>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <FilterDrawer count={countActiveFilters(state)}>
                <ProductFilters basePath={category.href} sp={sp} products={products} fields={fields} state={state} brands={brands} />
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
              <Pagination basePath={category.href} sp={sp} page={page} totalPages={totalPages} />
            </>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={PackageSearch}
                title="Mos mahsulot topilmadi"
                text="Tanlangan filterga mos mahsulot yo‘q. Filterlarni o‘zgartirib ko‘ring yoki barchasini tozalang."
              >
                <ButtonLink href={category.href}>Filterni tozalash</ButtonLink>
              </EmptyState>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

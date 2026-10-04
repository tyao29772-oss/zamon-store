import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight, EyeOff, ExternalLink, PackageSearch, Search } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { StockBadge } from "@/components/product/StockBadge";
import {
  ADMIN_SORTS,
  ADMIN_STATUS_FILTERS,
  countByStatus,
  filterAdminRows,
  parseSort,
  parseStatus,
  toAdminRow,
  type AdminProductRow,
} from "@/lib/admin/product-list";
import { paginate } from "@/lib/catalog";
import { formatDiscount, formatNumber, formatPrice } from "@/lib/format";
import { getBrands } from "@/lib/repo/brands";
import { getCategories, getDescendantIds } from "@/lib/repo/categories";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import { productHref } from "@/lib/urls";

export const metadata: Metadata = { title: "Mahsulotlar" };

const PAGE_SIZE = 25;
const BASE = "/admin/mahsulotlar";

type Params = Record<string, string | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Joriy filtrlarni saqlagan holda bitta-ikkita parametrni almashtirib havola yasaydi. */
function hrefWith(params: Params, changes: Params): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...changes })) {
    if (value) next.set(key, value);
  }
  const query = next.toString();
  return query ? `${BASE}?${query}` : BASE;
}

function PriceCell({ row }: { row: AdminProductRow }) {
  return (
    <div className="whitespace-nowrap tabular-nums">
      <span className="font-semibold text-ink">{formatPrice(row.minPrice)}</span>
      {row.maxPrice > row.minPrice && (
        <span className="block text-xs text-ink-muted">gacha {formatPrice(row.maxPrice)}</span>
      )}
      {row.maxDiscount > 0 && (
        <span className="mt-1 inline-flex rounded-full bg-sale-soft px-2 py-0.5 text-[11px] font-semibold text-sale">
          {formatDiscount(row.maxDiscount)}
        </span>
      )}
    </div>
  );
}

function VisibilityBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex rounded-full bg-ok-soft px-2.5 py-1 text-[11px] font-semibold text-ok">Saytda</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
      <EyeOff className="size-3" aria-hidden="true" />
      Yashirin
    </span>
  );
}

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/mahsulotlar">) {
  await connection();
  const sp = await searchParams;
  const params: Params = {
    q: first(sp.q)?.trim().slice(0, 100) || undefined,
    holat: first(sp.holat),
    kategoriya: first(sp.kategoriya),
    brend: first(sp.brend),
    saralash: first(sp.saralash),
  };
  const status = parseStatus(params.holat);
  const sort = parseSort(params.saralash);
  const page = Number.parseInt(first(sp.sahifa) ?? "1", 10) || 1;

  const [products, categories, brands] = await Promise.all([getAllProductsForAdmin(), getCategories(), getBrands()]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const brandById = new Map(brands.map((b) => [b.id, b]));

  const category = params.kategoriya ? categoryById.get(params.kategoriya) : undefined;
  const categoryIds = category ? new Set(await getDescendantIds(category.id)) : null;
  const brandId = params.brend && brandById.has(params.brend) ? params.brend : null;

  const allRows = products.map(toAdminRow);
  // Holat tablaridagi sonlar boshqa filtrlar (qidiruv, kategoriya, brend) hisobga olingan holda.
  const scoped = filterAdminRows(allRows, { q: params.q ?? "", status: "hammasi", categoryIds, brandId, sort });
  const counts = countByStatus(scoped);
  const filtered = filterAdminRows(scoped, { q: "", status, categoryIds: null, brandId: null, sort });
  const result = paginate(filtered, page, PAGE_SIZE);

  const roots = categories.filter((c) => c.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder);
  const childrenOf = (id: string) =>
    categories.filter((c) => c.parentId === id).sort((a, b) => a.sortOrder - b.sortOrder);
  const hasFilters = Boolean(params.q || category || brandId || status !== "hammasi");
  const from = result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(result.page * PAGE_SIZE, result.total);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Mahsulotlar</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Jami {formatNumber(allRows.length)} ta mahsulot, {formatNumber(countByStatus(allRows).saytda)} tasi saytda.
          </p>
        </div>
      </div>

      {/* Holat tablari */}
      <nav aria-label="Holat bo‘yicha" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {ADMIN_STATUS_FILTERS.map((filter) => {
          const active = filter.key === status;
          return (
            <Link
              key={filter.key}
              href={hrefWith(params, { holat: filter.key === "hammasi" ? undefined : filter.key })}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink/40"
              }`}
            >
              {filter.label}
              <span className={`tabular-nums ${active ? "text-white/70" : "text-ink-muted"}`}>{counts[filter.key]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Qidiruv va filtrlar (JS'siz ham ishlaydi) */}
      <form action={BASE} className="mt-4 grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
        {status !== "hammasi" && <input type="hidden" name="holat" value={status} />}
        <label className="relative block">
          <span className="sr-only">Qidirish</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Nomi, model yoki SKU…"
            className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label>
          <span className="sr-only">Kategoriya</span>
          <select
            name="kategoriya"
            defaultValue={category?.id ?? ""}
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-accent md:w-48"
          >
            <option value="">Barcha kategoriyalar</option>
            {roots.map((root) => (
              <optgroup key={root.id} label={root.name}>
                <option value={root.id}>{root.name} — hammasi</option>
                {childrenOf(root.id).map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Brend</span>
          <select
            name="brend"
            defaultValue={brandId ?? ""}
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-accent md:w-40"
          >
            <option value="">Barcha brendlar</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Saralash</span>
          <select
            name="saralash"
            defaultValue={sort}
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-accent md:w-44"
          >
            {ADMIN_SORTS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="h-11 flex-1 rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-black md:flex-none">
            Qo‘llash
          </button>
          {hasFilters && (
            <Link href={BASE} className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm font-medium text-ink hover:border-ink/40">
              Tozalash
            </Link>
          )}
        </div>
      </form>

      {result.total === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-10 text-center">
          <PackageSearch className="mx-auto size-10 text-ink-muted" aria-hidden="true" />
          <p className="mt-3 font-medium text-ink">Hech narsa topilmadi</p>
          <p className="mt-1 text-sm text-ink-muted">Qidiruv so‘zini yoki filtrlarni o‘zgartirib ko‘ring.</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-ink-muted">
            {formatNumber(from)}–{formatNumber(to)} / {formatNumber(result.total)} ta ko‘rsatilmoqda
          </p>

          {/* Kompyuter: jadval */}
          <div className="mt-3 hidden overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-page-2/60 text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Mahsulot</th>
                  <th scope="col" className="px-4 py-3 font-medium">Narx</th>
                  <th scope="col" className="px-4 py-3 font-medium">Qoldiq</th>
                  <th scope="col" className="px-4 py-3 font-medium">Holat</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Amallar</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.items.map((row) => {
                  const { product } = row;
                  return (
                    <tr key={product.id} className="align-middle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage product={product} sizes="56px" className="size-14 shrink-0 rounded-xl bg-page-2" />
                          <div className="min-w-0">
                            <p className="font-medium text-ink">{product.name}</p>
                            <p className="text-xs text-ink-muted">
                              {brandById.get(product.brandId)?.name ?? product.brandId} ·{" "}
                              {categoryById.get(product.categoryId)?.name ?? product.categoryId} · {row.variantCount} variant
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PriceCell row={row} /></td>
                      <td className="px-4 py-3">
                        <p className="tabular-nums text-ink">{formatNumber(row.totalStock)} dona</p>
                        <StockBadge status={row.stockStatus} className="mt-1" />
                      </td>
                      <td className="px-4 py-3"><VisibilityBadge published={product.isPublished} /></td>
                      <td className="px-4 py-3 text-right">
                        {product.isPublished && (
                          <a
                            href={productHref(product.slug)}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-page-2 hover:text-ink"
                          >
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                            Saytda
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Telefon: kartalar */}
          <ul className="mt-3 space-y-3 lg:hidden">
            {result.items.map((row) => {
              const { product } = row;
              return (
                <li key={product.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
                  <ProductImage product={product} sizes="72px" className="size-[72px] shrink-0 rounded-xl bg-page-2" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-ink">{product.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {brandById.get(product.brandId)?.name ?? product.brandId} · {row.variantCount} variant ·{" "}
                      {formatNumber(row.totalStock)} dona
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold tabular-nums text-ink">{formatPrice(row.minPrice)}</span>
                      <StockBadge status={row.stockStatus} />
                      <VisibilityBadge published={product.isPublished} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {result.totalPages > 1 && (
            <nav aria-label="Sahifalar" className="mt-6 flex items-center justify-between gap-3">
              {result.page > 1 ? (
                <Link href={hrefWith(params, { sahifa: String(result.page - 1) })} className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-ink/40">
                  <ChevronLeft className="size-4" aria-hidden="true" /> Oldingi
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-ink-muted">
                {result.page} / {result.totalPages}
              </span>
              {result.page < result.totalPages ? (
                <Link href={hrefWith(params, { sahifa: String(result.page + 1) })} className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-ink/40">
                  Keyingi <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

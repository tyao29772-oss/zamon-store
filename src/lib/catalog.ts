import { getDiscountPercent, hasDiscount, isProductAvailable, toStringList } from "@/lib/product";
import type { Product } from "@/types";

/**
 * Katalog filtri, saralash va sahifalash mantiqi. Barchasi URL holatidan (`searchParams`)
 * ishlaydi — komponentlar orasida umumiy holat kerak emas, orqaga tugmasi va ulashish o‘zi ishlaydi.
 */

export type FilterSource =
  | "brand"
  | "model"
  | "variant.storage"
  | "variant.ram"
  | "variant.color"
  | "variant.condition"
  | "variant.simType"
  | "variant.warranty"
  | "attribute.cpu"
  | "attribute.gpu"
  | "attribute.screenSize"
  | "attribute.material"
  | "attribute.power"
  | "attribute.port"
  | "attribute.compatibility";

export interface FilterField {
  /** URL query parametri nomi, o‘zbekcha. */
  key: string;
  label: string;
  source: FilterSource;
  /** Qiymatlarni shu tartibda ko‘rsatish (bo‘lmasa alifbo/raqam tartibida). */
  order?: readonly string[];
}

export type SortKey = "tavsiya" | "arzon" | "qimmat" | "yangi" | "mashhur" | "chegirma";
const SORT_KEYS: readonly SortKey[] = ["tavsiya", "arzon", "qimmat", "yangi", "mashhur", "chegirma"];

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export interface FilterState {
  values: Record<string, string[]>;
  priceMin?: number;
  priceMax?: number;
  onlyAvailable: boolean;
  onlyDiscount: boolean;
  sort: SortKey;
  page: number;
}

function uniq<T>(list: T[]): T[] {
  return [...new Set(list)];
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getFieldValues(product: Product, source: FilterSource): string[] {
  switch (source) {
    case "brand":
      return [product.brandId];
    case "model":
      return product.model ? [product.model] : [];
    case "variant.storage":
      return uniq(product.variants.map((v) => v.storage).filter((v): v is string => Boolean(v)));
    case "variant.ram":
      return uniq(product.variants.map((v) => v.ram).filter((v): v is string => Boolean(v)));
    case "variant.color":
      return uniq(product.variants.map((v) => v.color).filter((v): v is string => Boolean(v)));
    case "variant.condition":
      return uniq(product.variants.map((v) => v.condition));
    case "variant.simType":
      return uniq(product.variants.map((v) => v.simType).filter((v): v is string => Boolean(v)));
    case "variant.warranty":
      return [product.variants.some((v) => v.warrantyMonths > 0) ? "bor" : "yoq"];
    case "attribute.cpu":
      return toStringList(product.attributes.cpu);
    case "attribute.gpu":
      return toStringList(product.attributes.gpu);
    case "attribute.screenSize":
      return toStringList(product.attributes.screenSize);
    case "attribute.material":
      return toStringList(product.attributes.material);
    case "attribute.power":
      return toStringList(product.attributes.power);
    case "attribute.port":
      return toStringList(product.attributes.port);
    case "attribute.compatibility":
      return toStringList(product.attributes.compatibility);
  }
}

/** `searchParams` dan filter holatini o‘qiydi. Noto‘g‘ri qiymatlar jimgina e’tiborsiz qoldiriladi. */
export function parseFilters(
  searchParams: SearchParamsInput,
  fields: readonly FilterField[],
  defaultSort: SortKey = "tavsiya",
): FilterState {
  const values: Record<string, string[]> = {};
  for (const field of fields) {
    const raw = first(searchParams[field.key]);
    if (!raw) continue;
    const list = uniq(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    if (list.length > 0) values[field.key] = list;
  }

  const priceMinRaw = Number(first(searchParams.narx_min));
  const priceMaxRaw = Number(first(searchParams.narx_max));
  const priceMin = Number.isFinite(priceMinRaw) && priceMinRaw > 0 ? Math.floor(priceMinRaw) : undefined;
  const priceMax = Number.isFinite(priceMaxRaw) && priceMaxRaw > 0 ? Math.floor(priceMaxRaw) : undefined;

  const sortRaw = first(searchParams.saralash);
  const sort = sortRaw && (SORT_KEYS as readonly string[]).includes(sortRaw) ? (sortRaw as SortKey) : defaultSort;

  const pageRaw = Number(first(searchParams.sahifa));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  return {
    values,
    priceMin: priceMin !== undefined && priceMax !== undefined && priceMin > priceMax ? priceMax : priceMin,
    priceMax,
    onlyAvailable: first(searchParams.mavjud) === "1",
    onlyDiscount: first(searchParams.chegirma) === "1",
    sort,
    page,
  };
}

export function applyFilters(
  products: Product[],
  state: FilterState,
  fields: readonly FilterField[],
  options?: { exceptKey?: string },
): Product[] {
  return products.filter((product) => {
    for (const field of fields) {
      if (field.key === options?.exceptKey) continue;
      const selected = state.values[field.key];
      if (!selected || selected.length === 0) continue;
      const productValues = getFieldValues(product, field.source);
      if (!productValues.some((value) => selected.includes(value))) return false;
    }

    if (state.priceMin !== undefined || state.priceMax !== undefined) {
      const inRange = product.variants.some(
        (v) =>
          (state.priceMin === undefined || v.price >= state.priceMin) &&
          (state.priceMax === undefined || v.price <= state.priceMax),
      );
      if (!inRange) return false;
    }

    if (state.onlyAvailable && !isProductAvailable(product)) return false;
    if (state.onlyDiscount && !hasDiscount(product)) return false;
    return true;
  });
}

function minVariantPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.price));
}

function maxDiscount(product: Product): number {
  return Math.max(0, ...product.variants.map((v) => getDiscountPercent(v.price, v.oldPrice)));
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products];
  switch (sort) {
    case "arzon":
      return list.sort((a, b) => minVariantPrice(a) - minVariantPrice(b));
    case "qimmat":
      return list.sort((a, b) => minVariantPrice(b) - minVariantPrice(a));
    case "yangi":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "mashhur":
      return list.sort((a, b) => b.popularity - a.popularity);
    case "chegirma":
      return list.sort((a, b) => maxDiscount(b) - maxDiscount(a) || b.popularity - a.popularity);
    case "tavsiya":
    default:
      return list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.popularity - a.popularity);
  }
}

export interface PageResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: current, totalPages, total, pageSize };
}

export interface FacetValue {
  value: string;
  count: number;
}

/** Berilgan filter uchun mavjud qiymatlar, boshqa faol filterlar hisobga olingan holda (faceted search). */
export function getFacets(
  products: Product[],
  field: FilterField,
  state: FilterState,
  fields: readonly FilterField[],
): FacetValue[] {
  const scoped = applyFilters(products, state, fields, { exceptKey: field.key });
  const counts = new Map<string, number>();
  for (const product of scoped) {
    for (const value of new Set(getFieldValues(product, field.source))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  const entries = [...counts.entries()].map(([value, count]) => ({ value, count }));
  if (field.order) {
    const rank = new Map(field.order.map((value, index) => [value, index]));
    entries.sort((a, b) => (rank.get(a.value) ?? 999) - (rank.get(b.value) ?? 999));
  } else {
    entries.sort((a, b) => a.value.localeCompare(b.value, "en", { numeric: true }));
  }
  return entries;
}

export function getPriceBounds(products: Product[]): { min: number; max: number } {
  const prices = products.flatMap((p) => p.variants.map((v) => v.price));
  if (prices.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function hasActiveFilters(state: FilterState): boolean {
  return (
    Object.keys(state.values).length > 0 ||
    state.priceMin !== undefined ||
    state.priceMax !== undefined ||
    state.onlyAvailable ||
    state.onlyDiscount
  );
}

export function countActiveFilters(state: FilterState): number {
  return (
    Object.keys(state.values).length +
    (state.priceMin !== undefined || state.priceMax !== undefined ? 1 : 0) +
    (state.onlyAvailable ? 1 : 0) +
    (state.onlyDiscount ? 1 : 0)
  );
}

/* ------------------------------------------------------------- URL yordamchilari */

/** Next.js `searchParams` obyektidan `URLSearchParams` yasaydi (bir qiymatli, birinchisi olinadi). */
export function toSearchParams(input: SearchParamsInput): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    const v = first(value);
    if (v !== undefined) sp.set(key, v);
  }
  return sp;
}

function withParams(sp: URLSearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(sp);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

export function hrefWithParams(
  basePath: string,
  sp: URLSearchParams,
  patch: Record<string, string | null>,
): string {
  return `${basePath}${withParams(sp, patch)}`;
}

/** Ko‘p tanlovli filter qiymatini yoqadi/o‘chiradi va sahifani 1-ga qaytaradi. */
export function hrefToggleValue(basePath: string, sp: URLSearchParams, key: string, value: string): string {
  const current = (sp.get(key) ?? "").split(",").filter(Boolean);
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return hrefWithParams(basePath, sp, { [key]: next.length > 0 ? next.join(",") : null, sahifa: null });
}

export function hrefSetPage(basePath: string, sp: URLSearchParams, page: number): string {
  return hrefWithParams(basePath, sp, { sahifa: page > 1 ? String(page) : null });
}

export function hrefClearAll(basePath: string): string {
  return basePath;
}

/** `narx_min`/`narx_max`/`sahifa` dan boshqa barcha faol parametrlar (narx formasidagi yashirin maydonlar uchun). */
export function nonPriceEntries(sp: URLSearchParams): [string, string][] {
  return [...sp.entries()].filter(([key]) => key !== "narx_min" && key !== "narx_max" && key !== "sahifa");
}

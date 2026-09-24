import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import { formatStorage } from "@/lib/format";
import {
  getFacets,
  getPriceBounds,
  hasActiveFilters,
  hrefClearAll,
  hrefToggleValue,
  hrefWithParams,
  nonPriceEntries,
  type FilterField,
  type FilterState,
} from "@/lib/catalog";
import { CONDITION_LABELS } from "@/lib/product";
import type { Brand, Condition, Product } from "@/types";

const WARRANTY_LABELS: Record<string, string> = { bor: "Kafolat bor", yoq: "Kafolat yo‘q" };

function labelFor(field: FilterField, value: string, brands: Map<string, Brand>): string {
  if (field.source === "brand") return brands.get(value)?.name ?? value;
  if (field.source === "variant.condition") return CONDITION_LABELS[value as Condition] ?? value;
  if (field.source === "variant.warranty") return WARRANTY_LABELS[value] ?? value;
  if (field.source === "variant.storage" || field.source === "variant.ram") return formatStorage(value);
  if (field.key === "quvvat") return `${value}W`;
  if (field.key === "ekran") return `${value}"`;
  return value;
}

function getColorHex(products: Product[], colorName: string): string | undefined {
  for (const product of products) {
    const match = product.variants.find((v) => v.color === colorName && v.colorHex);
    if (match?.colorHex) return match.colorHex;
  }
  return undefined;
}

function ToggleSwitch({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className="flex h-11 items-center justify-between rounded-xl border border-line px-3.5 transition-colors hover:border-ink/40"
    >
      <span className="text-sm font-medium text-ink">{label}</span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active ? "bg-ink" : "bg-surface-muted"}`}
      >
        <span
          className={`inline-block size-[18px] rounded-full bg-white shadow transition-transform ${active ? "translate-x-[22px]" : "translate-x-[3px]"}`}
        />
      </span>
    </Link>
  );
}

interface ProductFiltersProps {
  basePath: string;
  sp: URLSearchParams;
  /** Filterlanmagan, kategoriya/brend doirasidagi to‘liq ro‘yxat — facet sanoqlari shundan hisoblanadi. */
  products: Product[];
  fields: readonly FilterField[];
  state: FilterState;
  brands: Map<string, Brand>;
}

export function ProductFilters({ basePath, sp, products, fields, state, brands }: ProductFiltersProps) {
  const bounds = getPriceBounds(products);
  const priceHiddenFields = nonPriceEntries(sp);

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Filterlar</h2>
        {hasActiveFilters(state) && (
          <Link
            href={hrefClearAll(basePath)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-ink hover:underline"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Tozalash
          </Link>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink">Narx oralig‘i</h3>
        <form method="get" action={basePath} className="mt-3 flex items-center gap-2">
          {priceHiddenFields.map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <input
            type="number"
            inputMode="numeric"
            name="narx_min"
            min={0}
            defaultValue={state.priceMin ?? ""}
            placeholder={String(bounds.min)}
            aria-label="Narx, dan"
            className="h-11 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus-visible:border-ink"
          />
          <span aria-hidden="true" className="text-ink-muted">
            —
          </span>
          <input
            type="number"
            inputMode="numeric"
            name="narx_max"
            min={0}
            defaultValue={state.priceMax ?? ""}
            placeholder={String(bounds.max)}
            aria-label="Narx, gacha"
            className="h-11 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus-visible:border-ink"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            OK
          </button>
        </form>
      </div>

      <ToggleSwitch
        active={state.onlyAvailable}
        label="Faqat mavjud mahsulotlar"
        href={hrefWithParams(basePath, sp, { mavjud: state.onlyAvailable ? null : "1", sahifa: null })}
      />
      <ToggleSwitch
        active={state.onlyDiscount}
        label="Faqat chegirmadagilar"
        href={hrefWithParams(basePath, sp, { chegirma: state.onlyDiscount ? null : "1", sahifa: null })}
      />

      {fields.map((field) => {
        const facets = getFacets(products, field, state, fields);
        if (facets.length === 0) return null;
        const selected = new Set(state.values[field.key] ?? []);

        return (
          <div key={field.key}>
            <h3 className="text-sm font-semibold text-ink">{field.label}</h3>
            <ul className="mt-3 space-y-1">
              {facets.map(({ value, count }) => {
                const active = selected.has(value);
                const swatch = field.source === "variant.color" ? getColorHex(products, value) : undefined;
                return (
                  <li key={value}>
                    <Link
                      href={hrefToggleValue(basePath, sp, field.key, value)}
                      aria-pressed={active}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-colors ${
                        active ? "bg-accent-soft font-semibold text-accent-ink" : "text-ink hover:bg-surface-muted"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border ${
                          active ? "border-accent-ink bg-accent-ink" : "border-line"
                        }`}
                      >
                        {active && <Check className="size-3 text-white" aria-hidden="true" />}
                      </span>
                      {swatch && (
                        <span
                          aria-hidden="true"
                          className="size-3.5 shrink-0 rounded-full border border-line"
                          style={{ background: swatch }}
                        />
                      )}
                      <span className="flex-1">{labelFor(field, value, brands)}</span>
                      <span className="text-ink-muted">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

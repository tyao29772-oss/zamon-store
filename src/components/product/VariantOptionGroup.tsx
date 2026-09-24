export interface VariantOption {
  value: string;
  label: string;
  disabled: boolean;
  swatchHex?: string;
}

interface VariantOptionGroupProps {
  label: string;
  options: VariantOption[];
  selected?: string;
  onSelect: (value: string) => void;
  /** `swatch` — faqat rang doirachalari (Rang uchun), `pill` — matnli tugmalar. */
  kind?: "pill" | "swatch";
}

/** Variant tanlash qatori: rang, xotira, RAM, o‘lcham yoki holat. Mavjud bo‘lmagan kombinatsiya o‘chirilgan. */
export function VariantOptionGroup({ label, options, selected, onSelect, kind = "pill" }: VariantOptionGroupProps) {
  const selectedLabel = options.find((o) => o.value === selected)?.label;

  return (
    <div>
      <p className="text-sm font-semibold text-ink">
        {label}
        {selectedLabel && <span className="ml-1.5 font-normal text-ink-muted">{selectedLabel}</span>}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === selected;

          if (kind === "swatch") {
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                aria-pressed={active}
                aria-label={option.label}
                title={option.label}
                onClick={() => onSelect(option.value)}
                className={`relative flex size-10 items-center justify-center rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                  active ? "border-ink" : "border-transparent hover:border-line"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-7 rounded-full border border-black/10"
                  style={{ background: option.swatchHex ?? "#ccc" }}
                />
              </button>
            );
          }

          return (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              aria-pressed={active}
              onClick={() => onSelect(option.value)}
              className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-line disabled:text-ink-muted/40 ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-surface text-ink hover:border-ink/40 disabled:hover:border-line"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

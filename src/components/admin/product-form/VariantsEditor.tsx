"use client";

import { useContext, useState } from "react";
import { ChevronDown, Copy, Plus, Trash2, Wand2, X } from "lucide-react";
import {
  addMatrixVariants,
  COMMON_COLORS,
  COMMON_STORAGES,
  CONDITION_OPTIONS,
  describeVariantRow,
  emptyVariant,
  newKey,
  type ColorOption,
  type VariantFormValue,
} from "@/lib/admin/product-form";
import { formatNumber } from "@/lib/format";
import type { Condition } from "@/types";
import { Field, FieldErrorsContext, inputClass, MoneyField, Section, StepperField, TextField, useFieldError } from "./fields";

interface VariantsEditorProps {
  variants: VariantFormValue[];
  onChange: (variants: VariantFormValue[]) => void;
  /** Noutbuklarda RAM ustuni doim ko‘rinadi. */
  showRam: boolean;
}

const STORAGE_LIST_ID = "admin-storage-options";

export function VariantsEditor({ variants, onChange, showRam }: VariantsEditorProps) {
  const [generatorOpen, setGeneratorOpen] = useState(variants.length <= 1 && !variants[0]?.price);
  const listError = useFieldError("variants");

  const update = (index: number, patch: Partial<VariantFormValue>) =>
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const remove = (index: number) => {
    const target = variants[index]!;
    if (target.id && !window.confirm(`«${describeVariantRow(target)}» variantini o‘chirasizmi?`)) return;
    onChange(variants.filter((_, i) => i !== index));
  };

  // Nusxa: id va SKU olinmaydi (yangi variant bo‘ladi), qolgani — shu jumladan narx — ko‘chiriladi.
  const duplicate = (index: number) => {
    const source = variants[index]!;
    const copy: VariantFormValue = { ...source, key: newKey(), id: undefined, sku: "", color: "", colorHex: "" };
    onChange([...variants.slice(0, index + 1), copy, ...variants.slice(index + 1)]);
  };

  const totalStock = variants.reduce((sum, v) => sum + (Number.parseInt(v.stock, 10) || 0), 0);

  return (
    <Section
      title="Variantlar va narxlar"
      description={`${variants.length} ta variant · jami ${formatNumber(totalStock)} dona`}
      actions={
        <button
          type="button"
          onClick={() => setGeneratorOpen((open) => !open)}
          aria-expanded={generatorOpen}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-ink/40"
        >
          <Wand2 className="size-4" aria-hidden="true" />
          Tez yaratish
          <ChevronDown className={`size-4 transition-transform ${generatorOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      }
    >
      <datalist id={STORAGE_LIST_ID}>
        {COMMON_STORAGES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {generatorOpen && (
        <MatrixGenerator
          onGenerate={(input) => {
            onChange(addMatrixVariants(variants, input));
            setGeneratorOpen(false);
          }}
        />
      )}

      {listError && (
        <p className="mb-3 rounded-xl bg-sale-soft px-3 py-2 text-sm text-sale" data-error-path="variants">
          {listError}
        </p>
      )}

      <ol className="space-y-3">
        {variants.map((variant, index) => (
          <VariantCard
            key={variant.key}
            index={index}
            variant={variant}
            showRam={showRam}
            canRemove={variants.length > 1}
            onChange={(patch) => update(index, patch)}
            onRemove={() => remove(index)}
            onDuplicate={() => duplicate(index)}
          />
        ))}
      </ol>

      <button
        type="button"
        onClick={() => onChange([...variants, emptyVariant({ warrantyMonths: variants.at(-1)?.warrantyMonths ?? "12", simType: variants.at(-1)?.simType ?? "" })])}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/25 py-3 text-sm font-medium text-ink hover:border-ink/50 hover:bg-white/60"
      >
        <Plus className="size-4" aria-hidden="true" />
        Variant qo‘shish
      </button>
    </Section>
  );
}

interface VariantCardProps {
  index: number;
  variant: VariantFormValue;
  showRam: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<VariantFormValue>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function VariantCard({ index, variant, showRam, canRemove, onChange, onRemove, onDuplicate }: VariantCardProps) {
  const p = (field: string) => `variants.${index}.${field}`;
  const errors = useContext(FieldErrorsContext);
  // Yashirin maydonda xato bo‘lsa, «Qo‘shimcha» bo‘limi o‘zi ochiladi.
  const hasExtraError = ["sku", "simType", "size", "note", ...(showRam ? [] : ["ram"])].some((f) => errors[p(f)]);
  const [moreOpen, setMoreOpen] = useState(Boolean(variant.note || variant.preorder || variant.size));
  const showMore = moreOpen || hasExtraError;
  const stockNumber = Number.parseInt(variant.stock, 10) || 0;

  return (
    <li className="rounded-2xl border border-line bg-white/70 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-page-2 text-xs tabular-nums">{index + 1}</span>
          {variant.colorHex && (
            <span className="size-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: variant.colorHex }} aria-hidden="true" />
          )}
          <span className="truncate">{describeVariantRow(variant)}</span>
          {stockNumber === 0 && !variant.preorder && (
            <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">Tugagan</span>
          )}
        </p>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={onDuplicate} className="rounded-lg p-2 text-ink-muted hover:bg-page-2 hover:text-ink" title="Nusxa olish">
            <Copy className="size-4" aria-hidden="true" />
            <span className="sr-only">{index + 1}-variantdan nusxa olish</span>
          </button>
          {canRemove && (
            <button type="button" onClick={onRemove} className="rounded-lg p-2 text-ink-muted hover:bg-sale-soft hover:text-sale" title="O‘chirish">
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="sr-only">{index + 1}-variantni o‘chirish</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Rang" path={p("color")} className="col-span-2 md:col-span-1">
          {({ id, error, describedBy, borderClass }) => (
            <div className="flex gap-2">
              <input
                type="color"
                value={variant.colorHex || "#cccccc"}
                onChange={(e) => onChange({ colorHex: e.target.value.toUpperCase() })}
                aria-label="Rang namunasi"
                className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1"
              />
              <input
                id={id}
                type="text"
                value={variant.color}
                onChange={(e) => onChange({ color: e.target.value })}
                placeholder="Qora"
                maxLength={60}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={`${inputClass} ${borderClass}`}
              />
            </div>
          )}
        </Field>
        <TextField label="Xotira" path={p("storage")} value={variant.storage} onChange={(storage) => onChange({ storage })} placeholder="256GB" list={STORAGE_LIST_ID} maxLength={30} />
        {showRam && <TextField label="RAM" path={p("ram")} value={variant.ram} onChange={(ram) => onChange({ ram })} placeholder="8GB" maxLength={30} />}
        <Field label="Holati" path={p("condition")}>
          {({ id, borderClass }) => (
            <select id={id} value={variant.condition} onChange={(e) => onChange({ condition: e.target.value as Condition })} className={`${inputClass} ${borderClass}`}>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <MoneyField label="Narx" path={p("price")} value={variant.price} onChange={(price) => onChange({ price })} required placeholder="14 500 000" />
        <MoneyField label="Eski narx (chegirma)" path={p("oldPrice")} value={variant.oldPrice} onChange={(oldPrice) => onChange({ oldPrice })} placeholder="ixtiyoriy" />
        <StepperField label="Qoldiq" path={p("stock")} value={variant.stock} onChange={(stock) => onChange({ stock })} min={0} max={100000} suffix="dona" />
        <StepperField label="Kafolat" path={p("warrantyMonths")} value={variant.warrantyMonths} onChange={(warrantyMonths) => onChange({ warrantyMonths })} min={0} max={120} suffix="oy" />
      </div>

      <button
        type="button"
        onClick={() => setMoreOpen((open) => !open)}
        aria-expanded={showMore}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
      >
        <ChevronDown className={`size-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} aria-hidden="true" />
        Qo‘shimcha: SIM, SKU, o‘lcham, izoh
      </button>

      {showMore && (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {!showRam && <TextField label="RAM" path={p("ram")} value={variant.ram} onChange={(ram) => onChange({ ram })} placeholder="8GB" maxLength={30} />}
          <TextField label="SIM turi" path={p("simType")} value={variant.simType} onChange={(simType) => onChange({ simType })} placeholder="nano-SIM + eSIM" maxLength={60} />
          <TextField label="O‘lcham" path={p("size")} value={variant.size} onChange={(size) => onChange({ size })} placeholder="45 mm" maxLength={30} />
          <TextField label="SKU (artikul)" path={p("sku")} value={variant.sku} onChange={(sku) => onChange({ sku })} placeholder="avtomatik" hint={variant.id ? undefined : "Bo‘sh qolsa o‘zi yasaladi"} maxLength={80} />
          <TextField label="Izoh" path={p("note")} value={variant.note} onChange={(note) => onChange({ note })} placeholder="Batareya 92%" className="col-span-2" maxLength={200} />
          <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-sm text-ink">
            <input type="checkbox" checked={variant.preorder} onChange={(e) => onChange({ preorder: e.target.checked })} className="size-4 accent-[var(--ink)]" />
            Oldindan buyurtma (qoldiq 0 bo‘lsa ham buyurtma qabul qilinadi)
          </label>
        </div>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ Tez yaratish paneli */

function ChipToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40"
      }`}
    >
      {children}
    </button>
  );
}

function MatrixGenerator({ onGenerate }: { onGenerate: (input: Parameters<typeof addMatrixVariants>[1]) => void }) {
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [storages, setStorages] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState({ name: "", hex: "#888888" });
  const [customStorage, setCustomStorage] = useState("");
  const [condition, setCondition] = useState<Condition>("new");
  const [warranty, setWarranty] = useState("12");
  const [sim, setSim] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");

  const toggleColor = (color: ColorOption) =>
    setColors((list) => (list.some((c) => c.name === color.name) ? list.filter((c) => c.name !== color.name) : [...list, color]));
  const toggleStorage = (storage: string) =>
    setStorages((list) => (list.includes(storage) ? list.filter((s) => s !== storage) : [...list, storage]));

  const addCustomColor = () => {
    const name = customColor.name.trim();
    if (!name) return;
    if (!colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) setColors([...colors, { name, hex: customColor.hex.toUpperCase() }]);
    setCustomColor({ name: "", hex: "#888888" });
  };
  const addCustomStorage = () => {
    const value = customStorage.trim().replace(/\s+/g, "").toUpperCase();
    if (value && !storages.includes(value)) setStorages([...storages, value]);
    setCustomStorage("");
  };

  const count = Math.max(1, colors.length) * Math.max(1, storages.length);
  const extraColors = colors.filter((c) => !COMMON_COLORS.some((common) => common.name === c.name));
  const extraStorages = storages.filter((s) => !COMMON_STORAGES.includes(s));

  return (
    <div className="mb-4 rounded-2xl border border-accent/40 bg-accent-soft/40 p-4">
      <p className="text-sm text-ink">
        Ranglar va xotiralarni belgilang — har bir kombinatsiya uchun variant <b>o‘zi yasaladi</b>. Keyin har biriga narx va qoldiqni yozasiz. Bor variantlar takrorlanmaydi.
      </p>

      <p className="mb-2 mt-4 text-xs font-medium text-ink-muted">Ranglar</p>
      <div className="flex flex-wrap gap-2">
        {[...COMMON_COLORS, ...extraColors].map((color) => (
          <ChipToggle key={color.name} active={colors.some((c) => c.name === color.name)} onClick={() => toggleColor(color)}>
            <span className="size-3.5 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} aria-hidden="true" />
            {color.name}
          </ChipToggle>
        ))}
      </div>
      <div className="mt-2 flex max-w-sm gap-2">
        <input type="color" value={customColor.hex} onChange={(e) => setCustomColor({ ...customColor, hex: e.target.value })} aria-label="Yangi rang namunasi" className="h-10 w-10 shrink-0 rounded-xl border border-line bg-white p-1" />
        <input
          type="text"
          value={customColor.name}
          onChange={(e) => setCustomColor({ ...customColor, name: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomColor())}
          placeholder="Boshqa rang nomi"
          maxLength={60}
          className={`${inputClass} border-line h-10`}
        />
        <button type="button" onClick={addCustomColor} className="h-10 shrink-0 rounded-xl border border-line bg-white px-3 text-sm font-medium hover:border-ink/40">
          Qo‘shish
        </button>
      </div>

      <p className="mb-2 mt-4 text-xs font-medium text-ink-muted">Xotira</p>
      <div className="flex flex-wrap gap-2">
        {[...COMMON_STORAGES, ...extraStorages].map((storage) => (
          <ChipToggle key={storage} active={storages.includes(storage)} onClick={() => toggleStorage(storage)}>
            {storage}
          </ChipToggle>
        ))}
      </div>
      <div className="mt-2 flex max-w-xs gap-2">
        <input
          type="text"
          value={customStorage}
          onChange={(e) => setCustomStorage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomStorage())}
          placeholder="Boshqa: 2TB"
          maxLength={30}
          className={`${inputClass} border-line h-10`}
        />
        <button type="button" onClick={addCustomStorage} className="h-10 shrink-0 rounded-xl border border-line bg-white px-3 text-sm font-medium hover:border-ink/40">
          Qo‘shish
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Field label="Holati">
          {({ id }) => (
            <select id={id} value={condition} onChange={(e) => setCondition(e.target.value as Condition)} className={`${inputClass} border-line`}>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <MoneyField label="Boshlang‘ich narx" path="__matrix.price" value={price} onChange={setPrice} placeholder="ixtiyoriy" />
        <StepperField label="Qoldiq" path="__matrix.stock" value={stock} onChange={setStock} min={0} max={100000} suffix="dona" />
        <StepperField label="Kafolat" path="__matrix.warranty" value={warranty} onChange={setWarranty} min={0} max={120} suffix="oy" />
        <TextField label="SIM turi" path="__matrix.sim" value={sim} onChange={setSim} placeholder="nano-SIM + eSIM" maxLength={60} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onGenerate({ colors, storages, condition, warrantyMonths: warranty || "12", simType: sim, price, stock: stock || "0" })}
          disabled={colors.length === 0 && storages.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40"
        >
          <Wand2 className="size-4" aria-hidden="true" />
          {count} ta variant yaratish
        </button>
        {(colors.length > 0 || storages.length > 0) && (
          <button
            type="button"
            onClick={() => {
              setColors([]);
              setStorages([]);
            }}
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <X className="size-3.5" aria-hidden="true" /> Tanlovni tozalash
          </button>
        )}
      </div>
    </div>
  );
}

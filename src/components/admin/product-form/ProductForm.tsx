"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, ExternalLink, LoaderCircle, RefreshCw, Save } from "lucide-react";
import { saveProductAction, type SaveProductTarget } from "@/app/admin/(panel)/mahsulotlar/actions";
import {
  ATTRIBUTE_META,
  getAttributeKeys,
  getRootId,
  slugify,
  type ProductFormValues,
} from "@/lib/admin/product-form";
import { formatNumber, formatPrice } from "@/lib/format";
import { useToast } from "@/providers/ToastProvider";
import type { Brand } from "@/types";
import { Field, FieldErrorsContext, inputClass, Section, TextAreaField, TextField, Toggle } from "./fields";
import { ImagesEditor } from "./ImagesEditor";
import { SpecsEditor } from "./SpecsEditor";
import { VariantsEditor } from "./VariantsEditor";

export interface CategoryOption {
  id: string;
  /** `Aksessuarlar › Zaryadchiklar › Adapterlar` */
  label: string;
  rootName: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialValues: ProductFormValues;
  brands: Brand[];
  categories: CategoryOption[];
  /** Baza ulanmagan bo‘lsa saqlash o‘chiriladi. */
  canSave: boolean;
}

/** «O‘zgarish bormi?» solishtiruvi uchun: versiya va React kalitlari hisobga olinmaydi. */
function snapshot(values: ProductFormValues): string {
  return JSON.stringify(values, (key, value: unknown) => (key === "updatedAt" || key === "key" ? undefined : value));
}

export function ProductForm({ mode, initialValues, brands, categories, canSave }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(() => snapshot(initialValues));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<{ message: string; conflict?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const setImages = useCallback(
    (update: (images: string[]) => string[]) => setValues((current) => ({ ...current, images: update(current.images) })),
    [],
  );
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = snapshot(values) !== saved;
  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Saqlanmagan o‘zgarish bilan sahifani yopish/yangilashdan oldin brauzer so‘raydi.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const attributeKeys = values.categoryId ? getAttributeKeys(values.categoryId) : [];
  const showRam = getRootId(values.categoryId) === "laptoplar" || values.variants.some((v) => v.ram);

  const summary = useMemo(() => {
    const prices = values.variants.map((v) => Number(v.price.replace(/[^\d]/g, ""))).filter((n) => n > 0);
    const stock = values.variants.reduce((sum, v) => sum + (Number.parseInt(v.stock, 10) || 0), 0);
    return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0, stock };
  }, [values.variants]);

  const setName = (name: string) =>
    setValues((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));

  const focusFirstError = () => {
    requestAnimationFrame(() => {
      const target = formRef.current?.querySelector<HTMLElement>("[data-error-path]");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave || pending) return;
    if (uploading) {
      setFormError({ message: "Rasmlar hali yuklanmoqda — tugashini kuting, so‘ng saqlang." });
      return;
    }
    setFormError(null);
    const target: SaveProductTarget = mode === "create" ? { kind: "create" } : { kind: "update", id: initialValues.slug };

    startTransition(async () => {
      let result;
      try {
        result = await saveProductAction(target, values);
      } catch {
        setFormError({ message: "Server bilan aloqa uzildi. Internetni tekshirib, qayta urinib ko‘ring." });
        return;
      }
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError({ message: result.error, conflict: result.conflict });
        if (result.fieldErrors) focusFirstError();
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors({});
      if (result.created) {
        setSaved(snapshot(values));
        toast.show("Mahsulot qo‘shildi");
        router.replace(`/admin/mahsulotlar/${result.id}`);
      } else {
        const next = { ...values, updatedAt: result.updatedAt };
        setValues(next);
        setSaved(snapshot(next));
        toast.show("O‘zgarishlar saqlandi");
        router.refresh();
      }
    });
  };

  const rootsInOrder = [...new Set(categories.map((c) => c.rootName))];

  return (
    <FieldErrorsContext.Provider value={errors}>
      <form ref={formRef} onSubmit={submit} noValidate className="pb-28 xl:pb-0">
        {!canSave && (
          <p className="mb-4 rounded-2xl bg-warn-soft p-4 text-sm text-warn">
            Baza (Supabase) ulanmagan — formani ko‘rish mumkin, lekin saqlab bo‘lmaydi.
          </p>
        )}
        {formError && (
          <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-sale/30 bg-sale-soft p-4 text-sm text-sale">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p>{formError.message}</p>
              {formError.conflict && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-ink"
                >
                  <RefreshCw className="size-3.5" aria-hidden="true" /> Sahifani yangilash
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0 space-y-5">
            <Section title="Asosiy ma’lumot">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Mahsulot nomi"
                  path="name"
                  value={values.name}
                  onChange={setName}
                  required
                  placeholder="iPhone 15 Pro Max"
                  maxLength={200}
                  className="md:col-span-2"
                />
                <Field label="Brend" path="brandId" required>
                  {({ id, error, describedBy, borderClass }) => (
                    <select id={id} value={values.brandId} onChange={(e) => set("brandId", e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={`${inputClass} ${borderClass}`}>
                      <option value="">Tanlang…</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Kategoriya" path="categoryId" required>
                  {({ id, error, describedBy, borderClass }) => (
                    <select id={id} value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={`${inputClass} ${borderClass}`}>
                      <option value="">Tanlang…</option>
                      {rootsInOrder.map((root) => (
                        <optgroup key={root} label={root}>
                          {categories
                            .filter((c) => c.rootName === root)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </Field>
                <TextField
                  label="Model"
                  path="model"
                  value={values.model}
                  onChange={(v) => set("model", v)}
                  placeholder="iPhone 15 Pro Max"
                  hint="Filtr va g‘ilof/oyna mosligi uchun. Telefonlarda to‘ldiring."
                  maxLength={120}
                />
                {mode === "create" ? (
                  <TextField
                    label="Saytdagi manzil"
                    path="slug"
                    value={values.slug}
                    onChange={(v) => {
                      setSlugTouched(true);
                      set("slug", slugify(v) || v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                    required
                    placeholder="iphone-15-pro-max"
                    hint={`/mahsulot/${values.slug || "…"} — nomdan o‘zi yasaladi`}
                    maxLength={80}
                  />
                ) : (
                  <Field label="Saytdagi manzil" hint="Manzil o‘zgarmaydi — eski havolalar va buyurtmalar buzilmasligi uchun.">
                    {({ id }) => <input id={id} value={`/mahsulot/${values.slug}`} disabled className={`${inputClass} border-line`} />}
                  </Field>
                )}
              </div>
            </Section>

            <ImagesEditor images={values.images} onChange={setImages} canUpload={canSave} onBusyChange={setUploading} />

            <VariantsEditor variants={values.variants} onChange={(variants) => set("variants", variants)} showRam={showRam} />

            {attributeKeys.length > 0 && (
              <Section title="Filtr uchun ma’lumot" description="Mijoz katalogda shu qiymatlar bo‘yicha filtrlaydi.">
                <div className="grid gap-4 md:grid-cols-2">
                  {attributeKeys.map((key) => (
                    <TextField
                      key={key}
                      label={ATTRIBUTE_META[key].label}
                      path={`attributes.${key}`}
                      value={values.attributes[key] ?? ""}
                      onChange={(v) => set("attributes", { ...values.attributes, [key]: v })}
                      placeholder={ATTRIBUTE_META[key].placeholder}
                      hint={ATTRIBUTE_META[key].hint}
                      inputMode={ATTRIBUTE_META[key].kind === "number" ? "decimal" : "text"}
                      maxLength={500}
                      className={ATTRIBUTE_META[key].kind === "list" ? "md:col-span-2" : undefined}
                    />
                  ))}
                </div>
              </Section>
            )}

            <Section title="Tavsif">
              <div className="space-y-4">
                <TextAreaField
                  label="Qisqa tavsif"
                  path="shortDescription"
                  value={values.shortDescription}
                  onChange={(v) => set("shortDescription", v)}
                  placeholder="Titan korpus, A17 Pro chip va 5x optik zoom."
                  hint="Kartochka va qidiruvda ko‘rinadi — 1 gap."
                  rows={2}
                  maxLength={300}
                />
                <TextAreaField
                  label="To‘liq tavsif"
                  path="description"
                  value={values.description}
                  onChange={(v) => set("description", v)}
                  placeholder="Mahsulot haqida batafsil: nimasi bilan yaxshi, to‘plamda nima bor, kafolat…"
                  rows={6}
                  maxLength={5000}
                />
                <TextField
                  label="Qidiruv uchun qo‘shimcha so‘zlar"
                  path="keywords"
                  value={values.keywords}
                  onChange={(v) => set("keywords", v)}
                  placeholder="ayfon, 15 pro max, apple"
                  hint="Vergul bilan. Mijozlar qanday yozib qidirishi mumkin bo‘lsa — shuni yozing."
                  maxLength={1000}
                />
              </div>
            </Section>

            <SpecsEditor specs={values.specs} categoryId={values.categoryId} onChange={(specs) => set("specs", specs)} />
          </div>

          {/* O‘ng ustun: holat, saqlash, rasmlar */}
          <aside className="space-y-5 xl:sticky xl:top-6">
            <Section title="Holati">
              <div className="divide-y divide-line">
                <Toggle checked={values.isPublished} onChange={(v) => set("isPublished", v)} label="Saytda ko‘rsatish" description="O‘chirilsa — mahsulot saytdan yashiriladi, lekin o‘chmaydi." />
                <Toggle checked={values.featured} onChange={(v) => set("featured", v)} label="Bosh sahifada tavsiya etish" description="«Tavsiya etamiz» bo‘limida chiqadi." />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-page-2/60 p-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-muted">Narx</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {summary.min ? (summary.max > summary.min ? `${formatNumber(summary.min)}–${formatNumber(summary.max)}` : formatPrice(summary.min)) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Jami qoldiq</dt>
                  <dd className="font-semibold tabular-nums text-ink">{formatNumber(summary.stock)} dona</dd>
                </div>
              </dl>
              <button
                type="submit"
                disabled={!canSave || pending || (!dirty && mode === "edit")}
                className="mt-4 hidden h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-40 xl:inline-flex"
              >
                {pending || uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                {mode === "create" ? "Mahsulotni qo‘shish" : dirty ? "O‘zgarishlarni saqlash" : "Saqlangan"}
              </button>
              {mode === "edit" && values.isPublished && (
                <a href={`/mahsulot/${values.slug}`} target="_blank" rel="noopener" className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm text-ink-muted hover:text-ink">
                  <ExternalLink className="size-3.5" aria-hidden="true" /> Saytda ko‘rish
                </a>
              )}
            </Section>

          </aside>
        </div>

        {/* Telefon/planshet: pastda doim ko‘rinadigan saqlash paneli */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur xl:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-xs text-ink-muted">
              {pending ? "Saqlanmoqda…" : uploading ? "Rasmlar yuklanmoqda…" : dirty ? "Saqlanmagan o‘zgarishlar bor" : mode === "edit" ? "Hammasi saqlangan" : "Ma’lumotlarni to‘ldiring"}
            </p>
            <Link href="/admin/mahsulotlar" className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-muted hover:text-ink">
              Orqaga
            </Link>
            <button
              type="submit"
              disabled={!canSave || pending || (!dirty && mode === "edit")}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {pending || uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              {mode === "create" ? "Qo‘shish" : "Saqlash"}
            </button>
          </div>
        </div>
      </form>
    </FieldErrorsContext.Provider>
  );
}

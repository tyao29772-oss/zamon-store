"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { createBrandAction, deleteBrandAction, moveBrandAction, updateBrandAction, type TaxonomyResult } from "@/app/admin/(panel)/brendlar/actions";
import { slugify } from "@/lib/admin/product-form";
import { useToast } from "@/providers/ToastProvider";
import { inputClass } from "./product-form/fields";

export interface BrandRowView {
  id: string;
  name: string;
  description: string;
  productCount: number;
}

function ErrorText({ text }: { text?: string }) {
  return text ? <p className="mt-1 text-xs text-sale">{text}</p> : null;
}

export function BrandsManager({ brands, canEdit }: { brands: BrandRowView[]; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", slug: "", description: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", description: "" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const run = (action: () => Promise<TaxonomyResult>, success: string, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          return;
        }
        setFieldErrors({});
        toast.show(success);
        after?.();
        router.refresh();
      } catch {
        setError("Server bilan aloqa uzildi. Qayta urinib ko‘ring.");
      }
    });
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => createBrandAction(draft), `«${draft.name.trim()}» brendi qo‘shildi`, () => {
      setDraft({ name: "", slug: "", description: "" });
      setSlugTouched(false);
      setAdding(false);
    });
  };

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-sale/30 bg-sale-soft p-3 text-sm text-sale">
          {error}
        </p>
      )}

      {adding ? (
        <form onSubmit={create} className="mb-5 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5" noValidate>
          <h2 className="text-base font-semibold text-ink">Yangi brend</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-medium text-ink-muted">
              Nomi
              <input
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value, slug: slugTouched ? d.slug : slugify(e.target.value) }))}
                placeholder="Vivo"
                maxLength={60}
                className={`${inputClass} mt-1 ${fieldErrors.name ? "border-sale" : "border-line"}`}
              />
              <ErrorText text={fieldErrors.name} />
            </label>
            <label className="text-xs font-medium text-ink-muted">
              Saytdagi manzil
              <input
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase() }));
                }}
                placeholder="vivo"
                maxLength={60}
                className={`${inputClass} mt-1 ${fieldErrors.slug ? "border-sale" : "border-line"}`}
              />
              {fieldErrors.slug ? <ErrorText text={fieldErrors.slug} /> : <span className="mt-1 block font-normal">/brendlar/{slugify(draft.slug || draft.name) || "…"} — keyin o‘zgarmaydi</span>}
            </label>
            <label className="text-xs font-medium text-ink-muted md:col-span-2">
              Qisqa tavsif (ixtiyoriy)
              <input
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Vivo smartfonlari — kuchli kamera va tez zaryadlash."
                maxLength={500}
                className={`${inputClass} mt-1 border-line`}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={pending || !canEdit} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40">
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
              Qo‘shish
            </button>
            <button type="button" onClick={() => setAdding(false)} className="h-11 rounded-full px-5 text-sm font-medium text-ink-muted hover:text-ink">
              Bekor qilish
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={!canEdit}
          className="mb-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden="true" /> Yangi brend
        </button>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {brands.map((brand, index) => (
          <li key={brand.id} className="p-4">
            {editingId === brand.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => updateBrandAction(brand.id, edit), "Brend saqlandi", () => setEditingId(null));
                }}
                className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-start"
              >
                <label className="text-xs font-medium text-ink-muted">
                  Nomi
                  <input autoFocus value={edit.name} onChange={(e) => setEdit((d) => ({ ...d, name: e.target.value }))} maxLength={60} className={`${inputClass} mt-1 ${fieldErrors.name ? "border-sale" : "border-line"}`} />
                  <ErrorText text={fieldErrors.name} />
                </label>
                <label className="text-xs font-medium text-ink-muted">
                  Tavsif
                  <input value={edit.description} onChange={(e) => setEdit((d) => ({ ...d, description: e.target.value }))} maxLength={500} className={`${inputClass} mt-1 border-line`} />
                </label>
                <div className="flex gap-2 md:pt-5">
                  <button type="submit" disabled={pending} className="inline-flex h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">
                    Saqlash
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded-full p-2.5 text-ink-muted hover:bg-page-2" title="Bekor qilish">
                    <X className="size-4" aria-hidden="true" />
                    <span className="sr-only">Bekor qilish</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">
                    {brand.name} <span className="text-xs font-normal text-ink-muted">/brendlar/{brand.id}</span>
                  </p>
                  {brand.description && <p className="mt-0.5 truncate text-sm text-ink-muted">{brand.description}</p>}
                  <Link href={`/admin/mahsulotlar?brend=${brand.id}`} className="mt-1 inline-block text-xs font-medium text-accent-ink hover:underline">
                    {brand.productCount} ta mahsulot
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={!canEdit || pending || index === 0} onClick={() => run(() => moveBrandAction(brand.id, -1), "Tartib o‘zgardi")} className="rounded-lg p-2 text-ink-muted hover:bg-page-2 disabled:opacity-30" title="Yuqoriga">
                    <ArrowUp className="size-4" aria-hidden="true" />
                    <span className="sr-only">{brand.name}ni yuqoriga surish</span>
                  </button>
                  <button type="button" disabled={!canEdit || pending || index === brands.length - 1} onClick={() => run(() => moveBrandAction(brand.id, 1), "Tartib o‘zgardi")} className="rounded-lg p-2 text-ink-muted hover:bg-page-2 disabled:opacity-30" title="Pastga">
                    <ArrowDown className="size-4" aria-hidden="true" />
                    <span className="sr-only">{brand.name}ni pastga surish</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setEditingId(brand.id);
                      setEdit({ name: brand.name, description: brand.description });
                      setFieldErrors({});
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/40 disabled:opacity-40"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" /> Tahrirlash
                  </button>
                  {confirmDelete === brand.id ? (
                    <span className="flex items-center gap-1">
                      <button type="button" disabled={pending} onClick={() => run(() => deleteBrandAction(brand.id), `«${brand.name}» o‘chirildi`, () => setConfirmDelete(null))} className="rounded-lg bg-sale px-3 py-1.5 text-xs font-semibold text-white">
                        Ha, o‘chirish
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 text-xs text-ink-muted">
                        Yo‘q
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canEdit || brand.productCount > 0}
                      onClick={() => setConfirmDelete(brand.id)}
                      title={brand.productCount > 0 ? "Mahsulotlari bor brendni o‘chirib bo‘lmaydi" : "O‘chirish"}
                      className="rounded-lg p-2 text-ink-muted hover:bg-sale-soft hover:text-sale disabled:opacity-30"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span className="sr-only">{brand.name}ni o‘chirish</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

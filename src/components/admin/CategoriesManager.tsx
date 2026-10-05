"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, CornerDownRight, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import type { TaxonomyResult } from "@/app/admin/(panel)/brendlar/actions";
import { createCategoryAction, deleteCategoryAction, moveCategoryAction, updateCategoryAction } from "@/app/admin/(panel)/kategoriyalar/actions";
import { slugify } from "@/lib/admin/product-form";
import { useToast } from "@/providers/ToastProvider";
import { inputClass } from "./product-form/fields";

export interface CategoryNodeView {
  id: string;
  name: string;
  description: string;
  path: string;
  depth: number;
  /** To‘g‘ridan-to‘g‘ri shu bo‘limdagi mahsulotlar. */
  directCount: number;
  /** Ichki bo‘limlari bilan birga. */
  totalCount: number;
  children: CategoryNodeView[];
}

const MAX_DEPTH = 2;

type Draft = { parentId: string | null; name: string; slug: string; description: string; slugTouched: boolean };

export function CategoriesManager({ tree, canEdit }: { tree: CategoryNodeView[]; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
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

  const startAdd = (parentId: string | null) => {
    setDraft({ parentId, name: "", slug: "", description: "", slugTouched: false });
    setFieldErrors({});
    setError(null);
  };

  const addForm = (parentLabel: string | null) =>
    draft && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const { parentId, name, slug, description } = draft;
          run(() => createCategoryAction({ parentId, name, slug, description }), `«${name.trim()}» bo‘limi qo‘shildi`, () => setDraft(null));
        }}
        className="my-2 rounded-2xl border border-accent/40 bg-accent-soft/40 p-3 sm:p-4"
        noValidate
      >
        <p className="text-sm font-semibold text-ink">{parentLabel ? `«${parentLabel}» ichida yangi bo‘lim` : "Yangi asosiy bo‘lim"}</p>
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_1.5fr]">
          <label className="text-xs font-medium text-ink-muted">
            Nomi
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value, slug: d.slugTouched ? d.slug : slugify(e.target.value) })}
              placeholder="Smart soatlar"
              maxLength={60}
              className={`${inputClass} mt-1 ${fieldErrors.name ? "border-sale" : "border-line"}`}
            />
            {fieldErrors.name && <span className="mt-1 block text-sale">{fieldErrors.name}</span>}
          </label>
          <label className="text-xs font-medium text-ink-muted">
            Manzil
            <input
              value={draft.slug}
              onChange={(e) => setDraft((d) => d && { ...d, slug: e.target.value.toLowerCase(), slugTouched: true })}
              placeholder="smart-soatlar"
              maxLength={60}
              className={`${inputClass} mt-1 ${fieldErrors.slug ? "border-sale" : "border-line"}`}
            />
            <span className={`mt-1 block ${fieldErrors.slug ? "text-sale" : "font-normal"}`}>{fieldErrors.slug ?? "Keyin o‘zgarmaydi"}</span>
          </label>
          <label className="text-xs font-medium text-ink-muted">
            Tavsif (ixtiyoriy)
            <input value={draft.description} onChange={(e) => setDraft((d) => d && { ...d, description: e.target.value })} maxLength={500} className={`${inputClass} mt-1 border-line`} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="submit" disabled={pending || !canEdit} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            Qo‘shish
          </button>
          <button type="button" onClick={() => setDraft(null)} className="h-10 rounded-full px-4 text-sm font-medium text-ink-muted hover:text-ink">
            Bekor qilish
          </button>
        </div>
      </form>
    );

  const renderNodes = (nodes: CategoryNodeView[]) => (
    <ul className={nodes[0] && nodes[0].depth > 0 ? "ml-4 border-l border-line pl-3 sm:ml-6 sm:pl-4" : ""}>
      {nodes.map((node, index) => (
        <li key={node.id} className="py-1">
          <div className={`rounded-xl px-3 py-2.5 ${node.depth === 0 ? "bg-surface" : "hover:bg-surface/70"}`}>
            {editingId === node.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => updateCategoryAction(node.id, edit), "Bo‘lim saqlandi", () => setEditingId(null));
                }}
                className="grid gap-2 md:grid-cols-[1fr_2fr_auto] md:items-end"
              >
                <label className="text-xs font-medium text-ink-muted">
                  Nomi
                  <input autoFocus value={edit.name} onChange={(e) => setEdit((d) => ({ ...d, name: e.target.value }))} maxLength={60} className={`${inputClass} mt-1 ${fieldErrors.name ? "border-sale" : "border-line"}`} />
                </label>
                <label className="text-xs font-medium text-ink-muted">
                  Tavsif
                  <input value={edit.description} onChange={(e) => setEdit((d) => ({ ...d, description: e.target.value }))} maxLength={500} className={`${inputClass} mt-1 border-line`} />
                </label>
                <div className="flex gap-1">
                  <button type="submit" disabled={pending} className="h-11 rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">
                    Saqlash
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded-full p-2.5 text-ink-muted hover:bg-page-2" title="Bekor qilish">
                    <X className="size-4" aria-hidden="true" />
                    <span className="sr-only">Bekor qilish</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`text-ink ${node.depth === 0 ? "font-semibold" : "font-medium"}`}>
                    {node.depth > 0 && <CornerDownRight className="mr-1 inline size-3.5 text-ink-muted" aria-hidden="true" />}
                    {node.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    /katalog/{node.path} ·{" "}
                    <Link href={`/admin/mahsulotlar?kategoriya=${node.id}`} className="font-medium text-accent-ink hover:underline">
                      {node.totalCount} ta mahsulot
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button type="button" disabled={!canEdit || pending || index === 0} onClick={() => run(() => moveCategoryAction(node.id, -1), "Tartib o‘zgardi")} className="rounded-lg p-2 text-ink-muted hover:bg-page-2 disabled:opacity-30" title="Yuqoriga">
                    <ArrowUp className="size-4" aria-hidden="true" />
                    <span className="sr-only">{node.name}ni yuqoriga surish</span>
                  </button>
                  <button type="button" disabled={!canEdit || pending || index === nodes.length - 1} onClick={() => run(() => moveCategoryAction(node.id, 1), "Tartib o‘zgardi")} className="rounded-lg p-2 text-ink-muted hover:bg-page-2 disabled:opacity-30" title="Pastga">
                    <ArrowDown className="size-4" aria-hidden="true" />
                    <span className="sr-only">{node.name}ni pastga surish</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setEditingId(node.id);
                      setEdit({ name: node.name, description: node.description });
                      setFieldErrors({});
                    }}
                    className="rounded-lg p-2 text-ink-muted hover:bg-page-2 hover:text-ink disabled:opacity-30"
                    title="Tahrirlash"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    <span className="sr-only">{node.name}ni tahrirlash</span>
                  </button>
                  {node.depth < MAX_DEPTH && (
                    <button
                      type="button"
                      disabled={!canEdit || node.directCount > 0}
                      onClick={() => startAdd(node.id)}
                      title={node.directCount > 0 ? "Bu bo‘limda mahsulotlar bor — ichki bo‘lim qo‘shib bo‘lmaydi" : "Ichki bo‘lim qo‘shish"}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-accent-ink hover:bg-accent-soft disabled:opacity-30"
                    >
                      <Plus className="size-3.5" aria-hidden="true" /> Ichki
                    </button>
                  )}
                  {confirmDelete === node.id ? (
                    <span className="flex items-center gap-1">
                      <button type="button" disabled={pending} onClick={() => run(() => deleteCategoryAction(node.id), `«${node.name}» o‘chirildi`, () => setConfirmDelete(null))} className="rounded-lg bg-sale px-2.5 py-1.5 text-xs font-semibold text-white">
                        Ha, o‘chirish
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="px-2 text-xs text-ink-muted">
                        Yo‘q
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canEdit || node.children.length > 0 || node.directCount > 0}
                      onClick={() => setConfirmDelete(node.id)}
                      title={node.children.length > 0 ? "Ichida bo‘limlari bor" : node.directCount > 0 ? "Ichida mahsulotlar bor" : "O‘chirish"}
                      className="rounded-lg p-2 text-ink-muted hover:bg-sale-soft hover:text-sale disabled:opacity-30"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span className="sr-only">{node.name}ni o‘chirish</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          {draft?.parentId === node.id && addForm(node.name)}
          {node.children.length > 0 && renderNodes(node.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-sale/30 bg-sale-soft p-3 text-sm text-sale">
          {error}
        </p>
      )}
      {draft?.parentId === null ? (
        addForm(null)
      ) : (
        <button type="button" onClick={() => startAdd(null)} disabled={!canEdit} className="mb-4 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40">
          <Plus className="size-4" aria-hidden="true" /> Yangi asosiy bo‘lim
        </button>
      )}
      <div className="rounded-[var(--radius-card)] border border-line bg-page-2/40 p-2 sm:p-3">{renderNodes(tree)}</div>
    </div>
  );
}

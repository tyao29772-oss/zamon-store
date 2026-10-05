"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AlertTriangle, LoaderCircle, Save, X, Zap } from "lucide-react";
import { quickEditAction } from "@/app/admin/(panel)/mahsulotlar/actions";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/providers/ToastProvider";

export interface QuickEditVariant {
  id: string;
  label: string;
  colorHex?: string;
  price: number;
  oldPrice: number | null;
  stock: number;
}

interface QuickEditButtonProps {
  productId: string;
  productName: string;
  updatedAt: string;
  variants: QuickEditVariant[];
  canSave: boolean;
  /** Telefon kartasida — butun karta havola, tugma uning ustida turishi kerak. */
  className?: string;
}

interface Row {
  id: string;
  price: string;
  oldPrice: string;
  stock: string;
}

const toRows = (variants: QuickEditVariant[]): Row[] =>
  variants.map((v) => ({ id: v.id, price: String(v.price), oldPrice: v.oldPrice ? String(v.oldPrice) : "", stock: String(v.stock) }));

const digits = (text: string) => text.replace(/[^\d]/g, "");

/** Ro‘yxatdan chiqmasdan narx, chegirma va qoldiqni o‘zgartirish oynasi. */
export function QuickEditButton({ productId, productName, updatedAt, variants, canSave, className }: QuickEditButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<Row[]>(() => toRows(variants));
  const [error, setError] = useState<{ message: string; conflict?: boolean } | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const initial = JSON.stringify(toRows(variants));
  const dirty = JSON.stringify(rows) !== initial;

  const open = () => {
    setRows(toRows(variants));
    setError(null);
    setRowErrors({});
    dialogRef.current?.showModal();
  };
  const close = () => {
    if (dirty && !window.confirm("Saqlanmagan o‘zgarishlar bor. Yopilsinmi?")) return;
    dialogRef.current?.close();
  };

  const update = (index: number, patch: Partial<Row>) => setRows((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const step = (index: number, delta: number) =>
    update(index, { stock: String(Math.max(0, Math.min(100_000, (Number(rows[index]!.stock) || 0) + delta))) });

  const save = () => {
    setError(null);
    setRowErrors({});
    const local: Record<string, string> = {};
    for (const row of rows) {
      if (!Number(digits(row.price))) local[row.id] = "Narxni kiriting";
      else if (row.oldPrice && Number(digits(row.oldPrice)) <= Number(digits(row.price))) local[row.id] = "Eski narx yangi narxdan katta bo‘lishi kerak";
    }
    if (Object.keys(local).length > 0) {
      setRowErrors(local);
      return;
    }
    startTransition(async () => {
      try {
        const result = await quickEditAction({
          id: productId,
          updatedAt,
          variants: rows.map((r) => ({
            id: r.id,
            price: Number(digits(r.price)),
            oldPrice: r.oldPrice ? Number(digits(r.oldPrice)) : null,
            stock: Number(r.stock) || 0,
          })),
        });
        if (!result.ok) {
          setError({ message: result.error, conflict: result.conflict });
          setRowErrors(result.variantErrors ?? {});
          return;
        }
        dialogRef.current?.close();
        toast.show(`«${productName}» saqlandi`);
        router.refresh();
      } catch {
        setError({ message: "Server bilan aloqa uzildi. Qayta urinib ko‘ring." });
      }
    });
  };

  const total = rows.reduce((sum, r) => sum + (Number(r.stock) || 0), 0);

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={!canSave}
        title={canSave ? "Narx va qoldiqni tez o‘zgartirish" : "Baza ulanmagan"}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/40 disabled:opacity-40 ${className ?? ""}`}
      >
        <Zap className="size-3.5" aria-hidden="true" />
        Tez tahrir
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`qe-${productId}`}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        className="m-auto w-[min(640px,calc(100vw-24px))] rounded-[var(--radius-card)] border border-line bg-surface p-0 text-left text-ink shadow-[var(--shadow-pop)] backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
            <div className="min-w-0">
              <h2 id={`qe-${productId}`} className="truncate text-base font-semibold">
                {productName}
              </h2>
              <p className="text-xs text-ink-muted">
                Narx, chegirma va qoldiq · jami {formatNumber(total)} dona
              </p>
            </div>
            <button type="button" onClick={close} className="rounded-lg p-1.5 text-ink-muted hover:bg-page-2 hover:text-ink">
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Yopish</span>
            </button>
          </div>

          <ul className="flex-1 divide-y divide-line overflow-y-auto px-4 sm:px-5">
            {variants.map((variant, index) => {
              const row = rows[index]!;
              const rowError = rowErrors[variant.id];
              return (
                <li key={variant.id} className="py-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    {variant.colorHex && <span className="size-3.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: variant.colorHex }} aria-hidden="true" />}
                    {variant.label}
                    {Number(row.stock) === 0 && <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-ink-muted">Tugagan</span>}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <label className="text-xs text-ink-muted">
                      Narx
                      <input
                        inputMode="numeric"
                        value={digits(row.price) ? formatNumber(Number(digits(row.price))) : ""}
                        onChange={(e) => update(index, { price: digits(e.target.value).slice(0, 11) })}
                        aria-invalid={rowError ? true : undefined}
                        className={`mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm tabular-nums text-ink outline-none focus:border-accent ${rowError ? "border-sale" : "border-line"}`}
                      />
                    </label>
                    <label className="text-xs text-ink-muted">
                      Eski narx (chegirma)
                      <input
                        inputMode="numeric"
                        value={digits(row.oldPrice) ? formatNumber(Number(digits(row.oldPrice))) : ""}
                        onChange={(e) => update(index, { oldPrice: digits(e.target.value).slice(0, 11) })}
                        placeholder="yo‘q"
                        className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm tabular-nums text-ink outline-none focus:border-accent"
                      />
                    </label>
                    <div className="col-span-2 text-xs text-ink-muted sm:col-span-1">
                      <span id={`qe-stock-${variant.id}`}>Qoldiq</span>
                      <div className="mt-1 flex h-10 items-stretch overflow-hidden rounded-xl border border-line bg-white" role="group" aria-labelledby={`qe-stock-${variant.id}`}>
                        <button type="button" onClick={() => step(index, -1)} className="w-10 text-lg hover:bg-page-2" aria-label="Kamaytirish">−</button>
                        <input
                          inputMode="numeric"
                          value={row.stock}
                          onChange={(e) => update(index, { stock: digits(e.target.value).slice(0, 6) })}
                          aria-label={`${variant.label} qoldig‘i`}
                          className="w-16 bg-transparent text-center text-sm tabular-nums text-ink outline-none"
                        />
                        <button type="button" onClick={() => step(index, 1)} className="w-10 text-lg hover:bg-page-2" aria-label="Oshirish">+</button>
                      </div>
                    </div>
                  </div>
                  {rowError && <p className="mt-1 text-xs text-sale">{rowError}</p>}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line p-4 sm:p-5">
            {error && (
              <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-sale-soft p-3 text-sm text-sale">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{error.message}</span>
                {error.conflict && (
                  <button type="button" onClick={() => window.location.reload()} className="shrink-0 font-semibold underline">
                    Yangilash
                  </button>
                )}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={close} className="h-11 rounded-full px-5 text-sm font-medium text-ink-muted hover:text-ink">
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || pending}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

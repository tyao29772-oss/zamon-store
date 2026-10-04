"use client";

import { LayoutTemplate, Plus, Trash2, X } from "lucide-react";
import { getSpecTemplate } from "@/lib/admin/product-form";
import type { SpecGroup } from "@/types";
import { inputClass, Section } from "./fields";

interface SpecsEditorProps {
  specs: SpecGroup[];
  categoryId: string;
  onChange: (specs: SpecGroup[]) => void;
}

/** Xususiyatlar: bo‘limlar (Ekran, Kamera ...) va ularning qatorlari. Bo‘sh qatorlar saqlanmaydi. */
export function SpecsEditor({ specs, categoryId, onChange }: SpecsEditorProps) {
  const setGroup = (index: number, group: SpecGroup) => onChange(specs.map((g, i) => (i === index ? group : g)));

  const applyTemplate = () => {
    const hasValues = specs.some((g) => g.items.some((item) => item.value.trim()));
    if (hasValues && !window.confirm("Hozirgi xususiyatlar shablon bilan almashtiriladi. Davom etasizmi?")) return;
    onChange(getSpecTemplate(categoryId));
  };

  return (
    <Section
      title="Xususiyatlar"
      description="Mahsulot sahifasidagi «Xususiyatlar» jadvali. Qiymati bo‘sh qatorlar saytda ko‘rinmaydi."
      actions={
        <button
          type="button"
          onClick={applyTemplate}
          disabled={!categoryId}
          title={categoryId ? undefined : "Avval kategoriyani tanlang"}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-ink/40 disabled:opacity-40"
        >
          <LayoutTemplate className="size-4" aria-hidden="true" />
          Tayyor shablon
        </button>
      }
    >
      {specs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          Hali xususiyat yo‘q. «Tayyor shablon» ni bosing — telefon uchun Ekran, Protsessor, Kamera, Batareya bo‘limlari chiqadi, siz faqat qiymatlarini yozasiz.
        </p>
      ) : (
        <div className="space-y-4">
          {specs.map((group, gi) => (
            <div key={gi} className="rounded-2xl border border-line bg-white/70 p-3 sm:p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={group.title}
                  onChange={(e) => setGroup(gi, { ...group, title: e.target.value })}
                  placeholder="Bo‘lim nomi (masalan, Kamera)"
                  aria-label={`${gi + 1}-bo‘lim nomi`}
                  maxLength={80}
                  className={`${inputClass} border-line font-semibold`}
                />
                <button
                  type="button"
                  onClick={() => onChange(specs.filter((_, i) => i !== gi))}
                  className="shrink-0 rounded-lg p-2.5 text-ink-muted hover:bg-sale-soft hover:text-sale"
                  title="Bo‘limni o‘chirish"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">{gi + 1}-bo‘limni o‘chirish</span>
                </button>
              </div>

              <ul className="mt-3 space-y-2">
                {group.items.map((item, ii) => (
                  <li key={ii} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => setGroup(gi, { ...group, items: group.items.map((it, k) => (k === ii ? { ...it, label: e.target.value } : it)) })}
                      placeholder="Nomi (Asosiy kamera)"
                      aria-label="Xususiyat nomi"
                      maxLength={80}
                      className={`${inputClass} border-line h-10`}
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => setGroup(gi, { ...group, items: group.items.map((it, k) => (k === ii ? { ...it, value: e.target.value } : it)) })}
                      placeholder="Qiymati (48 MP + 12 MP)"
                      aria-label={`${item.label || "Xususiyat"} qiymati`}
                      maxLength={300}
                      className={`${inputClass} border-line col-span-1 row-start-2 h-10 sm:row-start-auto`}
                    />
                    <button
                      type="button"
                      onClick={() => setGroup(gi, { ...group, items: group.items.filter((_, k) => k !== ii) })}
                      className="row-span-2 self-center rounded-lg p-2 text-ink-muted hover:bg-page-2 hover:text-ink sm:row-span-1"
                      title="Qatorni o‘chirish"
                    >
                      <X className="size-4" aria-hidden="true" />
                      <span className="sr-only">Qatorni o‘chirish</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setGroup(gi, { ...group, items: [...group.items, { label: "", value: "" }] })}
                disabled={group.items.length >= 50}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline disabled:opacity-40"
              >
                <Plus className="size-3.5" aria-hidden="true" /> Qator qo‘shish
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onChange([...specs, { title: "", items: [{ label: "", value: "" }] }])}
        disabled={specs.length >= 30}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/25 py-3 text-sm font-medium text-ink hover:border-ink/50 hover:bg-white/60 disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden="true" />
        Bo‘lim qo‘shish
      </button>
    </Section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteDemoProductsAction } from "@/app/admin/(panel)/zaxira/actions";
import { DEMO_CONFIRM_WORD, isDemoConfirmed } from "@/lib/admin/demo-confirm";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/providers/ToastProvider";
import { inputClass } from "./product-form/fields";

/** «Zaxira» sahifasida: namunaviy mahsulotlarni bir marta, tasdiq bilan o‘chirish. */
export function DemoCleanup({ demoCount, ownCount, canEdit }: { demoCount: number; ownCount: number; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (demoCount === 0) {
    return <p className="mt-3 rounded-2xl bg-ok-soft p-4 text-sm text-ok">Namunaviy mahsulotlar yo‘q — do‘kon faqat sizning mahsulotlaringiz bilan ishlayapti.</p>;
  }

  const run = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteDemoProductsAction(confirm);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setConfirm("");
        toast.show(`${formatNumber(result.deleted)} ta namunaviy mahsulot o‘chirildi`);
        router.refresh();
      } catch {
        setError("Server bilan aloqa uzildi. Qayta urinib ko‘ring.");
      }
    });
  };

  return (
    <div className="mt-3 space-y-3 text-sm">
      <p className="text-ink-muted">
        Saytda dastur bilan kelgan <b className="text-ink">{formatNumber(demoCount)} ta namunaviy mahsulot</b> bor (narxlari o‘ylab topilgan).
        {ownCount > 0 ? ` Siz qo‘shgan ${formatNumber(ownCount)} ta mahsulotga tegilmaydi.` : ""} Do‘konni haqiqiy ishga tushirishdan oldin ularni o‘chiring.
      </p>
      <p className="text-xs text-ink-muted">Avval yuqoridan «To‘liq zaxira»ni yuklab oling. Buyurtmalar o‘chmaydi. Bu amalni ortga qaytarib bo‘lmaydi (faqat zaxiradan).</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-medium text-ink-muted">
          Tasdiqlash uchun «{DEMO_CONFIRM_WORD}» deb yozing
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!canEdit || pending} className={`${inputClass} mt-1 w-56 border-line`} autoComplete="off" />
        </label>
        <button
          type="button"
          onClick={run}
          disabled={!canEdit || pending || !isDemoConfirmed(confirm)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-sale px-5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
          Namunaviy mahsulotlarni o‘chirish
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-sale-soft px-3 py-2 text-sale">
          {error}
        </p>
      )}
    </div>
  );
}

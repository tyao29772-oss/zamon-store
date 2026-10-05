"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/admin/(panel)/mahsulotlar/actions";

/** Ikki bosqichli o‘chirish: avval ogohlantirish, keyin tasdiqlash. Muvaffaqiyatda server ro‘yxatga yo‘naltiradi. */
export function DeleteProductButton({ productId, productName, canDelete }: { productId: string; productName: string; canDelete: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteProductAction(productId);
        // Muvaffaqiyatda action yo‘naltiradi (redirect) — bu yerga faqat xato bilan qaytadi.
        if (result && !result.ok) setError(result.error);
      } catch (e) {
        // Next'ning yo‘naltirish signali xato emas — uni qayta uzatamiz.
        unstable_rethrow(e);
        setError("Server bilan aloqa uzildi. Qayta urinib ko‘ring.");
      }
    });
  };

  return (
    <section className="mt-8 rounded-[var(--radius-card)] border border-sale/25 bg-sale-soft/40 p-4 sm:p-6">
      <h2 className="text-base font-semibold text-ink">Mahsulotni o‘chirish</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Butunlay o‘chiriladi va qaytarib bo‘lmaydi. Vaqtincha olib qo‘ymoqchi bo‘lsangiz — o‘chirish o‘rniga yuqorida «Saytda ko‘rsatish»ni o‘chiring.
        Eski buyurtmalarda mahsulot nomi va narxi saqlanib qoladi.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={!canDelete}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-sale/40 bg-white px-5 text-sm font-semibold text-sale hover:bg-sale hover:text-white disabled:opacity-40"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          O‘chirish
        </button>
      ) : (
        <div className="mt-4 rounded-2xl bg-white p-4" role="alertdialog" aria-label="O‘chirishni tasdiqlash">
          <p className="text-sm font-medium text-ink">«{productName}» butunlay o‘chirilsinmi?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-sale px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
              Ha, butunlay o‘chirish
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="h-11 rounded-full px-5 text-sm font-medium text-ink-muted hover:text-ink">
              Bekor qilish
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-sale">
          {error}
        </p>
      )}
    </section>
  );
}

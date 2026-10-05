"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { updateOrderStatusAction } from "@/app/admin/(panel)/buyurtmalar/actions";
import { ORDER_STATUS_META, ORDER_STATUSES } from "@/lib/admin/order-list";
import { useToast } from "@/providers/ToastProvider";
import type { OrderStatus } from "@/types";

interface OrderStatusControlProps {
  orderId: string;
  status: OrderStatus;
  stockDeducted: boolean;
  canEdit: boolean;
  /** Ro‘yxatda ixchamroq. */
  compact?: boolean;
}

type Pending = { target: OrderStatus; question: "deduct" | "restore" } | null;

/**
 * Holat tugmalari. «Bajarildi» — qoldiqdan 1 dona ayirishni taklif qiladi; ayirilgan buyurtma
 * boshqa holatga o‘tsa — qaytarishni taklif qiladi. Ikki marta ayirilmaydi (server ham tekshiradi).
 */
export function OrderStatusControl({ orderId, status, stockDeducted, canEdit, compact }: OrderStatusControlProps) {
  const router = useRouter();
  const toast = useToast();
  const [question, setQuestion] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const apply = (target: OrderStatus, stock: "deduct" | "restore" | "none") => {
    setQuestion(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateOrderStatusAction(orderId, target, stock);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.show(result.notice ?? `${orderId}: ${ORDER_STATUS_META[target].label}`, result.notice ? "info" : "success");
        router.refresh();
      } catch {
        setError("Server bilan aloqa uzildi. Qayta urinib ko‘ring.");
      }
    });
  };

  const choose = (target: OrderStatus) => {
    if (target === status || busy) return;
    if (target === "done" && !stockDeducted) setQuestion({ target, question: "deduct" });
    else if (target !== "done" && stockDeducted) setQuestion({ target, question: "restore" });
    else apply(target, "none");
  };

  return (
    <div>
      <div role="group" aria-label={`${orderId} holati`} className="flex flex-wrap gap-1.5">
        {ORDER_STATUSES.map((s) => {
          const active = s === status;
          return (
            <button
              key={s}
              type="button"
              onClick={() => choose(s)}
              disabled={!canEdit || busy}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors disabled:cursor-not-allowed ${
                compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"
              } ${active ? `${ORDER_STATUS_META[s].badge} border-transparent font-semibold` : "border-line bg-white text-ink-muted hover:border-ink/40 hover:text-ink disabled:opacity-50"}`}
            >
              {ORDER_STATUS_META[s].label}
            </button>
          );
        })}
        {busy && <LoaderCircle className="size-4 animate-spin self-center text-ink-muted" aria-label="Saqlanmoqda" />}
      </div>

      {question && (
        <div className="mt-2 rounded-xl border border-line bg-white p-3 text-sm" role="alertdialog" aria-label="Qoldiq haqida savol">
          <p className="text-ink">
            {question.question === "deduct"
              ? "Sotildimi? Mahsulot qoldig‘idan 1 dona ayirilsinmi?"
              : "Bu buyurtma uchun qoldiqdan 1 dona ayirilgan edi. Qoldiqqa qaytarilsinmi?"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => apply(question.target, question.question)}
              className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black"
            >
              {question.question === "deduct" ? "Ha, 1 dona ayir" : "Ha, qaytar"}
            </button>
            <button
              type="button"
              onClick={() => apply(question.target, "none")}
              className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink hover:border-ink/40"
            >
              Yo‘q, faqat holatni o‘zgartir
            </button>
            <button type="button" onClick={() => setQuestion(null)} className="px-2 py-1.5 text-xs text-ink-muted hover:text-ink">
              Bekor
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-sale">
          {error}
        </p>
      )}
    </div>
  );
}

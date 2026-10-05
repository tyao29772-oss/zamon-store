"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Send, ShieldCheck, X } from "lucide-react";
import { useStoreContact } from "@/providers/StoreContactProvider";
import { formatPrice } from "@/lib/format";
import { describeVariantForOrder, getVariantPriceInfo } from "@/lib/product";
import { normalizeUzPhone } from "@/lib/phone";
import { buildOrderMessage, createTelegramLink } from "@/lib/telegram";
import { absoluteUrl, productHref } from "@/lib/urls";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/providers/ToastProvider";
import type { CreateOrderError, CreateOrderResponse } from "@/app/api/orders/route";
import type { Product, ProductVariant } from "@/types";

interface OrderModalProps {
  product: Product;
  variant: ProductVariant;
  onClose: () => void;
}

type Step = "form" | "success";

/**
 * Telegram orqali buyurtma berish oynasi (Variant B). Native `<dialog>` — brauzer o‘zi fokus
 * tuzog‘i va Esc bilan yopishni ta’minlaydi. Faqat `orderModalOpen` bo‘lganda mount qilinadi
 * (ProductView'da), shuning uchun har ochilishda holat toza boshlanadi.
 */
export function OrderModal({ product, variant, onClose }: OrderModalProps) {
  const { telegramUsername, storeName } = useStoreContact();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const { show } = useToast();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [orderId, setOrderId] = useState<string | null>(null);

  const price = getVariantPriceInfo(variant);
  const variantText = describeVariantForOrder(product, variant);

  useEffect(() => {
    dialogRef.current?.showModal();
    nameRef.current?.focus();
  }, []);

  function close() {
    dialogRef.current?.close();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const phoneClean = normalizeUzPhone(phone);
    const errors: Record<string, string[]> = {};
    if (name.trim().length < 2) errors.name = ["Ismingizni kiriting"];
    if (!phoneClean) errors.phone = ["+998 90 123 45 67 ko‘rinishida kiriting"];
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    const formEl = event.currentTarget;
    const honeypot = (new FormData(formEl).get("website") as string) ?? "";

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.slug,
          variantId: variant.id,
          name: name.trim(),
          phone,
          note: note.trim() || undefined,
          website: honeypot,
        }),
      });

      const data: CreateOrderResponse | CreateOrderError = await response.json();

      if (!response.ok || "error" in data) {
        const message = "error" in data ? data.error : "Xatolik yuz berdi. Qayta urinib ko‘ring.";
        setServerError(message);
        if ("fieldErrors" in data && data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      trackEvent("order_submit", {
        orderId: data.orderId,
        productId: product.id,
        price: variant.price,
      });

      setOrderId(data.orderId);
      setStep("success");

      const link = createTelegramLink(
        telegramUsername,
        buildOrderMessage({
          orderId: data.orderId,
          productName: product.name,
          variantText,
          price: variant.price,
          productUrl: absoluteUrl(productHref(product.slug, variant.id)),
          storeName,
        }),
      );
      // Avtomatik ochishga urinish — ba’zi brauzerlar pop-up sifatida bloklashi mumkin,
      // shuning uchun muvaffaqiyat ekranida ham aniq tugma bor (pastda).
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {
      setServerError("Internet aloqasida muammo. Qayta urinib ko‘ring.");
    } finally {
      setSubmitting(false);
    }
  }

  const telegramLink =
    step === "success" && orderId
      ? createTelegramLink(
          telegramUsername,
          buildOrderMessage({
            orderId,
            productName: product.name,
            variantText,
            price: variant.price,
            productUrl: absoluteUrl(productHref(product.slug, variant.id)),
            storeName,
          }),
        )
      : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      aria-labelledby="order-modal-title"
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(460px,calc(100vw-32px))] overflow-y-auto rounded-[28px] border-0 bg-surface p-0 shadow-pop backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="order-modal-title" className="font-display text-2xl font-semibold text-ink">
            {step === "form" ? "Buyurtma berish" : "Buyurtma qabul qilindi"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Oynani yopish"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {step === "form" ? (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-page/60 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                {variantText && <p className="truncate text-[13px] text-ink-muted">{variantText}</p>}
              </div>
              <p className={`shrink-0 text-sm font-bold ${price.hasDiscount ? "text-sale" : "text-ink"}`}>
                {formatPrice(price.price)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="order-name" className="text-sm font-semibold text-ink">
                  Ism
                </label>
                <input
                  ref={nameRef}
                  id="order-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-line bg-page px-4 text-[15px] outline-none focus-visible:border-ink"
                  placeholder="Ismingiz"
                />
                {fieldErrors.name && <p className="mt-1 text-[13px] text-sale">{fieldErrors.name[0]}</p>}
              </div>

              <div>
                <label htmlFor="order-phone" className="text-sm font-semibold text-ink">
                  Telefon
                </label>
                <input
                  id="order-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-line bg-page px-4 text-[15px] outline-none focus-visible:border-ink"
                  placeholder="+998 90 123 45 67"
                />
                {fieldErrors.phone && <p className="mt-1 text-[13px] text-sale">{fieldErrors.phone[0]}</p>}
              </div>

              <div>
                <label htmlFor="order-note" className="text-sm font-semibold text-ink">
                  Manzil yoki izoh <span className="font-normal text-ink-muted">(ixtiyoriy)</span>
                </label>
                <textarea
                  id="order-note"
                  name="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  maxLength={500}
                  className="mt-1.5 w-full resize-none rounded-xl border border-line bg-page px-4 py-3 text-[15px] outline-none focus-visible:border-ink"
                  placeholder="Masalan: yetkazib berish manzili"
                />
              </div>

              {/* Honeypot — haqiqiy foydalanuvchiga ko‘rinmaydi, faqat botlar to‘ldiradi. */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-auto size-px overflow-hidden">
                <label htmlFor="order-website">Veb-sayt</label>
                <input id="order-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              {serverError && (
                <p role="alert" className="rounded-xl bg-sale-soft px-4 py-2.5 text-[13px] text-sale">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-60"
              >
                <Send className="size-4" aria-hidden="true" />
                {submitting ? "Yuborilmoqda…" : "Yuborish"}
              </button>

              <p className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
                Ma’lumotlaringiz faqat buyurtmani tasdiqlash uchun ishlatiladi.
              </p>
            </form>
          </>
        ) : (
          <SuccessScreen
            orderId={orderId!}
            telegramLink={telegramLink!}
            onCopy={() => show("Xabar nusxalandi")}
            onClose={close}
          />
        )}
      </div>
    </dialog>
  );
}

function SuccessScreen({
  orderId,
  telegramLink,
  onCopy,
  onClose,
}: {
  orderId: string;
  telegramLink: string;
  onCopy: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    try {
      const url = new URL(telegramLink);
      const text = decodeURIComponent(url.searchParams.get("text") ?? "");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard ruxsati bo‘lmasa — jimgina o‘tkaziladi, foydalanuvchi matnni qo‘lda ko‘chirishi mumkin.
    }
  }

  return (
    <div className="mt-2 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-ok-soft text-ok">
        <Check className="size-7" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm text-ink-muted">Buyurtmangiz qabul qilindi</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">#{orderId}</p>
      <p className="mt-3 text-[13px] text-ink-muted">
        Endi tayyor xabarni Telegram orqali yuboring — do‘kon narxi va mavjudligini tasdiqlab beradi.
      </p>

      <div className="mt-6 space-y-2.5">
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          <Send className="size-4" aria-hidden="true" />
          Telegramni ochish
        </a>
        <button
          type="button"
          onClick={copyMessage}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink/15 text-sm font-semibold text-ink transition-colors hover:bg-page"
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Nusxalandi" : "Xabarni nusxalash"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full items-center justify-center text-sm font-medium text-ink-muted hover:text-ink"
        >
          Yopish
        </button>
      </div>
    </div>
  );
}

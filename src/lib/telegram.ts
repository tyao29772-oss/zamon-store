import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";
import type { Money } from "@/types";

export interface OrderMessageInput {
  /** `QP-000123` — bo‘lsa xabarga «Buyurtma: #…» qatori qo‘shiladi. */
  orderId?: string;
  productName: string;
  /** `describeVariantForOrder` natijasi; `null` bo‘lsa «Variant» qatori chiqmaydi. */
  variantText: string | null;
  price: Money;
  productUrl: string;
}

/** Mijoz Telegram’da yuboradigan tayyor xabar. */
export function buildOrderMessage(input: OrderMessageInput): string {
  const lines = [
    `Assalomu alaykum. Men ${siteConfig.name} saytidan quyidagi mahsulotga qiziqyapman:`,
    "",
  ];

  if (input.orderId) lines.push(`Buyurtma: #${input.orderId}`);
  lines.push(`Mahsulot: ${input.productName}`);
  if (input.variantText) lines.push(`Variant: ${input.variantText}`);
  lines.push(`Narx: ${formatPrice(input.price)}`);
  lines.push(`Havola: ${input.productUrl}`);
  lines.push("", "Narxi va mavjudligini tasdiqlab bera olasizmi?");

  return lines.join("\n");
}

/** `https://t.me/<username>` yoki matn bilan `?text=…` */
export function createTelegramLink(username: string, text?: string): string {
  const clean = username.trim().replace(/^@/, "");
  const base = `https://t.me/${clean}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function createTelegramOrderLink(
  username: string,
  input: OrderMessageInput,
): string {
  return createTelegramLink(username, buildOrderMessage(input));
}

/** Telegram `parse_mode=HTML` uchun foydalanuvchi matnini xavfsiz qiladi. */
export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

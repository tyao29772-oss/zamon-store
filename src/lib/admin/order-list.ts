import { normalizeText } from "@/lib/search/normalize";
import type { Order, OrderStatus } from "@/types";

/**
 * Admin «Buyurtmalar»: holatlar, tablar, qidiruv va vaqt formati. Sof funksiyalar —
 * brauzer ham, server ham ishlatadi.
 */

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tab: string; badge: string }> = {
  new: { label: "Yangi", tab: "yangi", badge: "bg-accent-soft text-accent-ink" },
  contacted: { label: "Bog‘lanildi", tab: "boglanildi", badge: "bg-warn-soft text-warn" },
  done: { label: "Bajarildi", tab: "bajarildi", badge: "bg-ok-soft text-ok" },
  cancelled: { label: "Bekor qilindi", tab: "bekor", badge: "bg-surface-muted text-ink-muted" },
};

export const ORDER_STATUSES: OrderStatus[] = ["new", "contacted", "done", "cancelled"];

export const ORDER_TABS = [
  { key: "hammasi", label: "Hammasi", status: null },
  ...ORDER_STATUSES.map((status) => ({ key: ORDER_STATUS_META[status].tab, label: ORDER_STATUS_META[status].label, status })),
] as const satisfies readonly { key: string; label: string; status: OrderStatus | null }[];

export type OrderTab = (typeof ORDER_TABS)[number]["key"];

export function parseOrderTab(value: unknown): OrderTab {
  return ORDER_TABS.some((t) => t.key === value) ? (value as OrderTab) : "hammasi";
}

function statusOfTab(tab: OrderTab): OrderStatus | null {
  return ORDER_TABS.find((t) => t.key === tab)?.status ?? null;
}

/**
 * Qidiruv: buyurtma raqami, mijoz ismi, mahsulot nomi (o‘/g‘ va katta-kichik harf farqisiz)
 * yoki telefon raqami (kamida 3 ta raqam — «90 123» ham, «+998901234567» ham topiladi).
 */
export function matchesOrderQuery(order: Order, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 3 && digits.length === q.replace(/[\s+()-]/g, "").length) {
    return order.phone.replace(/\D/g, "").includes(digits) || order.id.replace(/\D/g, "").includes(digits);
  }
  const haystack = normalizeText([order.id, order.customerName, order.productName, order.variantLabel, order.note ?? "", order.adminNote ?? ""].join(" "));
  return normalizeText(q)
    .split(" ")
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function filterOrders(orders: Order[], tab: OrderTab, query: string): Order[] {
  const status = statusOfTab(tab);
  return orders.filter((o) => (status === null || o.status === status) && matchesOrderQuery(o, query));
}

export function countOrderTabs(orders: Order[]): Record<OrderTab, number> {
  const counts = Object.fromEntries(ORDER_TABS.map((t) => [t.key, 0])) as Record<OrderTab, number>;
  for (const order of orders) {
    counts.hammasi += 1;
    counts[ORDER_STATUS_META[order.status].tab as OrderTab] += 1;
  }
  return counts;
}

/* ------------------------------------------------------------------ Vaqt (Toshkent) */

const TASHKENT = "Asia/Tashkent";

function tashkentParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TASHKENT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month"), year: get("year"), time: `${get("hour")}:${get("minute")}` };
}

/** `Bugun, 14:32` · `Kecha, 09:10` · `03.10.2026, 18:05` — Toshkent vaqti bo‘yicha. */
export function formatOrderTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const d = tashkentParts(date);
  const today = tashkentParts(now);
  const yesterday = tashkentParts(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const sameDay = (a: typeof d, b: typeof d) => a.day === b.day && a.month === b.month && a.year === b.year;
  if (sameDay(d, today)) return `Bugun, ${d.time}`;
  if (sameDay(d, yesterday)) return `Kecha, ${d.time}`;
  return `${d.day}.${d.month}.${d.year}, ${d.time}`;
}

/* ------------------------------------------------------------------ Mijoz bilan bog‘lanish */

/** `+998901234567` → `tel:+998901234567` */
export function phoneCallHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Telegram'da raqam orqali chat (raqam Telegram'ga ulangan va maxfiylik ruxsat bersa ochiladi). */
export function telegramChatHref(phone: string): string {
  return `https://t.me/${phone.replace(/[^\d+]/g, "")}`;
}

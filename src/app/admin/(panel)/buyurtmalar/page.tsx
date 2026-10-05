import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight, Inbox, PackageCheck, Search, StickyNote } from "lucide-react";
import { ContactButtons } from "@/components/admin/orders/ContactButtons";
import { OrderStatusControl } from "@/components/admin/orders/OrderStatusControl";
import { countOrderTabs, filterOrders, formatOrderTime, ORDER_STATUS_META, ORDER_TABS, parseOrderTab } from "@/lib/admin/order-list";
import { paginate } from "@/lib/catalog";
import { isDbConfigured } from "@/lib/db/supabase";
import { formatNumber, formatPrice } from "@/lib/format";
import { formatUzPhone } from "@/lib/phone";
import { listOrders } from "@/lib/repo/orders";
import type { Order } from "@/types";

export const metadata: Metadata = { title: "Buyurtmalar" };

const PAGE_SIZE = 20;
const BASE = "/admin/buyurtmalar";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function hrefWith(params: Record<string, string | undefined>, changes: Record<string, string | undefined>): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...changes })) if (value) next.set(key, value);
  const query = next.toString();
  return query ? `${BASE}?${query}` : BASE;
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/buyurtmalar">) {
  await connection();
  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 100) ?? "";
  const tab = parseOrderTab(first(sp.holat));
  const page = Number.parseInt(first(sp.sahifa) ?? "1", 10) || 1;
  const params = { q: q || undefined, holat: tab === "hammasi" ? undefined : tab };

  let orders: Order[];
  let loadError = false;
  try {
    orders = await listOrders();
  } catch (error) {
    console.error("[admin/orders] ro‘yxat:", error);
    orders = [];
    loadError = true;
  }

  const scoped = filterOrders(orders, "hammasi", q);
  const counts = countOrderTabs(scoped);
  const result = paginate(filterOrders(scoped, tab, ""), page, PAGE_SIZE);
  const canEdit = isDbConfigured();
  const now = new Date();

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-ink">Buyurtmalar</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Jami {formatNumber(orders.length)} ta
        {countOrderTabs(orders).yangi > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-accent-ink">{countOrderTabs(orders).yangi} tasi yangi — mijozlar kutyapti</span>
          </>
        )}
      </p>

      {loadError && (
        <p role="alert" className="mt-4 rounded-2xl bg-sale-soft p-4 text-sm text-sale">
          Buyurtmalarni yuklab bo‘lmadi. Internetni tekshirib, sahifani yangilang.
        </p>
      )}
      {!canEdit && (
        <p className="mt-4 rounded-2xl bg-warn-soft p-4 text-sm text-warn">
          Baza (Supabase) ulanmagan — lokal sinov buyurtmalari ko‘rsatilmoqda, holatini o‘zgartirib bo‘lmaydi.
        </p>
      )}

      <nav aria-label="Holat bo‘yicha" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {ORDER_TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={hrefWith(params, { holat: t.key === "hammasi" ? undefined : t.key, sahifa: undefined })}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink/40"
              }`}
            >
              {t.label}
              <span className={`tabular-nums ${active ? "text-white/70" : t.key === "yangi" && counts.yangi > 0 ? "font-semibold text-accent-ink" : "text-ink-muted"}`}>
                {counts[t.key]}
              </span>
            </Link>
          );
        })}
      </nav>

      <form action={BASE} className="mt-4 flex gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-3 sm:p-4">
        {params.holat && <input type="hidden" name="holat" value={params.holat} />}
        <label className="relative block flex-1">
          <span className="sr-only">Qidirish</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Raqam, ism, telefon yoki mahsulot…"
            className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <button type="submit" className="h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-black">
          Qidirish
        </button>
        {q && (
          <Link href={hrefWith(params, { q: undefined, sahifa: undefined })} className="hidden h-11 items-center rounded-xl border border-line px-4 text-sm font-medium text-ink hover:border-ink/40 sm:inline-flex">
            Tozalash
          </Link>
        )}
      </form>

      {result.total === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-10 text-center">
          <Inbox className="mx-auto size-10 text-ink-muted" aria-hidden="true" />
          <p className="mt-3 font-medium text-ink">{orders.length === 0 ? "Hali buyurtma yo‘q" : "Hech narsa topilmadi"}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {orders.length === 0
              ? "Mijoz saytda «Buyurtma berish» tugmasini bosganda, buyurtma shu yerda paydo bo‘ladi."
              : "Qidiruv so‘zini yoki holatni o‘zgartirib ko‘ring."}
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-3">
            {result.items.map((order) => {
              const isNew = order.status === "new";
              return (
                <li
                  key={order.id}
                  className={`rounded-[var(--radius-card)] border bg-surface p-4 sm:p-5 ${isNew ? "border-accent/50 shadow-[0_0_0_3px_var(--accent-soft)]" : "border-line"}`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`${BASE}/${order.id}`} className="font-semibold text-ink hover:underline">
                      #{order.id}
                    </Link>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ORDER_STATUS_META[order.status].badge}`}>
                      {ORDER_STATUS_META[order.status].label}
                    </span>
                    {order.stockDeducted && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted" title="Qoldiqdan 1 dona ayirilgan">
                        <PackageCheck className="size-3.5" aria-hidden="true" /> qoldiqdan ayirilgan
                      </span>
                    )}
                    <span className="ml-auto text-xs text-ink-muted">{formatOrderTime(order.createdAt, now)}</span>
                  </div>

                  <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm text-ink">
                        <span className="font-semibold">{order.productName}</span>
                        {order.variantLabel !== "—" && <span className="text-ink-muted"> · {order.variantLabel}</span>}
                      </p>
                      <p className="text-lg font-semibold tabular-nums text-ink">{formatPrice(order.price)}</p>
                      <p className="text-sm text-ink">
                        {order.customerName} · <span className="tabular-nums">{formatUzPhone(order.phone)}</span>
                      </p>
                      {order.note && <p className="rounded-xl bg-page-2/70 px-3 py-2 text-sm text-ink">«{order.note}»</p>}
                      {order.adminNote && (
                        <p className="flex items-start gap-1.5 text-xs text-ink-muted">
                          <StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {order.adminNote}
                        </p>
                      )}
                    </div>
                    <ContactButtons phone={order.phone} size="sm" />
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
                    <OrderStatusControl orderId={order.id} status={order.status} stockDeducted={Boolean(order.stockDeducted)} canEdit={canEdit} compact />
                    <Link href={`${BASE}/${order.id}`} className="text-sm font-medium text-accent-ink hover:underline">
                      Batafsil →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>

          {result.totalPages > 1 && (
            <nav aria-label="Sahifalar" className="mt-6 flex items-center justify-between gap-3">
              {result.page > 1 ? (
                <Link href={hrefWith(params, { sahifa: String(result.page - 1) })} className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-ink/40">
                  <ChevronLeft className="size-4" aria-hidden="true" /> Oldingi
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-ink-muted">
                {result.page} / {result.totalPages}
              </span>
              {result.page < result.totalPages ? (
                <Link href={hrefWith(params, { sahifa: String(result.page + 1) })} className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-ink/40">
                  Keyingi <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

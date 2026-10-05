import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowDownRight, ArrowUpRight, SearchX } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import {
  EMPTY_STATS,
  fillDays,
  getStatsRange,
  parsePeriod,
  percentChange,
  PERIODS,
  ratePercent,
  type StatsDay,
  type StatsResult,
} from "@/lib/admin/stats";
import { DbError, isDbConfigured } from "@/lib/db/supabase";
import { formatNumber, formatPrice } from "@/lib/format";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import { loadStats } from "@/lib/repo/stats";

export const metadata: Metadata = { title: "Statistika" };

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

function dayLabel(day: string): string {
  const [, m, d] = day.split("-").map(Number) as [number, number, number];
  return `${d}-${MONTHS[m - 1]}`;
}

function Change({ current, previous }: { current: number; previous: number }) {
  const change = percentChange(current, previous);
  if (change === null) return <span className="text-xs text-ink-muted">oldingi davrda yo‘q edi</span>;
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${change === 0 ? "text-ink-muted" : up ? "text-ok" : "text-sale"}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {up && change > 0 ? "+" : ""}
      {change}% <span className="font-normal text-ink-muted">&nbsp;oldingi davrga nisbatan</span>
    </span>
  );
}

function Kpi({ label, value, note, children }: { label: string; value: string; note?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      {/* Uzun summa (14 500 000 so‘m) tor kartaga sig‘sin */}
      <p className={`mt-2 font-semibold tabular-nums text-ink [overflow-wrap:anywhere] ${value.length > 9 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}>{value}</p>
      {note && <p className="mt-0.5 text-xs text-ink-muted">{note}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Kunlik ustunli grafik (CSS bilan, kutubxonasiz). */
function DailyBars({ title, days, pick, format, color }: { title: string; days: StatsDay[]; pick: (d: StatsDay) => number; format: (n: number) => string; color: string }) {
  const max = Math.max(1, ...days.map(pick));
  const total = days.reduce((sum, d) => sum + pick(d), 0);
  const labelEvery = Math.ceil(days.length / 6);
  return (
    <figure className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="text-xs text-ink-muted">jami {format(total)}</span>
      </figcaption>
      <div className="mt-4 flex h-32 items-end gap-[2px]" role="img" aria-label={`${title}: kunlar bo‘yicha`}>
        {days.map((d) => {
          const value = pick(d);
          return (
            <div key={d.day} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${dayLabel(d.day)}: ${format(value)}`}>
              <div className={`w-full rounded-t-[3px] ${value > 0 ? color : "bg-line/60"}`} style={{ height: value > 0 ? `${Math.max(4, (value / max) * 100)}%` : "2px" }} />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[2px] text-[10px] text-ink-muted">
        {days.map((d, i) => (
          <span key={d.day} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
            {i % labelEvery === 0 ? dayLabel(d.day) : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

function Table({ title, empty, head, rows }: { title: string; empty: string; head: string[]; rows: React.ReactNode[][] }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{empty}</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              {head.map((h, i) => (
                <th key={h} className={`pb-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((cells, r) => (
              <tr key={r}>
                {cells.map((cell, i) => (
                  <td key={i} className={`py-2 ${i > 0 ? "whitespace-nowrap pl-3 text-right tabular-nums" : "min-w-0 break-words"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function AdminStatsPage({ searchParams }: PageProps<"/admin/statistika">) {
  await connection();
  await requireAdmin();
  const period = parsePeriod((await searchParams).davr);
  const range = getStatsRange(period.days);

  let stats: StatsResult = EMPTY_STATS;
  let previous: StatsResult = EMPTY_STATS;
  let problem: string | null = isDbConfigured() ? null : "Baza (Supabase) ulanmagan — statistika bazada yig‘iladi.";
  const products = await getAllProductsForAdmin();
  if (!problem) {
    try {
      [stats, previous] = (await Promise.all([loadStats(range.from, range.to), loadStats(range.previousFrom, range.previousTo)])).map((s) => s ?? EMPTY_STATS) as [
        StatsResult,
        StatsResult,
      ];
    } catch (error) {
      console.error("[admin/stats] o‘qib bo‘lmadi:", error);
      problem =
        error instanceof DbError && error.status === 404
          ? "Statistika funksiyasi yo‘q — Supabase SQL Editor’da 0008_stats.sql ni ishga tushiring."
          : "Statistikani o‘qib bo‘lmadi. Internetni tekshirib, sahifani yangilang.";
    }
  }

  const names = new Map(products.map((p) => [p.id, p.name]));
  const productLink = (id: string, fallback?: string) =>
    names.has(id) ? (
      <Link href={`/admin/mahsulotlar/${id}`} className="font-medium text-ink hover:underline">
        {names.get(id)}
      </Link>
    ) : (
      <span className="text-ink-muted">{fallback ?? id} (o‘chirilgan)</span>
    );

  const days = fillDays(range.days, stats.days);
  const { orders, traffic } = stats;
  const funnel = [
    { label: "Saytga kirdi", value: traffic.visitors, share: false },
    { label: "Mahsulot ko‘rdi", value: traffic.views, share: false },
    { label: "«Buyurtma» bosdi", value: traffic.orderClicks, share: true },
    { label: "Buyurtma berdi", value: orders.total + orders.cancelled, share: true },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Statistika</h1>
          <p className="mt-1 text-sm text-ink-muted">Sayt tashriflari, buyurtmalar va qidiruvlar. Admin sifatida kirgan brauzerdagi ko‘rishlar hisoblanmaydi.</p>
        </div>
        <nav aria-label="Davr" className="flex gap-1 rounded-full border border-line bg-surface p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin/statistika?davr=${p.key}`}
              aria-current={p.key === period.key ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${p.key === period.key ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      {problem && <p role="alert" className="mt-5 rounded-2xl bg-warn-soft p-4 text-sm text-warn">{problem}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Tashrif buyuruvchilar" value={formatNumber(traffic.visitors)}>
          <Change current={traffic.visitors} previous={previous.traffic.visitors} />
        </Kpi>
        <Kpi label="Buyurtmalar" value={formatNumber(orders.total)} note={orders.cancelled > 0 ? `yana ${formatNumber(orders.cancelled)} tasi bekor qilingan` : undefined}>
          <Change current={orders.total} previous={previous.orders.total} />
        </Kpi>
        <Kpi label="Sotildi («Bajarildi»)" value={formatPrice(orders.revenueDone)} note={orders.revenueOpen > 0 ? `yana ${formatPrice(orders.revenueOpen)} jarayonda` : undefined}>
          <Change current={orders.revenueDone} previous={previous.orders.revenueDone} />
        </Kpi>
        <Kpi label="Konversiya" value={`${ratePercent(orders.total, traffic.visitors)}%`} note="tashrif buyuruvchilardan buyurtma berganlar">
          <span className="text-xs text-ink-muted">oldingi davrda {ratePercent(previous.orders.total, previous.traffic.visitors)}%</span>
        </Kpi>
      </div>

      {period.days > 1 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DailyBars title="Tashrif buyuruvchilar" days={days} pick={(d) => d.visitors} format={formatNumber} color="bg-accent" />
          <DailyBars title="Buyurtmalar" days={days} pick={(d) => d.orders} format={formatNumber} color="bg-ink" />
        </div>
      )}

      <section className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface p-5" aria-labelledby="funnel-title">
        <h2 id="funnel-title" className="text-sm font-semibold text-ink">
          Xaridor yo‘li
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-4">
          {funnel.map((step, i) => (
            <li key={step.label} className="rounded-2xl bg-page-2/70 p-4">
              <p className="text-xs text-ink-muted">
                {i + 1}. {step.label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatNumber(step.value)}</p>
              {step.share && <p className="text-xs text-ink-muted">kirganlarning {ratePercent(step.value, traffic.visitors)}%</p>}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-muted">«Mahsulot ko‘rdi» — jami ko‘rishlar (bir odam bir nechta mahsulot ko‘rishi mumkin).</p>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Table
          title="Eng ko‘p ko‘rilgan mahsulotlar"
          empty="Bu davrda ko‘rishlar yo‘q."
          head={["Mahsulot", "Ko‘rildi", "«Buyurtma» bosildi"]}
          rows={stats.topViewed.map((r) => [productLink(r.productId), formatNumber(r.views), formatNumber(r.orderClicks)])}
        />
        <Table
          title="Eng ko‘p buyurtma qilingan"
          empty="Bu davrda buyurtma yo‘q."
          head={["Mahsulot", "Buyurtma", "Sotildi"]}
          rows={stats.topOrdered.map((r) => [productLink(r.productId, r.productName), formatNumber(r.orders), r.revenue > 0 ? formatPrice(r.revenue) : "—"])}
        />
        <Table
          title="Ko‘p qidirilgan so‘zlar"
          empty="Bu davrda qidiruv yo‘q."
          head={["So‘z", "Odamlar", "Natija"]}
          rows={stats.topSearches.map((r) => [r.query, formatNumber(r.people), r.results > 0 ? formatNumber(r.results) : <span className="text-sale">0</span>])}
        />
        <section className="rounded-[var(--radius-card)] border border-sale/25 bg-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <SearchX className="size-4 text-sale" aria-hidden="true" /> Qidirib, topa olmaganlar
          </h2>
          <p className="mt-1 text-xs text-ink-muted">Xaridorlar shuni izlagan, lekin saytda hech narsa chiqmagan. Bu mahsulotni olib kelish yoki nomini to‘g‘rilash haqida o‘ylang.</p>
          {stats.missedSearches.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Hammasi topildi 👍</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {stats.missedSearches.map((r) => (
                <li key={r.query} className="flex items-center justify-between gap-3 py-2">
                  <a href={`/qidiruv?q=${encodeURIComponent(r.query)}`} target="_blank" rel="noreferrer" className="min-w-0 break-words font-medium text-ink hover:underline">
                    {r.query}
                  </a>
                  <span className="whitespace-nowrap text-xs tabular-nums text-ink-muted">{formatNumber(r.people)} kishi</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

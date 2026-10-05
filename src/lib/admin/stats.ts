/**
 * Admin «Statistika»: davr tanlash, vaqt mintaqasi bo‘yicha kun chegaralari va bazadan
 * keladigan (`admin_stats`) javob turlari. Sof funksiyalar — testlanadi.
 */

/** Do‘kon vaqt mintaqasi: «bugun» shu bo‘yicha boshlanadi. */
export const STATS_TIME_ZONE = "Asia/Tashkent";

export const PERIODS = [
  { key: "bugun", label: "Bugun", days: 1 },
  { key: "7", label: "7 kun", days: 7 },
  { key: "30", label: "30 kun", days: 30 },
  { key: "90", label: "90 kun", days: 90 },
] as const;

export type PeriodKey = (typeof PERIODS)[number]["key"];
export const DEFAULT_PERIOD: PeriodKey = "30";

export function parsePeriod(value: string | string[] | undefined): (typeof PERIODS)[number] {
  const key = Array.isArray(value) ? value[0] : value;
  return PERIODS.find((p) => p.key === key) ?? PERIODS.find((p) => p.key === DEFAULT_PERIOD)!;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** `date` vaqt mintaqasida qaysi kun: `2026-10-05`. */
export function zonedDay(date: Date, timeZone = STATS_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Vaqt mintaqasining UTC'dan farqi (ms) shu paytda. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** `date` kunining vaqt mintaqasidagi yarim tuni (UTC `Date` sifatida). */
export function zonedMidnight(date: Date, timeZone = STATS_TIME_ZONE): Date {
  const [y, m, d] = zonedDay(date, timeZone).split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d);
  return new Date(guess - zoneOffsetMs(new Date(guess), timeZone));
}

export interface StatsRange {
  from: Date;
  to: Date;
  /** Oldingi xuddi shunday uzunlikdagi davr — o‘zgarishni solishtirish uchun. */
  previousFrom: Date;
  previousTo: Date;
  /** Grafik uchun barcha kunlar (ma’lumot bo‘lmagan kunlar ham). */
  days: string[];
}

/** Oxirgi `days` kun: bugungi kun yarim tunidan `days - 1` kun oldin → hozir. */
export function getStatsRange(days: number, now = new Date(), timeZone = STATS_TIME_ZONE): StatsRange {
  const from = zonedMidnight(new Date(now.getTime() - (days - 1) * DAY_MS), timeZone);
  const span = days * DAY_MS;
  const list: string[] = [];
  for (let t = from.getTime() + 12 * 60 * 60 * 1000; list.length < days; t += DAY_MS) list.push(zonedDay(new Date(t), timeZone));
  return {
    from,
    to: now,
    previousFrom: new Date(from.getTime() - span),
    previousTo: new Date(now.getTime() - span),
    days: list,
  };
}

/* ------------------------------------------------------------------ Bazadan keladigan javob */

export interface StatsDay {
  day: string;
  visitors: number;
  views: number;
  orders: number;
  revenue: number;
}

export interface StatsResult {
  orders: { total: number; done: number; open: number; cancelled: number; revenueDone: number; revenueOpen: number };
  traffic: { visitors: number; views: number; orderClicks: number; searches: number; favorites: number };
  days: StatsDay[];
  topViewed: { productId: string; views: number; viewers: number; orderClicks: number }[];
  topOrdered: { productId: string; productName: string; orders: number; revenue: number }[];
  topSearches: { query: string; people: number; results: number }[];
  missedSearches: { query: string; people: number }[];
}

export const EMPTY_STATS: StatsResult = {
  orders: { total: 0, done: 0, open: 0, cancelled: 0, revenueDone: 0, revenueOpen: 0 },
  traffic: { visitors: 0, views: 0, orderClicks: 0, searches: 0, favorites: 0 },
  days: [],
  topViewed: [],
  topOrdered: [],
  topSearches: [],
  missedSearches: [],
};

/** Ma’lumot bo‘lmagan kunlar 0 bilan to‘ldiriladi — grafikda bo‘shliq qolmaydi. */
export function fillDays(days: string[], rows: StatsDay[]): StatsDay[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return days.map((day) => byDay.get(day) ?? { day, visitors: 0, views: 0, orders: 0, revenue: 0 });
}

/** Oldingi davrga nisbatan o‘zgarish, %. Oldin 0 bo‘lsa — `null` (solishtirib bo‘lmaydi). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Ulush, % (bir xona aniqlikda). */
export function ratePercent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

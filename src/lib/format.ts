import { siteConfig } from "@/config/site";
import type { Money } from "@/types";

/** Raqam ichida qator uzilib qolmasligi uchun bo‘linmas probel. */
const NBSP = " ";

const MONTHS_UZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** `14500000` → `14 500 000 so‘m` */
export function formatPrice(value: Money): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value)}${NBSP}${siteConfig.currencyLabel}`;
}

/** `3` → `-3%` */
export function formatDiscount(percent: number): string {
  return `-${Math.round(percent)}%`;
}

/** `256GB` → `256 GB`, `1TB` → `1 TB`, boshqa qiymatlar o‘zgarishsiz. */
export function formatStorage(value: string): string {
  return value.replace(/^(\d+)\s*(GB|TB)$/i, (_, amount: string, unit: string) => {
    return `${amount} ${unit.toUpperCase()}`;
  });
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}

/** `2026-09-21T…` → `21 sentabr 2026` */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getUTCDate()} ${MONTHS_UZ[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Oddiy o‘zbekcha ko‘plik: `1 ta`, `12 ta`. */
export function formatCount(value: number, unit = "ta"): string {
  return `${formatNumber(value)} ${unit}`;
}

/**
 * Sayt nomi va umumiy sozlamalar — bitta joyda.
 * Keyin admin panel/DB (Store jadvali) shu qiymatlarni almashtiradi.
 */
export const siteConfig = {
  name: "Zamon Store",
  /** Logotipdagi yozuv. */
  wordmark: "ZAMON",
  tagline: "Telefon, noutbuk va aksessuarlar — Toshkentda",
  description:
    "Zamon Store — original telefonlar, noutbuklar va aksessuarlar. Narxlar so‘mda, kafolat bilan, Telegram orqali oson buyurtma.",
  locale: "uz-UZ",
  language: "uz",
  currency: "UZS",
  currencyLabel: "so‘m",
  /** Katalogda bir sahifadagi mahsulotlar soni (mobil 2, tablet 3, desktop 4 ustunga qulay). */
  pageSize: 12,
} as const;

export type SiteConfig = typeof siteConfig;

/** Namunaviy mahsulotlarni o‘chirish tasdig‘i (brauzer ham, server ham ishlatadi). */
export const DEMO_CONFIRM_WORD = "O‘CHIRISH";

/** Tasdiq so‘zi: katta-kichik harf va apostrof turi (' ‘ ʻ ’ `) farq qilmaydi. */
export function isDemoConfirmed(value: string): boolean {
  return value.trim().toUpperCase().replace(/['’ʻ`]/g, "‘") === DEMO_CONFIRM_WORD;
}

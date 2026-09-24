/**
 * Qidiruv sinonimlari. Har bir guruhdagi so‘zlar bir-biriga teng hisoblanadi.
 *
 * Faqat lotin, kichik harf, `normalize` dan o‘tgan ko‘rinishda yoziladi.
 * Ruscha (kirill) so‘rovlar `normalize` ichida lotinga o‘giriladi
 * (masalan «чехол» → «chehol», «зарядка» → «zaryadka»), shuning uchun
 * bu yerda ularning lotin ko‘rinishi berilgan.
 */
export const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["zaryadchik", "zaryadka", "zaryadki", "zaryadnik", "zaryad", "adapter", "charger", "blok pitaniya"],
  ["chexol", "chehol", "chehli", "case", "qopqoq", "bamper"],
  ["quloqchin", "naushnik", "naushniki", "quloqlik", "headphones", "earbuds"],
  ["airpods", "airpod", "aerpods"],
  ["type c", "typec", "type-c", "usb c", "usb-c", "tayp si"],
  ["noutbuk", "noutbook", "notebook", "laptop", "noutbuklar", "laptoplar"],
  ["telefon", "smartfon", "smartphone", "phone", "telefonlar"],
  ["redmi", "xiaomi", "readmi", "syaomi", "redmi note"],
  ["samsung", "samsng", "samsunk", "galaxy"],
  ["iphone", "aifon", "ayfon", "ajfon"],
  ["powerbank", "power bank", "pauerbank", "poverbank"],
  ["kabel", "kabelj", "cable", "provod", "shnur"],
  ["himoya oynasi", "oyna", "steklo", "glass", "himoya"],
  ["smart watch", "smartwatch", "soat", "chasy", "watch"],
  ["stend", "podstavka", "holder", "derzhatel", "ushlagich"],
  ["macbook", "makbuk"],
  ["quvvat", "moshnost", "watt", "vatt"],
];

/** Foydalanuvchi tez-tez yozadigan (statik) mashhur qidiruvlar. */
export const POPULAR_SEARCHES: readonly string[] = [
  "iPhone 15",
  "Samsung S24",
  "AirPods",
  "Type-C kabel",
  "Redmi Note 13",
  "Zaryadchik",
  "MacBook",
  "Chexol",
];

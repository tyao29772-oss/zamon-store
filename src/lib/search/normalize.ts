/**
 * Qidiruv matnini yagona ko‘rinishga keltiradi.
 *
 * - kichik harf, diakritiklar olib tashlanadi;
 * - `o'`, `o‘`, `oʻ`, `o’` — barchasi bir xil (apostrof olib tashlanadi);
 * - kirill → lotin (ruscha va o‘zbek kirilli so‘rovlar uchun);
 * - `x` → `h` (chexol / chehol, xiaomi / hiaomi bir xil tokenga tushadi;
 *   indeks ham xuddi shu funksiyadan o‘tadi, shuning uchun mos keladi);
 * - defis, slesh va boshqa belgilar bo‘shliqqa aylanadi;
 * - harf va raqam chegarasi ajratiladi: `iphone15` → `iphone 15`, `256GB` → `256 gb`.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ў: "o",
  қ: "q",
  ғ: "g",
  ҳ: "h",
};

const APOSTROPHES = /['`´ʻʼ‘’′ʹ]/g;

export function transliterate(text: string): string {
  let result = "";
  for (const char of text) {
    result += CYRILLIC_TO_LATIN[char] ?? char;
  }
  return result;
}

export function normalizeText(input: string): string {
  // Tartib muhim: kirillni NFKD dan oldin o‘girish kerak, aks holda «й» → «и», «ў» → «у» bo‘lib qoladi.
  const latin = transliterate(input.toLowerCase().replace(APOSTROPHES, ""));

  return latin
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/x/g, "h")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  return normalized ? normalized.split(" ") : [];
}

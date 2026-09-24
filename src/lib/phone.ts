/**
 * O‘zbekiston telefon raqamini `+998XXXXXXXXX` ko‘rinishiga keltiradi.
 * Qabul qilinadi: `90 123 45 67`, `+998 90 123-45-67`, `998901234567`, `901234567`.
 * Yaroqsiz bo‘lsa `null`.
 */
export function normalizeUzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national: string;

  if (digits.length === 9) {
    national = digits;
  } else if (digits.length === 12 && digits.startsWith("998")) {
    national = digits.slice(3);
  } else {
    return null;
  }

  if (national.startsWith("0")) return null;
  return `+998${national}`;
}

/** `+998901234567` → `+998 90 123 45 67` */
export function formatUzPhone(normalized: string): string {
  const match = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(normalized);
  if (!match) return normalized;
  return `+998 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}

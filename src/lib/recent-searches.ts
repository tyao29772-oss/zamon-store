/**
 * Oxirgi qidiruvlar (localStorage). Favorites'dan farqli — bu yerda reaktiv obuna shart emas,
 * shuning uchun oddiy o‘qish/yozish funksiyalari, overlay ochilganda o‘qiladi.
 */

const STORAGE_KEY = "zamon:recent-searches:v1";
const MAX_ITEMS = 6;

export function getRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string").slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const current = getRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...current].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage yo‘q/yopiq bo‘lsa — jimgina o‘tkazib yuboriladi.
  }
}

export function removeRecentSearch(query: string): string[] {
  const next = getRecentSearches().filter((q) => q !== query);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // e'tiborsiz qoldiriladi
  }
  return next;
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // e'tiborsiz qoldiriladi
  }
}

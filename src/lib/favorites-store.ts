/**
 * Sevimlilar do‘koni (localStorage). React'dan mustaqil: `useSyncExternalStore` orqali ulanadi.
 * Keyin login qilgan foydalanuvchi uchun DB bilan sinxronlash — shu interfeys ortida amalga oshiriladi.
 */

const STORAGE_KEY = "zamon:favorites:v1";
const EMPTY: readonly string[] = Object.freeze([]);

export interface FavoritesStore {
  getSnapshot: () => readonly string[];
  getServerSnapshot: () => readonly string[];
  subscribe: (listener: () => void) => () => void;
  /** Qo‘shilgan bo‘lsa `true`, o‘chirilgan bo‘lsa `false` qaytaradi. */
  toggle: (productId: string) => boolean;
  remove: (productId: string) => void;
}

let current: readonly string[] | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item): item is string => typeof item === "string"))];
  } catch {
    return [];
  }
}

function readStorage(): string[] {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Brauzer localStorage'ni bermasa (masalan, maxfiy rejim) — shu sessiya xotirasi ishlatiladi.
    return current ? [...current] : [];
  }
}

function writeStorage(ids: readonly string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Yozib bo‘lmasa, holat faqat xotirada qoladi.
  }
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  current = readStorage();
  emit();
}

function getSnapshot(): readonly string[] {
  current ??= readStorage();
  return current;
}

function setIds(next: readonly string[]): void {
  current = next;
  writeStorage(next);
  emit();
}

export const favoritesStore: FavoritesStore = {
  getSnapshot,
  getServerSnapshot: () => EMPTY,

  subscribe(listener) {
    listeners.add(listener);
    if (!storageBound) {
      window.addEventListener("storage", onStorage);
      storageBound = true;
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && storageBound) {
        window.removeEventListener("storage", onStorage);
        storageBound = false;
      }
    };
  },

  toggle(productId) {
    const ids = getSnapshot();
    const isFavorite = ids.includes(productId);
    setIds(isFavorite ? ids.filter((id) => id !== productId) : [...ids, productId]);
    return !isFavorite;
  },

  remove(productId) {
    const ids = getSnapshot();
    if (ids.includes(productId)) setIds(ids.filter((id) => id !== productId));
  },
};

import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { store as defaultStore } from "@/data/store";
import { dbSelectAll, dbUpsert, isDbConfigured } from "@/lib/db/supabase";
import { mergeStoreSettings, type StoreSettings } from "@/lib/settings/store-settings";
import type { Store } from "@/types";

/**
 * Do‘kon ma’lumotlari: `src/data/store.ts` dagi standartlar + admin paneldagi «Sozlamalar»
 * (Supabase `settings` jadvali). Keshlanadi; admin saqlaganda `SETTINGS_TAG` bilan yangilanadi.
 */

export const SETTINGS_TAG = "settings";
const SETTINGS_ID = "store";

interface SettingsRow {
  id: string;
  data: Partial<StoreSettings>;
  updated_at: string;
}

const loadSavedSettings = unstable_cache(
  async (): Promise<{ data: Partial<StoreSettings>; updatedAt: string } | null> => {
    const rows = await dbSelectAll<SettingsRow>("settings", `select=*&id=eq.${SETTINGS_ID}`);
    return rows[0] ? { data: rows[0].data, updatedAt: rows[0].updated_at } : null;
  },
  ["settings:store:v1"],
  { tags: [SETTINGS_TAG], revalidate: 3600 },
);

/** Bitta so‘rov ichida bir marta. Baza ishlamasa — standart qiymatlar (sayt buzilmaydi). */
export const getStore = cache(async (): Promise<Store> => {
  if (!isDbConfigured()) return defaultStore;
  try {
    const saved = await loadSavedSettings();
    return saved ? { ...mergeStoreSettings(defaultStore, saved.data), updatedAt: saved.updatedAt } : defaultStore;
  } catch (error) {
    console.error("[repo/store] sozlamalarni o‘qib bo‘lmadi, standartlar ishlatiladi:", error);
    return defaultStore;
  }
});

/** Admin uchun keshsiz: forma har doim bazadagi eng so‘nggi holatni ko‘rsin. */
export async function getStoreForAdmin(): Promise<{ store: Store; customized: boolean }> {
  if (!isDbConfigured()) return { store: defaultStore, customized: false };
  const rows = await dbSelectAll<SettingsRow>("settings", `select=*&id=eq.${SETTINGS_ID}`);
  return rows[0]
    ? { store: mergeStoreSettings(defaultStore, rows[0].data), customized: true }
    : { store: defaultStore, customized: false };
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  await dbUpsert("settings", [{ id: SETTINGS_ID, data: settings }], "merge");
}

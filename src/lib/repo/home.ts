import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { DbError, dbSelectAll, dbUpsert, isDbConfigured } from "@/lib/db/supabase";
import { DEFAULT_HOME, mergeHomeSettings, type HomeSettings } from "@/lib/settings/home-settings";

/**
 * Bosh sahifa sozlamalari: `settings` jadvalidagi `home` qatori + standartlar.
 * Keshlanadi; admin saqlaganda `HOME_TAG` bilan yangilanadi.
 */

export const HOME_TAG = "home";
const HOME_ID = "home";

interface HomeRow {
  id: string;
  data: unknown;
}

async function readSaved(): Promise<unknown | null> {
  const rows = await dbSelectAll<HomeRow>("settings", `select=id,data&id=eq.${HOME_ID}`);
  return rows[0] ? rows[0].data : null;
}

const loadSaved = unstable_cache(
  async (): Promise<unknown | null> => {
    try {
      return await readSaved();
    } catch (error) {
      // Jadval hali yo‘q (0005 ishga tushirilmagan) — standartlar; bu holat ham keshlanadi.
      if (error instanceof DbError && error.status === 404) return null;
      throw error;
    }
  },
  ["settings:home:v1"],
  { tags: [HOME_TAG], revalidate: 3600 },
);

/** Bitta so‘rov ichida bir marta. Baza ishlamasa — standartlar (sayt buzilmaydi). */
export const getHomeSettings = cache(async (): Promise<HomeSettings> => {
  if (!isDbConfigured()) return DEFAULT_HOME;
  try {
    const saved = await loadSaved();
    return saved ? mergeHomeSettings(saved) : DEFAULT_HOME;
  } catch (error) {
    console.error("[repo/home] bosh sahifa sozlamalarini o‘qib bo‘lmadi, standartlar ishlatiladi:", error);
    return DEFAULT_HOME;
  }
});

/** Admin uchun keshsiz. */
export async function getHomeSettingsForAdmin(): Promise<{ home: HomeSettings; customized: boolean }> {
  if (!isDbConfigured()) return { home: DEFAULT_HOME, customized: false };
  const saved = await readSaved();
  return saved ? { home: mergeHomeSettings(saved), customized: true } : { home: DEFAULT_HOME, customized: false };
}

export async function saveHomeSettings(home: HomeSettings): Promise<void> {
  await dbUpsert("settings", [{ id: HOME_ID, data: home }], "merge");
}

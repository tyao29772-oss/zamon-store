"use server";

import { updateTag } from "next/cache";
import { flattenIssues } from "@/lib/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { DbError, isDbConfigured } from "@/lib/db/supabase";
import { saveStoreSettings, SETTINGS_TAG } from "@/lib/repo/store";
import { storeSettingsSchema } from "@/lib/settings/store-settings";

export type SaveSettingsResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function saveSettingsAction(values: unknown): Promise<SaveSettingsResult> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Baza (Supabase) ulanmagan — sozlamalarni saqlab bo‘lmaydi." };

  const parsed = storeSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Ba’zi maydonlar noto‘g‘ri. Qizil bilan belgilangan joylarni tekshiring.",
      fieldErrors: flattenIssues(parsed.error.issues),
    };
  }

  try {
    await saveStoreSettings(parsed.data);
  } catch (error) {
    console.error("[admin/settings] saqlashda xato:", error);
    if (error instanceof DbError && error.status === 404) {
      return { ok: false, error: "Sozlamalar jadvali yo‘q — Supabase SQL Editor’da 0005_settings.sql ni ishga tushiring." };
    }
    return { ok: false, error: "Saqlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring." };
  }
  // Footer, Aloqa, Kafolat, Yetkazib berish sahifalari va buyurtma tugmalari darhol yangilanadi.
  updateTag(SETTINGS_TAG);
  return { ok: true };
}

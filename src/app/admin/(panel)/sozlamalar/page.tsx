import type { Metadata } from "next";
import { connection } from "next/server";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { isDbConfigured } from "@/lib/db/supabase";
import { getStoreForAdmin } from "@/lib/repo/store";
import { pickStoreSettings } from "@/lib/settings/store-settings";

export const metadata: Metadata = { title: "Sozlamalar" };

export default async function AdminSettingsPage() {
  await connection();
  const { store, customized } = await getStoreForAdmin();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-ink">Sozlamalar</h1>
      <p className="mt-1 mb-4 text-sm text-ink-muted">
        Do‘kon ma’lumotlari — saqlagan zahoti saytda yangilanadi.
        {!customized && " Hozir namunaviy qiymatlar ko‘rsatilmoqda: o‘zingiznikiga almashtirib, saqlang."}
      </p>
      <SettingsForm initial={pickStoreSettings(store)} canSave={isDbConfigured()} />
    </div>
  );
}

import type { Metadata } from "next";
import { connection } from "next/server";
import { HomeSettingsForm } from "@/components/admin/HomeSettingsForm";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/supabase";
import { getHomeSettingsForAdmin } from "@/lib/repo/home";
import { getAllProductsForAdmin } from "@/lib/repo/products";

export const metadata: Metadata = { title: "Bosh sahifa" };

export default async function AdminHomePage() {
  await connection();
  await requireAdmin();
  const [{ home, customized }, products] = await Promise.all([getHomeSettingsForAdmin(), getAllProductsForAdmin()]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-ink">Bosh sahifa</h1>
      <p className="mb-4 mt-1 text-sm text-ink-muted">
        Saytga kirgan odam birinchi ko‘radigan joy: katta blok, reklama bannerlari va tavsiya kartalari. Saqlagan zahoti saytda yangilanadi.
        {!customized && " Hozir namunaviy qiymatlar ko‘rsatilmoqda."}
      </p>
      <HomeSettingsForm
        initial={home}
        canSave={isDbConfigured()}
        products={products
          .map((p) => ({ slug: p.slug, name: p.name, shortDescription: p.shortDescription, published: p.isPublished }))
          .sort((a, b) => a.name.localeCompare(b.name))}
      />
    </div>
  );
}

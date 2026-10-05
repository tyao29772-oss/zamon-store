import type { Metadata } from "next";
import { connection } from "next/server";
import { BrandsManager } from "@/components/admin/BrandsManager";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/supabase";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import { loadTaxonomy } from "@/lib/repo/taxonomy";

export const metadata: Metadata = { title: "Brendlar" };

export default async function AdminBrandsPage() {
  await connection();
  await requireAdmin();
  const [{ brands }, products] = await Promise.all([loadTaxonomy(), getAllProductsForAdmin()]);
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.brandId, (counts.get(p.brandId) ?? 0) + 1);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-ink">Brendlar</h1>
      <p className="mb-5 mt-1 text-sm text-ink-muted">
        {brands.length} ta brend. Tartib — saytdagi brendlar qatori va filtrlardagi tartib. Mahsulotlari bor brendni o‘chirib bo‘lmaydi.
      </p>
      <BrandsManager
        canEdit={isDbConfigured()}
        brands={brands.map((b) => ({ id: b.id, name: b.name, description: b.description, productCount: counts.get(b.id) ?? 0 }))}
      />
    </div>
  );
}

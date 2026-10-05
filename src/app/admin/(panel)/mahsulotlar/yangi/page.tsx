import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form/ProductForm";
import { duplicateFormValues, emptyFormValues, getCategoryOptions } from "@/lib/admin/product-form";
import { isDbConfigured } from "@/lib/db/supabase";
import { getBrands } from "@/lib/repo/brands";
import { getCategories } from "@/lib/repo/categories";
import { getProductForAdmin } from "@/lib/repo/products-admin";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Yangi mahsulot" };

export default async function NewProductPage({ searchParams }: PageProps<"/admin/mahsulotlar/yangi">) {
  await connection();
  // Layout ham tekshiradi, lekin sahifalar orasida yurganda layout qayta ishlamasligi mumkin — har sahifa o‘zi ham tekshiradi.
  await requireAdmin();
  const { nusxa } = await searchParams;
  const [brands, categories, source] = await Promise.all([
    getBrands(),
    getCategories(),
    typeof nusxa === "string" ? getProductForAdmin(nusxa) : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-6xl">
      <Link href="/admin/mahsulotlar" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden="true" /> Mahsulotlar
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Yangi mahsulot</h1>
      {source ? (
        <p className="mb-5 mt-1 text-sm text-ink-muted">
          «{source.name}» nusxasi. Nomini, narxlarini va kerakli joylarini o‘zgartiring — saqlaguningizcha hech narsa yaratilmaydi.
          Nusxa avval saytda yashirin turadi.
        </p>
      ) : (
        <div className="mb-5" />
      )}
      <ProductForm
        mode="create"
        initialValues={source ? duplicateFormValues(source) : emptyFormValues()}
        brands={brands}
        categories={getCategoryOptions(categories)}
        canSave={isDbConfigured()}
      />
    </div>
  );
}

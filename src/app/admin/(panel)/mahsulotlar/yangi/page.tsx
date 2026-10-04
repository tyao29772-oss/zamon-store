import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form/ProductForm";
import { emptyFormValues, getCategoryOptions } from "@/lib/admin/product-form";
import { isDbConfigured } from "@/lib/db/supabase";
import { getBrands } from "@/lib/repo/brands";

export const metadata: Metadata = { title: "Yangi mahsulot" };

export default async function NewProductPage() {
  await connection();
  const brands = await getBrands();

  return (
    <div className="max-w-6xl">
      <Link href="/admin/mahsulotlar" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden="true" /> Mahsulotlar
      </Link>
      <h1 className="mb-5 mt-2 text-2xl font-semibold text-ink">Yangi mahsulot</h1>
      <ProductForm
        mode="create"
        initialValues={emptyFormValues()}
        brands={brands}
        categories={getCategoryOptions()}
        canSave={isDbConfigured()}
      />
    </div>
  );
}

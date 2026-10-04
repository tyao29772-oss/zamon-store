import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft, EyeOff } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form/ProductForm";
import { getCategoryOptions, productToFormValues } from "@/lib/admin/product-form";
import { isDbConfigured } from "@/lib/db/supabase";
import { formatDate } from "@/lib/format";
import { getBrands } from "@/lib/repo/brands";
import { getProductForAdmin } from "@/lib/repo/products-admin";

export async function generateMetadata({ params }: PageProps<"/admin/mahsulotlar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  return { title: product ? `${product.name} — tahrirlash` : "Mahsulot topilmadi" };
}

export default async function EditProductPage({ params }: PageProps<"/admin/mahsulotlar/[id]">) {
  await connection();
  const { id } = await params;
  const [product, brands] = await Promise.all([getProductForAdmin(id), getBrands()]);
  if (!product) notFound();

  return (
    <div className="max-w-6xl">
      <Link href="/admin/mahsulotlar" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden="true" /> Mahsulotlar
      </Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold text-ink">{product.name}</h1>
        {!product.isPublished && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">
            <EyeOff className="size-3" aria-hidden="true" /> Yashirin
          </span>
        )}
        <span className="w-full text-xs text-ink-muted">Oxirgi o‘zgarish: {formatDate(product.updatedAt)}</span>
      </div>
      {/* key: saqlangandan keyin server yangi versiyani bersa, forma toza holatdan boshlanadi */}
      <ProductForm
        key={product.updatedAt}
        mode="edit"
        initialValues={productToFormValues(product)}
        brands={brands}
        categories={getCategoryOptions()}
        canSave={isDbConfigured()}
      />
    </div>
  );
}

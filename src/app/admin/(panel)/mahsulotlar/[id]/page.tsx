import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft, CircleCheck, Copy, ExternalLink, EyeOff } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ProductForm } from "@/components/admin/product-form/ProductForm";
import { getCategoryOptions, productToFormValues } from "@/lib/admin/product-form";
import { isDbConfigured } from "@/lib/db/supabase";
import { formatDate } from "@/lib/format";
import { getBrands } from "@/lib/repo/brands";
import { getProductForAdmin } from "@/lib/repo/products-admin";
import { requireAdmin } from "@/lib/admin/auth";

export async function generateMetadata({ params }: PageProps<"/admin/mahsulotlar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  return { title: product ? `${product.name} — tahrirlash` : "Mahsulot topilmadi" };
}

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/mahsulotlar/[id]">) {
  await connection();
  // Layout ham tekshiradi, lekin sahifalar orasida yurganda layout qayta ishlamasligi mumkin — har sahifa o‘zi ham tekshiradi.
  await requireAdmin();
  const { id } = await params;
  const { saqlandi } = await searchParams;
  const justSaved = saqlandi === "yangi" ? "created" : saqlandi === "1" ? "updated" : null;
  const [product, brands] = await Promise.all([getProductForAdmin(id), getBrands()]);
  if (!product) notFound();

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/mahsulotlar" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="size-4" aria-hidden="true" /> Mahsulotlar
        </Link>
        <Link
          href={`/admin/mahsulotlar/yangi?nusxa=${product.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/40"
          title="Shu mahsulot asosida yangisini yaratish (masalan, Plus yoki Pro modeli)"
        >
          <Copy className="size-4" aria-hidden="true" /> Nusxa olish
        </Link>
      </div>
      <div className="mb-5 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold text-ink">{product.name}</h1>
        {!product.isPublished && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">
            <EyeOff className="size-3" aria-hidden="true" /> Yashirin
          </span>
        )}
        <span className="w-full text-xs text-ink-muted">Oxirgi o‘zgarish: {formatDate(product.updatedAt)}</span>
      </div>
      {justSaved && (
        <div role="status" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-ok/30 bg-ok-soft p-4 text-sm text-ok">
          <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1 font-medium">
            {product.isPublished
              ? justSaved === "created"
                ? "Mahsulot saqlandi va saytga joylandi."
                : "O‘zgarishlar saqlandi — saytda ham yangilandi."
              : "Saqlandi. Mahsulot hozircha saytda ko‘rinmaydi — ko‘rinishi uchun «Saytda ko‘rsatish»ni yoqib, qayta saqlang."}
          </p>
          {product.isPublished && (
            <a
              href={`/mahsulot/${product.slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-full bg-ok px-4 py-2 font-semibold text-white hover:opacity-90"
            >
              Saytda ko‘rish <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
      {/* key: saqlangandan keyin server yangi versiyani bersa, forma toza holatdan boshlanadi */}
      <ProductForm
        key={product.updatedAt}
        mode="edit"
        initialValues={productToFormValues(product)}
        brands={brands}
        categories={getCategoryOptions()}
        canSave={isDbConfigured()}
      />
      <DeleteProductButton productId={product.id} productName={product.name} canDelete={isDbConfigured()} />
    </div>
  );
}

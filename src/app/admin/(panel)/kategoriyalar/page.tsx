import type { Metadata } from "next";
import { connection } from "next/server";
import { CategoriesManager, type CategoryNodeView } from "@/components/admin/CategoriesManager";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/supabase";
import { getCategoryTree } from "@/lib/repo/categories";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import type { CategoryNode } from "@/types";

export const metadata: Metadata = { title: "Kategoriyalar" };

export default async function AdminCategoriesPage() {
  await connection();
  await requireAdmin();
  const [tree, products] = await Promise.all([getCategoryTree(), getAllProductsForAdmin()]);
  const direct = new Map<string, number>();
  for (const p of products) direct.set(p.categoryId, (direct.get(p.categoryId) ?? 0) + 1);

  const toView = (node: CategoryNode): CategoryNodeView => {
    const children = node.children.map(toView);
    const directCount = direct.get(node.id) ?? 0;
    return {
      id: node.id,
      name: node.name,
      description: node.description,
      path: node.path,
      depth: node.depth,
      directCount,
      totalCount: directCount + children.reduce((sum, c) => sum + c.totalCount, 0),
      children,
    };
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-ink">Kategoriyalar</h1>
      <p className="mb-5 mt-1 text-sm text-ink-muted">
        Saytdagi «Katalog» menyusi va bo‘limlar. Mahsulot eng ichki bo‘limga biriktiriladi. Ichida mahsulot yoki bo‘lim bor bo‘limni o‘chirib bo‘lmaydi.
      </p>
      <CategoriesManager tree={tree.map(toView)} canEdit={isDbConfigured()} />
    </div>
  );
}

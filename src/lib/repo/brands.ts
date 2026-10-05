import { loadTaxonomy } from "@/lib/repo/taxonomy";
import type { Brand } from "@/types";

/** Brendlar — bazadan (admin «Brendlar»), bo‘lmasa standart ro‘yxat. Tartib: admin bergan tartib. */
export async function getBrands(): Promise<Brand[]> {
  return (await loadTaxonomy()).brands;
}

export async function getBrandById(id: string): Promise<Brand | null> {
  return (await getBrands()).find((b) => b.id === id) ?? null;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return (await getBrands()).find((b) => b.slug === slug) ?? null;
}

export async function getBrandsByIds(ids: string[]): Promise<Brand[]> {
  const wanted = new Set(ids);
  return (await getBrands()).filter((b) => wanted.has(b.id));
}

import { brands } from "@/data/brands";
import type { Brand } from "@/types";

export async function getBrands(): Promise<Brand[]> {
  return brands;
}

export async function getBrandById(id: string): Promise<Brand | null> {
  return brands.find((b) => b.id === id) ?? null;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function getBrandsByIds(ids: string[]): Promise<Brand[]> {
  const wanted = new Set(ids);
  return brands.filter((b) => wanted.has(b.id));
}

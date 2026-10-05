import { loadTaxonomy } from "@/lib/repo/taxonomy";
import type { Category, CategoryNode, ResolvedCategory } from "@/types";

/**
 * Kategoriya repository'si: bazadan (admin «Kategoriyalar»), bo‘lmasa standart ro‘yxat.
 * Daraxt indeksi ro‘yxat o‘zgargandagina qayta quriladi.
 */

export interface CategoryIndex {
  list: ResolvedCategory[];
  byId: Map<string, ResolvedCategory>;
}

/** Bir xil ro‘yxat uchun indeks qayta qurilmaydi (ro‘yxat obyekti bo‘yicha). */
const indexCache = new WeakMap<Category[], CategoryIndex>();

/** Sof funksiya: ro‘yxatdan yo‘llar (`telefonlar/iphone`), chuqurlik va bolalar bilan indeks. */
export function buildCategoryIndex(categories: Category[]): CategoryIndex {
  const rawById = new Map(categories.map((c) => [c.id, c]));
  if (rawById.size !== categories.length) {
    throw new Error("Kategoriya id'lari takrorlangan");
  }

  const children = new Map<string, string[]>();
  for (const c of categories) {
    if (c.parentId === null) continue;
    if (!rawById.has(c.parentId)) {
      throw new Error(`Kategoriya «${c.id}» mavjud bo‘lmagan ota kategoriyaga ishora qiladi: ${c.parentId}`);
    }
    children.set(c.parentId, [...(children.get(c.parentId) ?? []), c.id]);
  }

  const resolved = new Map<string, ResolvedCategory>();

  const resolve = (id: string, trail: string[]): ResolvedCategory => {
    const existing = resolved.get(id);
    if (existing) return existing;
    if (trail.includes(id)) {
      throw new Error(`Kategoriya daraxtida sikl bor: ${[...trail, id].join(" → ")}`);
    }

    const raw = rawById.get(id);
    if (!raw) throw new Error(`Kategoriya topilmadi: ${id}`);

    const parent = raw.parentId ? resolve(raw.parentId, [...trail, id]) : null;
    const path = parent ? `${parent.path}/${raw.slug}` : raw.slug;
    const sortedChildIds = (children.get(id) ?? [])
      .map((childId) => rawById.get(childId)!)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.id);

    const node: ResolvedCategory = {
      ...raw,
      path,
      href: `/katalog/${path}`,
      depth: parent ? parent.depth + 1 : 0,
      childIds: sortedChildIds,
    };
    resolved.set(id, node);
    return node;
  };

  const list = categories
    .map((c) => resolve(c.id, []))
    .sort((a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder);

  return { list, byId: resolved };
}

async function getIndex(): Promise<CategoryIndex> {
  const { categories } = await loadTaxonomy();
  let index = indexCache.get(categories);
  if (!index) {
    index = buildCategoryIndex(categories);
    indexCache.set(categories, index);
  }
  return index;
}

export async function getCategories(): Promise<ResolvedCategory[]> {
  return (await getIndex()).list;
}

export async function getRootCategories(): Promise<ResolvedCategory[]> {
  return (await getIndex()).list.filter((c) => c.parentId === null);
}

export async function getCategoryById(id: string): Promise<ResolvedCategory | null> {
  return (await getIndex()).byId.get(id) ?? null;
}

/** `["telefonlar", "iphone"]` → iPhone kategoriyasi. Topilmasa `null`. */
export async function getCategoryByPath(segments: string[]): Promise<ResolvedCategory | null> {
  if (segments.length === 0) return null;
  const path = segments.join("/");
  return (await getIndex()).list.find((c) => c.path === path) ?? null;
}

export async function getChildCategories(id: string): Promise<ResolvedCategory[]> {
  const { byId } = await getIndex();
  const node = byId.get(id);
  if (!node) return [];
  return node.childIds.map((childId) => byId.get(childId)!);
}

/** Ildizdan berilgan kategoriyagacha zanjir (breadcrumb uchun). */
export async function getCategoryChain(id: string): Promise<ResolvedCategory[]> {
  const { byId } = await getIndex();
  const chain: ResolvedCategory[] = [];
  let current = byId.get(id) ?? null;
  while (current) {
    chain.unshift(current);
    current = current.parentId ? (byId.get(current.parentId) ?? null) : null;
  }
  return chain;
}

/** Kategoriyaning o‘zi va barcha avlodlari id'lari. */
export async function getDescendantIds(id: string): Promise<string[]> {
  const { byId } = await getIndex();
  const result: string[] = [];
  const stack = [id];
  while (stack.length > 0) {
    const currentId = stack.pop()!;
    const node = byId.get(currentId);
    if (!node) continue;
    result.push(currentId);
    stack.push(...node.childIds);
  }
  return result;
}

export async function getRootCategoryId(id: string): Promise<string | null> {
  const chain = await getCategoryChain(id);
  return chain[0]?.id ?? null;
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const { byId, list } = await getIndex();
  const toNode = (category: ResolvedCategory): CategoryNode => ({
    ...category,
    children: category.childIds.map((childId) => toNode(byId.get(childId)!)),
  });
  return list.filter((c) => c.parentId === null).map(toNode);
}

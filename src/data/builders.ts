import type {
  Condition,
  Money,
  Product,
  ProductAttributeValue,
  ProductVariant,
  SpecGroup,
} from "@/types";

/** Mock data uchun yordamchilar. Faqat data qatlamida ishlatiladi. */

export const UPDATED_AT = "2026-09-20T09:00:00.000Z";

export interface Color {
  name: string;
  hex: string;
}

export interface VariantOption {
  storage?: string;
  ram?: string;
  size?: string;
  price: Money;
  oldPrice?: Money;
}

export interface VariantMatrix {
  /** Mahsulot slug'i — variant id shundan tuziladi. */
  slug: string;
  /** SKU boshi, masalan `IP15PM`. */
  sku: string;
  colors?: Color[];
  options: VariantOption[];
  condition?: Condition;
  simType?: string;
  warrantyMonths: number;
  /** Bitta son yoki variantlar tartibida takrorlanadigan ro‘yxat. */
  stock: number | number[];
  preorder?: boolean;
  note?: string;
}

function slugPart(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function skuPart(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, "").slice(0, 3))
    .join("")
    .toUpperCase();
}

const CONDITION_SUFFIX: Record<Condition, string> = {
  new: "new",
  "open-box": "openbox",
  used: "used",
};

const CONDITION_SKU: Record<Condition, string> = {
  new: "",
  "open-box": "-OB",
  used: "-U",
};

/** Ranglar × opsiyalar matritsasidan variantlar hosil qiladi. */
export function variantMatrix(matrix: VariantMatrix): ProductVariant[] {
  const condition = matrix.condition ?? "new";
  const colors = matrix.colors?.length ? matrix.colors : [undefined];
  const variants: ProductVariant[] = [];

  matrix.options.forEach((option) => {
    colors.forEach((color) => {
      const index = variants.length;
      const stock = Array.isArray(matrix.stock)
        ? (matrix.stock[index % matrix.stock.length] ?? 0)
        : matrix.stock;

      const idParts = [
        matrix.slug,
        option.storage,
        option.ram ? `${option.ram}-ram` : undefined,
        option.size,
        color?.name,
        CONDITION_SUFFIX[condition],
      ]
        .filter((part): part is string => Boolean(part))
        .map(slugPart);

      const skuParts = [
        matrix.sku,
        option.ram,
        option.storage ?? option.size,
        color ? skuPart(color.name) : undefined,
      ]
        .filter((part): part is string => Boolean(part))
        .map((part) => part.replace(/\s+/g, "").toUpperCase());

      variants.push({
        id: idParts.join("-"),
        sku: skuParts.join("-") + CONDITION_SKU[condition],
        color: color?.name,
        colorHex: color?.hex,
        storage: option.storage,
        ram: option.ram,
        size: option.size,
        condition,
        simType: matrix.simType,
        price: option.price,
        oldPrice: option.oldPrice,
        stock,
        preorder: matrix.preorder,
        warrantyMonths: matrix.warrantyMonths,
        note: matrix.note,
      });
    });
  });

  return variants;
}

export function group(title: string, items: [label: string, value: string][]): SpecGroup {
  return { title, items: items.map(([label, value]) => ({ label, value })) };
}

export interface ProductSeed {
  slug: string;
  name: string;
  brandId: string;
  categoryId: string;
  model?: string;
  shortDescription: string;
  description: string;
  variants: ProductVariant[];
  specs: SpecGroup[];
  attributes?: Record<string, ProductAttributeValue>;
  keywords?: string[];
  featured?: boolean;
  popularity: number;
  /** `[reyting, sharhlar soni]` */
  rating: [number, number];
  createdAt: string;
  relatedIds?: string[];
  bundleIds?: string[];
  images?: string[];
  seo?: Product["seo"];
}

export function defineProduct(seed: ProductSeed): Product {
  return {
    id: seed.slug,
    slug: seed.slug,
    name: seed.name,
    brandId: seed.brandId,
    categoryId: seed.categoryId,
    model: seed.model,
    shortDescription: seed.shortDescription,
    description: seed.description,
    images: seed.images ?? [],
    variants: seed.variants,
    specs: seed.specs,
    attributes: seed.attributes ?? {},
    keywords: seed.keywords ?? [],
    featured: seed.featured ?? false,
    popularity: seed.popularity,
    ratingAvg: seed.rating[0],
    ratingCount: seed.rating[1],
    relatedIds: seed.relatedIds,
    bundleIds: seed.bundleIds,
    isPublished: true,
    createdAt: seed.createdAt,
    updatedAt: UPDATED_AT,
    seo: seed.seo,
  };
}

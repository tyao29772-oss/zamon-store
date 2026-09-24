import { formatStorage } from "@/lib/format";
import type {
  Condition,
  PriceInfo,
  Product,
  ProductAttributeValue,
  ProductVariant,
  StockStatus,
} from "@/types";

export const NOT_SELECTED = "tanlanmagan";
export const LOW_STOCK_THRESHOLD = 3;

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "Yangi",
  used: "Ishlatilgan",
  "open-box": "Open-box",
};

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "Mavjud",
  low: "Kam qoldi",
  preorder: "Oldindan buyurtma",
  out_of_stock: "Tugagan",
};

const CONDITION_RANK: Record<Condition, number> = {
  new: 0,
  "open-box": 1,
  used: 2,
};

const STOCK_RANK: Record<StockStatus, number> = {
  in_stock: 0,
  low: 1,
  preorder: 2,
  out_of_stock: 3,
};

/** `round((oldPrice - price) / oldPrice * 100)`; chegirma bo‘lmasa 0. */
export function getDiscountPercent(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price || price < 0) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function getVariantStockStatus(variant: ProductVariant): StockStatus {
  if (variant.stock > 0) {
    return variant.stock <= LOW_STOCK_THRESHOLD ? "low" : "in_stock";
  }
  return variant.preorder ? "preorder" : "out_of_stock";
}

export function isVariantAvailable(variant: ProductVariant): boolean {
  return getVariantStockStatus(variant) !== "out_of_stock";
}

export function getVariantPriceInfo(variant: ProductVariant): PriceInfo {
  const discountPercent = getDiscountPercent(variant.price, variant.oldPrice);
  return {
    price: variant.price,
    oldPrice: discountPercent > 0 ? variant.oldPrice : undefined,
    discountPercent,
    hasDiscount: discountPercent > 0,
  };
}

function compareByPrice(a: ProductVariant, b: ProductVariant): number {
  return a.price - b.price;
}

/**
 * Kartada va sahifada boshlang‘ich ko‘rsatiladigan variant.
 * Avval mavjud variantlar, ular ichida eng yaxshi holat (yangi > open-box > ishlatilgan),
 * so‘ng eng arzoni. Shunda ishlatilgan telefon narxi «yangi» narx bo‘lib ko‘rinmaydi.
 */
export function getDefaultVariant(product: Product): ProductVariant {
  const [first] = product.variants;
  if (!first) {
    throw new Error(`Mahsulotda variant yo‘q: ${product.slug}`);
  }

  const available = product.variants.filter(isVariantAvailable);
  const pool = available.length > 0 ? available : product.variants;
  const bestRank = Math.min(...pool.map((v) => CONDITION_RANK[v.condition]));
  const best = pool.filter((v) => CONDITION_RANK[v.condition] === bestRank);

  // Chegirmali variant bo‘lsa, undan arzonroq (lekin chegirmasiz) variantdan ustun turadi —
  // aks holda mahsulot aksiyada deb ko‘rinib, kartada chegirma umuman ko‘rinmay qoladi.
  const discounted = best.filter((v) => getDiscountPercent(v.price, v.oldPrice) > 0);
  const candidates = discounted.length > 0 ? discounted : best;

  return [...candidates].sort(compareByPrice)[0] ?? first;
}

export function findVariant(
  product: Product,
  variantId: string | null | undefined,
): ProductVariant | undefined {
  if (!variantId) return undefined;
  return product.variants.find((v) => v.id === variantId);
}

export function getPriceInfo(product: Product): PriceInfo {
  return getVariantPriceInfo(getDefaultVariant(product));
}

/** Mahsulotning umumiy holati: variantlardan eng yaxshisi. */
export function getProductStockStatus(product: Product): StockStatus {
  return product.variants
    .map(getVariantStockStatus)
    .reduce<StockStatus>(
      (best, current) => (STOCK_RANK[current] < STOCK_RANK[best] ? current : best),
      "out_of_stock",
    );
}

export function isProductAvailable(product: Product): boolean {
  return getProductStockStatus(product) !== "out_of_stock";
}

export function hasDiscount(product: Product): boolean {
  return product.variants.some((v) => getDiscountPercent(v.price, v.oldPrice) > 0);
}

export function getMaxDiscountPercent(product: Product): number {
  return Math.max(0, ...product.variants.map((v) => getDiscountPercent(v.price, v.oldPrice)));
}

/** Qisqa xususiyat: `256 GB · Natural Titanium`. Variantsiz mahsulotda qisqa tavsif. */
export function getShortSpec(product: Product, variant?: ProductVariant): string {
  const v = variant ?? getDefaultVariant(product);
  const parts: string[] = [];
  if (v.ram) parts.push(`${formatStorage(v.ram)} RAM`);
  if (v.storage) parts.push(formatStorage(v.storage));
  if (v.size) parts.push(v.size);
  if (v.color) parts.push(v.color);
  if (v.condition !== "new") parts.push(CONDITION_LABELS[v.condition]);
  return parts.length > 0 ? parts.join(" · ") : product.shortDescription;
}

/**
 * Telegram xabari uchun variant matni: `Natural Titanium / 256 GB`.
 * Mahsulotda rang/xotira tanlovi bo‘lsa-yu, tanlanmagan bo‘lsa — «tanlanmagan».
 * Tanlanadigan variant umuman bo‘lmasa `null`.
 */
export function describeVariantForOrder(
  product: Product,
  variant?: ProductVariant | null,
): string | null {
  const hasColor = product.variants.some((v) => v.color);
  const hasStorage = product.variants.some((v) => v.storage);
  const hasSize = product.variants.some((v) => v.size);
  if (!hasColor && !hasStorage && !hasSize) return null;

  const parts: string[] = [];
  if (hasColor) parts.push(variant?.color ?? NOT_SELECTED);
  if (hasStorage) {
    const storage = variant?.storage ? formatStorage(variant.storage) : NOT_SELECTED;
    parts.push(variant?.ram ? `${formatStorage(variant.ram)} / ${storage}` : storage);
  }
  if (hasSize) parts.push(variant?.size ?? NOT_SELECTED);

  const text = parts.join(" / ");
  return variant && variant.condition !== "new"
    ? `${text} (${CONDITION_LABELS[variant.condition]})`
    : text;
}

/** `attributes[key]` qiymatini har doim satrlar ro‘yxatiga keltiradi (filter va moslik hisoblari uchun). */
export function toStringList(value: ProductAttributeValue | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

/* ------------------------------------------------------------- Mahsulot sahifasi: variant tanlash */

/** Rang/xotira/RAM/o‘lcham — holat (condition) alohida, o‘z sahifasida tanlanadi. */
export type VariantAxis = "color" | "storage" | "ram" | "size";

const AXIS_FIELD: Record<VariantAxis, keyof Pick<ProductVariant, "color" | "storage" | "ram" | "size">> = {
  color: "color",
  storage: "storage",
  ram: "ram",
  size: "size",
};

export type VariantSelection = Partial<Record<VariantAxis, string>>;

/** Berilgan condition uchun qaysi o‘qlar umuman variant qiladi (masalan, aksessuarda rang bo‘lmasligi mumkin). */
export function getVariantAxes(pool: ProductVariant[]): VariantAxis[] {
  return (Object.keys(AXIS_FIELD) as VariantAxis[]).filter((axis) =>
    new Set(pool.map((v) => v[AXIS_FIELD[axis]]).filter(Boolean)).size > 1,
  );
}

export function getAxisValues(pool: ProductVariant[], axis: VariantAxis): string[] {
  const field = AXIS_FIELD[axis];
  return [...new Set(pool.map((v) => v[field]).filter((v): v is string => Boolean(v)))];
}

/**
 * Tanlovga eng mos variantni topadi: barcha tanlangan o‘qlar mos kelgani ustuvor,
 * teng bo‘lsa — eng arzoni. `pool` bo‘sh bo‘lmasligi kerak (chaqiruvchi kafolatlaydi).
 */
export function resolveVariant(pool: ProductVariant[], selection: VariantSelection): ProductVariant {
  let best = pool[0]!;
  let bestScore = -1;

  for (const variant of pool) {
    let score = 0;
    for (const axis of Object.keys(selection) as VariantAxis[]) {
      const wanted = selection[axis];
      if (wanted !== undefined && variant[AXIS_FIELD[axis]] === wanted) score += 1;
    }
    if (score > bestScore || (score === bestScore && variant.price < best.price)) {
      best = variant;
      bestScore = score;
    }
  }

  return best;
}

/**
 * `axis` uchun `value` tanlansa, boshqa hozirgi tanlovlar bilan real variant mavjudmi.
 * Mavjud bo‘lmagan kombinatsiyalar tanlovchida o‘chirilgan (disabled) ko‘rsatiladi.
 */
export function isAxisValueAvailable(
  pool: ProductVariant[],
  selection: VariantSelection,
  axis: VariantAxis,
  value: string,
): boolean {
  return pool.some((variant) => {
    if (variant[AXIS_FIELD[axis]] !== value) return false;
    for (const otherAxis of Object.keys(selection) as VariantAxis[]) {
      if (otherAxis === axis) continue;
      const wanted = selection[otherAxis];
      if (wanted !== undefined && variant[AXIS_FIELD[otherAxis]] !== wanted) return false;
    }
    return true;
  });
}

/** Berilgan variantning har o‘qi bo‘yicha qiymatlarini tanlov obyektiga aylantiradi. */
export function variantToSelection(variant: ProductVariant): VariantSelection {
  return {
    color: variant.color,
    storage: variant.storage,
    ram: variant.ram,
    size: variant.size,
  };
}

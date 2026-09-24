/** Barcha narxlar butun so‘mda saqlanadi (float ishlatilmaydi). */
export type Money = number;

export type Condition = "new" | "used" | "open-box";

export type StockStatus = "in_stock" | "low" | "preorder" | "out_of_stock";

export interface ProductVariant {
  id: string;
  sku: string;
  color?: string;
  colorHex?: string;
  storage?: string;
  ram?: string;
  /** Soat/aksessuar o‘lchami: `41 mm`, `45 mm`. */
  size?: string;
  condition: Condition;
  simType?: string;
  price: Money;
  oldPrice?: Money;
  stock: number;
  preorder?: boolean;
  warrantyMonths: number;
  /** Masalan, ishlatilgan telefon uchun «Batareya 92%». */
  note?: string;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface SpecGroup {
  title: string;
  items: SpecItem[];
}

export type ProductAttributeValue = string | number | string[];

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandId: string;
  /** Eng chuqur (leaf) kategoriya. */
  categoryId: string;
  model?: string;
  shortDescription: string;
  description: string;
  /**
   * Haqiqiy foto yo‘llari (`/products/<slug>/1.webp`). Odatda `public/products/` dan
   * avtomatik topiladi (`npm run images`); bo‘sh bo‘lsa, ProductImage illyustratsiya ko‘rsatadi.
   */
  images: string[];
  /** Bosh sahifadagi katta banner uchun shaffof fonli foto (`hero.png`/`hero.webp`). */
  heroImage?: string;
  variants: ProductVariant[];
  specs: SpecGroup[];
  /** Filterlar uchun: cpu, gpu, screenSize, material, power, port, compatibility ... */
  attributes: Record<string, ProductAttributeValue>;
  keywords: string[];
  featured: boolean;
  /** Sotuv ballari (saralash uchun). */
  popularity: number;
  ratingAvg: number;
  ratingCount: number;
  relatedIds?: string[];
  bundleIds?: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  seo?: { title?: string; description?: string };
}

export interface PriceInfo {
  price: Money;
  oldPrice?: Money;
  discountPercent: number;
  hasDiscount: boolean;
}

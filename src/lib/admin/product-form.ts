import { z } from "zod";
import { brands } from "@/data/brands";
import { categories } from "@/data/categories";
import { transliterate } from "@/lib/search/normalize";
import type { Condition, Product, ProductAttributeValue, ProductVariant, SpecGroup } from "@/types";

/**
 * Admin mahsulot formasi: formadagi qiymatlar (hammasi matn — inputlar uchun qulay),
 * server tekshiruvi va formadan `Product` yasash. Brauzer ham, server ham shu faylni
 * ishlatadi, shuning uchun bu yerda server-only narsa yo‘q.
 */

/* ------------------------------------------------------------------ Kategoriya va brend */

const parentIds = new Set(categories.map((c) => c.parentId).filter((id): id is string => Boolean(id)));

/** Mahsulot faqat eng chuqur (barg) kategoriyaga biriktiriladi. */
export const LEAF_CATEGORIES = categories.filter((c) => !parentIds.has(c.id));
const leafIds = new Set(LEAF_CATEGORIES.map((c) => c.id));
const brandIds = new Set(brands.map((b) => b.id));

/** Formadagi kategoriya tanlovi: faqat barg kategoriyalar, to‘liq yo‘li bilan, saytdagi tartibda. */
export function getCategoryOptions(): { id: string; label: string; rootName: string }[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain = (id: string) => {
    const names: string[] = [];
    const order: number[] = [];
    for (let c = byId.get(id); c; c = c.parentId ? byId.get(c.parentId) : undefined) {
      names.unshift(c.name);
      order.unshift(c.sortOrder);
    }
    return { names, order };
  };
  return LEAF_CATEGORIES.map((c) => ({ c, ...chain(c.id) }))
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.order.length, b.order.length); i += 1) {
        const diff = (a.order[i] ?? -1) - (b.order[i] ?? -1);
        if (diff !== 0) return diff;
      }
      return 0;
    })
    .map(({ c, names }) => ({ id: c.id, label: names.slice(1).join(" › ") || names[0]!, rootName: names[0]! }));
}

export function getRootId(categoryId: string): string | null {
  let current = categories.find((c) => c.id === categoryId);
  while (current?.parentId) current = categories.find((c) => c.id === current!.parentId);
  return current?.id ?? null;
}

/* ------------------------------------------------------------------ Filtr atributlari */

export type AttributeKey = "cpu" | "gpu" | "screenSize" | "material" | "power" | "port" | "compatibility";

interface AttributeMeta {
  label: string;
  kind: "text" | "number" | "list";
  placeholder: string;
  hint?: string;
}

export const ATTRIBUTE_META: Record<AttributeKey, AttributeMeta> = {
  cpu: { label: "Protsessor", kind: "text", placeholder: "Intel Core i5" },
  gpu: { label: "Video karta", kind: "text", placeholder: "Integratsiyalashgan" },
  screenSize: { label: "Ekran o‘lchami (dyuym)", kind: "text", placeholder: "15.6" },
  material: { label: "Materiali", kind: "list", placeholder: "Silikon, MagSafe", hint: "Vergul bilan ajrating" },
  power: { label: "Quvvati (Vt)", kind: "number", placeholder: "20" },
  port: { label: "Port turi", kind: "list", placeholder: "USB-C, USB-A", hint: "Vergul bilan ajrating" },
  compatibility: {
    label: "Qaysi telefonlarga mos",
    kind: "list",
    placeholder: "iPhone 15 Pro Max, iPhone 15 Pro",
    hint: "Vergul bilan ajrating — mijoz shu model bo‘yicha filtrlaydi",
  },
};

/** Kategoriyaga qarab formada ko‘rsatiladigan atributlar (saytdagi filtrlar bilan bir xil). */
export function getAttributeKeys(categoryId: string): AttributeKey[] {
  const root = getRootId(categoryId);
  if (root === "laptoplar") return ["cpu", "gpu", "screenSize"];
  if (root === "aksessuarlar") {
    if (categoryId.includes("chexollar")) return ["compatibility", "material"];
    if (categoryId.startsWith("aksessuarlar-zaryadchiklar")) return ["compatibility", "power", "port"];
    return ["compatibility"];
  }
  return [];
}

/* ------------------------------------------------------------------ Forma qiymatlari */

export const MAX_IMAGES = 10;

export interface VariantFormValue {
  /** Faqat React ro‘yxati uchun kalit. */
  key: string;
  /** Mavjud variant id'si — buyurtmalar shunga bog‘langan, o‘zgartirilmaydi. */
  id?: string;
  sku: string;
  color: string;
  colorHex: string;
  storage: string;
  ram: string;
  size: string;
  condition: Condition;
  simType: string;
  price: string;
  oldPrice: string;
  stock: string;
  warrantyMonths: string;
  preorder: boolean;
  note: string;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  brandId: string;
  categoryId: string;
  model: string;
  shortDescription: string;
  description: string;
  /** Vergul bilan ajratilgan qidiruv so‘zlari. */
  keywords: string;
  isPublished: boolean;
  featured: boolean;
  /** Kategoriyaga xos atributlar; ro‘yxatlar vergul bilan. */
  attributes: Partial<Record<AttributeKey, string>>;
  /** Rasm manzillari; birinchisi — asosiy rasm. */
  images: string[];
  specs: SpecGroup[];
  variants: VariantFormValue[];
  /** Tahrirlashda: forma ochilgandagi versiya (boshqa joyda o‘zgartirilganini aniqlash uchun). */
  updatedAt?: string;
}

let keyCounter = 0;
export function newKey(): string {
  keyCounter += 1;
  return `v${Date.now().toString(36)}${keyCounter}`;
}

export const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "new", label: "Yangi" },
  { value: "open-box", label: "Qutisi ochilgan" },
  { value: "used", label: "Ishlatilgan" },
];

export function emptyVariant(defaults?: Partial<VariantFormValue>): VariantFormValue {
  return {
    key: newKey(),
    sku: "",
    color: "",
    colorHex: "",
    storage: "",
    ram: "",
    size: "",
    condition: "new",
    simType: "",
    price: "",
    oldPrice: "",
    stock: "1",
    warrantyMonths: "12",
    preorder: false,
    note: "",
    ...defaults,
  };
}

export function emptyFormValues(): ProductFormValues {
  return {
    name: "",
    slug: "",
    brandId: "",
    categoryId: "",
    model: "",
    shortDescription: "",
    description: "",
    keywords: "",
    isPublished: true,
    featured: false,
    attributes: {},
    images: [],
    specs: [],
    variants: [emptyVariant()],
  };
}

function attributeToText(value: ProductAttributeValue | undefined): string {
  if (value === undefined) return "";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

export function productToFormValues(product: Product): ProductFormValues {
  const attributes: Partial<Record<AttributeKey, string>> = {};
  for (const key of Object.keys(ATTRIBUTE_META) as AttributeKey[]) {
    const text = attributeToText(product.attributes[key]);
    if (text) attributes[key] = text;
  }
  return {
    name: product.name,
    slug: product.slug,
    brandId: product.brandId,
    categoryId: product.categoryId,
    model: product.model ?? "",
    shortDescription: product.shortDescription,
    description: product.description,
    keywords: product.keywords.join(", "),
    isPublished: product.isPublished,
    featured: product.featured,
    attributes,
    images: product.images,
    specs: product.specs,
    variants: product.variants.map((v) => ({
      key: newKey(),
      id: v.id,
      sku: v.sku,
      color: v.color ?? "",
      colorHex: v.colorHex ?? "",
      storage: v.storage ?? "",
      ram: v.ram ?? "",
      size: v.size ?? "",
      condition: v.condition,
      simType: v.simType ?? "",
      price: String(v.price),
      oldPrice: v.oldPrice ? String(v.oldPrice) : "",
      stock: String(v.stock),
      warrantyMonths: String(v.warrantyMonths),
      preorder: Boolean(v.preorder),
      note: v.note ?? "",
    })),
    updatedAt: product.updatedAt,
  };
}

/* ------------------------------------------------------------------ Yordamchilar */

/** `14 500 000 so‘m` → 14500000. Raqamsiz matn → NaN. */
export function parseMoney(text: string): number {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number(digits) : Number.NaN;
}

/** «iPhone 15 Pro Max (o‘zbek)» → `iphone-15-pro-max-ozbek` */
export function slugify(text: string): string {
  return transliterate(text.toLowerCase())
    .replace(/['`´ʻʼ‘’′ʹ]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function splitList(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of text.split(/[,\n]/)) {
    const item = part.trim().replace(/\s+/g, " ");
    const key = item.toLowerCase();
    if (item && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

const CONDITION_SUFFIX: Record<Condition, string> = { new: "new", "open-box": "openbox", used: "used" };

function variantBaseId(slug: string, v: Pick<VariantFormValue, "storage" | "ram" | "size" | "color" | "condition">): string {
  return [slug, v.storage, v.ram ? `${v.ram}-ram` : "", v.size, v.color, CONDITION_SUFFIX[v.condition]]
    .map((part) => slugify(part))
    .filter(Boolean)
    .join("-");
}

function autoSku(slug: string, v: Pick<VariantFormValue, "storage" | "ram" | "size" | "color" | "condition">): string {
  const base = slug
    .split("-")
    .map((part) => part.slice(0, 3))
    .join("")
    .toUpperCase()
    .slice(0, 12);
  const parts = [base, v.ram, v.storage || v.size, v.color ? slugify(v.color).replace(/-/g, "").slice(0, 4) : ""]
    .filter(Boolean)
    .map((p) => p!.replace(/\s+/g, "").toUpperCase());
  const suffix = v.condition === "open-box" ? "-OB" : v.condition === "used" ? "-U" : "";
  return parts.join("-") + suffix;
}

/** Variantning qisqa nomi (forma sarlavhasi, xato xabarlari uchun): `256GB · Qora · Yangi`. */
export function describeVariantRow(v: VariantFormValue): string {
  const condition = CONDITION_OPTIONS.find((c) => c.value === v.condition)?.label ?? "";
  return [v.storage, v.ram && `${v.ram} RAM`, v.size, v.color, condition].filter(Boolean).join(" · ") || "Variant";
}

/* ------------------------------------------------------------------ Variantlar jadvali generatori */

export interface ColorOption {
  name: string;
  hex: string;
}

/** Tez tanlash uchun keng tarqalgan ranglar. */
export const COMMON_COLORS: ColorOption[] = [
  { name: "Qora", hex: "#1F1F1F" },
  { name: "Oq", hex: "#F2F2F2" },
  { name: "Kumush", hex: "#C9CBCE" },
  { name: "Ko‘k", hex: "#3B5B8C" },
  { name: "Yashil", hex: "#5E7D63" },
  { name: "Pushti", hex: "#F2C7CF" },
  { name: "Binafsha", hex: "#7D6A9C" },
  { name: "Sariq", hex: "#F3DA7A" },
  { name: "Qizil", hex: "#C0392B" },
  { name: "Tilla", hex: "#E3C9A1" },
  { name: "Natural Titanium", hex: "#B7AFA5" },
  { name: "Black Titanium", hex: "#2E2E30" },
];

export const COMMON_STORAGES = ["64GB", "128GB", "256GB", "512GB", "1TB"];

export interface MatrixInput {
  colors: ColorOption[];
  storages: string[];
  condition: Condition;
  warrantyMonths: string;
  simType: string;
  price: string;
  stock: string;
}

/**
 * Ranglar × xotiralar bo‘yicha yetishmayotgan variantlarni qo‘shadi. Bor variantlarga
 * (rang + xotira + holat bir xil bo‘lsa) tegilmaydi — qayta bosish xavfsiz.
 */
export function addMatrixVariants(current: VariantFormValue[], input: MatrixInput): VariantFormValue[] {
  const colors = input.colors.length > 0 ? input.colors : [{ name: "", hex: "" }];
  const storages = input.storages.length > 0 ? input.storages : [""];
  const exists = new Set(
    current.map((v) => `${v.color.toLowerCase()}|${v.storage.toLowerCase()}|${v.condition}`),
  );
  // Bitta bo‘sh (hali to‘ldirilmagan) qator bo‘lsa — uni jadval bilan almashtiramiz.
  const base = current.filter((v) => v.id || v.price || v.color || v.storage);
  const added: VariantFormValue[] = [];
  for (const storage of storages) {
    for (const color of colors) {
      const key = `${color.name.toLowerCase()}|${storage.toLowerCase()}|${input.condition}`;
      if (exists.has(key)) continue;
      exists.add(key);
      added.push(
        emptyVariant({
          color: color.name,
          colorHex: color.hex,
          storage,
          condition: input.condition,
          warrantyMonths: input.warrantyMonths,
          simType: input.simType,
          price: input.price,
          stock: input.stock,
        }),
      );
    }
  }
  return [...base, ...added];
}

/* ------------------------------------------------------------------ Xususiyatlar shabloni */

const SPEC_TEMPLATES: Record<string, SpecGroup[]> = {
  telefonlar: [
    { title: "Ekran", items: [{ label: "Diagonal va turi", value: "" }] },
    { title: "Protsessor va xotira", items: [{ label: "Chip", value: "" }, { label: "Operativ xotira", value: "" }] },
    { title: "Kamera", items: [{ label: "Asosiy kamera", value: "" }, { label: "Old kamera", value: "" }] },
    { title: "Batareya", items: [{ label: "Sig‘im va zaryad", value: "" }] },
    { title: "Umumiy", items: [{ label: "Operatsion tizim", value: "" }, { label: "SIM", value: "" }] },
  ],
  laptoplar: [
    { title: "Ekran", items: [{ label: "Diagonal va turi", value: "" }] },
    { title: "Protsessor va grafika", items: [{ label: "Protsessor", value: "" }, { label: "Video karta", value: "" }] },
    { title: "Xotira", items: [{ label: "Operativ xotira", value: "" }, { label: "SSD", value: "" }] },
    { title: "Umumiy", items: [{ label: "Operatsion tizim", value: "" }, { label: "Og‘irligi", value: "" }] },
  ],
  aksessuarlar: [{ title: "Asosiy", items: [{ label: "Moslik", value: "" }, { label: "Materiali", value: "" }] }],
};

export function getSpecTemplate(categoryId: string): SpecGroup[] {
  const template = SPEC_TEMPLATES[getRootId(categoryId) ?? ""] ?? [{ title: "Asosiy", items: [{ label: "", value: "" }] }];
  return structuredClone(template);
}

/* ------------------------------------------------------------------ Server tekshiruvi */

const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label}: ko‘pi bilan ${max} ta belgi`);

const moneyText = (label: string, required: boolean) =>
  z.string().superRefine((value, ctx) => {
    if (!value.trim()) {
      if (required) ctx.addIssue({ code: "custom", message: `${label}ni kiriting` });
      return;
    }
    const n = parseMoney(value);
    if (!Number.isSafeInteger(n) || n <= 0) ctx.addIssue({ code: "custom", message: `${label} musbat butun son bo‘lishi kerak` });
    else if (n > 10_000_000_000) ctx.addIssue({ code: "custom", message: `${label} juda katta` });
  });

const intText = (label: string, min: number, max: number) =>
  z.string().superRefine((value, ctx) => {
    const n = Number(value.trim());
    if (!value.trim() || !Number.isInteger(n) || n < min || n > max) {
      ctx.addIssue({ code: "custom", message: `${label}: ${min}–${max} oralig‘ida butun son` });
    }
  });

const variantInputSchema = z
  .object({
    key: z.string().max(60),
    id: z.string().max(200).optional(),
    sku: text(80, "SKU"),
    color: text(60, "Rang"),
    colorHex: z.string().trim().regex(/^(#[0-9a-fA-F]{6})?$/, "Rang kodi #RRGGBB ko‘rinishida"),
    storage: text(30, "Xotira"),
    ram: text(30, "RAM"),
    size: text(30, "O‘lcham"),
    condition: z.enum(["new", "used", "open-box"]),
    simType: text(60, "SIM turi"),
    price: moneyText("Narx", true),
    oldPrice: moneyText("Eski narx", false),
    stock: intText("Qoldiq", 0, 100_000),
    warrantyMonths: intText("Kafolat (oy)", 0, 120),
    preorder: z.boolean(),
    note: text(200, "Izoh"),
  })
  .superRefine((v, ctx) => {
    if (v.oldPrice.trim() && parseMoney(v.oldPrice) <= parseMoney(v.price)) {
      ctx.addIssue({ code: "custom", path: ["oldPrice"], message: "Eski narx hozirgi narxdan katta bo‘lishi kerak" });
    }
  });

export const productInputSchema = z
  .object({
    name: text(200, "Nomi").min(2, "Mahsulot nomini kiriting (kamida 2 belgi)"),
    slug: z
      .string()
      .trim()
      .min(1, "Saytdagi manzilni kiriting")
      .max(80, "Manzil juda uzun")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Manzilda faqat kichik lotin harflari, raqam va «-» bo‘lishi mumkin")
      // `/admin/mahsulotlar/yangi` sahifasi bilan to‘qnashmasin.
      .refine((slug) => slug !== "yangi", "Bu so‘z band — boshqa manzil yozing"),
    brandId: z.string().refine((id) => brandIds.has(id), "Brendni tanlang"),
    categoryId: z.string().refine((id) => leafIds.has(id), "Kategoriyani tanlang"),
    model: text(120, "Model"),
    shortDescription: text(300, "Qisqa tavsif"),
    description: text(5000, "To‘liq tavsif"),
    keywords: text(1000, "Qidiruv so‘zlari"),
    isPublished: z.boolean(),
    featured: z.boolean(),
    attributes: z.partialRecord(
      z.enum(["cpu", "gpu", "screenSize", "material", "power", "port", "compatibility"]),
      text(500, "Xususiyat"),
    ),
    images: z.array(z.string().trim().min(1).max(500)).max(MAX_IMAGES, `Ko‘pi bilan ${MAX_IMAGES} ta rasm`),
    specs: z
      .array(
        z.object({
          title: text(80, "Bo‘lim nomi"),
          items: z.array(z.object({ label: text(80, "Nomi"), value: text(300, "Qiymati") })).max(50),
        }),
      )
      .max(30, "Xususiyat bo‘limlari juda ko‘p"),
    variants: z.array(variantInputSchema).min(1, "Kamida bitta variant (narx) bo‘lishi kerak").max(200),
    updatedAt: z.string().max(60).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.attributes.power?.trim()) {
      const power = Number(values.attributes.power.replace(",", "."));
      if (!Number.isFinite(power) || power <= 0 || power > 1000) {
        ctx.addIssue({ code: "custom", path: ["attributes", "power"], message: "Quvvat 1–1000 Vt oralig‘ida son" });
      }
    }
    // Bir xil (rang + xotira + RAM + o‘lcham + holat) variant ikki marta bo‘lmasin.
    const seen = new Map<string, number>();
    values.variants.forEach((v, index) => {
      const key = [v.color, v.storage, v.ram, v.size, v.condition].map((p) => p.trim().toLowerCase()).join("|");
      const first = seen.get(key);
      if (first !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "color"],
          message: `Bu variant ${first + 1}-qatordagi bilan bir xil (rang, xotira va holatini farqlang)`,
        });
      } else {
        seen.set(key, index);
      }
    });
  });

export type ProductInput = z.infer<typeof productInputSchema>;

/* ------------------------------------------------------------------ Formadan mahsulot */

function buildAttributes(input: ProductInput, existing: Product["attributes"]): Product["attributes"] {
  // Faqat formada KO‘RSATILGAN maydonlar yangilanadi. Qolganlari (powerbank sig‘imi,
  // shu kategoriyada ko‘rinmaydigan port turi va h.k.) o‘zgarishsiz saqlanadi — jimgina o‘chmaydi.
  const shown = getAttributeKeys(input.categoryId);
  const result: Product["attributes"] = {};
  for (const [key, value] of Object.entries(existing)) {
    if (!shown.includes(key as AttributeKey)) result[key] = value;
  }
  for (const key of shown) {
    const raw = input.attributes[key]?.trim();
    if (!raw) continue;
    const meta = ATTRIBUTE_META[key];
    if (meta.kind === "list") {
      const list = splitList(raw);
      if (list.length > 0) result[key] = list;
    } else if (meta.kind === "number") {
      result[key] = Number(raw.replace(",", "."));
    } else {
      result[key] = raw;
    }
  }
  return result;
}

function cleanSpecs(specs: ProductInput["specs"]): SpecGroup[] {
  return specs
    .map((group) => ({
      title: group.title.trim(),
      items: group.items
        .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
        .filter((item) => item.label && item.value),
    }))
    .filter((group) => group.title && group.items.length > 0);
}

/**
 * Tekshirilgan formadan to‘liq `Product` yasaydi. Mavjud variantlar id'si saqlanadi
 * (faqat shu mahsulotga tegishli bo‘lsa); yangi variantlarga noyob id beriladi.
 */
export function buildProductFromInput(input: ProductInput, existing: Product | null, nowIso: string): Product {
  const slug = existing ? existing.slug : input.slug;
  const existingIds = new Set(existing?.variants.map((v) => v.id) ?? []);
  const usedIds = new Set<string>();

  // Avval saqlanadigan eski id'larni band qilamiz, keyin yangilariga noyob id beramiz.
  const keptIds = input.variants.map((v) => (v.id && existingIds.has(v.id) && !usedIds.has(v.id) ? (usedIds.add(v.id), v.id) : null));

  const variants: ProductVariant[] = input.variants.map((v, index) => {
    let id = keptIds[index];
    if (!id) {
      const base = variantBaseId(slug, v) || `${slug}-variant`;
      id = base;
      for (let n = 2; usedIds.has(id); n += 1) id = `${base}-${n}`;
      usedIds.add(id);
    }
    const oldPrice = v.oldPrice.trim() ? parseMoney(v.oldPrice) : undefined;
    const variant: ProductVariant = {
      id,
      sku: v.sku.trim() || autoSku(slug, v),
      color: v.color.trim() || undefined,
      colorHex: v.color.trim() && v.colorHex.trim() ? v.colorHex.trim().toUpperCase() : undefined,
      storage: v.storage.trim() || undefined,
      ram: v.ram.trim() || undefined,
      size: v.size.trim() || undefined,
      condition: v.condition,
      simType: v.simType.trim() || undefined,
      price: parseMoney(v.price),
      oldPrice,
      stock: Number(v.stock),
      preorder: v.preorder || undefined,
      warrantyMonths: Number(v.warrantyMonths),
      note: v.note.trim() || undefined,
    };
    return JSON.parse(JSON.stringify(variant)) as ProductVariant;
  });

  return {
    id: slug,
    slug,
    name: input.name.trim(),
    brandId: input.brandId,
    categoryId: input.categoryId,
    model: input.model.trim() || undefined,
    shortDescription: input.shortDescription.trim(),
    description: input.description.trim(),
    // Rasm manzillarining kelib chiqishini server action tekshiradi (faqat o‘z papkamiz yoki eskilari).
    images: [...new Set(input.images)],
    heroImage: existing?.heroImage,
    variants,
    specs: cleanSpecs(input.specs),
    attributes: buildAttributes(input, existing?.attributes ?? {}),
    keywords: splitList(input.keywords).slice(0, 50),
    featured: input.featured,
    popularity: existing?.popularity ?? 0,
    ratingAvg: existing?.ratingAvg ?? 0,
    ratingCount: existing?.ratingCount ?? 0,
    relatedIds: existing?.relatedIds,
    bundleIds: existing?.bundleIds,
    isPublished: input.isPublished,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    seo: existing?.seo,
  };
}

/** zod xatolarini `{"variants.2.price": "..."}` ko‘rinishiga keltiradi (birinchi xabar). */
export function flattenIssues(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path.map(String).join(".");
    if (!(path in result)) result[path] = issue.message;
  }
  return result;
}

/* ------------------------------------------------------------------ Nusxa olish */

/**
 * Mavjud mahsulotdan yangi mahsulot formasi: hamma narsa ko‘chiriladi, lekin manzil, variant
 * id/SKU yangidan yasaladi va mahsulot avval yashirin turadi (adashib saytga chiqmasin).
 */
export function duplicateFormValues(product: Product): ProductFormValues {
  const values = productToFormValues(product);
  const name = `${product.name} (nusxa)`;
  return {
    ...values,
    name,
    slug: slugify(name),
    isPublished: false,
    featured: false,
    variants: values.variants.map((v) => ({ ...v, key: newKey(), id: undefined, sku: "" })),
    updatedAt: undefined,
  };
}

/* ------------------------------------------------------------------ Tez tahrir (ro‘yxatdan) */

/** Variantning qisqa nomi: `256GB · Qora · Yangi`. */
export function variantLabel(v: ProductVariant): string {
  const condition = CONDITION_OPTIONS.find((c) => c.value === v.condition)?.label ?? "";
  return [v.storage, v.ram && `${v.ram} RAM`, v.size, v.color, condition].filter(Boolean).join(" · ") || "Asosiy variant";
}

export const quickEditSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(120),
  updatedAt: z.string().min(1).max(60),
  variants: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        price: z.number().int().positive("Narx musbat bo‘lishi kerak").max(10_000_000_000),
        oldPrice: z.number().int().positive().max(10_000_000_000).nullable(),
        stock: z.number().int().min(0, "Qoldiq manfiy bo‘lmaydi").max(100_000),
      }),
    )
    .min(1)
    .max(200),
});

export type QuickEditInput = z.infer<typeof quickEditSchema>;

/**
 * Tez tahrirni mahsulotga qo‘llaydi. Faqat narx, eski narx va qoldiq o‘zgaradi; boshqa
 * hech narsaga tegilmaydi. Xato bo‘lsa — `{ errors: { "<variantId>": "..." } }`.
 */
export function applyQuickEdit(
  product: Product,
  input: QuickEditInput,
  nowIso: string,
): { product: Product } | { errors: Record<string, string> } {
  const byId = new Map(input.variants.map((v) => [v.id, v]));
  const errors: Record<string, string> = {};
  for (const id of byId.keys()) {
    if (!product.variants.some((v) => v.id === id)) errors[id] = "Bu variant endi yo‘q — sahifani yangilang";
  }
  const variants = product.variants.map((v) => {
    const change = byId.get(v.id);
    if (!change) return v;
    if (change.oldPrice !== null && change.oldPrice <= change.price) {
      errors[v.id] = "Eski narx yangi narxdan katta bo‘lishi kerak (yoki uni o‘chiring)";
    }
    const next: ProductVariant = { ...v, price: change.price, stock: change.stock };
    if (change.oldPrice === null) delete next.oldPrice;
    else next.oldPrice = change.oldPrice;
    return next;
  });
  if (Object.keys(errors).length > 0) return { errors };
  return { product: { ...product, variants, updatedAt: nowIso } };
}

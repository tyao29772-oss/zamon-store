/**
 * 1–3-bosqich poydevorini sinaydi: mock data yaxlitligi, util'lar, repository,
 * normalizatsiya, katalog filtri/saralash/sahifalash.
 * Ishga tushirish: `npm run test:foundation`
 */
import assert from "node:assert/strict";

import { banners } from "@/data/banners";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { allProducts } from "@/data/products";
import { getFilterFields, PHONE_FILTERS } from "@/config/filters";
import { SYNONYM_GROUPS } from "@/config/synonyms";
import {
  applyFilters,
  getFacets,
  getPriceBounds,
  hrefSetPage,
  hrefToggleValue,
  nonPriceEntries,
  paginate,
  parseFilters,
  sortProducts,
  toSearchParams,
  type FilterField,
} from "@/lib/catalog";
import { formatDate, formatDiscount, formatNumber, formatPrice, formatStorage } from "@/lib/format";
import { formatUzPhone, normalizeUzPhone } from "@/lib/phone";
import {
  describeVariantForOrder,
  getAxisValues,
  getDefaultVariant,
  getDiscountPercent,
  getPriceInfo,
  getProductStockStatus,
  getShortSpec,
  getVariantAxes,
  getVariantStockStatus,
  hasDiscount,
  isAxisValueAvailable,
  resolveVariant,
  variantToSelection,
} from "@/lib/product";
import { checkRateLimit } from "@/lib/rate-limit";
import { getBrandById, getBrandBySlug, getBrands } from "@/lib/repo/brands";
import {
  getCategories,
  getCategoryByPath,
  getCategoryChain,
  getCategoryTree,
  getChildCategories,
  getDescendantIds,
  getRootCategoryId,
} from "@/lib/repo/categories";
import {
  getAllProducts,
  getBundleProducts,
  getFeaturedProducts,
  getNewProducts,
  getPopularProducts,
  getProductBySlug,
  getProductsByBrand,
  getProductsByCategory,
  getProductsByIds,
  getRelatedProducts,
  getSaleProducts,
} from "@/lib/repo/products";
import { searchProducts } from "@/lib/repo/search";
import { normalizeText, tokenize } from "@/lib/search/normalize";
import { createSearchEngine, expandSearchQuery } from "@/lib/search";
import { buildBreadcrumbJsonLd, buildProductJsonLd, toJsonLd } from "@/lib/seo";
import { buildOrderMessage, createTelegramLink, escapeTelegramHtml } from "@/lib/telegram";
import { absoluteUrl, productHref } from "@/lib/urls";
import {
  countByStatus,
  filterAdminRows,
  parseSort,
  parseStatus,
  toAdminRow,
  type AdminListQuery,
} from "@/lib/admin/product-list";
import {
  addMatrixVariants,
  getLeafCategories,
  getRootId,
  validateTaxonomy,
  applyQuickEdit,
  duplicateFormValues,
  quickEditSchema,
  buildProductFromInput,
  emptyFormValues,
  flattenIssues,
  getAttributeKeys,
  getCategoryOptions,
  parseMoney,
  productInputSchema,
  productToFormValues,
  slugify,
} from "@/lib/admin/product-form";
import {
  countOrderTabs,
  filterOrders,
  formatOrderTime,
  parseOrderTab,
  phoneCallHref,
  telegramChatHref,
} from "@/lib/admin/order-list";
import { productSchema, productToRow, rowToProduct } from "@/lib/repo/product-rows";
import { buildOrderNotification } from "@/lib/telegram-bot";
import { getServerEnv } from "@/config/env";
import { store } from "@/data/store";
import { mergeStoreSettings, paragraphsToText, pickStoreSettings, storeSettingsSchema, textToParagraphs } from "@/lib/settings/store-settings";
import type { Order, Product, ProductVariant } from "@/types";

let passed = 0;
const failures: string[] = [];

async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}\n       ${message.split("\n").join("\n       ")}`);
    console.log(`  FAIL ${name}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

/* -------------------------------------------------- Katalog testlari uchun fixture'lar */

function makeVariant(overrides: Partial<ProductVariant> & { id: string; price: number }): ProductVariant {
  return { sku: overrides.id, condition: "new", stock: 5, warrantyMonths: 12, ...overrides };
}

function makeProduct(
  overrides: Partial<Product> & { id: string; variants: ProductVariant[] },
): Product {
  return {
    slug: overrides.id,
    name: overrides.id,
    brandId: "brandx",
    categoryId: "catx",
    shortDescription: "",
    description: "",
    images: [],
    specs: [],
    attributes: {},
    keywords: [],
    featured: false,
    popularity: 0,
    ratingAvg: 0,
    ratingCount: 0,
    isPublished: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const FX_FIELDS: FilterField[] = [
  { key: "brend", label: "Brend", source: "brand" },
  { key: "xotira", label: "Xotira", source: "variant.storage", order: ["128GB", "256GB", "512GB"] },
  { key: "rang", label: "Rang", source: "variant.color" },
];

const fxA = makeProduct({
  id: "fx-a",
  brandId: "apple",
  featured: true,
  popularity: 90,
  createdAt: "2026-05-01T00:00:00.000Z",
  variants: [
    makeVariant({ id: "fx-a-256", storage: "256GB", color: "Black", price: 1_000_000 }),
    makeVariant({ id: "fx-a-512", storage: "512GB", color: "Black", price: 1_200_000, oldPrice: 1_300_000 }),
  ],
});
const fxB = makeProduct({
  id: "fx-b",
  brandId: "samsung",
  popularity: 50,
  createdAt: "2026-02-01T00:00:00.000Z",
  variants: [makeVariant({ id: "fx-b-256", storage: "256GB", color: "White", price: 900_000 })],
});
const fxC = makeProduct({
  id: "fx-c",
  brandId: "apple",
  popularity: 70,
  createdAt: "2026-06-01T00:00:00.000Z",
  variants: [
    makeVariant({ id: "fx-c-128", storage: "128GB", color: "White", condition: "used", price: 500_000, stock: 0 }),
  ],
});
const fixtureProducts = [fxA, fxB, fxC];

/* -------------------------------------------------- Variant tanlash fixture'lari */

// "new" holat — to‘liq kartezian (2 rang × 2 xotira) + bitta yolg‘iz "Red 512GB" (juftlashmagan).
const fxVNew = [
  makeVariant({ id: "fv-1", color: "Black", storage: "128GB", price: 100 }),
  makeVariant({ id: "fv-2", color: "Black", storage: "256GB", price: 120 }),
  makeVariant({ id: "fv-3", color: "White", storage: "128GB", price: 105 }),
  makeVariant({ id: "fv-4", color: "White", storage: "256GB", price: 125 }),
  makeVariant({ id: "fv-6", color: "Red", storage: "512GB", price: 200 }),
];
const fxVUsed = [
  makeVariant({ id: "fv-5", color: "Black", storage: "128GB", condition: "used", price: 70, note: "Batareya 85%" }),
];
const fxV = makeProduct({ id: "fx-v", variants: [...fxVNew, ...fxVUsed] });

const NBSP = " ";

async function main(): Promise<void> {
  section("Ma’lumot yaxlitligi");

  await check("kamida 45 ta mahsulot", () => {
    assert.ok(allProducts.length >= 45, `mahsulotlar soni: ${allProducts.length}`);
  });

  await check("kamida 25 ta mahsulotda bir nechta variant bor", () => {
    const multi = allProducts.filter((p) => p.variants.length > 1).length;
    assert.ok(multi >= 25, `ko‘p variantli mahsulotlar: ${multi}`);
  });

  await check("product id va slug noyob", () => {
    const ids = new Set(allProducts.map((p) => p.id));
    const slugs = new Set(allProducts.map((p) => p.slug));
    assert.equal(ids.size, allProducts.length);
    assert.equal(slugs.size, allProducts.length);
  });

  await check("variant id va SKU noyob", () => {
    const variantIds = new Map<string, string>();
    const skus = new Map<string, string>();
    for (const product of allProducts) {
      for (const variant of product.variants) {
        const idOwner = variantIds.get(variant.id);
        assert.equal(idOwner, undefined, `takroriy variant id: ${variant.id} (${idOwner} va ${product.slug})`);
        variantIds.set(variant.id, product.slug);

        const skuOwner = skus.get(variant.sku);
        assert.equal(skuOwner, undefined, `takroriy SKU: ${variant.sku} (${skuOwner} va ${product.slug})`);
        skus.set(variant.sku, product.slug);
      }
    }
  });

  await check("har mahsulotda kamida 1 variant, brend va leaf kategoriya mavjud", () => {
    const brandIds = new Set(brands.map((b) => b.id));
    const parentIds = new Set(categories.map((c) => c.parentId).filter(Boolean));
    const categoryIds = new Set(categories.map((c) => c.id));
    for (const p of allProducts) {
      assert.ok(p.variants.length > 0, `variant yo‘q: ${p.slug}`);
      assert.ok(brandIds.has(p.brandId), `brend topilmadi: ${p.slug} → ${p.brandId}`);
      assert.ok(categoryIds.has(p.categoryId), `kategoriya topilmadi: ${p.slug} → ${p.categoryId}`);
      assert.ok(!parentIds.has(p.categoryId), `leaf emas: ${p.slug} → ${p.categoryId}`);
    }
  });

  await check("narx, eski narx, qoldiq va kafolat to‘g‘ri", () => {
    for (const p of allProducts) {
      for (const v of p.variants) {
        assert.ok(Number.isInteger(v.price) && v.price > 0, `narx butun musbat emas: ${v.id}`);
        if (v.oldPrice !== undefined) {
          assert.ok(Number.isInteger(v.oldPrice) && v.oldPrice > v.price, `eski narx narxdan katta emas: ${v.id}`);
        }
        assert.ok(Number.isInteger(v.stock) && v.stock >= 0, `qoldiq noto‘g‘ri: ${v.id}`);
        assert.ok(v.warrantyMonths >= 0, `kafolat noto‘g‘ri: ${v.id}`);
      }
      assert.ok(p.ratingAvg >= 0 && p.ratingAvg <= 5, `reyting noto‘g‘ri: ${p.slug}`);
      assert.ok(!Number.isNaN(Date.parse(p.createdAt)), `createdAt noto‘g‘ri: ${p.slug}`);
    }
  });

  await check("UI holatlari uchun namunalar bor (tugagan, kam qoldi, oldindan buyurtma, ishlatilgan, open-box)", () => {
    const statuses = new Set(allProducts.flatMap((p) => p.variants.map(getVariantStockStatus)));
    for (const s of ["in_stock", "low", "preorder", "out_of_stock"] as const) {
      assert.ok(statuses.has(s), `holat yo‘q: ${s}`);
    }
    const conditions = new Set(allProducts.flatMap((p) => p.variants.map((v) => v.condition)));
    for (const c of ["new", "used", "open-box"] as const) {
      assert.ok(conditions.has(c), `holat yo‘q: ${c}`);
    }
    const fullyOut = allProducts.filter((p) => getProductStockStatus(p) === "out_of_stock");
    assert.ok(fullyOut.length >= 1, "butunlay tugagan mahsulot yo‘q");
  });

  await check("bannerlar havolasi mavjud sahifaga olib boradi", async () => {
    const staticRoutes = new Set(["/aksiyalar"]);
    for (const banner of banners) {
      if (staticRoutes.has(banner.href)) continue;
      if (banner.href.startsWith("/mahsulot/")) {
        assert.ok(await getProductBySlug(banner.href.replace("/mahsulot/", "")), `mahsulot yo‘q: ${banner.href}`);
      } else if (banner.href.startsWith("/katalog/")) {
        const category = await getCategoryByPath(banner.href.replace("/katalog/", "").split("/"));
        assert.ok(category, `kategoriya yo‘q: ${banner.href}`);
      } else {
        assert.fail(`noma’lum banner havolasi: ${banner.href}`);
      }
    }
  });

  await check("bundleIds/relatedIds mavjud mahsulotlarga ishora qiladi", () => {
    const slugs = new Set(allProducts.map((p) => p.slug));
    for (const p of allProducts) {
      for (const id of [...(p.bundleIds ?? []), ...(p.relatedIds ?? [])]) {
        assert.ok(slugs.has(id), `${p.slug}: mavjud bo‘lmagan mahsulot ${id}`);
      }
    }
  });

  section("Kategoriya daraxti");

  await check("daraxt qurilishi va yo‘llar", async () => {
    const all = await getCategories();
    assert.equal(all.length, categories.length);
    const iphone = await getCategoryByPath(["telefonlar", "iphone"]);
    assert.equal(iphone?.href, "/katalog/telefonlar/iphone");
    const adapters = await getCategoryByPath(["aksessuarlar", "zaryadchiklar", "adapterlar"]);
    assert.equal(adapters?.depth, 2);
    assert.equal(await getCategoryByPath(["telefonlar", "yoq"]), null);
    assert.equal(await getCategoryByPath([]), null);
  });

  await check("breadcrumb zanjiri va ildiz", async () => {
    const chain = await getCategoryChain("aksessuarlar-zaryadchiklar-adapterlar");
    assert.deepEqual(
      chain.map((c) => c.slug),
      ["aksessuarlar", "zaryadchiklar", "adapterlar"],
    );
    assert.equal(await getRootCategoryId("telefonlar-iphone"), "telefonlar");
  });

  await check("avlodlar va bolalar", async () => {
    const descendants = await getDescendantIds("aksessuarlar-zaryadchiklar");
    assert.equal(descendants.length, 5);
    const children = await getChildCategories("telefonlar");
    assert.deepEqual(
      children.map((c) => c.slug),
      ["iphone", "samsung", "infinix", "honor", "redmi-xiaomi", "poco", "boshqa-telefonlar"],
    );
    const tree = await getCategoryTree();
    assert.deepEqual(
      tree.map((c) => c.slug),
      ["telefonlar", "aksessuarlar", "laptoplar"],
    );
  });

  await check("har bir leaf kategoriyada kamida 1 mahsulot bor", async () => {
    for (const category of await getCategories()) {
      if (category.childIds.length > 0) continue;
      const products = await getProductsByCategory(category.id);
      assert.ok(products.length > 0, `bo‘sh kategoriya: ${category.path}`);
    }
  });

  section("Repository");

  await check("kategoriya bo‘yicha mahsulotlar (avlodlar bilan)", async () => {
    assert.equal((await getProductsByCategory("telefonlar")).length, 25);
    assert.equal((await getProductsByCategory("telefonlar-iphone")).length, 7);
    assert.equal((await getProductsByCategory("laptoplar")).length, 8);
    const total =
      (await getProductsByCategory("telefonlar")).length +
      (await getProductsByCategory("aksessuarlar")).length +
      (await getProductsByCategory("laptoplar")).length;
    assert.equal(total, allProducts.length);
  });

  await check("brend bo‘yicha", async () => {
    const apple = await getBrandBySlug("apple");
    assert.ok(apple);
    const products = await getProductsByBrand(apple.id);
    assert.ok(products.length >= 10);
    assert.ok(products.every((p) => p.brandId === "apple"));
    assert.equal(await getBrandBySlug("yoq-brend"), null);
  });

  await check("slug va id bo‘yicha olish tartibni saqlaydi", async () => {
    assert.equal((await getProductBySlug("iphone-15-pro-max"))?.name, "iPhone 15 Pro Max");
    assert.equal(await getProductBySlug("yoq"), null);
    const list = await getProductsByIds(["redmi-13c", "yoq", "iphone-15", "redmi-13c"]);
    assert.deepEqual(
      list.map((p) => p.slug),
      ["redmi-13c", "iphone-15"],
    );
  });

  await check("mashhur, yangi, aksiya, tanlangan ro‘yxatlar", async () => {
    const popular = await getPopularProducts(8);
    assert.equal(popular.length, 8);
    for (let i = 1; i < popular.length; i++) {
      assert.ok(popular[i - 1]!.popularity >= popular[i]!.popularity);
    }
    const fresh = await getNewProducts(8);
    for (let i = 1; i < fresh.length; i++) {
      assert.ok(fresh[i - 1]!.createdAt >= fresh[i]!.createdAt);
    }
    const sale = await getSaleProducts();
    assert.ok(sale.length >= 10, `aksiyadagilar: ${sale.length}`);
    assert.ok(sale.every((p) => p.variants.some((v) => getDiscountPercent(v.price, v.oldPrice) > 0)));
    const featured = await getFeaturedProducts(8);
    assert.ok(featured.length > 0 && featured.every((p) => p.featured));
  });

  await check("o‘xshash mahsulotlar o‘zini o‘z ichiga olmaydi va bir turkumdan", async () => {
    const product = (await getProductBySlug("iphone-15-pro-max"))!;
    const related = await getRelatedProducts(product, 8);
    assert.ok(related.length >= 4, `o‘xshashlar: ${related.length}`);
    assert.ok(related.every((p) => p.id !== product.id));
    const roots = await Promise.all(related.map((p) => getRootCategoryId(p.categoryId)));
    assert.ok(roots.every((r) => r === "telefonlar"));
    assert.equal(related[0]?.categoryId, "telefonlar-iphone");
  });

  await check("chexolning o‘xshashlari — shu telefonning boshqa aksessuarlari yuqorida", async () => {
    const product = (await getProductBySlug("iphone-15-pro-max-silikon-chexol"))!;
    const related = await getRelatedProducts(product, 4);
    assert.ok(related.some((p) => p.slug === "iphone-15-pro-max-magsafe-chexol"));
  });

  await check("birga olinadigan mahsulotlar", async () => {
    const flagship = (await getProductBySlug("iphone-15-pro-max"))!;
    const bundle = await getBundleProducts(flagship);
    assert.deepEqual(
      bundle.map((p) => p.slug),
      flagship.bundleIds,
    );

    const a55 = (await getProductBySlug("samsung-galaxy-a55"))!;
    const heuristic = await getBundleProducts(a55);
    assert.ok(heuristic.length > 0, "telefon uchun aksessuar topilmadi");

    const laptop = (await getProductBySlug("hp-pavilion-15"))!;
    assert.deepEqual(await getBundleProducts(laptop), []);
  });

  section("Narx va variant mantiqi");

  await check("chegirma foizi", () => {
    assert.equal(getDiscountPercent(14_500_000, 15_000_000), 3);
    assert.equal(getDiscountPercent(100, 100), 0);
    assert.equal(getDiscountPercent(100, undefined), 0);
    assert.equal(getDiscountPercent(200, 100), 0);
  });

  await check("iPhone 15 Pro Max: boshlang‘ich variant — eng arzon mavjud yangi", async () => {
    const product = (await getProductBySlug("iphone-15-pro-max"))!;
    const variant = getDefaultVariant(product);
    assert.equal(variant.condition, "new");
    assert.equal(variant.storage, "256GB");
    assert.equal(variant.price, 14_500_000);
    const info = getPriceInfo(product);
    assert.equal(info.discountPercent, 3);
    assert.equal(info.oldPrice, 15_000_000);
    assert.equal(getShortSpec(product), "256 GB · Natural Titanium");
  });

  await check("ishlatilgan variant narxi boshlang‘ich narx bo‘lib qolmaydi", async () => {
    const product = (await getProductBySlug("iphone-13"))!;
    assert.equal(getDefaultVariant(product).condition, "new");
    assert.equal(getDefaultVariant(product).price, 7_300_000);
  });

  await check("faqat ishlatilgan mahsulotda boshlang‘ich variant ishlatilgan", async () => {
    const product = (await getProductBySlug("macbook-air-m1-ishlatilgan"))!;
    assert.equal(getDefaultVariant(product).condition, "used");
  });

  await check("chegirma faqat qimmatroq variantda bo‘lsa ham, boshlang‘ich variant o‘shani ko‘rsatadi", async () => {
    // Redmi Note 13: eng arzon variant (128GB/6GB) chegirmasiz, 256GB/8GB esa chegirmali.
    // Aks holda mahsulot getSaleProducts()'da chiqadi-yu, kartada chegirma ko‘rinmay qoladi.
    for (const slug of ["redmi-note-13", "hp-pavilion-15", "acer-aspire-5", "macbook-pro-m3-pro"]) {
      const product = (await getProductBySlug(slug))!;
      assert.ok(hasDiscount(product), `${slug}: chegirmali variant kutilgan edi`);
      assert.ok(getPriceInfo(product).hasDiscount, `${slug}: boshlang‘ich variantda chegirma ko‘rinmayapti`);
    }
  });

  await check("hasDiscount(product) bo‘lsa, kartada ko‘rinadigan narx ham chegirmali (sistemali)", async () => {
    for (const product of await getAllProducts()) {
      if (hasDiscount(product)) {
        assert.ok(getPriceInfo(product).hasDiscount, `${product.slug}: kartada chegirma ko‘rinmaydi`);
      }
    }
  });

  await check("oldindan buyurtma holati", async () => {
    const product = (await getProductBySlug("iphone-16-pro-max"))!;
    const preorder = product.variants.find((v) => v.storage === "1TB")!;
    assert.equal(getVariantStockStatus(preorder), "preorder");
  });

  await check("Telegram uchun variant matni", async () => {
    const product = (await getProductBySlug("iphone-15-pro-max"))!;
    assert.equal(describeVariantForOrder(product, getDefaultVariant(product)), "Natural Titanium / 256 GB");
    assert.equal(describeVariantForOrder(product, null), "tanlanmagan / tanlanmagan");
    const watch = (await getProductBySlug("apple-watch-series-9"))!;
    assert.equal(describeVariantForOrder(watch, watch.variants[0]), "Midnight / 41 mm");
    const cable = (await getProductBySlug("ugreen-micro-usb-kabel"))!;
    assert.equal(describeVariantForOrder(cable, cable.variants[0]), "Black");
    const used = (await getProductBySlug("macbook-air-m1-ishlatilgan"))!;
    assert.match(describeVariantForOrder(used, used.variants[0])!, /Ishlatilgan/);
  });

  section("Formatlash");

  await check("formatPrice", () => {
    assert.equal(formatPrice(14_500_000), `14${NBSP}500${NBSP}000${NBSP}so‘m`);
    assert.equal(formatPrice(0), `0${NBSP}so‘m`);
    assert.equal(formatPrice(999), `999${NBSP}so‘m`);
    assert.equal(formatPrice(Number.NaN), "—");
    assert.equal(formatNumber(1_234), `1${NBSP}234`);
  });

  await check("formatDiscount, formatStorage, formatDate", () => {
    assert.equal(formatDiscount(3), "-3%");
    assert.equal(formatStorage("256GB"), "256 GB");
    assert.equal(formatStorage("1TB"), "1 TB");
    assert.equal(formatStorage("Natural"), "Natural");
    assert.equal(formatDate("2026-09-21T10:00:00.000Z"), "21 sentabr 2026");
    assert.equal(formatDate("xato"), "—");
  });

  await check("telefon raqami", () => {
    assert.equal(normalizeUzPhone("90 123 45 67"), "+998901234567");
    assert.equal(normalizeUzPhone("+998 90 123-45-67"), "+998901234567");
    assert.equal(normalizeUzPhone("998901234567"), "+998901234567");
    assert.equal(normalizeUzPhone("12345"), null);
    assert.equal(normalizeUzPhone("+7 900 123 45 67"), null);
    assert.equal(normalizeUzPhone("012345678"), null);
    assert.equal(formatUzPhone("+998901234567"), "+998 90 123 45 67");
  });

  section("Telegram");

  await check("buyurtma xabari", () => {
    const message = buildOrderMessage({
      orderId: "QP-000123",
      productName: "iPhone 15 Pro Max",
      variantText: "Natural Titanium / 256 GB",
      price: 14_500_000,
      productUrl: "https://example.uz/mahsulot/iphone-15-pro-max?v=x",
    });
    assert.ok(message.startsWith("Assalomu alaykum. Men Zamon Store saytidan quyidagi mahsulotga qiziqyapman:"));
    assert.ok(message.includes("Buyurtma: #QP-000123"));
    assert.ok(message.includes("Mahsulot: iPhone 15 Pro Max"));
    assert.ok(message.includes("Variant: Natural Titanium / 256 GB"));
    assert.ok(message.includes(`Narx: 14${NBSP}500${NBSP}000${NBSP}so‘m`));
    assert.ok(message.includes("Havola: https://example.uz/mahsulot/iphone-15-pro-max?v=x"));
    assert.ok(message.endsWith("Narxi va mavjudligini tasdiqlab bera olasizmi?"));
  });

  await check("variantsiz mahsulotda «Variant» qatori chiqmaydi", () => {
    const message = buildOrderMessage({
      productName: "Kabel",
      variantText: null,
      price: 45_000,
      productUrl: "https://example.uz/mahsulot/x",
    });
    assert.ok(!message.includes("Variant:"));
    assert.ok(!message.includes("Buyurtma:"));
  });

  await check("deep link", () => {
    assert.equal(createTelegramLink("@zamon"), "https://t.me/zamon");
    const link = createTelegramLink("zamon", "Salom\nDunyo & co");
    assert.equal(link, "https://t.me/zamon?text=Salom%0ADunyo%20%26%20co");
    assert.equal(escapeTelegramHtml("<b>&</b>"), "&lt;b&gt;&amp;&lt;/b&gt;");
  });

  await check("URL yordamchilari", () => {
    assert.equal(productHref("a"), "/mahsulot/a");
    assert.equal(productHref("a", "a-256gb"), "/mahsulot/a?v=a-256gb");
    assert.equal(absoluteUrl("/x"), "http://localhost:3000/x");
  });

  section("Katalog: filter holatini o‘qish (parseFilters)");

  await check("ko‘p qiymat, saralash va sahifa to‘g‘ri o‘qiladi", () => {
    const state = parseFilters({ brend: "apple,samsung", saralash: "arzon", sahifa: "3" }, FX_FIELDS);
    assert.deepEqual(state.values.brend, ["apple", "samsung"]);
    assert.equal(state.sort, "arzon");
    assert.equal(state.page, 3);
  });

  await check("noto‘g‘ri saralash/sahifa xatoga olib kelmaydi, defaultga qaytadi", () => {
    const state = parseFilters({ saralash: "xato-qiymat", sahifa: "-5" }, FX_FIELDS);
    assert.equal(state.sort, "tavsiya");
    assert.equal(state.page, 1);
  });

  await check("narx_min narx_max dan katta bo‘lsa, ikkalasi ham max bilan tenglashadi", () => {
    const state = parseFilters({ narx_min: "2000000", narx_max: "1000000" }, FX_FIELDS);
    assert.equal(state.priceMin, 1_000_000);
    assert.equal(state.priceMax, 1_000_000);
  });

  await check("mavjud/chegirma faqat aniq “1” qiymatida yoqiladi", () => {
    assert.equal(parseFilters({ mavjud: "1" }, FX_FIELDS).onlyAvailable, true);
    assert.equal(parseFilters({ mavjud: "0" }, FX_FIELDS).onlyAvailable, false);
    assert.equal(parseFilters({}, FX_FIELDS).onlyDiscount, false);
  });

  section("Katalog: filterlash (applyFilters)");

  await check("bir maydon ichida OR, maydonlar orasida AND", () => {
    const state = parseFilters({ brend: "apple", rang: "Black" }, FX_FIELDS);
    const result = applyFilters(fixtureProducts, state, FX_FIELDS);
    assert.deepEqual(result.map((p) => p.id), ["fx-a"]);
  });

  await check("variant maydoni: istalgan variantda mos qiymat bo‘lsa yetarli", () => {
    const state = parseFilters({ xotira: "512GB" }, FX_FIELDS);
    const result = applyFilters(fixtureProducts, state, FX_FIELDS);
    assert.deepEqual(result.map((p) => p.id), ["fx-a"]);
  });

  await check("narx oralig‘i: istalgan variant narxi mos kelsa yetarli", () => {
    const state = parseFilters({ narx_min: "800000", narx_max: "950000" }, FX_FIELDS);
    const result = applyFilters(fixtureProducts, state, FX_FIELDS);
    assert.deepEqual(result.map((p) => p.id), ["fx-b"]);
  });

  await check("faqat mavjud mahsulotlar", () => {
    const state = parseFilters({ mavjud: "1" }, FX_FIELDS);
    const result = applyFilters(fixtureProducts, state, FX_FIELDS);
    assert.ok(!result.some((p) => p.id === "fx-c"));
  });

  await check("faqat chegirmadagilar", () => {
    const state = parseFilters({ chegirma: "1" }, FX_FIELDS);
    const result = applyFilters(fixtureProducts, state, FX_FIELDS);
    assert.deepEqual(result.map((p) => p.id), ["fx-a"]);
  });

  await check("exceptKey o‘z filtrini o‘tkazib yuboradi (faceting uchun)", () => {
    const state = parseFilters({ brend: "apple" }, FX_FIELDS);
    const withBrand = applyFilters(fixtureProducts, state, FX_FIELDS);
    const withoutBrand = applyFilters(fixtureProducts, state, FX_FIELDS, { exceptKey: "brend" });
    assert.equal(withBrand.length, 2);
    assert.equal(withoutBrand.length, 3);
  });

  section("Katalog: saralash (sortProducts)");

  await check("arzon/qimmat — eng arzon variant narxiga qarab", () => {
    assert.deepEqual(sortProducts(fixtureProducts, "arzon").map((p) => p.id), ["fx-c", "fx-b", "fx-a"]);
    assert.deepEqual(sortProducts(fixtureProducts, "qimmat").map((p) => p.id), ["fx-a", "fx-b", "fx-c"]);
  });

  await check("yangi — createdAt bo‘yicha kamayish tartibida", () => {
    assert.deepEqual(sortProducts(fixtureProducts, "yangi").map((p) => p.id), ["fx-c", "fx-a", "fx-b"]);
  });

  await check("mashhur — popularity bo‘yicha", () => {
    assert.deepEqual(sortProducts(fixtureProducts, "mashhur").map((p) => p.id), ["fx-a", "fx-c", "fx-b"]);
  });

  await check("tavsiya — avval featured, keyin popularity", () => {
    assert.deepEqual(sortProducts(fixtureProducts, "tavsiya").map((p) => p.id), ["fx-a", "fx-c", "fx-b"]);
  });

  await check("chegirma — eng katta chegirma birinchi", () => {
    assert.equal(sortProducts(fixtureProducts, "chegirma").map((p) => p.id)[0], "fx-a");
  });

  section("Katalog: sahifalash va facet");

  await check("paginate: oddiy sahifa va oxirgi sahifaga qisqartirish", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const p1 = paginate(items, 1, 12);
    assert.equal(p1.items.length, 12);
    assert.equal(p1.totalPages, 3);
    const overflow = paginate(items, 99, 12);
    assert.equal(overflow.page, 3);
    assert.equal(overflow.items.length, 1);
    assert.equal(paginate([], 1, 12).totalPages, 1);
  });

  await check("getFacets: boshqa filterlar hisobga olinadi, o‘zi hisobga olinmaydi", () => {
    const field = FX_FIELDS.find((f) => f.key === "rang")!;
    const state = parseFilters({}, FX_FIELDS);
    const facets = getFacets(fixtureProducts, field, state, FX_FIELDS);
    assert.deepEqual(facets, [
      { value: "Black", count: 1 },
      { value: "White", count: 2 },
    ]);
  });

  await check("getFacets: `order` bo‘yicha tartiblanadi", () => {
    const field = FX_FIELDS.find((f) => f.key === "xotira")!;
    const state = parseFilters({}, FX_FIELDS);
    const facets = getFacets(fixtureProducts, field, state, FX_FIELDS);
    assert.deepEqual(
      facets.map((f) => f.value),
      ["128GB", "256GB", "512GB"],
    );
  });

  await check("getPriceBounds", () => {
    assert.deepEqual(getPriceBounds(fixtureProducts), { min: 500_000, max: 1_200_000 });
    assert.deepEqual(getPriceBounds([]), { min: 0, max: 0 });
  });

  section("Katalog: URL yordamchilari");

  await check("hrefToggleValue: qo‘shish va o‘chirish, sahifa 1-ga qaytadi", () => {
    const sp = new URLSearchParams("brend=apple&sahifa=3");
    assert.equal(hrefToggleValue("/katalog", sp, "brend", "samsung"), "/katalog?brend=apple%2Csamsung");
    const removed = hrefToggleValue("/katalog", new URLSearchParams("brend=apple%2Csamsung"), "brend", "apple");
    assert.equal(removed, "/katalog?brend=samsung");
  });

  await check("hrefSetPage: 1-sahifa parametrsiz yoziladi", () => {
    const sp = new URLSearchParams("brend=apple");
    assert.equal(hrefSetPage("/katalog", sp, 1), "/katalog?brend=apple");
    assert.equal(hrefSetPage("/katalog", sp, 2), "/katalog?brend=apple&sahifa=2");
  });

  await check("toSearchParams va nonPriceEntries", () => {
    const sp = toSearchParams({ brend: "apple", narx_min: "100", sahifa: "2" });
    assert.equal(sp.get("brend"), "apple");
    assert.deepEqual(nonPriceEntries(sp), [["brend", "apple"]]);
  });

  section("Katalog: kategoriya bo‘yicha filter konfiguratsiyasi (haqiqiy ma’lumot)");

  await check("telefon, chexol va zaryadchik uchun to‘g‘ri maxsus maydonlar", async () => {
    const iphone = await getCategoryByPath(["telefonlar", "iphone"]);
    const iphoneRoot = await getRootCategoryId(iphone!.id);
    const phoneFields = getFilterFields(iphoneRoot, iphone!.id);
    assert.ok(phoneFields.some((f) => f.key === "xotira"));
    assert.ok(phoneFields.some((f) => f.key === "sim"));

    const chexol = await getCategoryByPath(["aksessuarlar", "chexollar"]);
    const chexolRoot = await getRootCategoryId(chexol!.id);
    const chexolFields = getFilterFields(chexolRoot, chexol!.id);
    assert.ok(chexolFields.some((f) => f.key === "material"));

    const adapter = await getCategoryByPath(["aksessuarlar", "zaryadchiklar", "adapterlar"]);
    const adapterRoot = await getRootCategoryId(adapter!.id);
    const adapterFields = getFilterFields(adapterRoot, adapter!.id);
    assert.ok(adapterFields.some((f) => f.key === "quvvat"));
    assert.ok(adapterFields.some((f) => f.key === "port"));

    const macbook = await getCategoryByPath(["laptoplar", "macbook"]);
    const macbookRoot = await getRootCategoryId(macbook!.id);
    const laptopFields = getFilterFields(macbookRoot, macbook!.id);
    assert.ok(laptopFields.some((f) => f.key === "protsessor"));
    assert.ok(laptopFields.some((f) => f.key === "ekran"));
  });

  await check("iPhone kategoriyasida xotira filtri va arzon saralash haqiqiy ma’lumotda ishlaydi", async () => {
    const category = await getCategoryByPath(["telefonlar", "iphone"]);
    const products = await getProductsByCategory(category!.id);
    const state = parseFilters({ xotira: "256GB", saralash: "arzon" }, PHONE_FILTERS);
    const filtered = applyFilters(products, state, PHONE_FILTERS);
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every((p) => p.variants.some((v) => v.storage === "256GB")));

    const sorted = sortProducts(filtered, state.sort);
    for (let i = 1; i < sorted.length; i++) {
      const prevMin = Math.min(...sorted[i - 1]!.variants.map((v) => v.price));
      const curMin = Math.min(...sorted[i]!.variants.map((v) => v.price));
      assert.ok(prevMin <= curMin, `saralash buzilgan: ${sorted[i - 1]!.slug} → ${sorted[i]!.slug}`);
    }
  });

  await check("har bir brendda kamida bitta mahsulot bor (brend sahifasi bo‘sh qolmasin)", async () => {
    for (const brand of await getBrands()) {
      const products = await getProductsByBrand(brand.id);
      assert.ok(products.length > 0, `bo‘sh brend: ${brand.slug}`);
    }
  });

  section("Mahsulot sahifasi: variant o‘qlari (getVariantAxes / getAxisValues)");

  await check("faqat haqiqatan o‘zgaruvchan o‘qlar aniqlanadi", () => {
    const axes = getVariantAxes(fxVNew);
    assert.deepEqual([...axes].sort(), ["color", "storage"]);
  });

  await check("bitta variantli to‘plamda hech qanday o‘q yo‘q", () => {
    assert.deepEqual(getVariantAxes(fxVUsed), []);
  });

  await check("getAxisValues — birinchi uchragan tartibda, takrorsiz", () => {
    assert.deepEqual(getAxisValues(fxVNew, "color"), ["Black", "White", "Red"]);
    assert.deepEqual(getAxisValues(fxVNew, "storage"), ["128GB", "256GB", "512GB"]);
  });

  section("Mahsulot sahifasi: variant tanlash (resolveVariant)");

  await check("barcha o‘qlar mos kelganda aniq variant topiladi", () => {
    assert.equal(resolveVariant(fxVNew, { color: "Black", storage: "256GB" }).id, "fv-2");
    assert.equal(resolveVariant(fxVNew, { color: "White", storage: "128GB" }).id, "fv-3");
  });

  await check("faqat bitta o‘q tanlansa, teng ballilar orasida eng arzoni", () => {
    // White + (128 yoki 256): ikkalasi ham color bo‘yicha mos (score=1), eng arzoni fv-3 (105).
    assert.equal(resolveVariant(fxVNew, { color: "White" }).id, "fv-3");
  });

  await check("tanlov bo‘sh bo‘lsa, eng arzon variant qaytadi", () => {
    assert.equal(resolveVariant(fxVNew, {}).id, "fv-1");
  });

  await check("variantToSelection — har 4 o‘q ham (bo‘lmasa undefined) qaytadi", () => {
    assert.deepEqual(variantToSelection(fxVNew[1]!), {
      color: "Black",
      storage: "256GB",
      ram: undefined,
      size: undefined,
    });
  });

  await check("isAxisValueAvailable — mavjud va mavjud bo‘lmagan kombinatsiya", () => {
    // fv-6 faqat Red+512GB: Red tanlansa 128GB o‘chirilgan (mavjud emas) bo‘lishi kerak.
    assert.equal(isAxisValueAvailable(fxVNew, { color: "Red" }, "storage", "512GB"), true);
    assert.equal(isAxisValueAvailable(fxVNew, { color: "Red" }, "storage", "128GB"), false);
    assert.equal(isAxisValueAvailable(fxVNew, { storage: "128GB" }, "color", "Black"), true);
    assert.equal(isAxisValueAvailable(fxVNew, { storage: "128GB" }, "color", "Red"), false);
  });

  await check("boshqa o‘qlar tanlanmagan bo‘lsa, hamma qiymat mavjud hisoblanadi", () => {
    assert.equal(isAxisValueAvailable(fxVNew, {}, "color", "Red"), true);
  });

  await check("haqiqiy mahsulotda (iPhone 15 Pro Max) variant almashtirish ishlaydi", async () => {
    const product = (await getProductBySlug("iphone-15-pro-max"))!;
    const pool = product.variants.filter((v) => v.condition === "new");
    const axes = getVariantAxes(pool);
    assert.deepEqual([...axes].sort(), ["color", "storage"]);

    const start = getDefaultVariant(product);
    const selection = variantToSelection(start);
    const resized = resolveVariant(pool, { ...selection, storage: "512GB" });
    assert.equal(resized.storage, "512GB");
    assert.equal(resized.color, start.color, "rang saqlanib qolishi kerak");
  });

  section("Qidiruv indeksi: sinonimlarni kengaytirish (expandSearchQuery)");

  await check("bitta so‘zli sinonim guruhi to‘liq qo‘shiladi", () => {
    const expanded = expandSearchQuery("zaryadchik").split(" ");
    assert.ok(expanded.includes("zaryadchik"));
    assert.ok(expanded.includes("adapter"));
    assert.ok(expanded.includes("charger"));
  });

  await check("ko‘p so‘zli so‘rovda faqat tegishli so‘z kengaytiriladi", () => {
    const expanded = new Set(expandSearchQuery("qora chexol").split(" "));
    assert.ok(expanded.has("qora"));
    // normalizeText x→h qiladi (chexol=chehol), shuning uchun token "chehol" bo‘ladi.
    assert.ok(expanded.has(normalizeText("chexol")));
    assert.ok(expanded.has(normalizeText("case")));
  });

  await check("sinonimi yo‘q so‘z o‘zgarishsiz qoladi", () => {
    assert.equal(expandSearchQuery("noyob123"), "noyob 123");
  });

  section("Qidiruv indeksi: MiniSearch (fixture)");

  await check("nom, prefiks va typo (fuzzy) bo‘yicha topadi", () => {
    const products = [fxA, fxB, fxC].map((p, i) => ({ ...p, name: ["Alpha Phone", "Beta Watch", "Gamma Case"][i] }));
    const engine = createSearchEngine(products, new Map(), new Map());
    assert.equal(engine.search("Alpha")[0]?.product.name, "Alpha Phone");
    assert.equal(engine.search("Alp")[0]?.product.name, "Alpha Phone", "prefiks bo‘yicha topmadi");
    // Bitta harf xato (odatiy bosish xatosi) — 2+ harfli farq (masalan "Alfa") fuzzy:0.2 bilan topilmaydi, bu kutilgan.
    assert.equal(engine.search("Alphq")[0]?.product.name, "Alpha Phone", "typo'ga chidamli emas (fuzzy)");
  });

  await check("bo‘sh so‘rov bo‘sh natija qaytaradi", () => {
    const engine = createSearchEngine([fxA], new Map(), new Map());
    assert.deepEqual(engine.search("   "), []);
  });

  await check("brend va kategoriya nomi bo‘yicha ham topadi", () => {
    const product = { ...fxA, brandId: "brandx", categoryId: "catx" };
    const brandsMap = new Map([["brandx", { id: "brandx", name: "SuperBrand", slug: "superbrand", description: "" }]]);
    const categoriesMap = new Map([["catx", { id: "catx", name: "Quloqchinlar", slug: "q", description: "", parentId: null, sortOrder: 0 }]]);
    const engine = createSearchEngine([product], brandsMap, categoriesMap);
    assert.equal(engine.search("SuperBrand").length, 1);
    assert.equal(engine.search("quloqchin").length, 1);
  });

  section("Qidiruv indeksi: haqiqiy ma’lumotda promptdagi misollar");

  const expectSearchTop = async (query: string, expectedSlug: string) => {
    const hits = await searchProducts(query);
    assert.ok(hits.length > 0, `«${query}» uchun natija yo‘q`);
    assert.equal(hits[0]!.product.slug, expectedSlug, `«${query}» → kutilgan: ${expectedSlug}, keldi: ${hits[0]!.product.slug}`);
  };

  await check("«iphone 15» → iPhone 15", async () => {
    await expectSearchTop("iphone 15", "iphone-15");
  });

  await check("«samsung s24» → Samsung Galaxy S24", async () => {
    await expectSearchTop("samsung s24", "samsung-galaxy-s24");
  });

  await check("«airpods» → AirPods Pro (eng mashhur)", async () => {
    const hits = await searchProducts("airpods");
    assert.ok(hits.some((h) => h.product.slug.startsWith("apple-airpods")), "AirPods natijalarda yo‘q");
  });

  await check("«type c» → Type-C aksessuarlar topiladi", async () => {
    const hits = await searchProducts("type c");
    assert.ok(hits.length > 0, "natija yo‘q");
    assert.ok(
      hits.some((h) => h.product.keywords.some((k) => normalizeText(k).includes("type c"))),
      "type c kalit so‘zli mahsulot topilmadi",
    );
  });

  await check("«redmi» → eng tepada Redmi/Xiaomi telefonlari", async () => {
    const hits = await searchProducts("redmi");
    const xiaomiHits = hits.filter((h) => h.product.brandId === "xiaomi");
    assert.ok(xiaomiHits.length >= 3, `redmi/xiaomi natijalari kam: ${xiaomiHits.length}`);
    assert.equal(hits[0]!.product.brandId, "xiaomi", "eng tepadagi natija Redmi/Xiaomi emas");
    // "redmi"ga mos aksessuar (masalan Baseus'ning Redmi Note 13 chexoli) ham chiqishi mumkin — bu to‘g‘ri.
  });

  await check("«zaryadchik» → adapterlar sinonim orqali topiladi", async () => {
    const hits = await searchProducts("zaryadchik");
    assert.ok(hits.some((h) => h.product.categoryId.includes("zaryadchiklar")), "zaryadchik natijalari yo‘q");
  });

  await check("«macbook» → MacBook'lar", async () => {
    const hits = await searchProducts("macbook");
    assert.ok(hits.length >= 3, `macbook natijalari kam: ${hits.length}`);
    assert.ok(hits.every((h) => h.product.categoryId === "laptoplar-macbook"));
  });

  await check("«чехол» (kirill) → chexollar", async () => {
    const hits = await searchProducts("чехол");
    assert.ok(hits.length > 0, "kirill so‘rovda natija yo‘q");
    assert.ok(hits.every((h) => h.product.categoryId.includes("chexollar")));
  });

  await check("«iPhone15» (bo‘shliqsiz) ham topadi", async () => {
    const hits = await searchProducts("iPhone15");
    assert.ok(hits.some((h) => h.product.slug === "iphone-15"), "bo‘shliqsiz so‘rov ishlamadi");
  });

  await check("xato yozuvga chidamli: «samsng» ham Samsung topadi", async () => {
    const hits = await searchProducts("samsng");
    assert.ok(hits.some((h) => h.product.brandId === "samsung"), "fuzzy qidiruv ishlamadi");
  });

  section("Buyurtma: rate-limit (checkRateLimit)");

  await check("belgilangan limitgacha ruxsat beradi, keyin rad etadi", () => {
    const key = `test-${Date.now()}-a`;
    assert.equal(checkRateLimit(key, 3, 60_000).allowed, true);
    assert.equal(checkRateLimit(key, 3, 60_000).allowed, true);
    assert.equal(checkRateLimit(key, 3, 60_000).allowed, true);
    const fourth = checkRateLimit(key, 3, 60_000);
    assert.equal(fourth.allowed, false);
    assert.ok(fourth.retryAfterMs !== undefined && fourth.retryAfterMs > 0);
  });

  await check("turli kalitlar bir-biriga ta’sir qilmaydi", () => {
    const a = `test-${Date.now()}-b1`;
    const b = `test-${Date.now()}-b2`;
    checkRateLimit(a, 1, 60_000);
    assert.equal(checkRateLimit(a, 1, 60_000).allowed, false, "a limitga yetgan");
    assert.equal(checkRateLimit(b, 1, 60_000).allowed, true, "b hali ruxsat etilishi kerak");
  });

  await check("oyna muddati o‘tgach hisob qayta boshlanadi", async () => {
    const key = `test-${Date.now()}-c`;
    assert.equal(checkRateLimit(key, 1, 20).allowed, true);
    assert.equal(checkRateLimit(key, 1, 20).allowed, false, "oyna ichida rad etilishi kerak edi");
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(checkRateLimit(key, 1, 20).allowed, true, "oyna o‘tgach qayta ruxsat berilishi kerak edi");
  });

  section("SEO: mahsulot JSON-LD");

  await check("toJsonLd XSS'ga qarshi `<` belgisini escape qiladi", () => {
    // Faqat `<` escape qilinsa kifoya — `</script>` orqali chiqib ketish shu bilan bloklanadi (`>` shart emas).
    const json = toJsonLd({ x: "<script>alert(1)</script>" });
    assert.ok(!json.includes("<script"), json);
    assert.ok(json.includes("\\u003cscript>alert(1)\\u003c/script>"), json);
  });

  await check("buildProductJsonLd — to‘g‘ri shakl va UZS narx", async () => {
    const product = (await getProductBySlug("iphone-15-pro-max"))!;
    const brand = await getBrandById(product.brandId);
    const jsonLd = buildProductJsonLd(product, brand) as {
      "@type": string;
      name: string;
      brand?: { name: string };
      offers: { "@type": string; priceCurrency: string; lowPrice: number; highPrice: number; availability: string };
    };
    assert.equal(jsonLd["@type"], "Product");
    assert.equal(jsonLd.name, product.name);
    assert.equal(jsonLd.brand?.name, "Apple");
    assert.equal(jsonLd.offers["@type"], "AggregateOffer");
    assert.equal(jsonLd.offers.priceCurrency, "UZS");
    assert.ok(jsonLd.offers.lowPrice <= jsonLd.offers.highPrice);
    assert.ok(
      jsonLd.offers.availability === "https://schema.org/InStock" ||
        jsonLd.offers.availability === "https://schema.org/OutOfStock",
    );
  });

  await check("buildProductJsonLd — brendsiz mahsulotda `brand` maydoni yo‘q", () => {
    assert.equal((buildProductJsonLd(fxV, null) as { brand?: unknown }).brand, undefined);
  });

  await check("buildBreadcrumbJsonLd — to‘g‘ri tartib va to‘liq URL'lar", () => {
    const jsonLd = buildBreadcrumbJsonLd(
      [
        { label: "Bosh sahifa", href: "/" },
        { label: "Telefonlar", href: "/katalog/telefonlar" },
        { label: "iPhone 15" },
      ],
      "/mahsulot/iphone-15",
    ) as { "@type": string; itemListElement: Array<{ position: number; name: string; item: string }> };

    assert.equal(jsonLd["@type"], "BreadcrumbList");
    assert.equal(jsonLd.itemListElement.length, 3);
    assert.equal(jsonLd.itemListElement[0]?.position, 1);
    assert.equal(jsonLd.itemListElement[1]?.name, "Telefonlar");
    assert.ok(jsonLd.itemListElement[1]?.item.endsWith("/katalog/telefonlar"));
    // Oxirgi elementda `href` yo‘q — joriy sahifaning o‘z URL'i ishlatilishi kerak.
    assert.ok(jsonLd.itemListElement[2]?.item.endsWith("/mahsulot/iphone-15"));
  });

  section("Qidiruv normalizatsiyasi");

  await check("apostrof va o‘/g‘ variantlari bir xil", () => {
    const variants = ["o'zbek", "o‘zbek", "oʻzbek", "o’zbek", "O`zbek"];
    for (const v of variants) assert.equal(normalizeText(v), "ozbek", v);
  });

  await check("kirill → lotin", () => {
    assert.equal(normalizeText("Чехол"), normalizeText("chexol"));
    assert.equal(normalizeText("зарядка"), "zaryadka");
    assert.equal(normalizeText("Ноутбук"), "noutbuk");
    assert.equal(normalizeText("Айфон"), "ayfon");
    assert.equal(normalizeText("Ўзбек"), "ozbek");
    assert.equal(normalizeText("Наушники"), "naushniki");
  });

  await check("harf/raqam chegarasi va tinish belgilari", () => {
    assert.equal(normalizeText("iPhone15"), "iphone 15");
    assert.equal(normalizeText("256GB"), "256 gb");
    assert.equal(normalizeText("Type-C  kabel"), "type c kabel");
    assert.equal(normalizeText("USB-C"), "usb c");
    assert.equal(normalizeText("s24"), "s 24");
    assert.equal(normalizeText("  "), "");
    assert.deepEqual(tokenize("Samsung S24 Ultra"), ["samsung", "s", "24", "ultra"]);
    assert.deepEqual(tokenize(""), []);
  });

  await check("x/h birlashadi (chexol = chehol, xiaomi = hiaomi)", () => {
    assert.equal(normalizeText("chexol"), normalizeText("chehol"));
    assert.equal(normalizeText("Xiaomi"), normalizeText("hiaomi"));
  });

  await check("mahsulot nomi va so‘rov bir xil tokenlarga tushadi", () => {
    const productTokens = new Set(tokenize("Samsung Galaxy S24 Ultra"));
    for (const t of tokenize("samsung s24")) assert.ok(productTokens.has(t), t);
    const iphoneTokens = new Set(tokenize("iPhone 15 Pro Max 256 GB"));
    for (const t of tokenize("iphone15 256gb")) assert.ok(iphoneTokens.has(t), t);
  });

  await check("sinonim guruhlari normalizatsiyadan keyin ham bo‘sh emas", () => {
    for (const group of SYNONYM_GROUPS) {
      assert.ok(group.length >= 2);
      for (const term of group) assert.ok(normalizeText(term).length > 0, term);
    }
  });

  section("Admin: mahsulotlar ro‘yxati va baza qatori");

  const adminRows = [
    makeProduct({
      id: "a-phone",
      name: "Alpha Phone",
      createdAt: "2026-03-01T00:00:00.000Z",
      variants: [
        makeVariant({ id: "a1", sku: "ALP-128", price: 5_000_000, oldPrice: 6_000_000, stock: 2 }),
        makeVariant({ id: "a2", price: 7_000_000, stock: 0 }),
      ],
    }),
    makeProduct({
      id: "b-phone",
      name: "Beta Phone",
      brandId: "brandy",
      createdAt: "2026-02-01T00:00:00.000Z",
      variants: [makeVariant({ id: "b1", price: 3_000_000, stock: 0 })],
    }),
    makeProduct({
      id: "c-case",
      name: "Gamma g‘ilof",
      isPublished: false,
      variants: [makeVariant({ id: "c1", price: 100_000, stock: 40 })],
    }),
  ].map(toAdminRow);
  const adminQuery: AdminListQuery = { q: "", status: "hammasi", categoryIds: null, brandId: null, sort: "yangi" };
  const adminIds = (patch: Partial<AdminListQuery>) =>
    filterAdminRows(adminRows, { ...adminQuery, ...patch }).map((row) => row.product.id);

  await check("toAdminRow: narx oralig‘i, jami qoldiq, chegirma", () => {
    const row = adminRows[0]!;
    assert.equal(row.minPrice, 5_000_000);
    assert.equal(row.maxPrice, 7_000_000);
    assert.equal(row.totalStock, 2);
    assert.equal(row.variantCount, 2);
    assert.equal(row.stockStatus, "low");
    assert.equal(adminRows[2]!.stockStatus, "in_stock");
    assert.ok(row.maxDiscount > 0);
  });

  await check("countByStatus: saytda / yashirin / kam / tugagan / chegirma", () => {
    assert.deepEqual(countByStatus(adminRows), { hammasi: 3, saytda: 2, yashirin: 1, kam: 1, tugagan: 1, chegirma: 1 });
  });

  await check("filterAdminRows: holat, brend, kategoriya, qidiruv (SKU, o‘/g‘ farqisiz)", () => {
    assert.deepEqual(adminIds({ status: "tugagan" }), ["b-phone"]);
    assert.deepEqual(adminIds({ status: "yashirin" }), ["c-case"]);
    assert.deepEqual(adminIds({ brandId: "brandy" }), ["b-phone"]);
    assert.deepEqual(adminIds({ q: "alp-128" }), ["a-phone"]);
    assert.deepEqual(adminIds({ q: "gilof" }), ["c-case"]);
    assert.deepEqual(adminIds({ categoryIds: new Set(["boshqa"]) }), []);
  });

  await check("filterAdminRows: saralash va noto‘g‘ri parametrlar", () => {
    assert.deepEqual(adminIds({ sort: "yangi" }), ["a-phone", "b-phone", "c-case"]);
    assert.deepEqual(adminIds({ sort: "narx-osish" }), ["c-case", "b-phone", "a-phone"]);
    assert.deepEqual(adminIds({ sort: "qoldiq" }), ["b-phone", "a-phone", "c-case"]);
    assert.equal(parseSort("yoq"), "yangi");
    assert.equal(parseStatus("yoq"), "hammasi");
  });

  await check("productToRow → rowToProduct: barcha mahsulotlar o‘zgarmay qaytadi va sxemadan o‘tadi", () => {
    for (const product of allProducts) {
      const back = rowToProduct(JSON.parse(JSON.stringify(productToRow(product))));
      assert.deepEqual(JSON.parse(JSON.stringify(back)), JSON.parse(JSON.stringify(product)), product.slug);
      const parsed = productSchema.safeParse(product);
      assert.ok(parsed.success, `${product.slug}: ${parsed.success ? "" : parsed.error.issues[0]?.message}`);
    }
  });

  await check("productSchema: noto‘g‘ri ma’lumot rad etiladi", () => {
    const good = allProducts[0]!;
    const accepts = (patch: Partial<Product>) => productSchema.safeParse({ ...good, ...patch }).success;
    assert.equal(accepts({}), true);
    assert.equal(accepts({ id: "Katta Harf", slug: "Katta Harf" }), false);
    assert.equal(accepts({ name: "" }), false);
    assert.equal(accepts({ variants: [] }), false);
    assert.equal(accepts({ variants: [{ ...good.variants[0]!, price: -1 }] }), false);
    assert.equal(accepts({ variants: [good.variants[0]!, good.variants[0]!] }), false);
  });

  section("Admin: mahsulot formasi");

  const rootOf = (categoryId: string) => getRootId(categoryId, categories);

  await check("slugify: o‘zbekcha, kirill, belgilar", () => {
    assert.equal(slugify("iPhone 15 Pro Max"), "iphone-15-pro-max");
    assert.equal(slugify("G‘ilof «Shaffof» (o‘zbek)"), "gilof-shaffof-ozbek");
    assert.equal(slugify("Телефон Самсунг"), "telefon-samsung");
    assert.equal(slugify("  --Xiaomi  14--  "), "xiaomi-14");
  });

  await check("parseMoney: bo‘shliq va so‘m bilan", () => {
    assert.equal(parseMoney("14 500 000 so‘m"), 14_500_000);
    assert.equal(parseMoney("14 500 000"), 14_500_000);
    assert.ok(Number.isNaN(parseMoney("narx")));
  });

  await check("formadan saqlash: 63 ta mahsulotning hammasi o‘zgarishsiz qaytadi", () => {
    for (const product of allProducts) {
      const parsed = productInputSchema.safeParse(productToFormValues(product));
      assert.ok(parsed.success, `${product.slug}: ${parsed.success ? "" : JSON.stringify(flattenIssues(parsed.error.issues))}`);
      const built = buildProductFromInput(parsed.data, product, product.updatedAt, rootOf(product.categoryId));
      assert.deepEqual(JSON.parse(JSON.stringify(built)), JSON.parse(JSON.stringify(product)), product.slug);
      assert.ok(productSchema.safeParse(built).success, product.slug);
    }
  });

  await check("formadan saqlash: narx o‘zgarsa, faqat narx o‘zgaradi va variant id saqlanadi", () => {
    const product = allProducts.find((p) => p.slug === "iphone-15-pro-max")!;
    const values = productToFormValues(product);
    values.variants[0]!.price = "13 999 000";
    const built = buildProductFromInput(productInputSchema.parse(values), product, "2026-10-05T00:00:00.000Z", rootOf(product.categoryId));
    assert.equal(built.variants[0]!.price, 13_999_000);
    assert.equal(built.variants[0]!.id, product.variants[0]!.id);
    assert.deepEqual(JSON.parse(JSON.stringify(built.variants.slice(1))), JSON.parse(JSON.stringify(product.variants.slice(1))));
    assert.equal(built.updatedAt, "2026-10-05T00:00:00.000Z");
    assert.equal(built.createdAt, product.createdAt);
  });

  await check("yangi mahsulot: id/SKU avtomatik, noyob, boshqa mahsulot id'si o‘g‘irlanmaydi", () => {
    const values = emptyFormValues();
    values.name = "Test Telefon X";
    values.slug = slugify(values.name);
    values.brandId = "apple";
    values.categoryId = "telefonlar-iphone";
    values.variants = addMatrixVariants(values.variants, {
      colors: [{ name: "Qora", hex: "#111111" }, { name: "Ko‘k", hex: "#2233AA" }],
      storages: ["128GB", "256GB"],
      condition: "new",
      warrantyMonths: "12",
      simType: "",
      price: "5000000",
      stock: "2",
    });
    assert.equal(values.variants.length, 4, "bo‘sh qator jadval bilan almashishi kerak");
    // Soxta: boshqa mahsulotning variant id'sini yuborish.
    values.variants[0]!.id = "iphone-15-pro-max-256gb-natural-titanium-new";
    const built = buildProductFromInput(productInputSchema.parse(values), null, "2026-10-05T00:00:00.000Z", rootOf(values.categoryId));
    const ids = built.variants.map((v) => v.id);
    assert.equal(new Set(ids).size, 4);
    assert.ok(ids.every((id) => id.startsWith("test-telefon-x-")), ids.join(", "));
    assert.ok(built.variants.every((v) => v.sku.length > 0));
    assert.equal(built.popularity, 0);
    assert.ok(productSchema.safeParse(built).success);
    // Qayta bosish takror qo‘shmaydi.
    const again = addMatrixVariants(values.variants, { colors: [{ name: "Qora", hex: "#111111" }], storages: ["128GB"], condition: "new", warrantyMonths: "12", simType: "", price: "", stock: "1" });
    assert.equal(again.length, 4);
  });

  await check("forma tekshiruvi: tushunarli xatolar to‘g‘ri maydonga tushadi", () => {
    const values = emptyFormValues();
    values.variants[0]!.price = "";
    values.variants.push({ ...values.variants[0]!, key: "x", price: "100", oldPrice: "50" });
    const result = productInputSchema.safeParse({ ...values, slug: "Yomon Manzil" });
    assert.ok(!result.success);
    const errors = flattenIssues(result.error.issues);
    assert.ok(errors.name, "nom");
    assert.ok(errors.slug, "manzil");
    assert.ok(errors.brandId, "brend");
    assert.ok(errors.categoryId, "kategoriya");
    assert.ok(errors["variants.0.price"], "narx");
    assert.ok(errors["variants.1.oldPrice"]?.includes("Eski narx"), "eski narx");
    assert.ok(errors["variants.1.color"]?.includes("bir xil"), "takroriy variant");
    assert.equal(productInputSchema.safeParse({ ...values, slug: "yangi" }).success, false);
    const taxonomy = { brandIds: new Set(brands.map((b) => b.id)), leafCategoryIds: new Set(getLeafCategories(categories).map((c) => c.id)) };
    assert.ok(validateTaxonomy({ brandId: "apple", categoryId: "telefonlar" }, taxonomy).categoryId, "ildiz kategoriya emas, barg kerak");
    assert.ok(validateTaxonomy({ brandId: "yoq-brend", categoryId: "telefonlar-iphone" }, taxonomy).brandId, "mavjud bo‘lmagan brend");
    assert.deepEqual(validateTaxonomy({ brandId: "apple", categoryId: "telefonlar-iphone" }, taxonomy), {});
  });

  await check("atributlar: kategoriyaga mos maydonlar, boshqarilmaydiganlar saqlanadi", () => {
    assert.deepEqual(getAttributeKeys("laptoplar-hp", "laptoplar"), ["cpu", "gpu", "screenSize"]);
    assert.deepEqual(getAttributeKeys("aksessuarlar-chexollar", "aksessuarlar"), ["compatibility", "material"]);
    assert.deepEqual(getAttributeKeys("telefonlar-iphone", "telefonlar"), []);
    const powerbank = allProducts.find((p) => p.attributes.capacity !== undefined)!;
    const values = productToFormValues(powerbank);
    const built = buildProductFromInput(productInputSchema.parse(values), powerbank, powerbank.updatedAt, rootOf(powerbank.categoryId));
    assert.equal(built.attributes.capacity, powerbank.attributes.capacity);
  });

  await check("rasmlar: tartib saqlanadi, takror olib tashlanadi, 10 tadan ortig‘i rad etiladi", () => {
    const product = allProducts[0]!;
    const values = productToFormValues(product);
    values.images = ["/products/a/2.webp", "/products/a/1.webp", "/products/a/2.webp"];
    const built = buildProductFromInput(productInputSchema.parse(values), product, product.updatedAt, rootOf(product.categoryId));
    assert.deepEqual(built.images, ["/products/a/2.webp", "/products/a/1.webp"]);
    values.images = Array.from({ length: 11 }, (_, i) => `/products/a/${i}.webp`);
    const result = productInputSchema.safeParse(values);
    assert.ok(!result.success && flattenIssues(result.error.issues).images?.includes("10"));
  });

  await check("rasm manzili: faqat o‘z Storage papkamizdagi yuklangan fayl qabul qilinadi", async () => {
    const saved = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SECRET_KEY };
    process.env.SUPABASE_URL = "https://abcdef.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    try {
      const { isOwnUploadedImage } = await import("@/lib/db/storage");
      const base = "https://abcdef.supabase.co/storage/v1/object/public/product-images/";
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      assert.equal(isOwnUploadedImage(`${base}uploads/2026/10/${uuid}.webp`), true);
      assert.equal(isOwnUploadedImage(`${base}uploads/2026/10/${uuid}.webp?x=1`), false, "query");
      assert.equal(isOwnUploadedImage(`${base}uploads/../../secret.webp`), false, "yo‘l chiqishi");
      assert.equal(isOwnUploadedImage(`https://boshqa.supabase.co/storage/v1/object/public/product-images/uploads/2026/10/${uuid}.webp`), false, "begona loyiha");
      assert.equal(isOwnUploadedImage(`https://evil.com/${uuid}.webp`), false, "begona sayt");
      assert.equal(isOwnUploadedImage(`${base}uploads/2026/10/${uuid}.svg`), false, "svg");
    } finally {
      if (saved.url === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = saved.url;
      if (saved.key === undefined) delete process.env.SUPABASE_SECRET_KEY;
      else process.env.SUPABASE_SECRET_KEY = saved.key;
    }
  });

  await check("nusxa olish: yangi manzil, variant id/SKU bo‘sh, yashirin, boshqa hammasi ko‘chadi", () => {
    const source = allProducts.find((p) => p.slug === "iphone-15-pro-max")!;
    const copy = duplicateFormValues(source);
    assert.equal(copy.name, "iPhone 15 Pro Max (nusxa)");
    assert.equal(copy.slug, "iphone-15-pro-max-nusxa");
    assert.equal(copy.isPublished, false);
    assert.equal(copy.updatedAt, undefined);
    assert.ok(copy.variants.every((v) => v.id === undefined && v.sku === ""));
    assert.equal(copy.variants.length, source.variants.length);
    const built = buildProductFromInput(productInputSchema.parse(copy), null, "2026-10-05T00:00:00.000Z", rootOf(copy.categoryId));
    assert.ok(built.variants.every((v) => v.id.startsWith("iphone-15-pro-max-nusxa-")));
    assert.equal(new Set(built.variants.map((v) => v.id)).size, built.variants.length);
    assert.deepEqual(built.specs, source.specs);
    assert.ok(productSchema.safeParse(built).success);
  });

  await check("tez tahrir: faqat narx/chegirma/qoldiq o‘zgaradi, xatolar variantga bog‘lanadi", () => {
    const product = allProducts.find((p) => p.slug === "iphone-15-pro-max")!;
    const [a, b] = product.variants;
    const input = (changes: { id: string; price: number; oldPrice: number | null; stock: number }[]) =>
      quickEditSchema.parse({ id: product.id, updatedAt: product.updatedAt, variants: changes });
    const done = applyQuickEdit(product, input([{ id: a!.id, price: 14_000_000, oldPrice: null, stock: 7 }]), "2026-10-05T00:00:00.000Z");
    assert.ok("product" in done);
    const changed = done.product.variants[0]!;
    assert.equal(changed.price, 14_000_000);
    assert.equal(changed.stock, 7);
    assert.equal(changed.oldPrice, undefined, "chegirma olib tashlandi");
    assert.equal(changed.color, a!.color);
    assert.deepEqual(done.product.variants.slice(1), product.variants.slice(1));
    assert.equal(done.product.name, product.name);
    assert.ok(productSchema.safeParse(done.product).success);
    const bad = applyQuickEdit(product, input([{ id: b!.id, price: 5_000_000, oldPrice: 4_000_000, stock: 1 }, { id: "yoq-variant", price: 1, oldPrice: null, stock: 0 }]), "x");
    assert.ok("errors" in bad && bad.errors[b!.id] && bad.errors["yoq-variant"]);
    assert.equal(quickEditSchema.safeParse({ id: product.id, updatedAt: "x", variants: [{ id: a!.id, price: 1, oldPrice: null, stock: -1 }] }).success, false);
  });

  section("Admin: buyurtmalar");

  const orderFixtures: Order[] = [
    { id: "QP-000003", productId: "p", variantId: "v", productName: "iPhone 15 Pro Max", variantLabel: "256GB · Qora", price: 14_500_000, customerName: "Ali Valiyev", phone: "+998901234567", note: "Chilonzor", status: "new", source: "site", createdAt: "2026-10-05T09:30:00.000Z" },
    { id: "QP-000002", productId: "p", variantId: "v", productName: "G‘ilof shaffof", variantLabel: "—", price: 100_000, customerName: "Vali G‘aniyev", phone: "+998935550011", status: "done", source: "site", createdAt: "2026-10-04T18:00:00.000Z", adminNote: "pulini to‘ladi" },
    { id: "QP-000001", productId: "p", variantId: "v", productName: "Redmi Note 13", variantLabel: "128GB", price: 3_000_000, customerName: "Olim", phone: "+998977770000", status: "cancelled", source: "site", createdAt: "2026-09-30T05:00:00.000Z" },
  ];

  await check("buyurtmalar: tablar sanog‘i va filtri", () => {
    assert.deepEqual(countOrderTabs(orderFixtures), { hammasi: 3, yangi: 1, boglanildi: 0, bajarildi: 1, bekor: 1 });
    assert.deepEqual(filterOrders(orderFixtures, "bajarildi", "").map((o) => o.id), ["QP-000002"]);
    assert.equal(parseOrderTab("<x>"), "hammasi");
  });

  await check("buyurtmalar: qidiruv (raqam, telefon qismi, ism o‘/g‘ farqisiz, admin izohi)", () => {
    const ids = (q: string) => filterOrders(orderFixtures, "hammasi", q).map((o) => o.id);
    assert.deepEqual(ids("QP-000002"), ["QP-000002"]);
    assert.deepEqual(ids("90 123"), ["QP-000003"]);
    assert.deepEqual(ids("+998 93 555"), ["QP-000002"]);
    assert.deepEqual(ids("ganiyev"), ["QP-000002"]);
    assert.deepEqual(ids("gilof"), ["QP-000002"]);
    assert.deepEqual(ids("pulini"), ["QP-000002"]);
    assert.deepEqual(ids("redmi"), ["QP-000001"]);
    assert.deepEqual(ids("yoqbunaqa"), []);
  });

  await check("buyurtma vaqti: Toshkent bo‘yicha Bugun/Kecha/sana", () => {
    const now = new Date("2026-10-05T10:00:00.000Z"); // Toshkent: 15:00
    assert.equal(formatOrderTime("2026-10-05T09:30:00.000Z", now), "Bugun, 14:30");
    assert.equal(formatOrderTime("2026-10-04T18:00:00.000Z", now), "Kecha, 23:00");
    assert.equal(formatOrderTime("2026-10-04T19:30:00.000Z", now), "Bugun, 00:30", "UTC'da kecha, Toshkentda bugun");
    assert.equal(formatOrderTime("2026-09-30T05:00:00.000Z", now), "30.09.2026, 10:00");
    assert.equal(formatOrderTime("noto‘g‘ri"), "—");
  });

  await check("Telegram xabari: HTML xavfsiz, lokal manzilda tugma yo‘q (Telegram rad etmasin)", () => {
    const message = buildOrderNotification({ ...orderFixtures[0]!, customerName: "Ali <b>& Co</b>", note: "<script>x</script>" });
    assert.ok(message.text.includes("Ali &lt;b&gt;&amp; Co&lt;/b&gt;"), "ism ekranlangan");
    assert.ok(!message.text.includes("<script>"), "izoh ekranlangan");
    assert.ok(message.text.includes("+998 90 123 45 67"));
    assert.ok(message.text.includes("14 500 000"));
    assert.deepEqual(message.buttons, [], "localhost — tugma yo‘q");
    assert.ok(message.text.includes("Havola: http://localhost:3000/mahsulot/"), "havola matnda");
  });

  await check("TELEGRAM_ADMIN_CHAT_ID: bir nechta ID, guruh, takror va xato yozilganlar", () => {
    const saved = { token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_ADMIN_CHAT_ID };
    try {
      process.env.TELEGRAM_BOT_TOKEN = "123456:abc";
      process.env.TELEGRAM_ADMIN_CHAT_ID = " 111222333, -1001234567890 ,111222333, xato, 12 ";
      assert.deepEqual(getServerEnv().telegramAdminChatIds, ["111222333", "-1001234567890"]);
      assert.equal(getServerEnv().telegramBotEnabled, true);
      process.env.TELEGRAM_ADMIN_CHAT_ID = "xato";
      assert.equal(getServerEnv().telegramBotEnabled, false, "yaroqli ID bo‘lmasa — o‘chiq");
    } finally {
      for (const [k, v] of [["TELEGRAM_BOT_TOKEN", saved.token], ["TELEGRAM_ADMIN_CHAT_ID", saved.chat]] as const) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  section("Admin: sozlamalar");

  await check("sozlamalar: hozirgi standart qiymatlar sxemadan o‘tadi", () => {
    const result = storeSettingsSchema.safeParse(pickStoreSettings(store));
    assert.ok(result.success, result.success ? "" : JSON.stringify(flattenIssues(result.error.issues)));
  });

  await check("sozlamalar: Telegram (@, t.me havola), bot rad etiladi, telefon va Instagram tekshiruvi", () => {
    const base = pickStoreSettings(store);
    const parse = (patch: Partial<typeof base>) => storeSettingsSchema.safeParse({ ...base, ...patch });
    const ok1 = parse({ telegramUsername: "@zamon_shop" });
    assert.ok(ok1.success && ok1.data.telegramUsername === "zamon_shop");
    const ok2 = parse({ telegramUsername: "https://t.me/zamon_shop" });
    assert.ok(ok2.success && ok2.data.telegramUsername === "zamon_shop");
    assert.equal(parse({ telegramUsername: "zamonstore_orders_bot" }).success, false, "bot");
    assert.equal(parse({ telegramUsername: "ab" }).success, false, "juda qisqa");
    const phone = parse({ phone: "90 123 45 67" });
    assert.ok(phone.success && phone.data.phone === "+998901234567");
    assert.equal(parse({ phone: "12345" }).success, false);
    assert.ok(parse({ instagramUrl: "" }).success, "Instagram ixtiyoriy");
    assert.equal(parse({ instagramUrl: "https://evil.com/x" }).success, false);
    assert.equal(parse({ workingHours: [] }).success, false);
    assert.equal(parse({ deliveryZones: [{ name: "X", price: -1 }] }).success, false);
  });

  await check("sozlamalar: qisman saqlangan ma’lumot standartlar ustiga qo‘yiladi, buzilgani e’tiborsiz", () => {
    const merged = mergeStoreSettings(store, { telegramUsername: "my_shop", phone: "yomon", unknownKey: 1 });
    assert.equal(merged.telegramUsername, "my_shop");
    assert.equal(merged.phone, store.phone, "buzilgan telefon — standart qoldi");
    assert.equal(merged.latitude, store.latitude, "manzil o‘zgarmagan — koordinata qoldi");
    const moved = mergeStoreSettings(store, { address: "Samarqand sh., Registon ko‘chasi 1" });
    assert.equal(moved.latitude, undefined, "manzil o‘zgardi — eski koordinata olib tashlandi");
    assert.deepEqual(mergeStoreSettings(store, null), store);
  });

  await check("sozlamalar: do‘kon nomi, logotip yozuvi (katta harf, o‘/g‘) va shior", () => {
    const base = pickStoreSettings(store);
    const parse = (patch: Partial<typeof base>) => storeSettingsSchema.safeParse({ ...base, ...patch });
    const a = parse({ wordmark: "  mobile   house " });
    assert.ok(a.success && a.data.wordmark === "MOBILE HOUSE");
    const b = parse({ wordmark: "bo‘ston" });
    assert.ok(b.success && b.data.wordmark === "BO‘STON", "o‘ apostrofi");
    assert.equal(parse({ wordmark: "ТЕЛЕФОН" }).success, false, "kirill — logotip shrifti uchun emas");
    assert.equal(parse({ wordmark: "JUDA-UZUN-YOZUV" }).success, false, "12 belgidan uzun");
    assert.equal(parse({ name: "X" }).success, false);
    assert.equal(parse({ tagline: "" }).success, false);
    assert.equal(mergeStoreSettings(store, { name: "Mobile House" }).name, "Mobile House");
  });

  await check("sozlamalar: matn ↔ xatboshilar", () => {
    assert.deepEqual(textToParagraphs("Birinchi\nqator davomi\n\n\nIkkinchi  \n\n  "), ["Birinchi qator davomi", "Ikkinchi"]);
    assert.equal(paragraphsToText(["A", "B"]), "A\n\nB");
  });

  await check("bog‘lanish havolalari", () => {
    assert.equal(phoneCallHref("+998901234567"), "tel:+998901234567");
    assert.equal(telegramChatHref("+998 90 123 45 67"), "https://t.me/+998901234567");
  });

  await check("kategoriya tanlovi: faqat barglar, to‘liq yo‘l bilan", () => {
    const options = getCategoryOptions(categories);
    assert.equal(options.length, 25);
    assert.ok(options.some((o) => o.label === "Zaryadchiklar › Adapterlar" && o.rootName === "Aksessuarlar"));
    assert.ok(!options.some((o) => o.id === "telefonlar"));
  });

  console.log(`\n${passed} ta tekshiruv o‘tdi, ${failures.length} ta yiqildi.`);
  if (failures.length > 0) {
    console.log("\nXatolar:");
    for (const failure of failures) console.log(`\n- ${failure}`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

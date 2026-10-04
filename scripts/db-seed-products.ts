/**
 * `src/data/products` dagi mahsulotlarni Supabase `products` jadvaliga ko‘chiradi.
 *
 * Ishga tushirish: `npm run db:seed-products` (qiymatlar `.env.local` dan).
 * Standart rejim xavfsiz: bazada BOR mahsulotga tegilmaydi (admin tahrirlari saqlanadi),
 * faqat yo‘qlari qo‘shiladi. `-- --force` bilan kod fayllaridagi holat ustidan yoziladi.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const force = process.argv.includes("--force");

async function main() {
  // env yuklangandan keyin import qilinadi.
  const { allProducts } = await import("@/data/products");
  const { dbCount, dbUpsert, isDbConfigured } = await import("@/lib/db/supabase");
  const { withPhotos } = await import("@/lib/repo/products");
  const { productSchema, productToRow } = await import("@/lib/repo/product-rows");

  if (!isDbConfigured()) {
    console.log("✗ SUPABASE_URL / SUPABASE_SECRET_KEY .env.local da to‘ldirilmagan.");
    process.exitCode = 1;
    return;
  }

  const products = allProducts.map(withPhotos);
  const invalid: string[] = [];
  for (const product of products) {
    const result = productSchema.safeParse(product);
    if (!result.success) invalid.push(`${product.slug}: ${result.error.issues[0]?.message}`);
  }
  if (invalid.length > 0) {
    console.log("✗ Tekshiruvdan o‘tmagan mahsulotlar — hech narsa yozilmadi:");
    for (const line of invalid) console.log(`  ${line}`);
    process.exitCode = 1;
    return;
  }

  const before = await dbCount("products");
  await dbUpsert(
    "products",
    products.map((p) => productToRow(p) as unknown as Record<string, unknown>),
    force ? "merge" : "ignore",
  );
  const after = await dbCount("products");

  console.log(`✓ ${products.length} ta mahsulot tekshirildi.`);
  console.log(
    force
      ? `✓ Hammasi kod fayllaridagi holatga yangilandi. Bazada jami: ${after}.`
      : `✓ Yangi qo‘shildi: ${after - before}. Bazada borlariga tegilmadi. Jami: ${after}.`,
  );
}

main().catch((error: unknown) => {
  console.error("✗", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

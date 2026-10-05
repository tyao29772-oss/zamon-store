/**
 * `src/data` dagi brend va kategoriyalarni Supabase `brands` / `categories` jadvallariga ko‘chiradi.
 *
 * Ishga tushirish: `npm run db:seed-taxonomy` (qiymatlar `.env.local` dan).
 * Xavfsiz: bazada BOR yozuvga tegilmaydi (admin tahrirlari saqlanadi), faqat yo‘qlari qo‘shiladi.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { brands } = await import("@/data/brands");
  const { categories } = await import("@/data/categories");
  const { dbCount, dbUpsert, isDbConfigured } = await import("@/lib/db/supabase");
  const { brandToRow, categoryToRow } = await import("@/lib/repo/taxonomy");
  const { buildCategoryIndex } = await import("@/lib/repo/categories");

  if (!isDbConfigured()) {
    console.log("✗ SUPABASE_URL / SUPABASE_SECRET_KEY .env.local da to‘ldirilmagan.");
    process.exitCode = 1;
    return;
  }

  // Daraxt to‘g‘riligini oldindan tekshiramiz (sikl, yo‘q ota) — xato bo‘lsa hech narsa yozilmaydi.
  const index = buildCategoryIndex(categories);
  // Ota kategoriyalar avval (FK uchun tartib — chuqurlik bo‘yicha).
  const ordered = [...index.list].sort((a, b) => a.depth - b.depth);

  const before = { brands: await dbCount("brands"), categories: await dbCount("categories") };
  await dbUpsert(
    "brands",
    brands.map((b, i) => brandToRow(b, i + 1) as unknown as Record<string, unknown>),
    "ignore",
  );
  await dbUpsert(
    "categories",
    ordered.map((c) => categoryToRow(c) as unknown as Record<string, unknown>),
    "ignore",
  );
  const after = { brands: await dbCount("brands"), categories: await dbCount("categories") };

  console.log(`✓ Brendlar: yangi qo‘shildi ${after.brands - before.brands}, bazada jami ${after.brands}.`);
  console.log(`✓ Kategoriyalar: yangi qo‘shildi ${after.categories - before.categories}, bazada jami ${after.categories}.`);
  console.log("  Bazada borlariga tegilmadi.");
}

main().catch((error: unknown) => {
  console.error("✗", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

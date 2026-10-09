/**
 * `supabase/migrations/*.sql` → bitta `supabase/setup.sql` (yangi do‘kon uchun Supabase SQL
 * Editor’da BIR MARTA ishga tushiriladi). Yangi migratsiya qo‘shilganda: `npm run db:setup-sql`.
 * `npm run test:foundation` fayl eskirib qolmaganini tekshiradi.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";

export function buildSetupSql(root = process.cwd()) {
  const files = readdirSync(join(root, DIR)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  const parts = files.map((file) => {
    const body = readFileSync(join(root, DIR, file), "utf8").replace(/\r\n/g, "\n").trimEnd();
    return `-- ═══════════════════════════════════════════════════════════════════════\n-- ${file}\n-- ═══════════════════════════════════════════════════════════════════════\n\n${body}\n`;
  });
  return (
    "-- Zamon Store — bazani to‘liq tayyorlash (barcha migratsiyalar bitta faylda).\n" +
    "--\n" +
    "-- Supabase → SQL Editor → New query → shu faylni TO‘LIQ joylashtiring → Run.\n" +
    "-- Qayta ishga tushirish xavfsiz: mavjud jadval va ma’lumotlarga tegmaydi.\n" +
    `-- Bu fayl avtomatik yig‘ilgan (${files.length} ta migratsiya) — o‘zgartirmang, \`npm run db:setup-sql\`.\n\n` +
    parts.join("\n")
  );
}

// To‘g‘ridan-to‘g‘ri ishga tushirilganda yozadi; testdan import qilinganda — yo‘q.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/build-setup-sql.mjs")) {
  const sql = buildSetupSql();
  writeFileSync("supabase/setup.sql", sql);
  console.log(`✓ supabase/setup.sql yozildi (${sql.split("\n").length} qator)`);
}

/**
 * Supabase ulanishini tekshiradi: manzil, kalit va kerakli jadvallar.
 * Ishga tushirish: `npm run db:check` (qiymatlar `.env.local` dan o‘qiladi).
 * Kalit ekranga hech qachon chiqarilmaydi.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readEnvFile(name) {
  const path = join(process.cwd(), name);
  if (!existsSync(path)) return {};
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return values;
}

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const url = (process.env.SUPABASE_URL || fileEnv.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const key = (process.env.SUPABASE_SECRET_KEY || fileEnv.SUPABASE_SECRET_KEY || "").trim();

function fail(message) {
  console.log(`  ✗ ${message}`);
  process.exitCode = 1;
}

if (!url || !key) {
  fail("SUPABASE_URL yoki SUPABASE_SECRET_KEY .env.local da to‘ldirilmagan.");
  process.exit();
}
if (!/^https:\/\/[^/]+$/.test(url)) {
  fail(`SUPABASE_URL noto‘g‘ri: «${url}». To‘g‘ri ko‘rinish: https://abcdefgh.supabase.co`);
  process.exit();
}
console.log(`  ✓ Manzil: ${url}`);

if (key.startsWith("sb_publishable_") || key.includes("anon")) {
  fail("Bu ochiq (publishable/anon) kalit. Kerakli kalit — «Secret keys» bo‘limidagi sb_secret_... kaliti.");
  process.exit();
}

const headers = { apikey: key };
if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

for (const table of ["orders", "events", "products"]) {
  try {
    const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
      method: "HEAD",
      headers: { ...headers, Prefer: "count=exact" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const total = response.headers.get("content-range")?.split("/")[1] ?? "?";
      console.log(`  ✓ «${table}» jadvali bor (${total} ta yozuv)`);
    } else if (response.status === 401 || response.status === 403) {
      fail(`«${table}»: kalit noto‘g‘ri yoki ruxsat yo‘q (${response.status}). SUPABASE_SECRET_KEY ni tekshiring.`);
    } else if (response.status === 404) {
      fail(`«${table}» jadvali topilmadi. supabase/migrations/ dagi SQL fayllarni (0001, 0002 ...) tartib bilan SQL Editor'da ishga tushiring.`);
    } else {
      fail(`«${table}»: kutilmagan javob ${response.status}`);
    }
  } catch (error) {
    fail(`Supabase'ga ulanib bo‘lmadi: ${error instanceof Error ? error.message : error}`);
    break;
  }
}

console.log(process.exitCode ? "\nBaza hali tayyor emas." : "\nBaza tayyor — sayt Supabase bilan ishlaydi.");

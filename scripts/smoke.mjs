/**
 * Smoke-test: ishlab turgan serverdagi route'larni tekshiradi.
 * Ishga tushirish: `npm run smoke` (BASE_URL=http://localhost:3000 default).
 * Har bosqichda `routes` ro‘yxati kengaytiriladi.
 */

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** @type {{ path: string; status?: number; includes?: string[] }[]} */
const routes = [
  { path: "/", includes: ["Zamon Store", "Mashhur mahsulotlar", "Pastki menyu", "Asosiy mazmunga o‘tish"] },
  { path: "/bu-sahifa-yoq-12345", status: 404, includes: ["Sahifa topilmadi"] },
];

let failed = 0;

for (const route of routes) {
  const expectedStatus = route.status ?? 200;
  try {
    const response = await fetch(`${BASE_URL}${route.path}`, { redirect: "manual" });
    const body = await response.text();
    const problems = [];

    if (response.status !== expectedStatus) {
      problems.push(`status ${response.status}, kutilgan ${expectedStatus}`);
    }
    for (const text of route.includes ?? []) {
      if (!body.includes(text)) problems.push(`matn topilmadi: «${text}»`);
    }

    if (problems.length > 0) {
      failed += 1;
      console.log(`  FAIL ${route.path} — ${problems.join("; ")}`);
    } else {
      console.log(`  ok   ${route.path}`);
    }
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${route.path} — ${error instanceof Error ? error.message : error}`);
  }
}

console.log(`\n${routes.length - failed}/${routes.length} route o‘tdi.`);
process.exitCode = failed > 0 ? 1 : 0;

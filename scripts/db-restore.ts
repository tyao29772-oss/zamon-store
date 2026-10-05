/**
 * Admin paneldagi «To‘liq zaxira» faylidan bazani qayta tiklaydi.
 *
 *   npm run db:restore -- zaxira.json                 — faqat ko‘rsatadi (hech narsa yozmaydi)
 *   npm run db:restore -- zaxira.json --yes           — brendlar, kategoriyalar, mahsulotlar, sozlamalar
 *   npm run db:restore -- zaxira.json --yes --with-orders — buyurtmalar ham (faqat jadval bo‘sh bo‘lsa)
 *
 * Xavfsiz: bazadagi yozuvlar o‘chirilmaydi; zaxiradagi yozuv bazadagisini yangilaydi (id bo‘yicha),
 * yo‘qlari qo‘shiladi. Buyurtma raqamlarini (QP-…) Postgres beradi — tiklanganda yangi raqam oladi.
 */
import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type Row = Record<string, unknown>;

/** Kalitlar tartibidan qat’i nazar solishtirish uchun. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Row)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((value as Row)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Vaqt belgisi farqi (masalan, updated_at) o‘zgarish hisoblanmaydi. */
function comparable(row: Row): string {
  const { updated_at: _updated, ...rest } = row;
  void _updated;
  return stable(rest);
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const write = args.includes("--yes");
  const withOrders = args.includes("--with-orders");

  const { validateBackup } = await import("@/lib/admin/export");
  const { dbCount, dbSelectAll, dbUpsert, isDbConfigured } = await import("@/lib/db/supabase");

  if (!file) {
    console.log("Foydalanish: npm run db:restore -- <zaxira.json> [--yes] [--with-orders]");
    process.exitCode = 1;
    return;
  }
  if (!isDbConfigured()) {
    console.log("✗ SUPABASE_URL / SUPABASE_SECRET_KEY .env.local da to‘ldirilmagan.");
    process.exitCode = 1;
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.log(`✗ Faylni o‘qib bo‘lmadi: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }
  const checked = validateBackup(parsed);
  if (!checked.ok) {
    console.log(`✗ ${checked.error}`);
    process.exitCode = 1;
    return;
  }
  const { backup } = checked;
  console.log(`Zaxira: «${backup.store}», ${backup.createdAt}\n`);

  // Ota kategoriyalar avval yoziladi (bog‘lanish — parent_id).
  const categories = backup.tables.categories;
  const parentOf = new Map(categories.map((c) => [String(c.id), (c.parent_id as string | null) ?? null]));
  const depth = (id: string): number => {
    let d = 0;
    for (let p = parentOf.get(id); p && d < 20; p = parentOf.get(p)) d += 1;
    return d;
  };
  const plan: [table: "brands" | "categories" | "products" | "settings", rows: Row[]][] = [
    ["brands", backup.tables.brands],
    ["categories", [...categories].sort((a, b) => depth(String(a.id)) - depth(String(b.id)))],
    ["products", backup.tables.products],
    ["settings", backup.tables.settings],
  ];

  for (const [table, rows] of plan) {
    const current = new Map((await dbSelectAll<Row>(table, "select=*")).map((r) => [String(r.id), r]));
    const added = rows.filter((r) => !current.has(String(r.id)));
    const changed = rows.filter((r) => current.has(String(r.id)) && comparable(current.get(String(r.id))!) !== comparable(r));
    const onlyInDb = [...current.keys()].filter((id) => !rows.some((r) => String(r.id) === id));
    console.log(
      `${table.padEnd(11)} zaxirada ${String(rows.length).padStart(4)} · yangi ${added.length} · o‘zgargan ${changed.length} · faqat bazada ${onlyInDb.length} (tegilmaydi)`,
    );
    if (write && (added.length > 0 || changed.length > 0)) {
      await dbUpsert(
        table,
        [...added, ...changed].map(({ updated_at: _u, ...rest }) => (void _u, rest)),
        "merge",
      );
    }
  }

  const orders = backup.tables.orders;
  const orderCount = await dbCount("orders");
  if (withOrders) {
    if (orderCount > 0) {
      console.log(`orders      bazada ${orderCount} ta buyurtma bor — tiklanmadi (faqat bo‘sh jadvalga tiklanadi)`);
    } else {
      console.log(`orders      zaxirada ${orders.length} · bo‘sh jadvalga qo‘shiladi (raqamlar yangidan beriladi)`);
      if (write && orders.length > 0) {
        const sorted = [...orders].sort((a, b) => Number(a.seq) - Number(b.seq));
        await dbUpsert(
          "orders",
          sorted.map(({ seq: _s, id: _i, updated_at: _u, ...rest }) => (void _s, void _i, void _u, rest)),
          "ignore",
        );
      }
    }
  } else {
    console.log(`orders      zaxirada ${orders.length} · tiklash uchun --with-orders qo‘shing`);
  }

  console.log(
    write
      ? "\n✓ Tiklandi. Sayt keshi bir soat ichida o‘zi yangilanadi (darhol kerak bo‘lsa, admin panelda istalgan narsani saqlang yoki qayta deploy qiling)."
      : "\nHech narsa yozilmadi. Yozish uchun oxiriga --yes qo‘shing.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

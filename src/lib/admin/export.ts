import { ORDER_STATUS_META } from "@/lib/admin/order-list";
import { variantLabel } from "@/lib/admin/product-form";
import { STATS_TIME_ZONE } from "@/lib/admin/stats";
import type { Sheet } from "@/lib/admin/xlsx";
import type { Order, Product } from "@/types";

/**
 * «Zaxira va eksport»: Excel varaqlari va to‘liq zaxira (JSON) tarkibi. Sof funksiyalar.
 */

/** `2026-10-05 14:30` — Excel'da tartiblash qulay, Toshkent vaqti. */
export function formatExportTime(iso: string, timeZone = STATS_TIME_ZONE): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

/** Fayl nomidagi sana: `2026-10-05`. */
export function exportDateStamp(now = new Date()): string {
  return formatExportTime(now.toISOString()).slice(0, 10);
}

interface Names {
  brands: Map<string, string>;
  /** Kategoriya id → to‘liq yo‘l: «Aksessuarlar › Chexollar». */
  categories: Map<string, string>;
}

/** Har bir variant — alohida qator (narx va qoldiq variantga tegishli). */
export function productsSheet(products: Product[], names: Names, siteUrl: string): Sheet {
  const rows = [...products]
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((p) =>
      p.variants.map((v) => [
        p.name,
        variantLabel(v),
        v.sku,
        names.brands.get(p.brandId) ?? p.brandId,
        names.categories.get(p.categoryId) ?? p.categoryId,
        v.price,
        v.oldPrice ?? null,
        v.stock,
        p.isPublished ? "Saytda" : "Yashirin",
        `${siteUrl}/mahsulot/${p.slug}`,
      ]),
    );
  return {
    name: "Mahsulotlar",
    columns: [
      { header: "Mahsulot", width: 34 },
      { header: "Variant", width: 30 },
      { header: "SKU", width: 22 },
      { header: "Brend", width: 12 },
      { header: "Kategoriya", width: 28 },
      { header: "Narx (so‘m)", width: 14 },
      { header: "Eski narx (so‘m)", width: 16 },
      { header: "Qoldiq (dona)", width: 13 },
      { header: "Holat", width: 10 },
      { header: "Havola", width: 50 },
    ],
    rows,
  };
}

export function ordersSheet(orders: Order[]): Sheet {
  return {
    name: "Buyurtmalar",
    columns: [
      { header: "Raqam", width: 12 },
      { header: "Sana (Toshkent)", width: 17 },
      { header: "Holat", width: 14 },
      { header: "Mijoz", width: 20 },
      { header: "Telefon", width: 16 },
      { header: "Mahsulot", width: 32 },
      { header: "Variant", width: 28 },
      { header: "Narx (so‘m)", width: 14 },
      { header: "Mijoz izohi", width: 30 },
      { header: "Admin izohi", width: 30 },
    ],
    rows: orders.map((o) => [
      o.id,
      formatExportTime(o.createdAt),
      ORDER_STATUS_META[o.status]?.label ?? o.status,
      o.customerName,
      o.phone,
      o.productName,
      o.variantLabel,
      o.price,
      o.note ?? "",
      o.adminNote ?? "",
    ]),
  };
}

/* ------------------------------------------------------------------ To‘liq zaxira */

export const BACKUP_FORMAT = "zamon-store-backup";
export const BACKUP_VERSION = 1;

/** Zaxiraga kiradigan jadvallar — bazadagi xom qatorlar (qayta tiklash uchun). */
export const BACKUP_TABLES = ["brands", "categories", "products", "settings", "orders"] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  /** Qaysi do‘kon (fayllarni adashtirmaslik uchun). */
  store: string;
  counts: Record<BackupTable, number>;
  tables: Record<BackupTable, Record<string, unknown>[]>;
}

export function buildBackup(store: string, tables: Record<BackupTable, Record<string, unknown>[]>, now = new Date()): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: now.toISOString(),
    store,
    counts: Object.fromEntries(BACKUP_TABLES.map((t) => [t, tables[t].length])) as Record<BackupTable, number>,
    tables,
  };
}

/** Zaxira faylini tekshiradi (qayta tiklashdan oldin). Xato bo‘lsa — sababi. */
export function validateBackup(data: unknown): { ok: true; backup: Backup } | { ok: false; error: string } {
  if (!data || typeof data !== "object") return { ok: false, error: "Fayl JSON obyekt emas" };
  const b = data as Partial<Backup>;
  if (b.format !== BACKUP_FORMAT) return { ok: false, error: "Bu Zamon Store zaxira fayli emas" };
  if (typeof b.version !== "number" || b.version > BACKUP_VERSION) return { ok: false, error: `Zaxira versiyasi ${String(b.version)} — bu dastur uni tanimaydi` };
  if (!b.tables || typeof b.tables !== "object") return { ok: false, error: "Faylda jadvallar yo‘q" };
  for (const table of BACKUP_TABLES) {
    const rows = (b.tables as Record<string, unknown>)[table];
    if (!Array.isArray(rows) || rows.some((r) => !r || typeof r !== "object" || Array.isArray(r))) {
      return { ok: false, error: `«${table}» jadvali buzilgan` };
    }
  }
  return { ok: true, backup: b as Backup };
}

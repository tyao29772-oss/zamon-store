import { publicEnv } from "@/config/env";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { BACKUP_TABLES, buildBackup, exportDateStamp, ordersSheet, productsSheet, type BackupTable } from "@/lib/admin/export";
import { getCategoryOptions, slugify } from "@/lib/admin/product-form";
import { buildXlsx, XLSX_CONTENT_TYPE } from "@/lib/admin/xlsx";
import { dbSelectAll, isDbConfigured } from "@/lib/db/supabase";
import { listOrders } from "@/lib/repo/orders";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import { getStore } from "@/lib/repo/store";
import { loadTaxonomy } from "@/lib/repo/taxonomy";

/**
 * Admin «Zaxira va eksport» fayllari:
 *   /admin/zaxira/mahsulotlar — Excel, /admin/zaxira/buyurtmalar — Excel,
 *   /admin/zaxira/toliq — butun do‘kon JSON (qayta tiklash: `npm run db:restore`).
 * Proxy kirmagan foydalanuvchini login'ga yo‘naltiradi; bu yerda ham tekshiriladi.
 */

/** Jadvallarni barqaror tartibda o‘qish (fayllarni solishtirish oson bo‘lsin). */
const ORDER_BY: Record<BackupTable, string> = {
  brands: "sort_order.asc,id.asc",
  categories: "sort_order.asc,id.asc",
  products: "id.asc",
  settings: "id.asc",
  orders: "seq.asc",
};

function download(body: BodyInit, contentType: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export async function GET(_request: Request, { params }: RouteContext<"/admin/zaxira/[fayl]">): Promise<Response> {
  if (!(await isAdminAuthenticated())) return new Response("Ruxsat yo‘q", { status: 401 });

  const { fayl } = await params;
  const store = await getStore();
  const prefix = slugify(store.name) || "dokon";
  const stamp = exportDateStamp();

  try {
    if (fayl === "mahsulotlar") {
      const [products, { brands, categories }] = await Promise.all([getAllProductsForAdmin(), loadTaxonomy()]);
      const categoryNames = new Map(
        getCategoryOptions(categories).map((o) => [o.id, o.label === o.rootName ? o.rootName : `${o.rootName} › ${o.label}`]),
      );
      const sheet = productsSheet(products, { brands: new Map(brands.map((b) => [b.id, b.name])), categories: categoryNames }, publicEnv.siteUrl);
      return download(new Uint8Array(buildXlsx(sheet)), XLSX_CONTENT_TYPE, `${prefix}-mahsulotlar-${stamp}.xlsx`);
    }

    if (fayl === "buyurtmalar") {
      const sheet = ordersSheet(await listOrders());
      return download(new Uint8Array(buildXlsx(sheet)), XLSX_CONTENT_TYPE, `${prefix}-buyurtmalar-${stamp}.xlsx`);
    }

    if (fayl === "toliq") {
      if (!isDbConfigured()) return new Response("Baza (Supabase) ulanmagan — zaxira faqat bazadan olinadi.", { status: 400 });
      const entries = await Promise.all(
        BACKUP_TABLES.map(async (table) => [table, await dbSelectAll<Record<string, unknown>>(table, `select=*&order=${ORDER_BY[table]}`)] as const),
      );
      const backup = buildBackup(store.name, Object.fromEntries(entries) as Record<BackupTable, Record<string, unknown>[]>);
      return download(JSON.stringify(backup, null, 1), "application/json; charset=utf-8", `${prefix}-zaxira-${stamp}.json`);
    }
  } catch (error) {
    console.error(`[admin/zaxira] ${fayl}:`, error);
    return new Response("Faylni tayyorlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.", { status: 503 });
  }

  return new Response("Topilmadi", { status: 404 });
}

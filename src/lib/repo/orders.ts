import "server-only";
import { dbCount, dbInsert, dbSelectAll, dbUpdate, isDbConfigured } from "@/lib/db/supabase";
import { appendJsonLine, countJsonLines, readJsonLines } from "@/lib/repo/local-jsonl";
import type { Money, Order, OrderStatus } from "@/types";

/**
 * Buyurtmalar repository'si. Supabase sozlangan bo‘lsa — `orders` jadvali,
 * aks holda lokal `.data/orders.jsonl` (faqat lokal ishlab chiqish uchun).
 */

const FILE_NAME = "orders.jsonl";
const TABLE = "orders";

/** Bazadagi qator ko‘rinishi (snake_case). */
interface OrderRow {
  id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_label: string;
  price: number;
  customer_name: string;
  phone: string;
  note: string | null;
  status: OrderStatus;
  source: "site";
  created_at: string;
  updated_at?: string;
  /** 0004-migratsiyadan keyin mavjud. */
  admin_note?: string | null;
  stock_deducted?: boolean;
}

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    productName: row.product_name,
    variantLabel: row.variant_label,
    price: row.price,
    customerName: row.customer_name,
    phone: row.phone,
    note: row.note ?? undefined,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    adminNote: row.admin_note ?? undefined,
    stockDeducted: row.stock_deducted ?? false,
  };
}

/**
 * Lokal rejimda keyingi buyurtma raqami shu jarayon xotirasida keshlanadi — fayldan har
 * safar qayta o‘qishning oldini oladi. Bazada esa raqamni Postgres o‘zi beradi.
 */
let nextSequence: number | null = null;

async function nextLocalOrderId(): Promise<string> {
  if (nextSequence === null) {
    nextSequence = (await countJsonLines(FILE_NAME)) + 1;
  } else {
    nextSequence += 1;
  }
  return `QP-${String(nextSequence).padStart(6, "0")}`;
}

/**
 * Baza vaqtincha ishlamay qolsa ham mijoz buyurtmasi yo‘qolmasin: noyob zaxira raqam
 * beriladi, buyurtma Telegram bot orqali adminga baribir yetib boradi.
 */
function fallbackOrderId(): string {
  return `QP-T${Date.now().toString(36).toUpperCase()}`;
}

export interface CreateOrderInput {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  price: Money;
  customerName: string;
  phone: string;
  note?: string;
}

/** Buyurtmalar soni; baza javob bermasa `null` (0 deb ko‘rsatib, chalg‘itmaslik uchun). */
export async function countOrders(): Promise<number | null> {
  if (isDbConfigured()) {
    try {
      return await dbCount(TABLE);
    } catch (error) {
      console.error("[repo/orders] sonini olib bo‘lmadi:", error);
      return null;
    }
  }
  return countJsonLines(FILE_NAME);
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (isDbConfigured()) {
    try {
      const row = await dbInsert<OrderRow>(TABLE, {
        product_id: input.productId,
        variant_id: input.variantId,
        product_name: input.productName,
        variant_label: input.variantLabel,
        price: input.price,
        customer_name: input.customerName,
        phone: input.phone,
        note: input.note ?? null,
      });
      return fromRow(row);
    } catch (error) {
      console.error("[repo/orders] bazaga yozib bo‘lmadi, zaxira raqam beriladi:", error);
      return buildOrder(fallbackOrderId(), input);
    }
  }

  const order = buildOrder(await nextLocalOrderId(), input);
  await appendJsonLine(FILE_NAME, order);
  return order;
}

function buildOrder(id: string, input: CreateOrderInput): Order {
  return {
    id,
    productId: input.productId,
    variantId: input.variantId,
    productName: input.productName,
    variantLabel: input.variantLabel,
    price: input.price,
    customerName: input.customerName,
    phone: input.phone,
    note: input.note,
    status: "new",
    source: "site",
    createdAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ Admin: o‘qish va yangilash */

const ID_PATTERN = /^QP-[A-Z0-9]{1,20}$/;

/** Barcha buyurtmalar, eng yangisi birinchi. */
export async function listOrders(): Promise<Order[]> {
  if (isDbConfigured()) {
    const rows = await dbSelectAll<OrderRow>(TABLE, "select=*&order=created_at.desc,seq.desc");
    return rows.map(fromRow);
  }
  const local = await readJsonLines<Order>(FILE_NAME);
  return local.reverse();
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!ID_PATTERN.test(id)) return null;
  if (isDbConfigured()) {
    const rows = await dbSelectAll<OrderRow>(TABLE, `select=*&id=eq.${encodeURIComponent(id)}`);
    return rows[0] ? fromRow(rows[0]) : null;
  }
  return (await readJsonLines<Order>(FILE_NAME)).find((o) => o.id === id) ?? null;
}

/** «Yangi» holatdagi buyurtmalar soni (menyudagi belgi uchun); xato bo‘lsa 0. */
export async function countNewOrders(): Promise<number> {
  try {
    if (isDbConfigured()) return await dbCount(TABLE, "status=eq.new");
    return (await readJsonLines<Order>(FILE_NAME)).filter((o) => o.status === "new").length;
  } catch (error) {
    console.error("[repo/orders] yangi buyurtmalar sonini olib bo‘lmadi:", error);
    return 0;
  }
}

export interface OrderPatch {
  status?: OrderStatus;
  adminNote?: string | null;
  stockDeducted?: boolean;
}

/** Faqat bazada (lokal faylni o‘zgartirish qo‘llab-quvvatlanmaydi). Topilmasa — `null`. */
export async function updateOrder(id: string, patch: OrderPatch): Promise<Order | null> {
  if (!ID_PATTERN.test(id)) return null;
  const body: Record<string, unknown> = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.adminNote !== undefined) body.admin_note = patch.adminNote;
  if (patch.stockDeducted !== undefined) body.stock_deducted = patch.stockDeducted;
  const rows = await dbUpdate<OrderRow>(TABLE, `id=eq.${encodeURIComponent(id)}`, body);
  return rows[0] ? fromRow(rows[0]) : null;
}

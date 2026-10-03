import "server-only";
import { dbCount, dbInsert, isDbConfigured } from "@/lib/db/supabase";
import { appendJsonLine, countJsonLines } from "@/lib/repo/local-jsonl";
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

import { appendJsonLine, countJsonLines } from "@/lib/repo/local-jsonl";
import type { Money, Order } from "@/types";

const FILE_NAME = "orders.jsonl";

/**
 * Keyingi buyurtma raqami shu jarayon xotirasida keshlanadi — fayldan har safar qayta
 * o‘qishning oldini oladi va bitta serverda ketma-ket so‘rovlar orasidagi poyga holatini
 * kamaytiradi (bir nechta server instansiyasi bo‘lsa, DB'ga o‘tganda hal qilinadi).
 */
let nextSequence: number | null = null;

async function nextOrderId(): Promise<string> {
  if (nextSequence === null) {
    nextSequence = (await countJsonLines(FILE_NAME)) + 1;
  } else {
    nextSequence += 1;
  }
  return `QP-${String(nextSequence).padStart(6, "0")}`;
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

export async function countOrders(): Promise<number> {
  return countJsonLines(FILE_NAME);
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const order: Order = {
    id: await nextOrderId(),
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

  await appendJsonLine(FILE_NAME, order);
  return order;
}

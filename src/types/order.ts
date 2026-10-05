import type { Money } from "./product";

export type OrderStatus = "new" | "contacted" | "done" | "cancelled";

export interface Order {
  /** `QP-000123` */
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  /** Server variantdan qayta hisoblagan narx. */
  price: Money;
  customerName: string;
  phone: string;
  note?: string;
  status: OrderStatus;
  source: "site";
  createdAt: string;
  /** Oxirgi o‘zgarish (holat, izoh). Lokal rejimda bo‘lmasligi mumkin. */
  updatedAt?: string;
  /** Faqat admin ko‘radigan izoh. */
  adminNote?: string;
  /** «Bajarildi» bo‘lganda qoldiqdan 1 dona ayirilganmi. */
  stockDeducted?: boolean;
}

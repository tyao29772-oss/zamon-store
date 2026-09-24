import { NextResponse } from "next/server";
import { z } from "zod";
import { describeVariantForOrder, findVariant } from "@/lib/product";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { createOrder } from "@/lib/repo/orders";
import { getProductBySlug } from "@/lib/repo/products";
import { normalizeUzPhone } from "@/lib/phone";
import { notifyAdminAboutOrder } from "@/lib/telegram-bot";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

const orderSchema = z.object({
  productId: z.string().trim().min(1),
  variantId: z.string().trim().min(1),
  name: z.string().trim().min(2, "Ism kamida 2 ta belgidan iborat bo‘lishi kerak").max(80),
  phone: z.string().trim().min(5, "Telefon raqamini kiriting").max(30),
  note: z.string().trim().max(500).optional(),
  // Honeypot: haqiqiy foydalanuvchiga ko‘rinmaydi, faqat botlar to‘ldiradi.
  website: z.string().max(200).optional(),
});

export interface CreateOrderResponse {
  orderId: string;
}

export interface CreateOrderError {
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export async function POST(request: Request): Promise<NextResponse<CreateOrderResponse | CreateOrderError>> {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`order:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rate.retryAfterMs ?? 0) / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So‘rov noto‘g‘ri formatda." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ma’lumotlar to‘liq emas.", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  // Honeypot to‘ldirilgan bo‘lsa — bot. Hech narsa saqlanmaydi va botga bildirmasdan
  // "muvaffaqiyat" ko‘rinishidagi javob qaytariladi.
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ orderId: "QP-000000" });
  }

  const phone = normalizeUzPhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Telefon raqami noto‘g‘ri.", fieldErrors: { phone: ["+998 90 123 45 67 ko‘rinishida kiriting"] } },
      { status: 400 },
    );
  }

  const product = await getProductBySlug(parsed.data.productId);
  if (!product) {
    return NextResponse.json({ error: "Mahsulot topilmadi." }, { status: 404 });
  }

  const variant = findVariant(product, parsed.data.variantId);
  if (!variant) {
    return NextResponse.json({ error: "Tanlangan variant topilmadi." }, { status: 404 });
  }

  // Narx har doim serverda variantdan qayta olinadi — klientdan kelgan narxga ishonilmaydi.
  const order = await createOrder({
    productId: product.slug,
    variantId: variant.id,
    productName: product.name,
    // Bu mahsulotda rang/xotira/o‘lcham kabi tanlov umuman bo‘lmasa (masalan oddiy kabel) — "—".
    variantLabel: describeVariantForOrder(product, variant) ?? "—",
    price: variant.price,
    customerName: parsed.data.name,
    phone,
    note: parsed.data.note,
  });

  // Bot xabari — muvaffaqiyatsiz bo‘lsa ham buyurtma saqlangan, mijozga xato qaytarilmaydi.
  await notifyAdminAboutOrder(order).catch((error: unknown) => {
    console.error("[api/orders] admin xabari yuborilmadi:", error);
  });

  return NextResponse.json({ orderId: order.id });
}

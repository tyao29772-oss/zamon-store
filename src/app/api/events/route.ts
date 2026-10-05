import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordEvent } from "@/lib/repo/events";

const EVENT_NAMES = [
  "search",
  "search_result_click",
  "product_view",
  "telegram_order_click",
  "order_submit",
  "favorite_toggle",
] as const;

/** Bitta voqea kichkina bo‘ladi — kattasi (yoki ko‘p so‘rov) bazani to‘ldirishga urinish. */
const MAX_BODY_BYTES = 4096;
const RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;

const eventSchema = z.object({
  name: z.enum(EVENT_NAMES),
  sessionId: z.string().trim().min(1).max(100),
  payload: z
    .record(z.string().max(40), z.union([z.string().transform((s) => s.slice(0, 200)), z.number(), z.boolean(), z.null()]))
    .refine((p) => Object.keys(p).length <= 12, "Juda ko‘p maydon")
    .default({}),
});

/**
 * `navigator.sendBeacon` orqali keladigan voqealarni saqlaydi. Har doim 204 qaytaradi —
 * beacon javobni o‘qimaydi, va noto‘g‘ri/buzilgan yuklama sayt uchun xato hisoblanmaydi.
 * Himoya: IP bo‘yicha cheklov, hajm va maydonlar soni cheklangan (baza to‘lib ketmasin).
 */
export async function POST(request: Request): Promise<Response> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return new Response(null, { status: 204 });
  if (!checkRateLimit(`events:${getClientIp(request)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS).allowed) {
    return new Response(null, { status: 204 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    // content-length yolg‘on bo‘lishi mumkin — haqiqiy hajm ham tekshiriladi.
    if (text.length > MAX_BODY_BYTES) return new Response(null, { status: 204 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 204 });

  await recordEvent({ ...parsed.data, timestamp: new Date().toISOString() });
  return new Response(null, { status: 204 });
}

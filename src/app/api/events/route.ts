import { z } from "zod";
import { recordEvent } from "@/lib/repo/events";

const EVENT_NAMES = [
  "search",
  "search_result_click",
  "product_view",
  "telegram_order_click",
  "order_submit",
  "favorite_toggle",
] as const;

const eventSchema = z.object({
  name: z.enum(EVENT_NAMES),
  sessionId: z.string().trim().min(1).max(100),
  payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
});

/**
 * `navigator.sendBeacon` orqali keladigan voqealarni saqlaydi. Har doim 204 qaytaradi —
 * beacon javobni o‘qimaydi, va noto‘g‘ri/buzilgan yuklama sayt uchun xato hisoblanmaydi.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 204 });

  await recordEvent({ ...parsed.data, timestamp: new Date().toISOString() });
  return new Response(null, { status: 204 });
}

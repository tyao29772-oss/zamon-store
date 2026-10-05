"use server";

import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendAdminTelegram } from "@/lib/telegram-bot";

/** Dashboard'dagi «Sinov xabarini yuborish»: bot va chat ID to‘g‘ri sozlanganini tekshiradi. */
export async function sendTestTelegramAction(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const rate = checkRateLimit(`tg-test:${getClientIp(await headers())}`, 5, 60_000);
  if (!rate.allowed) return { ok: false, message: "Juda tez-tez. Bir daqiqadan so‘ng qayta urinib ko‘ring." };

  const result = await sendAdminTelegram({
    text: "✅ <b>Zamon Store</b>: bot to‘g‘ri sozlangan.\nYangi buyurtmalar shu chatga keladi.",
    buttons: [],
  });
  if (result.ok) return { ok: true, message: "Xabar yuborildi — Telegram'ni tekshiring." };
  if (result.reason === "not_configured") return { ok: false, message: "Bot sozlanmagan: TELEGRAM_BOT_TOKEN va TELEGRAM_ADMIN_CHAT_ID kerak." };
  if (result.reason === "network") return { ok: false, message: "Telegram'ga ulanib bo‘lmadi. Internetni tekshiring." };
  const detail = result.detail ?? "";
  if (/chat not found/i.test(detail)) return { ok: false, message: "Chat topilmadi: TELEGRAM_ADMIN_CHAT_ID noto‘g‘ri yoki botga hali /start yozilmagan." };
  if (/unauthorized|404/i.test(detail)) return { ok: false, message: "Bot tokeni noto‘g‘ri (TELEGRAM_BOT_TOKEN)." };
  if (/blocked/i.test(detail)) return { ok: false, message: "Siz botni bloklagansiz — Telegram'da botni oching va «Restart» bosing." };
  return { ok: false, message: "Telegram xabarni qabul qilmadi. Sozlamalarni tekshiring." };
}

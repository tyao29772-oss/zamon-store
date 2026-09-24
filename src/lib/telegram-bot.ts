import { getServerEnv } from "@/config/env";
import { formatPrice } from "@/lib/format";
import { formatUzPhone } from "@/lib/phone";
import { escapeTelegramHtml } from "@/lib/telegram";
import { absoluteUrl, productHref } from "@/lib/urls";
import type { Order } from "@/types";

/**
 * Yangi buyurtma haqida do‘kon adminiga Telegram bot orqali xabar.
 * `TELEGRAM_BOT_TOKEN`/`TELEGRAM_ADMIN_CHAT_ID` sozlanmagan bo‘lsa — jimgina o‘tkaziladi,
 * sayt (va buyurtmani saqlash) shundan qat’i nazar ishlashda davom etadi.
 */
export async function notifyAdminAboutOrder(order: Order): Promise<void> {
  const env = getServerEnv();
  if (!env.telegramBotEnabled) {
    console.log(`[telegram-bot] sozlanmagan — buyurtma #${order.id} haqida admin xabari yuborilmadi`);
    return;
  }

  const lines = [
    `🆕 <b>Yangi buyurtma #${order.id}</b>`,
    "",
    `Mahsulot: ${escapeTelegramHtml(order.productName)}`,
    `Variant: ${escapeTelegramHtml(order.variantLabel)}`,
    `Narx: ${formatPrice(order.price)}`,
    "",
    `Mijoz: ${escapeTelegramHtml(order.customerName)}`,
    `Telefon: ${formatUzPhone(order.phone)}`,
    `Izoh: ${order.note ? escapeTelegramHtml(order.note) : "—"}`,
    "",
    `Havola: ${absoluteUrl(productHref(order.productId, order.variantId))}`,
  ];

  const url = `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.telegramAdminChatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
      }),
    });
    if (!response.ok) {
      console.error(`[telegram-bot] xabar yuborilmadi (${response.status}):`, await response.text());
    }
  } catch (error) {
    console.error("[telegram-bot] xabar yuborishda xato:", error);
  }
}

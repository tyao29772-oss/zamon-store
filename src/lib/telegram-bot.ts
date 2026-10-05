import { getServerEnv } from "@/config/env";
import { formatPrice } from "@/lib/format";
import { formatUzPhone } from "@/lib/phone";
import { escapeTelegramHtml } from "@/lib/telegram";
import { absoluteUrl, productHref } from "@/lib/urls";
import type { Order } from "@/types";

/**
 * Do‘kon adminiga Telegram bot orqali xabarlar. `TELEGRAM_BOT_TOKEN`/`TELEGRAM_ADMIN_CHAT_ID`
 * sozlanmagan bo‘lsa — jimgina o‘tkaziladi, sayt (va buyurtmani saqlash) ishlashda davom etadi.
 */

const TIMEOUT_MS = 10_000;

export interface TelegramMessage {
  text: string;
  /** URL tugmalari (bir qatorda). Faqat haqiqiy https manzil bo‘lsa qo‘shiladi. */
  buttons: { text: string; url: string }[];
}

/** Telegram faqat ochiq https havolali tugmalarni qabul qiladi (localhost'ni rad etadi). */
function isPublicHttps(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname !== "localhost" && !u.hostname.startsWith("127.");
  } catch {
    return false;
  }
}

/** Yangi buyurtma xabari — sof funksiya (test qilinadi). */
export function buildOrderNotification(order: Order): TelegramMessage {
  const productUrl = absoluteUrl(productHref(order.productId, order.variantId));
  const adminUrl = absoluteUrl(`/admin/buyurtmalar/${encodeURIComponent(order.id)}`);
  const lines = [
    `🆕 <b>Yangi buyurtma #${escapeTelegramHtml(order.id)}</b>`,
    "",
    `📱 <b>${escapeTelegramHtml(order.productName)}</b>`,
    order.variantLabel && order.variantLabel !== "—" ? `Variant: ${escapeTelegramHtml(order.variantLabel)}` : null,
    `💰 Narx: <b>${formatPrice(order.price)}</b>`,
    "",
    `👤 ${escapeTelegramHtml(order.customerName)}`,
    `📞 ${formatUzPhone(order.phone)}`,
    order.note ? `💬 «${escapeTelegramHtml(order.note)}»` : null,
  ].filter((line): line is string => line !== null);

  const buttons = [
    { text: "📋 Admin panelda ochish", url: adminUrl },
    { text: "🛍 Saytda ko‘rish", url: productUrl },
  ].filter((b) => isPublicHttps(b.url));

  // Tugma bo‘lmasa (lokal sinov), havola matnda qoladi.
  if (buttons.length === 0) lines.push("", `Havola: ${productUrl}`);
  return { text: lines.join("\n"), buttons };
}

export type SendResult = { ok: true } | { ok: false; reason: "not_configured" | "telegram_error" | "network"; detail?: string };

/** Admin chatiga xabar yuboradi. Xato bo‘lsa — natija qaytaradi, otmaydi. */
export async function sendAdminTelegram(message: TelegramMessage): Promise<SendResult> {
  const env = getServerEnv();
  if (!env.telegramBotEnabled) return { ok: false, reason: "not_configured" };

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.telegramAdminChatId,
        text: message.text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...(message.buttons.length > 0 ? { reply_markup: { inline_keyboard: [message.buttons] } } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      // Javobda token bo‘lmaydi; Telegram xato tavsifi (masalan, «chat not found») log uchun.
      const detail = (await response.text()).slice(0, 300);
      console.error(`[telegram-bot] xabar yuborilmadi (${response.status}):`, detail);
      return { ok: false, reason: "telegram_error", detail };
    }
    return { ok: true };
  } catch (error) {
    console.error("[telegram-bot] xabar yuborishda xato:", error instanceof Error ? error.message : error);
    return { ok: false, reason: "network" };
  }
}

export async function notifyAdminAboutOrder(order: Order): Promise<void> {
  const result = await sendAdminTelegram(buildOrderNotification(order));
  if (!result.ok && result.reason === "not_configured") {
    console.log(`[telegram-bot] sozlanmagan — buyurtma #${order.id} haqida admin xabari yuborilmadi`);
  }
}

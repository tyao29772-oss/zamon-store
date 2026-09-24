/**
 * Environment o‘zgaruvchilari bitta joyda o‘qiladi.
 *
 * `NEXT_PUBLIC_*` — brauzerga chiqadi, maxfiy narsa yozilmaydi.
 * Qolganlari faqat server kodida (API route, server komponent) o‘qiladi.
 */

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_TELEGRAM_USERNAME = "zamon_store_demo";

function cleanUsername(value: string | undefined): string {
  return (value ?? "").trim().replace(/^@/, "");
}

function cleanUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

export const publicEnv = {
  // NEXT_PUBLIC_ qiymatlar Next.js tomonidan build vaqtida to‘g‘ridan-to‘g‘ri
  // `process.env.NEXT_PUBLIC_X` ko‘rinishida almashtiriladi — dinamik o‘qib bo‘lmaydi.
  siteUrl: cleanUrl(process.env.NEXT_PUBLIC_SITE_URL) || DEFAULT_SITE_URL,
  telegramUsername:
    cleanUsername(process.env.NEXT_PUBLIC_TELEGRAM_USERNAME) ||
    DEFAULT_TELEGRAM_USERNAME,
};

export interface ServerEnv {
  telegramBotToken: string | null;
  telegramAdminChatId: string | null;
  /** Bot orqali adminga xabar yuborish uchun ikkala qiymat ham kerak. */
  telegramBotEnabled: boolean;
}

/** Faqat serverda chaqiriladi. Klient komponentlardan import qilinmaydi. */
export function getServerEnv(): ServerEnv {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || null;
  return {
    telegramBotToken: token,
    telegramAdminChatId: chatId,
    telegramBotEnabled: Boolean(token && chatId),
  };
}

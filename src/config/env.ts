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

/** Sessiya imzosi uchun kalitning minimal uzunligi (taxmin qilib bo‘lmasligi uchun). */
export const ADMIN_SECRET_MIN_LENGTH = 32;
/** Qisqa parolni taxmin qilish oson — undan qisqasi bilan admin panel yoqilmaydi. */
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

export interface AdminEnv {
  password: string | null;
  sessionSecret: string | null;
  /** Ikkalasi ham to‘g‘ri sozlanmaguncha admin panelga kirib bo‘lmaydi. */
  enabled: boolean;
}

/** Faqat serverda (server action, proxy) chaqiriladi. */
export function getAdminEnv(): AdminEnv {
  const rawPassword = process.env.ADMIN_PASSWORD?.trim() || null;
  const password = rawPassword && rawPassword.length >= ADMIN_PASSWORD_MIN_LENGTH ? rawPassword : null;
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || null;
  const sessionSecret = secret && secret.length >= ADMIN_SECRET_MIN_LENGTH ? secret : null;
  return { password, sessionSecret, enabled: Boolean(password && sessionSecret) };
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

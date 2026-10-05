import { getAdminEnv } from "@/config/env";

/**
 * Admin sessiyasi — imzolangan cookie (`<payload>.<HMAC-SHA256>`), bazasiz.
 * Faqat Web Crypto ishlatiladi, shuning uchun proxy'da ham, server action'da ham ishlaydi.
 *
 * Imzo kaliti `ADMIN_SESSION_SECRET` + `ADMIN_PASSWORD` dan olinadi: parol almashtirilsa,
 * barcha eski sessiyalar avtomatik bekor bo‘ladi.
 */

export const ADMIN_COOKIE = "zs_admin";
/** Cookie faqat admin yo‘llariga yuboriladi. */
export const ADMIN_COOKIE_PATH = "/admin";
export const ADMIN_SESSION_MAX_AGE_S = 60 * 60 * 12;
export { ADMIN_HINT_COOKIE } from "@/lib/admin/hint";

interface SessionPayload {
  /** Tugash vaqti, Unix soniyalarda. */
  exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

async function getSigningKey(): Promise<CryptoKey | null> {
  const env = getAdminEnv();
  if (!env.enabled) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`${env.sessionSecret}\u0000${env.password}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(): Promise<string | null> {
  const key = await getSigningKey();
  if (!key) return null;

  const payload: SessionPayload = { exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_S };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  return `${body}.${toBase64Url(signature)}`;
}

/** Imzo to‘g‘ri va muddati o‘tmagan bo‘lsa `true`. `crypto.subtle.verify` vaqt bo‘yicha xavfsiz. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return false;

  const key = await getSigningKey();
  const signatureBytes = fromBase64Url(signature);
  if (!key || !signatureBytes) return false;

  const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(body));
  if (!valid) return false;

  const bodyBytes = fromBase64Url(body);
  if (!bodyBytes) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(bodyBytes)) as Partial<SessionPayload>;
    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

/** Parolni vaqt bo‘yicha xavfsiz solishtiradi (ikkala tomon ham bir xil uzunlikdagi hash). */
export async function isAdminPassword(candidate: string): Promise<boolean> {
  const { password } = getAdminEnv();
  if (!password) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(password)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i]! ^ right[i]!;
  return diff === 0;
}

/** Login'dan keyin qaytiladigan manzil — faqat admin ichidagi yo‘l (ochiq redirect bo‘lmasin). */
export function safeAdminRedirect(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (value !== "/admin" && !value.startsWith("/admin/") && !value.startsWith("/admin?")) return "/admin";
  if (value.includes("\\")) return "/admin";
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}

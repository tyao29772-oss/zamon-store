import { publicEnv } from "@/config/env";
import { getStore } from "@/lib/repo/store";

/**
 * `/.well-known/security.txt` (RFC 9116): xavfsizlik bo‘yicha xabar berish uchun aloqa.
 * Qiymatlar admin «Sozlamalar»idan olinadi — do‘kon egasi o‘zgarsa, bu ham o‘zgaradi.
 */
export async function GET(): Promise<Response> {
  const store = await getStore();
  const contacts = [
    store.telegramUsername && `Contact: https://t.me/${store.telegramUsername.replace(/^@/, "")}`,
    store.phone && `Contact: tel:${store.phone.replace(/[^\d+]/g, "")}`,
  ].filter(Boolean);
  // Muddat — har doim bir yildan keyin (fayl o‘zi yangilanib turadi).
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  expires.setUTCHours(0, 0, 0, 0);

  const body = [
    ...contacts,
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: uz, ru, en",
    `Canonical: ${publicEnv.siteUrl}/.well-known/security.txt`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

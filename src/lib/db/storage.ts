import "server-only";
import { unstable_rethrow } from "next/navigation";
import { getSupabaseEnv } from "@/config/env";
import { DbError } from "@/lib/db/supabase";

/**
 * Supabase Storage: mahsulot rasmlari. Yozish faqat server bergan bir martalik imzolangan
 * havola orqali (admin), o‘qish — ochiq (public) manzildan.
 */

export const PRODUCT_IMAGES_BUCKET = "product-images";

export const IMAGE_TYPES = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type ImageContentType = keyof typeof IMAGE_TYPES;

/** `https://<loyiha>.supabase.co/storage/v1/object/public/product-images/` yoki `null`. */
export function getPublicImagePrefix(): string | null {
  const env = getSupabaseEnv();
  return env ? `${env.url}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/` : null;
}

/** Yuklangan rasm yo‘li: `uploads/2026/10/<uuid>.webp` — taxmin qilib bo‘lmaydi, to‘qnashmaydi. */
const UPLOAD_PATH = /^uploads\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;

/** Rasm manzili aynan shu loyiha papkasidagi biz yuklagan fayl ekanini tekshiradi. */
export function isOwnUploadedImage(url: string): boolean {
  const prefix = getPublicImagePrefix();
  return Boolean(prefix && url.startsWith(prefix) && UPLOAD_PATH.test(url.slice(prefix.length)));
}

function authHeaders(secretKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: secretKey };
  if (secretKey.startsWith("eyJ")) headers.Authorization = `Bearer ${secretKey}`;
  return headers;
}

export interface SignedUpload {
  /** Brauzer faylni shu manzilga PUT qiladi (bir martalik, qisqa muddatli). */
  uploadUrl: string;
  /** Yuklangandan keyin saytda ko‘rinadigan manzil. */
  publicUrl: string;
}

export async function createSignedImageUpload(contentType: ImageContentType): Promise<SignedUpload> {
  const env = getSupabaseEnv();
  if (!env) throw new DbError("Supabase sozlanmagan");

  const now = new Date();
  const path = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${IMAGE_TYPES[contentType]}`;

  let response: Response;
  try {
    response = await fetch(`${env.url}/storage/v1/object/upload/sign/${PRODUCT_IMAGES_BUCKET}/${path}`, {
      method: "POST",
      headers: { ...authHeaders(env.secretKey), "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    unstable_rethrow(error);
    throw new DbError(`Storage'ga ulanib bo‘lmadi: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new DbError(`Storage ${response.status}: ${detail.slice(0, 300)}`, response.status);
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url?.startsWith("/object/upload/sign/")) throw new DbError("Storage imzolangan havola qaytarmadi");
  return {
    uploadUrl: `${env.url}/storage/v1${data.url}`,
    publicUrl: `${getPublicImagePrefix()}${path}`,
  };
}

/** `db:check` va dashboard uchun: rasmlar papkasi yaratilganmi. */
export async function checkImageBucket(): Promise<boolean> {
  const env = getSupabaseEnv();
  if (!env) return false;
  try {
    const response = await fetch(`${env.url}/storage/v1/bucket/${PRODUCT_IMAGES_BUCKET}`, {
      headers: authHeaders(env.secretKey),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

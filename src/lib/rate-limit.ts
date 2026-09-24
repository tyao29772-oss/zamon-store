/**
 * Oddiy xotiradagi rate-limit — IP bo‘yicha. MVP uchun yetarli (bitta server instansi);
 * ko‘p instansiya bo‘lsa, keyin Redis kabi umumiy do‘konga ko‘chiriladi.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  /** Rad etilgan bo‘lsa, necha millisoniyadan keyin qayta urinish mumkinligi. */
  retryAfterMs?: number;
}

/** Xotira sizib ketmasligi uchun eskirgan yozuvlarni vaqti-vaqti bilan tozalaydi. */
function cleanup(now: number): void {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

/**
 * `key` (odatda `"<amal>:<ip>"`) uchun `windowMs` oynada `max` martagacha ruxsat beradi.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** So‘rovdan mijoz IP manzilini oladi (proksi orqasida `x-forwarded-for` birinchisi). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

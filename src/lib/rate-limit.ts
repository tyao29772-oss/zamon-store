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

/**
 * So‘rovdan mijoz IP manzilini oladi. Avval Netlify o‘zi qo‘yadigan (mijoz soxtalashtira
 * olmaydigan) sarlavha, bo‘lmasa proksi orqasidagi `x-forwarded-for` birinchisi.
 */
export function getClientIp(source: Request | Pick<Headers, "get">): string {
  // `instanceof` — Next'ning `headers()` obyekti ichida ham `headers` maydoni bor, `in` bilan ajratib bo‘lmaydi.
  const headers = source instanceof Request ? source.headers : source;
  const netlifyIp = headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

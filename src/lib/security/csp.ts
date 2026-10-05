/**
 * Content-Security-Policy: brauzerga «bu sahifa nimalarni yuklay oladi» ro‘yxati.
 *
 *  • Skriptlar: faqat shu so‘rov uchun yaratilgan `nonce` li skriptlar (Next.js o‘zi qo‘yadi)
 *    va ular yuklagan skriptlar (`strict-dynamic`). Begona yoki sahifaga suqilgan skript ishlamaydi.
 *  • Rasm va yuklash: faqat o‘z saytimiz va shu do‘konning Supabase loyihasi (admin rasm yuklaydi).
 *  • Plagin (`object`), begona `<base>`, begona saytga forma yuborish — taqiqlangan.
 *  • Uslublar: `next/image` va grafiklar `style="..."` atributini ishlatadi — shu sababli
 *    `'unsafe-inline'` faqat USLUBLAR uchun (skriptlar uchun emas). Uslub orqali kod ishga tushmaydi.
 */

export interface CspOptions {
  nonce: string;
  /** `https://<loyiha>.supabase.co` — rasm ko‘rsatish va admin rasm yuklashi uchun. */
  supabaseUrl?: string;
  /** Dev rejimda React xatolarni ko‘rsatish uchun `eval` ishlatadi (production’da kerak emas). */
  dev: boolean;
  /** HTTPS’da barcha so‘rovlar majburan https’ga o‘tkaziladi (lokal http sinovni buzmaslik uchun shart). */
  https: boolean;
  /** Kim bizni iframe’ga joylay oladi: do‘kon — `'self'`, admin — `'none'`. */
  frameAncestors: "'self'" | "'none'";
}

/** Faqat haqiqiy https manbaning `origin` qismi (yo‘l/so‘rovsiz) — CSP’ga begona narsa tushmasin. */
export function cspOrigin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" && /^[a-z0-9.-]+$/i.test(parsed.hostname) ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(options: CspOptions): string {
  const supabase = cspOrigin(options.supabaseUrl);
  const extra = supabase ? ` ${supabase}` : "";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${options.nonce}' 'strict-dynamic'${options.dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${extra}`,
    "font-src 'self'",
    `connect-src 'self'${extra}`,
    "media-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${options.frameAncestors}`,
    ...(options.https ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

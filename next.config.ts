import type { NextConfig } from "next";

/**
 * Admin panelda yuklangan mahsulot rasmlari Supabase Storage'da turadi. `next/image` faqat
 * AYNAN shu loyihaning `product-images` papkasidagi rasmlarni optimallashtiradi — boshqa
 * hech qanday tashqi manzil ruxsat etilmaydi.
 */
function supabaseImagePattern(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const raw = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return [];
    return [
      {
        protocol: "https",
        hostname: url.hostname,
        port: "",
        pathname: "/storage/v1/object/public/product-images/**",
        search: "",
      },
    ];
  } catch {
    return [];
  }
}

/**
 * Saytning to‘liq manzili (sitemap, canonical, JSON-LD, Telegram xabaridagi havolalar).
 * Aniq berilgan `NEXT_PUBLIC_SITE_URL` bo‘lsa — o‘sha; bo‘lmasa Netlify build paytida beradigan
 * asosiy manzil (`URL`, o‘z domeningiz ulansa — o‘sha domen). Aks holda sayt o‘zini
 * «localhost» deb bilib, Google va havolalar buzilardi.
 */
const siteUrl =
  (process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.URL?.trim() || "").replace(/\/+$/, "") ||
  // Faqat kompyuterdagi build uchun. Netlify’da `URL` doim bor — saytning brauzer kodiga «localhost» tushmaydi.
  "http://localhost:3000";

/**
 * Butun sayt uchun xavfsizlik sarlavhalari (admin sahifalar proxy'da yanada qattiqroq):
 *  • begona sayt bizni iframe'ga joylab, buyurtma formasini aldab bostira olmasin;
 *  • brauzer fayl turini «taxmin» qilmasin; har doim HTTPS;
 *  • referrer'da to‘liq manzil (masalan, qidiruv so‘zi) begona saytga ketmasin;
 *  • kerak bo‘lmagan qurilma ruxsatlari o‘chiq;
 *  • boshqa sayt ochgan oyna bizning oynamizni boshqara olmasin (COOP).
 * Sahifalarning to‘liq Content-Security-Policy’si (har so‘rovga yangi nonce) — `src/proxy.ts` da.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

/** API va matn fayllari (proxy’dan o‘tmaydi): hech narsa yuklamaydi, iframe’ga joylanmaydi. */
const resourceCsp = { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" };

const nextConfig: NextConfig = {
  env: siteUrl ? { NEXT_PUBLIC_SITE_URL: siteUrl } : {},
  poweredByHeader: false,
  // Ba’zi brauzer va botlar `/favicon.ico` ni o‘zi so‘raydi — do‘kon belgisini (`app/icon.tsx`) beramiz.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: [resourceCsp] },
      { source: "/.well-known/:path*", headers: [resourceCsp] },
      { source: "/robots.txt", headers: [resourceCsp] },
      { source: "/sitemap.xml", headers: [resourceCsp] },
    ];
  },
  images: {
    remotePatterns: supabaseImagePattern(),
  },
};

export default nextConfig;

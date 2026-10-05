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
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.URL?.trim() || "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  env: siteUrl ? { NEXT_PUBLIC_SITE_URL: siteUrl } : {},
  images: {
    remotePatterns: supabaseImagePattern(),
  },
};

export default nextConfig;

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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseImagePattern(),
  },
};

export default nextConfig;

import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { publicEnv } from "@/config/env";
import { siteConfig } from "@/config/site";
import { getStore } from "@/lib/repo/store";
import { Providers } from "@/providers/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

/** Sarlavhalar uchun nafis serif (faqat yirik matnda ishlatiladi). */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/** Nom, shior va tavsif admin «Sozlamalar»idan — do‘kon nomi o‘zgarsa, Google va brauzer sarlavhasi ham o‘zgaradi. */
export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: `${store.name} — ${store.tagline}`,
      template: `%s | ${store.name}`,
    },
    description: store.description,
    applicationName: store.name,
    openGraph: {
      type: "website",
      locale: "uz_UZ",
      siteName: store.name,
      title: store.name,
      description: store.description,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3ece3",
};

/**
 * Ildiz layout faqat `<html>`, shriftlar va provayderlarni beradi. Do‘kon ramkasi
 * (header/footer) `(store)/layout.tsx` da, admin panelniki — `admin/` ichida.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteConfig.language} className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

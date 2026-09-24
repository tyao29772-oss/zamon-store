import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { CatalogPanel } from "@/components/layout/CatalogPanel";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { publicEnv } from "@/config/env";
import { siteConfig } from "@/config/site";
import { getCategoryTree } from "@/lib/repo/categories";
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

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3ece3",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tree = await getCategoryTree();

  return (
    <html lang={siteConfig.language} className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0"
        >
          Asosiy mazmunga o‘tish
        </a>
        <Providers>
          <Header />
          {children}
          <Footer />
          <MobileNav />
          <CatalogPanel tree={tree} />
          <SearchOverlay />
        </Providers>
      </body>
    </html>
  );
}

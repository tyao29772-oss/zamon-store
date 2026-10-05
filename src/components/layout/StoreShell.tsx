import type { ReactNode } from "react";
import { CatalogPanel } from "@/components/layout/CatalogPanel";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { getCategoryTree } from "@/lib/repo/categories";
import { getStore } from "@/lib/repo/store";
import { StoreContactProvider } from "@/providers/StoreContactProvider";

/**
 * Do‘kon «ramkasi»: header, footer, pastki menyu, katalog paneli va qidiruv.
 * `(store)/layout.tsx` va ildizdagi `not-found.tsx` ishlatadi — admin panelda ko‘rinmaydi.
 */
export async function StoreShell({ children }: { children: ReactNode }) {
  const [tree, store] = await Promise.all([getCategoryTree(), getStore()]);

  return (
    <StoreContactProvider value={{ telegramUsername: store.telegramUsername }}>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Asosiy mazmunga o‘tish
      </a>
      <Header />
      {children}
      <Footer />
      <MobileNav />
      <CatalogPanel tree={tree} />
      <SearchOverlay />
    </StoreContactProvider>
  );
}

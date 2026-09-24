import Link from "next/link";
import { Send } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CatalogTrigger } from "@/components/layout/CatalogTrigger";
import { FavoritesLink } from "@/components/favorites/FavoritesLink";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { publicEnv } from "@/config/env";
import { createTelegramLink } from "@/lib/telegram";
import { getRootCategories } from "@/lib/repo/categories";

export async function Header() {
  const roots = await getRootCategories();

  const nav = [
    ...roots.map((category) => ({ label: category.name, href: category.href })),
    { label: "Aksiyalar", href: "/aksiyalar" },
    { label: "Magazin haqida", href: "/magazin-haqida" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-page/80 backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Logo />
          <CatalogTrigger />
        </div>

        <nav aria-label="Asosiy menyu" className="hidden items-center gap-1 xl:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <SearchTrigger />
          <FavoritesLink className="hidden lg:inline-flex" />
          <a
            href={createTelegramLink(publicEnv.telegramUsername)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            <Send className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Telegram</span>
            <span className="sr-only sm:hidden">Telegram</span>
          </a>
        </div>
      </div>
    </header>
  );
}

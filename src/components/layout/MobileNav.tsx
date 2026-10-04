"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, MessageCircle, Search, type LucideIcon } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useUI } from "@/providers/UIProvider";

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

const LINKS = {
  home: { label: "Bosh sahifa", href: "/", icon: House, match: (p) => p === "/" },
  favorites: {
    label: "Sevimlilar",
    href: "/sevimlilar",
    icon: Heart,
    match: (p) => p.startsWith("/sevimlilar"),
  },
  contact: { label: "Aloqa", href: "/aloqa", icon: MessageCircle, match: (p) => p.startsWith("/aloqa") },
} satisfies Record<string, NavLink>;

const ITEM =
  "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors";

/** Mobil pastki navigatsiya: Bosh sahifa · Kategoriyalar · Qidiruv · Sevimlilar · Aloqa. */
export function MobileNav() {
  const pathname = usePathname();
  const { catalogOpen, toggleCatalog, searchOpen, toggleSearch } = useUI();
  const { count } = useFavorites();
  const searchActive = searchOpen || pathname.startsWith("/qidiruv");

  const renderLink = (link: NavLink, badge?: number) => {
    const active = link.match(pathname);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        aria-label={badge ? `${link.label}, ${badge} ta mahsulot` : undefined}
        className={`${ITEM} ${active ? "text-ink" : "text-ink-muted"}`}
      >
        <span className="relative">
          <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
          {badge ? (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-sale px-1 text-[9px] font-bold leading-4 text-white"
            >
              {badge > 9 ? "9+" : badge}
            </span>
          ) : null}
        </span>
        {link.label}
        {active && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-ink" />}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Pastki menyu"
      data-mobile-nav=""
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line/80 bg-page/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-xl">
        {renderLink(LINKS.home)}
        <button
          type="button"
          onClick={toggleCatalog}
          aria-expanded={catalogOpen}
          aria-haspopup="dialog"
          className={`${ITEM} ${catalogOpen ? "text-ink" : "text-ink-muted"}`}
        >
          <LayoutGrid className="size-[22px]" strokeWidth={catalogOpen ? 2.2 : 1.7} aria-hidden="true" />
          Kategoriyalar
        </button>
        <button
          type="button"
          onClick={toggleSearch}
          aria-expanded={searchOpen}
          aria-haspopup="dialog"
          className={`${ITEM} ${searchActive ? "text-ink" : "text-ink-muted"}`}
        >
          <Search className="size-[22px]" strokeWidth={searchActive ? 2.2 : 1.7} aria-hidden="true" />
          Qidiruv
        </button>
        {renderLink(LINKS.favorites, count)}
        {renderLink(LINKS.contact)}
      </div>
    </nav>
  );
}

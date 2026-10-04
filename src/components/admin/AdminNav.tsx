"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, type LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Bo‘lim hali yozilmagan bo‘lsa — havola emas, «tez kunda» belgisi bilan ko‘rinadi. */
  ready: boolean;
}

const ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, ready: true },
  { label: "Buyurtmalar", href: "/admin/buyurtmalar", icon: ShoppingBag, ready: false },
  { label: "Mahsulotlar", href: "/admin/mahsulotlar", icon: Package, ready: true },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin menyu" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map(({ label, href, icon: Icon, ready }) => {
        const base = "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium";
        if (!ready) {
          return (
            <span key={href} aria-disabled="true" className={`${base} cursor-not-allowed text-white/35`}>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
              <span className="ml-auto whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                tez kunda
              </span>
            </span>
          );
        }
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${base} transition-colors ${
              active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

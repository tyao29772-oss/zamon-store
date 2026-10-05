import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoMark } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";
import { requireAdmin } from "@/lib/admin/auth";
import { countNewOrders } from "@/lib/repo/orders";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const newOrders = await countNewOrders();

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[248px_1fr]">
      <aside className="bg-dark px-4 py-4 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:py-6">
        <div className="flex items-center justify-between gap-3 lg:mb-8 lg:px-2">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark size={36} />
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{siteConfig.name}</span>
              <span className="block text-xs text-white/50">Admin panel</span>
            </span>
          </Link>
          <form action={logoutAction} className="lg:hidden">
            <button type="submit" className="rounded-xl p-2 text-white/70 hover:bg-white/5 hover:text-white">
              <LogOut className="size-5" aria-hidden="true" />
              <span className="sr-only">Chiqish</span>
            </button>
          </form>
        </div>

        <div className="mt-4 lg:mt-0 lg:flex-1">
          <AdminNav badges={{ "/admin/buyurtmalar": newOrders }} />
        </div>

        <div className="hidden space-y-1 border-t border-dark-line pt-4 lg:block">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Saytni ochish
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Chiqish
            </button>
          </form>
        </div>
      </aside>

      {/* pb-24: pastki o‘ng burchakdagi Netlify belgisi oxirgi tugmalarni (sahifalash) to‘smasin */}
      <main id="main" className="min-w-0 px-4 pb-24 pt-6 md:px-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}

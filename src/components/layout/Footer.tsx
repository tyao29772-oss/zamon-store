import Link from "next/link";
import { Clock, MapPin, Phone, Send } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";
import { formatUzPhone } from "@/lib/phone";
import { getRootCategories } from "@/lib/repo/categories";
import { getStore } from "@/lib/repo/store";
import { createTelegramLink } from "@/lib/telegram";

const INFO_LINKS = [
  { label: "Magazin haqida", href: "/magazin-haqida" },
  { label: "Aloqa", href: "/aloqa" },
  { label: "Kafolat shartlari", href: "/kafolat" },
  { label: "Yetkazib berish shartlari", href: "/yetkazib-berish" },
  { label: "Maxfiylik siyosati", href: "/maxfiylik" },
];

const LINK = "text-sm text-white/70 transition-colors hover:text-white";

export async function Footer() {
  const [store, roots] = await Promise.all([getStore(), getRootCategories()]);

  return (
    <footer className="grain relative mt-20 overflow-hidden bg-dark text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(166,124,85,0.28),transparent_65%)]"
      />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="max-w-sm">
          <Logo tone="light" />
          <p className="mt-5 text-sm leading-relaxed text-white/65">{store.description}</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Katalog</h2>
          <ul className="mt-4 space-y-3">
            {roots.map((category) => (
              <li key={category.id}>
                <Link href={category.href} className={LINK}>
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/aksiyalar" className={LINK}>
                Aksiyalar
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Ma’lumot</h2>
          <ul className="mt-4 space-y-3">
            {INFO_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={LINK}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Aloqa</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <a href={`tel:${store.phone}`} className="transition-colors hover:text-white">
                {formatUzPhone(store.phone)}
              </a>
            </li>
            <li className="flex gap-3">
              <Send className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <a
                href={createTelegramLink(store.telegramUsername)}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                @{store.telegramUsername}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{store.address}</span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                {store.workingHours.map((item) => (
                  <span key={item.label} className="block">
                    {item.label}: {item.hours}
                  </span>
                ))}
              </span>
            </li>
            <li className="pl-7">
              <a
                href={store.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-dark-line">
        <div className="container-page flex flex-col gap-2 pb-[calc(96px+var(--sticky-bottom-bar))] pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between lg:pb-5">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Barcha huquqlar himoyalangan.
          </p>
          <p>Narxlar so‘mda. Mavjudlik Telegram orqali tasdiqlanadi.</p>
        </div>
      </div>
    </footer>
  );
}
